import "server-only";
import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { PROBLEM_REASONS } from "@/lib/feedback-reasons";

const REPORT_REASONS = Object.keys(PROBLEM_REASONS);

/**
 * Installation-wide operational metrics for the administrator: counts, tokens
 * and estimated costs only, never prospect content. Costs are estimates from
 * configured prices; null means "prices not configured", not zero.
 */
const since = (days: number) => new Date(Date.now() - days * 86_400_000);
const n = (v: unknown) => Number(v ?? 0);

export function spendByAgent(days = 30) {
  return db
    .select({
      agent: t.aiInteractions.agent,
      model: t.aiInteractions.model,
      calls: sql<number>`count(*)`,
      failed: sql<number>`sum(case when ${t.aiInteractions.status} != 'ok' then 1 else 0 end)`,
      input: sql<number>`sum(${t.aiInteractions.inputTokens})`,
      cached: sql<number>`sum(${t.aiInteractions.cacheReadTokens})`,
      output: sql<number>`sum(${t.aiInteractions.outputTokens})`,
      searches: sql<number>`sum(${t.aiInteractions.webSearches})`,
      fetches: sql<number>`sum(${t.aiInteractions.webFetches})`,
      micros: sql<number | null>`sum(${t.aiInteractions.costUsdMicros})`,
      unpriced: sql<number>`sum(case when ${t.aiInteractions.costUsdMicros} is null then 1 else 0 end)`,
      failedMicros: sql<number | null>`sum(case when ${t.aiInteractions.status} != 'ok' then ${t.aiInteractions.costUsdMicros} end)`,
      avgMs: sql<number>`avg(${t.aiInteractions.durationMs})`,
    })
    .from(t.aiInteractions)
    .where(gte(t.aiInteractions.createdAt, since(days)))
    .groupBy(t.aiInteractions.agent, t.aiInteractions.model)
    .orderBy(desc(sql`sum(${t.aiInteractions.inputTokens} + ${t.aiInteractions.outputTokens})`))
    .all()
    .map((r) => ({ ...r, calls: n(r.calls), failed: n(r.failed), input: n(r.input), cached: n(r.cached), output: n(r.output), searches: n(r.searches), fetches: n(r.fetches), usd: r.micros === null ? null : n(r.micros) / 1e6, unpriced: n(r.unpriced), failedUsd: r.failedMicros === null ? null : n(r.failedMicros) / 1e6, avgMs: n(r.avgMs) }));
}

export function recentRuns(limit = 25) {
  const runs = db
    .select({ run: t.searchRuns, accountName: t.accounts.name })
    .from(t.searchRuns)
    .innerJoin(t.workspaces, eq(t.workspaces.id, t.searchRuns.workspaceId))
    .innerJoin(t.accounts, eq(t.accounts.id, t.workspaces.accountId))
    .orderBy(desc(t.searchRuns.createdAt))
    .limit(limit)
    .all();
  const ids = runs.map((r) => r.run.id);
  if (!ids.length) return [];
  const spend = db
    .select({ runId: t.aiInteractions.runId, tokens: sql<number>`sum(${t.aiInteractions.inputTokens} + ${t.aiInteractions.outputTokens})`, searches: sql<number>`sum(${t.aiInteractions.webSearches})`, micros: sql<number | null>`sum(${t.aiInteractions.costUsdMicros})`, calls: sql<number>`count(*)` })
    .from(t.aiInteractions)
    .where(inArray(t.aiInteractions.runId, ids))
    .groupBy(t.aiInteractions.runId)
    .all();
  const kept = db
    .select({ runId: t.prospects.searchRunId, n: sql<number>`count(*)` })
    .from(t.prospects)
    .where(and(inArray(t.prospects.searchRunId, ids), eq(t.prospects.inCrm, true)))
    .groupBy(t.prospects.searchRunId)
    .all();
  return runs.map(({ run, accountName }) => {
    const s = spend.find((x) => x.runId === run.id);
    const k = n(kept.find((x) => x.runId === run.id)?.n);
    const usd = s?.micros == null ? null : n(s.micros) / 1e6;
    return {
      id: run.id,
      accountName,
      createdAt: run.createdAt,
      status: run.status,
      contactMode: run.contactMode,
      batches: run.batches,
      discovered: run.discovered,
      duplicates: run.duplicates,
      previews: run.relevant + run.rejected,
      kept: k,
      tokens: n(s?.tokens),
      searches: n(s?.searches),
      calls: n(s?.calls),
      usd,
      usdPerKept: usd !== null && k > 0 ? usd / k : null,
      minutes: run.completedAt ? Math.round((run.completedAt.getTime() - run.createdAt.getTime()) / 60_000) : null,
      error: run.error,
    };
  });
}

