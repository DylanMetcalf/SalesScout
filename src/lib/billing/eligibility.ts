import "server-only";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import { db, t } from "@/lib/db";

/** Which verifications new accounts need before receiving free credits (set on the server). */
export function verificationPolicy() {
  return {
    email: process.env.REQUIRE_EMAIL_VERIFICATION === "true",
    phone: process.env.REQUIRE_PHONE_VERIFICATION === "true",
  };
}

/** The one-time free credits are only granted once the account owner has completed required verification. */
export function freeEligible(accountId: string): boolean {
  const policy = verificationPolicy();
  if (!policy.email && !policy.phone) return true;
  const owner = db.select().from(t.users).where(eq(t.users.accountId, accountId)).orderBy(asc(t.users.createdAt)).limit(1).get();
  if (!owner) return false;
  if (policy.email && !owner.emailVerifiedAt) return false;
  if (policy.phone) {
    if (!owner.phoneVerifiedAt || !owner.phone) return false;
    // One free allowance per verified phone number: an earlier account with the same number already had it.
    const earlier = db.select({ id: t.users.id, at: t.users.phoneVerifiedAt }).from(t.users).where(and(eq(t.users.phone, owner.phone), isNotNull(t.users.phoneVerifiedAt))).all();
    if (earlier.some((u) => u.id !== owner.id && u.at!.getTime() < owner.phoneVerifiedAt!.getTime())) return false;
  }
  return true;
}
