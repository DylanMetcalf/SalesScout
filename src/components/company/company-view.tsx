"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Ban, Pencil, Plus, RefreshCw, Trash2, CheckCircle2, Plug, Globe, History, Pause, Play, Archive } from "lucide-react";
import { Button, ButtonLink, IconButton } from "@/components/ui/button";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { ChipInput } from "@/components/ui/chip-input";
import { KnowledgeLegend } from "@/components/ui/knowledge";
import { Notice } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/components/ui/cn";
import { JobProgress } from "@/components/ai/job-progress";
import { SuggestionCard } from "@/components/prospects/suggestion-card";
import { useAction } from "@/components/prospects/shared";
import { BRAIN } from "@/lib/brain-fields";
import { BRAIN_SECTIONS } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";
import { analyseCompanyAction, approveBrainAction } from "@/app/actions/brain";
import { updateCompanyAction } from "@/app/actions/workspace";
import { deleteStrategyAction, saveStrategyAction, type StrategyInputT } from "@/app/actions/discovery";
import { addExclusionAction, addWritingPreferenceAction, removeExclusionAction, removeWritingPreferenceAction } from "@/app/actions/prospects";
import { BrainEditor, type FactLite } from "./brain-editor";
import { MarketDiscovery, type Opportunity } from "./market-discovery";
import { DocumentUploader, PagesInput, SocialInput, SourceStatus, WebsiteInput, type SourceLite } from "./source-inputs";

type Company = { id: string; name: string; description: string | null; website: string | null; summary: string | null; brainStatus: string; brainAnalysedAt: number | null; isDemo: boolean };
type Source = SourceLite & { pagesRead: { url: string; title: string }[]; lastAnalysedAt: number | null };
type Strategy = StrategyInputT & { id: string; origin: string; status: "active" | "paused" | "archived"; runs: number; prospects: number };
type Provider = { key: string; name: string; category: string; description: string; available: string | null; requires: string; connectable: boolean };

const ANALYSIS_STEPS = [
  { key: "website", label: "Reading your website" },
  { key: "pages", label: "Looking at your services and pages" },
  { key: "documents", label: "Reading your documents" },
  { key: "profiles", label: "Checking your public profiles" },
  { key: "understand", label: "Understanding your business" },
  { key: "save", label: "Preparing your Company Brain" },
];

