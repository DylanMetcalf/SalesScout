import { Check, Circle, LoaderCircle, X, Minus } from "lucide-react";
import type { JobStep } from "@/lib/db/schema";
import { cn } from "./cn";

/**
 * Shows what a long-running AI operation is actually doing, step by step,
 * instead of a mysterious spinner.
 */
export function ProgressSteps({ steps, className }: { steps: JobStep[]; className?: string }) {
  return (
    <ol className={cn("flex flex-col gap-0.5", className)} aria-live="polite">
      {steps.map((s) => (
        <li key={s.key} className="flex items-start gap-3 py-1.5">
          <span
            className={cn(
              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
              s.status === "done" && "bg-strong-soft text-strong",
              s.status === "running" && "bg-accent-soft text-accent",
              s.status === "failed" && "bg-weak-soft text-weak",
              (s.status === "waiting" || s.status === "skipped") && "text-subtle",
            )}
          >
            {s.status === "done" && <Check className="size-3.5" strokeWidth={2.5} />}
            {s.status === "running" && <LoaderCircle className="size-3.5 animate-spin" />}
            {s.status === "failed" && <X className="size-3.5" strokeWidth={2.5} />}
            {s.status === "waiting" && <Circle className="size-3" />}
            {s.status === "skipped" && <Minus className="size-3" />}
          </span>
          <div className="min-w-0">
            <p className={cn("text-[14.5px]", s.status === "waiting" || s.status === "skipped" ? "text-subtle" : "text-text", s.status === "running" && "font-medium")}>
              {s.label}
              <span className="sr-only"> — {s.status}</span>
            </p>
            {s.detail && <p className={cn("text-sm", s.status === "failed" ? "text-weak" : "text-muted")}>{s.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
