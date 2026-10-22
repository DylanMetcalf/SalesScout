import "server-only";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { newId } from "@/lib/ids";
import { enquiryEmailsEnabled, sendEmail } from "@/lib/notify";

/**
 * Email and phone verification. Email codes are ours (6 digits, 15 minutes,
 * 5 attempts, only a hash stored and cleared once used). Phone codes go through
 * Twilio Verify, which holds the code itself; we only record the outcome.
 * Phone needs TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_VERIFY_SERVICE_SID.
 */
type User = typeof t.users.$inferSelect;

const hash = (userId: string, code: string) => createHash("sha256").update(`${userId}:${code}`).digest("hex");

export function phoneVerificationAvailable() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID);
}

/** South African numbers in local format (0…) become +27…; anything else must already be international. */
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  const intl = digits.startsWith("+") ? digits : digits.startsWith("0") ? `+27${digits.slice(1)}` : `+${digits}`;
  return /^\+[1-9]\d{7,14}$/.test(intl) ? intl : null;
}

export async function sendEmailCode(user: User) {
  if (!enquiryEmailsEnabled()) throw new Error("Email verification isn't available right now. Please try again later.");
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  db.insert(t.verificationCodes).values({ id: newId("vc"), userId: user.id, channel: "email", target: user.email, codeHash: hash(user.id, code), expiresAt: new Date(Date.now() + 15 * 60_000) }).run();
  await sendEmail({
    to: user.email,
    subject: `${code} is your Sales Scout code`,
    text: `Your Sales Scout verification code is ${code}.\n\nIt expires in 15 minutes. If you didn't ask for it, you can ignore this email.`,
  });
}

export function checkEmailCode(user: User, code: string): boolean {
  const row = db
    .select()
    .from(t.verificationCodes)
    .where(and(eq(t.verificationCodes.userId, user.id), eq(t.verificationCodes.channel, "email"), isNull(t.verificationCodes.consumedAt)))
    .orderBy(desc(t.verificationCodes.createdAt))
    .get();
  if (!row || !row.codeHash || row.expiresAt.getTime() < Date.now() || row.attempts >= 5) return false;
  db.update(t.verificationCodes).set({ attempts: row.attempts + 1 }).where(eq(t.verificationCodes.id, row.id)).run();
  const a = Buffer.from(row.codeHash);
  const b = Buffer.from(hash(user.id, code.trim()));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  db.update(t.verificationCodes).set({ consumedAt: new Date(), codeHash: null }).where(eq(t.verificationCodes.id, row.id)).run();
  db.update(t.users).set({ emailVerifiedAt: new Date() }).where(eq(t.users.id, user.id)).run();
  return true;
}

async function twilio(path: string, form: Record<string, string>) {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const res = await fetch(`https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/${path}`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(form),
    signal: AbortSignal.timeout(10_000),
  });
  const json = (await res.json().catch(() => ({}))) as { status?: string; message?: string };
  if (!res.ok) throw new Error(json.message ?? `Verification service error (${res.status})`);
  return json;
}

export async function sendPhoneCode(user: User, rawPhone: string) {
  if (!phoneVerificationAvailable()) throw new Error("Phone verification isn't available right now.");
  const phone = normalisePhone(rawPhone);
  if (!phone) throw new Error("That number doesn't look right. Include the country code, e.g. +27 82 123 4567.");
  await twilio("Verifications", { To: phone, Channel: "sms" });
  db.insert(t.verificationCodes).values({ id: newId("vc"), userId: user.id, channel: "phone", target: phone, expiresAt: new Date(Date.now() + 10 * 60_000) }).run();
  return phone;
}

export async function checkPhoneCode(user: User, code: string): Promise<boolean> {
  const row = db
    .select()
    .from(t.verificationCodes)
    .where(and(eq(t.verificationCodes.userId, user.id), eq(t.verificationCodes.channel, "phone"), isNull(t.verificationCodes.consumedAt)))
    .orderBy(desc(t.verificationCodes.createdAt))
    .get();
  if (!row || row.expiresAt.getTime() < Date.now() || row.attempts >= 5) return false;
  db.update(t.verificationCodes).set({ attempts: row.attempts + 1 }).where(eq(t.verificationCodes.id, row.id)).run();
  const r = await twilio("VerificationCheck", { To: row.target, Code: code.trim() });
  if (r.status !== "approved") return false;
  db.update(t.verificationCodes).set({ consumedAt: new Date() }).where(eq(t.verificationCodes.id, row.id)).run();
  db.update(t.users).set({ phone: row.target, phoneVerifiedAt: new Date() }).where(eq(t.users.id, user.id)).run();
  return true;
}
