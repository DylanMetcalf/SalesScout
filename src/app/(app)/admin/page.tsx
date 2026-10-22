import { and, count, desc, eq, gte, isNotNull, sum } from "drizzle-orm";
import { Activity, AlertTriangle, Building2, CheckCircle2, Coins, Globe, KeyRound, Mail, Search, ShieldCheck, Ticket, Users, XCircle } from "lucide-react";
import { db, t } from "@/lib/db";
import { adminEmails, isAdminAccount, monthStart, requireAdmin } from "@/lib/admin";
import { MODEL } from "@/lib/ai/core";
import { Page, PageHeader } from "@/components/layout/page";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AccessControl, AccountAccess, EnquiryStatus, InviteCreator, PlanControl, ResetLink, RevokeInvite } from "@/components/admin/admin-controls";
import { balance } from "@/lib/billing/credits";
import { paystackConfigured } from "@/lib/billing/paystack";
import { PAID_PLANS, planPrice } from "@/lib/billing/plans";
import { verificationPolicy } from "@/lib/billing/eligibility";
import { phoneVerificationAvailable } from "@/lib/services/verify";
import { unitEconomics } from "@/lib/billing/economics";
import { formatDate } from "@/lib/format";
import { processInfo, storage } from "@/lib/system";
import { bookingUrl } from "@/lib/booking";
import { enquiryEmailsEnabled } from "@/lib/notify";

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
  const users = db.select({ id: t.users.id, accountId: t.users.accountId, email: t.users.email, name: t.users.name }).from(t.users).all();
  const accounts = db.select().from(t.accounts).orderBy(desc(t.accounts.createdAt)).all().map((a) => ({
    ...a,
    users: users.filter((u) => u.accountId === a.id),
    usage: usageByAccount.get(a.id) ?? { calls: 0, tokens: 0, searches: 0 },
    prospects: prospectsByAccount.get(a.id) ?? 0,
    admin: isAdminAccount(a.id),
    credits: balance(a).total,
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
  const econ = unitEconomics(accounts.filter((a) => !a.admin).map((a) => ({ plan: a.plan, paid: a.plan !== "free" && (a.planSource === "manual" || ["active", "past_due"].includes(a.subscriptionStatus)), price: a.plan !== "free" ? planPrice(a.plan as (typeof PAID_PLANS)[number]) : null })));
  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? "Deleted account";

  const disk = storage();
  const proc = processInfo();
  const uptime = proc.uptimeSeconds < 3600 ? `${Math.max(1, Math.round(proc.uptimeSeconds / 60))} min` : proc.uptimeSeconds < 172_800 ? `${Math.round(proc.uptimeSeconds / 3600)} h` : `${Math.round(proc.uptimeSeconds / 86_400)} days`;
  const system = [
    {
      ok: disk.persistent !== false,
      label: "Data storage",
      detail: disk.persistent === false ? `NOT on a persistent disk (${disk.dir}). Every deploy wipes all accounts and data. Attach a Render disk at /var/data.` : disk.persistent ? `Persistent disk at ${disk.dir}` : `Local folder ${disk.dir}`,
    },
    { ok: proc.memoryMb < 420, label: "Server", detail: `Up ${uptime} since last restart · ${proc.memoryMb} MB memory in use${proc.memoryMb >= 420 ? " (close to the 512 MB limit)" : ""}` },
    { ok: Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN), label: "Server AI key", detail: process.env.ANTHROPIC_API_KEY ? "Set" : "Not set: only accounts with their own key can use AI" },
    { ok: adminEmails().length > 0, label: "ADMIN_EMAILS", detail: adminEmails().length ? adminEmails().join(", ") : "Not set: the first account is treated as admin" },
    { ok: process.env.ALLOW_SIGNUPS === "false", label: "Sign-ups", detail: process.env.ALLOW_SIGNUPS === "false" ? "Invite only" : "Open to anyone (new accounts must bring their own key)" },
    { ok: Boolean(bookingUrl()), label: "Discovery-call booking", detail: bookingUrl() ? `Calendar shown on Contact: ${bookingUrl()}` : "Not set: add BOOKING_URL (Calendly, Cal.com or Google appointment page) to show a calendar" },
    { ok: enquiryEmailsEnabled(), label: "Enquiry emails", detail: enquiryEmailsEnabled() ? `New enquiries are emailed to ${process.env.ENQUIRY_EMAIL || "the site contact email"}` : "Not set: add RESEND_API_KEY to get an email for each enquiry" },
    { ok: paystackConfigured() && PAID_PLANS.some((p) => process.env[`PAYSTACK_PLAN_${p.toUpperCase()}`]), label: "Online payments (Paystack)", detail: paystackConfigured() ? `Plans on sale: ${PAID_PLANS.filter((p) => process.env[`PAYSTACK_PLAN_${p.toUpperCase()}`]).join(", ") || "none (add PAYSTACK_PLAN_SCOUT/GROWTH/SCALE)"}` : "Not set: add PAYSTACK_SECRET_KEY and plan codes. Until then, use manual plans below." },
    { ok: true, label: "Sign-up verification", detail: [verificationPolicy().email ? "Email required" : "Email optional", verificationPolicy().phone ? (phoneVerificationAvailable() ? "Phone required" : "Phone required but Twilio isn't set up") : "Phone optional"].join(" · ") },
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
            <table className="w-full min-w-[1240px] text-left text-sm">
              <thead className="bg-surface-2 text-xs text-muted">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-medium">Account</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Joined</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Prospects</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">AI this month</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Key</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Sign-in access</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Plan and credits</th>
                  <th scope="col" className="px-5 py-2.5 font-medium">AI access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium">{a.name} {a.admin && <Badge tone="accent" className="ml-1">Admin</Badge>}</p>
                      {a.users.map((u) => (
                        <p key={u.id} className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                          {u.email}
                          <ResetLink userId={u.id} email={u.email} />
                        </p>
                      ))}
                    </td>
                    <td className="px-3 py-3 text-muted">{formatDate(a.createdAt)}</td>
                    <td className="px-3 py-3 tabular-nums">{a.prospects}</td>
                    <td className="px-3 py-3 tabular-nums">
                      {fmtTokens(a.usage.tokens)}
                      {a.aiMonthlyTokenLimit != null && a.aiAccess === "server" && !a.admin && <span className="text-subtle"> / {fmtTokens(a.aiMonthlyTokenLimit)}</span>}
                      <span className="block text-xs text-subtle">{a.usage.calls} requests · {a.usage.searches} searches</span>
                    </td>
                    <td className="px-3 py-3">{a.anthropicKeyHint ? <span className="inline-flex items-center gap-1 font-mono text-xs"><KeyRound className="size-3.5 text-strong" aria-hidden />…{a.anthropicKeyHint}</span> : <span className="text-subtle">None</span>}</td>
                    <td className="px-3 py-3"><PlanControl accountId={a.id} plan={a.plan} source={a.planSource} credits={a.credits} isAdmin={a.admin} /></td>
                    <td className="px-3 py-3"><AccessControl accountId={a.id} paused={Boolean(a.suspendedAt)} until={a.accessUntil ? a.accessUntil.toISOString().slice(0, 10) : ""} isAdmin={a.admin} /></td>
                    <td className="px-5 py-3"><AccountAccess accountId={a.id} access={a.aiAccess} limit={a.aiMonthlyTokenLimit} isAdmin={a.admin} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Access codes" description="Give a client access: they sign in with their email and the code as their password. Set how long it lasts; pause or extend it any time under Accounts." action={<Ticket className="size-5 text-accent" aria-hidden />} />
          <div className="flex flex-col gap-4 px-5 pb-5">
            <InviteCreator />
            {invites.length > 0 && (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {invites.map((i) => {
                  const state = i.revokedAt ? "Revoked" : i.uses >= i.maxUses ? "Used" : i.expiresAt && i.expiresAt.getTime() < Date.now() ? "Expired" : "Active";
                  return (
                    <li key={i.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
                      <span className="font-mono tracking-wider text-accent-text select-all">{i.code}</span>
                      <span className="flex-1 font-medium">{i.label}{i.email && <span className="block text-xs font-normal text-muted">{i.email}</span>}</span>
                      {i.accessDays && <span className="text-muted">{i.accessDays} days</span>}
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
          <CardHeader title="Unit economics (last 30 days)" description="From recorded usage. Money figures appear only once you set real prices (see the note below); nothing here is guessed." />
          <dl className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
            {econ.rows.map((r) => (
              <div key={r.label} className="bg-surface px-5 py-3.5">
                <dt className="text-xs text-muted">{r.label}</dt>
                <dd className="mt-1 font-semibold tabular-nums">{r.value}</dd>
              </div>
            ))}
          </dl>
          <p className="border-t border-border px-5 py-3 text-xs text-subtle">{econ.note}</p>
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
