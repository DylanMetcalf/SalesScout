"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { resolveKey, testKey } from "@/lib/ai/core";
import { encryptSecret } from "@/lib/security/secrets";
import { rateLimit } from "@/lib/security/rate-limit";
import { audit } from "@/lib/audit";
import { attempt } from "./result";

async function ownerTenant() {
  const tenant = await requireTenant();
  if (tenant.role === "member") throw new Error("Only workspace owners and admins can manage the AI connection.");
  if (!rateLimit(`aikey:${tenant.account.id}`, 20, 3_600_000)) throw new Error("Too many attempts. Try again in a little while.");
  return tenant;
}

/** Saves a pasted Anthropic API key for this account, after checking it works. */
export async function saveApiKeyAction(raw: string) {
  return attempt(async () => {
    const tenant = await ownerTenant();
    const key = raw.trim();
    if (!/^sk-ant-[\w-]{20,}$/.test(key)) throw new Error("That doesn't look like an Anthropic API key. It should start with “sk-ant-”.");
    const check = await testKey(key);
    if (!check.ok) throw new Error(check.error);
    db.update(t.accounts)
      .set({ anthropicKeyEnc: encryptSecret(key), anthropicKeyHint: key.slice(-4), anthropicKeyUpdatedAt: new Date() })
      .where(eq(t.accounts.id, tenant.account.id))
      .run();
    audit({ ...tenant, company: null }, { entityType: "account", entityId: tenant.account.id, action: "ai_key_saved", source: "user", summary: `Saved an Anthropic API key ending ${key.slice(-4)}` });
    revalidatePath("/", "layout");
  });
}

export async function removeApiKeyAction() {
  return attempt(async () => {
    const tenant = await ownerTenant();
    db.update(t.accounts).set({ anthropicKeyEnc: null, anthropicKeyHint: null, anthropicKeyUpdatedAt: null }).where(eq(t.accounts.id, tenant.account.id)).run();
    audit({ ...tenant, company: null }, { entityType: "account", entityId: tenant.account.id, action: "ai_key_removed", source: "user", summary: "Removed the saved Anthropic API key" });
    revalidatePath("/", "layout");
  });
}

/** Tests whichever key is currently in use (saved or server-wide). */
export async function testApiKeyAction() {
  return attempt(async () => {
    const tenant = await ownerTenant();
    const resolved = resolveKey(tenant.account.id);
    if (!resolved) throw new Error("No key is set up yet.");
    const check = await testKey(resolved.key);
    if (!check.ok) throw new Error(check.error);
    return resolved.source;
  });
}
