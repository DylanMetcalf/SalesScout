"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "./cn";

type Tab = { id: string; label: ReactNode; count?: number };

/** Keyboard-accessible tab list (arrow keys, Home/End) per the WAI-ARIA pattern. */
export function Tabs({
  tabs,
  value,
  onChange,
  className,
  label,
}: {
  tabs: Tab[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
  label: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (i: number) => {
    const next = (i + tabs.length) % tabs.length;
    refs.current[next]?.focus();
    onChange(tabs[next].id);
  };
  return (
    <div role="tablist" aria-label={label} className={cn("flex gap-1 border-b border-border overflow-x-auto scrollbar-thin", className)}>
      {tabs.map((tab, i) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") move(i + 1);
              else if (e.key === "ArrowLeft") move(i - 1);
              else if (e.key === "Home") move(0);
              else if (e.key === "End") move(tabs.length - 1);
              else return;
              e.preventDefault();
            }}
            className={cn(
              "relative -mb-px flex h-10 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors outline-none focus-visible:shadow-[var(--ring)] rounded-t-md",
              selected ? "border-accent text-text" : "border-transparent text-muted hover:text-text",
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn("rounded-full px-1.5 text-xs tabular-nums", selected ? "bg-accent-soft text-accent-text" : "bg-surface-3 text-muted")}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ id, active, children, className }: { id: string; active: boolean; children: ReactNode; className?: string }) {
  if (!active) return null;
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} className={cn("animate-fade-in", className)}>
      {children}
    </div>
  );
}
