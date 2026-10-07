"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, Pencil, Play, ChevronDown, FileSpreadsheet } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { ChipInput } from "@/components/ui/chip-input";
import { Input } from "@/components/ui/input";
import { ErrorState, Notice } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Menu } from "@/components/ui/menu";
import { LogoMark } from "@/components/ui/logo";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/components/ui/cn";
import { JobProgress } from "@/components/ai/job-progress";
import { AiUnavailable } from "@/components/ai/ai-unavailable";
import { ProspectCard } from "@/components/prospects/prospect-card";
import { runDiscoveryAction } from "@/app/actions/discovery";
import type { SearchInterpretation } from "@/lib/db/schema";
import type { ProspectView } from "@/lib/types";
import { Search } from "lucide-react";

type Run = {
  id: string;
  status: "interpreting" | "interpreted" | "running" | "completed" | "partial" | "failed";
  interpretation: SearchInterpretation | null;
  jobId: string | null;
  error: string | null;
  requested: number;
  discovered: number;
  duplicates: number;
  relevant: number;
  rejected: number;
  mode: string;
};

const STEPS = [
  { key: "search", label: "Searching the web for matching companies" },
  { key: "identify", label: "Identifying real companies" },
  { key: "dedupe", label: "Checking against companies you already know" },
  { key: "research", label: "Researching each company" },
  { key: "qualify", label: "Judging fit and potential need" },
  { key: "people", label: "Finding the right people to speak to" },
  { key: "present", label: "Preparing your results" },
];

const FIELDS: { key: keyof SearchInterpretation; label: string }[] = [
  { key: "industries", label: "Industry" },
  { key: "geographies", label: "Location" },
  { key: "companyTypes", label: "Company types" },
  { key: "companySizes", label: "Company size" },
  { key: "buyerRoles", label: "Potential buyers" },
  { key: "keywords", label: "Search terms" },
  { key: "exclusions", label: "Avoid" },
];

export function RunView({ run, prospects, aiConnected, query }: { run: Run; prospects: ProspectView[]; aiConnected: boolean; query: string }) {
  const router = useRouter();
  const toast = useToast();
  const [jobId, setJobId] = useState<string | null>(run.status === "running" ? run.jobId : null);
  const [pending, start] = useTransition();

  const runIt = (interp: SearchInterpretation) =>
    start(async () => {
      const r = await runDiscoveryAction(run.id, interp);
      if (!r.ok) toast({ kind: "error", title: "Couldn't start discovery", body: r.error });
      else setJobId(r.data);
    });

  if (jobId) {
    return (
      <JobProgress
        jobId={jobId}
        title="Scouting for companies…"
        doneTitle="Done — here's what I found."
        initialSteps={STEPS}
        onDone={() => {
          setJobId(null);
          router.refresh();
        }}
        failureActions={() => (
          <>
            {run.interpretation && <Button size="sm" onClick={() => runIt(run.interpretation!)}>Retry</Button>}
            <Button size="sm" variant="ghost" onClick={() => { setJobId(null); router.refresh(); }}>
              Continue with what was found
            </Button>
          </>
        )}
      />
    );
  }

  if (run.status === "interpreted" && run.interpretation) {
    return <Interpretation initial={run.interpretation} onRun={runIt} pending={pending} aiConnected={aiConnected} />;
  }

  return <Results run={run} prospects={prospects} onRetry={() => run.interpretation && runIt(run.interpretation)} aiConnected={aiConnected} query={query} />;
}

