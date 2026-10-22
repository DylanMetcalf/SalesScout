import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { getSwitch } from "@/lib/settings";
import { funnel, qualityMetrics, recentRuns, spendByAgent, stuckJobs } from "@/lib/services/operations";
import { PROBLEM_REASONS, type ProblemReason } from "@/lib/feedback-reasons";
import { STATUS_META } from "@/lib/status";
import { Page, PageHeader } from "@/components/layout/page";
import { Card, CardHeader } from "@/components/ui/card";
import { Notice } from "@/components/ui/error-state";
import { SwitchControl } from "@/components/admin/admin-controls";
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

        <Card>
          <CardHeader title="Kill switches" description="Take effect immediately, before the next paid AI call. Work already in progress finishes its current step." />
          <div className="flex flex-col gap-3 px-5 pb-5">
            <SwitchControl id="discovery_paused" label="Pause new searches" detail="Stops discovery and new batches. Drafting, briefs and the pipeline keep working." on={disc.on} reason={disc.reason ?? null} />
            <SwitchControl id="ai_paused" label="Pause all AI" detail="Stops every paid AI call. Everything already saved stays available." on={ai.on} reason={ai.reason ?? null} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Spend by step (last 30 days)" description={`${k(total.tokens)} tokens · ${total.searches} web searches · ${total.fetches} pages read · estimated ${usd(total.usd)}${total.failedUsd ? ` (of which ${usd(total.failedUsd)} on failed calls)` : ""}`} />
          <div className="overflow-x-auto border-t border-border">
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
          <CardHeader title="Recent searches" description="Cost per search and per kept prospect. A search's cost covers discovery plus every batch researched." />
          <div className="overflow-x-auto border-t border-border">
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
                  {quality.reports.map((r) => <li key={r.reason} className="flex justify-between"><span>{PROBLEM_REASONS[r.reason as ProblemReason] ?? r.reason}</span><span className="tabular-nums">{r.n}</span></li>)}
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
