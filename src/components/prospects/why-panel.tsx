"use client";

import { ExternalLink, CircleCheck, CircleDashed, CircleHelp, Search } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { FitBadge, FitDimensions, FitVerdict } from "@/components/ui/fit";
import { cn } from "@/components/ui/cn";
import type { ProspectView } from "@/lib/types";

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("border-t border-border pt-5", className)}>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-subtle">{title}</h3>
      {children}
    </section>
  );
}

function List({ items, icon, empty }: { items: string[]; icon: React.ReactNode; empty: string }) {
  if (!items.length) return <p className="text-sm text-subtle">{empty}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {items.map((x) => (
        <li key={x} className="flex gap-2.5 text-[14.5px]">
          <span className="mt-1 shrink-0">{icon}</span>
          {x}
        </li>
      ))}
    </ul>
  );
}

/**
 * WHY? — the trust feature. Everything behind a prospect: what matched,
 * the evidence, what's confirmed, what's inferred and what we don't know.
 */
export function WhyPanel({ p, open, onClose }: { p: ProspectView; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} variant="sheet" title={`Why ${p.name}?`} description="Everything behind this suggestion, including what I couldn't verify.">
      <div className="flex flex-col gap-6">
        {p.isExample && <p className="rounded-md bg-violet-soft px-3 py-2 text-sm text-violet">Example data — this company and its sources are fictional.</p>}
        {p.fit && (
          <section className="flex flex-col gap-2 rounded-xl bg-surface-2 p-4">
            <FitBadge level={p.fit.company.level} className="self-start" />
            <FitVerdict fit={p.fit} />
          </section>
        )}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-subtle">Why this company appeared</h3>
          <p className="text-[15px] leading-7">{p.whyRelevant ?? "Not assessed yet."}</p>
          {p.potentialOpportunity && (
            <p className="mt-3 text-[15px] leading-7 text-muted">
              <span className="font-medium text-text">Potential opportunity: </span>
              {p.potentialOpportunity}
            </p>
          )}
        </section>

        {p.criteria && p.criteria.length > 0 && (
          <Section title="Matching criteria">
            <dl className="grid gap-3 sm:grid-cols-2">
              {p.criteria.map((c) => (
                <div key={c.label}>
                  <dt className="text-sm text-muted">{c.label}</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {c.values.map((v) => (
                      <span key={v} className="rounded-md bg-surface-2 px-2 py-0.5 text-sm">{v}</span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        {p.fit && (
          <Section title="How they fit">
            <FitDimensions fit={p.fit} dense />
          </Section>
        )}

        <Section title="Evidence">
          {p.evidence.length ? (
            <ul className="flex flex-col gap-3">
              {p.evidence.map((e) => (
                <li key={e.id} className="rounded-md border border-border px-3.5 py-2.5">
                  <div className="flex items-start gap-2">
                    <Search className="mt-1 size-3.5 shrink-0 text-subtle" aria-hidden />
                    <div className="min-w-0 flex-1">
                      {e.url && !p.isExample ? (
                        <a href={e.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-accent-text hover:underline">
                          {e.title} <ExternalLink className="size-3" aria-hidden />
                        </a>
                      ) : (
                        <p className="font-medium">{e.title}</p>
                      )}
                      {e.snippet && <p className="mt-0.5 text-sm text-muted">&ldquo;{e.snippet}&rdquo;</p>}
                      {e.supports && <p className="mt-1 text-xs text-subtle">Supports: {e.supports}</p>}
                      {e.url && <p className="mt-0.5 truncate text-xs text-subtle">{e.url}</p>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-subtle">No sources recorded.</p>
          )}
        </Section>

        <div className="grid gap-6 sm:grid-cols-1">
          <Section title="Confirmed">
            <List items={p.confirmedFacts} icon={<CircleCheck className="size-4 text-strong" aria-hidden />} empty="Nothing confirmed by a source yet." />
          </Section>
          <Section title="Inferred">
            <List items={p.inferences} icon={<CircleDashed className="size-4 text-info" aria-hidden />} empty="No inferences." />
          </Section>
          <Section title="What I couldn't verify">
            <List items={p.unknowns} icon={<CircleHelp className="size-4 text-subtle" aria-hidden />} empty="Nothing flagged — but always verify before reaching out." />
          </Section>
        </div>

        {p.contacts.length > 0 && (
          <Section title="Why these people">
            <ul className="flex flex-col gap-2.5">
              {p.contacts.map((c) => (
                <li key={c.id} className="text-[14.5px]">
                  <span className="font-medium">{c.name ?? c.role}</span>
                  {c.name && <span className="text-muted"> · {c.role}</span>}
                  {!c.name && <span className="text-subtle"> (a role to find — no named person confirmed)</span>}
                  <p className="text-sm text-muted">{c.relevance}</p>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </Dialog>
  );
}
