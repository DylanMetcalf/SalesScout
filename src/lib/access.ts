import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db, t } from "@/lib/db";

/**
 * Who runs this installation. Administrators use the server's AI key without
 * limits and can open /admin.
 *
 * Set ADMIN_EMAILS (comma-separated) on the server. Until it's set, the first
 * account ever created is treated as the administrator.
 */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminAccount(accountId: string): boolean {
  const emails = adminEmails();
  if (emails.length > 0) {
    return Boolean(db.select({ id: t.users.id }).from(t.users).where(and(eq(t.users.accountId, accountId), inArray(t.users.email, emails))).get());
  }
  const first = db.select({ id: t.accounts.id }).from(t.accounts).orderBy(asc(t.accounts.createdAt)).limit(1).get();
  return first?.id === accountId;
}

export type AccessBlock = "paused" | "ended";

/**
 * Whether an account may sign in right now. Administrators are never blocked.
 * Paused = an administrator locked it; ended = its paid-up date has passed.
 */
export function accessBlock(accountId: string): AccessBlock | null {
  const acc = db.select({ suspendedAt: t.accounts.suspendedAt, accessUntil: t.accounts.accessUntil }).from(t.accounts).where(eq(t.accounts.id, accountId)).get();
  if (!acc || (!acc.suspendedAt && !acc.accessUntil)) return null;
  if (isAdminAccount(accountId)) return null;
  if (acc.suspendedAt) return "paused";
  if (acc.accessUntil && acc.accessUntil.getTime() < Date.now()) return "ended";
  return null;
}

export function accessBlockMessage(block: AccessBlock, contact: string): string {
  return block === "paused"
    ? `Your access is paused. Contact ${contact} to restore it.`
    : `Your access period has ended. Contact ${contact} to renew.`;
}
