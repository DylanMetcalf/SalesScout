import "server-only";
import { inArray } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { inCompany, type CompanyTenant } from "@/lib/tenant";
import type { ProspectRow, ProspectView } from "@/lib/types";

/** Loads contacts, evidence and matching criteria for a set of prospects in one go. */
export function toViews(tenant: CompanyTenant, rows: ProspectRow[]): ProspectView[] {
  const ids = rows.map((r) => r.id);
  if (!ids.length) return [];
  const contacts = db.select().from(t.contacts).where(inCompany(t.contacts, tenant, inArray(t.contacts.prospectId, ids))).all();
  const evidence = db.select().from(t.evidence).where(inCompany(t.evidence, tenant, inArray(t.evidence.prospectId, ids))).all();
  const runIds = [...new Set(rows.map((r) => r.searchRunId).filter(Boolean))] as string[];
  const runs = runIds.length ? db.select().from(t.searchRuns).where(inCompany(t.searchRuns, tenant, inArray(t.searchRuns.id, runIds))).all() : [];
  return rows.map((p) => {
    const i = runs.find((r) => r.id === p.searchRunId)?.interpretation;
    return {
      id: p.id, name: p.name, website: p.website, industry: p.industry, location: p.location, whatTheyDo: p.whatTheyDo,
      whyRelevant: p.whyRelevant, potentialOpportunity: p.potentialOpportunity, suggestedNextStep: p.suggestedNextStep, fit: p.fit,
      confirmedFacts: p.confirmedFacts, inferences: p.inferences, unknowns: p.unknowns, status: p.status, inCrm: p.inCrm,
      rejectionReason: p.rejectionReason, isExample: p.isExample, researchDepth: p.researchDepth, origin: p.origin,
      contacts: contacts.filter((c) => c.prospectId === p.id).map((c) => ({ id: c.id, name: c.name, role: c.role, relevance: c.relevance, knowledge: c.knowledge, sourceUrl: c.sourceUrl })),
      evidence: evidence.filter((e) => e.prospectId === p.id).map((e) => ({ id: e.id, kind: e.kind, title: e.title, url: e.url, snippet: e.snippet, supports: e.supports })),
      criteria: i
        ? [
            { label: "Industries", values: i.industries },
            { label: "Geography", values: i.geographies },
            { label: "Company types", values: i.companyTypes },
            { label: "Buyer roles", values: i.buyerRoles },
          ].filter((c) => c.values.length)
        : undefined,
    };
  });
}