export function CompanyView(props: {
  initialTab?: string;
  editStrategyId: string | null;
  company: Company;
  facts: FactLite[];
  sources: Source[];
  strategies: Strategy[];
  opportunities: Opportunity[];
  exclusions: { id: string; kind: string; value: string; reason: string | null }[];
  suggestions: { id: string; title: string; body: string }[];
  preferences: { id: string; rule: string; scope: string }[];
  history: { id: string; summary: string; source: string; createdAt: number }[];
  providers: Provider[];
  aiConnected: boolean;
}) {
  const tabs = ["brain", "sources", "strategies", "markets", "learning", "connections", "history"];
  const [tab, setTab] = useState(props.initialTab && tabs.includes(props.initialTab) ? props.initialTab : "brain");
  const [editing, setEditing] = useState(false);
  const c = props.company;

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar name={c.name} size={52} square />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-[-0.015em]">{c.name}</h1>
            {c.isDemo && <Badge tone="violet">Demo</Badge>}
          </div>
          <p className="mt-1 max-w-3xl text-muted">{c.summary ?? c.description ?? "Tell Sales Scout about this business to get started."}</p>
        </div>
        <Button icon={<Pencil className="size-4" />} onClick={() => setEditing(true)}>Edit details</Button>
      </header>

      <Tabs
        label="Company sections"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "brain", label: "Company Brain" },
          { id: "sources", label: "Sources", count: props.sources.length },
          { id: "strategies", label: "Lead strategies", count: props.strategies.filter((s) => s.status !== "archived").length },
          { id: "markets", label: "Markets" },
          { id: "learning", label: "Preferences", count: props.suggestions.length || undefined },
          { id: "connections", label: "Connections" },
          { id: "history", label: "History" },
        ]}
      />
      <div className="pt-6">
        <TabPanel id="brain" active={tab === "brain"}><BrainTab {...props} /></TabPanel>
        <TabPanel id="sources" active={tab === "sources"}><SourcesTab sources={props.sources} website={c.website} /></TabPanel>
        <TabPanel id="strategies" active={tab === "strategies"}><StrategiesTab strategies={props.strategies} editId={props.editStrategyId} /></TabPanel>
        <TabPanel id="markets" active={tab === "markets"}><MarketDiscovery opportunities={props.opportunities} aiConnected={props.aiConnected} /></TabPanel>
        <TabPanel id="learning" active={tab === "learning"}><LearningTab {...props} /></TabPanel>
        <TabPanel id="connections" active={tab === "connections"}><ConnectionsTab providers={props.providers} sources={props.sources} /></TabPanel>
        <TabPanel id="history" active={tab === "history"}>
          {props.history.length === 0 ? (
            <EmptyState compact icon={<History />} title="No history yet" body="Every AI action and every change you make is recorded here, so you can always see why something is the way it is." />
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
              {props.history.map((h) => (
                <li key={h.id} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                  <span className="w-40 shrink-0 text-sm text-subtle">{formatDate(h.createdAt, true)}</span>
                  <span className="flex-1">{h.summary}</span>
                  <Badge tone={h.source === "user" ? "neutral" : h.source === "ai" ? "accent" : "info"}>{{ user: "You", ai: "AI analysis", web_research: "Web research", system: "System", extraction: "Extraction" }[h.source] ?? h.source}</Badge>
                </li>
              ))}
            </ul>
          )}
        </TabPanel>
      </div>
      <EditCompany open={editing} onClose={() => setEditing(false)} company={c} />
    </>
  );
}

