import "server-only";
import { eq } from "drizzle-orm";
import { db, t } from "@/lib/db";

/**
 * Fixed-window rate limiter backed by the database, so it holds across
 * requests and restarts. Returns true when the call is allowed.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - (now % windowMs);
  const row = db.select().from(t.rateLimits).where(eq(t.rateLimits.key, key)).get();
  if (!row || row.windowStart !== windowStart) {
    db.insert(t.rateLimits)
      .values({ key, windowStart, count: 1 })
      .onConflictDoUpdate({ target: t.rateLimits.key, set: { windowStart, count: 1 } })
      .run();
    return true;
  }
  if (row.count >= limit) return false;
  db.update(t.rateLimits).set({ count: row.count + 1 }).where(eq(t.rateLimits.key, key)).run();
  return true;
}
