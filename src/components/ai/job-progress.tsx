"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/ui/logo";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { ErrorState } from "@/components/ui/error-state";
import { useJob, type JobState } from "@/hooks/use-job";
import type { JobStep } from "@/lib/db/schema";

/**
 * Live view of a long-running AI job. Shows each real step as it happens
 * and, on failure, an honest explanation with next actions.
 */
export function JobProgress({
  jobId,
  title,
  doneTitle,
  initialSteps,
  onDone,
  failureActions,
}: {
  jobId: string;
  title: ReactNode;
  /** Shown once the job finishes, e.g. "I've got a clearer picture of your business." */
  doneTitle?: ReactNode;
  initialSteps: { key: string; label: string }[];
  onDone?: (job: JobState) => void;
  failureActions?: (job: JobState) => ReactNode;
}) {
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);
  const job = useJob(jobId, (j) => doneRef.current?.(j));
  const steps: JobStep[] = job?.steps ?? initialSteps.map((s, i) => ({ ...s, status: i === 0 ? "running" : "waiting" }));
  const running = !job || job.status === "running" || job.status === "queued";

  return (
    <div className="theme-ink brand-hero rounded-xl p-5 shadow-lg sm:p-6 animate-rise">
      <div className="mb-4 flex items-center gap-3">
        <LogoMark size={30} working={running} label={running ? "Working" : "Done"} />
        <p className="font-medium" aria-live="polite">{!running && job?.status !== "failed" && doneTitle ? doneTitle : title}</p>
      </div>
      <ProgressSteps steps={steps} />
      {job?.status === "failed" && (
        <ErrorState
          className="mt-4"
          title="We couldn't finish this."
          body={job.error ?? "Something went wrong along the way. Nothing was made up — only what finished is saved."}
          actions={failureActions?.(job)}
        />
      )}
    </div>
  );
}