export function qualityMetrics(days = 30) {
  const runs = db
    .select({ discovered: sql<number>`sum(${t.searchRuns.discovered})`, duplicates: sql<number>`sum(${t.searchRuns.duplicates})`, relevant: sql<number>`sum(${t.searchRuns.relevant})`, rejected: sql<number>`sum(${t.searchRuns.rejected})` })
    .from(t.searchRuns)
    .where(gte(t.searchRuns.createdAt, since(days)))
    .get()!;
  const previews = db
    .select({ id: t.prospects.id, inCrm: t.prospects.inCrm, status: t.prospects.status })
    .from(t.prospects)
    .where(and(gte(t.prospects.createdAt, since(days)), inArray(t.prospects.origin, ["web_research", "similar"]), eq(t.prospects.isExample, false)))
    .all();
  const ids = previews.map((p) => p.id);
  const contacts = ids.length ? db.select({ prospectId: t.contacts.prospectId, name: t.contacts.name, source: t.contacts.sourceUrl, email: t.contacts.email }).from(t.contacts).where(inArray(t.contacts.prospectId, ids)).all() : [];
  const withNamed = new Set(contacts.filter((c) => c.name && c.source).map((c) => c.prospectId)).size;
  const withEmail = new Set(contacts.filter((c) => c.email).map((c) => c.prospectId)).size;
  const reports = db
    .select({ reason: t.feedback.dimension, n: sql<number>`count(*)`, open: sql<number>`sum(case when ${t.feedback.resolvedAt} is null then 1 else 0 end)` })
    .from(t.feedback)
    .where(and(eq(t.feedback.kind, "correction"), gte(t.feedback.createdAt, since(days)), inArray(t.feedback.dimension, REPORT_REASONS)))
    .groupBy(t.feedback.dimension)
    .all();
  const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "—");
  const kept = previews.filter((p) => p.inCrm).length;
  return {
    rows: [
      { label: "Duplicate rate", value: pct(n(runs.duplicates), n(runs.discovered)), hint: "Found companies you already knew or had excluded" },
      { label: "Qualification pass rate", value: pct(n(runs.relevant), n(runs.relevant) + n(runs.rejected)), hint: "Researched companies that fit" },
      { label: "Named contact on a source", value: pct(withNamed, previews.length), hint: "Previews with a named, sourced person" },
      { label: "Published email found", value: pct(withEmail, previews.length), hint: "Previews with an email from a public page" },
      { label: "Kept (acceptance) rate", value: pct(kept, previews.length), hint: `${kept} of ${previews.length} previews kept` },
    ],
    reports: reports.map((r) => ({ reason: r.reason!, n: n(r.n), open: n(r.open) })),
  };
}

/** Where kept prospects are now, as reported by users. Not proof of cause and effect. */
export function funnel() {
  return db
    .select({ status: t.prospects.status, n: sql<number>`count(*)` })
    .from(t.prospects)
    .where(and(eq(t.prospects.inCrm, true), eq(t.prospects.isExample, false)))
    .groupBy(t.prospects.status)
    .all()
    .map((r) => ({ status: r.status, n: n(r.n) }));
}

