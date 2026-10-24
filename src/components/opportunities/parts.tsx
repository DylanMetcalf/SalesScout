import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/components/ui/cn";

/** Where a piece of content came from. Shown on every block of the opportunity. */
const ORIGIN = {
  customer: { label: "Customer’s words", className: "bg-signal-soft text-signal-text" },
  ai: { label: "AI interpretation: review before relying on it", className: "bg-violet-soft text-violet" },
  research: { label: "From public sources", className: "bg-info-soft text-info" },
  observed: { label: "Checked directly on the website", className: "bg-strong-soft text-strong" },
  operator: { label: "Written by you", className: "bg-accent-soft text-accent-text" },
} as const;

export function Origin({ kind, className }: { kind: keyof typeof ORIGIN; className?: string }) {
  return <span className={cn("inline-flex h-5 items-center rounded px-1.5 text-[11px] font-medium", ORIGIN[kind].className, className)}>{ORIGIN[kind].label}</span>;
}

export function Block({ title, origin, action, children, className }: { title: string; origin?: keyof typeof ORIGIN; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border border-border bg-surface", className)}>
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          {origin && <Origin kind={origin} />}
        </div>
        {action}
      </header>
      <div className="px-5 pb-5">{children}</div>
    </section>
  );
}

export function List({ items, empty = "None noted." }: { items: string[]; empty?: string }) {
  if (!items.length) return <p className="text-sm text-subtle">{empty}</p>;
  return (
    <ul className="flex list-disc flex-col gap-1 pl-5 text-[14.5px] marker:text-subtle">
      {items.map((x, i) => <li key={i}>{x}</li>)}
    </ul>
  );
}

export function SourceLink({ url, title }: { url: string; title?: string }) {
  let label = url;
  try {
    const u = new URL(url);
    label = `${u.hostname.replace(/^www\./, "")}${u.pathname === "/" ? "" : u.pathname}`;
  } catch {
    /* show as is */
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" title={title ?? url} className="inline-flex max-w-full items-center gap-1 text-accent-text hover:underline">
      <span className="truncate">{label}</span>
      <ExternalLink className="size-3 shrink-0" aria-hidden />
    </a>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <h3 className="mb-1.5 text-xs font-semibold tracking-[0.06em] text-subtle uppercase">{children}</h3>;
}
