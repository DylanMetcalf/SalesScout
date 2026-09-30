"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, SlidersHorizontal, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ChipInput } from "@/components/ui/chip-input";
import { ErrorState } from "@/components/ui/error-state";
import { cn } from "@/components/ui/cn";
import { planSearchAction } from "@/app/actions/discovery";
import type { SearchInterpretation } from "@/lib/db/schema";

type Mode = "discover" | "specific";
const FILTERS: { key: keyof SearchInterpretation; label: string; placeholder: string }[] = [
  { key: "industries", label: "Industry", placeholder: "e.g. Mining" },
  { key: "geographies", label: "Geography", placeholder: "e.g. Gauteng" },
  { key: "buyerRoles", label: "Job titles", placeholder: "e.g. Operations Manager" },
  { key: "companySizes", label: "Company size", placeholder: "e.g. 50–500 employees" },
  { key: "companyTypes", label: "Company type", placeholder: "e.g. Mining contractors" },
  { key: "keywords", label: "Keywords", placeholder: "e.g. conveyor, crusher" },
];

export function DiscoverForm({
  initialMode,
  initialStrategy,
  initialQuery,
  strategies,
  aiConnected,
  className,
}: {
  initialMode: Mode;
  initialStrategy: string | null;
  initialQuery: string;
  strategies: { id: string; name: string; summary: string }[];
  aiConnected: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [query, setQuery] = useState(initialQuery);
  const [strategy, setStrategy] = useState<string | null>(initialStrategy);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Partial<Record<keyof SearchInterpretation, string[]>>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const placeholder =
    mode === "discover"
      ? "Find companies that could need our services."
      : "e.g. Operations Managers at mining companies in South Africa.";

  const submit = () =>
    start(async () => {
      setError(null);
      const r = await planSearchAction({ query, mode, strategyId: strategy, filters });
      if (!r.ok) setError(r.error);
      else router.push(`/discover/runs/${r.data}`);
    });

  const filterCount = Object.values(filters).filter((v) => v?.length).length;

  return (
    <div className={className}>
      <div role="radiogroup" aria-label="How do you want to search?" className="inline-flex rounded-lg border border-border bg-surface-2 p-1">
        {(
          [
            ["discover", "Discover for me"],
            ["specific", "I know what I'm looking for"],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={cn("rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors", mode === m ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text")}
          >
            {label}
          </button>
        ))}
      </div>

      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="rounded-xl border border-border bg-surface shadow-sm transition-shadow focus-within:border-accent focus-within:shadow-[var(--ring)]">
          <label htmlFor="discover-q" className="sr-only">
            Who are we looking for?
          </label>
          <Textarea
            id="discover-q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            placeholder={placeholder}
            className="min-h-28 resize-none border-0 bg-transparent px-5 pt-4 text-lg shadow-none focus:shadow-none"
          />
          <div className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-2.5">
            <Button type="button" variant="ghost" size="sm" icon={<SlidersHorizontal className="size-4" />} onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
              Filters{filterCount ? ` · ${filterCount}` : ""}
            </Button>
            <span className="ml-auto hidden text-xs text-subtle sm:block">⌘ Enter</span>
            <Button type="submit" variant="primary" loading={pending} disabled={!aiConnected && !strategy} icon={<ArrowRight className="size-4" />}>
              Discover
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 grid gap-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 animate-rise">
            <p className="text-sm text-muted sm:col-span-2">All optional. Anything you add here overrides my interpretation.</p>
            {FILTERS.map((f) => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label htmlFor={`f-${f.key}`} className="text-sm font-medium">{f.label}</label>
                <ChipInput id={`f-${f.key}`} value={filters[f.key] ?? []} onChange={(v) => setFilters((s) => ({ ...s, [f.key]: v }))} placeholder={f.placeholder} />
              </div>
            ))}
          </div>
        )}
      </form>

      {error && <ErrorState className="mt-4" title="I couldn't start that search" body={error} />}

      {strategies.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted">
            <Target className="size-4" aria-hidden /> Use one of your lead strategies
          </p>
          <div className="flex flex-wrap gap-2">
            {strategies.map((s) => {
              const on = strategy === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setStrategy(on ? null : s.id)}
                  className={cn(
                    "flex flex-col items-start rounded-lg border px-3.5 py-2 text-left transition-colors",
                    on ? "border-accent bg-accent-soft/60" : "border-border bg-surface hover:border-border-strong",
                  )}
                >
                  <span className="text-sm font-medium">{s.name}</span>
                  {s.summary && <span className="text-xs text-muted">{s.summary}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
