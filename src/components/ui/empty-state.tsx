import type { ReactNode } from "react";
import { cn } from "./cn";

/** Empty states teach: say what this place is for, and offer the next action. */
export function EmptyState({
  icon,
  title,
  body,
  action,
  secondary,
  className,
  compact,
}: {
  icon?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  secondary?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center", compact ? "px-6 py-8" : "px-6 py-16", className)}>
      {icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-accent-soft text-accent-text [&>svg]:size-5">
          {icon}
        </div>
      )}
      <h3 className={cn("font-semibold text-text", compact ? "text-[15px]" : "text-lg")}>{title}</h3>
      {body && <p className="mt-1.5 max-w-md text-muted">{body}</p>}
      {(action || secondary) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondary}
        </div>
      )}
    </div>
  );
}
