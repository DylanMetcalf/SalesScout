import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { siteUrl } from "@/lib/site-url";
import { PAID_PLANS, paystackPlanCode, planPrice, type PlanId } from "./plans";

/**
 * Paystack (South Africa-friendly, recurring billing, signed webhooks).
 * Paid access is only ever granted from Paystack's own data: a signed webhook,
 * or a server-side transaction verification. Never from the browser redirect.
 * Needs PAYSTACK_SECRET_KEY and a PAYSTACK_PLAN_<PLAN> code per paid plan.
 */
export function paystackConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

export function onSale(id: PlanId): boolean {
  return paystackConfigured() && Boolean(paystackPlanCode(id));
}

async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("Online payments aren't set up yet.");
  const res = await fetch(`https://api.paystack.co${path}`, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T };
  if (!res.ok || !json.status) throw new Error(`Payment provider: ${json.message ?? `HTTP ${res.status}`}`);
  return json.data as T;
}

type Account = typeof t.accounts.$inferSelect;

const planFromCode = (code: string | null | undefined): PlanId | null => PAID_PLANS.find((p) => code && paystackPlanCode(p) === code) ?? null;

/** Starts a hosted Paystack checkout for a plan. Returns the URL to send the customer to. */
export async function startCheckout(acc: Account, email: string, plan: PlanId): Promise<string> {
  const code = paystackPlanCode(plan);
  if (!code) throw new Error("That plan isn't available online yet.");
  const data = await api<{ authorization_url: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: {
      email,
      // Paystack requires an amount, but a plan overrides it with the plan's own price.
      amount: Math.round((planPrice(plan) ?? 1) * 100),
      plan: code,
      currency: "ZAR",
      callback_url: `${siteUrl()}/settings/billing/return`,
      metadata: { accountId: acc.id, planId: plan },
    },
  });
  if (acc.subscriptionStatus === "none" || acc.subscriptionStatus === "expired") {
    db.update(t.accounts).set({ subscriptionStatus: "processing" }).where(eq(t.accounts.id, acc.id)).run();
  }
  return data.authorization_url;
}

type Tx = { status: string; reference: string; metadata?: { accountId?: string; planId?: string } | string | null; customer?: { customer_code?: string; email?: string }; plan?: { plan_code?: string } | null };

const meta = (m: Tx["metadata"]) => (typeof m === "string" ? (JSON.parse(m || "{}") as { accountId?: string; planId?: string }) : (m ?? {}));

/** Called when the customer returns from checkout: asks Paystack (server-to-server) whether it really succeeded. */
export async function verifyReturn(acc: Account, reference: string): Promise<"active" | "pending" | "failed"> {
  const tx = await api<Tx>(`/transaction/verify/${encodeURIComponent(reference)}`);
  const m = meta(tx.metadata);
  if (m.accountId !== acc.id) return "failed";
  if (tx.status !== "success") return tx.status === "abandoned" || tx.status === "failed" ? "failed" : "pending";
  activate(acc.id, (planFromCode(tx.plan?.plan_code) ?? (m.planId as PlanId)) || null, tx.customer?.customer_code ?? null, null);
  return "active";
}

function activate(accountId: string, plan: PlanId | null, customerCode: string | null, periodEnd: Date | null) {
  const acc = db.select().from(t.accounts).where(eq(t.accounts.id, accountId)).get();
  if (!acc) return;
  db.update(t.accounts)
    .set({
      ...(plan && { plan }),
      planSource: "paystack",
      subscriptionStatus: "active",
      cancelAtPeriodEnd: false,
      billingCustomerCode: customerCode ?? acc.billingCustomerCode,
      // Until Paystack tells us the next charge date, assume a month from now.
      currentPeriodEnd: periodEnd ?? (acc.currentPeriodEnd && acc.currentPeriodEnd.getTime() > Date.now() ? acc.currentPeriodEnd : new Date(Date.now() + 31 * 86_400_000)),
    })
    .where(eq(t.accounts.id, accountId))
    .run();
}

export function verifySignature(rawBody: string, signature: string | null): boolean {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key || !signature) return false;
  const expected = createHmac("sha512", key).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

