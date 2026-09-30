import { redirect } from "next/navigation";
import { requireCompany } from "@/lib/tenant";
import { getFacts } from "@/lib/services/brain";
import { db, t } from "@/lib/db";
import { inCompany } from "@/lib/tenant";
import { BrainEditor } from "@/components/company/brain-editor";
import { KnowledgeLegend } from "@/components/ui/knowledge";
import { Notice } from "@/components/ui/error-state";
import { aiConfigured } from "@/lib/ai/core";
import { Prompt, StepDots } from "../steps";
import { ApproveBrain } from "./approve";

export const metadata = { title: "Here's what I understand" };

export default async function Understand() {
  const tenant = await requireCompany();
  if (tenant.company.isDemo) redirect("/home");
  const facts = getFacts(tenant);
  const sources = db.select({ id: t.sources.id, label: t.sources.label }).from(t.sources).where(inCompany(t.sources, tenant)).all();
  const known = facts.filter((f) => f.knowledge !== "unknown");
  return (
    <div className="-mx-5 sm:mx-0">
      <div className="px-5 sm:px-0">
        <StepDots current={6} />
        <Prompt title="Here's what I understand.">
          {known.length
            ? "Check this over. Confirm what's right, fix what isn't, and fill any gaps. You're always in control of this."
            : "I couldn't learn much from what's been shared yet. Add a few details below — they're the foundation for everything else."}
        </Prompt>
      </div>
      {tenant.company.summary && (
        <blockquote className="mb-6 border-l-2 border-accent pl-4 text-lg leading-8 text-text/90">{tenant.company.summary}</blockquote>
      )}
      {!aiConfigured() && (
        <Notice tone="moderate" className="mb-6" title="Basic analysis only">
          AI isn&apos;t connected, so I only captured what your sources state directly. Add the rest yourself — or connect AI later and re-analyse.
        </Notice>
      )}
      <details className="mb-6 rounded-lg border border-border bg-surface px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium">What do the labels mean?</summary>
        <KnowledgeLegend className="mt-3" />
      </details>
      <BrainEditor
        facts={facts.map((f) => ({ id: f.id, section: f.section, field: f.field, value: f.value, knowledge: f.knowledge, rationale: f.rationale, sourceIds: f.sourceIds, origin: f.origin }))}
        sourceLabels={Object.fromEntries(sources.map((s) => [s.id, s.label]))}
      />
      <ApproveBrain />
    </div>
  );
}
