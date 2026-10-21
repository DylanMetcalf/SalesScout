import "server-only";
import { and, eq, gte, sum } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, t } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminAccount } from "@/lib/access";

export { adminEmails, isAdminAccount } from "@/lib/access";

/** For admin pages and actions. Anyone else gets a plain 404, so /admin isn't advertised. */
export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || !isAdminAccount(user.accountId)) notFound();
  return user;
}

/** For server actions: a readable error rather than a 404. */
export async function assertAdmin() {
  const user = await getSessionUser();
  if (!user || !isAdminAccount(user.accountId)) throw new Error("Only administrators can do that.");
  return user;
}

export function monthStart(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function monthlyTokens(accountId: string): number {
  const row = db
    .select({ input: sum(t.aiInteractions.inputTokens), output: sum(t.aiInteractions.outputTokens) })
    .from(t.aiInteractions)
    .where(and(eq(t.aiInteractions.accountId, accountId), gte(t.aiInteractions.createdAt, monthStart())))
    .get();
  return Number(row?.input ?? 0) + Number(row?.output ?? 0);
}

export type ServerKeyAccess = { allowed: true; reason: "admin" | "granted" } | { allowed: false; reason: "own_key" | "allowance_used" };

/** Whether an account may spend the installation's server-wide AI key right now. */
export function serverKeyAccess(accountId: string): ServerKeyAccess {
  if (isAdminAccount(accountId)) return { allowed: true, reason: "admin" };
  const acc = db.select({ access: t.accounts.aiAccess, limit: t.accounts.aiMonthlyTokenLimit }).from(t.accounts).where(eq(t.accounts.id, accountId)).get();
  if (acc?.access !== "server") return { allowed: false, reason: "own_key" };
  if (acc.limit != null && monthlyTokens(accountId) >= acc.limit) return { allowed: false, reason: "allowance_used" };
  return { allowed: true, reason: "granted" };
}
