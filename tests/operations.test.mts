import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Module from "node:module";

// Stub "server-only" outside Next's bundle (same as key-resolution.test).
const resolve = (Module as unknown as { _resolveFilename: (...a: unknown[]) => string })._resolveFilename;
(Module as unknown as { _resolveFilename: (...a: unknown[]) => string })._resolveFilename = function (req: unknown, ...rest: unknown[]) {
  if (req === "server-only") return path.join(os.tmpdir(), "ss-server-only-stub.js");
  return resolve.call(this, req, ...rest);
};
fs.writeFileSync(path.join(os.tmpdir(), "ss-server-only-stub.js"), "");

process.env.DATABASE_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ss-ops-")), "test.db");
for (const k of Object.keys(process.env)) if (k.startsWith("AI_PRICE_") || k.startsWith("SALES_SCOUT_MODEL")) delete process.env[k];
// A fake key: these tests must never reach a paid API.
process.env.ANTHROPIC_API_KEY = "sk-ant-fake";
const { estimateCost } = await import("../src/lib/ai/pricing");
const { modelFor, DEFAULT_MODEL } = await import("../src/lib/ai/models");
const { getSwitch, setSwitch } = await import("../src/lib/settings");
const { generate, AiUnavailableError } = await import("../src/lib/ai/core");
const { runSpend } = await import("../src/lib/services/discovery");
const { getDb } = await import("../src/lib/db/connection");
const t = await import("../src/lib/db/schema");
const z = await import("zod/v4");

test("no configured prices means cost is unknown, never zero", () => {
  assert.equal(estimateCost("m", { input: 1000, cacheRead: 0, output: 1000, searches: 1 }), null);
});

test("costs split fresh input, cached input, output and searches", () => {
  Object.assign(process.env, { AI_PRICE_INPUT_USD_PER_MTOK: "10", AI_PRICE_OUTPUT_USD_PER_MTOK: "50", AI_PRICE_WEB_SEARCH_USD_PER_1000: "10", AI_PRICE_CACHE_READ_USD_PER_MTOK: "1" });
  const e = estimateCost("m", { input: 1_000_000, cacheRead: 500_000, output: 100_000, searches: 100 })!;
  // 0.5M fresh × $10 + 0.5M cached × $1 + 0.1M out × $50 + 100 searches × $0.01
  assert.equal(e.micros, (5 + 0.5 + 5 + 1) * 1e6);
  assert.match(e.version, /^m:in10\/out50\/cache1\/write12.5\/search10$/);
  process.env.AI_PRICE_M_OUTPUT_USD_PER_MTOK = "0";
  assert.equal(estimateCost("m", { input: 0, cacheRead: 0, output: 1e6, searches: 0 })!.micros, 0);
  for (const k of Object.keys(process.env)) if (k.startsWith("AI_PRICE_")) delete process.env[k];
});

test("one agent can be routed to a different model without touching the others", () => {
  process.env.SALES_SCOUT_MODEL_OUTREACH = "cheaper-model";
  assert.equal(modelFor("outreach"), "cheaper-model");
  assert.equal(modelFor("qualification"), DEFAULT_MODEL);
  delete process.env.SALES_SCOUT_MODEL_OUTREACH;
});

test("the AI kill switch stops paid calls before any request is made", async () => {
  getDb();
  assert.equal(getSwitch("ai_paused").on, false);
  setSwitch("ai_paused", { on: true, reason: "budget check" }, "owner@example.com");
  const ctx = { accountId: "acc_x", workspaceId: "ws", companyId: null };
  await assert.rejects(generate({ ctx, agent: "outreach", purpose: "t", system: "s", prompt: "p", schema: z.object({}) }), (e: unknown) => e instanceof AiUnavailableError && /paused.*budget check/.test((e as Error).message));
  setSwitch("ai_paused", { on: false }, "owner@example.com");
  assert.equal(getSwitch("ai_paused").on, false);
});

test("run spend only counts this run, from the batch start, and stays unknown when unpriced", () => {
  const db = getDb();
  const row = (id: string, runId: string, ago: number, cost: number | null) =>
    db.insert(t.aiInteractions).values({ id, accountId: "a", workspaceId: "w", agent: "x", purpose: "p", model: "m", status: "ok", inputTokens: 100, outputTokens: 10, runId, costUsdMicros: cost, createdAt: new Date(Date.now() - ago) }).run();
  row("i1", "run_1", 0, null);
  row("i2", "run_1", 3_600_000, 5);
  row("i3", "run_2", 0, 7);
  assert.deepEqual(runSpend("run_1", new Date(Date.now() - 60_000)), { tokens: 110, usd: null });
  assert.deepEqual(runSpend("run_2", new Date(0)), { tokens: 110, usd: 7 / 1e6 });
});

