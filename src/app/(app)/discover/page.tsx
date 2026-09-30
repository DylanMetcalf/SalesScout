import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { inCompany, requireCompany } from "@/lib/tenant";
import { aiConfigured } from "@/lib/ai/core";
import { Page } from "@/components/layout/page";
import { DiscoverForm } from "@/components/discover/discover-form";
import { AiUnavailable } from "@/components/ai/ai-unavailable";
import { RunStatus } from "@/components/discover/run-status";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Discover" };

export default async function Discover({ searchParams }: { searchParams: Promise<{ mode?: string; strategy?: string; q?: string }> }) {
  const tenant = await requireCompany();
  const sp = await searchParams;
  const strategies = db.select().from(t.leadStrategies).where(inCompany(t.leadStrategies, tenant, eq(t.leadStrategies.status, "active"))).orderBy(desc(t.leadStrategies.updatedAt)).all();
  const runs = db.select().from(t.searchRuns).where(inCompany(t.searchRuns, tenant)).orderBy(desc(t.searchRuns.createdAt)).limit(30).all();
  const ai = aiConfigured();

  return (
    <Page width="narrow" className="sm:py-14">
      <h1 className="text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">Who are we looking for?</h1>
      <p className="mt-2 text-lg text-muted">Describe it in your own words. I&apos;ll show you how I understood it before I start researching.</p>
      {!ai && <AiUnavailable feature="Prospect discovery (live web research)" className="mt-6" />}
      <DiscoverForm
        className="mt-8"
        initialMode={sp.mode === "specific" ? "specific" : "discover"}
        initialStrategy={strategies.some((s) => s.id === sp.strategy) ? sp.strategy! : null}
        initialQuery={sp.q ?? ""}
        strategies={strategies.map((s) => ({ id: s.id, name: s.name, summary: [s.industries.slice(0, 2).join(", "), s.geographies.slice(0, 2).join(", ")].filter(Boolean).join(" · ") }))}
        aiConnected={ai}
      />

      <section className="mt-14" aria-labelledby="h-runs">
        <h2 id="h-runs" className="text-lg font-semibold">Previous searches</h2>
        {runs.length === 0 ? (
          <p className="mt-2 text-muted">Every discovery is saved here so you can reopen it, see what was found, and pick up where you left off.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface shadow-sm">
            {runs.map((r) => (
              <li key={r.id}>
                <Link href={`/discover/runs/${r.id}`} className="flex flex-col gap-1 px-4 py-3.5 hover:bg-surface-2/60 sm:flex-row sm:items-center sm:gap-4">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{r.title}</span>
                    <span className="block truncate text-sm text-muted">
                      {formatDate(r.createdAt)} · {r.query}
                    </span>
                  </span>
                  <RunStatus run={r} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Page>
  );
}
