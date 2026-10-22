"use client";

import { useState } from "react";
import { companyIconUrl, initials } from "@/lib/company-identity";
import { cn } from "./cn";

/** Company icon from its official website, with a neutral initials fallback. */
export function CompanyLogo({ name, domain, size = 40, className }: { name: string; domain: string | null; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const src = companyIconUrl(domain, size >= 48 ? 128 : 64);
  const box = { width: size, height: size };
  if (!src || failed) {
    return (
      <span style={box} className={cn("flex shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 font-semibold text-muted", className)} aria-hidden>
        <span style={{ fontSize: size * 0.36 }}>{initials(name)}</span>
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- external favicon; no optimisation needed
    <img src={src} alt="" width={size} height={size} onError={() => setFailed(true)} style={box} className={cn("shrink-0 rounded-lg border border-border bg-white object-contain p-1", className)} />
  );
}
