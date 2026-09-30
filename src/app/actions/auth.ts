"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import * as z from "zod/v4";
import { db, t } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/security/rate-limit";
import { createAccountWithUser } from "@/lib/services/accounts";

export type AuthState = { error?: string; fields?: Record<string, string> } | undefined;

async function clientKey() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

const SignupSchema = z.object({
  name: z.string().trim().min(1, "Tell us your name").max(80),
  email: z.email("That email doesn't look right").transform((e) => e.toLowerCase()),
  password: z.string().min(8, "Use at least 8 characters").max(200),
});

/** Sign-ups are open unless ALLOW_SIGNUPS=false. Close them on a hosted instance once your account exists. */
function signupsOpen() {
  return process.env.ALLOW_SIGNUPS !== "false";
}

export async function signup(_: AuthState, form: FormData): Promise<AuthState> {
  if (!signupsOpen()) return { error: "Sign-ups are closed on this installation. Ask the owner for access." };
  const raw = { name: String(form.get("name") ?? ""), email: String(form.get("email") ?? "").trim(), password: String(form.get("password") ?? "") };
  if (!rateLimit(`signup:${await clientKey()}`, 10, 3_600_000)) return { error: "Too many attempts. Please try again later.", fields: raw };
  const parsed = SignupSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields: raw };
  const exists = db.select({ id: t.users.id }).from(t.users).where(eq(t.users.email, parsed.data.email)).get();
  if (exists) return { error: "There's already an account with that email. Try signing in.", fields: raw };
  const { userId } = await createAccountWithUser(parsed.data);
  await createSession(userId);
  redirect("/onboarding");
}

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!rateLimit(`login:${await clientKey()}:${email}`, 8, 900_000)) return { error: "Too many attempts. Wait a few minutes and try again.", fields: { email } };
  const user = db.select().from(t.users).where(eq(t.users.email, email)).get();
  if (!user || !(await verifyPassword(password, user.passwordHash))) return { error: "That email and password don't match.", fields: { email } };
  await createSession(user.id);
  redirect("/home");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
