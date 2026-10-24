import "server-only";
import { createJob, runInBackground, type JobProgress } from "@/lib/jobs";
import type { AiContext } from "@/lib/ai/core";
import { analyseProblem, assessVisibility, draftBrief, draftProposal, researchCompany } from "./ai";
import { auditSite } from "./site-audit";
import { getOpportunity, logActivity, touch } from "./service";

/** Each AI task an operator can start, the steps it shows, and what it saves. */
export const AI_TASKS = {
  analysis: { label: "Analysing the problem", done: "Analysis ready to review.", steps: [{ key: "analyse", label: "Reading what they told us" }] },
  research: {
    label: "Researching the company",
    done: "Company research ready to review.",
    steps: [
      { key: "research", label: "Reading their website and public sources" },
      { key: "structure", label: "Separating facts from inferences" },
    ],
  },
  brief: { label: "Drafting the solution brief", done: "Draft ready. Edit it before you use it.", steps: [{ key: "draft", label: "Writing a first draft" }] },
  proposal: { label: "Drafting the proposal", done: "Draft ready. Edit it before you send it.", steps: [{ key: "draft", label: "Writing a first draft from the brief" }] },
  visibility: {
    label: "Assessing website visibility",
    done: "Visibility assessment ready to review.",
    steps: [
      { key: "crawl", label: "Checking the website directly" },
      { key: "search", label: "Searching like a customer would, then prioritising" },
    ],
  },
} as const;
export type AiTask = keyof typeof AI_TASKS;

/** Jobs run in this process, so an in-memory map is enough to stop the same paid task running twice. */
const running = new Map<string, string>();

export function startAiTask(ctx: AiContext, opportunityId: string, task: AiTask, by: string): string {
  const lock = `${opportunityId}:${task}`;
  const already = running.get(lock);
  if (already) return already; // a second click (or a second operator) watches the same job
  const o = getOpportunity(opportunityId);
  if ((task === "visibility") && !o.website) throw new Error("Add the company's website first.");
  if (task === "proposal" && !o.brief) throw new Error("Write or draft the solution brief first; the proposal is built from it.");
  const def = AI_TASKS[task];
  const jobId = createJob(ctx, `opportunity_${task}`, [...def.steps]);
  running.set(lock, jobId);
  runInBackground(jobId, async (p) => {
    try {
      await work(p);
    } finally {
      running.delete(lock);
    }
  });
  logActivity(opportunityId, `${def.label} (started)`, by);
  return jobId;

  async function work(p: JobProgress) {
    const fresh = () => getOpportunity(opportunityId);
    switch (task) {
      case "analysis": {
        p.start("analyse");
        touch(opportunityId, { analysis: await analyseProblem(ctx, fresh()) });
        break;
      }
      case "research": {
        p.start("research");
        const research = await researchCompany(ctx, fresh());
        p.start("structure");
        touch(opportunityId, { research });
        break;
      }
      case "brief": {
        p.start("draft");
        // Never overwrite the operator's edits: an AI draft only fills empty fields.
        const draft = await draftBrief(ctx, fresh());
        const cur = fresh().brief ?? {};
        touch(opportunityId, { brief: Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, cur[k]?.trim() ? cur[k] : v])) });
        break;
      }
      case "proposal": {
        p.start("draft");
        const draft = await draftProposal(ctx, fresh());
        const cur = fresh().proposal ?? {};
        touch(opportunityId, { proposal: Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, cur[k]?.trim() ? cur[k] : v])), proposalStatus: fresh().proposalStatus ?? "draft" });
        break;
      }
      case "visibility": {
        p.start("crawl");
        const audit = await auditSite(fresh().website!);
        if (!audit.pages.length) throw new Error(`We couldn't read the website (${audit.failures[0]?.reason ?? "no pages"}), so there's nothing reliable to assess.`);
        p.start("search");
        const v = await assessVisibility(ctx, fresh(), audit);
        touch(opportunityId, { visibility: { ...v, observed: audit.observations, pagesChecked: audit.pages.map((x) => x.url), assessedAt: new Date().toISOString() } });
        break;
      }
    }
    logActivity(opportunityId, `${def.done.replace(/\.$/, "")} (AI)`, by);
    p.finish({});
  }
}
