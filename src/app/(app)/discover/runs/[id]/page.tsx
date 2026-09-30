import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db, t } from "@/lib/db";
import { inCompany, requireCompany } from "@/lib/tenant";
import { aiConfigured } from "@/lib/ai/core";
import { prospectsForRun } from "@/lib/services/discovery";
import { toViews } from "@/lib/prospect-view";
import { Page } from "@/components/layout/page";
import { RunView } from "@/components/discover/run-view";
import { formatDate } from "@/lib/format";

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const tenant = await requireCompany();
  const { id } = await params;
  const run = db.select().from(t.searchRuns).where(inCompany(t.searchRuns, tenant, eq(t.searchRuns.id, id))).get();
  if (!run) notFound();
  const prospects = toViews(tenant, prospectsForRun(tenant, run.id));
  const strategy = run.strategyId ? db.select({ name: t.leadStrategies.name }).from(t.leadStrategies).where(inCompany(t.leadStrategies, tenant, eq(t.leadStrategies.id, run.strategyId))).get() : undefined;

  return (
    <Page width="narrow">
      <Link href="/discover" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <ArrowLeft className="size-4" aria-hidden /> Discover
      </Link>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-[-0.015em]">{run.title}</h1>
        <p className="mt-1 text-muted">
          {formatDate(run.createdAt)}
          {strategy && <> · Strategy: {strategy.name}</>} · &ldquo;{run.query}&rdquo;
        </p>
      </header>
      <RunView
        run={{
          id: run.id, status: run.status, interpretation: run.interpretation, jobId: run.jobId, error: run.error,
          requested: run.requested, discovered: run.discovered, duplicates: run.duplicates, relevant: run.relevant, rejected: run.rejected, mode: run.mode,
        }}
        prospects={prospects}
        aiConnected={aiConfigured(tenant.account.id)}
      />
    </Page>
  );
}
