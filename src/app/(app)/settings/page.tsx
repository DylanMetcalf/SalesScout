import { and, count, desc, eq, gte, sum } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { MODEL, resolveKey } from "@/lib/ai/core";
import { ApiKeyForm } from "@/components/settings/api-key-form";
import { Page, PageHeader } from "@/components/layout/page";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { WorkspaceSettings } from "@/components/settings/workspace-settings";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Settings" };

export default async function Settings() {
  const tenant = await requireTenant();
  const ws = tenant.workspace;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const usage = db
    .select({ calls: count(), input: sum(t.aiInteractions.inputTokens), output: sum(t.aiInteractions.outputTokens), searches: sum(t.aiInteractions.webSearches) })
    .from(t.aiInteractions)
    .where(and(eq(t.aiInteractions.workspaceId, ws.id), gte(t.aiInteractions.createdAt, monthStart)))
    .get()!;
  const failures = db.select({ n: count() }).from(t.aiInteractions).where(and(eq(t.aiInteractions.workspaceId, ws.id), gte(t.aiInteractions.createdAt, monthStart), eq(t.aiInteractions.status, "error"))).get()!.n;
  const recentAi = db.select().from(t.aiInteractions).where(eq(t.aiInteractions.workspaceId, ws.id)).orderBy(desc(t.aiInteractions.createdAt)).limit(8).all();
  const members = db
    .select({ name: t.users.name, email: t.users.email, role: t.workspaceMembers.role })
    .from(t.workspaceMembers)
    .innerJoin(t.users, eq(t.users.id, t.workspaceMembers.userId))
    .where(eq(t.workspaceMembers.workspaceId, ws.id))
    .all();
  const exportsLog = db.select().from(t.exportsLog).where(eq(t.exportsLog.workspaceId, ws.id)).orderBy(desc(t.exportsLog.createdAt)).limit(5).all();
  const resolved = resolveKey(tenant.account.id);
  const ai = resolved !== null;

  return (
    <Page width="narrow">
      <PageHeader title="Settings" description={`${ws.name} workspace · ${tenant.account.name}`} />
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader title="Workspace" description="Workspace context is shared with Sales Scout for every company in this workspace." />
          <div className="px-5 pb-5">
            <WorkspaceSettings initial={{ name: ws.name, description: ws.description ?? "", context: ws.context ?? "" }} canEdit={tenant.role !== "member"} />
          </div>
        </Card>

        <Card id="ai">
          <CardHeader
            title="AI & research"
            description="Powers the Company Brain, market discovery, prospect research and outreach drafts."
            action={ai ? <Badge tone="strong" dot>Connected</Badge> : <Badge tone="moderate" dot>Not connected</Badge>}
          />
          <div className="flex flex-col gap-4 px-5 pb-5 text-[14.5px]">
            <ApiKeyForm
              status={{
                source: resolved?.source ?? null,
                hint: tenant.account.anthropicKeyHint,
                updatedAt: tenant.account.anthropicKeyUpdatedAt?.getTime() ?? null,
                serverKey: Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN),
                canEdit: tenant.role !== "member",
              }}
            />
            {ai ? (
              <p className="text-sm text-muted">Model: <span className="font-mono text-text">{MODEL}</span>, with live web search and page reading.</p>
            ) : (
              <div className="text-sm text-muted">
                <p>Until a key is connected:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Company Brain analysis records only what your sources state directly.</li>
                  <li>Market discovery, prospect discovery and deep research are switched off — never simulated.</li>
                  <li>Outreach uses a clearly labelled template instead of an AI draft.</li>
                  <li>Everything else — CRM, pipeline, follow-ups, exports — works fully.</li>
                </ul>
              </div>
            )}
            <dl className="grid grid-cols-2 gap-4 rounded-lg bg-surface-2 p-4 sm:grid-cols-4">
              {[
                ["AI requests", usage.calls],
                ["Web searches", Number(usage.searches ?? 0)],
                ["Tokens", (Number(usage.input ?? 0) + Number(usage.output ?? 0)).toLocaleString()],
                ["Failed", failures],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <dt className="text-xs text-muted">{k} · this month</dt>
                  <dd className="text-lg font-semibold tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            {recentAi.length > 0 && (
              <details>
                <summary className="cursor-pointer text-sm font-medium">Recent AI activity</summary>
                <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                  {recentAi.map((a) => (
                    <li key={a.id} className="flex gap-3">
                      <span className="w-36 shrink-0 text-subtle">{formatDate(a.createdAt, true)}</span>
                      <span className="flex-1">{a.purpose}</span>
                      <span className={a.status === "ok" ? "text-strong" : "text-weak"}>{a.status === "ok" ? `${(a.durationMs / 1000).toFixed(1)}s` : a.error ?? a.status}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Members" description="Team roles and permissions arrive with multi-user workspaces." />
          <ul className="divide-y divide-border border-t border-border">
            {members.map((m) => (
              <li key={m.email} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={m.name} size={30} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{m.name}</p>
                  <p className="text-sm text-muted">{m.email}</p>
                </div>
                <Badge>{m.role === "owner" ? "Owner" : m.role === "admin" ? "Admin" : "Member"}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Recent exports" />
          <div className="px-5 pb-5 text-sm">
            {exportsLog.length === 0 ? (
              <p className="text-muted">No exports yet.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {exportsLog.map((e) => (
                  <li key={e.id} className="flex gap-3">
                    <span className="w-36 shrink-0 text-subtle">{formatDate(e.createdAt, true)}</span>
                    <span>{e.format.toUpperCase()} · {e.rowCount} prospects</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Privacy & security" />
          <ul className="list-disc space-y-1.5 px-5 pb-5 pl-10 text-sm text-muted">
            <li>Every workspace and company is isolated — in the application and by database guards.</li>
            <li>Uploaded documents are stored privately per company.</li>
            <li>Sales Scout never sends email or messages on your behalf.</li>
            <li>Contact details are only shown when found in a public source — never guessed.</li>
          </ul>
        </Card>
      </div>
    </Page>
  );
}
