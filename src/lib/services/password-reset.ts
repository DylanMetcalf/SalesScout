import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, t } from "@/lib/db";

const RESET_HOURS = 24;
const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Issues a single-use reset token. Only its hash is stored. */
export function createResetToken(userId: string): string {
  const token = randomBytes(32).toString("base64url");
  db.insert(t.passwordResets).values({ id: hash(token), userId, expiresAt: new Date(Date.now() + RESET_HOURS * 3_600_000) }).run();
  return token;
}

/** The user a token belongs to, if it's still usable. Doesn't consume it. */
export function peekResetToken(token: string): string | null {
  const row = db
    .select({ userId: t.passwordResets.userId })
    .from(t.passwordResets)
    .where(and(eq(t.passwordResets.id, hash(token)), isNull(t.passwordResets.usedAt), gt(t.passwordResets.expiresAt, new Date())))
    .get();
  return row?.userId ?? null;
}

/** Atomically marks a token used. Returns the user id, or null if it was already used or expired. */
export function consumeResetToken(token: string): string | null {
  const userId = peekResetToken(token);
  if (!userId) return null;
  const res = db.update(t.passwordResets).set({ usedAt: new Date() }).where(and(eq(t.passwordResets.id, hash(token)), isNull(t.passwordResets.usedAt))).run();
  return res.changes === 1 ? userId : null;
}
