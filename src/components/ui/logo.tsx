import { cn } from "./cn";

/**
 * The Sales Scout mark: two offset S-curves forming a single path of travel —
 * one for "sales", one for "scout" — inside a soft square.
 */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={cn("shrink-0", className)} role="img" aria-label="Sales Scout">
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <path
        d="M20.5 8.5h-6.2a3.3 3.3 0 0 0 0 6.6h3.4a3.3 3.3 0 0 1 0 6.6H11.5"
        fill="none"
        stroke="var(--accent-fg)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 12.4v-.2M8 19.8v-.2"
        stroke="var(--accent-fg)"
        strokeOpacity=".55"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-[-0.01em] text-text">Sales Scout</span>
    </span>
  );
}