function BrainTab({ company, facts, sources, aiConnected }: { company: Company; facts: FactLite[]; sources: Source[]; aiConnected: boolean }) {
  const router = useRouter();
  const [jobId, setJobId] = useState<string | null>(null);
  const { pending, run } = useAction();
  const analyse = () => run(() => analyseCompanyAction(), { refresh: false, then: (id) => setJobId(id) });
  const labels = Object.fromEntries(sources.map((s) => [s.id, s.label]));
  const known = facts.filter((f) => f.knowledge !== "unknown");

  return (
    <div className="grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
      <nav aria-label="Brain sections" className="hidden lg:block">
        <ul className="sticky top-6 flex flex-col gap-0.5 text-sm">
          {BRAIN_SECTIONS.map((s) => (
            <li key={s}>
              <a href={`#brain-${s}`} className="flex justify-between rounded-md px-2.5 py-1.5 text-muted hover:bg-surface-2 hover:text-text">
                {BRAIN[s].title}
                <span className="tabular-nums text-subtle">{facts.filter((f) => f.section === s && f.knowledge !== "unknown").length}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {company.brainAnalysedAt ? `Last analysed ${formatDate(company.brainAnalysedAt)}` : "Not analysed yet"} · {known.length} statements
          </p>
          <div className="flex gap-2">
            {company.brainStatus === "review" && (
              <Button variant="primary" loading={pending} icon={<CheckCircle2 className="size-4" />} onClick={() => run(() => approveBrainAction(), { success: "Company Brain approved" })}>
                Looks right
              </Button>
            )}
            <Button icon={<RefreshCw className="size-4" />} loading={pending && !jobId} onClick={analyse} disabled={!!jobId || company.isDemo} title={company.isDemo ? "The demo company's sources are fictional" : undefined}>
              Re-analyse sources
            </Button>
          </div>
        </div>
        {company.brainStatus === "review" && <Notice tone="accent" title="Please review">Sales Scout has updated its understanding. Confirm what's right and fix what isn't — edits you make are always kept.</Notice>}
        {!aiConnected && <Notice tone="moderate" title="Basic analysis only">Without AI, re-analysing captures only what your sources state directly.</Notice>}
        {jobId && (
          <JobProgress
            jobId={jobId}
            title="Re-reading your sources…"
            doneTitle="Updated. Have a look at what changed."
            initialSteps={ANALYSIS_STEPS}
            onDone={(j) => {
              if (j.status !== "failed") {
                setJobId(null);
                router.refresh();
              }
            }}
            failureActions={() => (
              <>
                <Button size="sm" onClick={() => { setJobId(null); analyse(); }}>Retry</Button>
                <Button size="sm" variant="ghost" onClick={() => setJobId(null)}>Keep current understanding</Button>
              </>
            )}
          />
        )}
        <details className="rounded-lg border border-border bg-surface px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium">Confirmed, inferred, suggested, unknown — what do they mean?</summary>
          <KnowledgeLegend className="mt-3" />
        </details>
        <BrainEditor facts={facts} sourceLabels={labels} />
      </div>
    </div>
  );
}

function SourcesTab({ sources, website }: { sources: Source[]; website: string | null }) {
  const site = sources.find((s) => s.kind === "website");
  const research = sources.find((s) => s.kind === "web_research");
  const Section = ({ title, body, children }: { title: string; body: string; children: React.ReactNode }) => (
    <section className="grid gap-4 border-b border-border pb-8 lg:grid-cols-[260px_1fr]">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted">{body}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-3xl text-muted">Everything Sales Scout knows about this company comes from these sources. Each one shows whether we could actually read it — we never claim to have used a source we didn&apos;t.</p>
      <Section title="Website" body="We read your home page and the most informative pages we can find.">
        <WebsiteInput current={website} />
        {site && (
          <div className="mt-3 rounded-lg border border-border bg-surface px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="size-4 text-subtle" aria-hidden />
              <span className="font-medium">{site.label}</span>
              <SourceStatus status={site.status} />
              {site.statusDetail && <span className="text-subtle">· {site.statusDetail}</span>}
            </div>
            {site.pagesRead.length > 0 && (
              <>
                <p className="mt-3 text-xs font-medium uppercase tracking-[0.08em] text-subtle">Pages that contributed</p>
                <ul className="mt-1.5 flex flex-col gap-1 text-sm">
                  {site.pagesRead.map((p) => (
                    <li key={p.url} className="truncate"><span className="font-medium">{p.title}</span> <span className="text-subtle">{p.url}</span></li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </Section>
      <Section title="Company pages" body="Point us at pages that explain what you do: services, products, case studies, pricing.">
        <PagesInput pages={sources.filter((s) => s.kind === "page")} />
      </Section>
      <Section title="Social & professional profiles" body="Company pages and the personal profiles you sell from. Each is its own source.">
        <SocialInput profiles={sources.filter((s) => s.kind === "social")} />
      </Section>
      <Section title="Documents" body="Brochures, case studies, proposals and catalogues. Private to this company.">
        <DocumentUploader documents={sources.filter((s) => s.kind === "document")} />
      </Section>
      {research && (
        <Section title="Web research" body="Used when discovering and researching prospects.">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
            <SourceStatus status={research.status} />
            <span className="text-muted">{research.statusDetail}</span>
          </div>
        </Section>
      )}
    </div>
  );
}

const EMPTY_STRATEGY: StrategyInputT = { name: "", description: "", industries: [], companyTypes: [], geographies: [], companySizes: [], buyerRoles: [], keywords: [], exclusions: [], notes: "" };

function StrategiesTab({ strategies, editId }: { strategies: Strategy[]; editId: string | null }) {
  const [editing, setEditing] = useState<Strategy | "new" | null>(() => strategies.find((s) => s.id === editId) ?? null);
  const [showArchived, setShowArchived] = useState(false);
  const { run } = useAction();
  const visible = strategies.filter((s) => (showArchived ? true : s.status !== "archived"));
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-muted">A lead strategy is one direction you&apos;re prospecting in — who, where, and which buyers. Discover uses them to search.</p>
        <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>New strategy</Button>
      </div>
      {visible.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState
            compact
            title="No lead strategies yet"
            body="Accept a market suggestion, or write your own direction — for example “Mining operations in Gauteng”."
            action={<ButtonLink href="/company?tab=markets" variant="primary">Discover my market</ButtonLink>}
            secondary={<Button variant="ghost" onClick={() => setEditing("new")}>Write one</Button>}
          />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((s) => (
            <article key={s.id} className={cn("flex flex-col rounded-lg border border-border bg-surface p-5 shadow-sm", s.status !== "active" && "opacity-70")}>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[16.5px] font-semibold">{s.name}</h3>
                  {s.description && <p className="mt-0.5 text-sm text-muted">{s.description}</p>}
                </div>
                {s.status !== "active" && <Badge>{s.status === "paused" ? "Paused" : "Archived"}</Badge>}
                {s.origin === "market_discovery" && s.status === "active" && <Badge tone="accent">Suggested by Sales Scout</Badge>}
              </div>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                {(
                  [
                    ["Industries", s.industries],
                    ["Geography", s.geographies],
                    ["Company types", s.companyTypes],
                    ["Buyer roles", s.buyerRoles],
                    ["Excluding", s.exclusions],
                  ] as const
                )
                  .filter(([, v]) => v.length)
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-subtle">{k}</dt>
                      <dd>{v.join(", ")}</dd>
                    </div>
                  ))}
              </dl>
              <p className="mt-4 text-sm text-muted">{s.runs} search{s.runs === 1 ? "" : "es"} · {s.prospects} prospect{s.prospects === 1 ? "" : "s"}</p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                {s.status === "active" && <ButtonLink size="sm" variant="primary" href={`/discover?strategy=${s.id}`} icon={<ArrowRight className="size-4" />}>Find companies</ButtonLink>}
                <Button size="sm" icon={<Pencil className="size-3.5" />} onClick={() => setEditing(s)}>Edit</Button>
                {s.status === "active" ? (
                  <Button size="sm" variant="ghost" icon={<Pause className="size-3.5" />} onClick={() => run(() => saveStrategyAction(s.id, { ...s, status: "paused" }), { success: "Paused" })}>Pause</Button>
                ) : (
                  <Button size="sm" variant="ghost" icon={<Play className="size-3.5" />} onClick={() => run(() => saveStrategyAction(s.id, { ...s, status: "active" }), { success: "Reactivated" })}>Reactivate</Button>
                )}
                {s.status !== "archived" && (
                  <Button size="sm" variant="ghost" icon={<Archive className="size-3.5" />} className="ml-auto" onClick={() => run(() => deleteStrategyAction(s.id), { success: "Archived" })}>Archive</Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {strategies.some((s) => s.status === "archived") && (
        <button className="self-start text-sm font-medium text-muted hover:text-text" onClick={() => setShowArchived((v) => !v)}>
          {showArchived ? "Hide archived" : "Show archived"}
        </button>
      )}
      {editing && <StrategyEditor strategy={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function StrategyEditor({ strategy, onClose }: { strategy: Strategy | null; onClose: () => void }) {
  const [s, setS] = useState<StrategyInputT>(strategy ? { ...strategy, description: strategy.description ?? "", notes: strategy.notes ?? "" } : EMPTY_STRATEGY);
  const { pending, run } = useAction();
  const list = (k: keyof StrategyInputT, label: string, placeholder: string) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`s-${k}`} className="text-sm font-medium">{label}</label>
      <ChipInput id={`s-${k}`} value={s[k] as string[]} onChange={(v) => setS((x) => ({ ...x, [k]: v }))} placeholder={placeholder} />
    </div>
  );
  return (
    <Dialog
      open
      onClose={onClose}
      variant="sheet"
      title={strategy ? `Edit “${strategy.name}”` : "New lead strategy"}
      description="Everything here is optional except the name. Changes are recorded so Sales Scout can learn from them."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={pending} disabled={!s.name.trim()} onClick={() => run(() => saveStrategyAction(strategy?.id ?? null, s), { success: "Strategy saved", then: onClose })}>
            Save strategy
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Name">{(p) => <Input {...p} value={s.name} onChange={(e) => setS((x) => ({ ...x, name: e.target.value }))} placeholder="e.g. Mining operations" autoFocus />}</Field>
        <Field label="Description" optional>{(p) => <Input {...p} value={s.description ?? ""} onChange={(e) => setS((x) => ({ ...x, description: e.target.value }))} />}</Field>
        {list("industries", "Target industries", "e.g. Mining")}
        {list("companyTypes", "Company types", "e.g. Mining contractors")}
        {list("geographies", "Geography", "e.g. Gauteng")}
        {list("companySizes", "Company size", "e.g. Mid-size")}
        {list("buyerRoles", "Buyer roles", "e.g. Maintenance Manager")}
        {list("keywords", "Keywords", "Words their websites might use")}
        {list("exclusions", "Exclusions", "Industries, companies or roles to avoid")}
        <Field label="Notes" optional>{(p) => <Textarea {...p} value={s.notes ?? ""} onChange={(e) => setS((x) => ({ ...x, notes: e.target.value }))} />}</Field>
      </div>
    </Dialog>
  );
}

function LearningTab({ suggestions, preferences, exclusions }: { suggestions: { id: string; title: string; body: string }[]; preferences: { id: string; rule: string; scope: string }[]; exclusions: { id: string; kind: string; value: string; reason: string | null }[] }) {
  const [rule, setRule] = useState("");
  const [scope, setScope] = useState<"user" | "company">("user");
  const [exKind, setExKind] = useState<"company" | "domain" | "industry" | "role" | "geography" | "competitor" | "customer">("competitor");
  const [exValue, setExValue] = useState("");
  const { pending, run } = useAction();
  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="font-semibold">Sales Scout noticed</h2>
        <p className="mt-1 text-sm text-muted">Patterns in your decisions. Nothing changes until you apply it.</p>
        <div className="mt-4 flex flex-col gap-2">
          {suggestions.length ? suggestions.map((s) => <SuggestionCard key={s.id} s={s} />) : <p className="text-sm text-subtle">Nothing yet. As you keep, reject and edit, suggestions will appear here.</p>}
        </div>
      </section>

      <section>
        <h2 className="font-semibold">Writing preferences</h2>
        <p className="mt-1 text-sm text-muted">Applied to every outreach draft. “Just me” preferences only affect your drafts; company preferences affect everyone&apos;s.</p>
        <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface">
          {preferences.length === 0 && <li className="px-4 py-3 text-sm text-subtle">No preferences yet.</li>}
          {preferences.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="flex-1">{p.rule}</span>
              <Badge>{p.scope === "user" ? "Just me" : "Whole company"}</Badge>
              <IconButton label="Remove preference" size="sm" onClick={() => run(() => removeWritingPreferenceAction(p.id), { success: "Removed" })}>
                <Trash2 className="size-3.5" />
              </IconButton>
            </li>
          ))}
        </ul>
        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => addWritingPreferenceAction(rule, scope), { success: "Preference added", then: () => setRule("") });
          }}
        >
          <Input aria-label="New preference" value={rule} onChange={(e) => setRule(e.target.value)} placeholder="e.g. Never open with “I hope this finds you well”" className="flex-1" />
          <Select aria-label="Applies to" value={scope} onChange={(e) => setScope(e.target.value as "user" | "company")} className="sm:w-40">
            <option value="user">Just me</option>
            <option value="company">Whole company</option>
          </Select>
          <Button type="submit" loading={pending} disabled={rule.trim().length < 3}>Add</Button>
        </form>
      </section>

      <section>
        <h2 className="font-semibold">Exclusions & duplicate protection</h2>
        <p className="mt-1 text-sm text-muted">Companies, competitors, customers and industries Sales Scout will never suggest.</p>
        <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface">
          {exclusions.length === 0 && <li className="px-4 py-3 text-sm text-subtle">No exclusions yet.</li>}
          {exclusions.map((x) => (
            <li key={x.id} className="flex items-center gap-3 px-4 py-2.5">
              <Ban className="size-4 text-subtle" aria-hidden />
              <span className="flex-1">{x.value}{x.reason && <span className="text-sm text-muted"> — {x.reason}</span>}</span>
              <Badge>{x.kind}</Badge>
              <IconButton label={`Remove exclusion ${x.value}`} size="sm" onClick={() => run(() => removeExclusionAction(x.id), { success: "Removed" })}>
                <Trash2 className="size-3.5" />
              </IconButton>
            </li>
          ))}
        </ul>
        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => addExclusionAction({ kind: exKind, value: exValue }), { success: "Excluded", then: () => setExValue("") });
          }}
        >
          <Select aria-label="Type" value={exKind} onChange={(e) => setExKind(e.target.value as typeof exKind)} className="sm:w-44">
            {["competitor", "customer", "company", "domain", "industry", "role", "geography"].map((k) => <option key={k} value={k}>{k[0].toUpperCase() + k.slice(1)}</option>)}
          </Select>
          <Input aria-label="Value" value={exValue} onChange={(e) => setExValue(e.target.value)} placeholder="Name or website" className="flex-1" />
          <Button type="submit" loading={pending} disabled={!exValue.trim()}>Exclude</Button>
        </form>
      </section>
    </div>
  );
}

function ConnectionsTab({ providers, sources }: { providers: Provider[]; sources: Source[] }) {
  const socials = sources.filter((s) => s.kind === "social");
  const groups: [string, string][] = [["email", "Email"], ["social", "Social & professional"], ["research", "Research"], ["crm", "CRM"]];
  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-3xl text-muted">
        Each connection is separate — a company page, a colleague&apos;s profile, a mailbox. Sales Scout only uses authorised APIs and supported connection methods, and shows plainly what isn&apos;t connected.
      </p>
      {groups.map(([cat, title]) => (
        <section key={cat}>
          <h2 className="mb-3 text-sm font-semibold">{title}</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {providers.filter((p) => p.category === cat).map((p) => (
              <li key={p.key} className="flex flex-col rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center gap-2">
                  <Plug className="size-4 text-subtle" aria-hidden />
                  <span className="font-medium">{p.name}</span>
                  <span className="ml-auto">
                    {p.connectable ? <Badge tone="strong" dot>{p.key === "web_research" ? "Connected" : "Ready to connect"}</Badge> : p.available ? <Badge tone="info" dot>Available</Badge> : <Badge tone="moderate" dot>Requires setup</Badge>}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-muted">{p.description}</p>
                {p.available && <p className="mt-2 text-sm"><span className="font-medium text-strong">Works now: </span>{p.available}</p>}
                {!(p.key === "web_research" && p.connectable) && <p className="mt-1.5 text-sm text-subtle">{p.requires}</p>}
                {cat === "social" && p.key === "linkedin" && socials.filter((s) => s.subtype === "linkedin").length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-sm">
                    {socials.filter((s) => s.subtype === "linkedin").map((s) => (
                      <li key={s.id} className="flex justify-between gap-2"><span className="truncate">{s.label}</span><SourceStatus status={s.status} /></li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-sm text-muted">
        Profiles are added under <Link href="/company?tab=sources" className="font-medium text-accent-text hover:underline">Sources</Link>.
      </p>
    </div>
  );
}

function EditCompany({ open, onClose, company }: { open: boolean; onClose: () => void; company: Company }) {
  const [f, setF] = useState({ name: company.name, description: company.description ?? "", website: company.website ?? "" });
  const { pending, run } = useAction();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Company details"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={pending} onClick={() => run(() => updateCompanyAction(f), { success: "Saved", then: onClose })}>Save</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Name">{(p) => <Input {...p} value={f.name} onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))} />}</Field>
        <Field label="Website">{(p) => <Input {...p} value={f.website} onChange={(e) => setF((x) => ({ ...x, website: e.target.value }))} />}</Field>
        <Field label="What the business does" hint="Your own words. Re-analyse sources afterwards to update the Company Brain.">
          {(p) => <Textarea {...p} value={f.description} onChange={(e) => setF((x) => ({ ...x, description: e.target.value }))} className="min-h-28" />}
        </Field>
      </div>
    </Dialog>
  );
}
