import "server-only";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { db, t } from "@/lib/db";
import type { SearchInterpretation } from "@/lib/db/schema";
import { newId } from "@/lib/ids";
import { aiConfigured } from "@/lib/ai/core";
import { discoverCompanies, interpretQuery, qualifyCompany, type Qualification } from "@/lib/ai/agents";
import { createJob, runInBackground, type JobProgress } from "@/lib/jobs";
import { audit } from "@/lib/audit";
import { domainOf, normaliseUrl } from "@/lib/security/url";
import { inCompany, tenantCols, type CompanyTenant } from "@/lib/tenant";
import { aiCtx, getDigest } from "./brain";

export function strategyText(s: typeof t.leadStrategies.$inferSelect) {
  return [
    `Name: ${s.name}`,
    s.industries.length && `Industries: ${s.industries.join(", ")}`,
    s.companyTypes.length && `Company types: ${s.companyTypes.join(", ")}`,
    s.geographies.length && `Geography: ${s.geographies.join(", ")}`,
    s.companySizes.length && `Company size: ${s.companySizes.join(", ")}`,
    s.buyerRoles.length && `Buyer roles: ${s.buyerRoles.join(", ")}`,
    s.keywords.length && `Keywords: ${s.keywords.join(", ")}`,
    s.exclusions.length && `Exclusions: ${s.exclusions.join(", ")}`,
    s.notes && `Notes: ${s.notes}`,
  ]
    .filter(Boolean)
    .join("\n");
}

const normName = (n: string) => n.toLowerCase().replace(/\b(pty|ltd|limited|inc|llc|gmbh|plc|co|corp|corporation|group|holdings)\b/g, "").replace(/[^a-z0-9]/g, "");

/**
 * Everything the user already knows about or has ruled out: existing
 * prospects and CRM records, exclusions, competitors, customers and the
 * company itself. Used before any prospect is presented.
 */
export function knownCompanies(tenant: CompanyTenant) {
  const rows = db
    .select({ name: t.prospects.name, domain: t.prospects.domain, id: t.prospects.id, status: t.prospects.status })
    .from(t.prospects)
    .where(inCompany(t.prospects, tenant))
    .all();
  const ex = db.select().from(t.exclusions).where(inCompany(t.exclusions, tenant)).all();
  const domains = new Map<string, string>();
  const names = new Map<string, string>();
  for (const r of rows) {
    if (r.domain) domains.set(r.domain, r.status === "rejected" ? "previously rejected" : "already in your prospects");
    names.set(normName(r.name), r.status === "rejected" ? "previously rejected" : "already in your prospects");
  }
  for (const e of ex) {
    const why = e.kind === "competitor" ? "a competitor" : e.kind === "customer" ? "an existing customer" : "excluded";
    if (e.kind === "domain" || e.value.includes(".")) {
      const d = domainOf(e.value);
      if (d) domains.set(d, why);
    }
    if (["company", "competitor", "customer"].includes(e.kind)) names.set(normName(e.value), why);
  }
  const own = domainOf(tenant.company.website);
  if (own) domains.set(own, "your own company");
  names.set(normName(tenant.company.name), "your own company");
  return {
    domains,
    names,
    industryExclusions: ex.filter((e) => e.kind === "industry").map((e) => e.value),
    check(name: string, website: string | null) {
      const d = domainOf(website);
      return (d && domains.get(d)) || names.get(normName(name)) || null;
    },
  };
}

