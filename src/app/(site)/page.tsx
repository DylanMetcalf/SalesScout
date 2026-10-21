import { ArrowRight } from "lucide-react";
import { SITE } from "@/content/site";
import { ButtonLink } from "@/components/ui/button";
import { AppMock, DraftMock, FitMock } from "@/components/site/mocks";
import { CtaBand, Eyebrow, Section, SectionHead } from "@/components/site/chrome";
import { FlowDiagram, IconBadge, IconGrid, MoreLink, ProofChips, TierCard, VettingFunnel } from "@/components/site/visuals";

export const metadata = {
  title: { absolute: `${SITE.name} — ${SITE.tagline}` },
  description: SITE.hero.body,
};

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="px-3 pt-4 sm:px-5">
        <div className="theme-ink brand-hero hero-grid mx-auto grid max-w-7xl items-center gap-12 overflow-hidden rounded-3xl px-6 py-14 sm:px-12 sm:py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <div className="animate-rise">
            <Eyebrow>{SITE.hero.eyebrow}</Eyebrow>
            <h1 className="mt-4 text-[40px] leading-[1.04] sm:text-[58px]">{SITE.hero.title}</h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-muted">{SITE.hero.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/contact" variant="primary" size="lg" icon={<ArrowRight className="size-4" />}>Book a discovery call</ButtonLink>
              <ButtonLink href="/platform" variant="ghost" size="lg">See the platform</ButtonLink>
            </div>
            <ProofChips items={SITE.hero.proof} className="mt-8" />
          </div>
          <div className="animate-rise [animation-delay:120ms]">
            <AppMock />
          </div>
        </div>
      </section>

      {/* Problem */}
      <Section id="problem">
        <SectionHead id="h-problem" eyebrow="The problem" title="More data than ever. Fewer reasons to call." center />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SITE.problems.map((p) => (
            <li key={p.title} className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-5">
              <IconBadge icon={p.icon} tone="signal" />
              <div>
                <h3 className="font-semibold text-heading">{p.title}</h3>
                <p className="mt-0.5 text-[15px] text-muted">{p.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center"><MoreLink href="/why-us">How we solve each one</MoreLink></p>
      </Section>

      {/* Four questions */}
      <Section id="answers" band>
        <SectionHead id="h-answers" eyebrow="The answer" title="Every lead answers four questions." center />
        <dl className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SITE.questions.map(({ icon: Icon, q, a }) => (
            <div key={q} className="flex flex-col items-center rounded-2xl border border-border bg-surface p-6 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-bright text-accent-fg shadow-[0_10px_24px_-12px_var(--accent)]" aria-hidden>
                <Icon className="size-6" />
              </span>
              <dt className="mt-4 font-display text-2xl font-[650] text-heading">{q}</dt>
              <dd className="mt-1 text-[15px] text-muted">{a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* Process */}
      <Section id="process">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHead id="h-process" eyebrow="How it works" title="One call in. A briefed shortlist out." />
          <MoreLink href="/how-it-works">The full process</MoreLink>
        </div>
        <div className="mt-14">
          <FlowDiagram steps={SITE.flow} />
        </div>
      </Section>

      {/* Vetting + fit */}
      <section className="px-3 sm:px-5" aria-labelledby="h-vetting">
        <div className="theme-ink brand-hero hero-grid mx-auto grid max-w-7xl gap-12 rounded-3xl px-6 py-16 sm:px-12 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHead id="h-vetting" eyebrow="Quality over volume" title="Most companies don't make the cut. That's the point." />
            <div className="mt-10"><VettingFunnel /></div>
          </div>
          <FitMock />
        </div>
      </section>

      {/* What you get */}
      <Section id="deliverables">
        <SectionHead id="h-deliverables" eyebrow="What you get" title="Ready to act on, the same day." center />
        <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <IconGrid items={SITE.deliverables} cols={2} tone="solid" card={false} />
          <DraftMock />
        </div>
      </Section>

      {/* Pricing teaser */}
      <Section id="pricing" band>
        <SectionHead id="h-pricing" eyebrow="Pricing" title="Pick your monthly lead volume." center />
        <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:items-center">
          {SITE.packages.map((p) => <TierCard key={p.name} {...p} />)}
        </div>
        <p className="mt-8 text-center"><MoreLink href="/services">What counts as a qualified lead</MoreLink></p>
      </Section>

      {/* Principles */}
      <Section id="principles">
        <SectionHead id="h-principles" eyebrow="Honest by design" title="Research you can put your name to." center />
        <div className="mt-12"><IconGrid items={SITE.principles} cols={4} /></div>
      </Section>

      <CtaBand />
    </>
  );
}
