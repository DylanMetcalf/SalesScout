import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { newId } from "@/lib/ids";
import { isAdminAccount } from "@/lib/access";
import { planOf, type Plan } from "./plans";

/**
 * Server-side entitlements and the credit ledger. The browser never decides a
 * balance: everything here runs inside SQLite transactions (serialised in this
 * single-instance app), and every ledger row has a unique idempotency key, so a
 * retried or double-clicked action can't grant or charge twice.
 */

export class OutOfCreditsError extends Error {
  constructor() {
    super("You've used all your prospect unlocks. Upgrade your plan to keep more prospects.");
  }
}
export class LimitReachedError extends Error {}

type Account = typeof t.accounts.$inferSelect;

/** Gmail-style aliases (dots, +tags) map to one mailbox, so they share one free grant. */
export function normaliseEmail(email: string): string {
  const [local, domain] = email.trim().toLowerCase().split("@");
  if (!domain) return email.trim().toLowerCase();
  const base = local.split("+")[0];
  return `${["gmail.com", "googlemail.com"].includes(domain) ? base.replace(/\./g, "") : base}@${domain === "googlemail.com" ? "gmail.com" : domain}`;
}

/** Which plan's limits apply right now, after payment status and access dates. */
export function entitlement(acc: Account): { plan: Plan; paid: boolean; unlimited: boolean; renewsAt: Date | null } {
  if (isAdminAccount(acc.id)) return { plan: planOf("scale"), paid: true, unlimited: true, renewsAt: null };
  const now = Date.now();
  let paid = false;
  if (acc.plan !== "free") {
    if (acc.planSource === "manual") paid = !acc.accessUntil || acc.accessUntil.getTime() > now;
    else if (acc.planSource === "paystack") {
      paid =
        acc.subscriptionStatus === "active" ||
        acc.subscriptionStatus === "past_due" || // Paystack is still retrying the card
        (acc.subscriptionStatus === "canceled" && Boolean(acc.currentPeriodEnd && acc.currentPeriodEnd.getTime() > now));
    }
  }
  const renewsAt = paid ? (acc.planSource === "manual" ? acc.accessUntil : acc.currentPeriodEnd) : null;
  return { plan: paid ? planOf(acc.plan) : planOf("free"), paid, unlimited: false, renewsAt };
}

/** Plan credits belong to a billing period: the subscription period end, else the calendar month. */
function periodKey(acc: Account, paid: boolean): string {
  if (paid && acc.planSource === "paystack" && acc.currentPeriodEnd) return `ends-${acc.currentPeriodEnd.toISOString().slice(0, 10)}`;
  return new Date().toISOString().slice(0, 7);
}

function ownerEmail(accountId: string): string | null {
  return db.select({ email: t.users.email }).from(t.users).where(eq(t.users.accountId, accountId)).orderBy(t.users.createdAt).limit(1).get()?.email ?? null;
}

/** Grants what's due (idempotently): the one-time free credits, and this period's plan credits. */
export function ensureGrants(acc: Account, opts: { freeEligible: boolean }) {
  const { plan, paid } = entitlement(acc);
  const insert = (bucket: "free" | "plan", amount: number, key: string, reason: string, period: string | null) =>
    db.insert(t.creditLedger).values({ id: newId("cl"), accountId: acc.id, bucket, kind: "grant", amount, period, reason, idempotencyKey: key }).onConflictDoNothing().run();
  const email = ownerEmail(acc.id);
  if (opts.freeEligible && email && planOf("free").oneTimeCredits > 0) {
    // Keyed by the normalised email, not the account: a re-registration with the same mailbox gets nothing new.
    insert("free", planOf("free").oneTimeCredits, `free:${normaliseEmail(email)}`, "One-time free prospect unlocks", null);
  }
  if (paid && plan.monthlyCredits > 0) {
    const period = periodKey(acc, paid);
    insert("plan", plan.monthlyCredits, `plan:${acc.id}:${period}`, `${plan.name} plan allowance`, period);
  }
}

export type Balance = { free: number; plan: number; bonus: number; total: number; unlimited: boolean; period: string };

export function balance(acc: Account): Balance {
  const { paid, unlimited } = entitlement(acc);
  const period = periodKey(acc, paid);
  const rows = db
    .select({ bucket: t.creditLedger.bucket, period: t.creditLedger.period, sum: sql<number>`sum(${t.creditLedger.amount})` })
    .from(t.creditLedger)
    .where(eq(t.creditLedger.accountId, acc.id))
    .groupBy(t.creditLedger.bucket, t.creditLedger.period)
    .all();
  const sumOf = (b: string, p?: string) => rows.filter((r) => r.bucket === b && (p === undefined || r.period === p)).reduce((s, r) => s + Number(r.sum), 0);
  const free = Math.max(0, sumOf("free"));
  const plan = paid ? Math.max(0, sumOf("plan", period)) : 0;
  const bonus = Math.max(0, sumOf("bonus"));
  return { free, plan, bonus, total: free + plan + bonus, unlimited, period };
}

