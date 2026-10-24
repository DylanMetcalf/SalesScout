"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import * as z from "zod/v4";
import { db, t } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/security/rate-limit";
import { createAccountWithUser } from "@/lib/services/accounts";
import { consumeInvite, findUsableInvite, inviteGrant, normaliseInviteCode } from "@/lib/services/invites";
import { accessBlock, accessBlockMessage } from "@/lib/access";
import { SITE } from "@/content/site";
import { consumeResetToken } from "@/lib/services/password-reset";
import { adminEmails } from "@/lib/admin";
import { clientIp } from "@/lib/security/client-ip";

export type AuthState = { error?: string; fields?: Record<string, string> } | undefined;

const clientKey = clientIp;

const SignupSchema = z.object({
  name: z.string().trim().min(1, "Tell us your name").max(80),
  email: z.email("That email doesn't look right").transform((e) => e.toLowerCase()),
  password: z.string().min(8, "Use at least 8 characters").max(200),
});

/** Sign-ups are open unless ALLOW_SIGNUPS=false. A valid invite code always works. */
function signupsOpen() {
  return process.env.ALLOW_SIGNUPS !== "false";
}

export async function signup(_: AuthState, form: FormData): Promise<AuthState> {
  const raw = {
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? "").trim(),
    password: String(form.get("password") ?? ""),
    invite: String(form.get("invite") ?? "").trim(),
  };
  if (!rateLimit(`signup:${await clientKey()}`, 10, 3_600_000)) return { error: "Too many attempts. Please try again later.", fields: raw };
  const invite = raw.invite ? findUsableInvite(raw.invite, raw.email) : null;
  if (raw.invite && !invite) return { error: "That invite code isn't valid, has expired or has already been used.", fields: raw };
  const isAdmin = adminEmails().includes(raw.email.toLowerCase());
  if (!signupsOpen() && !invite && !isAdmin) return { error: "Sign-ups are by invitation. Enter the invite code you were given.", fields: raw };
  const parsed = SignupSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields: raw };
  const exists = db.select({ id: t.users.id }).from(t.users).where(eq(t.users.email, parsed.data.email)).get();
  if (exists) return { error: "There's already an account with that email. Try signing in.", fields: raw };
  if (invite && !consumeInvite(invite.id)) return { error: "That invite code has just been used up. Ask for a new one.", fields: raw };
  const { userId } = await createAccountWithUser({
    ...parsed.data,
    ...(invite && inviteGrant(invite)),
  });
  await createSession(userId);
  redirect("/onboarding");
}

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const ip = await clientKey();
  // Per email (guessing one password) and per address (trying many emails or access codes).
  if (!rateLimit(`login:${ip}:${email}`, 8, 900_000) || !rateLimit(`login-ip:${ip}`, 40, 900_000)) return { error: "Too many attempts. Wait a few minutes and try again.", fields: { email } };
  const user = db.select().from(t.users).where(eq(t.users.email, email)).get();

  // First sign-in with an access code: the code is the password and creates the account.
  if (!user) {
    const invite = findUsableInvite(password, email);
    if (!invite || !z.email().safeParse(email).success) return { error: "That email and password don't match.", fields: { email } };
    if (!consumeInvite(invite.id)) return { error: "That access code has just been used up. Ask for a new one.", fields: { email } };
    const name = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 80) || "New user";
    const { userId } = await createAccountWithUser({ name, email, password: normaliseInviteCode(password), ...inviteGrant(invite) });
    await createSession(userId);
    redirect("/onboarding");
  }

  if (!(await verifyPassword(password, user.passwordHash)) && !(await verifyPassword(normaliseInviteCode(password), user.passwordHash))) {
    return { error: "That email and password don't match.", fields: { email } };
  }
  const block = accessBlock(user.accountId);
  if (block) return { error: accessBlockMessage(block, SITE.contactEmail), fields: { email } };
  await createSession(user.id);
  redirect("/home");
}

export async function resetPassword(_: AuthState, form: FormData): Promise<AuthState> {
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  if (!rateLimit(`reset:${await clientKey()}`, 10, 900_000)) return { error: "Too many attempts. Wait a few minutes and try again." };
  const parsed = SignupSchema.shape.password.safeParse(password);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const userId = consumeResetToken(token);
  if (!userId) return { error: "This reset link has expired or was already used. Ask your administrator for a new one." };
  const passwordHash = await hashPassword(parsed.data);
  db.transaction((tx) => {
    tx.update(t.users).set({ passwordHash }).where(eq(t.users.id, userId)).run();
    // Sign out everywhere else: whoever had the old password shouldn't stay signed in.
    tx.delete(t.sessions).where(eq(t.sessions.userId, userId)).run();
  });
  await createSession(userId);
  redirect("/home");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
