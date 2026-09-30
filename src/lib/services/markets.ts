import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { newId } from "@/lib/ids";
import { aiConfigured } from "@/lib/ai/core";
import { discoverMarkets } from "@/lib/ai/agents";
import { createJob, runInBackground } from "@/lib/jobs";
import { audit } from "@/lib/audit";
import { inCompany, tenantCols, type CompanyTenant } from "@/lib/tenant";
import { aiCtx, getDigest, getFacts } from "./brain";

export const MARKET_STEPS = [
  { key: "brain", label: "Reviewing your Company Brain" },
  { key: "markets", label: "Exploring potential markets" },
  { key: "buyers", label: "Working out who buys" },
  { key: "prepare", label: "Preparing recommendations" },
];

/** "Discover My Market": suggests where to look. Never changes strategy on its own. */
export function startMarketDiscovery(tenant: CompanyTenant) {
  if (!aiConfigured(tenant.account.id)) throw new Error("Market discovery needs AI to be connected.");
  const facts = getFacts(tenant);
  if (!facts.some((f) => f.knowledge !== "unknown") && !tenant.company.description) {
    throw new Error("Tell Sales Scout about your business first, so there's something to reason from.");
  }
  const jobId = createJob(aiCtx(tenant), "market_discovery", MARKET_STEPS);
  runInBackground(jobId, async (p) => {
    p.start("brain");
    const digest = getDigest(tenant);
    const avoid = facts.filter((f) => f.section === "exclusions").map((f) => f.value);
    const existing = db.select().from(t.marketOpportunities).where(inCompany(t.marketOpportunities, tenant, inArray(t.marketOpportunities.status, ["saved", "accepted", "dismissed"]))).all();
    p.start("markets");
    const tick = setTimeout(() => p.start("buyers"), 9000);
    const result = await discoverMarkets(aiCtx(tenant), digest, avoid, existing.map((e) => e.title)).finally(() => clearTimeout(tick));
    p.start("prepare");
    db.transaction((tx) => {
      tx.delete(t.marketOpportunities).where(inCompany(t.marketOpportunities, tenant, eq(t.marketOpportunities.status, "suggested"))).run();
      if (result.opportunities.length)
        tx.insert(t.marketOpportunities)
          .values(
            result.opportunities.map((o) => ({
              id: newId("mo"),
              ...tenantCols(tenant),
              title: o.title,
              summary: o.summary,
              reasoning: o.reasoning,
              knowledge: o.knowledge,
              industries: o.industries,
              companyTypes: o.company_types,
              buyerRoles: o.buyer_roles,
              jobTitles: o.job_titles,
              geographies: o.geographies,
              useCases: o.use_cases,
              keywords: o.keywords,
            })),
          )
          .run();
    });
    audit(tenant, { entityType: "market_discovery", action: "generated", source: "ai", summary: `Suggested ${result.opportunities.length} markets to explore` });
    p.finish({ intro: result.intro, count: result.opportunities.length });
  });
  return jobId;
}

/** Turns an accepted market into a Lead Strategy the user owns. */
export function acceptOpportunity(tenant: CompanyTenant, id: string) {
  const o = db.select().from(t.marketOpportunities).where(inCompany(t.marketOpportunities, tenant, eq(t.marketOpportunities.id, id))).get();
  if (!o) throw new Error("Suggestion not found.");
  if (o.strategyId) return o.strategyId;
  const strategyId = newId("ls");
  db.transaction((tx) => {
    tx.insert(t.leadStrategies)
      .values({
        id: strategyId,
        ...tenantCols(tenant),
        name: o.title,
        description: o.summary,
        industries: o.industries,
        companyTypes: o.companyTypes,
        geographies: o.geographies,
        buyerRoles: [...new Set([...o.buyerRoles, ...o.jobTitles])].slice(0, 8),
        keywords: o.keywords,
        notes: `Why Sales Scout suggested this: ${o.reasoning}`,
        origin: "market_discovery",
      })
      .run();
    tx.update(t.marketOpportunities).set({ status: "accepted", strategyId }).where(and(eq(t.marketOpportunities.id, o.id), eq(t.marketOpportunities.companyId, tenant.company.id))).run();
  });
  audit(tenant, { entityType: "lead_strategy", entityId: strategyId, action: "created", source: "user", summary: `Accepted market suggestion "${o.title}" as a lead strategy` });
  return strategyId;
}

export function setOpportunityStatus(tenant: CompanyTenant, id: string, status: "saved" | "dismissed" | "suggested") {
  db.update(t.marketOpportunities).set({ status }).where(inCompany(t.marketOpportunities, tenant, eq(t.marketOpportunities.id, id))).run();
}
