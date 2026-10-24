"use client";

import { useRef, useState } from "react";
import { SITE } from "@/content/site";
import { cn } from "@/components/ui/cn";
import { HUE_VAR } from "./hues";


/** A tangled line: how a problem feels before anyone has looked at it properly. */
function Tangle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 48" className={className} aria-hidden fill="none">
      <path d="M4 30c10-22 24 16 34-4s-6-22 10-14 4 26 18 18 2-22 16-20 8 24 18 14 6-16 16-12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * FIG. 01: pick a familiar problem and watch it become a route forward.
 * Purely illustrative (labelled "Example"); nothing here is a real client.
 */
export function HeroRoute() {
  const routes = SITE.routes;
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const r = routes[active];
  const move = (i: number) => {
    const n = (i + routes.length) % routes.length;
    setActive(n);
    refs.current[n]?.focus();
  };

  return (
    <figure className="theme-ink brand-hero hero-grid relative overflow-hidden rounded-panel border border-border p-5 shadow-lg sm:p-8" aria-labelledby="fig-route">
      <figcaption id="fig-route" className="flex flex-wrap items-center justify-between gap-3">
        <span className="caption-mono text-subtle">Fig. 01 · A problem, routed</span>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted">Example</span>
      </figcaption>

      <div role="radiogroup" aria-label="Choose an example problem" className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-thin [mask-image:linear-gradient(90deg,#000_85%,transparent)] sm:[mask-image:none]">
        {routes.map((x, i) => (
          <button
            key={x.key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={i === active}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") move(i + 1);
              else if (e.key === "ArrowLeft" || e.key === "ArrowUp") move(i - 1);
              else if (e.key === "Home") move(0);
              else if (e.key === "End") move(routes.length - 1);
              else return;
              e.preventDefault();
            }}
            style={{ ["--hue" as string]: HUE_VAR[x.hue] }}
            className={cn(
              "hue flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-[background,border-color,color] duration-200",
              i === active ? "border-[var(--hue-line)] bg-[var(--hue-soft)] text-heading" : "border-border text-muted hover:border-border-strong hover:text-text",
            )}
          >
            <span className="size-2 rounded-full bg-[var(--hue)]" aria-hidden />
            {x.label}
          </button>
        ))}
      </div>

      {/* Stable live region; only its keyed child is replaced, so screen readers announce the change. */}
      <div aria-live="polite">
      <div key={r.key} className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,2fr)] lg:gap-6">
        <div style={{ ["--hue" as string]: HUE_VAR[r.hue] }} className="hue relative rounded-2xl border border-[var(--hue-line)] bg-[var(--hue-soft)] p-5 animate-rise">
          <Tangle className="absolute top-4 right-4 w-20 text-[var(--hue)] opacity-80" />
          <p className="caption-mono text-[var(--hue-ink)]">In their words</p>
          <blockquote className="mt-3 font-display text-[19px] leading-snug font-[550] text-heading">“{r.said}”</blockquote>
        </div>

        <ol className="relative grid gap-4 lg:grid-cols-3 lg:gap-5 lg:pt-7">
          {/* The route: drawn from the problem through each waypoint to a way forward. */}
          <svg aria-hidden className="pointer-events-none absolute top-0 left-0 hidden h-6 w-full lg:block" viewBox="0 0 1000 24" preserveAspectRatio="none" fill="none">
            <path d="M0 12 H1000" stroke="var(--signal)" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="route-draw" style={{ ["--route-len" as string]: "1000" }} />
          </svg>
          <span aria-hidden className="absolute top-2 bottom-2 left-[11px] w-0.5 bg-signal lg:hidden" />
          {r.steps.map((s, i) => {
            const last = i === r.steps.length - 1;
            return (
              <li key={s.kind} className="relative pl-9 animate-rise lg:pl-0" style={{ animationDelay: `${150 + i * 140}ms` }}>
                <span aria-hidden className={cn("absolute top-1 left-0 flex size-6 items-center justify-center rounded-full border-2 lg:-top-7", last ? "border-signal bg-signal" : "border-heading bg-bg")}>
                  {last && <span className="absolute inset-0 rounded-full bg-signal waypoint-pulse" />}
                </span>
                <div className={cn("rounded-2xl border p-4", last ? "border-signal/50 bg-surface-2" : "border-border bg-surface")}>
                  <p className={cn("caption-mono", last ? "text-signal-text" : "text-subtle")}>{s.kind}</p>
                  <p className="mt-2 text-[15px] leading-6 text-text">{s.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      </div>
    </figure>
  );
}
