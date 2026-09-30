import { cn } from "./cn";

const palette = ["#1c6a56", "#4453b3", "#9a6310", "#7349ad", "#b0433a", "#2d7a4c", "#35637f"];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** Deterministic initials avatar. Used for people, companies and workspaces. */
export function Avatar({ name, size = 32, square, className }: { name: string; size?: number; square?: boolean; className?: string }) {
  const color = palette[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center font-semibold text-white", square ? "rounded-md" : "rounded-full", className)}
      style={{ width: size, height: size, background: color, fontSize: Math.max(10, size * 0.38) }}
    >
      {initials(name)}
    </span>
  );
}
