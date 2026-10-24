import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, Waypoints as RouteIcon } from "lucide-react";
import { accessByToken, bookingLink, recordView } from "@/lib/opportunities/briefings";
import type { Briefing } from "@/lib/opportunities/types";
import { SITE } from "@/content/site";
import { Logo, LogoMark } from "@/components/ui/logo";
import { BriefingDocument, DiscussCta, SECTIONS } from "@/components/briefing/document";
import { CallRequestButton, RefreshWhilePreparing } from "@/components/briefing/client";

// Generic title: nothing about the customer or their problem in the tab, history or any share preview.
export const metadata: Metadata = { title: "Your briefing", robots: { index: false, follow: false, nocache: true } };
export const dynamic = "force-dynamic";

const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

function Shell({ children, reference }: { children: React.ReactNode; reference?: string }) {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" aria-label={`${SITE.name} home`}><Logo /></Link>
          {reference && <span className="caption-mono ml-auto hidden text-subtle sm:inline">Briefing {reference}</span>}
        </div>
      </header>
      {children}
    </div>
  );
}

function Message({ icon: Icon, title, children }: { icon: typeof Clock; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-20 sm:px-6 sm:py-28">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-text" aria-hidden><Icon className="size-6" /></span>
      <h1 className="mt-6 text-[36px] leading-[1.05] tracking-[-0.03em] sm:text-[48px]">{title}</h1>
      <div className="mt-5 flex flex-col gap-4 text-lg leading-8 text-muted">{children}</div>
    </main>
  );
}

const Email = () => <a href={`mailto:${SITE.contactEmail}`} className="font-medium text-accent-text underline-offset-4 hover:underline">{SITE.contactEmail}</a>;

export default async function BriefingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const a = accessByToken(token);

  if (a.state === "unavailable") {
    return (
      <Shell>
        <Message icon={Mail} title={<>This link is <span className="accent-serif text-signal">no longer available.</span></>}>
          <p>Private briefing links work for a limited time, and can be replaced if needed. If you’d like to see your briefing again, email us at <Email /> and we’ll send you a fresh link.</p>
          <p><Link href="/" className="font-medium text-accent-text underline-offset-4 hover:underline">Go to the Sales Scout website</Link></p>
        </Message>
      </Shell>
    );
  }

  const o = a.opportunity;
  const booking = bookingLink(o, a.briefing.reference);

  if (a.state === "preparing") {
    return (
      <Shell reference={a.briefing.reference}>
        <RefreshWhilePreparing />
        <Message icon={Clock} title={<>We’re writing your <span className="accent-serif text-signal">briefing.</span></>}>
          <p role="status">This usually takes a minute or two. This page updates by itself, so you can leave it open.</p>
        </Message>
      </Shell>
    );
  }

  if (a.state === "personal") {
    return (
      <Shell reference={a.briefing.reference}>
        <Message icon={RouteIcon} title={<>We’re preparing your briefing <span className="accent-serif text-signal">personally.</span></>}>
          <p>We couldn’t produce it automatically this time, so a member of our team will look at your problem and get back to you. Your details are safe with us and nothing has been lost.</p>
          <p>If you’d rather talk it through now:</p>
          <div>{booking ? <DiscussCta bookingHref={booking} token={token} requested={Boolean(o.callRequestedAt)} /> : <CallRequestButton token={token} requested={Boolean(o.callRequestedAt)} />}</div>
        </Message>
      </Shell>
    );
  }

  recordView(a.briefing.id);
  const b = a.briefing.content as Briefing; // ready briefings always carry validated content
  const preparedFor = o.companyName ? `${o.name}, ${o.companyName}` : o.name;

  return (
    <Shell reference={a.briefing.reference}>
      <div className="briefing-protect">
        <section className="relative overflow-hidden border-b border-border" aria-labelledby="h-title">
          <div aria-hidden className="paper-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_80%_at_70%_0%,#000_15%,transparent_70%)]" />
          <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-12 sm:px-6 sm:pt-20 sm:pb-16">
            <p className="caption-mono flex flex-wrap items-center gap-x-3 gap-y-1 text-subtle">
              <span className="flex items-center gap-2"><LogoMark size={18} label={null} /> Business Problem &amp; Solution Briefing</span>
              <span aria-hidden>·</span>
              <span>{a.briefing.reference}</span>
            </p>
            <h1 id="h-title" className="mt-6 max-w-4xl text-[40px] leading-[1.02] tracking-[-0.035em] sm:text-[64px]">{b.title}</h1>
            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-3 text-sm">
              <div><dt className="caption-mono text-subtle">Prepared for</dt><dd className="mt-1 font-medium text-heading">{preparedFor}</dd></div>
              <div><dt className="caption-mono text-subtle">Date</dt><dd className="mt-1 font-medium text-heading">{fmt(a.briefing.updatedAt)}</dd></div>
              <div><dt className="caption-mono text-subtle">Status</dt><dd className="mt-1 font-medium text-heading">Initial assessment</dd></div>
            </dl>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <DiscussCta bookingHref={booking} token={token} requested={Boolean(o.callRequestedAt)} compact />
              <a href="#problem" className="text-sm font-medium text-muted underline-offset-4 hover:text-text hover:underline">Read the briefing ↓</a>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-6 pb-24 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16">
          <nav aria-label="Sections" className="hidden lg:block">
            <ol className="sticky top-24 flex flex-col gap-1 pt-10 text-sm">
              {SECTIONS.map(([id, label], i) => (
                <li key={id}><a href={`#${id}`} className="flex items-center gap-3 rounded-md px-2 py-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-text"><span className="font-mono text-xs text-subtle">{String(i + 1).padStart(2, "0")}</span>{label}</a></li>
              ))}
            </ol>
          </nav>
          <main id="main">
            <BriefingDocument b={b} bookingHref={booking} token={token} requested={Boolean(o.callRequestedAt)} />
            <p className="caption-mono mt-10 text-subtle">
              Prepared for {preparedFor}. Private: please don’t share this link.{a.briefing.expiresAt ? ` Available until ${fmt(a.briefing.expiresAt)}.` : ""}
            </p>
          </main>
        </div>
      </div>
      <p className="briefing-print-note">This briefing is available to view online only. Please visit your private link, or contact {SITE.contactEmail}.</p>
    </Shell>
  );
}
