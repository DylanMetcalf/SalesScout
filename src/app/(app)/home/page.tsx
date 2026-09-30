import Link from "next/link";
import { and, asc, count, desc, eq, gte, isNull, lte, ne } from "drizzle-orm";
import { ArrowRight, Compass, Layers, UserRound, Sparkles, CalendarCheck, CircleAlert } from "lucide-react";
import { db, t } from "@/lib/db";
import { inCompany, requireCompany } from "@/lib/tenant";
import { pendingSuggestions } from "@/lib/services/learning";
import { Page } from "@/components/layout/page";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { SuggestionCard } from "@/components/prospects/suggestion-card";
import { relativeDay } from "@/lib/format";

export const metadata = { title: "Home" };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default async function Home() {
  const tenant = await requireCompany();
  const c = tenant.company;
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const n = (where: ReturnType<typeof inCompany>, table: typeof t.prospects | typeof t.followUps = t.prospects) => db.select({ n: count() }).from(table).where(where).get()!.n;
  const followUpsToday = n(inCompany(t.followUps, tenant, isNull(t.followUps.completedAt), lte(t.followUps.dueAt, endOfToday)), t.followUps);
  const newProspects = n(inCompany(t.prospects, tenant, eq(t.prospects.inCrm, false), ne(t.prospects.status, "rejected")));
  const replies = n(inCompany(t.prospects, tenant, eq(t.prospects.status, "replied")));
  const opportunities = n(inCompany(t.prospects, tenant, eq(t.prospects.status, "opportunity")));

  const dueList = db
    .select({ f: t.followUps, name: t.prospects.name })
    .from(t.followUps)
    .innerJoin(t.prospects, eq(t.prospects.id, t.followUps.prospectId))
    .where(inCompany(t.followUps, tenant, isNull(t.followUps.completedAt), lte(t.followUps.dueAt, endOfToday)))
    .orderBy(asc(t.followUps.dueAt))
    .limit(5)
    .all();
  const recentRuns = db.select().from(t.searchRuns).where(inCompany(t.searchRuns, tenant, gte(t.searchRuns.createdAt, new Date(Date.now() - 60 * 86_400_000)))).orderBy(desc(t.searchRuns.createdAt)).limit(3).all();
  const suggestions = pendingSuggestions(tenant).slice(0, 2);
  const brainNeedsWork = c.brainStatus === "empty" || c.brainStatus === "failed";
  const brainNeedsReview = c.brainStatus === "review";

  const actions = [
    { href: "/discover", icon: Compass, title: "Discover companies", body: "Find companies that could need what we sell." },
    { href: "/discover?mode=specific", icon: UserRound, title: "Find specific people", body: "I know who I'm looking for." },
    { href: "/prospects?similar=1", icon: Layers, title: "Find similar", body: "Show me companies like this one." },
  ];
  const stats = [
    { n: followUpsToday, label: followUpsToday === 1 ? "follow-up today" : "follow-ups today", href: "/follow-ups" },
    { n: newProspects, label: newProspects === 1 ? "new prospect" : "new prospects", href: "/prospects" },
    { n: replies, label: replies === 1 ? "reply" : "replies", href: "/pipeline" },
    { n: opportunities, label: opportunities === 1 ? "opportunity" : "opportunities", href: "/pipeline" },
  ];

  return (
    <Page width="narrow" className="sm:py-14">
      <p className="text-muted animate-rise">
        {greeting()}, {tenant.user.name.split(" ")[0]}.
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-[-0.02em] sm:text-4xl animate-rise [animation-delay:40ms]">What are we looking for?</h1>

      {(brainNeedsWork || brainNeedsReview) && (
        <Link
          href={brainNeedsWork ? "/onboarding/company?step=website" : "/company"}
          className="mt-6 flex items-center gap-3 rounded-lg border border-moderate/25 bg-moderate-soft/50 px-4 py-3 hover:border-moderate/40"
        >
          <CircleAlert className="size-4 shrink-0 text-moderate" aria-hidden />
          <span className="flex-1 text-sm">
            <span className="font-medium">{brainNeedsWork ? "Sales Scout doesn't know much about your business yet." : "Your Company Brain is waiting for your review."}</span>{" "}
            <span className="text-muted">{brainNeedsWork ? "Add your website or a description so suggestions are relevant." : "Confirm what's right before we go looking."}</span>
          </span>
          <ArrowRight className="size-4 text-muted" aria-hidden />
        </Link>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {actions.map(({ href, icon: Icon, title, body }, i) => (
          <Link
            key={href}
            href={href}
            style={{ animationDelay: `${80 + i * 40}ms` }}
            className="group flex flex-col rounded-xl border border-border bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md animate-rise"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="mt-4 font-semibold">{title}</span>
            <span className="mt-1 text-sm text-muted">{body}</span>
            <ArrowRight className="mt-4 size-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden />
          </Link>
        ))}
      </div>

      <nav aria-label="Activity" className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-y border-border py-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group flex items-baseline gap-1.5 text-sm">
            <span className="text-lg font-semibold tabular-nums text-text">{s.n}</span>
            <span className="text-muted group-hover:text-text">{s.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-8 flex flex-col gap-8">
        {suggestions.length > 0 && (
          <section aria-labelledby="h-suggestions">
            <h2 id="h-suggestions" className="mb-3 flex items-center gap-2 text-sm font-medium text-muted">
              <Sparkles className="size-4 text-violet" aria-hidden /> Sales Scout noticed
            </h2>
            <div className="flex flex-col gap-2">
              {suggestions.map((s) => (
                <SuggestionCard key={s.id} s={{ id: s.id, title: s.title, body: s.body }} />
              ))}
            </div>
          </section>
        )}

        {dueList.length > 0 && (
          <section aria-labelledby="h-today">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="h-today" className="flex items-center gap-2 text-sm font-medium text-muted">
                <CalendarCheck className="size-4 text-moderate" aria-hidden /> Due today
              </h2>
              <Link href="/follow-ups" className="text-sm text-muted hover:text-text">All follow-ups</Link>
            </div>
            <Card className="divide-y divide-border">
              {dueList.map(({ f, name }) => {
                const overdue = f.dueAt < new Date(new Date().setHours(0, 0, 0, 0));
                return (
                  <Link key={f.id} href={`/prospects/${f.prospectId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2/60">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{f.title}</span>
                      <span className="block truncate text-sm text-muted">{name}</span>
                    </span>
                    <span className={overdue ? "text-sm font-medium text-weak" : "text-sm text-muted"}>{relativeDay(f.dueAt)}</span>
                  </Link>
                );
              })}
            </Card>
          </section>
        )}

        {recentRuns.length > 0 ? (
          <section aria-labelledby="h-runs">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="h-runs" className="text-sm font-medium text-muted">Recent searches</h2>
              <Link href="/discover" className="text-sm text-muted hover:text-text">All searches</Link>
            </div>
            <Card className="divide-y divide-border">
              {recentRuns.map((r) => (
                <Link key={r.id} href={`/discover/runs/${r.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2/60">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{r.title}</span>
                    <span className="block truncate text-sm text-muted">{r.query}</span>
                  </span>
                  <span className="shrink-0 text-sm text-muted">
                    {r.status === "completed" || r.status === "partial" ? `${r.relevant} relevant` : r.status === "running" ? "Running…" : r.status === "failed" ? "Didn't finish" : "Not run yet"}
                  </span>
                </Link>
              ))}
            </Card>
          </section>
        ) : (
          <Card className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="font-medium">Your first search is one sentence away.</p>
              <p className="text-sm text-muted">Tell Sales Scout who you&apos;re looking for, or let it suggest where to start.</p>
            </div>
            <ButtonLink href="/discover" variant="primary">Start discovering</ButtonLink>
          </Card>
        )}
      </div>
    </Page>
  );
}