export function stuckJobs() {
  return db
    .select({ id: t.jobs.id, type: t.jobs.type, updatedAt: t.jobs.updatedAt })
    .from(t.jobs)
    .where(and(inArray(t.jobs.status, ["queued", "running"]), sql`${t.jobs.updatedAt} < ${Date.now() - 20 * 60_000}`))
    .all();
}

/**
 * Spend and results per account: the basis for unit economics. "Server" spend is
 * the business's cost; "own key" spend is billed to the customer by Anthropic.
 */
export function spendByAccount(days = 30) {
  const spend = db
    .select({
      accountId: t.aiInteractions.accountId,
      calls: sql<number>`count(*)`,
      tokens: sql<number>`sum(${t.aiInteractions.inputTokens} + ${t.aiInteractions.outputTokens})`,
      micros: sql<number | null>`sum(${t.aiInteractions.costUsdMicros})`,
      serverCalls: sql<number>`sum(case when ${t.aiInteractions.keySource} = 'account' then 0 else 1 end)`,
      unpriced: sql<number>`sum(case when ${t.aiInteractions.costUsdMicros} is null then 1 else 0 end)`,
    })
    .from(t.aiInteractions)
    .where(gte(t.aiInteractions.createdAt, since(days)))
    .groupBy(t.aiInteractions.accountId)
    .all();
  if (!spend.length) return [];
  const ids = spend.map((r) => r.accountId);
  const names = new Map(db.select({ id: t.accounts.id, name: t.accounts.name, plan: t.accounts.plan }).from(t.accounts).where(inArray(t.accounts.id, ids)).all().map((a) => [a.id, a]));
  const kept = new Map(
    db
      .select({ accountId: t.workspaces.accountId, n: sql<number>`count(*)` })
      .from(t.prospects)
      .innerJoin(t.workspaces, eq(t.workspaces.id, t.prospects.workspaceId))
      .where(and(eq(t.prospects.inCrm, true), eq(t.prospects.isExample, false), gte(t.prospects.createdAt, since(days)), inArray(t.workspaces.accountId, ids)))
      .groupBy(t.workspaces.accountId)
      .all()
      .map((r) => [r.accountId, n(r.n)]),
  );
  return spend
    .map((r) => {
      const usd = r.micros === null ? null : n(r.micros) / 1e6;
      const k = kept.get(r.accountId) ?? 0;
      const calls = n(r.calls);
      const keySource = n(r.serverCalls) === calls ? "Server" : n(r.serverCalls) === 0 ? "Own key" : "Both";
      return { accountId: r.accountId, name: names.get(r.accountId)?.name ?? "Deleted account", plan: names.get(r.accountId)?.plan ?? "—", calls, tokens: n(r.tokens), usd, unpriced: n(r.unpriced), kept: k, usdPerKept: usd !== null && k ? usd / k : null, keySource };
    })
    .sort((a, b) => b.tokens - a.tokens);
}

/** Reported problems no operator has triaged yet, newest first. */
export function openReports(limit = 20) {
  return db
    .select({ id: t.feedback.id, reason: t.feedback.dimension, note: t.feedback.reason, createdAt: t.feedback.createdAt, prospect: t.prospects.name, account: t.accounts.name })
    .from(t.feedback)
    .innerJoin(t.workspaces, eq(t.workspaces.id, t.feedback.workspaceId))
    .innerJoin(t.accounts, eq(t.accounts.id, t.workspaces.accountId))
    .leftJoin(t.prospects, eq(t.prospects.id, t.feedback.prospectId))
    .where(and(eq(t.feedback.kind, "correction"), inArray(t.feedback.dimension, REPORT_REASONS), isNull(t.feedback.resolvedAt)))
    .orderBy(desc(t.feedback.createdAt))
    .limit(limit)
    .all();
}
