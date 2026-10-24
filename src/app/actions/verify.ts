"use server";

import { eq } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/security/rate-limit";
import { ensureGrants } from "@/lib/billing/credits";
import { freeEligible } from "@/lib/billing/eligibility";
import { checkEmailCode, checkPhoneCode, sendEmailCode, sendPhoneCode } from "@/lib/services/verify";
import { attempt } from "./result";
import { clientIp } from "@/lib/security/client-ip";

async function me(kind: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Please sign in again.");
  const ip = await clientIp();
  if (!rateLimit(`verify-${kind}:${user.id}`, 6, 3_600_000) || !rateLimit(`verify-ip:${ip}`, 20, 3_600_000)) {
    throw new Error("Too many attempts. Please wait a while and try again.");
  }
  return user;
}

function grantIfEligible(accountId: string) {
  const acc = db.select().from(t.accounts).where(eq(t.accounts.id, accountId)).get();
  if (acc) ensureGrants(acc, { freeEligible: freeEligible(accountId) });
}

export async function sendEmailCodeAction() {
  return attempt(async () => sendEmailCode(await me("email-send")));
}

export async function checkEmailCodeAction(code: string) {
  return attempt(async () => {
    const user = await me("email-check");
    if (!checkEmailCode(user, String(code))) throw new Error("That code isn't right or has expired. Request a new one.");
    grantIfEligible(user.accountId);
  });
}

export async function sendPhoneCodeAction(phone: string) {
  return attempt(async () => sendPhoneCode(await me("phone-send"), String(phone)));
}

export async function checkPhoneCodeAction(code: string) {
  return attempt(async () => {
    const user = await me("phone-check");
    if (!(await checkPhoneCode(user, String(code)))) throw new Error("That code isn't right or has expired. Request a new one.");
    grantIfEligible(user.accountId);
  });
}
