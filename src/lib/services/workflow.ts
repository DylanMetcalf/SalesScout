import "server-only";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db, t } from "@/lib/db";
import type { CrmStatus } from "@/lib/db/schema";
import { newId } from "@/lib/ids";
import { aiConfigured } from "@/lib/ai/core";
import { draftOutreach } from "@/lib/ai/agents";
import { audit } from "@/lib/audit";
import { STATUS_META } from "@/lib/status";
import { inCompany, tenantCols, type CompanyTenant } from "@/lib/tenant";
import { aiCtx, getDigest } from "./brain";
import { learnFromEdit, learnFromFeedback, preferencesFor } from "./learning";

export function getProspect(tenant: CompanyTenant, id: string) {
  return db.select().from(t.prospects).where(inCompany(t.prospects, tenant, eq(t.prospects.id, id))).get();
}

function mustGetProspect(tenant: CompanyTenant, id: string) {
  const p = getProspect(tenant, id);
  if (!p) throw new Error("Prospect not found.");
  return p;
}

function activity(tenant: CompanyTenant, prospectId: string | null, type: typeof t.activities.$inferInsert.type, title: string, body?: string | null) {
  db.insert(t.activities).values({ id: newId("act"), ...tenantCols(tenant), prospectId, userId: tenant.user.id, type, title, body: body ?? null }).run();
}

export function setStatus(tenant: CompanyTenant, id: string, status: CrmStatus) {
  const p = mustGetProspect(tenant, id);
  if (p.status === status) return;
  const contacted = ["contacted", "replied", "meeting"].includes(status);
  db.update(t.prospects)
    .set({ status, inCrm: status === "rejected" ? p.inCrm : true, updatedAt: new Date(), ...(contacted && !p.lastContactAt ? { lastContactAt: new Date() } : {}) })
    .where(eq(t.prospects.id, p.id))
    .run();
  activity(tenant, p.id, "status", `Moved to ${STATUS_META[status].label}`, `From ${STATUS_META[p.status].label}`);
  if (status === "won" || status === "lost") {
    db.insert(t.feedback).values({ id: newId("fb"), ...tenantCols(tenant), prospectId: p.id, userId: tenant.user.id, kind: "outcome", value: status }).run();
  }
  audit(tenant, { entityType: "prospect", entityId: p.id, action: "status_changed", source: "user", summary: `${p.name}: ${STATUS_META[p.status].label} → ${STATUS_META[status].label}` });
}

export function addToCrm(tenant: CompanyTenant, id: string) {
  const p = mustGetProspect(tenant, id);
  db.update(t.prospects)
    .set({ inCrm: true, status: p.status === "new" || p.status === "rejected" ? "reviewed" : p.status, rejectionReason: null, ownerUserId: p.ownerUserId ?? tenant.user.id, updatedAt: new Date() })
    .where(eq(t.prospects.id, p.id))
    .run();
  db.insert(t.feedback).values({ id: newId("fb"), ...tenantCols(tenant), prospectId: p.id, searchRunId: p.searchRunId, userId: tenant.user.id, kind: "keep" }).run();
  activity(tenant, p.id, "status", "Added to your pipeline");
}