/** Step 1 of discovery: understand the request and show the plan before spending on research. */
export async function createSearchRun(
  tenant: CompanyTenant,
  input: { query: string; mode: "discover" | "specific"; strategyId?: string | null; filters?: Partial<Record<keyof SearchInterpretation, string[]>> },
) {
  const strategy = input.strategyId
    ? db.select().from(t.leadStrategies).where(inCompany(t.leadStrategies, tenant, eq(t.leadStrategies.id, input.strategyId))).get()
    : undefined;
  const query =
    input.query.trim() ||
    (strategy ? `Find companies that fit my "${strategy.name}" strategy` : "Find companies that could need what we sell");

  let interpretation: SearchInterpretation;
  if (aiConfigured(tenant.account.id)) {
    const exclusionNames = knownCompanies(tenant).industryExclusions;
    interpretation = await interpretQuery(aiCtx(tenant), getDigest(tenant), query, strategy ? strategyText(strategy) : null);
    interpretation.exclusions = [...new Set([...interpretation.exclusions, ...exclusionNames])];
  } else {
    interpretation = {
      summary: strategy ? `I'll look for companies that match your "${strategy.name}" strategy.` : "I'll use the filters you gave me.",
      industries: strategy?.industries ?? [],
      companyTypes: strategy?.companyTypes ?? [],
      geographies: strategy?.geographies ?? [],
      companySizes: strategy?.companySizes ?? [],
      buyerRoles: strategy?.buyerRoles ?? [],
      keywords: strategy?.keywords ?? [],
      exclusions: strategy?.exclusions ?? [],
      requested: 10,
    };
  }
  // Explicit filters always win over the interpretation.
  for (const [k, v] of Object.entries(input.filters ?? {})) {
    if (Array.isArray(v) && v.length) (interpretation as Record<string, unknown>)[k] = v;
  }

  const id = newId("run");
  db.insert(t.searchRuns)
    .values({
      id,
      ...tenantCols(tenant),
      strategyId: strategy?.id ?? null,
      mode: input.mode,
      title: titleFor(interpretation, strategy?.name),
      query,
      interpretation,
      status: "interpreted",
      requested: interpretation.requested,
      createdByUserId: tenant.user.id,
    })
    .run();
  return id;
}

/** "Find similar": plan a run seeded by an existing prospect. */
export function createSimilarRun(tenant: CompanyTenant, prospectId: string) {
  const p = db.select().from(t.prospects).where(inCompany(t.prospects, tenant, eq(t.prospects.id, prospectId))).get();
  if (!p) throw new Error("Prospect not found.");
  const strategy = p.strategyId ? db.select().from(t.leadStrategies).where(inCompany(t.leadStrategies, tenant, eq(t.leadStrategies.id, p.strategyId))).get() : undefined;
  const interpretation: SearchInterpretation = {
    summary: `I'll look for companies like ${p.name}: similar business, similar operations${p.location ? `, around ${p.location}` : ""}. I'll leave out anyone you already know.`,
    industries: p.industry ? [p.industry] : strategy?.industries ?? [],
    companyTypes: strategy?.companyTypes ?? [],
    geographies: p.location ? [p.location] : strategy?.geographies ?? [],
    companySizes: strategy?.companySizes ?? [],
    buyerRoles: strategy?.buyerRoles ?? [],
    keywords: strategy?.keywords ?? [],
    exclusions: strategy?.exclusions ?? [],
    requested: 10,
  };
  const id = newId("run");
  db.insert(t.searchRuns)
    .values({
      id,
      ...tenantCols(tenant),
      strategyId: p.strategyId,
      similarToProspectId: p.id,
      mode: "similar",
      title: `Companies like ${p.name}`,
      query: `Find companies similar to ${p.name}`,
      interpretation,
      status: "interpreted",
      requested: 10,
      createdByUserId: tenant.user.id,
    })
    .run();
  return id;
}

function titleFor(i: SearchInterpretation, strategyName?: string) {
  if (strategyName) return `${strategyName} prospects`;
  const what = i.industries[0] ?? i.companyTypes[0] ?? "Prospect";
  const where = i.geographies[0] ? ` · ${i.geographies[0]}` : "";
  return `${what[0].toUpperCase()}${what.slice(1)}${where}`;
}

export const DISCOVERY_STEPS = [
  { key: "search", label: "Searching the web for matching companies" },
  { key: "identify", label: "Identifying real companies" },
  { key: "dedupe", label: "Checking against companies you already know" },
  { key: "research", label: "Researching each company" },
  { key: "qualify", label: "Judging fit and potential need" },
  { key: "people", label: "Finding the right people to speak to" },
  { key: "present", label: "Preparing your results" },
];

/** Step 2 of discovery: the full research pipeline, as a background job. */
export function startDiscovery(tenant: CompanyTenant, runId: string, edited?: SearchInterpretation) {
  const run = db.select().from(t.searchRuns).where(inCompany(t.searchRuns, tenant, eq(t.searchRuns.id, runId))).get();
  if (!run) throw new Error("Search not found.");
  if (!aiConfigured(tenant.account.id)) throw new Error("Prospect discovery needs live web research, which requires AI to be connected.");
  const interp = edited ?? run.interpretation!;
  const jobId = createJob(aiCtx(tenant), "discovery", DISCOVERY_STEPS);
  db.update(t.searchRuns).set({ status: "running", interpretation: interp, requested: interp.requested, jobId }).where(eq(t.searchRuns.id, run.id)).run();

  runInBackground(jobId, async (p) => {
    try {
      await discoveryPipeline(tenant, run, interp, p);
    } catch (err) {
      db.update(t.searchRuns)
        .set({ status: "failed", error: err instanceof Error ? err.message : "Discovery failed", completedAt: new Date() })
        .where(eq(t.searchRuns.id, run.id))
        .run();
      throw err;
    }
  });
  return jobId;
}

