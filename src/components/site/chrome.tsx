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
export function SectionHead({ id, eyebrow, title, lead, className }: { id: string; eyebrow: string; title: string; lead?: string; className?: string }) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 id={id} className="mt-3 text-[30px] leading-tight sm:text-[40px]">{title}</h2>
      {lead && <p className="mt-4 text-lg leading-8 text-muted">{lead}</p>}
    </div>
  );
}

/** Dark branded hero used at the top of every inner page. */
export function PageHero({ eyebrow, title, body, children }: { eyebrow: string; title: string; body: string; children?: React.ReactNode }) {
  return (
    <section className="px-3 pt-4 sm:px-5">
      <div className="theme-ink brand-hero mx-auto max-w-7xl overflow-hidden rounded-3xl px-6 py-14 sm:px-12 sm:py-20">
        <div className="max-w-3xl animate-rise">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-4 text-[36px] leading-[1.08] sm:text-[52px]">{title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">{body}</p>
          {children}
        </div>
      </div>
    </section>
  );
}

/** Closing call to action shared by every page except Contact. */
export function CtaBand({ title = "Tell us what you sell. We'll find out who needs it.", body = "Start with a short discovery call. No obligation, and no software to learn." }: { title?: string; body?: string }) {
  return (
    <section className="px-3 pb-6 sm:px-5" aria-labelledby="h-cta">
      <div className="theme-ink brand-hero mx-auto flex max-w-7xl flex-col items-start gap-8 rounded-3xl px-6 py-14 sm:px-12 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <LogoMark size={40} label={null} />
          <h2 id="h-cta" className="mt-5 text-[28px] leading-tight sm:text-[38px]">{title}</h2>
          <p className="mt-3 text-lg text-muted">{body}</p>
        </div>
        <ButtonLink href="/contact" variant="primary" size="lg" icon={<ArrowRight className="size-4" />}>Book a discovery call</ButtonLink>
      </div>
    </section>
  );
}

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const portal = { href: signedIn ? "/home" : "/login", label: signedIn ? "Open workspace" : "Client login" };
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" aria-label={`${SITE.name} home`}><Logo /></Link>
        <nav aria-label="Website" className="ml-4 hidden items-center gap-1 text-[15px] lg:flex">
          {SITE.nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-md px-3 py-1.5 text-muted transition-colors hover:bg-accent-soft/60 hover:text-accent-text">{n.label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <ButtonLink href={portal.href} variant="ghost">{portal.label}</ButtonLink>
            <ButtonLink href="/contact" variant="primary">Book a call</ButtonLink>
          </div>
          <details className="group relative lg:hidden [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-md border border-border bg-surface text-text" aria-label="Menu">
              <MenuIcon className="size-5" aria-hidden />
            </summary>
            <nav aria-label="Website menu" className="absolute right-0 mt-2 flex w-60 flex-col rounded-xl border border-border bg-surface p-2 shadow-lg">
              {[...SITE.nav, portal].map((n) => (
                <Link key={n.href} href={n.href} className="rounded-md px-3 py-2.5 text-[15px] hover:bg-accent-soft hover:text-accent-text">{n.label}</Link>
              ))}
              <ButtonLink href="/contact" variant="primary" className="mt-2">Book a call</ButtonLink>
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
        <p className="mt-3 max-w-xs leading-6">{SITE.tagline}. Real companies, real reasons, and nothing sent without you.</p>
        <p className="mt-3 select-all font-medium text-accent-text">{SITE.contactEmail}</p>
      </div>
      <nav aria-label="Footer" className="flex flex-col gap-2.5">
        <p className="font-semibold text-heading">Explore</p>
        <Link href="/" className="hover:text-accent-text">Home</Link>
        {SITE.nav.map((n) => (
          <Link key={n.href} href={n.href} className="hover:text-accent-text">{n.label}</Link>
        ))}
      </nav>
      <div className="flex flex-col gap-2.5">
        <p className="font-semibold text-heading">Clients</p>
        <Link href={signedIn ? "/home" : "/login"} className="hover:text-accent-text">{signedIn ? "Open workspace" : "Client login"}</Link>
        <p className="mt-6 text-subtle">© {new Date().getFullYear()} {SITE.name}</p>
      </div>
    </footer>
  );
}
