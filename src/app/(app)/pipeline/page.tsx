import { and, desc, eq, ne } from "drizzle-orm";
import { Kanban } from "lucide-react";
import { db, t } from "@/lib/db";
import { inCompany, requireCompany } from "@/lib/tenant";
import { Page, PageHeader } from "@/components/layout/page";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { PipelineBoard } from "@/components/pipeline/board";

export const metadata = { title: "Pipeline" };

export default async function Pipeline() {
  const tenant = await requireCompany();
  const rows = db
    .select()
    .from(t.prospects)
    .where(inCompany(t.prospects, tenant, and(eq(t.prospects.inCrm, true), ne(t.prospects.status, "rejected"))))
    .orderBy(desc(t.prospects.updatedAt))
    .all();
  const contacts = db.select({ prospectId: t.contacts.prospectId, name: t.contacts.name }).from(t.contacts).where(inCompany(t.contacts, tenant)).all();

  return (
    <Page width="wide">
      <PageHeader title="Pipeline" description="Drag a company to move it forward. Keep it simple — the detail lives on each prospect." actions={<ButtonLink href="/prospects?tab=pipeline">List view</ButtonLink>} />
      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface shadow-sm">
          <EmptyState
            icon={<Kanban />}
            title="Your pipeline is empty."
            body="When you keep a company you've discovered, it lands here so you can follow it from first contact to a decision."
            action={<ButtonLink href="/prospects" variant="primary">Review prospects</ButtonLink>}
            secondary={<ButtonLink href="/discover" variant="ghost">Discover companies</ButtonLink>}
          />
        </div>
      ) : (
        <PipelineBoard
          cards={rows.map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status === "reviewed" ? "new" : p.status,
            realStatus: p.status,
            contact: contacts.find((c) => c.prospectId === p.id && c.name)?.name ?? null,
            nextFollowUpAt: p.nextFollowUpAt?.getTime() ?? null,
            fit: p.fit?.company.level ?? null,
          }))}
        />
      )}
    </Page>
  );
}
