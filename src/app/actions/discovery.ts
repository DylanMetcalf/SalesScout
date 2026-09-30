"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import * as z from "zod/v4";
import { db, t } from "@/lib/db";
import type { SearchInterpretation } from "@/lib/db/schema";
import { newId } from "@/lib/ids";
import { actionTenant, inCompany, tenantCols } from "@/lib/tenant";
import { acceptOpportunity, setOpportunityStatus, startMarketDiscovery } from "@/lib/services/markets";
import { createSearchRun, createSimilarRun, startDeepResearch, startDiscovery, startManualProspect } from "@/lib/services/discovery";
import { rateLimit } from "@/lib/security/rate-limit";
import { audit } from "@/lib/audit";
import { attempt } from "./result";

function limitAi(key: string) {
  if (!rateLimit(key, 30, 3_600_000)) throw new Error("You've run a lot of research in the last hour. Please wait a little before starting more.");
}

export async function discoverMarketsAction() {
  return attempt(async () => {
    const tenant = await actionTenant();
    limitAi(`ai:${tenant.account.id}`);
    return startMarketDiscovery(tenant);
  });
}

export async function acceptMarketAction(id: string) {
  return attempt(async () => {
    const strategyId = acceptOpportunity(await actionTenant(), id);
    revalidatePath("/", "layout");
    return strategyId;
  });
}

export async function setMarketStatusAction(id: string, status: "saved" | "dismissed" | "suggested") {
  return attempt(async () => {
    setOpportunityStatus(await actionTenant(), id, status);
    revalidatePath("/", "layout");
  });
}

const list = z.array(z.string().trim().min(1).max(120)).max(30);
const StrategyInput = z.object({
  name: z.string().trim().min(1, "Name the strategy").max(80),
  description: z.string().max(500).optional().nullable(),
  industries: list, companyTypes: list, geographies: list, companySizes: list, buyerRoles: list, keywords: list, exclusions: list,
  notes: z.string().max(2000).optional().nullable(),
  status: z.enum(["active", "paused", "archived"]).optional(),
});
export type StrategyInputT = z.infer<typeof StrategyInput>;

export async function saveStrategyAction(id: string | null, input: StrategyInputT) {
  return attempt(async () => {
    const tenant = await actionTenant();
    const s = StrategyInput.parse(input);
    if (id) {
      const before = db.select().from(t.leadStrategies).where(inCompany(t.leadStrategies, tenant, eq(t.leadStrategies.id, id))).get();
      if (!before) throw new Error("Strategy not found.");
      db.update(t.leadStrategies).set({ ...s, updatedAt: new Date() }).where(eq(t.leadStrategies.id, id)).run();
      const changes = (["industries", "geographies", "buyerRoles", "companyTypes"] as const)
        .filter((k) => before[k].join("|") !== s[k].join("|"))
        .map((k) => `${k}: ${before[k].join(", ") || "—"} → ${s[k].join(", ") || "—"}`);
      for (const k of ["industries", "buyerRoles"] as const) {
        for (const removed of before[k].filter((v) => !s[k].includes(v))) {
          db.insert(t.feedback).values({ id: newId("fb"), ...tenantCols(tenant), userId: tenant.user.id, kind: "correction", dimension: `strategy.${k}`, value: null, reason: `removed: ${removed}` }).run();
        }
      }
      audit(tenant, { entityType: "lead_strategy", entityId: id, action: "edited", source: "user", summary: `Edited strategy "${s.name}"${changes.length ? `: ${changes.join("; ")}` : ""}` });
      revalidatePath("/", "layout");
      return id;
    }
    const newIdValue = newId("ls");
    db.insert(t.leadStrategies).values({ id: newIdValue, ...tenantCols(tenant), ...s, origin: "user" }).run();
    audit(tenant, { entityType: "lead_strategy", entityId: newIdValue, action: "created", source: "user", summary: `Created strategy "${s.name}"` });
    revalidatePath("/", "layout");
    return newIdValue;
  });
}

export async function deleteStrategyAction(id: string) {
  return attempt(async () => {
    const tenant = await actionTenant();
    db.update(t.leadStrategies).set({ status: "archived" }).where(inCompany(t.leadStrategies, tenant, eq(t.leadStrategies.id, id))).run();
    revalidatePath("/", "layout");
  });
}

const FilterSchema = z
  .object({ industries: list, companyTypes: list, geographies: list, companySizes: list, buyerRoles: list, keywords: list, exclusions: list })
  .partial();

export async function planSearchAction(input: { query: string; mode: "discover" | "specific"; strategyId?: string | null; filters?: Partial<Record<keyof SearchInterpretation, string[]>> }) {
  return attempt(async () => {
    const tenant = await actionTenant();
    limitAi(`ai:${tenant.account.id}`);
    const query = z.string().max(1000).parse(input.query ?? "");
    const filters = FilterSchema.parse(Object.fromEntries(Object.entries(input.filters ?? {}).filter(([k]) => k in FilterSchema.shape)));
    const id = await createSearchRun(tenant, { query, mode: input.mode === "specific" ? "specific" : "discover", strategyId: input.strategyId, filters });
    revalidatePath("/discover");
    return id;
  });
}

const InterpSchema = z.object({
  summary: z.string().max(1000),
  industries: list, companyTypes: list, geographies: list, companySizes: list, buyerRoles: list, keywords: list, exclusions: list,
  requested: z.number().int().min(1).max(25),
});

export async function runDiscoveryAction(runId: string, interpretation: SearchInterpretation) {
  return attempt(async () => {
    const tenant = await actionTenant();
    limitAi(`ai:${tenant.account.id}`);
    return startDiscovery(tenant, runId, InterpSchema.parse(interpretation));
  });
}

export async function findSimilarAction(prospectId: string) {
  return attempt(async () => createSimilarRun(await actionTenant(), prospectId));
}

export async function deepResearchAction(prospectId: string) {
  return attempt(async () => {
    const tenant = await actionTenant();
    limitAi(`ai:${tenant.account.id}`);
    return startDeepResearch(tenant, prospectId);
  });
}

export async function addProspectAction(input: { name: string; website: string }) {
  return attempt(async () => {
    const tenant = await actionTenant();
    const name = z.string().trim().min(1, "What's the company called?").max(120).parse(input.name);
    const r = startManualProspect(tenant, { name, website: input.website.trim() || null });
    revalidatePath("/", "layout");
    return r;
  });
}
