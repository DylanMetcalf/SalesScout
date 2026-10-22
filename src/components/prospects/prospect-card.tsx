"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, CircleHelp, Clock, Layers, Link2, Mail, MoreHorizontal, RotateCcw, ThumbsDown, UserRound, UserCheck } from "lucide-react";
import { Button, IconButton } from "@/components/ui/button";
import { FitBadge } from "@/components/ui/fit";
import { Menu } from "@/components/ui/menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/components/ui/cn";
import { STATUS_META } from "@/lib/status";
import type { ProspectView } from "@/lib/types";
import { addToCrmAction, feedbackAction, restoreAction, skipAction } from "@/app/actions/prospects";
import { CompanyLogo } from "@/components/ui/company-logo";
import { findSimilarAction } from "@/app/actions/discovery";
import { WhyPanel } from "./why-panel";

const REASONS = ["Wrong industry", "Too small", "Too large", "Wrong location", "Not a buyer of what we sell"];

/**
 * A discovered company, shown progressively: who, why, the opportunity and
 * the people — with triage actions that teach Sales Scout.
 */
export function ProspectCard({ p, index = 0 }: { p: ProspectView; index?: number }) {
  const router = useRouter();
  const toast = useToast();
  const [why, setWhy] = useState(false);
  const [pending, start] = useTransition();
  const [gone, setGone] = useState<string | null>(null);

  const act = (fn: () => Promise<{ ok: true; data: unknown } | { ok: false; error: string }>, message: string, undo?: () => Promise<unknown>) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) return toast({ kind: "error", title: r.error });
      setGone(message);
      toast({ title: message, action: undo ? { label: "Undo", onClick: async () => { await undo(); setGone(null); router.refresh(); } } : undefined });
      router.refresh();
    });

  const similar = () =>
    start(async () => {
      const r = await findSimilarAction(p.id);
      if (!r.ok) toast({ kind: "error", title: r.error });
      else router.push(`/discover/runs/${r.data}`);
    });

  const rejected = p.status === "rejected";
  const people = p.contacts.slice(0, 3);

  if (gone && !rejected) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-5 py-3 text-sm text-muted animate-fade-in">
        <span>
          <span className="font-medium text-text">{p.name}</span> — {gone}
        </span>
      </div>
    );
  }

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
      className={cn("rounded-lg border border-border border-l-4 bg-surface shadow-sm transition-shadow hover:shadow-md animate-rise", { strong: "border-l-accent", moderate: "border-l-moderate", weak: "border-l-border-strong", unknown: "border-l-border-strong" }[p.fit?.company.level ?? "unknown"], pending && "opacity-60", rejected && "bg-surface/60 border-l-border")}
      aria-labelledby={`p-${p.id}`}
    >
      <div className="flex flex-col gap-4 p-5">
        <header className="flex items-start gap-3">
          <CompanyLogo name={p.name} domain={p.domain} size={40} className="mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h2 id={`p-${p.id}`} className="font-sans text-[16.5px] font-semibold tracking-normal">
                <Link href={`/prospects/${p.id}`} className="hover:underline">
                  {p.name}
                </Link>
              </h2>
              {p.fit && <FitBadge level={p.fit.company.level} />}
              {p.inCrm && !rejected && <Badge tone={STATUS_META[p.status].tone} dot>{STATUS_META[p.status].label}</Badge>}
            </div>
            <p className="mt-0.5 text-sm text-muted">{[p.industry, p.location].filter(Boolean).join(" · ") || "Industry and location unknown"}</p>
            <ContactQuality p={p} />
          </div>
          <Button size="sm" variant="subtle" onClick={() => setWhy(true)} icon={<CircleHelp className="size-4" />} aria-label={`Why was ${p.name} suggested?`}>
            Why?
          </Button>
        </header>

        {rejected && p.rejectionReason && <p className="text-sm text-muted">Set aside — {p.rejectionReason}</p>}

        {!rejected && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-subtle">Why they may be relevant</p>
              <p className="mt-1 text-[14.5px] leading-6">{p.whyRelevant ?? p.whatTheyDo ?? "Not researched yet."}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-subtle">Potential opportunity</p>
              <p className="mt-1 text-[14.5px] leading-6 text-text/85">{p.potentialOpportunity ?? "Not assessed yet."}</p>
            </div>
          </div>
        )}

        {!rejected && people.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-subtle">Relevant people</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {people.map((c) => (
                <li key={c.id} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm" title={c.relevance}>
                  {c.name ? <UserCheck className="size-3.5 text-strong" aria-hidden /> : <UserRound className="size-3.5 text-subtle" aria-hidden />}
                  <span className={c.name ? "font-medium" : "text-muted"}>{c.name ?? c.role}</span>
                  {c.name && <span className="text-muted">{c.role}</span>}
                  {!c.name && <span className="sr-only">(role to find)</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3">
        {rejected ? (
          <Button size="sm" icon={<RotateCcw className="size-4" />} onClick={() => act(() => restoreAction(p.id), "Restored")}>
            Restore
          </Button>
        ) : (
          <>
            {!p.inCrm ? (
              <Button
                size="sm"
                variant="primary"
                icon={<Check className="size-4" />}
                title={p.isExample ? "Example data: free" : "Unlocks the full profile and brief. Uses 1 prospect unlock."}
                onClick={() =>
                  start(async () => {
                    const r = await addToCrmAction(p.id);
                    if (!r.ok) return toast({ kind: "error", title: r.error, action: /unlock|plan/i.test(r.error) ? { label: "See plans", onClick: () => router.push("/settings/billing") } : undefined });
                    toast({ title: `Kept ${p.name}. Full profile unlocked.`, action: { label: "Open", onClick: () => router.push(`/prospects/${p.id}`) } });
                    router.refresh();
                  })
                }
              >
                Keep{!p.isExample && <span className="font-normal opacity-80"> · 1 unlock</span>}
              </Button>
            ) : (
              <Link href={`/prospects/${p.id}`} className="text-sm font-medium text-accent-text hover:underline">
                Open prospect
              </Link>
            )}
            {!p.inCrm && (
              <>
                {!p.skippedAt && (
                  <Button size="sm" variant="ghost" icon={<Clock className="size-4" />} onClick={() => act(() => skipAction(p.id), "Skipped for now. It's under Skipped, no unlock used.", () => restoreAction(p.id))}>
                    Skip for now
                  </Button>
                )}
                <Menu
                  width={250}
                  items={[
                    { type: "label", label: "Why isn't it relevant?" },
                    ...REASONS.map((r) => ({ label: r, onSelect: () => act(() => feedbackAction(p.id, "not_relevant", r), "Marked not relevant", () => restoreAction(p.id)) })),
                    { label: "No particular reason", onSelect: () => act(() => feedbackAction(p.id, "not_relevant"), "Marked not relevant", () => restoreAction(p.id)) },
                  ]}
                  trigger={({ ref, ...tp }) => (
                    <Button ref={ref} {...tp} size="sm" variant="ghost" icon={<ThumbsDown className="size-4" />}>
                      Not relevant
                    </Button>
                  )}
                />
              </>
            )}
            <div className="ml-auto flex items-center gap-1">
              <Button size="sm" variant="ghost" icon={<Layers className="size-4" />} onClick={similar} className="max-sm:hidden">
                Find similar
              </Button>
              <Menu
                align="end"
                width={220}
                items={[
                  { label: "Find similar", icon: <Layers />, onSelect: similar },
                  ...(!p.inCrm ? [{ label: "Already know them", icon: <UserCheck />, onSelect: () => act(() => feedbackAction(p.id, "already_known"), "Marked as already known", () => restoreAction(p.id)) }] : []),
                  { label: "Exclude this company", icon: <Ban />, onSelect: () => act(() => feedbackAction(p.id, "exclude"), "Excluded — we won't suggest it again", () => restoreAction(p.id)) },
                  { label: "It's a competitor", icon: <Ban />, onSelect: () => act(() => feedbackAction(p.id, "competitor"), "Marked as a competitor", () => restoreAction(p.id)) },
                ]}
                trigger={({ ref, ...tp }) => (
                  <IconButton ref={ref} {...tp} label="More actions" size="sm">
                    <MoreHorizontal className="size-4" />
                  </IconButton>
                )}
              />
            </div>
          </>
        )}
      </footer>
      <WhyPanel p={p} open={why} onClose={() => setWhy(false)} />
    </article>
  );
}

/** What the user will get on keeping it: counts only, never the details themselves. */
function ContactQuality({ p }: { p: ProspectView }) {
  const q = p.contactQuality;
  const sources = p.evidence.filter((e) => e.url).length;
  const items = [
    q.sourced ? { icon: <UserCheck className="size-3.5 text-strong" aria-hidden />, text: `${q.sourced} named contact${q.sourced === 1 ? "" : "s"} on a public source` } : { icon: <UserRound className="size-3.5 text-subtle" aria-hidden />, text: "Roles to find, no named contact yet" },
    q.emails ? { icon: <Mail className="size-3.5 text-accent" aria-hidden />, text: `${q.emails} published email${q.emails === 1 ? "" : "s"}` } : null,
    sources ? { icon: <Link2 className="size-3.5 text-accent" aria-hidden />, text: `${sources} source${sources === 1 ? "" : "s"}` } : null,
  ].filter(Boolean) as { icon: React.ReactNode; text: string }[];
  return (
    <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
      {items.map((i) => (
        <span key={i.text} className="inline-flex items-center gap-1">{i.icon}{i.text}</span>
      ))}
    </p>
  );
}
