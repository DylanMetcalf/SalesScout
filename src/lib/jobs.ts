import "server-only";
import { eq } from "drizzle-orm";
import { db, t } from "@/lib/db";
import type { JobStep } from "@/lib/db/schema";
import { newId } from "@/lib/ids";

export type JobScope = { accountId: string; workspaceId: string; companyId: string | null };

/**
 * Background jobs with persisted, human-readable progress steps. Long AI
 * operations run detached from the request; the UI polls /api/jobs/[id].
 */
export function createJob(scope: JobScope, type: string, steps: { key: string; label: string }[]): string {
  const id = newId("job");
  db.insert(t.jobs)
    .values({ id, ...scope, type, status: "queued", steps: steps.map((s) => ({ ...s, status: "waiting" as const })) })
    .run();
  return id;
}

export class JobProgress {
  constructor(readonly id: string) {}

  private read() {
    return db.select().from(t.jobs).where(eq(t.jobs.id, this.id)).get()!;
  }

  private write(patch: Partial<typeof t.jobs.$inferInsert>) {
    db.update(t.jobs).set({ ...patch, updatedAt: new Date() }).where(eq(t.jobs.id, this.id)).run();
  }

  step(key: string, status: JobStep["status"], detail?: string) {
    const job = this.read();
    const steps = job.steps.map((s) => (s.key === key ? { ...s, status, detail: detail ?? s.detail } : s));
    this.write({ steps, status: "running" });
  }

  /** Marks `key` running and everything before it done. */
  start(key: string, detail?: string) {
    const job = this.read();
    const idx = job.steps.findIndex((s) => s.key === key);
    const steps = job.steps.map((s, i) =>
      i < idx && (s.status === "waiting" || s.status === "running") ? { ...s, status: "done" as const } : i === idx ? { ...s, status: "running" as const, detail } : s,
    );
    this.write({ steps, status: "running" });
  }

  finish(result: Record<string, unknown>, partial = false) {
    const job = this.read();
    const steps = job.steps.map((s) => (s.status === "running" || s.status === "waiting" ? { ...s, status: "done" as const } : s));
    this.write({ steps, status: partial ? "partial" : "completed", result });
  }

  fail(error: string) {
    const job = this.read();
    const steps = job.steps.map((s) =>
      s.status === "running" ? { ...s, status: "failed" as const, detail: error } : s.status === "waiting" ? { ...s, status: "skipped" as const } : s,
    );
    this.write({ steps, status: "failed", error });
  }
}

/** Runs work in the background of the Node process, recording failure on the job. */
export function runInBackground(jobId: string, work: (p: JobProgress) => Promise<void>) {
  const progress = new JobProgress(jobId);
  setTimeout(() => {
    work(progress).catch((err) => {
      console.error(`[job ${jobId}]`, err);
      progress.fail(err instanceof Error ? err.message : "Something went wrong.");
    });
  }, 0);
}
