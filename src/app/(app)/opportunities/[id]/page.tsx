import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText, Lock, PhoneCall, Printer } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { aiConfigured } from "@/lib/ai/core";
import { documentsOf, getOpportunity, itemsOf, relatedOpportunities, type Opportunity } from "@/lib/opportunities/service";
import { AI_TASKS } from "@/lib/opportunities/jobs";
import { BRIEF_FIELDS, DOC_KINDS, PROJECT_FIELDS, PROPOSAL_FIELDS, STAGE_META } from "@/lib/opportunities/types";
import { Page } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/error-state";
import { buttonClass } from "@/components/ui/button";
import { formatDate, timeAgo } from "@/lib/format";
import { ActivityPanel, AiTaskButton, CreateDocButton, DeleteOpportunity, DetailsEditor, ProductSignalForm, StageSelect, StatusSelect, TextDocEditor } from "@/components/opportunities/controls";
import { OpportunityTabs } from "@/components/opportunities/tabs";
import { BriefingPanel } from "@/components/opportunities/briefing-panel";
import { briefingFor } from "@/lib/opportunities/briefings";
import { Block, Label, List, Origin, SourceLink } from "@/components/opportunities/parts";
import { cn } from "@/components/ui/cn";
import { Waypoints } from "@/components/brand/waypoints";

export const metadata = { title: "Opportunity", robots: { index: false } };
export const dynamic = "force-dynamic";

const CONF = { high: "strong", medium: "moderate", low: "neutral" } as const;

function ai(task: keyof typeof AI_TASKS) {
  return { task, title: AI_TASKS[task].label + "…", doneTitle: AI_TASKS[task].done, steps: AI_TASKS[task].steps };
}

