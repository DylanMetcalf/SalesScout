import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, inArray, isNull, like, lte, max, ne, or, sql } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { newId } from "@/lib/ids";
import { domainOf, normaliseUrl } from "@/lib/security/url";
import { adminEmails } from "@/lib/access";
import type { AiContext } from "@/lib/ai/core";
import { DOC_KINDS, OPEN_STAGES, STAGE_META, type DocKind, type ProblemContext, type Stage } from "./types";

/**
 * Opportunities belong to the installation's operators, not to a customer
 * tenant. Every reader and writer here is reached only through requireAdmin /
 * assertAdmin, except the intake functions, which only ever create or touch
 * the one record a visitor's own reference points to.
 */

export type Opportunity = typeof t.opportunities.$inferSelect;
export const PRIVACY_VERSION = "2026-10";

// Intake ---------------------------------------------------------------------

export type IntakeInput = {
  problem: string;
  context: ProblemContext;
  name: string;
  email: string;
  companyName: string | null;
  website: string | null;
  role: string | null;
  phone: string | null;
  region: string | null;
  contactPreference: "email" | "phone" | "whatsapp";
  idempotencyKey: string;
};

/** Saves a submission. The same idempotency key always returns the same record. */
export function createFromIntake(input: IntakeInput): { ref: string; created: boolean } {
  const existing = db.select({ ref: t.opportunities.ref }).from(t.opportunities).where(eq(t.opportunities.idempotencyKey, input.idempotencyKey)).get();
  if (existing) return { ref: existing.ref, created: false };
  const id = newId("opp");
  const ref = randomBytes(12).toString("base64url");
  try {
    db.transaction((tx) => {
      tx.insert(t.opportunities)
        .values({ id, ref, ...input, website: normaliseUrl(input.website), email: input.email.toLowerCase(), consentAt: new Date(), privacyVersion: PRIVACY_VERSION, source: "website" })
        .run();
      tx.insert(t.opportunityItems).values({ id: newId("oi"), opportunityId: id, kind: "activity", body: "Problem submitted on the website", by: "customer" }).run();
    });
  } catch (err) {
    // A double submit that raced past the check above: return the first one.
    const raced = db.select({ ref: t.opportunities.ref }).from(t.opportunities).where(eq(t.opportunities.idempotencyKey, input.idempotencyKey)).get();
    if (raced) return { ref: raced.ref, created: false };
    throw err;
  }
  return { ref, created: true };
}

const REF_LIFETIME = 7 * 86_400_000;

/** A visitor's reference works for a week; after that it does nothing. */
function byLiveRef(ref: string) {
  const o = db.select().from(t.opportunities).where(eq(t.opportunities.ref, ref)).get();
  return o && Date.now() - o.createdAt.getTime() <= REF_LIFETIME ? o : null;
}

/** What a visitor may see again about their own submission: only what they typed, only for a week. */
export function publicSummary(ref: string) {
  const o = byLiveRef(ref);
  if (!o) return null;
  return { firstName: o.name.split(/\s+/)[0], name: o.name, email: o.email, companyName: o.companyName, problem: o.problem, context: o.context, contactPreference: o.contactPreference, callRequested: Boolean(o.callRequestedAt) };
}

export function recordVisitorStep(ref: string, step: "call_requested" | "booking_opened") {
  const row = byLiveRef(ref);
  if (!row) return false;
  const o = { id: row.id, call: row.callRequestedAt, booking: row.bookingOpenedAt };
  if (step === "call_requested" && !o.call) {
    db.update(t.opportunities).set({ callRequestedAt: new Date(), updatedAt: new Date() }).where(eq(t.opportunities.id, o.id)).run();
    logActivity(o.id, "Asked us to get in touch to arrange a conversation", "customer");
  }
  if (step === "booking_opened" && !o.booking) {
    db.update(t.opportunities).set({ bookingOpenedAt: new Date(), updatedAt: new Date() }).where(eq(t.opportunities.id, o.id)).run();
    logActivity(o.id, "Opened the booking calendar (a booking isn't confirmed until it appears in your calendar)", "customer");
  }
  return true;
}

// Operator reads ------------------------------------------------------------

export function opportunityByRef(ref: string): Opportunity | null {
  return db.select().from(t.opportunities).where(eq(t.opportunities.ref, ref)).get() ?? null;
}

export function getOpportunity(id: string): Opportunity {
  const o = db.select().from(t.opportunities).where(eq(t.opportunities.id, id)).get();
  if (!o) throw new Error("That opportunity no longer exists.");
  return o;
}

