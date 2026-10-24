import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MobileMenu } from "./mobile-menu";
import { SITE } from "@/content/site";
import { Logo, LogoMark } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";

/** Monospaced section label, e.g. "02 — What we solve". The site's editorial signature. */
export function Eyebrow({ children, index, className }: { children: React.ReactNode; index?: string; className?: string }) {
  return (
    <p className={cn("caption-mono flex items-center gap-2 text-subtle", className)}>
      {index && <span className="text-signal-text">{index}</span>}
      {index && <span aria-hidden className="h-px w-6 bg-border-strong" />}
      {children}
    </p>
  );
}

/** Standard section heading: label, h2 (may contain an .accent-serif word), optional lead. */
export function SectionHead({ id, index, eyebrow, title, lead, center, className }: { id: string; index?: string; eyebrow: string; title: React.ReactNode; lead?: string; center?: boolean; className?: string }) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center [&>p:first-child]:justify-center", className)}>
      <Eyebrow index={index}>{eyebrow}</Eyebrow>
      <h2 id={id} className="mt-4 text-[34px] leading-[1.05] tracking-[-0.03em] sm:text-[48px]">{title}</h2>
      {lead && <p className="mt-5 text-lg leading-8 text-muted">{lead}</p>}
    </div>
  );
}

/** Page section with consistent spacing; `band` gives it the tinted full-width background. */
export function Section({ id, band, narrow, children, className }: { id?: string; band?: boolean; narrow?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={id ? `h-${id}` : undefined} className={cn("scroll-mt-20", band && "border-y border-border bg-surface-2/60", className)}>
      <div className={cn("mx-auto px-4 py-20 sm:px-6 sm:py-28", narrow ? "max-w-3xl" : "max-w-6xl")}>{children}</div>
    </section>
  );
}

/** The one call to action, repeated at the end of pages. The route runs across it and ends at the button. */
export function CtaBand({ title, body = "A few minutes in your own words. We’ll take it from there." }: { title?: React.ReactNode; body?: string }) {
  return (
    <section className="px-3 pb-6 sm:px-5" aria-labelledby="h-cta">
      <div className="theme-ink brand-hero hero-grid relative mx-auto overflow-hidden rounded-[28px] px-6 py-16 sm:px-14 sm:py-20">
        <svg aria-hidden className="pointer-events-none absolute inset-x-0 bottom-10 hidden h-24 w-full lg:block" viewBox="0 0 1200 96" preserveAspectRatio="none" fill="none">
          <path d="M-10 70 C 180 70 220 20 420 26 S 700 88 880 60 S 1060 40 1130 48" stroke="var(--signal)" strokeOpacity=".55" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="relative flex flex-col items-start gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <LogoMark size={40} label={null} />
            <h2 id="h-cta" className="mt-6 text-[34px] leading-[1.05] tracking-[-0.03em] sm:text-[52px]">
              {title ?? <>Tell us what’s <span className="accent-serif text-signal">not working.</span></>}
            </h2>
            <p className="mt-4 max-w-lg text-lg text-muted">{body}</p>
          </div>
          <div className="flex flex-col items-start gap-3">
            <ButtonLink href="/start" variant="primary" size="lg" className="h-12 rounded-full px-6" trailing={<ArrowRight className="size-4" />}>{SITE.cta}</ButtonLink>
            <Link href="/book" className="text-sm text-muted underline-offset-4 hover:text-text hover:underline">Prefer to talk first? Book a call</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/80 backdrop-blur-md supports-[backdrop-filter]:bg-bg/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" aria-label={`${SITE.name} home`} className="rounded-md"><Logo /></Link>
        <nav aria-label="Website" className="ml-6 hidden items-center gap-1 text-[15px] md:flex">
          {SITE.nav.map((n) => (
            <Link key={n.href} href={n.href} className="relative rounded-md px-3 py-1.5 text-muted transition-colors after:absolute after:inset-x-3 after:bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-text after:transition-transform after:duration-200 hover:text-text hover:after:scale-x-100">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {signedIn && <ButtonLink href="/home" variant="ghost" className="max-sm:hidden">Open workspace</ButtonLink>}
          <div className="max-sm:hidden">
            <ButtonLink href="/start" variant="primary" className="rounded-full px-4" trailing={<ArrowRight className="size-4" />}>{SITE.cta}</ButtonLink>
          </div>
          <MobileMenu nav={SITE.nav} cta={SITE.cta} signedIn={signedIn} />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ signedIn }: { signedIn: boolean }) {
  return (
    <footer className="mx-auto max-w-6xl px-4 pt-16 pb-10 sm:px-6">
      <div className="grid gap-10 border-t border-border pt-10 text-sm text-muted sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs leading-6">{SITE.tagline}. {SITE.operator}</p>
          <a href={`mailto:${SITE.contactEmail}`} className="mt-4 inline-block font-medium text-accent-text underline-offset-4 hover:underline">{SITE.contactEmail}</a>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2.5">
          <p className="caption-mono text-subtle">Start here</p>
          <Link href="/start" className="hover:text-text">{SITE.cta}</Link>
          {SITE.nav.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-text">{n.label}</Link>
          ))}
        </nav>
        <div className="flex flex-col gap-2.5">
          <p className="caption-mono text-subtle">Your information</p>
          <Link href="/privacy" className="hover:text-text">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-text">Terms of Service</Link>
          <Link href={signedIn ? "/home" : "/login"} className="hover:text-text">{signedIn ? "Open workspace" : "Sign in"}</Link>
        </div>
      </div>
      <p className="caption-mono mt-12 flex flex-wrap items-center justify-between gap-3 text-subtle">
        <span>© {new Date().getFullYear()} {SITE.name}</span>
        <span className="flex items-center gap-2"><span aria-hidden className="size-1.5 rounded-full bg-signal" /> A Mea Creo service</span>
      </p>
    </footer>
  );
}
