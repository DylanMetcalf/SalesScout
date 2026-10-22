/**
 * Cost estimates for AI calls, from prices YOU configure (from Anthropic's pricing
 * page or invoice). Nothing is assumed: with no prices set, cost stays null
 * ("unknown"), never zero. Each estimate stores the prices it used (pricingVersion),
 * so changing prices later doesn't silently rewrite history.
 *
 *   AI_PRICE_INPUT_USD_PER_MTOK, AI_PRICE_OUTPUT_USD_PER_MTOK, AI_PRICE_WEB_SEARCH_USD_PER_1000
 *   AI_PRICE_CACHE_READ_USD_PER_MTOK  (optional; defaults to the input price, which overestimates)
 *   Per-model overrides: AI_PRICE_<MODEL>_INPUT_USD_PER_MTOK etc., MODEL upper-cased with - and . as _
 */
const num = (k: string) => {
  const v = Number(process.env[k]);
  return Number.isFinite(v) && v >= 0 && process.env[k] !== "" && process.env[k] !== undefined ? v : null;
};

export type Prices = { input: number; output: number; cacheRead: number; search: number; version: string };

export function pricesFor(model: string): Prices | null {
  const m = model.toUpperCase().replace(/[-.]/g, "_");
  const pick = (k: string) => num(`AI_PRICE_${m}_${k}`) ?? num(`AI_PRICE_${k}`);
  const input = pick("INPUT_USD_PER_MTOK");
  const output = pick("OUTPUT_USD_PER_MTOK");
  const search = pick("WEB_SEARCH_USD_PER_1000");
  if (input === null || output === null || search === null) return null;
  const cacheRead = pick("CACHE_READ_USD_PER_MTOK") ?? input;
  return { input, output, cacheRead, search, version: `${model}:in${input}/out${output}/cache${cacheRead}/search${search}` };
}

/** Estimated cost in millionths of a US dollar, or null when prices aren't configured. */
export function estimateCost(model: string, u: { input: number; cacheRead: number; output: number; searches: number }): { micros: number; version: string } | null {
  const p = pricesFor(model);
  if (!p) return null;
  const fresh = Math.max(0, u.input - u.cacheRead);
  const usd = (fresh / 1e6) * p.input + (u.cacheRead / 1e6) * p.cacheRead + (u.output / 1e6) * p.output + (u.searches / 1000) * p.search;
  return { micros: Math.round(usd * 1e6), version: p.version };
}
