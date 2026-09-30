import { CircleCheck, CircleDashed, CircleHelp, Lightbulb } from "lucide-react";
import type { Knowledge } from "@/lib/db/schema";
import { cn } from "./cn";

export const KNOWLEDGE_META: Record<Knowledge, { label: string; description: string; className: string; Icon: typeof CircleCheck }> = {
  confirmed: {
    label: "Confirmed",
    description: "Directly supported by information you provided or a source we read.",
    className: "bg-strong-soft text-strong",
    Icon: CircleCheck,
  },
  inferred: {
    label: "Inferred",
    description: "A reasonable conclusion from the available information — not stated outright.",
    className: "bg-info-soft text-info",
    Icon: CircleDashed,
  },
  suggested: {
    label: "Suggested",
    description: "A hypothesis worth investigating. Sales Scout hasn't verified it.",
    className: "bg-violet-soft text-violet",
    Icon: Lightbulb,
  },
  unknown: {
    label: "Unknown",
    description: "Information we don't currently have.",
    className: "bg-neutral-soft text-muted",
    Icon: CircleHelp,
  },
};

/** Marks how well-supported a statement is. Used everywhere AI knowledge appears. */
export function KnowledgeBadge({ value, className, compact }: { value: Knowledge; className?: string; compact?: boolean }) {
  const meta = KNOWLEDGE_META[value];
  return (
    <span
      title={meta.description}
      className={cn("inline-flex h-5.5 items-center gap-1 rounded-full px-2 text-xs font-medium whitespace-nowrap", meta.className, className)}
    >
      <meta.Icon className="size-3" aria-hidden />
      {compact ? <span className="sr-only">{meta.label}</span> : meta.label}
    </span>
  );
}

export function KnowledgeLegend({ className }: { className?: string }) {
  return (
    <dl className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {(Object.keys(KNOWLEDGE_META) as Knowledge[]).map((k) => (
        <div key={k} className="flex items-start gap-2.5">
          <dt className="shrink-0">
            <KnowledgeBadge value={k} />
          </dt>
          <dd className="text-sm text-muted">{KNOWLEDGE_META[k].description}</dd>
        </div>
      ))}
    </dl>
  );
}
