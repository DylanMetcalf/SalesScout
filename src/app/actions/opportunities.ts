"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import * as z from "zod/v4";
import { db, t } from "@/lib/db";
import { assertAdmin } from "@/lib/admin";
import { getTenant } from "@/lib/tenant";
import { newId } from "@/lib/ids";
import { normaliseUrl } from "@/lib/security/url";
import { deleteOpportunity, getOpportunity, logActivity, setStage, snapshotDocument, touch } from "@/lib/opportunities/service";
import { AI_TASKS, startAiTask, type AiTask } from "@/lib/opportunities/jobs";
import { BRIEF_FIELDS, DOC_KINDS, PROJECT_FIELDS, PROPOSAL_FIELDS, STAGES, type DocKind } from "@/lib/opportunities/types";
import { briefingFor, createBriefing, isGenerating, issueLink, revokeLink, runBriefing, sendBriefingEmail } from "@/lib/opportunities/briefings";
import { siteUrl } from "@/lib/site-url";
import { attempt } from "./result";

/* Operator-only. Every action re-checks the administrator on the server. */

function check<S extends z.ZodType>(schema: S, input: unknown): z.infer<S> {
  const r = schema.safeParse(input);
  if (!r.success) throw new Error(r.error.issues[0].message);
  return r.data;
}

const refresh = (id: string) => {
  revalidatePath(`/opportunities/${id}`);
  revalidatePath("/opportunities");
};

export async function setStageAction(id: string, stage: string, reason?: string) {
  return attempt(async () => {
    const admin = await assertAdmin();
    setStage(id, check(z.enum(STAGES), stage), admin.email, reason?.trim().slice(0, 300));
    refresh(id);
  });
}

const ItemSchema = z.object({
  kind: z.enum(["note", "meeting", "task"]),
  body: z.string().trim().min(1, "Write something first").max(10_000),
  dueAt: z.union([z.literal(""), z.iso.date("Pick a date")]).optional(),
});

export async function addItemAction(id: string, input: { kind: string; body: string; dueAt?: string }) {
  return attempt(async () => {
    const admin = await assertAdmin();
    const v = check(ItemSchema, input);
    getOpportunity(id);
    db.insert(t.opportunityItems)
      .values({ id: newId("oi"), opportunityId: id, kind: v.kind, body: v.body, dueAt: v.kind === "task" && v.dueAt ? new Date(`${v.dueAt}T09:00:00`) : null, by: admin.email })
      .run();
    touch(id);
    refresh(id);
  });
}

export async function toggleTaskAction(itemId: string) {
  return attempt(async () => {
    await assertAdmin();
    const item = db.select().from(t.opportunityItems).where(and(eq(t.opportunityItems.id, itemId), eq(t.opportunityItems.kind, "task"))).get();
    if (!item) throw new Error("That task no longer exists.");
    db.update(t.opportunityItems).set({ doneAt: item.doneAt ? null : new Date() }).where(eq(t.opportunityItems.id, itemId)).run();
    refresh(item.opportunityId);
  });
}

export async function deleteItemAction(itemId: string) {
  return attempt(async () => {
    await assertAdmin();
    const item = db.select().from(t.opportunityItems).where(eq(t.opportunityItems.id, itemId)).get();
    if (!item || item.kind === "activity") throw new Error("That can't be deleted.");
    db.delete(t.opportunityItems).where(eq(t.opportunityItems.id, itemId)).run();
    refresh(item.opportunityId);
  });
}

const FIELDS = { brief: BRIEF_FIELDS, proposal: PROPOSAL_FIELDS, project: PROJECT_FIELDS } as const;

