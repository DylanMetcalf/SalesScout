import type { ReactNode } from "react";
import { cn } from "./cn";

/** Lightweight tooltip shown on hover and keyboard focus. Content is also exposed via aria-describedby-free text. */
export function Tooltip({ content, children, className, side = "top" }: { content: ReactNode; children: ReactNode; className?: string; side?: "top" | "bottom" }) {
  return (
    <span className={cn("group/tt relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 w-max max-w-64 -translate-x-1/2 rounded-md bg-text px-2.5 py-1.5 text-xs text-bg opacity-0 shadow-md transition-opacity delay-300 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100",
          side === "top" ? "bottom-full mb-2" : "top-full mt-2",
        )}
      >
        {content}
      </span>
    </span>
  );
}
