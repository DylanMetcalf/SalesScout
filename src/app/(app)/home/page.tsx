import Link from "next/link";
import { and, asc, count, desc, eq, inArray, isNull, lte, ne } from "drizzle-orm";
import { ArrowRight, CalendarClock, CircleAlert, Inbox, MessageSquareReply, Handshake, Layers, UserRound } from "lucide-react";
import { db, t } from "@/lib/db";
import { inCompany, requireCompany } from "@/lib/tenant";
import { pendingSuggestions } from "@/lib/services/learning";
import { aiConfigured } from "@/lib/ai/core";
import { Page } from "@/components/layout/page";
import { SuggestionCard } from "@/components/prospects/suggestion-card";
import { AskBox } from "@/components/home/ask-box";
import { Needle } from "@/components/ui/needle";
import { cn } from "@/components/ui/cn";
import { STATUS_META, PIPELINE_STAGES } from "@/lib/status";
import { relativeDay } from "@/lib/format";

export const metadata = { title: "Home" };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

type TodayItem = { key: string; icon: typeof Inbox; title: string; context: string; href: string; when?: string; urgent?: boolean };

function listJoin(parts: string[]) {
  return parts.length <= 1 ? parts.join("") : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

export default async function Home() {
  const tenant = await requireCompany();
  const c = tenant.company;
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
  const endOfToday = new Date(new Date().setHours(23, 59, 59, 999));

  const due = db
    .select({ f: t.followUps, name: t.prospects.name })
    .from(t.followUps)
    .innerJoin(t.prospects, eq(t.prospects.id, t.followUps.prospectId))
    .where(inCompany(t.followUps, tenant, isNull(t.followUps.completedAt), lte(t.followUps.dueAt, endOfToday)))
    .orderBy(asc(t.followUps.dueAt))
    .all();
  const replies = db.select().from(t.prospects).where(inCompany(t.prospects, tenant, eq(t.prospects.status, "replied"))).orderBy(desc(t.prospects.updatedAt)).all();
  const toReview = db
    .select({ id: t.prospects.id, name: t.prospects.name, fit: t.prospects.fit })
    .from(t.prospects)
    .where(inCompany(t.prospects, tenant, eq(t.prospects.inCrm, false), ne(t.prospects.status, "rejected")))
    .orderBy(desc(t.prospects.createdAt))
    .all();
  const active = db
    .select()
    .from(t.prospects)
    .where(inCompany(t.prospects, tenant, inArray(t.prospects.status, ["meeting", "opportunity"])))
    .orderBy(desc(t.prospects.updatedAt))
    .limit(4)
    .all();
  const stageCounts = db
    .select({ status: t.prospects.status, n: count() })
    .from(t.prospects)
    .where(inCompany(t.prospects, tenant, eq(t.prospects.inCrm, true)))
    .groupBy(t.prospects.status)
    .all();
  const recentRuns = db.select().from(t.searchRuns).where(inCompany(t.searchRuns, tenant)).orderBy(desc(t.searchRuns.createdAt)).limit(3).all();
  const suggestions = pendingSuggestions(tenant).slice(0, 1);
  const strategies = db.select({ name: t.leadStrategies.name, industries: t.leadStrategies.industries, geographies: t.leadStrategies.geographies }).from(t.leadStrategies).where(inCompany(t.leadStrategies, tenant, eq(t.leadStrategies.status, "active"))).limit(3).all();

  // One prioritised list: what needs you today, most urgent first.
  const today: TodayItem[] = [
    ...due.map(({ f, name }) => ({
      key: f.id,
      icon: CalendarClock,
      title: f.title,
      context: name,
      href: `/prospects/${f.prospectId}?tab=activity`,
      when: relativeDay(f.dueAt),
      urgent: f.dueAt < startOfToday,
    })),
    ...replies.map((p) => ({ key: `r-${p.id}`, icon: MessageSquareReply, title: `Reply to ${p.name}`, context: "They got back to you", href: `/prospects/${p.id}` })),
    ...(toReview.length
      ? [{
          key: "review",
          icon: Inbox,
          title: `Review ${toReview.length} new ${toReview.length === 1 ? "company" : "companies"}`,
          context: toReview.slice(0, 3).map((p) => p.name).join(", ") + (toReview.length > 3 ? "…" : ""),
          href: "/prospects?tab=review",
        }]
      : []),
  ];

  const followCount = due.length;
  const parts = [
    followCount && `${followCount} follow-up${followCount === 1 ? "" : "s"}`,
    replies.length && `${replies.length === 1 ? "a reply" : `${replies.length} replies`} to answer`,
    toReview.length && `${toReview.length} new ${toReview.length === 1 ? "company" : "companies"} to look at`,
  ].filter(Boolean) as string[];
  const overdue = due.filter(({ f }) => f.dueAt < startOfToday).length;
  const summary = parts.length
    ? `You have ${listJoin(parts)}${overdue ? ` — ${overdue} overdue` : ""}.`
    : "You're all caught up. A good moment to find some new companies.";

  const brainNeedsWork = c.brainStatus === "empty" || c.brainStatus === "failed";
  const brainNeedsReview = c.brainStatus === "review";
  const examples = strategies.length
    ? strategies.slice(0, 2).map((s) => `${s.industries[0] ?? s.name} companies in ${s.geographies[0] ?? "my area"} that could need what we sell`)
    : ["Companies in my area that could need what we sell"];
  const pipeline = PIPELINE_STAGES.map((s) => ({
    status: s,
    n: stageCounts.filter((x) => x.status === s || (s === "new" && x.status === "reviewed")).reduce((a, x) => a + x.n, 0),
  })).filter((x) => !["won", "lost"].includes(x.status));
  const pipelineTotal = pipeline.reduce((a, x) => a + x.n, 0);
  const dateLine = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <Page className="sm:py-12">
      <div className="theme-ink brand-hero -mx-1 rounded-2xl px-6 py-7 shadow-lg sm:px-9 sm:py-9 animate-rise">
      <header className="max-w-3xl">
        <p className="text-sm font-medium text-accent-text">{dateLine}</p>
        <h1 className="mt-1 text-[32px] leading-tight sm:text-[40px]">
          {greeting()}, {tenant.user.name.split(" ")[0]}.
        </h1>
        <p className="mt-2 text-lg text-muted">{summary}</p>
      </header>
        <div className="mt-7 max-w-3xl">
          <AskBox examples={examples} aiConnected={aiConfigured(tenant.account.id)} />
        </div>
      </div>

      {(brainNeedsWork || brainNeedsReview) && (
        <Link
          href={brainNeedsWork ? "/onboarding/company?step=website" : "/company"}
          className="mt-6 flex max-w-3xl items-center gap-3 rounded-lg border border-signal/30 bg-signal-soft/60 px-4 py-3 transition-colors hover:border-signal/50"
        >
          <CircleAlert className="size-4 shrink-0 text-signal-text" aria-hidden />
          <span className="flex-1 text-sm">
            <span className="font-medium">{brainNeedsWork ? "I don't know much about your business yet." : "I've updated what I know about your business."}</span>{" "}
            <span className="text-muted">{brainNeedsWork ? "Add your website or a description so my suggestions fit." : "Have a quick look before we go searching."}</span>
          </span>
          <ArrowRight className="size-4 text-muted" aria-hidden />
        </Link>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-10">
          <section aria-labelledby="h-today">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 id="h-today" className="text-xl">Today</h2>
              <Link href="/follow-ups" className="text-sm text-muted hover:text-text">All follow-ups</Link>
            </div>
            {today.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-strong px-5 py-8 text-center">
                <p className="font-medium">Nothing needs you right now.</p>
                <p className="mt-1 text-sm text-muted">Follow-ups, replies and new companies to review will show up here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
                {today.slice(0, 7).map((item) => (
                  <li key={item.key}>
                    <Link href={item.href} className="group flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-surface-2/70">
                      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", item.urgent ? "bg-weak-soft text-weak" : "bg-surface-2 text-muted group-hover:text-text")}>
                        <item.icon className="size-[18px]" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{item.title}</span>
                        <span className="block truncate text-sm text-muted">{item.context}</span>
                      </span>
                      {item.when && <span className={cn("shrink-0 text-sm", item.urgent ? "font-medium text-weak" : "text-muted")}>{item.when}</span>}
                      <ArrowRight className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {suggestions.map((s) => (
            <section key={s.id} aria-label="Sales Scout noticed">
              <SuggestionCard s={{ id: s.id, title: s.title, body: s.body }} />
            </section>
          ))}
        </div>

        <aside className="flex flex-col gap-8 text-sm" aria-label="At a glance">
          <section>
            <div className="mb-2.5 flex items-baseline justify-between">
              <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-subtle">Pipeline</h2>
              <Link href="/pipeline" className="text-muted hover:text-text">Open</Link>
            </div>
            {pipelineTotal === 0 ? (
              <p className="text-muted">Companies you keep will be tracked here.</p>
            ) : (
              <Link href="/pipeline" className="block rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-md">
                <div className="flex h-2 overflow-hidden rounded-full bg-surface-3" aria-hidden>
                  {pipeline.filter((x) => x.n).map((x, i) => (
                    <span key={x.status} style={{ flexGrow: x.n, opacity: 0.35 + (i / pipeline.length) * 0.65 }} className="bg-accent" />
                  ))}
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-y-2">
                  {pipeline.map((x) => (
                    <div key={x.status}>
                      <dt className="text-xs text-subtle">{STATUS_META[x.status].label}</dt>
                      <dd className="font-semibold tabular-nums">{x.n}</dd>
                    </div>
                  ))}
                </dl>
              </Link>
            )}
          </section>

          {active.length > 0 && (
            <section>
              <h2 className="mb-2.5 font-sans text-xs font-semibold uppercase tracking-[0.08em] text-subtle">In motion</h2>
              <ul className="flex flex-col gap-1">
                {active.map((p) => (
                  <li key={p.id}>
                    <Link href={`/prospects/${p.id}`} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 -mx-2 hover:bg-surface-2">
                      <Handshake className="size-4 text-subtle" aria-hidden />
                      <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                      <span className="text-xs text-muted">{STATUS_META[p.status].label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <div className="mb-2.5 flex items-baseline justify-between">
              <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-subtle">Recent searches</h2>
              <Link href="/discover" className="text-muted hover:text-text">All</Link>
            </div>
            {recentRuns.length === 0 ? (
              <p className="text-muted">Your searches are saved here so you can pick them up again.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {recentRuns.map((r) => (
                  <li key={r.id}>
                    <Link href={`/discover/runs/${r.id}`} className="-mx-2 flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-surface-2">
                      <Needle className="size-4 text-subtle" />
                      <span className="min-w-0 flex-1 truncate">{r.title}</span>
                      <span className="text-xs tabular-nums text-muted">{r.status === "running" ? "…" : r.relevant}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-1">
            <h2 className="mb-1.5 font-sans text-xs font-semibold uppercase tracking-[0.08em] text-subtle">Other ways in</h2>
            <Link href="/discover?mode=specific" className="-mx-2 flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-surface-2">
              <UserRound className="size-4 text-subtle" aria-hidden /> Find specific people
            </Link>
            <Link href="/prospects?similar=1" className="-mx-2 flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-surface-2">
              <Layers className="size-4 text-subtle" aria-hidden /> Find companies like one you know
            </Link>
          </section>
        </aside>
      </div>
    </Page>
  );
}
