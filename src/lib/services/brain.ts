import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { newId } from "@/lib/ids";
import { aiConfigured, type AiContext } from "@/lib/ai/core";
import { brainDigest, understandCompany } from "@/lib/ai/agents";
import { readWebsite } from "@/lib/research/website";
import { createJob, runInBackground } from "@/lib/jobs";
import { audit } from "@/lib/audit";
import { inCompany, tenantCols, type CompanyTenant } from "@/lib/tenant";

export function aiCtx(tenant: CompanyTenant): AiContext {
  return { accountId: tenant.account.id, workspaceId: tenant.workspace.id, companyId: tenant.company.id };
}

export function getFacts(tenant: CompanyTenant) {
  return db.select().from(t.brainFacts).where(inCompany(t.brainFacts, tenant)).orderBy(asc(t.brainFacts.createdAt)).all();
}

export function getDigest(tenant: CompanyTenant) {
  return brainDigest(tenant.company, getFacts(tenant));
}

export const ANALYSIS_STEPS = [
  { key: "website", label: "Reading your website" },
  { key: "pages", label: "Looking at your services and pages" },
  { key: "documents", label: "Reading your documents" },
  { key: "profiles", label: "Checking your public profiles" },
  { key: "understand", label: "Understanding your business" },
  { key: "save", label: "Preparing your Company Brain" },
];

/**
 * Builds (or rebuilds) the Company Brain from every source. Facts the user
 * wrote or edited are kept; previous AI/extraction facts are replaced.
 */
export function startBrainAnalysis(tenant: CompanyTenant): string {
  const jobId = createJob(aiCtx(tenant), "brain_analysis", ANALYSIS_STEPS);
  db.update(t.companies).set({ brainStatus: "analysing" }).where(eq(t.companies.id, tenant.company.id)).run();

  runInBackground(jobId, async (p) => {
    const company = tenant.company;
    const allSources = db.select().from(t.sources).where(inCompany(t.sources, tenant)).all();
    const readable: { id: string; label: string; text: string }[] = [];

    // 1-2. Website and named pages: actually fetch them.
    p.start("website");
    const site = allSources.find((s) => s.kind === "website");
    const pages = allSources.filter((s) => s.kind === "page");
    if (site?.url) {
      const { pages: read, failures } = await readWebsite(site.url, pages.map((pg) => pg.url!).filter(Boolean));
      p.start("pages");
      const combined = read.map((pg) => `### ${pg.title || pg.url}\nURL: ${pg.url}\n${pg.description ? `Description: ${pg.description}\n` : ""}Headings: ${pg.headings.slice(0, 15).join(" · ")}\n${pg.text.slice(0, 6000)}`).join("\n\n");
      if (read.length) {
        db.update(t.sources)
          .set({ status: "analysed", statusDetail: `${read.length} page${read.length === 1 ? "" : "s"} read`, extractedText: combined.slice(0, 80_000), pagesRead: read.map((pg) => ({ url: pg.url, title: pg.title || pg.url })), lastAnalysedAt: new Date() })
          .where(eq(t.sources.id, site.id))
          .run();
        readable.push({ id: site.id, label: `Website (${read.length} pages)`, text: combined });
      } else {
        db.update(t.sources)
          .set({ status: "failed", statusDetail: failures[0]?.reason ?? "The website couldn't be read." })
          .where(eq(t.sources.id, site.id))
          .run();
      }
      for (const pg of pages) {
        const ok = read.find((r) => r.url.replace(/\/$/, "") === pg.url?.replace(/\/$/, ""));
        const fail = failures.find((f) => f.url === pg.url);
        db.update(t.sources)
          .set(ok ? { status: "analysed", statusDetail: "Read", lastAnalysedAt: new Date() } : { status: fail ? "failed" : "analysed", statusDetail: fail?.reason ?? "Read as part of the website" })
          .where(eq(t.sources.id, pg.id))
          .run();
      }
      p.step("website", read.length ? "done" : "failed", read.length ? `${read.length} page${read.length === 1 ? "" : "s"} read` : failures[0]?.reason);
      p.step("pages", "done", read.length > 1 ? read.slice(1, 4).map((r) => r.title || r.url).join(", ") : "No extra pages found");
    } else {
      p.step("website", "skipped", "No website added");
      p.step("pages", "skipped");
    }

    // 3. Documents: text was extracted at upload time.
    p.start("documents");
    const docs = allSources.filter((s) => s.kind === "document");
    for (const d of docs) if (d.extractedText) readable.push({ id: d.id, label: `Document: ${d.label}`, text: d.extractedText });
    p.step("documents", docs.length ? "done" : "skipped", docs.length ? `${docs.filter((d) => d.extractedText).length} of ${docs.length} readable` : "No documents added");

    // 4. Social profiles: we only analyse what we're authorised to read.
    p.start("profiles");
    const socials = allSources.filter((s) => s.kind === "social");
    p.step(
      "profiles",
      socials.length ? "done" : "skipped",
      socials.length ? `${socials.length} profile${socials.length === 1 ? "" : "s"} saved — content analysis needs an authorised connection` : "No profiles added",
    );

    // 5. Understand.
    p.start("understand");
    const userNote = company.description?.trim();
    if (!aiConfigured()) {
      const facts = basicExtraction(tenant, userNote);
      replaceGeneratedFacts(tenant, facts);
      db.update(t.companies).set({ brainStatus: "review", brainAnalysedAt: new Date(), summary: userNote || null }).where(eq(t.companies.id, company.id)).run();
      p.step("understand", "done", "Basic analysis only — AI isn't connected, so we captured what your sources say directly");
      p.finish({ facts: facts.length, mode: "basic" }, true);
      return;
    }
    if (!readable.length && !userNote) {
      db.update(t.companies).set({ brainStatus: "empty" }).where(eq(t.companies.id, company.id)).run();
      throw new Error("There wasn't anything to analyse yet. Add a description, website or document.");
    }

    const u = await understandCompany(aiCtx(tenant), company, readable);
    p.start("save");
    const valid = new Set(readable.map((r) => r.id));
    const facts: (typeof t.brainFacts.$inferInsert)[] = [
      ...u.facts.map((f) => ({
        id: newId("bf"),
        ...tenantCols(tenant),
        section: f.section,
        field: f.field,
        value: f.value,
        // A "confirmed" claim with no real source is downgraded to inferred.
        knowledge: f.knowledge === "confirmed" && !f.source_ids.some((s) => valid.has(s)) && !userNote ? ("inferred" as const) : f.knowledge,
        rationale: f.rationale,
        sourceIds: f.source_ids.filter((s) => valid.has(s)),
        origin: "ai" as const,
      })),
      ...u.unknowns.map((q) => ({
        id: newId("bf"),
        ...tenantCols(tenant),
        section: q.section,
        field: q.field,
        value: q.question,
        knowledge: "unknown" as const,
        rationale: null,
        sourceIds: [],
        origin: "ai" as const,
      })),
    ];
    replaceGeneratedFacts(tenant, facts);
    db.update(t.companies).set({ brainStatus: "review", brainAnalysedAt: new Date(), summary: u.summary }).where(eq(t.companies.id, company.id)).run();
    audit(tenant, {
      entityType: "company_brain",
      entityId: company.id,
      action: "generated",
      source: "ai",
      summary: `Company Brain built from ${readable.length} source${readable.length === 1 ? "" : "s"} (${facts.length} statements)`,
    });
    p.finish({ facts: facts.length, mode: "ai" });
  });
  return jobId;
}

