"use client";

import { useRef, useState } from "react";
import { SITE } from "@/content/site";
import { cn } from "@/components/ui/cn";

/** A field of scattered nodes: how a problem looks before anyone has examined it. */
function NodeField({ className }: { className?: string }) {
  const nodes = [[14, 18], [42, 8], [70, 22], [96, 10], [24, 40], [58, 44], [88, 38], [108, 30]];
  return (
    <svg viewBox="0 0 120 52" className={className} aria-hidden fill="none">
      <path d="M14 18 42 8 70 22 96 10M24 40 58 44 88 38 108 30M42 8 58 44M70 22 88 38" stroke="currentColor" strokeOpacity=".35" strokeWidth="1" />
      {nodes.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.4" fill="currentColor" fillOpacity={i === 2 ? 1 : 0.55} />)}
    </svg>
  );
}

/**
 * The problem scan: pick a familiar problem and watch Sales Scout bring it
 * into focus, then trace a signal path to a way forward. Illustrative only
 * (labelled "Example"); nothing here is a real client.
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
    <figure className="relative rounded-[20px] border border-border bg-surface/70 p-4 shadow-lg backdrop-blur sm:p-6" aria-labelledby="fig-route">
      <figcaption id="fig-route" className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium text-heading">
          <span aria-hidden className="size-2 rounded-full bg-signal" /> Problem scan
        </span>
        <span className="caption-mono rounded-md border border-border px-2 py-0.5 text-subtle">Example</span>
      </figcaption>

      <div role="radiogroup" aria-label="Choose an example problem" className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-thin">
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
            className={cn(
              "shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition-[background,border-color,color] duration-200",
              i === active ? "border-signal/60 bg-signal-soft text-heading" : "border-border text-muted hover:border-border-strong hover:text-text",
            )}
          >
            {x.label}
          </button>
        ))}
      </div>

      {/* Stable live region; only its keyed child is replaced, so screen readers announce the change. */}
      <div aria-live="polite">
        <div key={r.key} className="mt-5 grid gap-4">
          <div className="relative rounded-xl border border-border bg-[var(--bg)] p-4 animate-rise">
            <NodeField className="absolute top-3 right-3 w-24 text-signal max-sm:hidden" />
            <p className="caption-mono text-subtle">In their words</p>
            <blockquote className="mt-2 text-[16px] leading-snug font-medium text-heading sm:max-w-[75%]">“{r.said}”</blockquote>
          </div>

          <ol className="relative grid gap-3 pl-7">
            {/* The signal path: from the problem through each step to a way forward. */}
            <span aria-hidden className="absolute top-1 bottom-6 left-[9px] w-px bg-gradient-to-b from-border-strong to-signal" />
            {r.steps.map((s, i) => {
              const last = i === r.steps.length - 1;
              return (
                <li key={s.kind} className="relative animate-rise" style={{ animationDelay: `${120 + i * 120}ms` }}>
                  <span aria-hidden className={cn("absolute top-4 -left-7 flex size-[19px] items-center justify-center rounded-full border", last ? "border-signal bg-signal-soft" : "border-border-strong bg-[var(--bg)]")}>
                    <span className={cn("size-[7px] rounded-full", last ? "bg-signal" : "bg-border-strong")} />
                    {last && <span className="absolute inset-0 rounded-full border border-signal waypoint-pulse" />}
                  </span>
                  <div className={cn("rounded-xl border p-3.5", last ? "frame border-signal/40 bg-signal-soft/60" : "border-border bg-surface")}>
                    <p className={cn("text-xs font-semibold", last ? "text-signal-text" : "text-subtle")}>{s.kind}</p>
                    <p className="mt-1 text-[15px] leading-6 text-text">{s.text}</p>
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
