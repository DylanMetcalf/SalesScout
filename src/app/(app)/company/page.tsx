import { desc, eq } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { inCompany, requireCompany } from "@/lib/tenant";
import { aiConfigured } from "@/lib/ai/core";
import { getFacts } from "@/lib/services/brain";
import { pendingSuggestions, preferencesFor } from "@/lib/services/learning";
import { PROVIDERS } from "@/lib/integrations/registry";
import { Page } from "@/components/layout/page";
import { CompanyView } from "@/components/company/company-view";

export const metadata = { title: "Company" };

export default async function CompanyPage({ searchParams }: { searchParams: Promise<{ tab?: string; edit?: string }> }) {
  const tenant = await requireCompany();
  const sp = await searchParams;
  const c = tenant.company;
  const facts = getFacts(tenant);
  const sources = db.select().from(t.sources).where(inCompany(t.sources, tenant)).all();
  const strategies = db.select().from(t.leadStrategies).where(inCompany(t.leadStrategies, tenant)).orderBy(desc(t.leadStrategies.updatedAt)).all();
  const opps = db.select().from(t.marketOpportunities).where(inCompany(t.marketOpportunities, tenant)).all();
  const exclusions = db.select().from(t.exclusions).where(inCompany(t.exclusions, tenant)).orderBy(desc(t.exclusions.createdAt)).all();
  const runs = db.select().from(t.searchRuns).where(inCompany(t.searchRuns, tenant)).all();
  const prospectsPerStrategy = db.select({ strategyId: t.prospects.strategyId }).from(t.prospects).where(inCompany(t.prospects, tenant)).all();
  const brainEdits = db.select().from(t.auditLog).where(eq(t.auditLog.companyId, c.id)).orderBy(desc(t.auditLog.createdAt)).limit(40).all();
  const env = process.env;

  return (
    <Page>
      <CompanyView
        initialTab={sp.tab}
        editStrategyId={sp.edit ?? null}
        company={{ id: c.id, name: c.name, description: c.description, website: c.website, summary: c.summary, brainStatus: c.brainStatus, brainAnalysedAt: c.brainAnalysedAt?.getTime() ?? null, isDemo: c.isDemo }}
        facts={facts.map((f) => ({ id: f.id, section: f.section, field: f.field, value: f.value, knowledge: f.knowledge, rationale: f.rationale, sourceIds: f.sourceIds, origin: f.origin }))}
        sources={sources.map((s) => ({ id: s.id, kind: s.kind, subtype: s.subtype, label: s.label, url: s.url, status: s.status, statusDetail: s.statusDetail, pagesRead: s.pagesRead, lastAnalysedAt: s.lastAnalysedAt?.getTime() ?? null }))}
        strategies={strategies.map((s) => ({
          id: s.id, name: s.name, description: s.description, industries: s.industries, companyTypes: s.companyTypes, geographies: s.geographies,
          companySizes: s.companySizes, buyerRoles: s.buyerRoles, keywords: s.keywords, exclusions: s.exclusions, notes: s.notes, status: s.status, origin: s.origin,
          runs: runs.filter((r) => r.strategyId === s.id).length, prospects: prospectsPerStrategy.filter((p) => p.strategyId === s.id).length,
        }))}
        opportunities={opps}
        exclusions={exclusions.map((e) => ({ id: e.id, kind: e.kind, value: e.value, reason: e.reason }))}
        suggestions={pendingSuggestions(tenant).map((s) => ({ id: s.id, title: s.title, body: s.body }))}
        preferences={preferencesFor(tenant).map((p) => ({ id: p.id, rule: p.rule, scope: p.scope }))}
        history={brainEdits.map((a) => ({ id: a.id, summary: a.summary, source: a.source, createdAt: a.createdAt.getTime() }))}
        providers={PROVIDERS.map((p) => ({ key: p.key, name: p.name, category: p.category, description: p.description, available: p.available, requires: p.requires, connectable: p.connectable(env) }))}
        aiConnected={aiConfigured(tenant.account.id)}
      />
    </Page>
  );
}
