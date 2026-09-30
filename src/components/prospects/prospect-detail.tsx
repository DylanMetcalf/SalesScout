"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, CalendarCheck, Check, CircleHelp, Download, ExternalLink, FileText, Layers, MoreHorizontal, Send, Telescope, CircleCheck, CircleDashed,
} from "lucide-react";
import { Button, IconButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FitBadge, FitDimensions } from "@/components/ui/fit";
import { Menu } from "@/components/ui/menu";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import { Notice } from "@/components/ui/error-state";
import { cn } from "@/components/ui/cn";
import { JobProgress } from "@/components/ai/job-progress";
import { addToCrmAction } from "@/app/actions/prospects";
import { deepResearchAction, findSimilarAction } from "@/app/actions/discovery";
import { formatDate, relativeDay } from "@/lib/format";
import type { ProspectView } from "@/lib/types";
import { StatusSelect } from "./status-select";
import { WhyPanel } from "./why-panel";
import { People } from "./people";
import { ActivityPanel, type ActivityItem, type AuditItem, type FollowUpItem } from "./activity-panel";
import { OutreachDrawer, type Draft } from "./outreach-drawer";
import { FollowUpDialog } from "./follow-up-dialog";
import { BriefDialog } from "./brief-dialog";
import { useAction, type ContactFull } from "./shared";

type Extra = {
  domain: string | null;
  recentActivity: { title: string; url?: string; date?: string }[];
  lastContactAt: number | null;
  nextFollowUpAt: number | null;
  createdAt: number;
  runTitle: string | null;
  runId: string | null;
  strategyName: string | null;
};

const DEPTH = ["", "Level 1 · Discovery", "Level 2 · Qualification", "Level 3 · Deep research"];
const DEEP_STEPS = [
  { key: "read", label: "Reading their website in depth" },
  { key: "news", label: "Looking for recent news and activity" },
  { key: "people", label: "Looking for the right people" },
  { key: "assess", label: "Re-assessing fit and opportunity" },
];

