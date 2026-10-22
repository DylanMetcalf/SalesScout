import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Module from "node:module";
import { createHmac } from "node:crypto";

// Stub "server-only" outside Next's bundle (same as key-resolution.test).
const resolve = (Module as unknown as { _resolveFilename: (...a: unknown[]) => string })._resolveFilename;
(Module as unknown as { _resolveFilename: (...a: unknown[]) => string })._resolveFilename = function (req: unknown, ...rest: unknown[]) {
  if (req === "server-only") return path.join(os.tmpdir(), "ss-server-only-stub.js");
  return resolve.call(this, req, ...rest);
};
fs.writeFileSync(path.join(os.tmpdir(), "ss-server-only-stub.js"), "");

process.env.DATABASE_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ss-billing-")), "test.db");
process.env.ADMIN_EMAILS = "owner@example.com";
process.env.PAYSTACK_SECRET_KEY = "sk_test_local_only";
process.env.PAYSTACK_PLAN_GROWTH = "PLN_growth";
const { getDb } = await import("../src/lib/db/connection");
const t = await import("../src/lib/db/schema");
const { eq } = await import("drizzle-orm");
const credits = await import("../src/lib/billing/credits");
const paystack = await import("../src/lib/billing/paystack");

const db = getDb();
const acc = (id: string) => db.select().from(t.accounts).where(eq(t.accounts.id, id)).get()!;
function mk(id: string, email: string) {
  db.insert(t.accounts).values({ id, name: id }).run();
  db.insert(t.users).values({ id: `usr_${id}`, accountId: id, email, name: id, passwordHash: "x" }).run();
}
mk("acc_owner", "owner@example.com");
mk("acc_a", "jane.doe@gmail.com");
mk("acc_alias", "janedoe+test@gmail.com");

test("the 5 free unlocks are granted once, and a Gmail alias of the same mailbox gets none", () => {
  credits.ensureGrants(acc("acc_a"), { freeEligible: true });
  credits.ensureGrants(acc("acc_a"), { freeEligible: true });
  assert.equal(credits.balance(acc("acc_a")).total, 5);
  credits.ensureGrants(acc("acc_alias"), { freeEligible: true });
  assert.equal(credits.balance(acc("acc_alias")).total, 0);
});

test("no free unlocks until the account is eligible (verification required)", () => {
  mk("acc_unverified", "new@example.com");
  credits.ensureGrants(acc("acc_unverified"), { freeEligible: false });
  assert.equal(credits.balance(acc("acc_unverified")).total, 0);
});

test("keeping the same prospect twice charges once; running out is refused", () => {
  const a = acc("acc_a");
  assert.equal(credits.consumeCredit(a, { type: "prospect", id: "p1" }, { freeEligible: true }), "charged");
  assert.equal(credits.consumeCredit(a, { type: "prospect", id: "p1" }, { freeEligible: true }), "already");
  for (const id of ["p2", "p3", "p4", "p5"]) credits.consumeCredit(a, { type: "prospect", id }, { freeEligible: true });
  assert.equal(credits.balance(a).total, 0);
  assert.throws(() => credits.consumeCredit(a, { type: "prospect", id: "p6" }, { freeEligible: true }), credits.OutOfCreditsError);
});

test("a failed delivery gives the unlock back, once", () => {
  const a = acc("acc_a");
  credits.releaseCredit(a, { type: "prospect", id: "p5" }, "Research failed");
  credits.releaseCredit(a, { type: "prospect", id: "p5" }, "Research failed");
  assert.equal(credits.balance(a).total, 1);
});

test("administrators are never charged", () => {
  assert.equal(credits.consumeCredit(acc("acc_owner"), { type: "prospect", id: "x" }, { freeEligible: true }), "unlimited");
});

