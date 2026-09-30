"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { newId } from "@/lib/ids";
import * as z from "zod/v4";
import { db, t } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { getTenant, requireTenant } from "@/lib/tenant";
import { addDemoCompany, createCompany, createWorkspace, switchCompany, switchWorkspace } from "@/lib/services/accounts";
import { attempt } from "./result";

export async function createWorkspaceAction(input: { name: string; description?: string }) {
  return attempt(async () => {
    const user = await getSessionUser();
    if (!user) throw new Error("You need to sign in again.");
    const name = z.string().trim().min(1, "Give your workspace a name").max(60).parse(input.name);
    createWorkspace(user, { name, description: input.description?.trim() || null });
    revalidatePath("/", "layout");
    redirect("/onboarding/company");
  });
}

export async function createCompanyAction(input: { name: string; description?: string; website?: string }) {
  return attempt(async () => {
    const tenant = await requireTenant();
    const name = z.string().trim().min(1, "What's the company called?").max(120).parse(input.name);
    createCompany(tenant, { name, description: input.description?.trim() || null, website: input.website });
    revalidatePath("/", "layout");
    redirect("/onboarding/company?step=website");
  });
}

export async function exploreDemoAction() {
  return attempt(async () => {
    let tenant = await getTenant();
    if (!tenant) {
      const user = await getSessionUser();
      if (!user) throw new Error("You need to sign in again.");
      createWorkspace(user, { name: "Demo workspace", description: "A sandbox with example data" });
      tenant = await requireTenantFresh();
    }
    addDemoCompany(tenant);
    revalidatePath("/", "layout");
    redirect("/home");
  });
}

async function requireTenantFresh() {
  // getTenant is cached per request; re-resolve after creating a workspace.
  const user = (await getSessionUser())!;
  const ws = db.select().from(t.workspaces).where(eq(t.workspaces.id, db.select().from(t.users).where(eq(t.users.id, user.id)).get()!.lastWorkspaceId!)).get()!;
  const account = db.select().from(t.accounts).where(eq(t.accounts.id, user.accountId)).get()!;
  return { user, account, workspace: ws, role: "owner" as const, workspaces: [ws], companies: [], company: null };
}

export async function switchWorkspaceAction(workspaceId: string) {
  return attempt(async () => {
    switchWorkspace(await requireTenant(), workspaceId);
    revalidatePath("/", "layout");
    redirect("/home");
  });
}

export async function switchCompanyAction(companyId: string) {
  return attempt(async () => {
    switchCompany(await requireTenant(), companyId);
    revalidatePath("/", "layout");
    redirect("/home");
  });
}

export async function updateWorkspaceAction(input: { name: string; description: string; context: string }) {
  return attempt(async () => {
    const tenant = await requireTenant();
    if (tenant.role === "member") throw new Error("Only workspace owners and admins can change settings.");
    const name = z.string().trim().min(1).max(60).parse(input.name);
    db.update(t.workspaces)
      .set({ name, description: input.description.trim() || null, context: input.context.trim() || null })
      .where(eq(t.workspaces.id, tenant.workspace.id))
      .run();
    revalidatePath("/", "layout");
  });
}

export async function updateCompanyAction(input: { name: string; description: string; website: string }) {
  return attempt(async () => {
    const tenant = await requireTenant();
    if (!tenant.company) throw new Error("Choose a company first.");
    const name = z.string().trim().min(1).max(120).parse(input.name);
    const { normaliseUrl } = await import("@/lib/security/url");
    const website = normaliseUrl(input.website);
    const company = tenant.company;
    db.transaction((tx) => {
      tx.update(t.companies).set({ name, description: input.description.trim() || null, website, updatedAt: new Date() }).where(eq(t.companies.id, company.id)).run();
      if (website !== company.website) {
        tx.delete(t.sources).where(and(eq(t.sources.companyId, company.id), eq(t.sources.kind, "website"))).run();
        if (website)
          tx.insert(t.sources).values({ id: newId("src"), companyId: company.id, workspaceId: tenant.workspace.id, kind: "website", label: new URL(website).hostname, url: website, status: "pending" }).run();
      }
    });
    revalidatePath("/", "layout");
  });
}