export function listOpportunities(f: { q?: string; stage?: string }) {
  const where = [];
  if (f.stage === "open") where.push(inArray(t.opportunities.stage, OPEN_STAGES));
  else if (f.stage && f.stage in STAGE_META) where.push(eq(t.opportunities.stage, f.stage as Stage));
  if (f.q?.trim()) {
    const q = `%${f.q.trim().replace(/[%_]/g, "")}%`;
    where.push(or(like(t.opportunities.name, q), like(t.opportunities.email, q), like(t.opportunities.companyName, q), like(t.opportunities.problem, q)));
  }
  const rows = db
    .select({
      id: t.opportunities.id,
      stage: t.opportunities.stage,
      name: t.opportunities.name,
      companyName: t.opportunities.companyName,
      website: t.opportunities.website,
      problem: t.opportunities.problem,
      callRequestedAt: t.opportunities.callRequestedAt,
      analysed: sql<number>`${t.opportunities.analysis} is not null`,
      createdAt: t.opportunities.createdAt,
      updatedAt: t.opportunities.updatedAt,
    })
    .from(t.opportunities)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(t.opportunities.updatedAt))
    .limit(200)
    .all();
  const nextDue = new Map(
    rows.length
      ? db
          .select({ id: t.opportunityItems.opportunityId, due: sql<number>`min(${t.opportunityItems.dueAt})` })
          .from(t.opportunityItems)
          .where(and(inArray(t.opportunityItems.opportunityId, rows.map((r) => r.id)), eq(t.opportunityItems.kind, "task"), isNull(t.opportunityItems.doneAt)))
          .groupBy(t.opportunityItems.opportunityId)
          .all()
          .map((r) => [r.id, r.due ? new Date(Number(r.due)) : null])
      : [],
  );
  return rows.map((r) => ({ ...r, analysed: Boolean(r.analysed), nextDue: nextDue.get(r.id) ?? null }));
}

/** Real counts for the overview. Nothing estimated. */
export function overview() {
  const byStage = Object.fromEntries(
    db.select({ stage: t.opportunities.stage, n: sql<number>`count(*)` }).from(t.opportunities).groupBy(t.opportunities.stage).all().map((r) => [r.stage, Number(r.n)]),
  ) as Partial<Record<Stage, number>>;
  const callsRequested = Number(
    db.select({ n: sql<number>`count(*)` }).from(t.opportunities).where(and(sql`${t.opportunities.callRequestedAt} is not null`, inArray(t.opportunities.stage, ["new", "reviewing"]))).get()!.n,
  );
  const dueTasks = db
    .select({ id: t.opportunityItems.id, body: t.opportunityItems.body, dueAt: t.opportunityItems.dueAt, opportunityId: t.opportunityItems.opportunityId, name: t.opportunities.name, companyName: t.opportunities.companyName })
    .from(t.opportunityItems)
    .innerJoin(t.opportunities, eq(t.opportunities.id, t.opportunityItems.opportunityId))
    .where(and(eq(t.opportunityItems.kind, "task"), isNull(t.opportunityItems.doneAt), lte(t.opportunityItems.dueAt, new Date(Date.now() + 86_400_000))))
    .orderBy(asc(t.opportunityItems.dueAt))
    .limit(8)
    .all();
  const recent = db
    .select({ body: t.opportunityItems.body, createdAt: t.opportunityItems.createdAt, opportunityId: t.opportunityItems.opportunityId, name: t.opportunities.name, companyName: t.opportunities.companyName })
    .from(t.opportunityItems)
    .innerJoin(t.opportunities, eq(t.opportunities.id, t.opportunityItems.opportunityId))
    .where(eq(t.opportunityItems.kind, "activity"))
    .orderBy(desc(t.opportunityItems.createdAt))
    .limit(8)
    .all();
  return { byStage, callsRequested, dueTasks, recent };
}

export function itemsOf(id: string) {
  return db.select().from(t.opportunityItems).where(eq(t.opportunityItems.opportunityId, id)).orderBy(desc(t.opportunityItems.createdAt)).all();
}

export function documentsOf(id: string) {
  return db
    .select({ id: t.opportunityDocuments.id, kind: t.opportunityDocuments.kind, version: t.opportunityDocuments.version, title: t.opportunityDocuments.title, createdAt: t.opportunityDocuments.createdAt, createdBy: t.opportunityDocuments.createdBy })
    .from(t.opportunityDocuments)
    .where(eq(t.opportunityDocuments.opportunityId, id))
    .orderBy(desc(t.opportunityDocuments.createdAt))
    .all();
}

