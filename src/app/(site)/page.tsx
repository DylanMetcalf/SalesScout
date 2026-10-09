import Link from "next/link";
import { ArrowRight, Ban, ClipboardList, FileSpreadsheet, FileText, Lock, Search, Send, UserRound, Waypoints } from "lucide-react";
import { SITE } from "@/content/site";
import { ButtonLink } from "@/components/ui/button";
import { FitLevelIndicator, FIT_LABELS } from "@/components/ui/fit";
import { Needle } from "@/components/ui/needle";
import { AppMock, FitMock, PipelineMock, ResearchMock } from "@/components/site/mocks";
import { CtaBand, Eyebrow, SectionHead } from "@/components/site/chrome";

export const metadata = {
  title: { absolute: `${SITE.name} — ${SITE.tagline}` },
  description: SITE.hero.body,
};

const DELIVERABLE_ICONS = [ClipboardList, Search, UserRound, FileText, Send, FileSpreadsheet];
const PRINCIPLE_ICONS = [Ban, Waypoints, Send, Lock];
const PLATFORM = [
  { title: "Live research", body: "Watch every company get checked.", Mock: ResearchMock },
  { title: "Explainable fit", body: "Six dimensions, each with evidence.", Mock: FitMock },
  { title: "Built-in pipeline", body: "Keep, track and follow up.", Mock: PipelineMock },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="px-3 pt-4 sm:px-5">
        <div className="theme-ink brand-hero mx-auto grid max-w-7xl items-center gap-12 overflow-hidden rounded-3xl px-6 py-14 sm:px-12 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div className="animate-rise">
            <Eyebrow>{SITE.hero.eyebrow}</Eyebrow>
            <h1 className="mt-4 text-[40px] leading-[1.05] sm:text-[56px]">{SITE.hero.title}</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted">{SITE.hero.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/contact" variant="primary" size="lg" icon={<ArrowRight className="size-4" />}>Book a discovery call</ButtonLink>
              <ButtonLink href="/how-it-works" variant="ghost" size="lg">See how it works</ButtonLink>
            </div>
            <p className="mt-6 text-sm text-subtle">Our own platform, run by our team. You get the conversations, and your own workspace if you want it.</p>
          </div>
          <div className="animate-rise [animation-delay:120ms] lg:pl-4">
            <AppMock />
          </div>
        </div>
      </section>

      {/* The problem */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6" aria-labelledby="h-problem">
        <SectionHead
          id="h-problem"
          eyebrow="The problem"
          title="Finding the right customers has never been noisier."
          lead="Sellers have more data and more tools than ever, and still spend their days chasing companies that were never going to buy. Sound familiar?"
        />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SITE.problems.map((p, i) => (
            <li key={p.title} className="rounded-2xl border border-border bg-surface p-6">
              <span className="font-display text-sm font-[650] text-signal-text">0{i + 1}</span>
              <h3 className="mt-2 text-lg font-semibold text-heading">{p.title}</h3>
              <p className="mt-2 leading-7 text-muted">{p.body}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-insight-border border-l-4 border-l-accent bg-insight p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-lg leading-8">
            <span className="font-semibold text-heading">Our answer:</span> fewer companies, properly researched, each with a clear reason to talk and the evidence to back it up.
          </p>
          <ButtonLink href="/why-us" variant="secondary" icon={<ArrowRight className="size-4" />}>Why Sales Scout</ButtonLink>
        </div>
      </section>

      {/* The platform */}
      <section className="border-y border-border bg-surface-2/70" aria-labelledby="h-platform">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead id="h-platform" eyebrow="The platform" title="Software that researches like your best salesperson." lead="Research, explainable fit, pipeline and outreach drafts in one place, with a source behind every fact." />
            <ButtonLink href="/platform" variant="secondary" icon={<ArrowRight className="size-4" />}>Explore the platform</ButtonLink>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PLATFORM.map(({ title, body, Mock }) => (
              <div key={title}>
                <Mock />
                <h3 className="mt-4 text-lg font-semibold text-heading">{title}</h3>
                <p className="text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The four questions */}
      <section aria-labelledby="h-questions">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionHead id="h-questions" eyebrow="Not another lead list" title="Every company we hand you answers four questions." />
          <dl className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {SITE.questions.map((x) => (
              <div key={x.q} className="bg-surface p-6">
                <dt className="font-display text-2xl font-[650] text-accent-text">{x.q}</dt>
                <dd className="mt-2 leading-7 text-muted">{x.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* How it works (short) */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6" aria-labelledby="h-how">
        <SectionHead id="h-how" eyebrow="How it works" title="From one conversation to a shortlist worth calling." lead="We run our platform on your behalf. You stay focused on selling." />
        <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {SITE.steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft font-display text-lg font-[650] text-accent-text" aria-hidden>{i + 1}</span>
              <h3 className="mt-5 text-lg font-semibold text-heading">{s.title}</h3>
              <p className="mt-2 leading-7 text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="flex items-center gap-2 text-muted">
            <Needle className="size-4 text-accent-text" /> Then we keep it fresh, using what we learn from your feedback.
          </p>
          <Link href="/how-it-works" className="font-medium text-accent-text hover:underline">The full process →</Link>
        </div>
      </section>

      {/* Showcase */}
      <section className="px-3 sm:px-5" aria-labelledby="h-why">
        <div className="theme-ink brand-hero mx-auto grid max-w-7xl gap-12 rounded-3xl px-6 py-16 sm:px-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <Eyebrow>Why this lead?</Eyebrow>
            <h2 id="h-why" className="mt-3 text-[30px] leading-tight sm:text-[40px]">No magic scores. Every lead explains itself.</h2>
            <p className="mt-4 text-lg leading-8 text-muted">
              Instead of a number you&apos;re asked to trust, you see how each company fits, the evidence we found and, just as importantly, what we couldn&apos;t confirm.
            </p>
          </div>
          <div className="theme-paper rounded-2xl bg-surface p-6 text-text shadow-lg">
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
            <p className="mt-3 text-xs text-subtle">Illustrative example.</p>
          </div>
        </div>
      </section>

      {/* Deliverables */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6" aria-labelledby="h-deliverables">
        <SectionHead id="h-deliverables" eyebrow="What you get" title="Research you can act on the same day." />
        <ul className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Principles */}
      <section className="border-y border-border bg-surface-2/70" aria-labelledby="h-principles">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionHead id="h-principles" eyebrow="Honest by design" title="Research you can put your name to." />
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
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6" aria-labelledby="h-faq">
        <SectionHead id="h-faq" eyebrow="Questions" title="Good to know" />
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

      <CtaBand />
    </>
  );
}