function replaceGeneratedFacts(tenant: CompanyTenant, facts: (typeof t.brainFacts.$inferInsert)[]) {
  db.transaction((tx) => {
    tx.delete(t.brainFacts).where(inCompany(t.brainFacts, tenant, inArray(t.brainFacts.origin, ["ai", "extraction"]))).run();
    if (facts.length) tx.insert(t.brainFacts).values(facts).run();
  });
}

/** Without AI we only record what sources state directly — no guessing. */
function basicExtraction(tenant: CompanyTenant, userNote?: string) {
  const facts: (typeof t.brainFacts.$inferInsert)[] = [];
  const add = (field: string, value: string, sourceIds: string[], rationale: string) =>
    facts.push({ id: newId("bf"), ...tenantCols(tenant), section: "business", field, value, knowledge: "confirmed", rationale, sourceIds, origin: "extraction" });
  const site = db.select().from(t.sources).where(inCompany(t.sources, tenant, eq(t.sources.kind, "website"))).get();
  if (site?.extractedText) {
    const desc = site.extractedText.match(/Description: (.+)/)?.[1];
    if (desc) add("what_they_do", desc, [site.id], "Your website's own description");
    const headings = [...site.extractedText.matchAll(/Headings: (.+)/g)].flatMap((m) => m[1].split(" · ")).filter((h) => h.split(" ").length <= 6);
    if (headings.length) add("services", [...new Set(headings)].slice(0, 8).join(", "), [site.id], "Headings on your website pages — please check these are services");
  }
  if (userNote && !facts.some((f) => f.field === "what_they_do")) {
    facts.push({ id: newId("bf"), ...tenantCols(tenant), section: "business", field: "what_they_do", value: userNote, knowledge: "confirmed", rationale: "What you told us", sourceIds: [], origin: "extraction" });
  }
  return facts;
}

export function markBrainReviewed(tenant: CompanyTenant) {
  db.update(t.companies).set({ brainStatus: "ready" }).where(and(eq(t.companies.id, tenant.company.id), eq(t.companies.workspaceId, tenant.workspace.id))).run();
  audit(tenant, { entityType: "company_brain", entityId: tenant.company.id, action: "reviewed", source: "user", summary: "Company Brain reviewed and approved" });
}
