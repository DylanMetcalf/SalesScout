"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
  auto,
  examples,
}: {
  initialMode: Mode;
  initialStrategy: string | null;
  initialQuery: string;
  strategies: { id: string; name: string; summary: string }[];
  aiConnected: boolean;
  className?: string;
  auto?: boolean;
  examples: string[];
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

  const autoRan = useRef(false);
  useEffect(() => {
    if (auto && aiConnected && initialQuery.trim() && !autoRan.current) {
      autoRan.current = true;
      submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filterCount = Object.values(filters).filter((v) => v?.length).length;

  return (
    <div className={className}>
      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="rounded-2xl border border-border bg-surface shadow-md transition-shadow focus-within:border-accent focus-within:shadow-[var(--ring),var(--shadow-md)]">
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
            className="min-h-28 resize-none border-0 bg-transparent px-5 pt-4 text-lg shadow-none focus:shadow-none focus-visible:shadow-none"
          />
          <div className="flex flex-wrap items-center gap-2 px-3 pt-1 pb-3">
            <div role="radiogroup" aria-label="What are you looking for?" className="inline-flex rounded-lg bg-surface-2 p-0.5">
              {(
                [
                  ["discover", "Companies for me"],
                  ["specific", "Specific people"],
                ] as const
              ).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => setMode(m)}
                  className={cn("rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors", mode === m ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text")}
                >
                  {label}
                </button>
              ))}
            </div>
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

      {!query.trim() && !showFilters && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Examples">
          {examples.map((e) => (
            <button key={e} type="button" onClick={() => setQuery(e)} className="rounded-full border border-border bg-surface px-3 py-1 text-left text-sm text-muted transition-colors hover:border-border-strong hover:text-text">
              {e}
            </button>
          ))}
        </div>
      )}

      {error && <ErrorState className="mt-4" title="I couldn't start that search" body={error} />}

      {strategies.length > 0 && (
        <div className="mt-8">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted">
            <Target className="size-4" aria-hidden /> Or start from one of your strategies
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
