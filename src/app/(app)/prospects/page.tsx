import Link from "next/link";
import { and, desc, eq, like, ne, or, count } from "drizzle-orm";
import { Users, Compass } from "lucide-react";
import { db, t } from "@/lib/db";
import { inCompany, requireCompany } from "@/lib/tenant";
import { toViews } from "@/lib/prospect-view";
import { Page, PageHeader } from "@/components/layout/page";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FitBadge } from "@/components/ui/fit";
import { Notice } from "@/components/ui/error-state";
import { ProspectCard } from "@/components/prospects/prospect-card";
import { ProspectsToolbar } from "@/components/prospects/prospects-toolbar";
import { FindSimilarButton } from "@/components/prospects/find-similar-button";
import { STATUS_META } from "@/lib/status";
import { relativeDay } from "@/lib/format";
import { cn } from "@/components/ui/cn";

export const metadata = { title: "Prospects" };

type Tab = "review" | "pipeline" | "aside";

export default async function Prospects({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string; similar?: string; add?: string; export?: string }> }) {
  const tenant = await requireCompany();
  const sp = await searchParams;
  const q = sp.q?.trim();
  const search = q ? or(like(t.prospects.name, `%${q}%`), like(t.prospects.industry, `%${q}%`), like(t.prospects.location, `%${q}%`)) : undefined;

  const counts = {
    review: db.select({ n: count() }).from(t.prospects).where(inCompany(t.prospects, tenant, eq(t.prospects.inCrm, false), ne(t.prospects.status, "rejected"))).get()!.n,
    pipeline: db.select({ n: count() }).from(t.prospects).where(inCompany(t.prospects, tenant, eq(t.prospects.inCrm, true), ne(t.prospects.status, "rejected"))).get()!.n,
    aside: db.select({ n: count() }).from(t.prospects).where(inCompany(t.prospects, tenant, eq(t.prospects.status, "rejected"))).get()!.n,
  };
  const similar = sp.similar === "1";
  const tab: Tab = sp.tab === "aside" ? "aside" : sp.tab === "review" ? "review" : sp.tab === "pipeline" || similar || counts.review === 0 ? "pipeline" : "review";

  const where =
    tab === "review"
      ? and(eq(t.prospects.inCrm, false), ne(t.prospects.status, "rejected"))
      : tab === "pipeline"
        ? and(eq(t.prospects.inCrm, true), ne(t.prospects.status, "rejected"))
        : eq(t.prospects.status, "rejected");
  const rows = db.select().from(t.prospects).where(inCompany(t.prospects, tenant, where, search)).orderBy(desc(t.prospects.updatedAt)).limit(200).all();
  const views = tab === "pipeline" ? [] : toViews(tenant, rows);
  const contactNames = tab === "pipeline" && rows.length
    ? db.select({ prospectId: t.contacts.prospectId, name: t.contacts.name, role: t.contacts.role }).from(t.contacts).where(inCompany(t.contacts, tenant)).all()
    : [];
  const total = counts.review + counts.pipeline + counts.aside;

  return (
    <Page>
      <PageHeader title="Prospects" description="Companies Sales Scout found for you, and the ones you're working." actions={<ProspectsToolbar openAdd={sp.add === "1"} openExport={sp.export === "1"} />} />

      {total === 0 ? (
        <div className="rounded-xl border border-border bg-surface shadow-sm">
          <EmptyState
            icon={<Users />}
            title="Your prospect list is empty."
            body="Give Sales Scout a direction and we'll start looking."
            action={<ButtonLink href="/discover" variant="primary" icon={<Compass className="size-4" />}>Discover companies</ButtonLink>}
            secondary={<ButtonLink href="/prospects?add=1" variant="ghost">Add one yourself</ButtonLink>}
          />
        </div>
      ) : (
        <>
          <nav aria-label="Prospect views" className="mb-5 flex gap-1 border-b border-border">
            {(
              [
                ["review", "To review", counts.review],
                ["pipeline", "In pipeline", counts.pipeline],
                ["aside", "Set aside", counts.aside],
              ] as const
            ).map(([key, label, n]) => (
              <Link
                key={key}
                href={`/prospects?tab=${key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                aria-current={tab === key ? "page" : undefined}
                className={cn("-mb-px flex h-10 items-center gap-2 border-b-2 px-3 text-sm font-medium", tab === key ? "border-accent text-text" : "border-transparent text-muted hover:text-text")}
              >
                {label}
                <span className={cn("rounded-full px-1.5 text-xs tabular-nums", tab === key ? "bg-accent-soft text-accent-text" : "bg-surface-3 text-muted")}>{n}</span>
              </Link>
            ))}
          </nav>

          {similar && (
            <Notice tone="accent" className="mb-5" title="Find similar companies">
              Pick a company you&apos;d like more of. Sales Scout will look for companies with a similar business, operations and location.
            </Notice>
          )}

          {rows.length === 0 ? (
            <EmptyState
              compact
              title={q ? `Nothing matches “${q}”` : tab === "review" ? "Nothing waiting for review" : tab === "aside" ? "Nothing set aside" : "No prospects in your pipeline yet"}
              body={tab === "review" ? "New discoveries land here first, so you can decide what's worth pursuing." : tab === "pipeline" ? "Keep a discovered company, or add one yourself, to start working it." : "Companies you mark as not relevant are kept here, so you can change your mind."}
              action={tab !== "aside" ? <ButtonLink href="/discover" variant="primary">Discover companies</ButtonLink> : undefined}
            />
          ) : tab === "pipeline" ? (
            <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
              <table className="w-full text-left">
                <caption className="sr-only">Prospects in your pipeline</caption>
                <thead className="hidden border-b border-border bg-surface-2/60 text-xs font-medium uppercase tracking-[0.06em] text-subtle md:table-header-group">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium">Company</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Fit</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Contact</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Next follow-up</th>
                    {similar && <th scope="col" className="px-4 py-2.5"><span className="sr-only">Actions</span></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((p) => {
                    const contact = contactNames.find((c) => c.prospectId === p.id && c.name) ?? contactNames.find((c) => c.prospectId === p.id);
                    const overdue = p.nextFollowUpAt && p.nextFollowUpAt < new Date(new Date().setHours(0, 0, 0, 0));
                    return (
                      <tr key={p.id} className="group relative flex flex-col gap-1 px-4 py-3 hover:bg-surface-2/50 md:table-row md:p-0">
                        <td className="md:px-4 md:py-3">
                          <Link href={`/prospects/${p.id}`} className="font-medium after:absolute after:inset-0 hover:underline">
                            {p.name}
                          </Link>
                          <p className="text-sm text-muted">{[p.industry, p.location].filter(Boolean).join(" · ")}</p>
                        </td>
                        <td className="md:px-4 md:py-3">{p.fit ? <FitBadge level={p.fit.company.level} /> : <span className="text-sm text-subtle">Not assessed</span>}</td>
                        <td className="text-sm md:px-4 md:py-3">
                          {contact ? (
                            <>
                              <span className={contact.name ? "font-medium" : "text-muted"}>{contact.name ?? "Role to find"}</span>
                              <span className="block text-muted">{contact.role}</span>
                            </>
                          ) : (
                            <span className="text-subtle">—</span>
                          )}
                        </td>
                        <td className="md:px-4 md:py-3">
                          <Badge tone={STATUS_META[p.status].tone} dot>{STATUS_META[p.status].label}</Badge>
                        </td>
                        <td className={cn("text-sm md:px-4 md:py-3", overdue ? "font-medium text-weak" : "text-muted")}>{p.nextFollowUpAt ? relativeDay(p.nextFollowUpAt) : "—"}</td>
                        {similar && (
                          <td className="relative z-10 md:px-4 md:py-3">
                            <FindSimilarButton prospectId={p.id} />
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {views.map((p, i) => (
                <ProspectCard key={p.id} p={p} index={i} />
              ))}
            </div>
          )}
        </>
      )}
    </Page>
  );
}
