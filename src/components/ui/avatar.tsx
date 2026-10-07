import { cn } from "./cn";

const palette = ["#17604b", "#2f4a40", "#8a5a12", "#3d6b5c", "#55633a", "#7a4b2a", "#35596a"];

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