type Event = {
  event: string;
  data: {
    id?: number | string;
    reference?: string;
    status?: string;
    paid?: boolean;
    metadata?: Tx["metadata"];
    customer?: { customer_code?: string; email?: string };
    plan?: { plan_code?: string } | null;
    subscription_code?: string;
    email_token?: string;
    next_payment_date?: string | null;
    subscription?: { subscription_code?: string; next_payment_date?: string | null; email_token?: string };
  };
};

function findAccount(e: Event["data"]): Account | undefined {
  const m = meta(e.metadata);
  if (m.accountId) return db.select().from(t.accounts).where(eq(t.accounts.id, m.accountId)).get();
  const sub = e.subscription_code ?? e.subscription?.subscription_code;
  if (sub) {
    const bySub = db.select().from(t.accounts).where(eq(t.accounts.billingSubscriptionCode, sub)).get();
    if (bySub) return bySub;
  }
  if (e.customer?.customer_code) return db.select().from(t.accounts).where(eq(t.accounts.billingCustomerCode, e.customer.customer_code)).get();
  return undefined;
}

/**
 * Applies a verified webhook. Each delivery is recorded once; repeats are ignored.
 * Returns what happened, for logging and tests.
 */
export function applyWebhook(rawBody: string): "duplicate" | "ignored" | "applied" | "unmatched" {
  const ev = JSON.parse(rawBody) as Event;
  const d = ev.data ?? {};
  const eventKey = `paystack:${ev.event}:${d.id ?? d.reference ?? d.subscription_code ?? ""}:${d.status ?? ""}:${d.next_payment_date ?? d.subscription?.next_payment_date ?? ""}`;
  const acc = findAccount(d);
  const fresh = db.insert(t.webhookEvents).values({ id: eventKey, provider: "paystack", type: ev.event, accountId: acc?.id ?? null }).onConflictDoNothing().run();
  if (fresh.changes === 0) return "duplicate";
  if (!acc) return "unmatched";
  const next = d.next_payment_date ?? d.subscription?.next_payment_date;
  const periodEnd = next ? new Date(next) : null;
  const set = (v: Partial<Account>) => db.update(t.accounts).set(v).where(eq(t.accounts.id, acc.id)).run();

  switch (ev.event) {
    case "charge.success":
      if (d.status === "success") activate(acc.id, planFromCode(d.plan?.plan_code) ?? ((meta(d.metadata).planId as PlanId) || null), d.customer?.customer_code ?? null, periodEnd);
      return "applied";
    case "subscription.create":
      set({
        plan: planFromCode(d.plan?.plan_code) ?? acc.plan,
        planSource: "paystack",
        subscriptionStatus: "active",
        billingSubscriptionCode: d.subscription_code ?? acc.billingSubscriptionCode,
        billingEmailToken: d.email_token ?? acc.billingEmailToken,
        billingCustomerCode: d.customer?.customer_code ?? acc.billingCustomerCode,
        cancelAtPeriodEnd: false,
        ...(periodEnd && { currentPeriodEnd: periodEnd }),
      });
      return "applied";
    case "invoice.create":
    case "invoice.update":
      if (d.paid) set({ subscriptionStatus: "active", ...(periodEnd && { currentPeriodEnd: periodEnd }) });
      return "applied";
    case "invoice.payment_failed":
      set({ subscriptionStatus: "past_due" });
      return "applied";
    case "subscription.not_renew":
    case "subscription.disable":
      // Access continues until the end of the period that was paid for.
      set({ subscriptionStatus: "canceled", cancelAtPeriodEnd: true });
      return "applied";
    default:
      return "ignored";
  }
}

/** Paystack's hosted page for updating the card or cancelling. */
export async function manageLink(acc: Account): Promise<string> {
  if (!acc.billingSubscriptionCode) throw new Error("No online subscription found for this account.");
  const data = await api<{ link: string }>(`/subscription/${encodeURIComponent(acc.billingSubscriptionCode)}/manage/link`);
  return data.link;
}

/** Stops renewal. Access stays until the end of the current period. */
export async function cancelSubscription(acc: Account) {
  if (!acc.billingSubscriptionCode || !acc.billingEmailToken) throw new Error("No online subscription found for this account.");
  await api("/subscription/disable", { method: "POST", body: { code: acc.billingSubscriptionCode, token: acc.billingEmailToken } });
  db.update(t.accounts).set({ subscriptionStatus: "canceled", cancelAtPeriodEnd: true }).where(eq(t.accounts.id, acc.id)).run();
}
