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
const { resolveKey, aiConfigured } = await import("../src/lib/ai/core");
const { eq } = await import("drizzle-orm");

const db = getDb();
db.insert(t.accounts).values({ id: "acc_1", name: "One" }).run();
db.insert(t.accounts).values({ id: "acc_2", name: "Two" }).run();

test("no key anywhere means AI is off", () => {
  assert.equal(aiConfigured("acc_1"), false);
});

test("a server key is used for every account", () => {
  process.env.ANTHROPIC_API_KEY = "sk-ant-server";
  assert.deepEqual(resolveKey("acc_1"), { key: "sk-ant-server", source: "server" });
  assert.deepEqual(resolveKey("acc_2"), { key: "sk-ant-server", source: "server" });
});

test("an account's own key wins, and only for that account", () => {
  db.update(t.accounts).set({ anthropicKeyEnc: encryptSecret("sk-ant-mine") }).where(eq(t.accounts.id, "acc_1")).run();
  assert.deepEqual(resolveKey("acc_1"), { key: "sk-ant-mine", source: "account" });
  assert.deepEqual(resolveKey("acc_2"), { key: "sk-ant-server", source: "server" });
});

test("an unreadable saved key falls back to the server key instead of failing", () => {
  db.update(t.accounts).set({ anthropicKeyEnc: "v1.bad.bad.bad" }).where(eq(t.accounts.id, "acc_1")).run();
  assert.equal(resolveKey("acc_1")?.source, "server");
  delete process.env.ANTHROPIC_API_KEY;
});
