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
import { BATCH_SIZE } from "@/lib/billing/plans";
import { consumeCredit, entitlement, LimitReachedError, refundAllowance, releaseCredit, useAllowance } from "@/lib/billing/credits";
import { freeEligible } from "@/lib/billing/eligibility";
import { checkEmailDomains, sourceChecks } from "./contact-checks";
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

function getRun(tenant: CompanyTenant, runId: string) {
  const run = db.select().from(t.searchRuns).where(inCompany(t.searchRuns, tenant, eq(t.searchRuns.id, runId))).get();
  if (!run) throw new Error("Search not found.");
  return run;
}

/** One search at a time per account: a second click joins the running one instead of starting another. */
function assertNoOtherRunning(tenant: CompanyTenant, runId: string) {
  const busy = db
    .select({ id: t.searchRuns.id })
    .from(t.searchRuns)
    .innerJoin(t.workspaces, eq(t.workspaces.id, t.searchRuns.workspaceId))
    .where(and(eq(t.workspaces.accountId, tenant.account.id), eq(t.searchRuns.status, "running")))
    .all()
    .filter((r) => r.id !== runId);
  if (busy.length) throw new LimitReachedError("Another search is still running. It'll finish in a few minutes; then you can start this one.");
}

/**
 * Starts a search: finds candidate companies (cheap), queues them, and researches
 * the first batch of up to five for you to review. Nothing more is researched
 * until you ask for the next batch.
 */
export function startDiscovery(tenant: CompanyTenant, runId: string, edited?: SearchInterpretation, contactMode?: "verified" | "broad") {
  const run = getRun(tenant, runId);
  if (run.status === "running" && run.jobId) return run.jobId; // double-click / refresh: same job
  if (!aiConfigured(tenant.account.id)) throw new Error("Prospect discovery needs live web research, which requires AI to be connected.");
  assertNoOtherRunning(tenant, run.id);
  useAllowance(tenant.account, "search");
  const interp = { ...(edited ?? run.interpretation!), requested: BATCH_SIZE };
  const mode = contactMode ?? run.contactMode;
  const jobId = createJob(aiCtx(tenant), "discovery", DISCOVERY_STEPS);
  db.update(t.searchRuns).set({ status: "running", interpretation: interp, requested: BATCH_SIZE, contactMode: mode, jobId }).where(eq(t.searchRuns.id, run.id)).run();

  runInBackground(jobId, async (p) => {
    let searched = false;
    try {
      searched = await findCandidates(tenant, { ...run, contactMode: mode }, interp, p);
      await researchBatch(tenant, { ...run, contactMode: mode }, interp, p);
    } catch (err) {
      if (!searched) refundAllowance(tenant.account, "search"); // failed before any search work: don't count it
      failRun(run.id, err);
      throw err;
    }
  });
  return jobId;
}

/** The next batch of up to five: from the queue if there is one, else a fresh search (counts as a search). */
export function startNextBatch(tenant: CompanyTenant, runId: string) {
  const run = getRun(tenant, runId);
  if (run.status === "running" && run.jobId) return run.jobId;
  if (!aiConfigured(tenant.account.id)) throw new Error("Prospect discovery needs live web research, which requires AI to be connected.");
  const { plan } = entitlement(tenant.account);
  if (run.batches >= plan.limits.batchesPerSearch) {
    throw new LimitReachedError(`You've reviewed ${run.batches} batches from this search, the most your ${plan.name} plan allows per search. Start a new search with different criteria${plan.id === "free" ? ", or upgrade for more" : ""}.`);
  }
  assertNoOtherRunning(tenant, run.id);
  const queued = db.select({ id: t.runCandidates.id }).from(t.runCandidates).where(inCompany(t.runCandidates, tenant, and(eq(t.runCandidates.runId, run.id), eq(t.runCandidates.status, "queued")))).all().length;
  if (!queued) useAllowance(tenant.account, "search");
  const interp = run.interpretation!;
  const jobId = createJob(aiCtx(tenant), "discovery", queued ? DISCOVERY_STEPS.filter((s) => !["search", "identify", "dedupe"].includes(s.key)) : DISCOVERY_STEPS);
  db.update(t.searchRuns).set({ status: "running", jobId }).where(eq(t.searchRuns.id, run.id)).run();
  runInBackground(jobId, async (p) => {
    let searched = Boolean(queued);
    try {
      if (!queued) searched = await findCandidates(tenant, run, interp, p);
      await researchBatch(tenant, run, interp, p);
    } catch (err) {
      if (!searched) refundAllowance(tenant.account, "search");
      failRun(run.id, err);
      throw err;
    }
  });
  return jobId;
}

