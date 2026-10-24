import { ArrowRight, Check } from "lucide-react";
import { SITE } from "@/content/site";
import { ButtonLink } from "@/components/ui/button";
import { CtaBand, Eyebrow, Section, SectionHead } from "@/components/site/chrome";
import { HeroRoute } from "@/components/site/hero-route";
import { CategoryGrid, ExampleOutput, PrivacyStrip, ProcessRoute } from "@/components/site/home-sections";
import { siteUrl } from "@/lib/site-url";

export const metadata = {
  title: { absolute: `${SITE.name}: what’s slowing your business down?` },
  description: "Tell us what’s not working. We’ll explore the problem, identify a potential solution, and send you a private briefing on what the next step could look like.",
  alternates: { canonical: "/" },
};

export default function Home() {
  // Only facts we can stand behind: who we are, where to find us, how to reach us.
  const org = { "@context": "https://schema.org", "@type": "Organization", name: SITE.name, url: siteUrl(), email: SITE.contactEmail, description: SITE.tagline, brand: { "@type": "Brand", name: "Mea Creo" } };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org).replace(/</g, "\\u003c") }} />

      <section aria-labelledby="h-hero" className="px-3 pt-3 sm:px-5">
        <div className="theme-ink brand-hero hero-grid relative mx-auto max-w-[1400px] overflow-hidden rounded-panel">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 pt-10 pb-10 sm:px-8 sm:pt-20 sm:pb-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14 lg:pt-24 lg:pb-24">
            <div className="min-w-0 animate-rise">
              <p className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/60 px-3 py-1 text-sm text-muted">
                <span aria-hidden className="size-1.5 rounded-full bg-signal" /> {SITE.hero.eyebrow}
              </p>
              <h1 id="h-hero" className="mt-6 text-[40px] leading-[1.02] tracking-[-0.045em] sm:text-[64px] lg:text-[72px]">
                What’s slowing your business <span className="accent-word">down?</span>
              </h1>
              <p className="mt-5 max-w-xl text-[17px] leading-7 text-muted sm:mt-6 sm:text-lg sm:leading-8">{SITE.hero.body}</p>
              <div className="mt-7 flex flex-wrap items-center gap-3 sm:mt-8">
                <ButtonLink href="/start" variant="primary" size="xl" trailing={<ArrowRight className="size-4" />}>{SITE.cta}</ButtonLink>
                <ButtonLink href="/book" variant="secondary" size="xl" className="max-sm:hidden">Book a call</ButtonLink>
              </div>
              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                {["About 5 minutes", "A private briefing", "No commitment"].map((t) => (
                  <li key={t} className="flex items-center gap-2"><Check className="size-4 text-signal" aria-hidden /> {t}</li>
                ))}
              </ul>
            </div>
            <div className="min-w-0 animate-rise [animation-delay:160ms]">
              <HeroRoute />
            </div>
          </div>
        </div>
      </section>

      <Section id="solve">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHead id="h-solve" eyebrow="What we solve" title={<>Sound <span className="accent-word">familiar?</span></>} lead="If something takes too long, goes wrong too often or depends on someone remembering, it’s worth telling us about." />
          <p className="max-w-xs text-sm text-muted lg:pb-2">Pick one to start with it selected, or just describe your own. You never have to choose a category.</p>
        </div>
        <CategoryGrid />
      </Section>

      <Section id="how" band>
        <SectionHead id="h-how" eyebrow="How it works" title={<>Describe it. Get a briefing. <span className="accent-word">Talk it through.</span></>} />
        <ProcessRoute />
      </Section>

      <Section id="example">
        <SectionHead id="h-example" eyebrow="What you get" title={<>From a few sentences to a <span className="accent-word">clear direction.</span></>} lead="Your Business Problem & Solution Briefing sets out how we understand the problem, why it matters, one solution worth exploring and what we’d want to clarify. It’s a starting point, not a finished plan: the detail comes from talking it through." />
        <ExampleOutput />
      </Section>

      <Section id="approach" band>
        <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <Eyebrow>Initial assessment, then a conversation</Eyebrow>
            <h2 id="h-approach" className="mt-4 text-[32px] leading-[1.08] sm:text-[44px]">
              A briefing starts the thinking. A conversation <span className="accent-word">moves it forward.</span>
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-muted">Your briefing shows we’ve understood the problem and can see a promising direction. Turning that into something that works for your business takes a proper conversation, and that’s where we come in.</p>
          </div>
          <ol className="flex flex-col">
            {SITE.approach.map((a) => (
              <li key={a.title} className="reveal grid grid-cols-[auto_1fr] gap-x-5 border-t border-border py-6 first:border-t-0 first:pt-0">
                <a.icon className="mt-0.5 size-5 text-accent" aria-hidden />
                <div>
                  <h3 className="text-[19px] font-semibold tracking-[-0.015em] text-heading">{a.title}</h3>
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
