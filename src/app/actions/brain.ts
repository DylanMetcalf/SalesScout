"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import * as z from "zod/v4";
import { db, t } from "@/lib/db";
import { BRAIN_SECTIONS } from "@/lib/db/schema";
import { newId } from "@/lib/ids";
import { actionTenant, inCompany, tenantCols } from "@/lib/tenant";
import { markBrainReviewed, startBrainAnalysis } from "@/lib/services/brain";
import { fieldLabel } from "@/lib/brain-fields";
import { rateLimit } from "@/lib/security/rate-limit";
import { audit } from "@/lib/audit";
import { attempt } from "./result";

export async function analyseCompanyAction() {
  return attempt(async () => {
    const tenant = await actionTenant();
    if (!rateLimit(`analyse:${tenant.company.id}`, 10, 3_600_000)) throw new Error("You've re-analysed a lot recently. Try again in a little while.");
    return startBrainAnalysis(tenant);
  });
}

const FactInput = z.object({
  section: z.enum(BRAIN_SECTIONS),
  field: z.string().min(1).max(60),
  value: z.string().trim().min(1, "Write something first").max(2000),
});

export async function addFactAction(input: z.infer<typeof FactInput>) {
  return attempt(async () => {
    const tenant = await actionTenant();
    const f = FactInput.parse(input);
    const id = newId("bf");
    db.insert(t.brainFacts).values({ id, ...tenantCols(tenant), ...f, knowledge: "confirmed", rationale: "Added by you", origin: "user" }).run();
    audit(tenant, { entityType: "brain_fact", entityId: id, action: "added", source: "user", summary: `${fieldLabel(f.section, f.field)}: added "${f.value.slice(0, 80)}"` });
    revalidatePath("/", "layout");
  });
}

/** An edit by the user makes the statement theirs: confirmed, user-owned, kept on re-analysis. */
export async function updateFactAction(id: string, value: string) {
  return attempt(async () => {
    const tenant = await actionTenant();
    const v = z.string().trim().min(1, "Write something, or remove it instead").max(2000).parse(value);
    const f = db.select().from(t.brainFacts).where(inCompany(t.brainFacts, tenant, eq(t.brainFacts.id, id))).get();
    if (!f) throw new Error("That item no longer exists.");
    db.update(t.brainFacts).set({ value: v, knowledge: "confirmed", origin: "user", rationale: "Edited by you", updatedAt: new Date() }).where(eq(t.brainFacts.id, f.id)).run();
    db.insert(t.feedback).values({ id: newId("fb"), ...tenantCols(tenant), userId: tenant.user.id, kind: "correction", dimension: `brain.${f.field}`, value: v, reason: `was: ${f.value}` }).run();
    audit(tenant, { entityType: "brain_fact", entityId: f.id, action: "edited", source: "user", summary: `${fieldLabel(f.section, f.field)}: ${f.value.slice(0, 60)} → ${v.slice(0, 60)}`, detail: { before: f.value, after: v } });
    revalidatePath("/", "layout");
  });
}

export async function confirmFactAction(id: string) {
  return attempt(async () => {
    const tenant = await actionTenant();
    const f = db.select().from(t.brainFacts).where(inCompany(t.brainFacts, tenant, eq(t.brainFacts.id, id))).get();
    if (!f) return;
    db.update(t.brainFacts).set({ knowledge: "confirmed", origin: "user", rationale: f.rationale ? `${f.rationale} · Confirmed by you` : "Confirmed by you", updatedAt: new Date() }).where(eq(t.brainFacts.id, f.id)).run();
    audit(tenant, { entityType: "brain_fact", entityId: f.id, action: "confirmed", source: "user", summary: `${fieldLabel(f.section, f.field)}: confirmed "${f.value.slice(0, 80)}"` });
    revalidatePath("/", "layout");
  });
}

export async function removeFactAction(id: string) {
  return attempt(async () => {
    const tenant = await actionTenant();
    const f = db.select().from(t.brainFacts).where(inCompany(t.brainFacts, tenant, eq(t.brainFacts.id, id))).get();
    if (!f) return;
    db.delete(t.brainFacts).where(eq(t.brainFacts.id, f.id)).run();
    if (f.origin !== "user") db.insert(t.feedback).values({ id: newId("fb"), ...tenantCols(tenant), userId: tenant.user.id, kind: "correction", dimension: `brain.${f.field}`, value: null, reason: `rejected: ${f.value}` }).run();
    audit(tenant, { entityType: "brain_fact", entityId: f.id, action: "removed", source: "user", summary: `${fieldLabel(f.section, f.field)}: removed "${f.value.slice(0, 80)}"` });
    revalidatePath("/", "layout");
  });
}

/** Onboarding: approve and move on to market discovery (server redirect is navigation-safe). */
export async function approveBrainAndContinueAction() {
  markBrainReviewed(await actionTenant());
  revalidatePath("/", "layout");
  redirect("/onboarding/markets");
}

export async function approveBrainAction() {
  return attempt(async () => {
    markBrainReviewed(await actionTenant());
    revalidatePath("/", "layout");
  });
}
