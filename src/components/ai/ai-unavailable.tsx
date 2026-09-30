import Link from "next/link";
import { PlugZap } from "lucide-react";
import { cn } from "@/components/ui/cn";

/** Clear, honest state for features that need the AI provider. */
export function AiUnavailable({ feature, className }: { feature: string; className?: string }) {
  return (
    <div className={cn("flex gap-3 rounded-lg border border-moderate/25 bg-moderate-soft/50 px-4 py-3", className)}>
      <PlugZap className="mt-0.5 size-4 shrink-0 text-moderate" aria-hidden />
      <div className="text-sm">
        <p className="font-medium text-text">AI isn&apos;t connected yet</p>
        <p className="mt-0.5 text-muted">
          {feature} needs the AI research layer. Nothing here will be simulated in the meantime.{" "}
          <Link href="/settings#ai" className="font-medium text-accent-text hover:underline">
            Paste your API key in Settings
          </Link>
        </p>
      </div>
    </div>
  );
}
