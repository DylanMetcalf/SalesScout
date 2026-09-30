"use client";

import { useEffect, useState } from "react";
import type { JobStep } from "@/lib/db/schema";

export type JobState = {
  id: string;
  type: string;
  status: "queued" | "running" | "completed" | "partial" | "failed";
  steps: JobStep[];
  result: Record<string, unknown> | null;
  error: string | null;
};

/** Polls a background job until it finishes. */
export function useJob(jobId: string | null, onDone?: (job: JobState) => void) {
  const [job, setJob] = useState<JobState | null>(null);
  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as JobState;
          if (cancelled) return;
          setJob(data);
          if (["completed", "partial", "failed"].includes(data.status)) {
            onDone?.(data);
            return;
          }
        }
      } catch {
        /* network blip: keep polling */
      }
      if (!cancelled) timer = setTimeout(tick, 1200);
    };
    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);
  return job;
}
