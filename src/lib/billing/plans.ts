/**
 * Plans and their entitlements: the one place limits live. Prices and Paystack
 * plan codes come from the environment so nothing commercial is hard-coded:
 *   PLAN_PRICE_ZAR_SCOUT=…   PAYSTACK_PLAN_SCOUT=PLN_…   (and _GROWTH, _SCALE)
 * Credit volumes mirror the website tiers; tune them here as real usage data arrives.
 */
export type PlanId = "free" | "scout" | "growth" | "scale";

export type Limits = {
  /** New searches (candidate discovery calls) per day. */
  searchesPerDay: number;
  /** Batches of up-to-5 previews per search. */
  batchesPerSearch: number;
  /** Researched previews per month (the main AI cost driver). */
  previewsPerMonth: number;
  /** Optional deep-research runs on kept prospects per month. */
  deepResearchPerMonth: number;
};

export type Plan = {
  id: PlanId;
  name: string;
  summary: string;
  /** Prospect-unlock credits granted once (free) or every billing period (paid). */
  oneTimeCredits: number;
  monthlyCredits: number;
  limits: Limits;
  features: string[];
};

export const BATCH_SIZE = 5;

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    summary: "Try Sales Scout on your own market.",
    oneTimeCredits: 5,
    monthlyCredits: 0,
    limits: { searchesPerDay: 2, batchesPerSearch: 2, previewsPerMonth: 20, deepResearchPerMonth: 2 },
    features: ["5 prospect unlocks, once", "Prospect previews in batches of 5", "Branded prospect briefs", "Pipeline and follow-ups"],
  },
  scout: {
    id: "scout",
    name: "Scout",
    summary: "Test a market, prove the fit.",
    oneTimeCredits: 0,
    monthlyCredits: 20,
    limits: { searchesPerDay: 10, batchesPerSearch: 6, previewsPerMonth: 150, deepResearchPerMonth: 20 },
    features: ["20 prospect unlocks a month", "Verified-contact mode", "Outreach drafts", "Excel / CSV export"],
  },
  growth: {
    id: "growth",
    name: "Growth",
    summary: "A steady pipeline, every month.",
    oneTimeCredits: 0,
    monthlyCredits: 30,
    limits: { searchesPerDay: 20, batchesPerSearch: 10, previewsPerMonth: 250, deepResearchPerMonth: 40 },
    features: ["30 prospect unlocks a month", "Everything in Scout", "More searches and deep research"],
  },
  scale: {
    id: "scale",
    name: "Scale",
    summary: "Research that keeps pace with a sales team.",
    oneTimeCredits: 0,
    monthlyCredits: 50,
    limits: { searchesPerDay: 40, batchesPerSearch: 15, previewsPerMonth: 400, deepResearchPerMonth: 80 },
    features: ["50 prospect unlocks a month", "Everything in Growth", "Highest research limits"],
  },
};

export const PAID_PLANS: PlanId[] = ["scout", "growth", "scale"];

export function planOf(id: string | null | undefined): Plan {
  return PLANS[(id ?? "free") as PlanId] ?? PLANS.free;
}

/** Monthly price in rand, if configured. Null = not on sale online yet. */
export function planPrice(id: PlanId): number | null {
  const v = Number(process.env[`PLAN_PRICE_ZAR_${id.toUpperCase()}`]);
  return Number.isFinite(v) && v > 0 ? v : null;
}

export function paystackPlanCode(id: PlanId): string | null {
  return process.env[`PAYSTACK_PLAN_${id.toUpperCase()}`] || null;
}
