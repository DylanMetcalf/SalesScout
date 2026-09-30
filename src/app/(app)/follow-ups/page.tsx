import { and, asc, desc, eq, isNotNull, isNull, ne } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { inCompany, requireCompany } from "@/lib/tenant";
import { Page, PageHeader } from "@/components/layout/page";
import { FollowUpsView } from "@/components/follow-ups/follow-ups-view";

export const metadata = { title: "Follow-ups" };

export default async function FollowUps({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const tenant = await requireCompany();
  const open = db
    .select({ f: t.followUps, name: t.prospects.name, status: t.prospects.status })
    .from(t.followUps)
    .innerJoin(t.prospects, eq(t.prospects.id, t.followUps.prospectId))
    .where(inCompany(t.followUps, tenant, isNull(t.followUps.completedAt)))
    .orderBy(asc(t.followUps.dueAt))
    .all();
  const done = db
    .select({ f: t.followUps, name: t.prospects.name, status: t.prospects.status })
    .from(t.followUps)
    .innerJoin(t.prospects, eq(t.prospects.id, t.followUps.prospectId))
    .where(inCompany(t.followUps, tenant, isNotNull(t.followUps.completedAt)))
    .orderBy(desc(t.followUps.completedAt))
    .limit(30)
    .all();
  const prospects = db.select({ id: t.prospects.id, name: t.prospects.name }).from(t.prospects).where(inCompany(t.prospects, tenant, and(eq(t.prospects.inCrm, true), ne(t.prospects.status, "rejected")))).orderBy(asc(t.prospects.name)).all();
  const map = (r: (typeof open)[number]) => ({ id: r.f.id, title: r.f.title, notes: r.f.notes, dueAt: r.f.dueAt.getTime(), completedAt: r.f.completedAt?.getTime() ?? null, prospectId: r.f.prospectId, prospectName: r.name, status: r.status });

  return (
    <Page width="narrow">
      <PageHeader title="Follow-ups" description="Every follow-up links straight to its prospect." />
      <FollowUpsView open={open.map(map)} done={done.map(map)} prospects={prospects} startNew={(await searchParams).new === "1"} />
    </Page>
  );
}