test("cache writes are counted as input and priced at their own rate", () => {
  Object.assign(process.env, { AI_PRICE_INPUT_USD_PER_MTOK: "10", AI_PRICE_OUTPUT_USD_PER_MTOK: "0", AI_PRICE_WEB_SEARCH_USD_PER_1000: "0" });
  // 1M input of which 1M are cache writes at the default 1.25 × input.
  assert.equal(estimateCost("m", { input: 1e6, cacheRead: 0, cacheWrite: 1e6, output: 0, searches: 0 })!.micros, 12.5e6);
  for (const k of Object.keys(process.env)) if (k.startsWith("AI_PRICE_")) delete process.env[k];
});

test("one paused step stops only that step", async () => {
  const ctx = { accountId: "acc_x", workspaceId: "ws", companyId: null };
  setSwitch("agent_paused:outreach", { on: true }, "owner@example.com");
  await assert.rejects(generate({ ctx, agent: "outreach", purpose: "t", system: "s", prompt: "p", schema: z.object({}) }), (e: unknown) => e instanceof AiUnavailableError && /Outreach drafts is paused/.test((e as Error).message));
  // Another step gets past the switch (and stops later, at the missing account's key).
  await assert.rejects(generate({ ctx, agent: "qualification", purpose: "t", system: "s", prompt: "p", schema: z.object({}) }), (e: unknown) => e instanceof AiUnavailableError && !/paused/.test((e as Error).message));
  setSwitch("agent_paused:outreach", { on: false }, "owner@example.com");
});

test("the monthly budget counts only the business's key and fails closed without prices", async () => {
  const { serverSpendThisMonth, serverBudgetBlock } = await import("../src/lib/ai/budget");
  const db = getDb();
  const base = { accountId: "a", workspaceId: "w", agent: "x", purpose: "p", model: "m", status: "ok" as const, outputTokens: 0 };
  db.delete(t.aiInteractions).run();
  db.insert(t.aiInteractions).values({ ...base, id: "s1", inputTokens: 600, keySource: "server", costUsdMicros: 2_000_000 }).run();
  db.insert(t.aiInteractions).values({ ...base, id: "s2", inputTokens: 300, keySource: null }).run();
  db.insert(t.aiInteractions).values({ ...base, id: "o1", inputTokens: 99_999, keySource: "account", costUsdMicros: 9e9 }).run();
  assert.deepEqual(serverSpendThisMonth(), { tokens: 900, usd: 2, unpriced: 1, tokenCap: null, usdCap: null });
  assert.equal(serverBudgetBlock(), null);
  process.env.AI_MONTHLY_TOKEN_BUDGET = "900";
  assert.match(serverBudgetBlock()!, /budget has been used/);
  process.env.AI_MONTHLY_TOKEN_BUDGET = "901";
  assert.equal(serverBudgetBlock(), null);
  delete process.env.AI_MONTHLY_TOKEN_BUDGET;
  process.env.AI_MONTHLY_BUDGET_USD = "5";
  assert.match(serverBudgetBlock()!, /prices aren't/);
  Object.assign(process.env, { AI_PRICE_INPUT_USD_PER_MTOK: "1", AI_PRICE_OUTPUT_USD_PER_MTOK: "1", AI_PRICE_WEB_SEARCH_USD_PER_1000: "1" });
  assert.equal(serverBudgetBlock(), null);
  process.env.AI_MONTHLY_BUDGET_USD = "2";
  assert.match(serverBudgetBlock()!, /budget has been used/);

  // And it actually stops a server-key call before any request is made.
  db.insert(t.accounts).values({ id: "acc_first", name: "Owner", createdAt: new Date(1) }).run();
  await assert.rejects(generate({ ctx: { accountId: "acc_first", workspaceId: "w", companyId: null }, agent: "outreach", purpose: "t", system: "s", prompt: "p", schema: z.object({}) }), (e: unknown) => e instanceof AiUnavailableError && /budget/.test((e as Error).message));
  delete process.env.AI_MONTHLY_BUDGET_USD;
  for (const k of Object.keys(process.env)) if (k.startsWith("AI_PRICE_")) delete process.env[k];
});