/**
 * Charges one unlock for a prospect, at most once per prospect (retries return
 * "already"). Plan credits are spent first, then bonus, then free.
 */
export function consumeCredit(acc: Account, ref: { type: string; id: string }, opts: { freeEligible: boolean }): "charged" | "already" | "unlimited" {
  if (entitlement(acc).unlimited) return "unlimited";
  return db.transaction(() => {
    const key = `consume:${ref.type}:${ref.id}`;
    const prior = db.select({ id: t.creditLedger.id }).from(t.creditLedger).where(eq(t.creditLedger.idempotencyKey, key)).get();
    const released = db.select({ id: t.creditLedger.id }).from(t.creditLedger).where(eq(t.creditLedger.idempotencyKey, `release:${ref.type}:${ref.id}`)).get();
    if (prior && !released) return "already" as const;
    ensureGrants(acc, opts);
    const b = balance(acc);
    const bucket = b.plan > 0 ? "plan" : b.bonus > 0 ? "bonus" : b.free > 0 ? "free" : null;
    if (!bucket) throw new OutOfCreditsError();
    db.insert(t.creditLedger)
      .values({ id: newId("cl"), accountId: acc.id, bucket, kind: "consume", amount: -1, period: bucket === "plan" ? b.period : null, reason: "Prospect unlocked", refType: ref.type, refId: ref.id, idempotencyKey: prior ? `${key}:${Date.now()}` : key })
      .run();
    return "charged" as const;
  });
}

/** Gives a charged unlock back (e.g. the promised details turned out unusable). Idempotent. */
export function releaseCredit(acc: Account, ref: { type: string; id: string }, reason: string) {
  db.transaction(() => {
    const charge = db
      .select()
      .from(t.creditLedger)
      .where(and(eq(t.creditLedger.accountId, acc.id), eq(t.creditLedger.refType, ref.type), eq(t.creditLedger.refId, ref.id), eq(t.creditLedger.kind, "consume")))
      .get();
    if (!charge) return;
    db.insert(t.creditLedger)
      .values({ id: newId("cl"), accountId: acc.id, bucket: charge.bucket, kind: "release", amount: 1, period: charge.period, reason, refType: ref.type, refId: ref.id, idempotencyKey: `release:${ref.type}:${ref.id}` })
      .onConflictDoNothing()
      .run();
  });
}

/** Admin adjustment: bonus credits (positive or negative). */
export function adjustCredits(accountId: string, amount: number, reason: string) {
  db.insert(t.creditLedger).values({ id: newId("cl"), accountId, bucket: "bonus", kind: "adjust", amount, period: null, reason, idempotencyKey: newId("adj") }).run();
}

// Usage limits ---------------------------------------------------------------

const day = () => new Date().toISOString().slice(0, 10);
const month = () => new Date().toISOString().slice(0, 7);

/**
 * Atomically counts one use of a metric, refusing past the limit. A single SQL
 * statement, so two simultaneous requests can't both squeeze under the limit.
 */
export function useAllowance(acc: Account, metric: "search" | "preview" | "deep_research", n = 1) {
  const { plan, unlimited } = entitlement(acc);
  const [limit, period, label] =
    metric === "search"
      ? [plan.limits.searchesPerDay, day(), `${plan.limits.searchesPerDay} searches a day`]
      : metric === "preview"
        ? [plan.limits.previewsPerMonth, month(), `${plan.limits.previewsPerMonth} researched previews a month`]
        : [plan.limits.deepResearchPerMonth, month(), `${plan.limits.deepResearchPerMonth} deep-research runs a month`];
  const cap = unlimited ? 1_000_000 : limit;
  const res = db.run(sql`
    INSERT INTO usage_counters (account_id, metric, period, count) VALUES (${acc.id}, ${metric}, ${period}, ${n})
    ON CONFLICT (account_id, metric, period) DO UPDATE SET count = count + ${n} WHERE count + ${n} <= ${cap}`);
  if (res.changes === 0 || n > cap) {
    throw new LimitReachedError(`Your ${plan.name} plan includes ${label}, and you've reached it.${plan.id === "free" || !unlimited ? " Upgrade for more, or try again when it resets." : ""}`);
  }
}

/** Gives back usage that didn't happen (e.g. a search that failed before doing any work). */
export function refundAllowance(acc: Account, metric: "search" | "preview" | "deep_research", n = 1) {
  const period = metric === "search" ? day() : month();
  db.run(sql`UPDATE usage_counters SET count = max(0, count - ${n}) WHERE account_id = ${acc.id} AND metric = ${metric} AND period = ${period}`);
}

export function usageNow(accountId: string) {
  const rows = db.select().from(t.usageCounters).where(eq(t.usageCounters.accountId, accountId)).all();
  const get = (m: string, p: string) => rows.find((r) => r.metric === m && r.period === p)?.count ?? 0;
  return { searchesToday: get("search", day()), previewsThisMonth: get("preview", month()), deepThisMonth: get("deep_research", month()) };
}
