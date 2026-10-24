import { ArrowRight } from "lucide-react";
import { SITE } from "@/content/site";
import { ButtonLink } from "@/components/ui/button";
import { CtaBand, Eyebrow, Section, SectionHead } from "@/components/site/chrome";
import { HeroRoute } from "@/components/site/hero-route";
import { CategoryGrid, ExampleOutput, PrivacyStrip, ProcessRoute } from "@/components/site/home-sections";
import { siteUrl } from "@/lib/site-url";

export const metadata = {
  title: { absolute: `${SITE.name}: your business has a better way forward` },
  description: "Tell us what’s slowing your business down. We’ll help you understand the problem and find a practical way forward with software, AI or automation.",
  alternates: { canonical: "/" },
};

export default function Home() {
  // Only facts we can stand behind: who we are, where to find us, how to reach us.
  const org = { "@context": "https://schema.org", "@type": "Organization", name: SITE.name, url: siteUrl(), email: SITE.contactEmail, description: SITE.tagline, brand: { "@type": "Brand", name: "Mea Creo" } };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org).replace(/</g, "\\u003c") }} />

      <section aria-labelledby="h-hero" className="relative overflow-hidden">
        <div aria-hidden className="paper-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_20%,transparent_75%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-10 sm:px-6 sm:pt-24">
          <Eyebrow index="00" className="animate-rise">{SITE.hero.eyebrow}</Eyebrow>
          <h1 id="h-hero" className="mt-6 max-w-5xl text-[46px] leading-[0.98] tracking-[-0.04em] animate-rise sm:text-[84px] lg:text-[104px]">
            Your business has a better <span className="accent-serif text-signal">way forward.</span>
          </h1>
          <div className="mt-10 grid gap-10 animate-rise [animation-delay:120ms] lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div>
              <p className="max-w-xl text-lg leading-8 text-muted sm:text-xl sm:leading-9">{SITE.hero.body}</p>
              <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
                <ButtonLink href="/start" variant="primary" size="lg" className="h-12 rounded-full px-6 text-[16px]" trailing={<ArrowRight className="size-4" />}>{SITE.cta}</ButtonLink>
                <ButtonLink href="/book" variant="ghost" size="lg" className="h-12 rounded-full px-5">Book a conversation</ButtonLink>
              </div>
            </div>
            <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border bg-border text-sm lg:justify-self-end">
              {[["Time", "About 5 minutes"], ["You need", "Your own words"], ["Commitment", "None"]].map(([k, v]) => (
                <div key={k} className="bg-surface/80 px-4 py-3">
                  <dt className="caption-mono text-subtle">{k}</dt>
                  <dd className="mt-1 font-medium text-heading">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div className="relative mx-auto max-w-6xl px-3 pb-8 animate-rise [animation-delay:240ms] sm:px-6">
          <HeroRoute />
        </div>
      </section>

      <Section id="solve">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHead id="h-solve" index="01" eyebrow="What we solve" title={<>Sound <span className="accent-serif text-signal">familiar?</span></>} lead="If something takes too long, goes wrong too often or depends on someone remembering, it’s worth telling us about." />
          <p className="max-w-xs text-sm text-muted lg:pb-2">Pick one to start with it selected, or just describe your own. You never have to choose a category.</p>
        </div>
        <CategoryGrid />
      </Section>

      <Section id="how" band>
        <SectionHead id="h-how" index="02" eyebrow="How it works" title={<>Three steps. You only do <span className="accent-serif text-signal">the first.</span></>} />
        <ProcessRoute />
      </Section>

      <Section id="example">
        <SectionHead id="h-example" index="03" eyebrow="What you get" title={<>From a few sentences to a <span className="accent-serif text-signal">clear picture.</span></>} lead="After we’ve read your problem, we write up what we understand, what we’d ask, and where a solution might lie, so the conversation starts in the right place." />
        <ExampleOutput />
      </Section>

      <Section id="approach" band>
        <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <Eyebrow index="04">How we work</Eyebrow>
            <h2 id="h-approach" className="mt-4 text-[34px] leading-[1.05] tracking-[-0.03em] sm:text-[48px]">
              We’ll tell you if software <span className="accent-serif text-signal">isn’t the answer.</span>
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-muted">Most problems aren’t solved by more software. They’re solved by understanding the work properly, then building only what helps.</p>
          </div>
          <ol className="flex flex-col">
            {SITE.approach.map((a, i) => (
              <li key={a.title} className="reveal grid grid-cols-[auto_1fr] gap-x-5 border-t border-border py-6 first:border-t-0 first:pt-0">
                <span className="caption-mono pt-1 text-signal-text">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-display text-[21px] font-[620] tracking-[-0.02em] text-heading">{a.title}</h3>
                  <p className="mt-1 text-[15px] text-muted">{a.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <PrivacyStrip />
      </Section>

      <div className="pt-6">
        <CtaBand />
      </div>
    </>
  );
}
