import Link from "next/link";
import { ArrowRight, Ban, ClipboardList, FileSpreadsheet, FileText, Lock, Search, Send, ShieldCheck, UserRound, Waypoints } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { SITE } from "@/content/site";
import { Logo, LogoMark } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { FitLevelIndicator, FIT_LABELS } from "@/components/ui/fit";
import { Needle } from "@/components/ui/needle";
import { ProductPreview } from "@/components/site/product-preview";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { cn } from "@/components/ui/cn";

export const metadata = {
  title: { absolute: `${SITE.name} — ${SITE.tagline}` },
  description: SITE.hero.body,
};

const DELIVERABLE_ICONS = [ClipboardList, Search, UserRound, FileText, Send, FileSpreadsheet];
const PRINCIPLE_ICONS = [Ban, Waypoints, Send, Lock];

function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-sm font-semibold tracking-wide text-accent-text", className)}>{children}</p>;
}

/** The public website: explains the done-for-you service. Clients don't need the portal to benefit. */
export default async function Website() {
  const signedIn = Boolean(await getSessionUser());
  const year = new Date().getFullYear();

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href="/" aria-label={`${SITE.name} home`}><Logo /></Link>
          <nav aria-label="Website" className="ml-4 hidden items-center gap-1 text-[15px] md:flex">
            {[
              ["#how", "How it works"],
              ["#deliverables", "What you get"],
              ["#packages", "Packages"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="rounded-md px-3 py-1.5 text-muted transition-colors hover:bg-accent-soft/60 hover:text-accent-text">{label}</a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ButtonLink href={signedIn ? "/home" : "/login"} variant="ghost" className="hidden sm:inline-flex">
              {signedIn ? "Open workspace" : "Client login"}
            </ButtonLink>
            <ButtonLink href="#contact" variant="primary">Book a call</ButtonLink>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="px-3 pt-4 sm:px-5">
          <div className="theme-ink brand-hero mx-auto grid max-w-7xl items-center gap-12 overflow-hidden rounded-3xl px-6 py-14 sm:px-12 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div className="animate-rise">
              <Eyebrow>{SITE.tagline}</Eyebrow>
              <h1 className="mt-4 text-[40px] leading-[1.05] sm:text-[56px]">{SITE.hero.title}</h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-muted">{SITE.hero.body}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="#contact" variant="primary" size="lg" icon={<ArrowRight className="size-4" />}>Book a discovery call</ButtonLink>
                <ButtonLink href="#how" variant="ghost" size="lg">See how it works</ButtonLink>
              </div>
              <p className="mt-6 text-sm text-subtle">No software to learn. We do the research; you get the conversations.</p>
            </div>
            <div className="animate-rise [animation-delay:120ms] lg:pl-4">
              <ProductPreview />
            </div>
          </div>
        </section>

        {/* The four questions */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6" aria-labelledby="h-questions">
          <div className="max-w-2xl">
            <Eyebrow>Not another lead list</Eyebrow>
            <h2 id="h-questions" className="mt-3 text-[32px] leading-tight sm:text-[40px]">Every company we hand you answers four questions.</h2>
          </div>
          <dl className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {SITE.questions.map((x) => (
              <div key={x.q} className="bg-surface p-6">
                <dt className="font-display text-2xl font-[650] text-accent-text">{x.q}</dt>
                <dd className="mt-2 leading-7 text-muted">{x.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-y border-border bg-surface-2/70" aria-labelledby="h-how">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="max-w-2xl">
              <Eyebrow>How it works</Eyebrow>
              <h2 id="h-how" className="mt-3 text-[32px] leading-tight sm:text-[40px]">From one conversation to a shortlist worth calling.</h2>
              <p className="mt-4 text-lg text-muted">We run Sales Scout on your behalf. You stay focused on selling.</p>
            </div>
            <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {SITE.steps.map((s, i) => (
                <li key={s.title} className="relative rounded-2xl border border-border bg-surface p-6 shadow-sm">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft font-display text-lg font-[650] text-accent-text" aria-hidden>
                    {i + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-heading">{s.title}</h3>
                  <p className="mt-2 leading-7 text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
            <p className="mt-8 flex items-center gap-2 text-muted">
              <Needle className="size-4 text-accent-text" /> Then we keep it fresh: new companies, re-checked research and what we learned from your feedback.
            </p>
          </div>
        </section>

        {/* Deliverables */}
        <section id="deliverables" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6" aria-labelledby="h-deliverables">
          <div className="max-w-2xl">
            <Eyebrow>What you get</Eyebrow>
            <h2 id="h-deliverables" className="mt-3 text-[32px] leading-tight sm:text-[40px]">Research you can act on the same day.</h2>
          </div>
          <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {SITE.deliverables.map((d, i) => {
              const Icon = DELIVERABLE_ICONS[i % DELIVERABLE_ICONS.length];
              return (
                <li key={d.title} className="flex gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-fg shadow-[0_8px_20px_-10px_var(--accent)]">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-heading">{d.title}</h3>
                    <p className="mt-1 leading-7 text-muted">{d.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Showcase: every lead explains itself */}
        <section className="px-3 sm:px-5" aria-labelledby="h-why">
          <div className="theme-ink brand-hero mx-auto grid max-w-7xl gap-12 rounded-3xl px-6 py-16 sm:px-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <Eyebrow>Why this lead?</Eyebrow>
              <h2 id="h-why" className="mt-3 text-[32px] leading-tight sm:text-[40px]">No magic scores. Every lead explains itself.</h2>
              <p className="mt-4 text-lg leading-8 text-muted">
                Instead of a number you're asked to trust, you see how each company fits, the evidence we found and, just as importantly, what we couldn&apos;t confirm.
              </p>
            </div>
            <div className="rounded-2xl bg-surface p-6 text-text shadow-lg">
              <p className="font-semibold text-heading">Strong on 4 of 6.</p>
              <p className="text-sm text-muted">Not yet known: whether they already use a provider.</p>
              <dl className="mt-5 divide-y divide-border">
                {(Object.keys(FIT_LABELS) as (keyof typeof FIT_LABELS)[]).map((k, i) => (
                  <div key={k} className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="text-sm text-muted">{FIT_LABELS[k]}</dt>
                    <dd><FitLevelIndicator level={(["strong", "strong", "strong", "moderate", "strong", "moderate"] as const)[i]} /></dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 rounded-lg border border-insight-border border-l-[3px] border-l-accent bg-insight px-4 py-3 text-sm">
                <p className="font-semibold text-accent-text">Evidence</p>
                <p className="mt-0.5 text-muted">Company website · services page · plant expansion news release</p>
              </div>
            </div>
          </div>
        </section>

        {/* Principles */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6" aria-labelledby="h-principles">
          <div className="max-w-2xl">
            <Eyebrow>Honest by design</Eyebrow>
            <h2 id="h-principles" className="mt-3 text-[32px] leading-tight sm:text-[40px]">Research you can put your name to.</h2>
          </div>
          <ul className="mt-12 grid gap-6 sm:grid-cols-2">
            {SITE.principles.map((p, i) => {
              const Icon = PRINCIPLE_ICONS[i % PRINCIPLE_ICONS.length];
              return (
                <li key={p.title} className="flex gap-4 rounded-2xl border border-border bg-surface p-6">
                  <Icon className="mt-1 size-5 shrink-0 text-accent" aria-hidden />
                  <div>
                    <h3 className="text-lg font-semibold text-heading">{p.title}</h3>
                    <p className="mt-1 leading-7 text-muted">{p.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Packages */}
        <section id="packages" className="scroll-mt-20 border-y border-border bg-surface-2/70" aria-labelledby="h-packages">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="max-w-2xl">
              <Eyebrow>Packages</Eyebrow>
              <h2 id="h-packages" className="mt-3 text-[32px] leading-tight sm:text-[40px]">Start small. Scale when it works.</h2>
              <p className="mt-4 text-lg text-muted">{SITE.packagesNote}</p>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {SITE.packages.map((pk) => (
                <article
                  key={pk.name}
                  className={cn(
                    "flex flex-col rounded-2xl p-7",
                    pk.featured ? "theme-ink brand-hero shadow-lg lg:-my-3 lg:py-10" : "border border-border bg-surface shadow-sm",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-2xl font-[650] text-heading">{pk.name}</h3>
                    {pk.featured && <span className="rounded-full bg-signal px-2.5 py-0.5 text-xs font-semibold text-white">Most chosen</span>}
                  </div>
                  <p className="mt-1 text-sm font-medium text-accent-text">{pk.cadence}</p>
                  <p className="mt-4 text-muted">{pk.summary}</p>
                  <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                    {pk.items.map((it) => (
                      <li key={it} className="flex gap-2.5 text-[15px]">
                        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                        {it}
                      </li>
                    ))}
                  </ul>
                  <ButtonLink href="#contact" variant={pk.featured ? "primary" : "secondary"} className="mt-8 w-full" size="lg">
                    Ask for a quote
                  </ButtonLink>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6" aria-labelledby="h-faq">
          <Eyebrow>Questions</Eyebrow>
          <h2 id="h-faq" className="mt-3 text-[32px] leading-tight sm:text-[40px]">Good to know</h2>
          <div className="mt-10 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {SITE.faqs.map((f) => (
              <details key={f.q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-heading">
                  {f.q}
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-text transition-transform group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="mt-3 leading-7 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="scroll-mt-20 px-3 pb-6 sm:px-5" aria-labelledby="h-contact">
          <div className="theme-ink brand-hero mx-auto grid max-w-7xl gap-12 rounded-3xl px-6 py-16 sm:px-12 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
            <div>
              <LogoMark size={44} label={null} />
              <h2 id="h-contact" className="mt-6 text-[32px] leading-tight sm:text-[44px]">Tell us what you sell. We&apos;ll find out who needs it.</h2>
              <p className="mt-4 text-lg leading-8 text-muted">Start with a short discovery call. We&apos;ll learn your business, agree where to look and send you a clear quote.</p>
              <p className="mt-8 text-sm text-subtle">
                Prefer email? <span className="select-all font-medium text-accent-text">{SITE.contactEmail}</span>
              </p>
            </div>
            <div className="theme-paper rounded-2xl">
              <EnquiryForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <LogoMark size={24} label={null} />
          <span>© {year} {SITE.name}. {SITE.tagline}.</span>
        </div>
        <div className="flex flex-wrap gap-5">
          <a href="#how" className="hover:text-accent-text">How it works</a>
          <a href="#packages" className="hover:text-accent-text">Packages</a>
          <a href="#contact" className="hover:text-accent-text">Contact</a>
          <Link href={signedIn ? "/home" : "/login"} className="hover:text-accent-text">{signedIn ? "Open workspace" : "Client login"}</Link>
        </div>
      </footer>
    </div>
  );
}