/** Saves the operator's edits to the brief, proposal or project record. */
export async function saveTextDocAction(id: string, which: string, values: Record<string, string>) {
  return attempt(async () => {
    const admin = await assertAdmin();
    const w = check(z.enum(["brief", "proposal", "project"]), which);
    const keys = FIELDS[w].map(([k]) => k);
    const clean = Object.fromEntries(keys.map((k) => [k, String(values[k] ?? "").slice(0, 8000)]));
    touch(id, { [w]: clean, ...(w === "proposal" && !getOpportunity(id).proposalStatus && { proposalStatus: "draft" as const }) });
    logActivity(id, `Edited the ${w === "brief" ? "solution brief" : w === "proposal" ? "proposal" : "project record"}`, admin.email);
    refresh(id);
  });
}

const DetailsSchema = z.object({
  name: z.string().trim().min(1, "A name is needed").max(100),
  email: z.email("That email doesn't look right"),
  phone: z.string().trim().max(30),
  role: z.string().trim().max(100),
  companyName: z.string().trim().max(150),
  website: z.string().trim().max(200),
  region: z.string().trim().max(100),
});

/** Contact and company details can be corrected; the original problem text can't. */
export async function saveDetailsAction(id: string, input: Record<string, string>) {
  return attempt(async () => {
    const admin = await assertAdmin();
    const v = check(DetailsSchema, input);
    if (v.website && !normaliseUrl(v.website)) throw new Error("That website address doesn't look right.");
    touch(id, { name: v.name, email: v.email.toLowerCase(), phone: v.phone || null, role: v.role || null, companyName: v.companyName || null, website: normaliseUrl(v.website), region: v.region || null });
    logActivity(id, "Updated contact or company details", admin.email);
    refresh(id);
  });
}

export async function setStatusAction(id: string, which: string, status: string) {
  return attempt(async () => {
    const admin = await assertAdmin();
    const w = check(z.enum(["proposal", "project"]), which);
    if (w === "proposal") {
      const s = check(z.enum(["draft", "ready", "sent", "accepted", "declined"]), status);
      touch(id, { proposalStatus: s });
      logActivity(id, `Proposal marked ${s}`, admin.email);
      if (s === "accepted") setStage(id, "accepted", admin.email);
    } else {
      const s = check(z.enum(["not_started", "in_progress", "on_hold", "delivered"]), status);
      touch(id, { projectStatus: s });
      logActivity(id, `Project marked ${s.replace("_", " ")}`, admin.email);
      if (s === "in_progress") setStage(id, "building", admin.email);
      if (s === "delivered") setStage(id, "delivered", admin.email);
    }
    refresh(id);
  });
}

export async function saveProductSignalAction(id: string, input: { candidate: boolean; category: string; components: string; notes: string }) {
  return attempt(async () => {
    const admin = await assertAdmin();
    const v = check(z.object({ candidate: z.boolean(), category: z.string().trim().max(120), components: z.string().trim().max(2000), notes: z.string().trim().max(4000) }), input);
    touch(id, { product: v });
    logActivity(id, v.candidate ? `Tagged as a possible reusable product${v.category ? ` (${v.category})` : ""}` : "Updated product notes", admin.email);
    refresh(id);
  });
}

export async function startAiAction(id: string, task: string) {
  return attempt(async () => {
    const admin = await assertAdmin();
    const tenant = await getTenant();
    if (!tenant) throw new Error("Please sign in again.");
    const k = check(z.enum(Object.keys(AI_TASKS) as [AiTask, ...AiTask[]]), task);
    return startAiTask({ accountId: tenant.account.id, workspaceId: tenant.workspace.id, companyId: null }, id, k, admin.email);
  });
}

/** Freezes the current content as a new document version and returns its id for preview/printing. */
export async function createDocumentAction(id: string, kind: string) {
  return attempt(async () => {
    const admin = await assertAdmin();
    const k = check(z.enum(Object.keys(DOC_KINDS) as [DocKind, ...DocKind[]]), kind);
    const o = getOpportunity(id);
    const content = documentContent(o, k);
    const doc = snapshotDocument(id, k, content, admin.email);
    refresh(id);
    return doc.id;
  });
}