function failRun(runId: string, err: unknown) {
  db.update(t.searchRuns)
    .set({ status: "failed", error: err instanceof Error ? err.message : "Discovery failed", completedAt: new Date() })
    .where(eq(t.searchRuns.id, runId))
    .run();
}

/** Cheap step: search the web for candidate companies, de-duplicate, and queue the new ones. */
async function findCandidates(tenant: CompanyTenant, run: typeof t.searchRuns.$inferSelect, interp: SearchInterpretation, p: JobProgress): Promise<boolean> {
  const ctx = aiCtx(tenant);
  const known = knownCompanies(tenant);
  const seed = run.similarToProspectId
    ? db.select().from(t.prospects).where(inCompany(t.prospects, tenant, eq(t.prospects.id, run.similarToProspectId))).get()
    : undefined;
  const queuedBefore = db.select({ name: t.runCandidates.name, domain: t.runCandidates.domain }).from(t.runCandidates).where(inCompany(t.runCandidates, tenant, eq(t.runCandidates.runId, run.id))).all();

  p.start("search");
  // Ask for a few more than one batch: some won't qualify, and the rest wait in the queue.
  const found = await discoverCompanies(ctx, getDigest(tenant), { ...interp, requested: BATCH_SIZE * 3 }, {
    avoidDomains: [...known.domains.keys(), ...queuedBefore.map((c) => c.domain).filter((d): d is string => Boolean(d))],
    avoidNames: [...db.select({ n: t.prospects.name }).from(t.prospects).where(inCompany(t.prospects, tenant)).all().map((r) => r.n), ...queuedBefore.map((c) => c.name)],
    seed: seed ? `${seed.name} (${seed.website ?? "no website"}): ${seed.whatTheyDo ?? ""} Industry: ${seed.industry ?? "?"}. Location: ${seed.location ?? "?"}` : undefined,
  });
  p.step("search", "done", `${found.research.searches} searches, ${found.research.sources.length} pages found`);

  p.start("identify");
  const seen = new Set<string>(queuedBefore.map((c) => c.domain ?? normName(c.name)));
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
  if (fresh.length) {
    db.insert(t.runCandidates)
      .values(fresh.map((c) => ({ id: newId("rc"), ...tenantCols(tenant), runId: run.id, name: c.name, website: normaliseUrl(c.website), domain: domainOf(c.website), sourceUrls: c.source_urls })))
      .run();
  }
  p.step("dedupe", "done", duplicates ? `${duplicates} already known, reviewed or excluded — skipped` : "No duplicates");
  db.update(t.searchRuns).set({ discovered: run.discovered + unique.length, duplicates: run.duplicates + duplicates }).where(eq(t.searchRuns.id, run.id)).run();
  return true;
}

/**
 * Researches queued candidates until up to five are ready to review (or the queue
 * or the plan's preview allowance runs out). Verified-contacts mode tries a few
 * extra, because companies without a sourced contact are set aside.
 */
