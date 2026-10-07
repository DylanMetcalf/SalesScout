import { and, count, desc, eq, isNull, lte, ne } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { aiConfigured } from "@/lib/ai/core";
import { Sidebar } from "@/components/shell/sidebar";
import { MobileTabBar, MobileTopBar } from "@/components/shell/mobile-nav";
import { CommandPalette } from "@/components/shell/command-palette";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const tenant = await requireTenant();
  const c = tenant.company;
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const followUpsDue = c
    ? db.select({ n: count() }).from(t.followUps).where(and(eq(t.followUps.companyId, c.id), isNull(t.followUps.completedAt), lte(t.followUps.dueAt, endOfToday))).get()!.n
    : 0;
  const toReview = c
    ? db.select({ n: count() }).from(t.prospects).where(and(eq(t.prospects.companyId, c.id), eq(t.prospects.inCrm, false), ne(t.prospects.status, "rejected"))).get()!.n
    : 0;
  const prospects = c
    ? db.select({ id: t.prospects.id, name: t.prospects.name, industry: t.prospects.industry }).from(t.prospects).where(and(eq(t.prospects.companyId, c.id), ne(t.prospects.status, "rejected"))).orderBy(desc(t.prospects.updatedAt)).limit(300).all()
    : [];

  const switcher = {
    workspace: { id: tenant.workspace.id, name: tenant.workspace.name },
    workspaces: tenant.workspaces.map((w) => ({ id: w.id, name: w.name })),
    company: c ? { id: c.id, name: c.name, isDemo: c.isDemo } : null,
    companies: tenant.companies.map((co) => ({ id: co.id, name: co.name, isDemo: co.isDemo })),
  };
  const user = { name: tenant.user.name, email: tenant.user.email };

  return (
    <div className="flex min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:shadow-md">
        Skip to content
      </a>
      <Sidebar switcher={switcher} user={user} counts={{ followUpsDue, toReview }} aiConnected={aiConfigured(tenant.account.id)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar switcher={switcher} user={user} />
        {c?.isDemo && (
          <div className="theme-ink sidebar-brand border-b border-border px-5 py-2 text-center text-sm text-muted">
            You&apos;re exploring <span className="font-medium text-signal">example data</span>. Companies and people here are fictional.{" "}
            <a href="/onboarding/company" className="font-medium text-accent-text underline underline-offset-2">Set up your own company</a>
          </div>
        )}
        <main id="main" className="flex-1 pb-24 md:pb-0">{children}</main>
      </div>
      <MobileTabBar />
      <CommandPalette prospects={prospects} companies={switcher.companies} />
    </div>
  );
}
