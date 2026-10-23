"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import * as z from "zod/v4";
import { db, t } from "@/lib/db";
import { assertAdmin, isAdminAccount } from "@/lib/admin";
import { createInvite } from "@/lib/services/invites";
import { createResetToken } from "@/lib/services/password-reset";
import { adjustCredits } from "@/lib/billing/credits";
import { PLANS } from "@/lib/billing/plans";
import { setSwitch, type SwitchKey } from "@/lib/settings";
import { AGENTS } from "@/lib/ai/models";
import { RESOLUTIONS } from "@/lib/feedback-reasons";
import { attempt } from "./result";

function check<S extends z.ZodType>(schema: S, input: unknown): z.infer<S> {
  const r = schema.safeParse(input);
  if (!r.success) throw new Error(r.error.issues[0].message);
  return r.data;
}

/** Allowance is entered in millions of tokens; blank means no cap. */
const Allowance = z
  .union([z.literal(""), z.coerce.number().min(0).max(10_000)])
  .transform((m) => (m === "" ? null : Math.round(m * 1_000_000)));

const AccessSchema = z.object({
  accountId: z.string().min(1),
  aiAccess: z.enum(["server", "own_key"]),
  allowance: Allowance,
});

export async function setAccountAccessAction(input: { accountId: string; aiAccess: string; allowance: string }) {
  return attempt(async () => {
    await assertAdmin();
    const v = check(AccessSchema, input);
    const res = db.update(t.accounts).set({ aiAccess: v.aiAccess, aiMonthlyTokenLimit: v.allowance }).where(eq(t.accounts.id, v.accountId)).run();
    if (res.changes !== 1) throw new Error("That account no longer exists.");
    revalidatePath("/admin");
  });
}

const InviteSchema = z.object({
  label: z.string().trim().min(1, "Give the invite a name, e.g. who it's for").max(80),
  aiAccess: z.enum(["server", "own_key"]),
  allowance: Allowance,
  maxUses: z.coerce.number().int().min(1).max(100),
  expiresInDays: z.union([z.literal(""), z.coerce.number().int().min(1).max(365)]),
  email: z.union([z.literal(""), z.email("That email doesn't look right")]).transform((e) => (e ? e.toLowerCase() : null)),
  accessDays: z.union([z.literal(""), z.coerce.number().int().min(1).max(3650)]).transform((d) => (d === "" ? null : d)),
  plan: z.union([z.literal(""), z.enum(["scout", "growth", "scale"])]).optional().transform((p) => p || null),
});

export async function createInviteAction(input: Record<string, string>) {
  return attempt(async () => {
    await assertAdmin();
    const v = check(InviteSchema, input);
    const code = createInvite({
      label: v.label,
      aiAccess: v.aiAccess,
      aiMonthlyTokenLimit: v.allowance,
      maxUses: v.maxUses,
      expiresAt: v.expiresInDays === "" ? null : new Date(Date.now() + v.expiresInDays * 86_400_000),
      email: v.email,
      accessDays: v.accessDays,
      plan: v.plan ?? null,
    });
    revalidatePath("/admin");
    return code;
  });
}

export async function revokeInviteAction(id: string) {
  return attempt(async () => {
    await assertAdmin();
    db.update(t.invites).set({ revokedAt: new Date() }).where(eq(t.invites.id, id)).run();
    revalidatePath("/admin");
  });
}

export async function setEnquiryStatusAction(id: string, status: string) {
  return attempt(async () => {
    await assertAdmin();
    const s = check(z.enum(["new", "contacted", "closed"]), status);
    db.update(t.enquiries).set({ status: s }).where(eq(t.enquiries.id, id)).run();
    revalidatePath("/admin");
  });
}

/** A one-time link the admin sends to someone who's locked out. Valid 24 hours. */
export async function createResetLinkAction(userId: string) {
  return attempt(async () => {
    await assertAdmin();
    const user = db.select({ id: t.users.id }).from(t.users).where(eq(t.users.id, userId)).get();
    if (!user) throw new Error("That user no longer exists.");
    return `/reset-password?token=${createResetToken(user.id)}`;
  });
}

