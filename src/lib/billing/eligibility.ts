import "server-only";
import { asc, eq } from "drizzle-orm";
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
  return (!policy.email || Boolean(owner.emailVerifiedAt)) && (!policy.phone || Boolean(owner.phoneVerifiedAt));
}
