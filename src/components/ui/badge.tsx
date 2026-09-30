import type { ComponentProps } from "react";
import { cn } from "./cn";

export type Tone = "neutral" | "accent" | "strong" | "moderate" | "weak" | "info" | "violet";

const tones: Record<Tone, string> = {
  neutral: "bg-neutral-soft text-muted",
  accent: "bg-accent-soft text-accent-text",
  strong: "bg-strong-soft text-strong",
  moderate: "bg-moderate-soft text-moderate",
  weak: "bg-weak-soft text-weak",
  info: "bg-info-soft text-info",
  violet: "bg-violet-soft text-violet",
};
const dots: Record<Tone, string> = {
  neutral: "bg-subtle",
  accent: "bg-accent",
  strong: "bg-strong",
  moderate: "bg-moderate",
  weak: "bg-weak",
  info: "bg-info",
  violet: "bg-violet",
};

export function Badge({ tone = "neutral", dot, className, children, ...props }: ComponentProps<"span"> & { tone?: Tone; dot?: boolean }) {
  return (
    <span
      className={cn("inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap", tones[tone], className)}
      {...props}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dots[tone])} aria-hidden />}
      {children}
    </span>
  );
}

export function StatusDot({ tone = "neutral", pulse, className }: { tone?: Tone; pulse?: boolean; className?: string }) {
  return <span className={cn("inline-block size-2 rounded-full", dots[tone], pulse && "animate-pulse-soft", className)} aria-hidden />;
}
