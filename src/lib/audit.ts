import "server-only";
import { db, t } from "@/lib/db";
import { newId } from "@/lib/ids";
import type { Tenant } from "@/lib/tenant";

type AuditInput = {
  entityType: string;
  entityId?: string | null;
  action: string;
  source: "user" | "ai" | "web_research" | "system" | "extraction";
  summary: string;
  detail?: Record<string, unknown>;
};

/** Records a traceable event: what happened, to what, and who or what caused it. */
export function audit(tenant: Pick<Tenant, "account" | "workspace" | "company" | "user">, input: AuditInput) {
  db.insert(t.auditLog)
    .values({
      id: newId("aud"),
      accountId: tenant.account.id,
      workspaceId: tenant.workspace.id,
      companyId: tenant.company?.id ?? null,
      userId: input.source === "user" ? tenant.user.id : null,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      action: input.action,
      source: input.source,
      summary: input.summary,
      detail: input.detail ?? null,
    })
    .run();
}
