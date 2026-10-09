import { cn } from "./cn";

/**
 * The S-curve from the Sales Scout mark, as an inline icon. It marks Sales
 * Scout's own suggestions and reasoning instead of generic AI sparkles.
 * (Kept as `Needle` so existing imports don't change.)
 */
export function Needle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-4 shrink-0", className)} aria-hidden>
      <path d="M20.5 8.5h-6.2a3.3 3.3 0 0 0 0 6.6h3.4a3.3 3.3 0 0 1 0 6.6H11.5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 12.4v-.2M8 19.8v-.2" stroke="var(--signal)" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}
