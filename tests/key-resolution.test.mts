import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Module from "node:module";

// core.ts imports "server-only", which throws outside Next's server bundle. Stub it for tests.
const resolve = (Module as unknown as { _resolveFilename: (...a: unknown[]) => string })._resolveFilename;
(Module as unknown as { _resolveFilename: (...a: unknown[]) => string })._resolveFilename = function (req: unknown, ...rest: unknown[]) {
  if (req === "server-only") return path.join(os.tmpdir(), "ss-server-only-stub.js");
  return resolve.call(this, req, ...rest);
};
fs.writeFileSync(path.join(os.tmpdir(), "ss-server-only-stub.js"), "");

process.env.DATABASE_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ss-keys-")), "test.db");
delete process.env.ANTHROPIC_API_KEY;
delete process.env.ANTHROPIC_AUTH_TOKEN;
const { getDb } = await import("../src/lib/db/connection");
const t = await import("../src/lib/db/schema");
const { encryptSecret } = await import("../src/lib/security/secrets");
const { resolveKey, aiConfigured, aiUnavailableReason } = await import("../src/lib/ai/core");
const { isAdminAccount } = await import("../src/lib/admin");
const { accessBlock } = await import("../src/lib/access");
const { eq } = await import("drizzle-orm");

const db = getDb();
process.env.ADMIN_EMAILS = "Owner@Example.com";
for (const [id, email] of [["acc_admin", "owner@example.com"], ["acc_1", "one@example.com"], ["acc_2", "two@example.com"]]) {
  db.insert(t.accounts).values({ id, name: id, createdAt: new Date(id === "acc_admin" ? 1_000 : 2_000) }).run();
  db.insert(t.users).values({ id: `usr_${id}`, accountId: id, email, name: id, passwordHash: "x" }).run();
}

test("no key anywhere means AI is off", () => {
  assert.equal(aiConfigured("acc_admin"), false);
  assert.equal(aiConfigured("acc_1"), false);
});

test("the server key is the administrator's, not everyone's", () => {
  process.env.ANTHROPIC_API_KEY = "sk-ant-server";
  assert.deepEqual(resolveKey("acc_admin"), { key: "sk-ant-server", source: "server" });
  assert.equal(resolveKey("acc_1"), null);
  assert.equal(resolveKey("acc_2"), null);
});

test("an account's own key wins, and only for that account", () => {
  db.update(t.accounts).set({ anthropicKeyEnc: encryptSecret("sk-ant-mine") }).where(eq(t.accounts.id, "acc_1")).run();
  assert.deepEqual(resolveKey("acc_1"), { key: "sk-ant-mine", source: "account" });
  assert.equal(resolveKey("acc_2"), null);
});

test("an administrator can grant the server key, up to a monthly allowance", () => {
  db.update(t.accounts).set({ aiAccess: "server", aiMonthlyTokenLimit: 1000 }).where(eq(t.accounts.id, "acc_2")).run();
  assert.equal(resolveKey("acc_2")?.source, "server");
  db.insert(t.aiInteractions).values({ id: "ai_1", accountId: "acc_2", workspaceId: "ws", agent: "a", purpose: "p", model: "m", status: "ok", inputTokens: 900, outputTokens: 200 }).run();
  assert.equal(resolveKey("acc_2"), null);
  assert.match(aiUnavailableReason("acc_2"), /allowance/);
  db.update(t.accounts).set({ aiMonthlyTokenLimit: null }).where(eq(t.accounts.id, "acc_2")).run();
  assert.equal(resolveKey("acc_2")?.source, "server");
});

test("an unreadable saved key falls back to whatever else the account may use", () => {
  db.update(t.accounts).set({ anthropicKeyEnc: "v1.bad.bad.bad" }).where(eq(t.accounts.id, "acc_1")).run();
  assert.equal(resolveKey("acc_1"), null);
  db.update(t.accounts).set({ anthropicKeyEnc: "v1.bad.bad.bad" }).where(eq(t.accounts.id, "acc_admin")).run();
  assert.equal(resolveKey("acc_admin")?.source, "server");
  delete process.env.ANTHROPIC_API_KEY;
});

test("paused or expired accounts are blocked; administrators never are", () => {
  process.env.ADMIN_EMAILS = "owner@example.com";
  assert.equal(accessBlock("acc_2"), null);
  db.update(t.accounts).set({ accessUntil: new Date(Date.now() + 86_400_000) }).where(eq(t.accounts.id, "acc_2")).run();
  assert.equal(accessBlock("acc_2"), null);
  db.update(t.accounts).set({ accessUntil: new Date(Date.now() - 1000) }).where(eq(t.accounts.id, "acc_2")).run();
  assert.equal(accessBlock("acc_2"), "ended");
  db.update(t.accounts).set({ suspendedAt: new Date() }).where(eq(t.accounts.id, "acc_2")).run();
  assert.equal(accessBlock("acc_2"), "paused");
  db.update(t.accounts).set({ suspendedAt: new Date(), accessUntil: new Date(0) }).where(eq(t.accounts.id, "acc_admin")).run();
  assert.equal(accessBlock("acc_admin"), null);
});

test("without ADMIN_EMAILS, the first account is the administrator", () => {
  delete process.env.ADMIN_EMAILS;
  assert.equal(isAdminAccount("acc_admin"), true);
  assert.equal(isAdminAccount("acc_1"), false);
});