async function discoveryPipeline(tenant: CompanyTenant, run: typeof t.searchRuns.$inferSelect, interp: SearchInterpretation, p: JobProgress) {
  const ctx = aiCtx(tenant);
  const digest = getDigest(tenant);
  const known = knownCompanies(tenant);
  const seed = run.similarToProspectId
    ? db.select().from(t.prospects).where(inCompany(t.prospects, tenant, eq(t.prospects.id, run.similarToProspectId))).get()
    : undefined;

  p.start("search");
  const found = await discoverCompanies(ctx, digest, interp, {
    avoidDomains: [...known.domains.keys()],
    avoidNames: db.select({ n: t.prospects.name }).from(t.prospects).where(inCompany(t.prospects, tenant)).all().map((r) => r.n),
    seed: seed ? `${seed.name} (${seed.website ?? "no website"}): ${seed.whatTheyDo ?? ""} Industry: ${seed.industry ?? "?"}. Location: ${seed.location ?? "?"}` : undefined,
  });
  p.step("search", "done", `${found.research.searches} searches, ${found.research.sources.length} pages found`);

  p.start("identify");
  // Deduplicate within the batch by domain/name.
  const seen = new Set<string>();
  const unique = found.candidates.filter((c) => {
    const k = domainOf(c.website) ?? normName(c.name);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  p.step("identify", "done", `${unique.length} companies identified${found.dropped ? ` · ${found.dropped} dropped (no source)` : ""}`);

  p.start("dedupe");
  let duplicates = 0;
  const fresh = unique.filter((c) => {
    const why = known.check(c.name, c.website);
    if (why) duplicates++;
    return !why;
  });
  p.step("dedupe", "done", duplicates ? `${duplicates} already known or excluded — skipped` : "No duplicates");
  db.update(t.searchRuns).set({ discovered: unique.length, duplicates }).where(eq(t.searchRuns.id, run.id)).run();

  if (!fresh.length) {
    db.update(t.searchRuns).set({ status: "completed", completedAt: new Date() }).where(eq(t.searchRuns.id, run.id)).run();
    p.finish({ relevant: 0, rejected: 0, duplicates, discovered: unique.length });
    return;
  }

  const batch = fresh.slice(0, interp.requested);
  p.start("research", `0 of ${batch.length}`);
  let done = 0;
  let relevant = 0;
  let rejected = 0;
  const failures: string[] = [];

  await mapLimit(batch, 3, async (c) => {
    try {
      const { q } = await qualifyCompany(ctx, digest, interp, c, 2);
      const outcome = saveQualifiedProspect(tenant, q, { runId: run.id, strategyId: run.strategyId, origin: run.mode === "similar" ? "similar" : "web_research", fallbackWebsite: c.website, fallbackSources: c.source_urls, known });
      if (outcome === "relevant") relevant++;
      else if (outcome === "rejected") rejected++;
    } catch (err) {
      failures.push(`${c.name}: ${err instanceof Error ? err.message : "failed"}`);
    }
    done++;
    p.step("research", "running", `${done} of ${batch.length} researched`);
    db.update(t.searchRuns).set({ relevant, rejected }).where(eq(t.searchRuns.id, run.id)).run();
  });

  p.step("research", failures.length === batch.length ? "failed" : "done", `${done - failures.length} of ${batch.length} researched${failures.length ? ` · ${failures.length} couldn't be completed` : ""}`);
  p.step("qualify", "done", `${relevant} look relevant · ${rejected} set aside`);
  p.step("people", "done");
  p.start("present");

  const status = failures.length === batch.length ? "failed" : failures.length ? "partial" : "completed";
  db.update(t.searchRuns)
    .set({ status, relevant, rejected, completedAt: new Date(), error: failures.length ? failures.slice(0, 5).join("\n") : null })
    .where(eq(t.searchRuns.id, run.id))
    .run();
  audit(tenant, {
    entityType: "search_run",
    entityId: run.id,
    action: "completed",
    source: "web_research",
    summary: `Discovery found ${unique.length} companies: ${relevant} relevant, ${rejected} set aside, ${duplicates} duplicates`,
  });
  if (status === "failed") throw new Error("We couldn't complete research on any of the companies found.");
  p.finish({ relevant, rejected, duplicates, discovered: unique.length }, status === "partial");
}

/** Persists a qualified company with its evidence and people. Returns how it was classified. */
export function saveQualifiedProspect(
  tenant: CompanyTenant,
  q: Qualification,
  opts: {
    runId: string | null;
    strategyId: string | null;
    origin: "web_research" | "similar" | "manual";
    fallbackWebsite: string | null;
    fallbackSources?: string[];
    known: ReturnType<typeof knownCompanies>;
    existingId?: string;
  },
): "relevant" | "rejected" | "duplicate" | "invalid" {
  if (!q.is_real_company) return "invalid";
  const website = normaliseUrl(q.website ?? opts.fallbackWebsite);
  const domain = domainOf(website);
  if (!opts.existingId && opts.known.check(q.canonical_name, website)) return "duplicate";
  const weak = q.fit.company.level === "weak";
  const id = opts.existingId ?? newId("pr");
  let conflicted = false;

  db.transaction((tx) => {
    const values = {
      name: q.canonical_name,
      domain,
      website,
      industry: q.industry,
      location: q.location,
      whatTheyDo: q.what_they_do,
      whyRelevant: q.why_relevant,
      potentialOpportunity: q.potential_opportunity,
      suggestedNextStep: q.suggested_next_step,
      fit: q.fit,
      confirmedFacts: q.confirmed_facts,
      inferences: q.inferences,
      unknowns: q.unknowns,
      recentActivity: q.recent_activity.map((a) => ({ title: a.title, url: a.url ?? undefined, date: a.date ?? undefined })),
      vetting: "presented" as const,
      updatedAt: new Date(),
    };
    if (opts.existingId) {
      tx.update(t.prospects).set(values).where(inCompany(t.prospects, tenant, eq(t.prospects.id, id))).run();
      tx.delete(t.evidence).where(inCompany(t.evidence, tenant, eq(t.evidence.prospectId, id))).run();
      tx.delete(t.contacts).where(inCompany(t.contacts, tenant, and(eq(t.contacts.prospectId, id), eq(t.contacts.origin, "web_research")))).run();
    } else {
      const res = tx
        .insert(t.prospects)
        .values({
          id,
          ...tenantCols(tenant),
          ...values,
          searchRunId: opts.runId,
          strategyId: opts.strategyId,
          origin: opts.origin,
          status: weak ? "rejected" : "new",
          rejectionReason: weak ? `Weak fit: ${q.fit.company.explanation}` : null,
        })
        .onConflictDoNothing()
        .run();
      if (res.changes === 0) {
        conflicted = true;
        return;
      }
    }
    const ev = q.evidence.length
      ? q.evidence
      : (opts.fallbackSources ?? []).map((u) => ({ kind: "search_result" as const, title: "Where we found them", url: u, snippet: "", supports: "Company identity" }));
    if (ev.length) tx.insert(t.evidence).values(ev.map((e) => ({ id: newId("ev"), ...tenantCols(tenant), prospectId: id, kind: e.kind, title: e.title, url: e.url, snippet: e.snippet || null, supports: e.supports }))).run();
    if (q.people.length)
      tx.insert(t.contacts)
        .values(
          q.people.map((c) => ({
            id: newId("ct"),
            ...tenantCols(tenant),
            prospectId: id,
            name: c.name,
            role: c.role,
            email: c.email,
            phone: c.phone,
            profileUrl: c.profile_url,
            relevance: c.relevance,
            sourceUrl: c.source_url,
            knowledge: c.name ? ("confirmed" as const) : ("suggested" as const),
            origin: "web_research" as const,
          })),
        )
        .run();
    tx.insert(t.activities)
      .values({ id: newId("act"), ...tenantCols(tenant), prospectId: id, type: opts.existingId ? "research" : "created", title: opts.existingId ? "Research updated" : "Discovered by Sales Scout", body: opts.existingId ? null : q.why_relevant })
      .run();
  });
  if (conflicted) return "duplicate";
  return weak ? "rejected" : "relevant";
}

export const DEEP_STEPS = [
  { key: "read", label: "Reading their website in depth" },
  { key: "news", label: "Looking for recent news and activity" },
  { key: "people", label: "Looking for the right people" },
  { key: "assess", label: "Re-assessing fit and opportunity" },
];

/** Level 3 research on demand for one prospect. */
export function startDeepResearch(tenant: CompanyTenant, prospectId: string) {
  const p = db.select().from(t.prospects).where(inCompany(t.prospects, tenant, eq(t.prospects.id, prospectId))).get();
  if (!p) throw new Error("Prospect not found.");
  if (!aiConfigured(tenant.account.id)) throw new Error("Deep research needs AI to be connected.");
  const run = p.searchRunId ? db.select().from(t.searchRuns).where(inCompany(t.searchRuns, tenant, eq(t.searchRuns.id, p.searchRunId))).get() : undefined;
  const jobId = createJob(aiCtx(tenant), "deep_research", DEEP_STEPS);
  runInBackground(jobId, async (job) => {
    job.start("read");
    const tick = setTimeout(() => job.start("news"), 15_000);
    const tick2 = setTimeout(() => job.start("people"), 35_000);
    const { q, removed } = await qualifyCompany(aiCtx(tenant), getDigest(tenant), run?.interpretation ?? null, { name: p.name, website: p.website, what_they_do: p.whatTheyDo ?? undefined }, 3).finally(() => {
      clearTimeout(tick);
      clearTimeout(tick2);
    });
    job.start("assess");
    saveQualifiedProspect(tenant, q, { runId: p.searchRunId, strategyId: p.strategyId, origin: "web_research", fallbackWebsite: p.website, known: knownCompanies(tenant), existingId: p.id });
    db.update(t.prospects).set({ researchDepth: 3 }).where(eq(t.prospects.id, p.id)).run();
    audit(tenant, { entityType: "prospect", entityId: p.id, action: "deep_research", source: "web_research", summary: `Deep research on ${p.name}`, detail: removed });
    job.finish({ prospectId: p.id });
  });
  return jobId;
}

/** Research a company the user adds by hand. */
export function startManualProspect(tenant: CompanyTenant, input: { name: string; website: string | null }) {
  const known = knownCompanies(tenant);
  const dup = known.check(input.name, input.website);
  if (dup) throw new Error(`${input.name} is ${dup}.`);
  const id = newId("pr");
  db.insert(t.prospects)
    .values({ id, ...tenantCols(tenant), name: input.name, website: normaliseUrl(input.website), domain: domainOf(input.website), origin: "manual", inCrm: true, status: "new", vetting: "discovered" })
    .run();
  db.insert(t.activities).values({ id: newId("act"), ...tenantCols(tenant), prospectId: id, userId: tenant.user.id, type: "created", title: "Added by you" }).run();
  audit(tenant, { entityType: "prospect", entityId: id, action: "created", source: "user", summary: `Added ${input.name} manually` });
  if (!aiConfigured(tenant.account.id)) return { id, jobId: null };
  const jobId = createJob(aiCtx(tenant), "prospect_research", DEEP_STEPS.slice(0, 1).concat(DEEP_STEPS.slice(2)));
  runInBackground(jobId, async (job) => {
    job.start("read");
    const { q } = await qualifyCompany(aiCtx(tenant), getDigest(tenant), null, { name: input.name, website: input.website }, 2);
    job.start("assess");
    saveQualifiedProspect(tenant, q, { runId: null, strategyId: null, origin: "manual", fallbackWebsite: input.website, known, existingId: id });
    db.update(t.prospects).set({ researchDepth: 2 }).where(eq(t.prospects.id, id)).run();
    job.finish({ prospectId: id });
  });
  return { id, jobId };
}

export function prospectsForRun(tenant: CompanyTenant, runId: string) {
  return db.select().from(t.prospects).where(inCompany(t.prospects, tenant, eq(t.prospects.searchRunId, runId))).all();
}

export function contactsFor(tenant: CompanyTenant, prospectIds: string[]) {
  if (!prospectIds.length) return [];
  return db.select().from(t.contacts).where(inCompany(t.contacts, tenant, inArray(t.contacts.prospectId, prospectIds), isNotNull(t.contacts.role))).all();
}

async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) await fn(items[i++]);
    }),
  );
}
