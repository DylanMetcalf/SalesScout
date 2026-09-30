import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { and, asc, eq, type SQL } from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import { db, t } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

export type Tenant = {
  user: typeof t.users.$inferSelect;
  account: typeof t.accounts.$inferSelect;
  workspace: typeof t.workspaces.$inferSelect;
  role: "owner" | "admin" | "member";
  workspaces: (typeof t.workspaces.$inferSelect)[];
  companies: (typeof t.companies.$inferSelect)[];
  company: typeof t.companies.$inferSelect | null;
};
export type CompanyTenant = Tenant & { company: NonNullable<Tenant["company"]> };

/**
 * Resolves who is asking and which workspace/company they are working in.
 * Membership is verified on every request: a stale or tampered
 * last-workspace/company pointer falls back to something the user can access.
 */
export const getTenant = cache(async (): Promise<Tenant | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const account = db.select().from(t.accounts).where(eq(t.accounts.id, user.accountId)).get();
  if (!account) return null;

  const memberships = db
    .select({ workspace: t.workspaces, role: t.workspaceMembers.role })
    .from(t.workspaceMembers)
    .innerJoin(t.workspaces, eq(t.workspaces.id, t.workspaceMembers.workspaceId))
    .where(and(eq(t.workspaceMembers.userId, user.id), eq(t.workspaces.accountId, account.id)))
    .orderBy(asc(t.workspaces.createdAt))
    .all();
  if (memberships.length === 0) return null;

  const active = memberships.find((m) => m.workspace.id === user.lastWorkspaceId) ?? memberships[0];
  const companies = db
    .select()
    .from(t.companies)
    .where(eq(t.companies.workspaceId, active.workspace.id))
    .orderBy(asc(t.companies.isDemo), asc(t.companies.createdAt))
    .all();
  const company = companies.find((c) => c.id === user.lastCompanyId) ?? companies[0] ?? null;

  return {
    user,
    account,
    workspace: active.workspace,
    role: active.role,
    workspaces: memberships.map((m) => m.workspace),
    companies,
    company,
  };
});

/** Signed in with a workspace; otherwise redirect into auth or onboarding. */
export async function requireTenant(): Promise<Tenant> {
  const tenant = await getTenant();
  if (!tenant) redirect((await getSessionUser()) ? "/onboarding" : "/login");
  return tenant;
}

/** Signed in with an active company. */
export async function requireCompany(): Promise<CompanyTenant> {
  const tenant = await requireTenant();
  if (!tenant.company) redirect("/onboarding/company");
  return tenant as CompanyTenant;
}

/** For server actions: same checks, but throws instead of redirecting mid-mutation. */
export async function actionTenant(): Promise<CompanyTenant> {
  const tenant = await getTenant();
  if (!tenant) throw new Error("You need to sign in again.");
  if (!tenant.company) throw new Error("Choose a company first.");
  return tenant as CompanyTenant;
}

type Scoped = { companyId: SQLiteColumn; workspaceId: SQLiteColumn };

/** WHERE clause restricting a company-scoped table to the active company. */
export function inCompany(table: Scoped, tenant: CompanyTenant, ...extra: (SQL | undefined)[]): SQL {
  return and(eq(table.companyId, tenant.company.id), eq(table.workspaceId, tenant.workspace.id), ...extra)!;
}

/** Tenant columns to spread into every company-scoped insert. */
export function tenantCols(tenant: CompanyTenant) {
  return { companyId: tenant.company.id, workspaceId: tenant.workspace.id };
}
