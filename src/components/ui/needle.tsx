import { cn } from "./cn";

/**
 * The compass needle from the Sales Scout mark, as an inline icon.
 * Marks Sales Scout's own suggestions and reasoning (instead of generic AI sparkles).
 */
export function Needle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4 shrink-0", className)} aria-hidden>
      <g transform="rotate(40 12 12)">
        <path d="M12 2.5 14.6 12H9.4Z" fill="var(--signal)" />
        <path d="M9.4 12h5.2L12 21.5Z" fill="currentColor" />
      </g>
      <circle cx="12" cy="12" r="1.3" fill="var(--surface)" />
    </svg>
  );
}