/** Records a triage decision on a discovered prospect and learns from it. */
export function giveFeedback(
  tenant: CompanyTenant,
  id: string,
  kind: "not_relevant" | "already_known" | "exclude" | "competitor",
  reason?: string,
) {
  const p = mustGetProspect(tenant, id);
  db.transaction((tx) => {
    tx.insert(t.feedback)
      .values({ id: newId("fb"), ...tenantCols(tenant), prospectId: p.id, searchRunId: p.searchRunId, userId: tenant.user.id, kind, dimension: p.industry ? "industry" : null, value: p.industry, reason: reason ?? null })
      .run();
    tx.update(t.prospects)
      .set({
        status: "rejected",
        rejectionReason: { not_relevant: "Not relevant", already_known: "Already known", exclude: "Excluded", competitor: "Competitor" }[kind] + (reason ? `: ${reason}` : ""),
        updatedAt: new Date(),
      })
      .where(eq(t.prospects.id, p.id))
      .run();
    if (kind === "exclude" || kind === "competitor" || kind === "already_known") {
      tx.insert(t.exclusions)
        .values({ id: newId("ex"), ...tenantCols(tenant), kind: kind === "competitor" ? "competitor" : kind === "already_known" ? "customer" : "company", value: p.domain ?? p.name, reason: reason ?? null })
        .run();
    }
  });
  activity(tenant, p.id, "feedback", { not_relevant: "Marked not relevant", already_known: "Marked as already known", exclude: "Excluded", competitor: "Marked as a competitor" }[kind], reason);
  audit(tenant, { entityType: "prospect", entityId: p.id, action: `feedback_${kind}`, source: "user", summary: `${p.name}: ${kind.replace("_", " ")}${reason ? ` (${reason})` : ""}` });
  learnFromFeedback(tenant);
}

export function restoreProspect(tenant: CompanyTenant, id: string) {
  const p = mustGetProspect(tenant, id);
  db.update(t.prospects).set({ status: p.inCrm ? "reviewed" : "new", rejectionReason: null, updatedAt: new Date() }).where(eq(t.prospects.id, p.id)).run();
  activity(tenant, p.id, "status", "Restored");
}

export function addNote(tenant: CompanyTenant, id: string, body: string) {
  const p = mustGetProspect(tenant, id);
  activity(tenant, p.id, "note", "Note", body);
}

export function logTouch(tenant: CompanyTenant, id: string, type: "call" | "email" | "meeting", body?: string) {
  const p = mustGetProspect(tenant, id);
  db.update(t.prospects).set({ lastContactAt: new Date(), updatedAt: new Date() }).where(eq(t.prospects.id, p.id)).run();
  activity(tenant, p.id, type, { call: "Logged a call", email: "Logged an email", meeting: "Logged a meeting" }[type], body);
}

export function removeContact(tenant: CompanyTenant, contactId: string) {
  const c = db.select().from(t.contacts).where(inCompany(t.contacts, tenant, eq(t.contacts.id, contactId))).get();
  if (!c) return;
  db.delete(t.contacts).where(eq(t.contacts.id, c.id)).run();
  db.insert(t.feedback).values({ id: newId("fb"), ...tenantCols(tenant), prospectId: c.prospectId, userId: tenant.user.id, kind: "role_removed", dimension: "role", value: c.role }).run();
  learnFromFeedback(tenant);
}

export function addContact(tenant: CompanyTenant, prospectId: string, input: { name: string | null; role: string; email: string | null; phone: string | null; profileUrl: string | null }) {
  mustGetProspect(tenant, prospectId);
  db.insert(t.contacts)
    .values({ id: newId("ct"), ...tenantCols(tenant), prospectId, ...input, relevance: "Added by you", knowledge: "confirmed", origin: "manual" })
    .run();
}

// Follow-ups -----------------------------------------------------------------

function syncNextFollowUp(tenant: CompanyTenant, prospectId: string) {
  const next = db
    .select({ dueAt: t.followUps.dueAt })
    .from(t.followUps)
    .where(inCompany(t.followUps, tenant, and(eq(t.followUps.prospectId, prospectId), isNull(t.followUps.completedAt))))
    .orderBy(asc(t.followUps.dueAt))
    .get();
  db.update(t.prospects).set({ nextFollowUpAt: next?.dueAt ?? null }).where(eq(t.prospects.id, prospectId)).run();
}

