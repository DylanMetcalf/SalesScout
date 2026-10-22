import "server-only";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db, t } from "@/lib/db";

/**
 * Unit economics from recorded usage (last 30 days). Costs need your real
 * provider prices, taken from your Anthropic invoice/pricing page, never assumed:
 *   AI_PRICE_INPUT_USD_PER_MTOK, AI_PRICE_OUTPUT_USD_PER_MTOK,
 *   AI_PRICE_WEB_SEARCH_USD_PER_1000, USD_ZAR
 * Revenue uses PLAN_PRICE_ZAR_* for accounts on paid plans.
 */
const num = (k: string) => {
  const v = Number(process.env[k]);
  return Number.isFinite(v) && v > 0 ? v : null;
};

export function unitEconomics(accounts: { plan: string; paid: boolean; price: number | null }[]) {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const ai = db
    .select({ input: sql<number>`coalesce(sum(${t.aiInteractions.inputTokens}),0)`, output: sql<number>`coalesce(sum(${t.aiInteractions.outputTokens}),0)`, searches: sql<number>`coalesce(sum(${t.aiInteractions.webSearches}),0)` })
    .from(t.aiInteractions)
    .where(gte(t.aiInteractions.createdAt, since))
    .get()!;
  const previews = db.select({ n: sql<number>`count(*)` }).from(t.prospects).where(and(gte(t.prospects.createdAt, since), inArray(t.prospects.origin, ["web_research", "similar", "manual"]), eq(t.prospects.isExample, false))).get()!.n;
  const kept = db.select({ n: sql<number>`coalesce(-sum(${t.creditLedger.amount}),0)` }).from(t.creditLedger).where(and(gte(t.creditLedger.createdAt, since), inArray(t.creditLedger.kind, ["consume", "release"]))).get()!.n;

  const pin = num("AI_PRICE_INPUT_USD_PER_MTOK");
  const pout = num("AI_PRICE_OUTPUT_USD_PER_MTOK");
  const psearch = num("AI_PRICE_WEB_SEARCH_USD_PER_1000");
  const fx = num("USD_ZAR");
  const priced = pin !== null && pout !== null && psearch !== null && fx !== null;
  const costZar = priced ? ((Number(ai.input) / 1e6) * pin! + (Number(ai.output) / 1e6) * pout! + (Number(ai.searches) / 1000) * psearch!) * fx! : null;
  const paying = accounts.filter((a) => a.paid);
  const revenue = paying.every((a) => a.price !== null) ? paying.reduce((s, a) => s + (a.price ?? 0), 0) : null;
  const rand = (n: number | null) => (n === null ? "Not set" : `R${n.toLocaleString("en-ZA", { maximumFractionDigits: 2 })}`);

  const missing = [!priced && "AI_PRICE_* and USD_ZAR", revenue === null && paying.length > 0 && "PLAN_PRICE_ZAR_* for paid plans"].filter(Boolean);
  return {
    rows: [
      { label: "AI tokens (in / out)", value: `${(Number(ai.input) / 1e6).toFixed(2)}M / ${(Number(ai.output) / 1e6).toFixed(2)}M` },
      { label: "Web searches", value: Number(ai.searches).toLocaleString() },
      { label: "Previews researched", value: Number(previews).toLocaleString() },
      { label: "Prospects kept (charged)", value: Number(kept).toLocaleString() },
      { label: "Estimated AI cost", value: rand(costZar) },
      { label: "Cost per kept prospect", value: costZar !== null && kept > 0 ? rand(costZar / kept) : "Not enough data" },
      { label: "Paying accounts · monthly revenue", value: `${paying.length} · ${rand(revenue)}` },
      { label: "Estimated gross margin", value: costZar !== null && revenue ? `${Math.round(((revenue - costZar) / revenue) * 100)}%` : "Not enough data" },
    ],
    note: missing.length
      ? `Estimates only. To see costs and margin, set ${missing.join(" and ")} on the server from your actual provider pricing.`
      : "Estimates from recorded usage and the prices you configured. Check them against your provider invoices.",
  };
}
