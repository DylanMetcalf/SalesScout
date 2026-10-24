import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { getSwitch } from "@/lib/settings";
import { funnel, openReports, qualityMetrics, recentRuns, spendByAccount, spendByAgent, stuckJobs } from "@/lib/services/operations";
import { serverSpendThisMonth } from "@/lib/ai/budget";
import { AGENTS } from "@/lib/ai/models";
import { PROBLEM_REASONS, type ProblemReason } from "@/lib/feedback-reasons";
import { STATUS_META } from "@/lib/status";
import { Page, PageHeader } from "@/components/layout/page";
import { Card, CardHeader } from "@/components/ui/card";
import { Notice } from "@/components/ui/error-state";
import { ResolveReport, StepSwitch, SwitchControl } from "@/components/admin/admin-controls";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Operations" };
export const dynamic = "force-dynamic";

const usd = (v: number | null) => (v === null ? "—" : v < 0.01 && v > 0 ? "<$0.01" : `$${v.toFixed(2)}`);
const k = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : String(v));

export default async function Operations() {
  await requireAdmin();
  const agents = spendByAgent(30);
  const runs = recentRuns(25);
  const quality = qualityMetrics(30);
  const stages = funnel();
  const stuck = stuckJobs();
  const ai = getSwitch("ai_paused");
  const disc = getSwitch("discovery_paused");
  const accounts = spendByAccount(30);
  const open = openReports(20);
  const month = serverSpendThisMonth();
  const capUse = [month.tokenCap !== null ? month.tokens / month.tokenCap : 0, month.usdCap !== null ? month.usd / month.usdCap : 0].reduce((a, b) => Math.max(a, b));
  const total = agents.reduce((s, a) => ({ tokens: s.tokens + a.input + a.output, searches: s.searches + a.searches, fetches: s.fetches + a.fetches, usd: a.usd === null ? s.usd : (s.usd ?? 0) + a.usd, unpriced: s.unpriced + a.unpriced, failedUsd: s.failedUsd + (a.failedUsd ?? 0) }), { tokens: 0, searches: 0, fetches: 0, usd: null as number | null, unpriced: 0, failedUsd: 0 });

  return (
    <Page width="wide">
      <Link href="/admin" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <ArrowLeft className="size-4" aria-hidden /> Back office
      </Link>
      <PageHeader eyebrow="Administration" title="Operations" description="Where the money and effort go, how good the results are, and the switches to stop spending fast." />

      <div className="flex flex-col gap-6">
        {total.unpriced > 0 && (
          <Notice tone="moderate" title="Costs are partly unknown">
            {total.unpriced} AI calls in the last 30 days have no cost estimate because AI prices aren&apos;t configured. Set AI_PRICE_INPUT_USD_PER_MTOK, AI_PRICE_OUTPUT_USD_PER_MTOK and AI_PRICE_WEB_SEARCH_USD_PER_1000 from your Anthropic pricing. All costs here are estimates; your Anthropic invoice is the source of truth.
          </Notice>
        )}
        {stuck.length > 0 && <Notice tone="moderate" title={`${stuck.length} job${stuck.length === 1 ? "" : "s"} look stuck`}>No progress for 20+ minutes. A restart marks interrupted jobs as failed; users can retry them without being charged again for searches that never ran.</Notice>}

        {month.tokenCap === null && month.usdCap === null && (
          <Notice tone="moderate" title="No monthly AI budget set">
            Nothing caps what the server key can spend this month. Set AI_MONTHLY_BUDGET_USD (needs prices) or AI_MONTHLY_TOKEN_BUDGET, and set a spend limit in your Anthropic console as the hard stop.
          </Notice>
        )}
        {capUse >= 0.8 && <Notice tone="moderate" title={`${Math.round(capUse * 100)}% of this month's AI budget used`}>At 100%, AI on the server key pauses until the 1st. Customers using their own key aren&apos;t affected.</Notice>}

        <Card>
          <CardHeader title="This month on the server key" description="What the business pays for (customers' own keys excluded). Estimates; your Anthropic invoice is the source of truth." />
          <dl className="grid gap-px border-t border-border bg-border sm:grid-cols-3">
            {[
              ["Estimated cost", `${usd(month.usd)}${month.usdCap !== null ? ` of $${month.usdCap}` : ""}`, month.unpriced ? `${month.unpriced} calls not priced` : "All calls priced"],
              ["Tokens", `${k(month.tokens)}${month.tokenCap !== null ? ` of ${k(month.tokenCap)}` : ""}`, "Input + output"],
              ["Budget", month.tokenCap === null && month.usdCap === null ? "Not set" : `${Math.round(capUse * 100)}% used`, "Resets on the 1st (UTC)"],
            ].map(([label, value, hint]) => (
              <div key={label} className="bg-surface px-5 py-4">
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="font-display text-xl font-[650] tabular-nums text-heading">{value}</dd>
                <dd className="text-xs text-muted">{hint}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <CardHeader title="Kill switches" description="Take effect immediately, before the next paid AI call. Work already in progress finishes its current step." />
          <div className="flex flex-col gap-3 px-5 pb-5">
            <SwitchControl id="discovery_paused" label="Pause new searches" detail="Stops discovery and new batches. Drafting, briefs and the pipeline keep working." on={disc.on} reason={disc.reason ?? null} />
            <SwitchControl id="ai_paused" label="Pause all AI" detail="Stops every paid AI call. Everything already saved stays available." on={ai.on} reason={ai.reason ?? null} />
            <details className="rounded-lg border border-border px-4 py-2">
              <summary className="cursor-pointer py-1 text-sm font-medium">Pause one step</summary>
              <ul className="divide-y divide-border">
                {Object.entries(AGENTS).map(([a, label]) => <StepSwitch key={a} id={`agent_paused:${a}`} label={label} on={getSwitch(`agent_paused:${a}`).on} />)}
              </ul>
            </details>
          </div>
        </Card>

        <Card>
          <CardHeader title="Spend by step (last 30 days)" description={`${k(total.tokens)} tokens · ${total.searches} web searches · ${total.fetches} pages read · estimated ${usd(total.usd)}${total.failedUsd ? ` (of which ${usd(total.failedUsd)} on failed calls)` : ""}`} />
          <div className="overflow-x-auto border-t border-border" tabIndex={0} role="region" aria-label={"Spend by step table"}>
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-surface-2 text-xs text-muted">
                <tr>{["Step", "Model", "Calls", "Failed", "Input tokens (cached)", "Output", "Searches", "Pages read", "Avg time", "Est. cost"].map((h) => <th key={h} scope="col" className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {agents.length === 0 && <tr><td colSpan={10} className="px-4 py-4 text-muted">No AI calls in the last 30 days.</td></tr>}
                {agents.map((a) => (
                  <tr key={a.agent + a.model}>
                    <td className="px-4 py-2.5 font-medium">{a.agent.replace(/_/g, " ")}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{a.model}</td>
                    <td className="px-4 py-2.5">{a.calls}</td>
                    <td className="px-4 py-2.5">{a.failed || "—"}</td>
                    <td className="px-4 py-2.5">{k(a.input)} ({k(a.cached)})</td>
                    <td className="px-4 py-2.5">{k(a.output)}</td>
                    <td className="px-4 py-2.5">{a.searches}</td>
                    <td className="px-4 py-2.5">{a.fetches}</td>
                    <td className="px-4 py-2.5">{(a.avgMs / 1000).toFixed(1)}s</td>
                    <td className="px-4 py-2.5">{usd(a.usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Spend by account (last 30 days)" description="For unit economics: estimated AI cost against prospects kept. Excludes hosting, email and your time." />
          <div className="overflow-x-auto border-t border-border" tabIndex={0} role="region" aria-label={"Spend by account table"}>
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-surface-2 text-xs text-muted">
                <tr>{["Account", "Plan", "Paid by", "Calls", "Tokens", "Est. cost", "Kept", "Per kept"].map((h) => <th key={h} scope="col" className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {accounts.length === 0 && <tr><td colSpan={8} className="px-4 py-4 text-muted">No AI usage in the last 30 days.</td></tr>}
                {accounts.map((a) => (
                  <tr key={a.accountId}>
                    <td className="px-4 py-2.5 font-medium">{a.name}</td>
                    <td className="px-4 py-2.5 capitalize">{a.plan}</td>
                    <td className="px-4 py-2.5">{a.keySource}</td>
                    <td className="px-4 py-2.5">{a.calls}</td>
                    <td className="px-4 py-2.5">{k(a.tokens)}</td>
                    <td className="px-4 py-2.5">{usd(a.usd)}{a.unpriced ? "*" : ""}</td>
                    <td className="px-4 py-2.5">{a.kept}</td>
                    <td className="px-4 py-2.5">{usd(a.usdPerKept)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {accounts.some((a) => a.unpriced) && <p className="border-t border-border px-5 py-2 text-xs text-muted">* Includes calls made before prices were set; their cost is unknown, so the real figure is higher.</p>}
        </Card>

        <Card>
          <CardHeader title="Recent searches" description="Cost per search and per kept prospect. A search's cost covers discovery plus every batch researched." />
          <div className="overflow-x-auto border-t border-border" tabIndex={0} role="region" aria-label={"Recent searches table"}>
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-surface-2 text-xs text-muted">
                <tr>{["When", "Account", "Mode", "Status", "Batches", "Found / dup.", "Previews", "Kept", "Tokens", "Searches", "Est. cost", "Per kept", "Time"].map((h) => <th key={h} scope="col" className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {runs.length === 0 && <tr><td colSpan={13} className="px-4 py-4 text-muted">No searches yet.</td></tr>}
                {runs.map((r) => (
                  <tr key={r.id} title={r.error ?? undefined}>
                    <td className="px-4 py-2.5 whitespace-nowrap text-muted">{formatDate(r.createdAt, true)}</td>
                    <td className="px-4 py-2.5">{r.accountName}</td>
                    <td className="px-4 py-2.5">{r.contactMode === "verified" ? "Verified" : "Broad"}</td>
                    <td className="px-4 py-2.5">{r.status}</td>
                    <td className="px-4 py-2.5">{r.batches}</td>
                    <td className="px-4 py-2.5">{r.discovered} / {r.duplicates}</td>
                    <td className="px-4 py-2.5">{r.previews}</td>
                    <td className="px-4 py-2.5">{r.kept}</td>
                    <td className="px-4 py-2.5">{k(r.tokens)}</td>
                    <td className="px-4 py-2.5">{r.searches}</td>
                    <td className="px-4 py-2.5">{usd(r.usd)}</td>
                    <td className="px-4 py-2.5">{usd(r.usdPerKept)}</td>
                    <td className="px-4 py-2.5">{r.minutes === null ? "—" : `${r.minutes}m`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Problems to review" description="Reported by users. Classify each so only confirmed errors count against data quality; preferences and policy issues are tracked separately." />
          {open.length === 0 ? <p className="border-t border-border px-5 py-4 text-sm text-muted">Nothing waiting. Reports appear here when someone uses “Report a problem” on a prospect.</p> : (
            <ul className="divide-y divide-border border-t border-border">
              {open.map((r) => (
                <li key={r.id} className="grid gap-2 px-5 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="font-medium">{PROBLEM_REASONS[r.reason as ProblemReason] ?? r.reason} <span className="font-normal text-muted">· {r.prospect ?? "Deleted prospect"} · {r.account}</span></p>
                    <p className="text-xs text-muted">{formatDate(r.createdAt, true)}{r.note ? ` · “${r.note}”` : ""}</p>
                  </div>
                  <ResolveReport id={r.id} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Quality (last 30 days)" description="Across all accounts." />
            <dl className="divide-y divide-border border-t border-border">
              {quality.rows.map((q) => (
                <div key={q.label} className="flex items-center justify-between gap-4 px-5 py-3">
                  <dt><span className="font-medium">{q.label}</span><span className="block text-xs text-muted">{q.hint}</span></dt>
                  <dd className="font-display text-xl font-[650] tabular-nums text-heading">{q.value}</dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-border px-5 py-4">
              <p className="text-sm font-medium">Problems reported</p>
              {quality.reports.length === 0 ? <p className="text-sm text-muted">None yet.</p> : (
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {quality.reports.map((r) => <li key={r.reason} className="flex justify-between"><span>{PROBLEM_REASONS[r.reason as ProblemReason] ?? r.reason}</span><span className="tabular-nums">{r.n}{r.open ? ` (${r.open} open)` : ""}</span></li>)}
                </ul>
              )}
            </div>
          </Card>
          <Card>
            <CardHeader title="Kept prospects by stage" description="Where kept prospects are now, as reported by users. It shows progress, not proof that Sales Scout caused a sale." />
            <ul className="divide-y divide-border border-t border-border">
              {stages.length === 0 && <li className="px-5 py-4 text-sm text-muted">No kept prospects yet.</li>}
              {stages.map((s) => (
                <li key={s.status} className="flex justify-between px-5 py-2.5 text-sm">
                  <span>{STATUS_META[s.status].label}</span>
                  <span className="tabular-nums">{s.n}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </Page>
  );
}