export function createFollowUp(tenant: CompanyTenant, input: { prospectId: string; title: string; dueAt: Date; notes?: string | null; contactId?: string | null }) {
  const p = mustGetProspect(tenant, input.prospectId);
  db.insert(t.followUps)
    .values({ id: newId("fu"), ...tenantCols(tenant), prospectId: p.id, contactId: input.contactId ?? null, userId: tenant.user.id, title: input.title, notes: input.notes ?? null, dueAt: input.dueAt })
    .run();
  if (!p.inCrm) db.update(t.prospects).set({ inCrm: true, status: p.status === "new" ? "reviewed" : p.status }).where(eq(t.prospects.id, p.id)).run();
  syncNextFollowUp(tenant, p.id);
  activity(tenant, p.id, "follow_up", `Follow-up scheduled: ${input.title}`, input.dueAt.toDateString());
}

export function setFollowUpDone(tenant: CompanyTenant, id: string, done: boolean) {
  const f = db.select().from(t.followUps).where(inCompany(t.followUps, tenant, eq(t.followUps.id, id))).get();
  if (!f) return;
  db.update(t.followUps).set({ completedAt: done ? new Date() : null }).where(eq(t.followUps.id, f.id)).run();
  syncNextFollowUp(tenant, f.prospectId);
  if (done) activity(tenant, f.prospectId, "follow_up", `Follow-up done: ${f.title}`);
}

export function rescheduleFollowUp(tenant: CompanyTenant, id: string, dueAt: Date) {
  const f = db.select().from(t.followUps).where(inCompany(t.followUps, tenant, eq(t.followUps.id, id))).get();
  if (!f) return;
  db.update(t.followUps).set({ dueAt }).where(eq(t.followUps.id, f.id)).run();
  syncNextFollowUp(tenant, f.prospectId);
}

// Sales brief ----------------------------------------------------------------

export function contactsOf(tenant: CompanyTenant, prospectId: string) {
  return db.select().from(t.contacts).where(inCompany(t.contacts, tenant, eq(t.contacts.prospectId, prospectId))).orderBy(asc(t.contacts.createdAt)).all();
}
export function evidenceOf(tenant: CompanyTenant, prospectId: string) {
  return db.select().from(t.evidence).where(inCompany(t.evidence, tenant, eq(t.evidence.prospectId, prospectId))).all();
}

/**
 * A one-minute read before making contact. Assembled directly from the
 * research (no extra AI call), so it can never say more than we know.
 */
export function buildSalesBrief(tenant: CompanyTenant, prospectId: string) {
  const p = mustGetProspect(tenant, prospectId);
  const people = contactsOf(tenant, p.id);
  const ev = evidenceOf(tenant, p.id);
  const content = {
    headline: `${p.name}${p.industry ? ` · ${p.industry}` : ""}${p.location ? ` · ${p.location}` : ""}`,
    whatTheyDo: p.whatTheyDo ?? "Not yet researched.",
    whyRelevant: p.whyRelevant ?? "Not yet assessed.",
    opportunity: p.potentialOpportunity ?? "Not yet assessed.",
    people: people.map((c) => `${c.name ?? "Unnamed"} — ${c.role}${c.name ? "" : " (role to find)"}: ${c.relevance}`),
    evidence: ev.map((e) => `${e.title}${e.url ? ` (${e.url})` : ""}${e.supports ? ` — supports: ${e.supports}` : ""}`),
    unknowns: p.unknowns,
    nextStep: p.suggestedNextStep ?? "Review the research, then decide whether to reach out.",
  };
  db.insert(t.salesBriefs).values({ id: newId("sb"), ...tenantCols(tenant), prospectId: p.id, content, generatedBy: "assembled" }).run();
  return content;
}

// Outreach -------------------------------------------------------------------

