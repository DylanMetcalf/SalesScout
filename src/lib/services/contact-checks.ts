import "server-only";
import { resolveMx } from "node:dns/promises";
import { and, eq, isNotNull } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { inCompany, type CompanyTenant } from "@/lib/tenant";
import type { Check, ContactChecks } from "@/lib/verification";

/**
 * Evidence we can record without a paid provider. A mailbox-verification
 * provider (e.g. ZeroBounce, NeverBounce) can add a "mailbox" check later; until
 * then nothing is ever labelled as a verified mailbox.
 */
export function sourceChecks(c: { name: string | null; email: string | null; phone: string | null; source_url: string | null }): ContactChecks {
  const at = Date.now();
  const sourced = Boolean(c.source_url);
  const pass = (method: Check["method"], detail?: string): Check => ({ status: "pass", method, at, detail });
  return {
    role: c.name && sourced ? [pass("role", c.source_url!)] : undefined,
    email: c.email && sourced ? [pass("source", c.source_url!)] : undefined,
    phone: c.phone && sourced ? [pass("source", c.source_url!)] : undefined,
  };
}

const mxCache = new Map<string, { ok: boolean | null; at: number }>();

/** Does the domain have a mail server? Cached for a day; DNS errors are "inconclusive", not "fail". */
async function domainAcceptsMail(domain: string): Promise<boolean | null> {
  const hit = mxCache.get(domain);
  if (hit && Date.now() - hit.at < 86_400_000) return hit.ok;
  let ok: boolean | null;
  try {
    const mx = await Promise.race([resolveMx(domain), new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 5000))]);
    ok = mx.length > 0;
  } catch (err) {
    const code = (err as { code?: string }).code;
    ok = code === "ENOTFOUND" || code === "ENODATA" ? false : null;
  }
  mxCache.set(domain, { ok, at: Date.now() });
  return ok;
}

/** Adds a domain check to each email on a prospect. Safe to call repeatedly. */
export async function checkEmailDomains(tenant: CompanyTenant, prospectId: string) {
  const rows = db.select().from(t.contacts).where(inCompany(t.contacts, tenant, and(eq(t.contacts.prospectId, prospectId), isNotNull(t.contacts.email)))).all();
  for (const c of rows) {
    const domain = c.email!.split("@")[1]?.toLowerCase();
    if (!domain || c.checks?.email?.some((x) => x.method === "domain")) continue;
    const ok = await domainAcceptsMail(domain);
    const check: Check = { status: ok === null ? "inconclusive" : ok ? "pass" : "fail", method: "domain", at: Date.now(), detail: domain };
    const checks: ContactChecks = { ...(c.checks ?? {}), email: [...(c.checks?.email ?? []), check] };
    db.update(t.contacts).set({ checks }).where(inCompany(t.contacts, tenant, eq(t.contacts.id, c.id))).run();
  }
}
