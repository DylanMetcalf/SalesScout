import Link from "next/link";
import { ArrowRight, Menu as MenuIcon } from "lucide-react";
import { SITE } from "@/content/site";
import { Logo, LogoMark } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-sm font-semibold tracking-wide text-accent-text", className)}>{children}</p>;
}

/** Standard section heading: eyebrow, h2, optional lead paragraph. */
export function SectionHead({ id, eyebrow, title, lead, center, className }: { id: string; eyebrow: string; title: string; lead?: string; center?: boolean; className?: string }) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 id={id} className="mt-3 text-[30px] leading-tight sm:text-[40px]">{title}</h2>
      {lead && <p className="mt-4 text-lg leading-8 text-muted">{lead}</p>}
    </div>
  );
}

/** Page section with consistent spacing; `band` gives it the tinted full-width background. */
export function Section({ id, band, narrow, children }: { id?: string; band?: boolean; narrow?: boolean; children: React.ReactNode }) {
  const inner = <div className={cn("mx-auto px-4 py-20 sm:px-6 sm:py-24", narrow ? "max-w-3xl" : "max-w-6xl")}>{children}</div>;
  return (
    <section id={id} aria-labelledby={id ? `h-${id}` : undefined} className={cn("scroll-mt-20", band && "border-y border-border bg-surface-2/70")}>
      {inner}
    </section>
  );
}

/** The one call to action, repeated at the end of pages. */
export function CtaBand({ title = "Tell us what’s not working.", body = "A few minutes in your own words. We’ll take it from there." }: { title?: string; body?: string }) {
  return (
    <section className="px-3 pb-6 sm:px-5" aria-labelledby="h-cta">
      <div className="theme-ink brand-hero hero-grid mx-auto flex max-w-7xl flex-col items-start gap-8 rounded-3xl px-6 py-14 sm:px-12 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <LogoMark size={40} label={null} />
          <h2 id="h-cta" className="mt-5 text-[28px] leading-tight sm:text-[38px]">{title}</h2>
          <p className="mt-3 text-lg text-muted">{body}</p>
        </div>
        <div className="flex flex-col items-start gap-3">
          <ButtonLink href="/start" variant="primary" size="lg" icon={<ArrowRight className="size-4" />}>{SITE.cta}</ButtonLink>
          <Link href="/book" className="text-sm text-muted underline-offset-4 hover:text-text hover:underline">Prefer to talk first? Book a call</Link>
        </div>
      </div>
    </section>
  );
}

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" aria-label={`${SITE.name} home`}><Logo /></Link>
        <nav aria-label="Website" className="ml-4 hidden items-center gap-1 text-[15px] md:flex">
          {SITE.nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-md px-3 py-1.5 text-muted transition-colors hover:bg-accent-soft/60 hover:text-accent-text">{n.label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {signedIn && <ButtonLink href="/home" variant="ghost" className="max-sm:hidden">Open workspace</ButtonLink>}
          <div className="max-sm:hidden">
            <ButtonLink href="/start" variant="primary">{SITE.cta}</ButtonLink>
          </div>
          <details className="group relative md:hidden [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-md border border-border bg-surface text-text" aria-label="Menu">
              <MenuIcon className="size-5" aria-hidden />
            </summary>
            <nav aria-label="Website menu" className="absolute right-0 mt-2 flex w-60 flex-col rounded-xl border border-border bg-surface p-2 shadow-lg">
              {SITE.nav.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-md px-3 py-2.5 text-[15px] hover:bg-accent-soft hover:text-accent-text">{n.label}</Link>
              ))}
              {signedIn && <Link href="/home" className="rounded-md px-3 py-2.5 text-[15px] hover:bg-accent-soft hover:text-accent-text">Open workspace</Link>}
              <ButtonLink href="/start" variant="primary" className="mt-2">{SITE.cta}</ButtonLink>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ signedIn }: { signedIn: boolean }) {
  return (
    <footer className="mx-auto grid max-w-6xl gap-8 px-4 py-12 text-sm text-muted sm:grid-cols-[1.4fr_1fr_1fr] sm:px-6">
      <div>
        <Logo />
        <p className="mt-3 max-w-xs leading-6">{SITE.tagline}. {SITE.operator}</p>
        <a href={`mailto:${SITE.contactEmail}`} className="mt-3 inline-block font-medium text-accent-text hover:underline">{SITE.contactEmail}</a>
      </div>
      <nav aria-label="Footer" className="flex flex-col gap-2.5">
        <p className="font-semibold text-heading">Start here</p>
        <Link href="/start" className="hover:text-accent-text">{SITE.cta}</Link>
        {SITE.nav.map((n) => (
          <Link key={n.href} href={n.href} className="hover:text-accent-text">{n.label}</Link>
        ))}
      </nav>
      <div className="flex flex-col gap-2.5">
        <p className="font-semibold text-heading">About your information</p>
        <Link href="/privacy" className="hover:text-accent-text">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-accent-text">Terms of Service</Link>
        <Link href={signedIn ? "/home" : "/login"} className="hover:text-accent-text">{signedIn ? "Open workspace" : "Sign in"}</Link>
        <p className="mt-6 text-subtle">© {new Date().getFullYear()} {SITE.name}</p>
      </div>
    </footer>
  );
}
