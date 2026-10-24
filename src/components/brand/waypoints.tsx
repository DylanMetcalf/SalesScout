import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/components/ui/cn";

export type WaypointState = "done" | "current" | "todo";
export type WaypointStep = { label: ReactNode; detail?: ReactNode; state: WaypointState };

/**
 * Progress along a signal path: done nodes are filled cobalt, the current one
 * carries the signal (cobalt on light, cyan on dark), the rest are hollow. Used for the intake steps,
 * the confirmation page and an opportunity's stage. State is in the text too,
 * never colour alone.
 */
export function Waypoints({ steps, orientation = "horizontal", className, label }: { steps: WaypointStep[]; orientation?: "horizontal" | "vertical"; className?: string; label: string }) {
  const vertical = orientation === "vertical";
  return (
    <ol aria-label={label} className={cn("relative flex", vertical ? "flex-col gap-0" : "items-start", className)}>
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={i} aria-current={s.state === "current" ? "step" : undefined} className={cn("relative flex", vertical ? "gap-3 pb-6 last:pb-0" : "flex-1 flex-col items-start gap-2 pr-2 last:flex-none last:pr-0")}>
            {!last && (
              <span
                aria-hidden
                className={cn(
                  "absolute",
                  vertical ? "top-6 bottom-1 left-[11px] w-px" : "top-[11px] right-1 left-7 h-px",
                  s.state === "done"
                    ? "bg-accent"
                    : vertical
                      ? "bg-[repeating-linear-gradient(180deg,var(--border-strong)_0_4px,transparent_4px_8px)]"
                      : "bg-[repeating-linear-gradient(90deg,var(--border-strong)_0_4px,transparent_4px_8px)]",
                )}
              />
            )}
            <span
              aria-hidden
              className={cn(
                "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
                s.state === "done" && "border-accent bg-accent text-accent-fg",
                s.state === "current" && "border-signal bg-signal-soft",
                s.state === "todo" && "border-border-strong bg-bg",
              )}
            >
              {s.state === "done" && <Check className="size-3.5" strokeWidth={3} />}
              {s.state === "current" && <><span className="size-2 rounded-full bg-signal" /><span className="absolute inset-0 rounded-full border border-signal waypoint-pulse" /></>}
            </span>
            <span className="min-w-0">
              <span className={cn("block text-sm leading-tight", s.state === "current" ? "font-semibold text-text" : s.state === "done" ? "text-text" : "text-subtle")}>
                {s.label}
                <span className="sr-only">{s.state === "done" ? " (done)" : s.state === "current" ? " (current step)" : " (to do)"}</span>
              </span>
              {s.detail && <span className="mt-0.5 block text-xs text-subtle">{s.detail}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