function OverviewTab({ o, related, canAi, briefing }: { o: Opportunity; related: ReturnType<typeof relatedOpportunities>; canAi: boolean; briefing: ReturnType<typeof briefingFor> }) {
  const c = o.context ?? {};
  const ctx = [["What their business does", c.business], ["Part of the business", c.area], ["How they handle it today", c.current], ["How often", c.frequency], ["What they’d like instead", c.ideal]].filter(([, v]) => v) as [string, string][];
  const a = o.analysis;
  return (
    <div className="flex flex-col gap-6">
      <Block title="What they told us" origin="customer" action={<span className="flex items-center gap-1 text-xs text-subtle"><Lock className="size-3" aria-hidden /> Original, never edited</span>}>
        <blockquote className="border-l-2 border-signal pl-4 text-[15.5px] leading-7 whitespace-pre-wrap">{o.problem}</blockquote>
        {ctx.length > 0 && (
          <dl className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
            {ctx.map(([k, v]) => <div key={k}><dt className="text-xs text-subtle">{k}</dt><dd className="mt-0.5 text-sm whitespace-pre-wrap">{v}</dd></div>)}
          </dl>
        )}
        <p className="mt-4 text-xs text-subtle">
          Received {formatDate(o.createdAt, true)} via {o.source === "contact_form" ? "the old contact form" : "the website"}.
          {o.consentAt ? ` Agreed to the privacy notice (version ${o.privacyVersion}).` : " Sent before consent was recorded; use it only to reply."}
          {` Prefers ${o.contactPreference === "whatsapp" ? "WhatsApp" : o.contactPreference}.`}
        </p>
      </Block>

      <Block title="Customer briefing" origin="ai" action={<span className="text-xs text-subtle">What the customer received</span>}>
        {/* Only what the panel needs: never the content or the token hash. */}
        <BriefingPanel
          id={o.id}
          b={briefing && {
            reference: briefing.reference, status: briefing.status, error: briefing.error, attempts: briefing.attempts, model: briefing.model, updatedAt: briefing.updatedAt,
            expiresAt: briefing.expiresAt, revokedAt: briefing.revokedAt, viewCount: briefing.viewCount, firstViewedAt: briefing.firstViewedAt, lastViewedAt: briefing.lastViewedAt,
            emailStatus: briefing.emailStatus, emailError: briefing.emailError, emailSentAt: briefing.emailSentAt,
          }}
        />
      </Block>

      {!a ? (
        <Block title="Problem analysis" origin="ai">
          <p className="mb-4 max-w-xl text-sm text-muted">A structured first read: what’s happening, what’s missing, what to ask next and possible directions. Uses one AI call. Meeting notes you add later are included when you re-run it.</p>
          <AiTaskButton id={o.id} {...ai("analysis")} label="Analyse the problem" variant="primary" disabled={!canAi} disabledReason={canAi ? undefined : "AI isn’t connected. Add a key in Settings."} />
        </Block>
      ) : (
        <Block
          title="Problem analysis"
          origin="ai"
          action={<div className="flex flex-wrap gap-2"><AiTaskButton id={o.id} {...ai("analysis")} label="Re-run" variant="subtle" disabled={!canAi} /><CreateDocButton id={o.id} kind="assessment" label="Create assessment" variant="ghost" /></div>}
        >
          <p className="mb-4 text-xs text-subtle">Generated {timeAgo(new Date(a.generatedAt))}. Distinguishes what they said from what the AI infers; check it against the original.</p>
          <div className="grid gap-5 lg:grid-cols-2">
            <div><Label>What they say is happening</Label><p className="text-[14.5px]">{a.customerSays}</p></div>
            <div><Label>Current process</Label><p className="text-[14.5px]">{a.currentProcess}</p></div>
            <div><Label>Apparent source of friction</Label><p className="text-[14.5px]">{a.friction}</p></div>
            <div><Label>Impact (as described)</Label><p className="text-[14.5px]">{a.impact}</p></div>
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="rounded-md bg-insight p-4"><Label>Ask next</Label><ol className="flex list-decimal flex-col gap-1 pl-5 text-[14.5px]">{a.questions.map((q, i) => <li key={i}>{q}</li>)}</ol></div>
            <div><Label>Missing information</Label><List items={a.missingInfo} /></div>
          </div>
          <div className="mt-6">
            <Label>Possible directions</Label>
            <ul className="grid gap-3 md:grid-cols-2">
              {a.directions.map((d, i) => (
                <li key={i} className="rounded-md border border-border p-3.5">
                  <div className="flex items-start justify-between gap-2"><p className="font-medium">{d.title}</p><Badge tone={CONF[d.confidence]}>{d.confidence} confidence</Badge></div>
                  <p className="mt-1 text-sm text-muted">{d.why}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div><Label>Systems it may touch</Label><List items={a.integrations} /></div>
            <div><Label>Risks and uncertainties</Label><List items={a.risks} /></div>
          </div>
          <p className="mt-6 rounded-md border border-accent/30 bg-accent-soft/50 px-4 py-3 text-[14.5px]"><span className="font-semibold">Suggested next step: </span>{a.nextAction}</p>
        </Block>
      )}

      {related.length > 0 && (
        <Block title="Other problems from this organisation" action={<span className="text-xs text-subtle">Matched by website or email domain</span>}>
          <ul className="divide-y divide-border">
            {related.map((r) => (
              <li key={r.id} className="py-2.5"><Link href={`/opportunities/${r.id}`} className="flex items-center justify-between gap-3 hover:text-accent-text"><span className="line-clamp-1 text-sm">{r.problem}</span><Badge tone={STAGE_META[r.stage].tone}>{STAGE_META[r.stage].label}</Badge></Link></li>
            ))}
          </ul>
        </Block>
      )}
    </div>
  );
}

function CompanyTab({ o, canAi }: { o: Opportunity; canAi: boolean }) {
  const r = o.research;
  const v = o.visibility;
  const byPriority = v ? [...v.recommendations].sort((a, b) => ["high", "medium", "low"].indexOf(a.priority) - ["high", "medium", "low"].indexOf(b.priority)) : [];
  const areas = v ? [...new Set(v.observed.map((x) => x.area))] : [];
  return (
    <div className="flex flex-col gap-6">
      {!r ? (
        <Block title="Company intelligence" origin="research">
          <p className="mb-4 max-w-xl text-sm text-muted">Reads {o.website ? "their website" : "public sources"} and a few public pages to understand the business behind the problem. Every finding is marked as observed (with its source) or inferred.</p>
          <AiTaskButton id={o.id} {...ai("research")} label="Research the company" variant="primary" disabled={!canAi} disabledReason={canAi ? undefined : "AI isn’t connected."} />
        </Block>
      ) : (
        <Block title="Company intelligence" origin="research" action={<div className="flex flex-wrap gap-2"><AiTaskButton id={o.id} {...ai("research")} label="Refresh" variant="subtle" disabled={!canAi} /><CreateDocButton id={o.id} kind="briefing" label="Create company briefing" variant="ghost" /></div>}>
          <p className="mb-4 text-xs text-subtle">Researched {formatDate(new Date(r.researchedAt), true)}. Public information can be out of date.</p>
          <p className="text-[15px] leading-7">{r.summary}</p>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div><Label>Offerings</Label><List items={r.offerings} empty="Not found." /></div>
            <div><Label>Markets and customers</Label><List items={r.markets} empty="Not found." /></div>
          </div>
          <div className="mt-6">
            <Label>Findings</Label>
            <ul className="flex flex-col gap-2">
              {r.findings.map((f, i) => (
                <li key={i} className="flex flex-col gap-1 rounded-md border border-border px-3.5 py-2.5 sm:flex-row sm:items-start sm:gap-3">
                  <Badge tone={f.kind === "observed" ? "strong" : "violet"} className="self-start">{f.kind === "observed" ? "Observed" : "Inferred"}</Badge>
                  <div className="min-w-0 flex-1 text-[14.5px]">{f.statement}{f.sourceUrl && <div className="mt-0.5 text-xs"><SourceLink url={f.sourceUrl} /></div>}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div><Label>Where we might help (hypotheses)</Label><List items={r.improvements} /></div>
            <div><Label>Questions for the conversation</Label><List items={r.questions} /></div>
          </div>
          <div className="mt-6"><Label>Couldn’t find or confirm</Label><List items={r.gaps} /></div>
          {r.sources.length > 0 && (
            <details className="mt-6 text-sm"><summary className="cursor-pointer font-medium">{r.sources.length} sources</summary><ul className="mt-2 flex flex-col gap-1">{r.sources.map((s) => <li key={s.url} className="min-w-0"><SourceLink url={s.url} title={s.title} /></li>)}</ul></details>
          )}
        </Block>
      )}

      {!v ? (
        <Block title="Visibility assessment" origin="observed">
          <p className="mb-4 max-w-xl text-sm text-muted">For Mea Creo’s visibility work. Checks the website directly (titles, descriptions, headings, structured data, robots.txt, sitemap), runs a few searches, then prioritises recommendations. It can’t see rankings, traffic or Search Console data.</p>
          <AiTaskButton id={o.id} {...ai("visibility")} label="Assess website visibility" disabled={!canAi || !o.website} disabledReason={!o.website ? "Add their website under Details first." : !canAi ? "AI isn’t connected." : undefined} />
        </Block>
      ) : (
        <Block title="Visibility assessment" origin="observed" action={<div className="flex flex-wrap gap-2"><AiTaskButton id={o.id} {...ai("visibility")} label="Re-assess" variant="subtle" disabled={!canAi} /><CreateDocButton id={o.id} kind="visibility" label="Create visibility report" variant="ghost" /></div>}>
          <p className="mb-4 text-xs text-subtle">Assessed {formatDate(new Date(v.assessedAt), true)} · {v.pagesChecked.length} pages read directly.</p>
          <p className="text-[15px] leading-7">{v.summary} <Origin kind="ai" className="ml-1 align-middle" /></p>
          <div className="mt-6">
            <Label>Recommendations</Label>
            <ol className="flex flex-col gap-3">
              {byPriority.map((x, i) => (
                <li key={i} className="rounded-md border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2"><p className="font-medium">{x.title}</p><Badge tone={x.priority === "high" ? "weak" : x.priority === "medium" ? "moderate" : "neutral"}>{x.priority} priority</Badge><Badge>{x.effort} effort</Badge><Badge tone={CONF[x.confidence]}>{x.confidence} confidence</Badge></div>
                  <p className="mt-1.5 text-sm text-muted">{x.why}</p>
                  <details className="mt-2 text-sm"><summary className="cursor-pointer font-medium text-accent-text">How to do it, and how to measure it</summary><p className="mt-2 whitespace-pre-wrap">{x.how}</p><p className="mt-2 text-muted"><span className="font-medium text-text">Measure: </span>{x.measure}</p></details>
                </li>
              ))}
            </ol>
          </div>
          <details className="mt-6"><summary className="cursor-pointer text-sm font-medium">What we checked directly ({v.observed.length} observations)</summary>
            <div className="mt-3 flex flex-col gap-4">
              {areas.map((area) => (
                <div key={area}><Label>{area}</Label><ul className="flex flex-col gap-1 text-sm">{v.observed.filter((x) => x.area === area).map((x, i) => <li key={i} className="flex flex-col"><span>{x.finding}</span>{x.url && <span className="text-xs"><SourceLink url={x.url} /></span>}</li>)}</ul></div>
              ))}
            </div>
          </details>
          {v.searchNotes.length > 0 && <div className="mt-6"><Label>Search observations</Label><ul className="flex flex-col gap-1.5 text-sm">{v.searchNotes.map((n, i) => <li key={i}>{n.note}{n.sourceUrl && <> <SourceLink url={n.sourceUrl} /></>}</li>)}</ul></div>}
          <div className="mt-6 rounded-md bg-surface-2 p-4"><Label>Limitations</Label><List items={v.limitations} /></div>
        </Block>
      )}
    </div>
  );
}

const ROUTE = ["new", "reviewing", "discovery", "proposal", "accepted", "building", "delivered"] as const;

/** Where this opportunity is on its route. Closed ones (lost, declined, archived) say so instead. */
function StageRoute({ stage }: { stage: Opportunity["stage"] }) {
  const at = ROUTE.indexOf(stage as (typeof ROUTE)[number]);
  if (at === -1) return <p className="caption-mono mb-6 text-subtle">Closed · {STAGE_META[stage].label}</p>;
  return (
    <div className="mb-8 overflow-x-auto rounded-lg border border-border bg-surface px-5 pt-4 pb-3 scrollbar-thin">
      <Waypoints
        label="Stage progress"
        className="min-w-[640px]"
        steps={ROUTE.map((s, i) => ({ label: STAGE_META[s].label, state: i < at ? "done" : i === at ? (s === "delivered" ? "done" : "current") : "todo" }))}
      />
    </div>
  );
}

const PROPOSAL_STATUS: [string, string][] = [["draft", "Draft"], ["ready", "Ready to send"], ["sent", "Sent (by you)"], ["accepted", "Accepted"], ["declined", "Declined"]];
const PROJECT_STATUS: [string, string][] = [["not_started", "Not started"], ["in_progress", "In progress"], ["on_hold", "On hold"], ["delivered", "Delivered"]];

export default async function OpportunityPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const user = await requireAdmin();
  const { id } = await params;
  const { tab } = await searchParams;
  let o: Opportunity;
  try {
    o = getOpportunity(id);
  } catch {
    notFound();
  }
  const items = itemsOf(id);
  const docs = documentsOf(id);
  const related = relatedOpportunities(o);
  const canAi = aiConfigured(user.accountId);
  const projectOpen = ["accepted", "building", "delivered"].includes(o.stage);

  const tabs = [
    { id: "overview", label: "Problem", content: <OverviewTab o={o} related={related} canAi={canAi} briefing={briefingFor(o.id)} /> },
    { id: "company", label: "Company", content: <CompanyTab o={o} canAi={canAi} /> },
    {
      id: "solution",
      label: "Solution brief",
      content: (
        <Block title="Solution brief" origin="operator" action={<AiTaskButton id={o.id} {...ai("brief")} label={o.brief ? "Fill empty fields with AI" : "Draft with AI"} variant="subtle" disabled={!canAi} />}>
          <p className="mb-5 max-w-2xl text-sm text-muted">Turn the problem into a structured brief. AI drafts only fill empty fields and never overwrite your edits. Internal: it isn’t shared unless you create a document and send it yourself.</p>
          <TextDocEditor key={JSON.stringify(o.brief)} id={o.id} which="brief" fields={BRIEF_FIELDS} values={o.brief} footer={o.brief && <CreateDocButton id={o.id} kind="solution_brief" label="Create document" variant="ghost" />} />
        </Block>
      ),
    },
    {
      id: "proposal",
      label: "Proposal",
      content: (
        <Block
          title="Proposal"
          origin="operator"
          action={<div className="flex flex-wrap items-center gap-2"><StatusSelect id={o.id} which="proposal" value={o.proposalStatus} options={PROPOSAL_STATUS} /><AiTaskButton id={o.id} {...ai("proposal")} label={o.proposal ? "Fill empty fields with AI" : "Draft from the brief"} variant="subtle" disabled={!canAi || !o.brief} disabledReason={!o.brief ? "Write the solution brief first." : undefined} /></div>}
        >
          <Notice tone="moderate" className="mb-5">Prices, dates and commitments are yours to write. The AI never fills them in, and the proposal document can’t be created while any “[To be completed by Mea Creo]” remains. Sales Scout never sends it: download it and send it yourself.</Notice>
          <TextDocEditor key={JSON.stringify(o.proposal)} id={o.id} which="proposal" fields={PROPOSAL_FIELDS} values={o.proposal} footer={o.proposal && <CreateDocButton id={o.id} kind="proposal" label="Create proposal document" variant="ghost" />} />
        </Block>
      ),
    },
    {
      id: "project",
      label: "Project",
      content: (
        <div className="flex flex-col gap-6">
          {!projectOpen && <Notice tone="info">This becomes the project record once the opportunity is accepted. You can start filling it in now.</Notice>}
          <Block title="Project handover" origin="operator" action={<StatusSelect id={o.id} which="project" value={o.projectStatus} options={PROJECT_STATUS} />}>
            <p className="mb-5 max-w-2xl text-sm text-muted">Carries what was learned into delivery, so nothing gathered during the sale is lost.</p>
            <TextDocEditor key={JSON.stringify(o.project)} id={o.id} which="project" fields={PROJECT_FIELDS} values={o.project} prefill={o.brief ? { objectives: o.brief.desiredOutcome ?? "", requirements: o.brief.knownRequirements ?? "", scope: o.proposal?.scope ?? "", deliverables: o.proposal?.deliverables ?? "" } : null} footer={o.project && <CreateDocButton id={o.id} kind="handover" label="Create handover document" variant="ghost" />} />
          </Block>
          <Block title="Reusable product signal" origin="operator">
            <p className="mb-4 max-w-2xl text-sm text-muted">Record whether this problem could become a repeatable product. It’s evidence for a later decision, not a decision.</p>
            <ProductSignalForm id={o.id} value={o.product} />
          </Block>
        </div>
      ),
    },
    {
      id: "documents",
      label: `Documents${docs.length ? ` (${docs.length})` : ""}`,
      content: (
        <Block title="Documents" action={<span className="text-xs text-subtle">Each version is frozen as it was created</span>}>
          {docs.length === 0 ? (
            <p className="text-sm text-muted">No documents yet. Create one from the analysis, company research, visibility assessment, solution brief, proposal or project tabs.</p>
          ) : (
            <ul className="divide-y divide-border">
              {docs.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-3 py-3">
                  <FileText className="size-4 text-subtle" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{DOC_KINDS[d.kind]} <span className="font-normal text-muted">v{d.version}</span></p>
                    <p className="text-xs text-subtle">{formatDate(d.createdAt, true)}{d.createdBy ? ` · ${d.createdBy}` : ""}</p>
                  </div>
                  <a href={`/reports/opportunity/${d.id}`} target="_blank" className={buttonClass("ghost", "sm")}>Open <ExternalLink className="size-3.5" aria-hidden /></a>
                  <a href={`/reports/opportunity/${d.id}?print=1`} target="_blank" className={buttonClass("secondary", "sm")}><Printer className="size-3.5" aria-hidden /> Save as PDF</a>
                </li>
              ))}
            </ul>
          )}
        </Block>
      ),
    },
  ];

  return (
    <Page width="wide">
      <Link href="/opportunities" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"><ArrowLeft className="size-4" aria-hidden /> Opportunities</Link>
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-[-0.015em] sm:text-[28px]">{o.companyName || o.name}</h1>
            <Badge tone={STAGE_META[o.stage].tone} dot>{STAGE_META[o.stage].label}</Badge>
            {o.callRequestedAt && <Badge tone="moderate"><PhoneCall className="size-3" aria-hidden /> Asked for a call {timeAgo(o.callRequestedAt)}</Badge>}
            {o.bookingOpenedAt && <Badge>Opened the booking calendar</Badge>}
          </div>
          <p className="mt-1 text-muted">{o.name}{o.role ? `, ${o.role}` : ""} · <a href={`mailto:${o.email}`} className="text-accent-text hover:underline">{o.email}</a>{o.phone ? ` · ${o.phone}` : ""}</p>
          <p className="mt-1 text-sm text-subtle">{STAGE_META[o.stage].hint}{o.closedReason ? ` Reason: ${o.closedReason}` : ""}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2"><StageSelect id={o.id} stage={o.stage} /></div>
      </header>

      <StageRoute stage={o.stage} />

      {!canAi && <Notice tone="moderate" className="mb-6">AI isn’t connected, so analysis, research and drafts are unavailable. Everything else works. Connect it in Settings.</Notice>}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <OpportunityTabs tabs={tabs} initial={tab} />
        </div>
        <aside className="flex flex-col gap-6" aria-label="Details and activity">
          <Block title="Details"><DetailsEditor id={o.id} details={{ name: o.name, email: o.email, phone: o.phone, role: o.role, companyName: o.companyName, website: o.website, region: o.region }} /></Block>
          <section aria-labelledby="h-activity"><h2 id="h-activity" className="mb-3 text-[15px] font-semibold">Notes, tasks and history</h2><ActivityPanel id={o.id} items={items} /></section>
          <div className={cn("rounded-lg border border-dashed border-border p-4")}>
            <p className="text-sm font-medium">Deletion requests</p>
            <p className="mt-1 mb-3 text-xs text-muted">If this person asks us to delete their information, or it’s spam, remove everything here.</p>
            <DeleteOpportunity id={o.id} name={o.name} />
          </div>
        </aside>
      </div>
    </Page>
  );
}
