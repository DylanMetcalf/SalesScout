import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/*
 * Encryption for secrets stored in the database (e.g. a pasted API key).
 * The master key comes from APP_ENCRYPTION_KEY. If that isn't set (typical
 * for a personal local install), one is generated once and kept in
 * data/.secret-key with owner-only permissions.
 */

let cached: Buffer | null = null;

function masterKey(): Buffer {
  if (cached) return cached;
  const fromEnv = process.env.APP_ENCRYPTION_KEY;
  if (fromEnv) {
    cached = createHash("sha256").update(fromEnv).digest();
    return cached;
  }
  const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "salesscout.db");
  const file = path.join(path.dirname(dbPath), ".secret-key");
  if (!fs.existsSync(file)) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, randomBytes(32).toString("base64"), { mode: 0o600 });
  }
  cached = createHash("sha256").update(fs.readFileSync(file, "utf8").trim()).digest();
  return cached;
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", masterKey(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(".");
}

/** Returns null if the value can't be decrypted (e.g. the master key changed). */
export function decryptSecret(stored: string): string | null {
  try {
    const [v, iv, tag, data] = stored.split(".");
    if (v !== "v1") return null;
    const decipher = createDecipheriv("aes-256-gcm", masterKey(), Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
