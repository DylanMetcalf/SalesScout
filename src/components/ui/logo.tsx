import { cn } from "./cn";

/**
 * The Sales Scout mark: a compass needle on an ink tile.
 * The amber tip points at "where to go next". While Sales Scout is working,
 * the needle seeks (pass `working`); when it's done, it settles.
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
      <rect width="32" height="32" rx="9" fill="var(--brand-tile)" />
      <circle cx="16" cy="16" r="10.25" fill="none" stroke="var(--brand-tile-fg)" strokeOpacity=".22" strokeWidth="1.5" />
      <g className={working ? "needle-seek" : "needle-rest"}>
        <path d="M16 6.2 18.7 16h-5.4Z" fill="var(--signal)" />
        <path d="M13.3 16h5.4L16 25.8Z" fill="var(--brand-tile-fg)" />
      </g>
      <circle cx="16" cy="16" r="1.45" fill="var(--brand-tile)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-[17px] font-[650] tracking-[-0.02em] text-text">Sales Scout</span>
    </span>
  );
}
