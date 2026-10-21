/**
 * Prints a one-time password reset link, for when the administrator is locked out.
 * On Render: open the service → Shell, then run
 *   npm run reset-link -- you@example.com
 */
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "../src/lib/db/connection";
import * as t from "../src/lib/db/schema";

const email = (process.argv[2] ?? "").trim().toLowerCase();
if (!email) {
  console.error("Usage: npm run reset-link -- you@example.com");
  process.exit(1);
}
const db = getDb();
const user = db.select({ id: t.users.id }).from(t.users).where(eq(t.users.email, email)).get();
if (!user) {
  console.error(`No account uses ${email}.`);
  process.exit(1);
}
const token = randomBytes(32).toString("base64url");
db.insert(t.passwordResets).values({ id: createHash("sha256").update(token).digest("hex"), userId: user.id, expiresAt: new Date(Date.now() + 24 * 3_600_000) }).run();
const base = (process.env.SITE_URL || process.env.RENDER_EXTERNAL_URL || "http://localhost:3000").replace(/\/+$/, "");
console.log(`Reset link (works once, for 24 hours):\n${base}/reset-password?token=${token}`);
