import { notFound } from "next/navigation";
import { and, asc, desc, eq } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { inCompany, requireCompany } from "@/lib/tenant";
import { aiConfigured } from "@/lib/ai/core";
import { toViews } from "@/lib/prospect-view";
import { draftsFor } from "@/lib/services/workflow";
import { ProspectDetail } from "@/components/prospects/prospect-detail";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const tenant = await requireCompany();
  const p = db.select({ name: t.prospects.name }).from(t.prospects).where(inCompany(t.prospects, tenant, eq(t.prospects.id, (await params).id))).get();
  return { title: p?.name ?? "Prospect" };
}

export default async function ProspectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ job?: string; tab?: string }> }) {
  const tenant = await requireCompany();
  const { id } = await params;
  const sp = await searchParams;
  const row = db.select().from(t.prospects).where(inCompany(t.prospects, tenant, eq(t.prospects.id, id))).get();
  if (!row) notFound();
  const [view] = toViews(tenant, [row]);
  const contacts = db.select().from(t.contacts).where(inCompany(t.contacts, tenant, eq(t.contacts.prospectId, id))).orderBy(asc(t.contacts.createdAt)).all();
  const activities = db.select().from(t.activities).where(inCompany(t.activities, tenant, eq(t.activities.prospectId, id))).orderBy(desc(t.activities.createdAt)).all();
  const followUps = db.select().from(t.followUps).where(inCompany(t.followUps, tenant, eq(t.followUps.prospectId, id))).orderBy(asc(t.followUps.dueAt)).all();
  const run = row.searchRunId ? db.select({ id: t.searchRuns.id, title: t.searchRuns.title }).from(t.searchRuns).where(inCompany(t.searchRuns, tenant, eq(t.searchRuns.id, row.searchRunId))).get() : undefined;
  const strategy = row.strategyId ? db.select({ name: t.leadStrategies.name }).from(t.leadStrategies).where(inCompany(t.leadStrategies, tenant, eq(t.leadStrategies.id, row.strategyId))).get() : undefined;
  const audit = db.select().from(t.auditLog).where(and(eq(t.auditLog.companyId, tenant.company.id), eq(t.auditLog.entityType, "prospect"), eq(t.auditLog.entityId, id))).orderBy(desc(t.auditLog.createdAt)).all();
  const pendingJob = sp.job ? db.select({ id: t.jobs.id }).from(t.jobs).where(and(eq(t.jobs.id, sp.job), eq(t.jobs.companyId, tenant.company.id))).get() : undefined;

  return (
    <ProspectDetail
      p={view}
      extra={{
        domain: row.domain,
        recentActivity: row.recentActivity,
        lastContactAt: row.lastContactAt?.getTime() ?? null,
        nextFollowUpAt: row.nextFollowUpAt?.getTime() ?? null,
        createdAt: row.createdAt.getTime(),
        runTitle: run?.title ?? null,
        runId: run?.id ?? null,
        strategyName: strategy?.name ?? null,
      }}
      contacts={contacts.map((c) => ({ id: c.id, name: c.name, role: c.role, email: c.email, phone: c.phone, profileUrl: c.profileUrl, relevance: c.relevance, sourceUrl: c.sourceUrl, knowledge: c.knowledge, origin: c.origin }))}
      activities={activities.map((a) => ({ id: a.id, type: a.type, title: a.title, body: a.body, createdAt: a.createdAt.getTime() }))}
      followUps={followUps.map((f) => ({ id: f.id, title: f.title, notes: f.notes, dueAt: f.dueAt.getTime(), completedAt: f.completedAt?.getTime() ?? null }))}
      drafts={draftsFor(tenant, id).map((d) => ({ id: d.id, channel: d.channel, subject: d.subject, body: d.body, status: d.status, generatedBy: d.generatedBy, contactId: d.contactId, createdAt: d.createdAt.getTime() }))}
      audit={audit.map((a) => ({ id: a.id, summary: a.summary, source: a.source, createdAt: a.createdAt.getTime() }))}
      aiConnected={aiConfigured()}
      jobId={pendingJob?.id ?? null}
      initialTab={sp.tab}
      sender={{ name: tenant.user.name, company: tenant.company.name }}
    />
  );
}
