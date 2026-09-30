import type { FitAssessment, FitLevel } from "@/lib/db/schema";
import { cn } from "./cn";

export const FIT_LABELS: Record<keyof FitAssessment, string> = {
  company: "Company fit",
  industry: "Industry fit",
  geography: "Geographic fit",
  need: "Potential need",
  contact: "Contact relevance",
  evidence: "Evidence strength",
};

const levelStyle: Record<FitLevel, { label: string; bar: string; text: string; filled: number }> = {
  strong: { label: "Strong", bar: "bg-strong", text: "text-strong", filled: 3 },
  moderate: { label: "Moderate", bar: "bg-moderate", text: "text-moderate", filled: 2 },
  weak: { label: "Weak", bar: "bg-weak", text: "text-weak", filled: 1 },
  unknown: { label: "Unknown", bar: "bg-surface-3", text: "text-subtle", filled: 0 },
};

/** Three-segment meter + word. Deliberately not a percentage. */
export function FitLevelIndicator({ level, className }: { level: FitLevel; className?: string }) {
  const s = levelStyle[level];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex gap-0.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn("h-3 w-1.5 rounded-sm", i < s.filled ? s.bar : "bg-surface-3")} />
        ))}
      </span>
      <span className={cn("text-sm font-medium", s.text)}>{s.label}</span>
    </span>
  );
}

/** Headline company-fit badge for list rows and headers. */
export function FitBadge({ level, className }: { level: FitLevel; className?: string }) {
  const tone = {
    strong: "bg-strong-soft text-strong",
    moderate: "bg-moderate-soft text-moderate",
    weak: "bg-weak-soft text-weak",
    unknown: "bg-neutral-soft text-muted",
  }[level];
  return (
    <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold tracking-wide uppercase", tone, className)}>
      {levelStyle[level].label} fit
    </span>
  );
}

/** Every dimension with its explanation — the "no magic score" view. */
export function FitDimensions({ fit, dense, className }: { fit: FitAssessment; dense?: boolean; className?: string }) {
  return (
    <dl className={cn("divide-y divide-border", className)}>
      {(Object.keys(FIT_LABELS) as (keyof FitAssessment)[]).map((key) => (
        <div key={key} className={cn("grid gap-1 sm:grid-cols-[180px_1fr] sm:gap-4", dense ? "py-2.5" : "py-3.5")}>
          <dt className="flex flex-col gap-1">
            <span className="text-sm text-muted">{FIT_LABELS[key]}</span>
            <FitLevelIndicator level={fit[key]?.level ?? "unknown"} />
          </dt>
          <dd className="text-sm text-text/85 sm:pt-0.5">{fit[key]?.explanation || "Not assessed yet."}</dd>
        </div>
      ))}
    </dl>
  );
}
