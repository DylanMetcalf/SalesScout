"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Bookmark, BookmarkCheck, ChevronDown, Pencil, RotateCcw, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KnowledgeBadge } from "@/components/ui/knowledge";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/components/ui/cn";
import { JobProgress } from "@/components/ai/job-progress";
import { AiUnavailable } from "@/components/ai/ai-unavailable";
import { acceptMarketAction, discoverMarketsAction, setMarketStatusAction } from "@/app/actions/discovery";
import type { Knowledge } from "@/lib/db/schema";

export type Opportunity = {
  id: string;
  title: string;
  summary: string;
  reasoning: string;
  knowledge: Knowledge;
  industries: string[];
  companyTypes: string[];
  buyerRoles: string[];
  jobTitles: string[];
  geographies: string[];
  useCases: string[];
  keywords: string[];
  status: "suggested" | "saved" | "accepted" | "dismissed";
  strategyId: string | null;
};

const STEPS = [
  { key: "brain", label: "Reviewing your Company Brain" },
  { key: "markets", label: "Exploring potential markets" },
  { key: "buyers", label: "Working out who buys" },
  { key: "prepare", label: "Preparing recommendations" },
];

/** "Discover My Market": suggestions with reasoning. The user decides; nothing is applied silently. */
export function MarketDiscovery({ opportunities, aiConnected, onboarding }: { opportunities: Opportunity[]; aiConnected: boolean; onboarding?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [jobId, setJobId] = useState<string | null>(null);
  const [intro, setIntro] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [showDismissed, setShowDismissed] = useState(false);

  const visible = opportunities.filter((o) => o.status !== "dismissed");
  const dismissed = opportunities.filter((o) => o.status === "dismissed");

  const discover = () =>
    start(async () => {
      const r = await discoverMarketsAction();
      if (!r.ok) toast({ kind: "error", title: "Couldn't start", body: r.error });
      else setJobId(r.data);
    });

  if (!aiConnected && opportunities.length === 0) return <AiUnavailable feature="Market discovery" />;

  return (
    <div className="flex flex-col gap-5">
      {jobId ? (
        <JobProgress
          jobId={jobId}
          title="Thinking about who could need what you sell…"
          initialSteps={STEPS}
          onDone={(job) => {
            if (job.status !== "failed") {
              setIntro((job.result?.intro as string) ?? null);
              setJobId(null);
              router.refresh();
            }
          }}
          failureActions={() => (
            <>
              <Button size="sm" onClick={discover}>Retry</Button>
              <Button size="sm" variant="ghost" onClick={() => setJobId(null)}>Continue without it</Button>
            </>
          )}
        />
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface shadow-sm">
          <EmptyState
            icon={<Sparkles />}
            title="Where could you sell?"
            body="Sales Scout reads your Company Brain and suggests industries, company types, buyers and places worth exploring — with the reasoning behind each."
            action={
              <Button variant="primary" size="lg" loading={pending} onClick={discover} disabled={!aiConnected}>
                Discover my market
              </Button>
            }
          />
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <p className="max-w-2xl text-muted">{intro ?? "Based on what you've told me, these are markets worth exploring. Nothing changes until you choose."}</p>
          {aiConnected && (
            <Button size="sm" variant="ghost" icon={<RotateCcw className="size-4" />} loading={pending} onClick={discover}>
              Suggest again
            </Button>
          )}
        </div>
      )}

      {!jobId && visible.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((o) => (
            <OpportunityCard key={o.id} o={o} onboarding={onboarding} />
          ))}
        </div>
      )}
      {dismissed.length > 0 && !jobId && (
        <div>
          <button className="text-sm font-medium text-muted hover:text-text" onClick={() => setShowDismissed((s) => !s)} aria-expanded={showDismissed}>
            {showDismissed ? "Hide" : "Show"} {dismissed.length} dismissed
          </button>
          {showDismissed && (
            <ul className="mt-2 flex flex-col gap-1">
              {dismissed.map((o) => (
                <DismissedRow key={o.id} o={o} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function DismissedRow({ o }: { o: Opportunity }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="text-muted line-through">{o.title}</span>
      <button
        className="font-medium text-accent-text hover:underline disabled:opacity-50"
        disabled={pending}
        onClick={() => start(async () => { await setMarketStatusAction(o.id, "suggested"); router.refresh(); })}
      >
        Restore
      </button>
    </li>
  );
}

function Chips({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="text-xs font-medium uppercase tracking-[0.08em] text-subtle">{label}</dt>
      <dd className="flex flex-wrap gap-1.5">
        {items.map((i) => (
          <span key={i} className="rounded-md bg-surface-2 px-2 py-0.5 text-sm">{i}</span>
        ))}
      </dd>
    </div>
  );
}

function OpportunityCard({ o, onboarding }: { o: Opportunity; onboarding?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [more, setMore] = useState(false);
  const [pending, start] = useTransition();

  const accept = (then: "explore" | "edit" | "stay") =>
    start(async () => {
      const r = await acceptMarketAction(o.id);
      if (!r.ok) return toast({ kind: "error", title: r.error });
      if (then === "explore") router.push(`/discover?strategy=${r.data}`);
      else if (then === "edit") router.push(`/company?tab=strategies&edit=${r.data}`);
      else {
        toast({ title: "Saved as a lead strategy", body: "You can find companies for it any time." });
        router.refresh();
      }
    });
  const setStatus = (status: "saved" | "dismissed" | "suggested") =>
    start(async () => {
      await setMarketStatusAction(o.id, status);
      router.refresh();
    });

  const accepted = o.status === "accepted";
  return (
    <article className={cn("flex flex-col rounded-lg border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md", accepted ? "border-accent/35" : "border-border", pending && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[16.5px] font-semibold leading-6">{o.title}</h3>
        {accepted ? <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-text">Strategy</span> : <KnowledgeBadge value={o.knowledge} />}
      </div>
      <p className="mt-1.5 text-muted">{o.summary}</p>

      <div className="mt-4 rounded-md border-l-2 border-accent/50 bg-accent-soft/35 px-3.5 py-2.5">
        <p className="text-xs font-medium text-accent-text">Why am I suggesting this?</p>
        <p className="mt-0.5 text-sm text-text/85">{o.reasoning}</p>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <Chips label="Industries" items={o.industries} />
        <Chips label="Potential buyers" items={o.buyerRoles} />
        {more && (
          <>
            <Chips label="Company types" items={o.companyTypes} />
            <Chips label="Geographies" items={o.geographies} />
            <Chips label="Job titles" items={o.jobTitles} />
            <Chips label="Use cases" items={o.useCases} />
            <Chips label="Search terms" items={o.keywords} />
          </>
        )}
      </dl>

      <button className="mt-3 flex items-center gap-1 self-start text-sm font-medium text-muted hover:text-text" onClick={() => setMore((m) => !m)} aria-expanded={more}>
        {more ? "Less" : "Tell me more"} <ChevronDown className={cn("size-4 transition-transform", more && "rotate-180")} aria-hidden />
      </button>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
        {accepted ? (
          <Button variant="primary" size="sm" icon={<ArrowRight className="size-4" />} onClick={() => router.push(`/discover?strategy=${o.strategyId}`)}>
            Find companies
          </Button>
        ) : (
          <>
            <Button variant="primary" size="sm" icon={<ArrowRight className="size-4" />} onClick={() => accept("explore")} disabled={pending}>
              Explore
            </Button>
            {!onboarding && (
              <Button size="sm" variant="secondary" icon={<Pencil className="size-3.5" />} onClick={() => accept("edit")} disabled={pending}>
                Accept & edit
              </Button>
            )}
            {onboarding && (
              <Button size="sm" variant="secondary" onClick={() => accept("stay")} disabled={pending}>
                Accept
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              icon={o.status === "saved" ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
              onClick={() => setStatus(o.status === "saved" ? "suggested" : "saved")}
              disabled={pending}
            >
              {o.status === "saved" ? "Saved" : "Save"}
            </Button>
            <Button size="sm" variant="ghost" icon={<X className="size-4" />} onClick={() => setStatus("dismissed")} disabled={pending} className="ml-auto">
              Dismiss
            </Button>
          </>
        )}
      </div>
    </article>
  );
}
