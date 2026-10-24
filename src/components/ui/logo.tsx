import { cn } from "./cn";

/** The four corner brackets of the focus frame, on a 32-unit grid. */
export const FRAME_PATH = "M8 13V8h5M19 8h5v5M24 19v5h-5M13 24H8v-5";

/**
 * The Sales Scout mark: a focus frame closing in on one signal. It says what
 * Sales Scout does: find the thing that matters inside a messy problem. While
 * Sales Scout is working the signal pulses (`working`).
 */
export function LogoMark({ size = 28, working = false, className, label = "Sales Scout" }: { size?: number; working?: boolean; className?: string; label?: string | null }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={cn("shrink-0", className)}
      role={label ? "img" : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
    >
      <rect width="32" height="32" rx="8" fill="var(--brand-tile)" />
      <path d={FRAME_PATH} fill="none" stroke="var(--brand-tile-fg)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {working && <circle cx="16" cy="16" r="3" className="mark-working" fill="var(--mark-signal)" />}
      <circle cx="16" cy="16" r="3" fill="var(--mark-signal)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-[-0.025em] text-heading">Sales Scout</span>
    </span>
  );
}
