"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

type R<T> = { ok: true; data: T } | { ok: false; error: string };

/** Runs a server action, surfaces errors as toasts, and refreshes server data. */
export function useAction() {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const run = <T,>(fn: () => Promise<R<T>>, opts?: { success?: string; then?: (d: T) => void; refresh?: boolean }) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) {
        toast({ kind: "error", title: r.error });
        return;
      }
      if (opts?.success) toast({ title: opts.success });
      opts?.then?.(r.data);
      if (opts?.refresh !== false) router.refresh();
    });
  return { pending, run };
}

export type ContactFull = {
  id: string;
  name: string | null;
  role: string;
  email: string | null;
  phone: string | null;
  profileUrl: string | null;
  relevance: string;
  sourceUrl: string | null;
  knowledge: string;
  origin: string;
};