/** Pause locks an account out at once (signed-in sessions end on their next click). */
export async function setAccountPausedAction(accountId: string, paused: boolean) {
  return attempt(async () => {
    await assertAdmin();
    if (paused && isAdminAccount(accountId)) throw new Error("Administrators can't be paused.");
    db.update(t.accounts).set({ suspendedAt: paused ? new Date() : null }).where(eq(t.accounts.id, accountId)).run();
    if (paused) {
      const users = db.select({ id: t.users.id }).from(t.users).where(eq(t.users.accountId, accountId)).all();
      for (const u of users) db.delete(t.sessions).where(eq(t.sessions.userId, u.id)).run();
    }
    revalidatePath("/admin");
  });
}

/** Paid-up-to date ("YYYY-MM-DD", end of that day), or "" for no end date. */
export async function setAccessUntilAction(accountId: string, until: string) {
  return attempt(async () => {
    await assertAdmin();
    const date = until ? new Date(`${check(z.iso.date("Pick a date"), until)}T23:59:59`) : null;
    db.update(t.accounts).set({ accessUntil: date }).where(eq(t.accounts.id, accountId)).run();
    revalidatePath("/admin");
  });
}

/** Manual billing: put an account on a plan you've arranged with them (billed outside Paystack). */
export async function setPlanAction(accountId: string, plan: string) {
  return attempt(async () => {
    await assertAdmin();
    const id = check(z.enum(Object.keys(PLANS) as [string, ...string[]]), plan);
    const acc = db.select().from(t.accounts).where(eq(t.accounts.id, accountId)).get();
    if (!acc) throw new Error("That account no longer exists.");
    if (acc.planSource === "paystack" && ["active", "past_due"].includes(acc.subscriptionStatus)) throw new Error("This account pays through Paystack. Change its plan there, or cancel the subscription first.");
    db.update(t.accounts).set({ plan: id, planSource: id === "free" ? "none" : "manual" }).where(eq(t.accounts.id, accountId)).run();
    revalidatePath("/admin");
  });
}

/** Bonus or corrective credits (negative to remove). Recorded in the ledger with your reason. */
export async function adjustCreditsAction(accountId: string, amount: number, reason: string) {
  return attempt(async () => {
    const admin = await assertAdmin();
    const n = check(z.number().int().min(-500).max(500).refine((x) => x !== 0, "Enter a number other than 0"), amount);
    adjustCredits(accountId, n, `${reason.trim().slice(0, 200) || "Adjustment"} (by ${admin.email})`);
    revalidatePath("/admin");
  });
}

/** Kill switches: take effect immediately, before the next paid AI call. */
export async function setSwitchAction(key: string, on: boolean, reason: string) {
  return attempt(async () => {
    const admin = await assertAdmin();
    const k = check(z.enum(["ai_paused", "discovery_paused", ...Object.keys(AGENTS).map((a) => `agent_paused:${a}`)]), key) as SwitchKey;
    setSwitch(k, { on, reason: reason.trim().slice(0, 200) || undefined }, admin.email);
    console.warn(`[ops] ${k} ${on ? "ON" : "off"} by ${admin.email}${reason ? `: ${reason}` : ""}`);
    revalidatePath("/admin/operations");
  });
}

/** Triage a reported problem. Recorded with who resolved it and when. */
export async function resolveReportAction(id: string, resolution: string) {
  return attempt(async () => {
    const admin = await assertAdmin();
    const r = check(z.enum(Object.keys(RESOLUTIONS) as [string, ...string[]]), resolution) as keyof typeof RESOLUTIONS;
    const res = db.update(t.feedback).set({ resolution: r, resolvedBy: admin.email, resolvedAt: new Date() }).where(and(eq(t.feedback.id, id), eq(t.feedback.kind, "correction"), isNull(t.feedback.resolvedAt))).run();
    if (res.changes !== 1) throw new Error("That report was already resolved or no longer exists.");
    revalidatePath("/admin/operations");
  });
}