export function getDocument(docId: string) {
  const d = db.select().from(t.opportunityDocuments).where(eq(t.opportunityDocuments.id, docId)).get();
  if (!d) throw new Error("That document no longer exists.");
  return d;
}

/** Other problems from the same organisation: same website domain or same email domain (never by name alone). */
export function relatedOpportunities(o: Opportunity) {
  const site = domainOf(o.website);
  const mailDomain = o.email.split("@")[1];
  const freeMail = /^(gmail|googlemail|outlook|hotmail|live|yahoo|icloud|me|proton|protonmail|aol|mweb|telkomsa|webmail)\./i.test(mailDomain ?? "");
  const conds = [];
  if (site) conds.push(like(t.opportunities.website, `%${site}%`));
  if (mailDomain && !freeMail) conds.push(like(t.opportunities.email, `%@${mailDomain}`));
  if (!conds.length) return [];
  return db
    .select({ id: t.opportunities.id, problem: t.opportunities.problem, stage: t.opportunities.stage, createdAt: t.opportunities.createdAt })
    .from(t.opportunities)
    .where(and(ne(t.opportunities.id, o.id), or(...conds)))
    .orderBy(desc(t.opportunities.createdAt))
    .limit(10)
    .all();
}

// Operator writes -----------------------------------------------------------

export function logActivity(opportunityId: string, body: string, by: string) {
  db.insert(t.opportunityItems).values({ id: newId("oi"), opportunityId, kind: "activity", body, by }).run();
}

export function touch(id: string, patch: Partial<typeof t.opportunities.$inferInsert> = {}) {
  db.update(t.opportunities).set({ ...patch, updatedAt: new Date() }).where(eq(t.opportunities.id, id)).run();
}

export function setStage(id: string, stage: Stage, by: string, reason?: string) {
  const o = getOpportunity(id);
  if (o.stage === stage) return;
  touch(id, { stage, ...(reason !== undefined && { closedReason: reason || null }), ...(stage === "accepted" && !o.projectStatus && { projectStatus: "not_started" }) });
  logActivity(id, `Moved from ${STAGE_META[o.stage].label} to ${STAGE_META[stage].label}${reason ? `: ${reason}` : ""}`, by);
}

/** Freezes the current content as the next version of a document. */
export function snapshotDocument(opportunityId: string, kind: DocKind, content: Record<string, unknown>, by: string) {
  const o = getOpportunity(opportunityId);
  return db.transaction((tx) => {
    const last = tx.select({ v: max(t.opportunityDocuments.version) }).from(t.opportunityDocuments).where(and(eq(t.opportunityDocuments.opportunityId, opportunityId), eq(t.opportunityDocuments.kind, kind))).get();
    const version = Number(last?.v ?? 0) + 1;
    const id = newId("doc");
    tx.insert(t.opportunityDocuments)
      .values({ id, opportunityId, kind, version, title: `${DOC_KINDS[kind]}: ${o.companyName || o.name}`, content, createdBy: by })
      .run();
    tx.insert(t.opportunityItems).values({ id: newId("oi"), opportunityId, kind: "activity", body: `Created ${DOC_KINDS[kind]} v${version}`, by }).run();
    tx.update(t.opportunities).set({ updatedAt: new Date() }).where(eq(t.opportunities.id, opportunityId)).run();
    return { id, version };
  });
}

/** Erases an opportunity and everything attached to it (e.g. a POPIA deletion request). */
export function deleteOpportunity(id: string) {
  const o = getOpportunity(id);
  db.transaction((tx) => {
    tx.delete(t.opportunities).where(eq(t.opportunities.id, id)).run();
    if (o.legacyEnquiryId) tx.delete(t.enquiries).where(eq(t.enquiries.id, o.legacyEnquiryId)).run();
  });
}

/** The operator's own AI context, for work started without a signed-in operator (auto-analysis). */
export function operatorContext(): AiContext | null {
  const emails = adminEmails();
  const user = emails.length
    ? db.select({ accountId: t.users.accountId }).from(t.users).where(inArray(t.users.email, emails)).orderBy(asc(t.users.createdAt)).limit(1).get()
    : db.select({ accountId: t.accounts.id }).from(t.accounts).orderBy(asc(t.accounts.createdAt)).limit(1).get();
  if (!user) return null;
  const ws = db.select({ id: t.workspaces.id }).from(t.workspaces).where(eq(t.workspaces.accountId, user.accountId)).orderBy(asc(t.workspaces.createdAt)).limit(1).get();
  return ws ? { accountId: user.accountId, workspaceId: ws.id, companyId: null } : null;
}
