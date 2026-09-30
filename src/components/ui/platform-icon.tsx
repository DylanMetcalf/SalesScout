import { Globe } from "lucide-react";
import { cn } from "./cn";

export const PLATFORMS: Record<string, { label: string; mark: string; color: string; placeholder: string }> = {
  linkedin: { label: "LinkedIn", mark: "in", color: "#0a66c2", placeholder: "linkedin.com/company/your-company" },
  facebook: { label: "Facebook", mark: "f", color: "#1877f2", placeholder: "facebook.com/yourpage" },
  instagram: { label: "Instagram", mark: "IG", color: "#c13584", placeholder: "instagram.com/yourhandle" },
  x: { label: "X", mark: "X", color: "#16171a", placeholder: "x.com/yourhandle" },
  youtube: { label: "YouTube", mark: "YT", color: "#e62117", placeholder: "youtube.com/@yourchannel" },
  tiktok: { label: "TikTok", mark: "TT", color: "#25282d", placeholder: "tiktok.com/@yourhandle" },
  other: { label: "Other profile", mark: "", color: "#5a5d64", placeholder: "https://…" },
};

/** Neutral platform marks — plain initials rather than trademarked logos. */
export function PlatformIcon({ platform, size = 28, className }: { platform: string; size?: number; className?: string }) {
  const p = PLATFORMS[platform] ?? PLATFORMS.other;
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-md font-bold text-white", className)}
      style={{ width: size, height: size, background: p.color, fontSize: size * 0.36 }}
    >
      {p.mark || <Globe style={{ width: size * 0.5, height: size * 0.5 }} />}
    </span>
  );
}

export function detectPlatform(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("linkedin.")) return "linkedin";
  if (u.includes("facebook.") || u.includes("fb.com")) return "facebook";
  if (u.includes("instagram.")) return "instagram";
  if (u.includes("twitter.") || /(^|\/\/|\.)x\.com/.test(u)) return "x";
  if (u.includes("youtube.") || u.includes("youtu.be")) return "youtube";
  if (u.includes("tiktok.")) return "tiktok";
  return "other";
}
