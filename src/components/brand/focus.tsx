import { cn } from "@/components/ui/cn";
import { FRAME_PATH } from "@/components/ui/logo";

/** The focus frame on its own, as a small glyph for labels and list markers. */
export function FrameGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="6 6 20 20" className={cn("size-3.5 shrink-0", className)} aria-hidden fill="none">
      <path d={FRAME_PATH} stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="2.6" fill="currentColor" />
    </svg>
  );
}

/**
 * Corner brackets around whatever matters most in a composition. The brand's
 * signature motif. Use once per view; `hover` reveals it only on hover/focus.
 */
export function FocusFrame({ children, hover, className }: { children: React.ReactNode; hover?: boolean; className?: string }) {
  return <div className={cn("frame", hover && "frame-hover", className)}>{children}</div>;
}
