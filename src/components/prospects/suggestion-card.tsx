"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Needle } from "@/components/ui/needle";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { applySuggestionAction, ignoreSuggestionAction } from "@/app/actions/prospects";

/** A learning suggestion. Sales Scout asks; it never changes strategy by itself. */
export function SuggestionCard({ s }: { s: { id: string; title: string; body: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const act = (fn: () => Promise<{ ok: boolean }>, msg: string) =>
    start(async () => {
      const r = await fn();
      if (r.ok) toast({ title: msg });
      router.refresh();
    });
  return (
    <div className="flex gap-3 rounded-lg border border-insight-border bg-insight px-4 py-3.5">
      <Needle className="mt-1 size-4 text-accent-text" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{s.title}</p>
        <p className="mt-0.5 text-sm text-muted">{s.body}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="primary" loading={pending} onClick={() => act(() => applySuggestionAction(s.id), "Preference applied")}>
            Apply
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => act(() => ignoreSuggestionAction(s.id), "Ignored")}>
            Ignore
          </Button>
        </div>
      </div>
    </div>
  );
}
