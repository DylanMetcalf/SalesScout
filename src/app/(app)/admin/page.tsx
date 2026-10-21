import { and, count, desc, eq, gte, isNotNull, sum } from "drizzle-orm";
import { Activity, AlertTriangle, Building2, CheckCircle2, Coins, Globe, KeyRound, Mail, Search, ShieldCheck, Ticket, Users, XCircle } from "lucide-react";
import { db, t } from "@/lib/db";
import { adminEmails, isAdminAccount, monthStart, requireAdmin } from "@/lib/admin";
import { MODEL } from "@/lib/ai/core";
import { Page, PageHeader } from "@/components/layout/page";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AccountAccess, EnquiryStatus, InviteCreator, RevokeInvite } from "@/components/admin/admin-controls";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Admin" };

const fmtTokens = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));

/**
 * Installation back office. Shows metadata only (accounts, usage, invites,
 * enquiries); it never reads another tenant's prospects or research.
 */
export default async function Admin() {
  await requireAdmin();
  const since = monthStart();

  const usageByAccount = new Map(
    db
      .select({ accountId: t.aiInteractions.accountId, calls: count(), input: sum(t.aiInteractions.inputTokens), output: sum(t.aiInteractions.outputTokens), searches: sum(t.aiInteractions.webSearches) })
      .from(t.aiInteractions)
      .where(gte(t.aiInteractions.createdAt, since))
      .groupBy(t.aiInteractions.accountId)
      .all()
      .map((r) => [r.accountId, { calls: r.calls, tokens: Number(r.input ?? 0) + Number(r.output ?? 0), searches: Number(r.searches ?? 0) }]),
  );
  const prospectsByAccount = new Map(
    db
      .select({ accountId: t.workspaces.accountId, n: count() })
      .from(t.prospects)
      .innerJoin(t.workspaces, eq(t.workspaces.id, t.prospects.workspaceId))
      .groupBy(t.workspaces.accountId)
      .all().map((r) => [r.accountId, r.n]),
  );
  const users = db.select({ accountId: t.users.accountId, email: t.users.email, name: t.users.name }).from(t.users).all();
  const accounts = db.select().from(t.accounts).orderBy(desc(t.accounts.createdAt)).all().map((a) => ({
    ...a,
    users: users.filter((u) => u.accountId === a.id),
    usage: usageByAccount.get(a.id) ?? { calls: 0, tokens: 0, searches: 0 },
    prospects: prospectsByAccount.get(a.id) ?? 0,
    admin: isAdminAccount(a.id),
  }));
  const totals = [...usageByAccount.values()].reduce((s, u) => ({ calls: s.calls + u.calls, tokens: s.tokens + u.tokens, searches: s.searches + u.searches }), { calls: 0, tokens: 0, searches: 0 });
  const errors = db
    .select({ id: t.aiInteractions.id, purpose: t.aiInteractions.purpose, error: t.aiInteractions.error, at: t.aiInteractions.createdAt, accountId: t.aiInteractions.accountId })
    .from(t.aiInteractions)
    .where(and(eq(t.aiInteractions.status, "error"), gte(t.aiInteractions.createdAt, since)))
    .orderBy(desc(t.aiInteractions.createdAt))
    .limit(8)
    .all();
  const failedJobs = db.select({ n: count() }).from(t.jobs).where(and(eq(t.jobs.status, "failed"), gte(t.jobs.createdAt, since))).get()!.n;
  const invites = db.select().from(t.invites).orderBy(desc(t.invites.createdAt)).limit(30).all();
  const enquiries = db.select().from(t.enquiries).orderBy(desc(t.enquiries.createdAt)).limit(50).all();
  const ownKeys = db.select({ n: count() }).from(t.accounts).where(isNotNull(t.accounts.anthropicKeyEnc)).get()!.n;
  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? "Deleted account";

  const system = [
    { ok: Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN), label: "Server AI key", detail: process.env.ANTHROPIC_API_KEY ? "Set" : "Not set: only accounts with their own key can use AI" },
    { ok: adminEmails().length > 0, label: "ADMIN_EMAILS", detail: adminEmails().length ? adminEmails().join(", ") : "Not set: the first account is treated as admin" },
    { ok: process.env.ALLOW_SIGNUPS === "false", label: "Sign-ups", detail: process.env.ALLOW_SIGNUPS === "false" ? "Invite only" : "Open to anyone (new accounts must bring their own key)" },
    { ok: Boolean(process.env.APP_ENCRYPTION_KEY), label: "Encryption key", detail: process.env.APP_ENCRYPTION_KEY ? "Set from environment" : "Generated on disk" },
  ];
  const stats = [
    { icon: Building2, label: "Accounts", value: accounts.length },
    { icon: Users, label: "Users", value: users.length },
    { icon: Activity, label: "AI requests this month", value: totals.calls.toLocaleString() },
    { icon: Coins, label: "Tokens this month", value: fmtTokens(totals.tokens) },
    { icon: Search, label: "Web searches this month", value: totals.searches.toLocaleString() },
    { icon: AlertTriangle, label: "Failed jobs this month", value: failedJobs },
  ];

  return (
    <Page width="wide">
      <PageHeader eyebrow="Administration" title="Back office" description={`Everything about this installation. Model: ${MODEL}${process.env.RENDER_GIT_COMMIT ? ` · build ${process.env.RENDER_GIT_COMMIT.slice(0, 7)}` : ""}`} />

      <div className="flex flex-col gap-6">
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-surface p-4">
              <Icon className="size-4 text-accent" aria-hidden />
              <dd className="mt-3 font-display text-2xl font-[650] tabular-nums text-heading">{value}</dd>
              <dt className="text-xs text-muted">{label}</dt>
            </div>
          ))}
        </dl>

        <Card>
          <CardHeader title="System" description="Settings on the server (Render → Environment). Changing one needs a redeploy." />
          <ul className="grid gap-px border-t border-border bg-border sm:grid-cols-2">
            {system.map((s) => (
              <li key={s.label} className="flex items-start gap-3 bg-surface px-5 py-3.5">
                {s.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-strong" aria-label="OK" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-moderate" aria-label="Needs attention" />}
                <div className="min-w-0">
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="break-words text-sm text-muted">{s.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Accounts"
            description={`Who can use your AI key. "Own key" accounts never touch your bill. ${ownKeys} account${ownKeys === 1 ? "" : "s"} saved their own key.`}
          />
          <div className="overflow-x-auto border-t border-border">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-surface-2 text-xs text-muted">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-medium">Account</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Joined</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Prospects</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">AI this month</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Key</th>
                  <th scope="col" className="px-5 py-2.5 font-medium">AI access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium">{a.name} {a.admin && <Badge tone="accent" className="ml-1">Admin</Badge>}</p>
                      <p className="text-xs text-muted">{a.users.map((u) => u.email).join(", ")}</p>
                    </td>
                    <td className="px-3 py-3 text-muted">{formatDate(a.createdAt)}</td>
                    <td className="px-3 py-3 tabular-nums">{a.prospects}</td>
                    <td className="px-3 py-3 tabular-nums">
                      {fmtTokens(a.usage.tokens)}
                      {a.aiMonthlyTokenLimit != null && a.aiAccess === "server" && !a.admin && <span className="text-subtle"> / {fmtTokens(a.aiMonthlyTokenLimit)}</span>}
                      <span className="block text-xs text-subtle">{a.usage.calls} requests · {a.usage.searches} searches</span>
                    </td>
                    <td className="px-3 py-3">{a.anthropicKeyHint ? <span className="inline-flex items-center gap-1 font-mono text-xs"><KeyRound className="size-3.5 text-strong" aria-hidden />…{a.anthropicKeyHint}</span> : <span className="text-subtle">None</span>}</td>
                    <td className="px-5 py-3"><AccountAccess accountId={a.id} access={a.aiAccess} limit={a.aiMonthlyTokenLimit} isAdmin={a.admin} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Invite codes" description="Let someone create an account, even when sign-ups are closed. Choose whether their AI usage is included." action={<Ticket className="size-5 text-accent" aria-hidden />} />
          <div className="flex flex-col gap-4 px-5 pb-5">
            <InviteCreator />
            {invites.length > 0 && (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {invites.map((i) => {
                  const state = i.revokedAt ? "Revoked" : i.uses >= i.maxUses ? "Used" : i.expiresAt && i.expiresAt.getTime() < Date.now() ? "Expired" : "Active";
                  return (
                    <li key={i.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
                      <span className="font-mono tracking-wider text-accent-text select-all">{i.code}</span>
                      <span className="flex-1 font-medium">{i.label}</span>
                      <span className="text-muted">{i.aiAccess === "server" ? `Included${i.aiMonthlyTokenLimit ? ` · ${fmtTokens(i.aiMonthlyTokenLimit)}/mo` : ""}` : "Own key"}</span>
                      <span className="text-muted tabular-nums">{i.uses}/{i.maxUses} used</span>
                      <Badge tone={state === "Active" ? "strong" : "neutral"}>{state}</Badge>
                      {state === "Active" && <RevokeInvite id={i.id} />}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Website enquiries" description="Messages from the contact form." action={<Mail className="size-5 text-accent" aria-hidden />} />
          {enquiries.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted">No enquiries yet. When someone books a call on the website, it appears here.</p>
          ) : (
            <ul className="divide-y divide-border border-t border-border">
              {enquiries.map((e) => (
                <li key={e.id} className="flex flex-col gap-1.5 px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">
                      {e.name}
                      {e.company && <span className="font-normal text-muted"> · {e.company}</span>}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="whitespace-nowrap text-xs text-subtle">{formatDate(e.createdAt, true)}</span>
                      <EnquiryStatus id={e.id} status={e.status} />
                    </div>
                  </div>
                  <p className="text-sm">
                    <a href={`mailto:${e.email}`} className="text-accent-text hover:underline">{e.email}</a>
                    {e.website && <span className="text-muted"> · <Globe className="inline size-3.5" aria-hidden /> {e.website}</span>}
                  </p>
                  <p className="whitespace-pre-line text-sm text-muted">{e.message}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Recent AI errors" description="This month, across all accounts. Only the task and error are shown, never the content." action={<ShieldCheck className="size-5 text-accent" aria-hidden />} />
          {errors.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted">No AI errors this month.</p>
          ) : (
            <ul className="divide-y divide-border border-t border-border text-sm">
              {errors.map((e) => (
                <li key={e.id} className="grid gap-1 px-5 py-3 sm:grid-cols-[160px_180px_1fr]">
                  <span className="text-subtle">{formatDate(e.at, true)}</span>
                  <span className="font-medium">{accountName(e.accountId)}</span>
                  <span className="text-muted"><span className="text-text">{e.purpose}</span> · {e.error}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Page>
  );
}
