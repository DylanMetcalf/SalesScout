import "server-only";
import { eq } from "drizzle-orm";
import { db, t } from "@/lib/db";

/**
 * Operator kill switches, stored in the database so they take effect at once
 * without a deploy. Checked before every paid AI call.
 *   ai_paused         - all AI work stops (drafting, research, discovery)
 *   discovery_paused  - new searches and batches stop; everything else works
 *   agent_paused:<agent> - one AI step stops (e.g. outreach drafts); the rest works
 */
export type SwitchKey = "ai_paused" | "discovery_paused" | `agent_paused:${string}`;
type Switch = { on: boolean; reason?: string };

export function getSwitch(key: SwitchKey): Switch {
  const row = db.select({ value: t.systemSettings.value }).from(t.systemSettings).where(eq(t.systemSettings.key, key)).get();
  return (row?.value as Switch | undefined) ?? { on: false };
}

export function setSwitch(key: SwitchKey, value: Switch, by: string) {
  db.insert(t.systemSettings)
    .values({ key, value, updatedBy: by, updatedAt: new Date() })
    .onConflictDoUpdate({ target: t.systemSettings.key, set: { value, updatedBy: by, updatedAt: new Date() } })
    .run();
}
