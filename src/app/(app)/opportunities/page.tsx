import Link from "next/link";
import { ArrowUpRight, CalendarClock, Inbox, PhoneCall, Search, Sparkles } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { listOpportunities, overview } from "@/lib/opportunities/service";
import { STAGE_META, STAGES, type Stage } from "@/lib/opportunities/types";
import { Page, PageHeader } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { formatDate, relativeDay, timeAgo } from "@/lib/format";

export const metadata = { title: "Opportunities" };
export const dynamic = "force-dynamic";

/** Stage colour on each row's left edge, from the same semantic tones as the stage badges. */
const EDGE = { info: "border-l-info", accent: "border-l-accent", moderate: "border-l-moderate", violet: "border-l-violet", strong: "border-l-strong", neutral: "border-l-border-strong", weak: "border-l-weak" } as const;

const FILTERS: { key: string; label: string }[] = [{ key: "open", label: "Open" }, { key: "", label: "All" }, ...STAGES.map((s) => ({ key: s, label: STAGE_META[s].label }))];

export default async function Opportunities({ searchParams }: { searchParams: Promise<{ q?: string; stage?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const stage = sp.stage ?? "open";
  const rows = listOpportunities({ q: sp.q, stage });
  const ov = overview();
  const n = (s: Stage[]) => s.reduce((a, k) => a + (ov.byStage[k] ?? 0), 0);
  const total = n([...STAGES]);
  const tiles = [
    { label: "New", value: n(["new"]), href: "?stage=new", hint: "to read", rule: "bg-info" },
    { label: "Calls requested", value: ov.callsRequested, href: "?stage=open", hint: "waiting for you", rule: "bg-signal" },
    { label: "In discovery", value: n(["reviewing", "discovery"]), href: "?stage=discovery", hint: "being understood", rule: "bg-accent" },
    { label: "Proposals", value: n(["proposal"]), href: "?stage=proposal", hint: "in progress", rule: "bg-violet" },
    { label: "Active projects", value: n(["accepted", "building"]), href: "?stage=building", hint: "accepted or building", rule: "bg-strong" },
    { label: "Delivered", value: n(["delivered"]), href: "?stage=delivered", hint: "completed", rule: "bg-text" },
  ];

  return (
    <Page width="wide">
      <PageHeader
        eyebrow={<span className="caption-mono text-subtle">Workspace · Inbound</span>}
        title="Opportunities"
        description="Every business problem that came in, from first message to delivered project."
        actions={<Link href="/" target="_blank" className={buttonClass("ghost")}>View the website <ArrowUpRight className="size-4" aria-hidden /></Link>}
      />

      {total === 0 ? (
        <Card>
          <EmptyState
            icon={<Inbox />}
            title="No opportunities yet"
            body="When someone uses “Tell us your problem” on the website, it lands here with everything they wrote. You’ll also get an email if Resend is set up."
            action={<Link href="/start" target="_blank" className={buttonClass("primary")}>Try the form yourself</Link>}
          />
        </Card>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 xl:grid-cols-6" aria-label="Overview">
            {tiles.map((t) => (
              <li key={t.label} className="bg-surface">
                <Link href={t.href} className="group relative block px-4 pt-4 pb-3.5 transition-colors hover:bg-surface-2">
                  <span aria-hidden className={cn("absolute inset-x-4 top-0 h-[3px] origin-left scale-x-[0.25] rounded-b transition-transform duration-300 group-hover:scale-x-100", t.rule)} />
                  <span className="caption-mono block text-subtle">{t.label}</span>
                  <span className="mt-2 block font-display text-[34px] leading-none font-semibold tracking-[-0.03em] tabular-nums text-heading">{t.value}</span>
                  <span className="mt-1.5 block text-xs text-subtle">{t.hint}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
            <section aria-labelledby="h-list" className="min-w-0">
              <h2 id="h-list" className="sr-only">Opportunity list</h2>
              <form className="flex flex-col gap-3 sm:flex-row sm:items-center" role="search">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden />
                  <Input name="q" defaultValue={sp.q} placeholder="Search people, companies or problems" aria-label="Search opportunities" className="pl-9" />
                </div>
                <input type="hidden" name="stage" value={stage} />
              </form>
              <nav aria-label="Filter by stage" className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
                {FILTERS.map((f) => {
                  const active = stage === f.key;
                  const href = `?${new URLSearchParams({ ...(sp.q && { q: sp.q }), stage: f.key }).toString()}`;
                  return (
                    <Link key={f.key || "all"} href={href} aria-current={active ? "page" : undefined} className={cn("shrink-0 rounded-full border px-3 py-1 text-sm transition-colors", active ? "border-accent bg-accent-soft font-medium text-accent-text" : "border-border bg-surface text-muted hover:text-text")}>
                      {f.label}
                    </Link>
                  );
                })}
              </nav>

              <Card className="mt-4 overflow-hidden">
                {rows.length === 0 ? (
                  <EmptyState compact icon={<Search />} title="Nothing matches" body="Try another stage or a different search." />
                ) : (
                  <ul className="divide-y divide-border">
                    {rows.map((r) => (
                      <li key={r.id}>
                        <Link href={`/opportunities/${r.id}`} className={cn("grid gap-2 border-l-[3px] px-5 py-4 transition-colors hover:bg-surface-2/70 sm:grid-cols-[1fr_auto] sm:gap-6", EDGE[STAGE_META[r.stage].tone])}>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-heading">{r.companyName || r.name}</span>
                              {r.companyName && <span className="text-sm text-muted">{r.name}</span>}
                              <Badge tone={STAGE_META[r.stage].tone} dot>{STAGE_META[r.stage].label}</Badge>
                              {r.callRequestedAt && ["new", "reviewing"].includes(r.stage) && <Badge tone="moderate"><PhoneCall className="size-3" aria-hidden /> Call requested</Badge>}
                              {r.analysed && <span className="text-subtle" title="AI analysis available"><Sparkles className="size-3.5" aria-label="Analysed" /></span>}
                            </div>
                            <p className="mt-1 line-clamp-2 text-[14.5px] text-muted">{r.problem}</p>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-subtle sm:flex-col sm:items-end sm:justify-center sm:gap-1">
                            <span>Received {formatDate(r.createdAt)}</span>
                            {r.nextDue ? (
                              <span className={cn("flex items-center gap-1", r.nextDue.getTime() < Date.now() ? "font-medium text-weak" : "text-muted")}><CalendarClock className="size-3.5" aria-hidden /> {relativeDay(r.nextDue)}</span>
                            ) : (
                              <span>Updated {timeAgo(r.updatedAt)}</span>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>

            <aside className="flex flex-col gap-6" aria-label="Tasks and activity">
              <Card>
                <CardHeader title="Due soon" description="Open tasks due by tomorrow." />
                {ov.dueTasks.length === 0 ? (
                  <p className="border-t border-border px-5 py-4 text-sm text-muted">Nothing due. Add tasks from an opportunity.</p>
                ) : (
                  <ul className="divide-y divide-border border-t border-border">
                    {ov.dueTasks.map((d) => (
                      <li key={d.id}>
                        <Link href={`/opportunities/${d.opportunityId}`} className="block px-5 py-3 hover:bg-surface-2/70">
                          <p className="text-sm text-text">{d.body}</p>
                          <p className={cn("mt-0.5 text-xs", d.dueAt && d.dueAt.getTime() < Date.now() ? "font-medium text-weak" : "text-subtle")}>{d.companyName || d.name} · {relativeDay(d.dueAt)}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <Card>
                <CardHeader title="Recent activity" />
                <ul className="divide-y divide-border border-t border-border">
                  {ov.recent.map((a, i) => (
                    <li key={i}>
                      <Link href={`/opportunities/${a.opportunityId}`} className="block px-5 py-3 hover:bg-surface-2/70">
                        <p className="text-sm text-text">{a.body}</p>
                        <p className="mt-0.5 text-xs text-subtle">{a.companyName || a.name} · {timeAgo(a.createdAt)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            </aside>
          </div>
        </>
      )}
    </Page>
  );
}
