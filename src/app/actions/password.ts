"use server";

import { eq } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { rateLimit } from "@/lib/security/rate-limit";
import { normaliseInviteCode } from "@/lib/services/invites";
import { attempt } from "./result";

/** Change your own password. The current one may be the access code you signed up with. */
export async function changePasswordAction(current: string, next: string) {
  return attempt(async () => {
    const user = await getSessionUser();
    if (!user) throw new Error("Please sign in again.");
    if (!rateLimit(`password:${user.id}`, 10, 900_000)) throw new Error("Too many attempts. Wait a few minutes and try again.");
    const ok = (await verifyPassword(current, user.passwordHash)) || (await verifyPassword(normaliseInviteCode(current), user.passwordHash));
    if (!ok) throw new Error("Your current password isn't right.");
    if (next.length < 8 || next.length > 200) throw new Error("Use at least 8 characters for the new password.");
    db.update(t.users).set({ passwordHash: await hashPassword(next) }).where(eq(t.users.id, user.id)).run();
  });
}