function documentContent(o: ReturnType<typeof getOpportunity>, kind: DocKind): Record<string, unknown> {
  const company = { name: o.companyName, website: o.website, region: o.region, contact: o.name, role: o.role };
  switch (kind) {
    case "assessment":
      if (!o.analysis) throw new Error("Run the problem analysis first.");
      return { company, problem: o.problem, context: o.context, analysis: o.analysis };
    case "briefing":
      if (!o.research) throw new Error("Research the company first.");
      return { company, problem: o.problem, context: o.context, research: o.research, questions: o.analysis?.questions ?? [] };
    case "visibility":
      if (!o.visibility) throw new Error("Run the visibility assessment first.");
      return { company, visibility: o.visibility };
    case "solution_brief":
      if (!o.brief) throw new Error("Write the solution brief first.");
      return { company, fields: o.brief };
    case "proposal":
      if (!o.proposal) throw new Error("Write the proposal first.");
      if (/\[To be completed by Mea Creo\]/i.test(Object.values(o.proposal).join(" "))) throw new Error("Complete the sections marked [To be completed by Mea Creo] before creating the proposal document.");
      return { company, fields: o.proposal };
    case "handover":
      if (!o.project) throw new Error("Fill in the project record first.");
      return { company, problem: o.problem, fields: o.project, status: o.projectStatus };
  }
}

/** Permanent. For deletion requests (POPIA) or spam. */
export async function deleteOpportunityAction(id: string, confirmName: string) {
  return attempt(async () => {
    const admin = await assertAdmin();
    const o = getOpportunity(id);
    if (confirmName.trim().toLowerCase() !== o.name.trim().toLowerCase()) throw new Error("Type the contact's name exactly to confirm.");
    deleteOpportunity(id);
    console.warn(`[ops] opportunity ${id} deleted by ${admin.email}`);
    revalidatePath("/opportunities");
  });
}

/** Writes (or rewrites) the customer's briefing. Their existing link keeps working and shows the new version. */
export async function retryBriefingAction(id: string) {
  return attempt(async () => {
    const admin = await assertAdmin();
    getOpportunity(id);
    if (isGenerating(id)) throw new Error("This briefing is already being written. Give it a minute, then refresh.");
    const { briefing } = createBriefing(id);
    const before = briefing.updatedAt.getTime();
    logActivity(id, "Briefing regeneration requested", admin.email);
    // Ready briefings stay visible to the customer until the new version validates.
    const done = await runBriefing(id, null, { force: true });
    refresh(id);
    if (!done || done.status !== "ready" || done.error) throw new Error(done?.error ?? "The briefing couldn't be generated.");
    if (done.updatedAt.getTime() === before) throw new Error("Nothing changed. Please try again.");
  });
}

/** A fresh private link (the previous one stops working). Optionally emails it. Returns the link to copy, once. */
export async function newBriefingLinkAction(id: string, email: boolean) {
  return attempt(async () => {
    const admin = await assertAdmin();
    const o = getOpportunity(id);
    const b = briefingFor(id);
    if (!b) throw new Error("There's no briefing for this opportunity yet. Generate one first.");
    if (email && b.status !== "ready") throw new Error("The briefing isn't ready yet, so there's nothing to send.");
    const token = issueLink(b.id);
    logActivity(id, "Issued a new private briefing link (the previous link no longer works)", admin.email);
    if (email) await sendBriefingEmail(o, briefingFor(id)!, token);
    refresh(id);
    return { url: `${siteUrl()}/b/${token}`, email: briefingFor(id)!.emailStatus };
  });
}

export async function revokeBriefingLinkAction(id: string) {
  return attempt(async () => {
    const admin = await assertAdmin();
    const b = briefingFor(id);
    if (!b) throw new Error("There's no briefing link to revoke.");
    revokeLink(b.id);
    logActivity(id, "Revoked the customer's private briefing link", admin.email);
    refresh(id);
  });
}
