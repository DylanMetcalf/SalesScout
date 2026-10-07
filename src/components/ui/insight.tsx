import type { ReactNode } from "react";
import { cn } from "./cn";
import { Needle } from "./needle";

/**
 * The one surface for Sales Scout's reasoning: why it suggests something,
 * what it noticed, what it concluded. Pine tint, needle marker, no effects.
 */
export function Insight({ label, children, className, actions }: { label?: ReactNode; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-insight-border border-l-[3px] border-l-accent bg-insight px-4 py-3", className)}>
      {label && (
        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-accent-text">
          <Needle className="size-3.5 text-accent-text" />
          {label}
        </p>
      )}
      <div className="text-[14.5px] leading-6 text-text/90">{children}</div>
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
