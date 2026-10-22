import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, isNull, lt, sql } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { newId } from "@/lib/ids";

// No 0/O/1/I/L, so codes survive being read aloud or retyped.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateInviteCode(): string {
  const bytes = randomBytes(10);
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${chars.slice(0, 5)}-${chars.slice(5)}`;
}

export function normaliseInviteCode(code: string): string {
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return clean.length === 10 ? `${clean.slice(0, 5)}-${clean.slice(5)}` : clean;
}

export type InviteInput = {
  label: string;
  aiAccess: "server" | "own_key";
  aiMonthlyTokenLimit: number | null;
  maxUses: number;
  expiresAt: Date | null;
  email: string | null;
  accessDays: number | null;
  plan: string | null;
};

export function createInvite(input: InviteInput) {
  const code = generateInviteCode();
  db.insert(t.invites).values({ id: newId("inv"), code, ...input }).run();
  return code;
}

/** A code that can still be used right now (by this email, if the code is tied to one), or null. */
export function findUsableInvite(code: string, email?: string) {
  const row = db.select().from(t.invites).where(eq(t.invites.code, normaliseInviteCode(code))).get();
  if (!row || row.revokedAt || row.uses >= row.maxUses) return null;
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null;
  if (row.email && row.email !== email?.trim().toLowerCase()) return null;
  return row;
}

/** What an invite gives the account it creates. */
export function inviteGrant(invite: typeof t.invites.$inferSelect) {
  return {
    aiAccess: invite.aiAccess,
    aiMonthlyTokenLimit: invite.aiMonthlyTokenLimit,
    accessUntil: invite.accessDays ? new Date(Date.now() + invite.accessDays * 86_400_000) : null,
    ...(invite.plan && { plan: invite.plan, planSource: "manual" as const }),
  };
}

/** Atomically consumes one use. False if someone else took the last one first. */
export function consumeInvite(id: string): boolean {
  const res = db
    .update(t.invites)
    .set({ uses: sql`${t.invites.uses} + 1` })
    .where(and(eq(t.invites.id, id), isNull(t.invites.revokedAt), lt(t.invites.uses, t.invites.maxUses)))
    .run();
  return res.changes === 1;
}
