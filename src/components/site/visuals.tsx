import type { LucideIcon } from "lucide-react";
import { cn } from "@/components/ui/cn";

export function IconBadge({ icon: Icon, tone = "soft", className }: { icon: LucideIcon; tone?: "soft" | "solid" | "signal" | "muted"; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-xl",
        tone === "solid" && "bg-gradient-to-br from-accent to-accent-bright text-accent-fg shadow-[0_8px_20px_-10px_var(--accent)]",
        tone === "soft" && "bg-accent-soft text-accent-text",
        tone === "signal" && "bg-signal-soft text-signal-text",
        tone === "muted" && "bg-surface-2 text-subtle",
        className,
      )}
      aria-hidden
    >
      <Icon className="size-5" />
    </span>
  );
}