function Block({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-subtle">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ProspectDetail({
  p, extra, contacts, activities, followUps, drafts, audit, aiConnected, jobId: initialJob, initialTab, sender,
}: {
  p: ProspectView;
  extra: Extra;
  contacts: ContactFull[];
  activities: ActivityItem[];
  followUps: FollowUpItem[];
  drafts: Draft[];
  audit: AuditItem[];
  aiConnected: boolean;
  jobId: string | null;
  initialTab?: string;
  sender: { name: string; company: string };
}) {
  const router = useRouter();
  const [tab, setTab] = useState(initialTab && ["overview", "research", "activity", "outreach"].includes(initialTab) ? initialTab : "overview");
  const [why, setWhy] = useState(false);
  const [outreach, setOutreach] = useState<{ open: boolean; draft: Draft | null; contactId?: string }>({ open: false, draft: null });
  const [followUp, setFollowUp] = useState(false);
  const [brief, setBrief] = useState(false);
  const [job, setJob] = useState<string | null>(initialJob);
  const { pending, run } = useAction();
  void sender;

  const research = () => run(() => deepResearchAction(p.id), { refresh: false, then: (id) => setJob(id) });
  const similar = () => run(() => findSimilarAction(p.id), { refresh: false, then: (id) => router.push(`/discover/runs/${id}`) });
  const openDraft = (contactId?: string) => setOutreach({ open: true, draft: null, contactId });


  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
      <Link href="/prospects" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <ArrowLeft className="size-4" aria-hidden /> Prospects
      </Link>

      <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">{p.name}</h1>
            {p.isExample && <Badge tone="violet">Example data</Badge>}
          </div>
          <p className="mt-1 text-muted">{[p.industry, p.location].filter(Boolean).join(" · ") || "Industry and location unknown"}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {p.fit && <FitBadge level={p.fit.company.level} />}
            <Button size="sm" variant="subtle" icon={<CircleHelp className="size-4" />} onClick={() => setWhy(true)}>WHY?</Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusSelect id={p.id} status={p.status} />
          {!p.inCrm && p.status !== "rejected" && (
            <Button icon={<Check className="size-4" />} loading={pending} onClick={() => run(() => addToCrmAction(p.id), { success: "Added to your pipeline" })}>
              Add to pipeline
            </Button>
          )}
          <Button icon={<CalendarCheck className="size-4" />} onClick={() => setFollowUp(true)}>Follow up</Button>
          <Button variant="primary" icon={<Send className="size-4" />} onClick={() => openDraft()}>Draft outreach</Button>
          <Menu
            align="end"
            width={230}
            items={[
              { label: "Sales brief", icon: <FileText />, onSelect: () => setBrief(true) },
              { label: "Research deeper", icon: <Telescope />, onSelect: research },
              { label: "Find similar", icon: <Layers />, onSelect: similar },
              ...(p.website && !p.isExample ? [{ label: "Open website", icon: <ExternalLink />, onSelect: () => window.open(p.website!, "_blank", "noopener") }] : []),
              { type: "separator" as const },
              { label: "Export as CSV", icon: <Download />, onSelect: () => (window.location.href = `/api/export?format=csv&ids=${p.id}`) },
              { label: "Export report", icon: <FileText />, onSelect: () => window.open(`/reports/prospects?ids=${p.id}`, "_blank") },
            ]}
            trigger={({ ref, ...tp }) => (
              <IconButton ref={ref} {...tp} label="More actions" className="border border-border bg-surface shadow-sm">
                <MoreHorizontal className="size-4" />
              </IconButton>
            )}
          />
        </div>
      </header>

      {job && (
        <div className="mt-6">
          <JobProgress
            jobId={job}
            title={`Researching ${p.name}…`}
            initialSteps={DEEP_STEPS}
            onDone={(j) => {
              if (j.status !== "failed") {
                setJob(null);
                router.refresh();
              }
            }}
            failureActions={() => (
              <>
                <Button size="sm" onClick={research}>Retry</Button>
                <Button size="sm" variant="ghost" onClick={() => setJob(null)}>Continue with available information</Button>
              </>
            )}
          />
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <Tabs
            label="Prospect sections"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "overview", label: "Overview" },
              { id: "research", label: "Research & evidence", count: p.evidence.length },
              { id: "activity", label: "Activity", count: activities.length },
              { id: "outreach", label: "Outreach", count: drafts.length || undefined },
            ]}
          />
          <div className="pt-6">
            <TabPanel id="overview" active={tab === "overview"} className="flex flex-col gap-8">
              {p.status === "rejected" && p.rejectionReason && <Notice tone="moderate" title="Set aside">{p.rejectionReason}</Notice>}
              <Block title="What they do">
                <p className="text-[15.5px] leading-7">{p.whatTheyDo ?? "Not researched yet."}</p>
              </Block>
              <Block title="Why they may be relevant" action={<button onClick={() => setWhy(true)} className="text-sm font-medium text-accent-text hover:underline">See the reasoning</button>}>
                <p className="text-[15.5px] leading-7">{p.whyRelevant ?? "Not assessed yet."}</p>
              </Block>
              <Block title="Potential opportunity">
                <p className="text-[15.5px] leading-7">{p.potentialOpportunity ?? "Not assessed yet."}</p>
              </Block>
              <People prospectId={p.id} contacts={contacts} isExample={p.isExample} onDraft={(id) => openDraft(id)} />
              <section className="rounded-lg border border-accent/25 bg-accent-soft/40 p-5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-accent-text">Next step</h2>
                <p className="mt-1.5 text-[15.5px] font-medium leading-7">{p.suggestedNextStep ?? "Review the research, then decide whether to reach out."}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="primary" icon={<Send className="size-4" />} onClick={() => openDraft()}>Draft outreach</Button>
                  <Button size="sm" icon={<CalendarCheck className="size-4" />} onClick={() => setFollowUp(true)}>Schedule follow-up</Button>
                  <Button size="sm" variant="ghost" icon={<FileText className="size-4" />} onClick={() => setBrief(true)}>Sales brief</Button>
                </div>
              </section>
            </TabPanel>

            <TabPanel id="research" active={tab === "research"} className="flex flex-col gap-8">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{DEPTH[p.researchDepth] ?? DEPTH[1]}</p>
                  <p className="text-sm text-muted">{p.researchDepth >= 3 ? "The deepest research we do." : "Deeper research reads more of their site, recent news and leadership pages."}</p>
                </div>
                {p.researchDepth < 3 && (
                  <Button size="sm" icon={<Telescope className="size-4" />} onClick={research} disabled={!aiConnected || !!job} title={aiConnected ? undefined : "AI isn't connected"}>
                    Research deeper
                  </Button>
                )}
              </div>
              {p.fit && (
                <Block title="How they fit">
                  <div className="rounded-lg border border-border bg-surface px-4">
                    <FitDimensions fit={p.fit} />
                  </div>
                </Block>
              )}
              <div className="grid gap-6 md:grid-cols-2">
                <Block title="Confirmed">
                  {p.confirmedFacts.length ? (
                    <ul className="flex flex-col gap-2">{p.confirmedFacts.map((f) => <li key={f} className="flex gap-2 text-[14.5px]"><CircleCheck className="mt-1 size-4 shrink-0 text-strong" aria-hidden />{f}</li>)}</ul>
                  ) : <p className="text-sm text-subtle">Nothing confirmed by a source yet.</p>}
                </Block>
                <Block title="Inferred">
                  {p.inferences.length ? (
                    <ul className="flex flex-col gap-2">{p.inferences.map((f) => <li key={f} className="flex gap-2 text-[14.5px]"><CircleDashed className="mt-1 size-4 shrink-0 text-info" aria-hidden />{f}</li>)}</ul>
                  ) : <p className="text-sm text-subtle">No inferences.</p>}
                </Block>
              </div>
              <Block title="What we don't know">
                {p.unknowns.length ? <ul className="list-disc space-y-1 pl-5 text-[14.5px] text-muted">{p.unknowns.map((u) => <li key={u}>{u}</li>)}</ul> : <p className="text-sm text-subtle">Nothing flagged.</p>}
              </Block>
              <Block title="Evidence">
                {p.evidence.length ? (
                  <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
                    {p.evidence.map((e) => (
                      <li key={e.id} className="px-4 py-3">
                        {e.url && !p.isExample ? (
                          <a href={e.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-accent-text hover:underline">{e.title}<ExternalLink className="size-3" aria-hidden /></a>
                        ) : <p className="font-medium">{e.title}</p>}
                        {e.snippet && <p className="mt-0.5 text-sm text-muted">{e.snippet}</p>}
                        <p className="mt-1 text-xs text-subtle">{[e.supports && `Supports: ${e.supports}`, e.url].filter(Boolean).join(" · ")}</p>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-subtle">No sources recorded yet.</p>}
              </Block>
              {extra.recentActivity.length > 0 && (
                <Block title="Recent activity">
                  <ul className="flex flex-col gap-2">
                    {extra.recentActivity.map((a) => (
                      <li key={a.title} className="text-[14.5px]">
                        {a.url && !p.isExample ? <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-accent-text hover:underline">{a.title}</a> : a.title}
                        {a.date && <span className="text-sm text-subtle"> · {a.date}</span>}
                      </li>
                    ))}
                  </ul>
                </Block>
              )}
            </TabPanel>

            <TabPanel id="activity" active={tab === "activity"}>
              <ActivityPanel prospectId={p.id} activities={activities} followUps={followUps} audit={audit} onFollowUp={() => setFollowUp(true)} />
            </TabPanel>

            <TabPanel id="outreach" active={tab === "outreach"} className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-muted">Drafts you&apos;ve prepared for {p.name}. Sales Scout never sends anything for you.</p>
                <Button size="sm" variant="primary" icon={<Send className="size-4" />} onClick={() => openDraft()}>New draft</Button>
              </div>
              {drafts.length === 0 && <p className="text-sm text-subtle">No drafts yet.</p>}
              {drafts.map((d) => (
                <button key={d.id} onClick={() => setOutreach({ open: true, draft: d })} className="rounded-lg border border-border bg-surface p-4 text-left hover:border-border-strong">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{d.subject ?? { email: "Email", linkedin: "LinkedIn message", call: "Call script", follow_up: "Follow-up" }[d.channel]}</span>
                    <Badge tone={d.status === "handed_off" ? "strong" : d.status === "edited" ? "info" : "neutral"}>{d.status === "handed_off" ? "Sent to email" : d.status === "edited" ? "Edited" : "Draft"}</Badge>
                    <span className="ml-auto text-xs text-subtle">{formatDate(d.createdAt)}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{d.body}</p>
                </button>
              ))}
            </TabPanel>
          </div>
        </div>

        <aside className="flex flex-col gap-4 lg:pt-12" aria-label="Prospect details">
          <dl className="rounded-lg border border-border bg-surface text-sm">
            {[
              ["Next follow-up", extra.nextFollowUpAt ? relativeDay(extra.nextFollowUpAt) : "None", extra.nextFollowUpAt && extra.nextFollowUpAt < new Date().setHours(0, 0, 0, 0) ? "text-weak font-medium" : ""],
              ["Last contact", extra.lastContactAt ? relativeDay(extra.lastContactAt) : "Not yet", ""],
              ["Website", p.website ? (p.isExample ? `${extra.domain} (example)` : <a key="w" href={p.website} target="_blank" rel="noopener noreferrer" className="text-accent-text hover:underline">{extra.domain}</a>) : "Unknown", ""],
              ["Found by", extra.runId ? <Link key="r" href={`/discover/runs/${extra.runId}`} className="text-accent-text hover:underline">{extra.runTitle}</Link> : p.origin === "manual" ? "Added by you" : "Sales Scout", ""],
              ["Strategy", extra.strategyName ?? "—", ""],
              ["Research", DEPTH[p.researchDepth] ?? DEPTH[1], ""],
              ["Added", formatDate(extra.createdAt), ""],
            ].map(([k, v, cls], i) => (
              <div key={i} className="flex items-start justify-between gap-3 border-b border-border px-4 py-2.5 last:border-0">
                <dt className="text-muted">{k}</dt>
                <dd className={cn("text-right", cls as string)}>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-sm font-medium">Sales brief</p>
            <p className="mt-0.5 text-sm text-muted">Everything you need before making contact, in under a minute.</p>
            <Button size="sm" className="mt-3" icon={<FileText className="size-4" />} onClick={() => setBrief(true)}>Open brief</Button>
          </div>
        </aside>
      </div>

      <WhyPanel p={p} open={why} onClose={() => setWhy(false)} />
      <OutreachDrawer
        open={outreach.open}
        onClose={() => { setOutreach({ open: false, draft: null }); router.refresh(); }}
        prospectId={p.id}
        prospectName={p.name}
        contacts={contacts}
        preferredContactId={outreach.contactId}
        existing={outreach.draft}
        aiConnected={aiConnected}
      />
      <FollowUpDialog open={followUp} onClose={() => setFollowUp(false)} prospectId={p.id} prospectName={p.name} suggestion={p.suggestedNextStep && p.suggestedNextStep.length < 90 ? p.suggestedNextStep : null} />
      <BriefDialog open={brief} onClose={() => setBrief(false)} prospectId={p.id} name={p.name} />
    </div>
  );
}
