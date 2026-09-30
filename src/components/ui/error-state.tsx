import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { cn } from "./cn";

/** Honest failure: what went wrong in plain words, and what the user can do now. */
export function ErrorState({ title, body, actions, className }: { title: ReactNode; body?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div role="alert" className={cn("rounded-lg border border-weak/25 bg-weak-soft/60 px-4 py-3.5", className)}>
      <div className="flex gap-3">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-weak" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-text">{title}</p>
          {body && <p className="mt-0.5 text-sm text-muted">{body}</p>}
          {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

export function Notice({ tone = "info", icon, title, children, className }: { tone?: "info" | "accent" | "moderate"; icon?: ReactNode; title?: ReactNode; children?: ReactNode; className?: string }) {
  const tones = {
    info: "border-info/20 bg-info-soft/60",
    accent: "border-accent/20 bg-accent-soft/70",
    moderate: "border-moderate/25 bg-moderate-soft/60",
  };
  return (
    <div className={cn("flex gap-3 rounded-lg border px-4 py-3", tones[tone], className)}>
      {icon && <span className="mt-0.5 shrink-0 text-muted [&>svg]:size-4">{icon}</span>}
      <div className="min-w-0 text-sm">
        {title && <p className="font-medium text-text">{title}</p>}
        {children && <div className={cn("text-muted", title && "mt-0.5")}>{children}</div>}
      </div>
    </div>
  );
}
