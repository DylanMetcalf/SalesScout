"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import * as z from "zod/v4";
import { db, t } from "@/lib/db";
import { assertAdmin } from "@/lib/admin";
import { createInvite } from "@/lib/services/invites";
import { attempt } from "./result";

function check<S extends z.ZodType>(schema: S, input: unknown): z.infer<S> {
  const r = schema.safeParse(input);
  if (!r.success) throw new Error(r.error.issues[0].message);
  return r.data;
}

/** Allowance is entered in millions of tokens; blank means no cap. */
const Allowance = z
  .union([z.literal(""), z.coerce.number().min(0).max(10_000)])
  .transform((m) => (m === "" ? null : Math.round(m * 1_000_000)));

const AccessSchema = z.object({
  accountId: z.string().min(1),
  aiAccess: z.enum(["server", "own_key"]),
  allowance: Allowance,
});

export async function setAccountAccessAction(input: { accountId: string; aiAccess: string; allowance: string }) {
  return attempt(async () => {
    await assertAdmin();
    const v = check(AccessSchema, input);
    const res = db.update(t.accounts).set({ aiAccess: v.aiAccess, aiMonthlyTokenLimit: v.allowance }).where(eq(t.accounts.id, v.accountId)).run();
    if (res.changes !== 1) throw new Error("That account no longer exists.");
    revalidatePath("/admin");
  });
}

const InviteSchema = z.object({
  label: z.string().trim().min(1, "Give the invite a name, e.g. who it's for").max(80),
  aiAccess: z.enum(["server", "own_key"]),
  allowance: Allowance,
  maxUses: z.coerce.number().int().min(1).max(100),
  expiresInDays: z.union([z.literal(""), z.coerce.number().int().min(1).max(365)]),
});

export async function createInviteAction(input: Record<string, string>) {
  return attempt(async () => {
    await assertAdmin();
    const v = check(InviteSchema, input);
    const code = createInvite({
      label: v.label,
      aiAccess: v.aiAccess,
      aiMonthlyTokenLimit: v.allowance,
      maxUses: v.maxUses,
      expiresAt: v.expiresInDays === "" ? null : new Date(Date.now() + v.expiresInDays * 86_400_000),
    });
    revalidatePath("/admin");
    return code;
  });
}

export async function revokeInviteAction(id: string) {
  return attempt(async () => {
    await assertAdmin();
    db.update(t.invites).set({ revokedAt: new Date() }).where(eq(t.invites.id, id)).run();
    revalidatePath("/admin");
  });
}

export async function setEnquiryStatusAction(id: string, status: string) {
  return attempt(async () => {
    await assertAdmin();
    const s = check(z.enum(["new", "contacted", "closed"]), status);
    db.update(t.enquiries).set({ status: s }).where(eq(t.enquiries.id, id)).run();
    revalidatePath("/admin");
  });
}
