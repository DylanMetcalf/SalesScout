import "server-only";
import { and, gte, isNull, or, sql, eq } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { DEFAULT_MODEL } from "./models";
import { pricesFor } from "./pricing";

/**
 * The business's monthly spend cap on the server key (customers' own keys are theirs).
 *   AI_MONTHLY_TOKEN_BUDGET  - tokens per calendar month (UTC)
 *   AI_MONTHLY_BUDGET_USD    - estimated USD per month; needs AI_PRICE_* set
 * Checked before every paid call. Calls already running finish, so the month can end
 * slightly over: this is a brake, not an exact meter. Your Anthropic console spend
 * limit is the hard stop; set it too.
 */
const cap = (k: string) => {
  const v = Number(process.env[k]);
  return process.env[k] && Number.isFinite(v) && v > 0 ? v : null;
};

export function monthStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function serverSpendThisMonth() {
  // Calls from before key_source was recorded count as the business's: overcounting is the safe side.
  const r = db
    .select({
      tokens: sql<number>`coalesce(sum(${t.aiInteractions.inputTokens} + ${t.aiInteractions.outputTokens}),0)`,
      micros: sql<number>`coalesce(sum(${t.aiInteractions.costUsdMicros}),0)`,
      unpriced: sql<number>`coalesce(sum(case when ${t.aiInteractions.costUsdMicros} is null then 1 else 0 end),0)`,
    })
    .from(t.aiInteractions)
    .where(and(gte(t.aiInteractions.createdAt, monthStart()), or(eq(t.aiInteractions.keySource, "server"), isNull(t.aiInteractions.keySource))))
    .get()!;
  return { tokens: Number(r.tokens), usd: Number(r.micros) / 1e6, unpriced: Number(r.unpriced), tokenCap: cap("AI_MONTHLY_TOKEN_BUDGET"), usdCap: cap("AI_MONTHLY_BUDGET_USD") };
}

/** Why server-key AI must not run right now, or null. Fails closed when the cap can't be checked. */
export function serverBudgetBlock(): string | null {
  const s = serverSpendThisMonth();
  if (s.tokenCap !== null && s.tokens >= s.tokenCap) return "This month's AI budget has been used. It resets on the 1st, or your administrator can raise it.";
  if (s.usdCap !== null) {
    if (!pricesFor(DEFAULT_MODEL)) return "AI is paused because a monthly cost budget is set but AI prices aren't, so spend can't be checked. Your administrator needs to set the AI prices.";
    if (s.usd >= s.usdCap) return "This month's AI budget has been used. It resets on the 1st, or your administrator can raise it.";
  }
  return null;
}
