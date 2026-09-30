import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ss-secrets-"));
process.env.DATABASE_PATH = path.join(dir, "test.db");
delete process.env.APP_ENCRYPTION_KEY;
const { encryptSecret, decryptSecret } = await import("../src/lib/security/secrets");

test("secrets round-trip and are not stored in plain text", () => {
  const key = "sk-ant-api03-exampleexampleexample";
  const enc = encryptSecret(key);
  assert.ok(!enc.includes(key));
  assert.notEqual(encryptSecret(key), enc, "a fresh IV is used every time");
  assert.equal(decryptSecret(enc), key);
});

test("a generated master key is kept private next to the database", () => {
  const file = path.join(dir, ".secret-key");
  assert.ok(fs.existsSync(file));
  if (process.platform !== "win32") assert.equal(fs.statSync(file).mode & 0o077, 0);
});

test("tampered or foreign ciphertext is rejected, not crashed on", () => {
  const enc = encryptSecret("sk-ant-secret");
  const parts = enc.split(".");
  parts[3] = Buffer.from("tampered").toString("base64");
  assert.equal(decryptSecret(parts.join(".")), null);
  assert.equal(decryptSecret("garbage"), null);
});