export async function createDraft(tenant: CompanyTenant, input: { prospectId: string; contactId: string | null; channel: "email" | "linkedin" | "call" | "follow_up" }) {
  const p = mustGetProspect(tenant, input.prospectId);
  const contact = input.contactId ? contactsOf(tenant, p.id).find((c) => c.id === input.contactId) : undefined;
  const prefs = preferencesFor(tenant).map((w) => w.rule);
  let subject: string | null = null;
  let body: string;
  let generatedBy: "ai" | "template" = "ai";

  if (aiConfigured(tenant.account.id)) {
    const r = await draftOutreach(aiCtx(tenant), {
      digest: getDigest(tenant),
      prospect: `${p.name} (${p.website ?? "no website"})\nWhat they do: ${p.whatTheyDo ?? "?"}\nWhy relevant: ${p.whyRelevant ?? "?"}\nPotential opportunity: ${p.potentialOpportunity ?? "?"}\nConfirmed facts: ${p.confirmedFacts.join("; ") || "none"}\nUnknowns: ${p.unknowns.join("; ") || "none"}`,
      contact: contact ? `${contact.name ?? "[Name]"}, ${contact.role}. Why them: ${contact.relevance}` : "[Name], a relevant decision maker",
      channel: input.channel,
      preferences: prefs,
      senderName: tenant.user.name,
    });
    subject = r.subject;
    body = r.body;
  } else {
    generatedBy = "template";
    const first = contact?.name?.split(" ")[0] ?? "[Name]";
    subject = input.channel === "email" || input.channel === "follow_up" ? `${tenant.company.name} × ${p.name}` : null;
    body = [
      `Hi ${first},`,
      "",
      p.whatTheyDo ? `I came across ${p.name} — ${lowerFirst(p.whatTheyDo)}` : `I came across ${p.name}.`,
      "",
      `At ${tenant.company.name}, ${lowerFirst(tenant.company.summary ?? tenant.company.description ?? "[one line on what you do]")}`,
      p.potentialOpportunity ? `\n${p.potentialOpportunity}` : "",
      "",
      "Would it be worth a short conversation to see if this is relevant for you?",
      "",
      tenant.user.name,
    ]
      .filter((l) => l !== undefined)
      .join("\n")
      .replace(/\n{3,}/g, "\n\n");
  }
  const id = newId("od");
  db.insert(t.outreachDrafts)
    .values({ id, ...tenantCols(tenant), prospectId: p.id, contactId: contact?.id ?? null, userId: tenant.user.id, channel: input.channel, subject, body, originalBody: body, generatedBy })
    .run();
  audit(tenant, { entityType: "outreach", entityId: id, action: "generated", source: generatedBy === "ai" ? "ai" : "system", summary: `${input.channel} draft for ${p.name}` });
  return { id, subject, body, generatedBy };
}

function lowerFirst(s: string) {
  return s ? s[0].toLowerCase() + s.slice(1) : s;
}

export function saveDraft(tenant: CompanyTenant, id: string, input: { subject: string | null; body: string; handOff?: boolean }) {
  const d = db.select().from(t.outreachDrafts).where(inCompany(t.outreachDrafts, tenant, eq(t.outreachDrafts.id, id))).get();
  if (!d) throw new Error("Draft not found.");
  const changed = input.body.trim() !== d.body.trim();
  db.update(t.outreachDrafts)
    .set({ subject: input.subject, body: input.body, status: input.handOff ? "handed_off" : changed ? "edited" : d.status, updatedAt: new Date() })
    .where(eq(t.outreachDrafts.id, d.id))
    .run();
  if (input.body.trim() !== d.originalBody.trim()) learnFromEdit(tenant, d.originalBody, input.body);
  if (input.handOff) {
    activity(tenant, d.prospectId, "outreach", `${d.channel === "linkedin" ? "LinkedIn message" : d.channel === "call" ? "Call script" : "Email"} prepared`, input.body.slice(0, 400));
  }
}

export function draftsFor(tenant: CompanyTenant, prospectId: string) {
  return db.select().from(t.outreachDrafts).where(inCompany(t.outreachDrafts, tenant, eq(t.outreachDrafts.prospectId, prospectId))).orderBy(desc(t.outreachDrafts.createdAt)).all();
}