test("a manual paid plan grants this period's credits once; expired access stops them", () => {
  db.update(t.accounts).set({ plan: "growth", planSource: "manual", accessUntil: new Date(Date.now() + 86_400_000) }).where(eq(t.accounts.id, "acc_alias")).run();
  credits.ensureGrants(acc("acc_alias"), { freeEligible: true });
  credits.ensureGrants(acc("acc_alias"), { freeEligible: true });
  assert.equal(credits.balance(acc("acc_alias")).plan, 30);
  db.update(t.accounts).set({ accessUntil: new Date(Date.now() - 1000) }).where(eq(t.accounts.id, "acc_alias")).run();
  assert.equal(credits.entitlement(acc("acc_alias")).plan.id, "free");
  assert.equal(credits.balance(acc("acc_alias")).plan, 0);
});

test("usage limits can't be exceeded, and refunds give usage back", () => {
  const a = acc("acc_unverified"); // free plan: 2 searches a day
  credits.useAllowance(a, "search");
  credits.useAllowance(a, "search");
  assert.throws(() => credits.useAllowance(a, "search"), credits.LimitReachedError);
  credits.refundAllowance(a, "search");
  credits.useAllowance(a, "search");
  assert.equal(credits.usageNow("acc_unverified").searchesToday, 2);
});

const sign = (body: string) => createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!).update(body).digest("hex");

test("[local signed payloads, not live Paystack] webhooks need a valid signature", () => {
  const body = JSON.stringify({ event: "charge.success", data: { id: 1 } });
  assert.equal(paystack.verifySignature(body, sign(body)), true);
  assert.equal(paystack.verifySignature(body, sign(body + " ")), false);
  assert.equal(paystack.verifySignature(body, null), false);
});

test("[local signed payloads] subscription lifecycle: activate, renew, fail, cancel; duplicates ignored", () => {
  mk("acc_pay", "payer@example.com");
  const next = new Date(Date.now() + 30 * 86_400_000).toISOString();
  const charge = JSON.stringify({ event: "charge.success", data: { id: 77, status: "success", reference: "r1", metadata: { accountId: "acc_pay", planId: "growth" }, customer: { customer_code: "CUS_1" }, plan: { plan_code: "PLN_growth" } } });
  assert.equal(paystack.applyWebhook(charge), "applied");
  assert.equal(paystack.applyWebhook(charge), "duplicate");
  assert.equal(acc("acc_pay").subscriptionStatus, "active");
  assert.equal(acc("acc_pay").plan, "growth");
  assert.equal(credits.entitlement(acc("acc_pay")).paid, true);

  paystack.applyWebhook(JSON.stringify({ event: "subscription.create", data: { id: 5, subscription_code: "SUB_1", email_token: "tok", next_payment_date: next, customer: { customer_code: "CUS_1" }, plan: { plan_code: "PLN_growth" } } }));
  assert.equal(acc("acc_pay").billingSubscriptionCode, "SUB_1");
  assert.equal(acc("acc_pay").currentPeriodEnd?.toISOString(), next);

  paystack.applyWebhook(JSON.stringify({ event: "invoice.payment_failed", data: { id: 9, subscription: { subscription_code: "SUB_1" } } }));
  assert.equal(acc("acc_pay").subscriptionStatus, "past_due");
  assert.equal(credits.entitlement(acc("acc_pay")).paid, true, "keeps the plan while Paystack retries");

  paystack.applyWebhook(JSON.stringify({ event: "subscription.disable", data: { id: 10, subscription_code: "SUB_1", status: "complete" } }));
  assert.equal(acc("acc_pay").subscriptionStatus, "canceled");
  assert.equal(credits.entitlement(acc("acc_pay")).paid, true, "access continues to the end of the paid period");
  db.update(t.accounts).set({ currentPeriodEnd: new Date(Date.now() - 1000) }).where(eq(t.accounts.id, "acc_pay")).run();
  assert.equal(credits.entitlement(acc("acc_pay")).paid, false);
});

test("[local signed payloads] events for unknown accounts change nothing", () => {
  assert.equal(paystack.applyWebhook(JSON.stringify({ event: "charge.success", data: { id: 999, status: "success", customer: { customer_code: "CUS_nobody" } } })), "unmatched");
});
