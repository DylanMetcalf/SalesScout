"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import * as z from "zod/v4";
import { db, t } from "@/lib/db";
import { CRM_STATUSES } from "@/lib/db/schema";
import { newId } from "@/lib/ids";
import { actionTenant, inCompany, tenantCols } from "@/lib/tenant";
import {
  addContact, addNote, addToCrm, buildSalesBrief, createDraft, createFollowUp, giveFeedback, logTouch, removeContact,
  rescheduleFollowUp, restoreProspect, saveDraft, setFollowUpDone, setStatus,
} from "@/lib/services/workflow";
import { applySuggestion, ignoreSuggestion } from "@/lib/services/learning";
import { rateLimit } from "@/lib/security/rate-limit";
import { attempt } from "./result";

const done = () => revalidatePath("/", "layout");

export async function setStatusAction(id: string, status: string) {
  return attempt(async () => {
    setStatus(await actionTenant(), id, z.enum(CRM_STATUSES).parse(status));
    done();
  });
}

export async function addToCrmAction(id: string) {
  return attempt(async () => {
    addToCrm(await actionTenant(), id);
    done();
  });
}

export async function feedbackAction(id: string, kind: "not_relevant" | "already_known" | "exclude" | "competitor", reason?: string) {
  return attempt(async () => {
    giveFeedback(await actionTenant(), id, z.enum(["not_relevant", "already_known", "exclude", "competitor"]).parse(kind), reason?.slice(0, 300));
    done();
  });
}

export async function restoreAction(id: string) {
  return attempt(async () => {
    restoreProspect(await actionTenant(), id);
    done();
  });
}

export async function addNoteAction(id: string, body: string) {
  return attempt(async () => {
    addNote(await actionTenant(), id, z.string().trim().min(1, "Write a note first").max(5000).parse(body));
    done();
  });
}

export async function logTouchAction(id: string, type: "call" | "email" | "meeting", body?: string) {
  return attempt(async () => {
    logTouch(await actionTenant(), id, z.enum(["call", "email", "meeting"]).parse(type), body?.slice(0, 5000));
    done();
  });
}

export async function createFollowUpAction(input: { prospectId: string; title: string; dueAt: string; notes?: string; contactId?: string | null }) {
  return attempt(async () => {
    const title = z.string().trim().min(1, "What needs to happen?").max(200).parse(input.title);
    const due = new Date(input.dueAt);
    if (Number.isNaN(due.getTime())) throw new Error("Pick a date.");
    createFollowUp(await actionTenant(), { prospectId: input.prospectId, title, dueAt: due, notes: input.notes?.slice(0, 2000), contactId: input.contactId });
    done();
  });
}

export async function setFollowUpDoneAction(id: string, isDone: boolean) {
  return attempt(async () => {
    setFollowUpDone(await actionTenant(), id, isDone);
    done();
  });
}

export async function rescheduleFollowUpAction(id: string, dueAt: string) {
  return attempt(async () => {
    const due = new Date(dueAt);
    if (Number.isNaN(due.getTime())) throw new Error("Pick a date.");
    rescheduleFollowUp(await actionTenant(), id, due);
    done();
  });
}

export async function addContactAction(prospectId: string, input: { name: string; role: string; email: string; phone: string; profileUrl: string }) {
  return attempt(async () => {
    const role = z.string().trim().min(1, "What's their role?").max(120).parse(input.role);
    const email = input.email.trim() ? z.email("That email doesn't look right").parse(input.email.trim()) : null;
    addContact(await actionTenant(), prospectId, { name: input.name.trim() || null, role, email, phone: input.phone.trim() || null, profileUrl: input.profileUrl.trim() || null });
    done();
  });
}

export async function removeContactAction(id: string) {
  return attempt(async () => {
    removeContact(await actionTenant(), id);
    done();
  });
}

export async function salesBriefAction(prospectId: string) {
  return attempt(async () => buildSalesBrief(await actionTenant(), prospectId));
}

export async function draftOutreachAction(input: { prospectId: string; contactId: string | null; channel: "email" | "linkedin" | "call" | "follow_up" }) {
  return attempt(async () => {
    const tenant = await actionTenant();
    if (!rateLimit(`draft:${tenant.user.id}`, 60, 3_600_000)) throw new Error("That's a lot of drafts in an hour. Try again shortly.");
    return createDraft(tenant, input);
  });
}

export async function saveDraftAction(id: string, input: { subject: string | null; body: string; handOff?: boolean }) {
  return attempt(async () => {
    saveDraft(await actionTenant(), id, { subject: input.subject?.slice(0, 300) ?? null, body: z.string().max(10000).parse(input.body), handOff: input.handOff });
    done();
  });
}

export async function applySuggestionAction(id: string) {
  return attempt(async () => {
    applySuggestion(await actionTenant(), id);
    done();
  });
}

export async function ignoreSuggestionAction(id: string) {
  return attempt(async () => {
    ignoreSuggestion(await actionTenant(), id);
    done();
  });
}

export async function addExclusionAction(input: { kind: "company" | "domain" | "industry" | "role" | "geography" | "competitor" | "customer"; value: string; reason?: string }) {
  return attempt(async () => {
    const tenant = await actionTenant();
    const value = z.string().trim().min(1).max(200).parse(input.value);
    db.insert(t.exclusions).values({ id: newId("ex"), ...tenantCols(tenant), kind: input.kind, value, reason: input.reason ?? null }).run();
    done();
  });
}

export async function removeExclusionAction(id: string) {
  return attempt(async () => {
    const tenant = await actionTenant();
    db.delete(t.exclusions).where(inCompany(t.exclusions, tenant, eq(t.exclusions.id, id))).run();
    done();
  });
}

export async function removeWritingPreferenceAction(id: string) {
  return attempt(async () => {
    const tenant = await actionTenant();
    db.delete(t.writingPreferences).where(inCompany(t.writingPreferences, tenant, eq(t.writingPreferences.id, id))).run();
    done();
  });
}

export async function addWritingPreferenceAction(rule: string, scope: "user" | "company") {
  return attempt(async () => {
    const tenant = await actionTenant();
    const r = z.string().trim().min(3).max(300).parse(rule);
    db.insert(t.writingPreferences).values({ id: newId("wp"), ...tenantCols(tenant), scope, userId: scope === "user" ? tenant.user.id : null, rule: r }).run();
    done();
  });
}
