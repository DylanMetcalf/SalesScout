import "server-only";
import { and, eq } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { newId } from "@/lib/ids";
import { hashPassword } from "@/lib/auth/password";
import type { Tenant } from "@/lib/tenant";
import { normaliseUrl } from "@/lib/security/url";
import { audit } from "@/lib/audit";
import { createDemoCompany } from "./demo";

export async function createAccountWithUser(input: { name: string; email: string; password: string }) {
  const accountId = newId("acc");
  const userId = newId("usr");
  const passwordHash = await hashPassword(input.password);
  db.transaction((tx) => {
    tx.insert(t.accounts).values({ id: accountId, name: `${input.name.split(" ")[0]}'s account` }).run();
    tx.insert(t.users).values({ id: userId, accountId, email: input.email, name: input.name, passwordHash }).run();
  });
  return { accountId, userId };
}

export function createWorkspace(user: { id: string; accountId: string }, input: { name: string; description?: string | null }) {
  const id = newId("ws");
  db.transaction((tx) => {
    tx.insert(t.workspaces).values({ id, accountId: user.accountId, name: input.name, description: input.description ?? null }).run();
    tx.insert(t.workspaceMembers).values({ workspaceId: id, userId: user.id, role: "owner" }).run();
    tx.update(t.users).set({ lastWorkspaceId: id, lastCompanyId: null }).where(eq(t.users.id, user.id)).run();
  });
  return id;
}

export function createCompany(tenant: Tenant, input: { name: string; description?: string | null; website?: string | null }) {
  const id = newId("co");
  const website = normaliseUrl(input.website);
  db.transaction((tx) => {
    tx.insert(t.companies)
      .values({ id, accountId: tenant.account.id, workspaceId: tenant.workspace.id, name: input.name, description: input.description ?? null, website })
      .run();
    tx.insert(t.sources)
      .values({ id: newId("src"), companyId: id, workspaceId: tenant.workspace.id, kind: "web_research", label: "Web research", status: "available", statusDetail: "Used during discovery when AI is connected" })
      .run();
    if (website)
      tx.insert(t.sources).values({ id: newId("src"), companyId: id, workspaceId: tenant.workspace.id, kind: "website", label: new URL(website).hostname, url: website, status: "pending" }).run();
    tx.update(t.users).set({ lastCompanyId: id }).where(eq(t.users.id, tenant.user.id)).run();
  });
  audit({ ...tenant, company: null }, { entityType: "company", entityId: id, action: "created", source: "user", summary: `Created company ${input.name}` });
  return id;
}

export function addDemoCompany(tenant: Tenant) {
  const existing = db.select({ id: t.companies.id }).from(t.companies).where(and(eq(t.companies.workspaceId, tenant.workspace.id), eq(t.companies.isDemo, true))).get();
  const id = existing?.id ?? createDemoCompany(db, { accountId: tenant.account.id, workspaceId: tenant.workspace.id, userId: tenant.user.id, userName: tenant.user.name });
  db.update(t.users).set({ lastCompanyId: id }).where(eq(t.users.id, tenant.user.id)).run();
  return id;
}

/** Switches only to a workspace the user is a member of, within their account. */
export function switchWorkspace(tenant: Tenant, workspaceId: string) {
  if (!tenant.workspaces.some((w) => w.id === workspaceId)) throw new Error("You don't have access to that workspace.");
  db.update(t.users).set({ lastWorkspaceId: workspaceId, lastCompanyId: null }).where(eq(t.users.id, tenant.user.id)).run();
}

/** Switches only to a company inside the active workspace. */
export function switchCompany(tenant: Tenant, companyId: string) {
  if (!tenant.companies.some((c) => c.id === companyId)) throw new Error("You don't have access to that company.");
  db.update(t.users).set({ lastCompanyId: companyId }).where(eq(t.users.id, tenant.user.id)).run();
}