async function researchBatch(tenant: CompanyTenant, run: typeof t.searchRuns.$inferSelect, interp: SearchInterpretation, p: JobProgress) {
  const ctx = aiCtx(tenant);
  const digest = getDigest(tenant);
  const known = knownCompanies(tenant);
  const maxAttempts = run.contactMode === "verified" ? BATCH_SIZE * 2 : BATCH_SIZE;
  const queue = db
    .select()
    .from(t.runCandidates)
    .where(inCompany(t.runCandidates, tenant, and(eq(t.runCandidates.runId, run.id), eq(t.runCandidates.status, "queued"))))
    .orderBy(t.runCandidates.createdAt)
    .limit(maxAttempts)
    .all();

  let relevant = 0;
  let rejected = 0;
  let attempted = 0;
  let limitNote: string | null = null;
  const failures: string[] = [];
  p.start("research", queue.length ? `0 of up to ${BATCH_SIZE}` : "Nothing new to research");

  for (let i = 0; i < queue.length && relevant < BATCH_SIZE; i += 3) {
    const slice = queue.slice(i, i + Math.min(3, BATCH_SIZE - relevant));
    const ready: typeof slice = [];
    for (const c of slice) {
      try {
        useAllowance(tenant.account, "preview");
        ready.push(c);
      } catch (err) {
        limitNote = err instanceof Error ? err.message : "Plan limit reached.";
        break;
      }
    }
    await Promise.all(
      ready.map(async (c) => {
        attempted++;
        try {
          const { q } = await qualifyCompany(ctx, digest, interp, { name: c.name, website: c.website, source_urls: c.sourceUrls }, 2);
          const outcome = saveQualifiedProspect(tenant, q, { runId: run.id, strategyId: run.strategyId, origin: run.mode === "similar" ? "similar" : "web_research", fallbackWebsite: c.website, fallbackSources: c.sourceUrls, known, contactMode: run.contactMode });
          if (outcome === "relevant") relevant++;
          else if (outcome === "rejected") rejected++;
          db.update(t.runCandidates).set({ status: outcome === "relevant" || outcome === "rejected" ? "previewed" : "discarded" }).where(eq(t.runCandidates.id, c.id)).run();
          const saved = db.select({ id: t.prospects.id }).from(t.prospects).where(inCompany(t.prospects, tenant, and(eq(t.prospects.searchRunId, run.id), eq(t.prospects.name, q.canonical_name)))).get();
          if (saved) await checkEmailDomains(tenant, saved.id);
        } catch (err) {
          refundAllowance(tenant.account, "preview");
          db.update(t.runCandidates).set({ status: "discarded" }).where(eq(t.runCandidates.id, c.id)).run();
          failures.push(`${c.name}: ${err instanceof Error ? err.message : "failed"}`);
        }
        p.step("research", "running", `${relevant} ready to review · ${attempted} researched`);
      }),
    );
    if (limitNote) break;
  }

  const prior = db.select().from(t.searchRuns).where(eq(t.searchRuns.id, run.id)).get()!;
  const totals = { relevant: prior.relevant + relevant, rejected: prior.rejected + rejected };
  const allFailed = attempted > 0 && failures.length === attempted;
  p.step("research", allFailed ? "failed" : "done", `${attempted - failures.length} researched${failures.length ? ` · ${failures.length} couldn't be completed` : ""}${limitNote ? " · plan limit reached" : ""}`);
  p.step("qualify", "done", `${relevant} ready to review · ${rejected} set aside`);
  p.step("people", "done");
  p.start("present");

  const status = allFailed ? "failed" : failures.length || limitNote ? "partial" : "completed";
  db.update(t.searchRuns)
    .set({ status, ...totals, batches: prior.batches + 1, completedAt: new Date(), error: limitNote ?? (failures.length ? failures.slice(0, 5).join("\n") : null) })
    .where(eq(t.searchRuns.id, run.id))
    .run();
  audit(tenant, {
    entityType: "search_run",
    entityId: run.id,
    action: "batch_completed",
    source: "web_research",
    summary: `Batch ${prior.batches + 1}: ${relevant} ready to review, ${rejected} set aside${failures.length ? `, ${failures.length} failed` : ""}`,
  });
  if (allFailed) throw new Error("We couldn't complete research on any of the companies found.");
  p.finish({ relevant: totals.relevant, rejected: totals.rejected, duplicates: prior.duplicates, discovered: prior.discovered }, status === "partial");
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
    contactMode?: "verified" | "broad";
  },
): "relevant" | "rejected" | "duplicate" | "invalid" {
  if (!q.is_real_company) return "invalid";
  const website = normaliseUrl(q.website ?? opts.fallbackWebsite);
  const domain = domainOf(website);
  if (!opts.existingId && opts.known.check(q.canonical_name, website)) return "duplicate";
  // Verified-contacts mode only presents companies with a named person found on a cited page.
  const noSourcedContact = opts.contactMode === "verified" && !q.people.some((c) => c.name && c.source_url);
  const weak = q.fit.company.level === "weak" || noSourcedContact;
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
          rejectionReason: noSourcedContact ? "No named contact found on a public source (Verified contacts mode)" : weak ? `Weak fit: ${q.fit.company.explanation}` : null,
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
            checks: sourceChecks(c),
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
  if (!p.inCrm && !p.isExample) throw new Error("Keep this prospect first; deep research is part of a kept prospect's full profile.");
  useAllowance(tenant.account, "deep_research");
  const run = p.searchRunId ? db.select().from(t.searchRuns).where(inCompany(t.searchRuns, tenant, eq(t.searchRuns.id, p.searchRunId))).get() : undefined;
  const jobId = createJob(aiCtx(tenant), "deep_research", DEEP_STEPS);
  runInBackground(jobId, async (job) => {
    job.start("read");
    const tick = setTimeout(() => job.start("news"), 15_000);
    const tick2 = setTimeout(() => job.start("people"), 35_000);
    const { q, removed } = await qualifyCompany(aiCtx(tenant), getDigest(tenant), run?.interpretation ?? null, { name: p.name, website: p.website, what_they_do: p.whatTheyDo ?? undefined }, 3)
      .catch((err) => {
        refundAllowance(tenant.account, "deep_research"); // nothing delivered: don't count it
        throw err;
      })
      .finally(() => {
        clearTimeout(tick);
        clearTimeout(tick2);
      });
    job.start("assess");
    saveQualifiedProspect(tenant, q, { runId: p.searchRunId, strategyId: p.strategyId, origin: "web_research", fallbackWebsite: p.website, known: knownCompanies(tenant), existingId: p.id });
    await checkEmailDomains(tenant, p.id);
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
  const ai = aiConfigured(tenant.account.id);
  // Researching a company you add yourself delivers a full profile, so it uses an unlock (refunded if research fails).
  if (ai) {
    useAllowance(tenant.account, "preview");
    try {
      consumeCredit(tenant.account, { type: "prospect", id }, { freeEligible: freeEligible(tenant.account.id) });
    } catch (err) {
      refundAllowance(tenant.account, "preview");
      throw err;
    }
  }
  db.insert(t.prospects)
    .values({ id, ...tenantCols(tenant), name: input.name, website: normaliseUrl(input.website), domain: domainOf(input.website), origin: "manual", inCrm: true, status: "new", vetting: "discovered" })
    .run();
  db.insert(t.activities).values({ id: newId("act"), ...tenantCols(tenant), prospectId: id, userId: tenant.user.id, type: "created", title: "Added by you" }).run();
  audit(tenant, { entityType: "prospect", entityId: id, action: "created", source: "user", summary: `Added ${input.name} manually` });
  if (!ai) return { id, jobId: null };
  const jobId = createJob(aiCtx(tenant), "prospect_research", DEEP_STEPS.slice(0, 1).concat(DEEP_STEPS.slice(2)));
  runInBackground(jobId, async (job) => {
    job.start("read");
    const { q } = await qualifyCompany(aiCtx(tenant), getDigest(tenant), null, { name: input.name, website: input.website }, 2).catch((err) => {
      refundAllowance(tenant.account, "preview");
      releaseCredit(tenant.account, { type: "prospect", id }, "Research failed");
      throw err;
    });
    job.start("assess");
    saveQualifiedProspect(tenant, q, { runId: null, strategyId: null, origin: "manual", fallbackWebsite: input.website, known, existingId: id });
    await checkEmailDomains(tenant, id);
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