function Interpretation({ initial, onRun, pending, aiConnected }: { initial: SearchInterpretation; onRun: (i: SearchInterpretation) => void; pending: boolean; aiConnected: boolean }) {
  const [editing, setEditing] = useState(false);
  const [i, setI] = useState(initial);
  const filled = FIELDS.filter((f) => (i[f.key] as string[]).length);

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm animate-rise">
      <div className="flex gap-4 p-5 sm:p-6">
        <LogoMark size={32} className="hidden sm:block" />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold">Here&apos;s what I understood:</p>
          {!editing ? (
            <>
              <dl className="mt-4 grid gap-3">
                {filled.map((f) => (
                  <div key={f.key} className="grid gap-1 sm:grid-cols-[150px_1fr]">
                    <dt className="text-sm text-muted">{f.label}</dt>
                    <dd className="text-[15px] font-medium">{(i[f.key] as string[]).join(", ")}</dd>
                  </div>
                ))}
                <div className="grid gap-1 sm:grid-cols-[150px_1fr]">
                  <dt className="text-sm text-muted">How many</dt>
                  <dd className="text-[15px] font-medium">About {i.requested} companies</dd>
                </div>
              </dl>
              <p className="mt-5 text-muted">{i.summary}</p>
            </>
          ) : (
            <div className="mt-4 grid gap-4">
              {FIELDS.map((f) => (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <label htmlFor={`i-${f.key}`} className="text-sm font-medium">{f.label}</label>
                  <ChipInput id={`i-${f.key}`} value={i[f.key] as string[]} onChange={(v) => setI((s) => ({ ...s, [f.key]: v }))} />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="i-requested" className="text-sm font-medium">How many companies</label>
                <Input id="i-requested" type="number" min={3} max={25} value={i.requested} onChange={(e) => setI((s) => ({ ...s, requested: Math.max(3, Math.min(25, Number(e.target.value) || 10)) }))} className="w-28" />
                <p className="text-xs text-subtle">More companies take longer and use more research. Between 3 and 25.</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {!aiConnected && <AiUnavailable feature="Running discovery" className="mx-5 mb-4 sm:mx-6" />}
      <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3.5 sm:px-6">
        <Button variant="primary" loading={pending} disabled={!aiConnected} icon={<Play className="size-4" />} onClick={() => onRun(i)}>
          Run discovery
        </Button>
        <Button variant="ghost" icon={<Pencil className="size-4" />} onClick={() => setEditing((e) => !e)}>
          {editing ? "Done editing" : "Edit"}
        </Button>
        <p className="ml-auto hidden text-sm text-subtle sm:block">Nothing is researched until you run it.</p>
      </div>
    </div>
  );
}

function Results({ run, prospects, onRetry, aiConnected, query }: { run: Run; prospects: ProspectView[]; onRetry: () => void; aiConnected: boolean; query: string }) {
  const [showRejected, setShowRejected] = useState(false);
  const relevant = prospects.filter((p) => p.status !== "rejected");
  const rejected = prospects.filter((p) => p.status === "rejected");
  const reviewed = prospects.filter((p) => p.inCrm || p.status === "rejected").length;

  return (
    <div className="flex flex-col gap-6">
      {run.status === "failed" && (
        <ErrorState
          title="We couldn't complete this research."
          body={run.error ?? "An external service failed. Nothing was made up — only companies we could actually research are shown."}
          actions={
            <>
              {aiConnected && <Button size="sm" onClick={onRetry}>Retry</Button>}
              <ButtonLink size="sm" variant="ghost" href="/settings#ai">View available sources</ButtonLink>
            </>
          }
        />
      )}
      {run.status === "partial" && (
        <Notice tone="moderate" title="Some companies couldn't be researched">
          We&apos;re showing everything that finished. {run.error ? <span className="block whitespace-pre-line text-xs">{run.error}</span> : null}
        </Notice>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl">
            {relevant.length
              ? `Found ${relevant.length} ${relevant.length === 1 ? "company" : "companies"} worth a look.`
              : run.status === "failed"
                ? "This search didn't finish."
                : "No strong matches this time."}
          </h2>
          <p className="mt-1 text-muted">
            {[
              `${run.discovered} found`,
              run.duplicates ? `${run.duplicates} you already knew` : null,
              rejected.length ? `${rejected.length} set aside as weak` : null,
              reviewed ? `${reviewed} reviewed` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
            {relevant.length > 0 && " — keep the ones worth pursuing and I'll learn from your choices."}
          </p>
        </div>
        {prospects.length > 0 && (
          <Menu
            align="end"
            items={[
              { label: "CSV", icon: <Download />, onSelect: () => (window.location.href = `/api/export?format=csv&scope=run&run=${run.id}`) },
              { label: "Excel (XLSX)", icon: <FileSpreadsheet />, onSelect: () => (window.location.href = `/api/export?format=xlsx&scope=run&run=${run.id}`) },
              { label: "Client-ready report", icon: <FileText />, onSelect: () => window.open(`/reports/prospects?scope=run&run=${run.id}`, "_blank") },
            ]}
            trigger={({ ref, ...p }) => (
              <Button ref={ref} {...p} size="sm" variant="ghost" icon={<Download className="size-4" />}>
                Export <ChevronDown className="size-3.5" />
              </Button>
            )}
          />
        )}
      </div>

      {relevant.length === 0 && run.status !== "failed" && (
        <div className="rounded-xl border border-border bg-surface shadow-sm">
          <EmptyState
            icon={<Search />}
            title={run.discovered ? "Nothing new worth your time here" : "I couldn't find enough strong matches yet"}
            body={run.duplicates ? `${run.duplicates} of the companies I found are ones you already know or have excluded. Want me to look a little wider?` : "Want me to broaden the search? A wider area or a looser industry description usually helps."}
            action={<ButtonLink href={`/discover?q=${encodeURIComponent(`Broaden: ${query}`)}`} variant="primary">Broaden the search</ButtonLink>}
            secondary={<ButtonLink href="/discover" variant="ghost">Start a new search</ButtonLink>}
          />
        </div>
      )}

      <div className="flex flex-col gap-4">
        {relevant.map((p, i) => (
          <ProspectCard key={p.id} p={p} index={i} />
        ))}
      </div>

      {rejected.length > 0 && (
        <div>
          <button className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text" onClick={() => setShowRejected((s) => !s)} aria-expanded={showRejected}>
            <ChevronDown className={cn("size-4 transition-transform", showRejected && "rotate-180")} aria-hidden />
            {rejected.length} set aside as weak matches
          </button>
          {showRejected && (
            <div className="mt-3 flex flex-col gap-3">
              {rejected.map((p) => (
                <ProspectCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
