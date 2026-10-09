import { cn } from "./cn";

const S_PATH = "M20.5 8.5h-6.2a3.3 3.3 0 0 0 0 6.6h3.4a3.3 3.3 0 0 1 0 6.6H11.5";

/**
 * The Sales Scout mark: a single S-curve — one path of travel — with two
 * waypoints. While Sales Scout is working the S traces itself (`working`).
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
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <path
        d={S_PATH}
        className={working ? "mark-trace" : undefined}
        fill="none"
        stroke="var(--accent-fg)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M24 12.4v-.2M8 19.8v-.2" stroke="var(--accent-fg)" strokeOpacity=".55" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-[17px] font-[650] tracking-[-0.02em] text-heading">Sales Scout</span>
    </span>
  );
}
