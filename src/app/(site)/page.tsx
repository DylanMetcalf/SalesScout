import { ArrowRight, Check, CornerDownRight } from "lucide-react";
import { SITE } from "@/content/site";
import { ButtonLink } from "@/components/ui/button";
import { CtaBand, Eyebrow, Section, SectionHead } from "@/components/site/chrome";
import { IconBadge } from "@/components/site/visuals";
import { siteUrl } from "@/lib/site-url";

export const metadata = {
  title: { absolute: `${SITE.name}: tell us what’s not working` },
  description: "Tell us what’s slowing your business down. We’ll help you understand the problem and find a practical way forward with software, AI or automation.",
  alternates: { canonical: "/" },
};

/** Labelled example of the conversation: what someone says, and what we'd look into. Not a result. */
function ExampleCard() {
  return (
    <figure className="theme-paper rounded-2xl bg-surface p-6 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)] sm:p-7">
      <figcaption className="text-xs font-semibold tracking-[0.12em] text-subtle uppercase">Example</figcaption>
      <p className="mt-4 text-sm font-medium text-muted">In their own words</p>
      <blockquote className="mt-1.5 border-l-2 border-signal pl-4 font-display text-[19px] leading-snug text-heading">
        “{SITE.example.said}”
      </blockquote>
      <p className="mt-6 flex items-center gap-1.5 text-sm font-medium text-muted">
        <CornerDownRight className="size-4 text-accent" aria-hidden /> What we’d explore together
      </p>
      <ul className="mt-2 flex flex-col gap-2">
        {SITE.example.explore.map((e) => (
          <li key={e} className="flex items-start gap-2.5 rounded-lg bg-surface-2 px-3 py-2.5 text-[15px] text-text">
            <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
            {e}
          </li>
        ))}
      </ul>
    </figure>
  );
}

export default function Home() {
  // Only facts we can stand behind: who we are, where to find us, how to reach us.
  const org = { "@context": "https://schema.org", "@type": "Organization", name: SITE.name, url: siteUrl(), email: SITE.contactEmail, description: SITE.tagline, brand: { "@type": "Brand", name: "Mea Creo" } };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org).replace(/</g, "\\u003c") }} />
      <section className="px-3 pt-4 sm:px-5" aria-labelledby="h-hero">
        <div className="theme-ink brand-hero hero-grid mx-auto grid max-w-7xl items-center gap-12 overflow-hidden rounded-3xl px-6 py-16 sm:px-12 sm:py-24 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div className="animate-rise">
            <Eyebrow>{SITE.hero.eyebrow}</Eyebrow>
            <h1 id="h-hero" className="mt-4 text-[40px] leading-[1.04] text-balance sm:text-[60px]">{SITE.hero.title}</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted">{SITE.hero.body}</p>
            <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3">
              <ButtonLink href="/start" variant="primary" size="lg" icon={<ArrowRight className="size-4" />}>{SITE.cta}</ButtonLink>
              <ButtonLink href="/book" variant="ghost" size="lg">Book a conversation</ButtonLink>
            </div>
            <p className="mt-5 text-sm text-subtle">{SITE.hero.note}</p>
          </div>
          <div className="animate-rise [animation-delay:120ms]">
            <ExampleCard />
          </div>
        </div>
      </section>

      <Section id="solve">
        <SectionHead id="h-solve" eyebrow="What we solve" title="Sound familiar?" lead="If something in your business takes too long, goes wrong too often or depends on someone remembering, it’s worth telling us about." />
        <ul className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-4">
          {SITE.solve.map((s) => (
            <li key={s.title} className="flex flex-col gap-4 bg-surface p-4 transition-colors hover:bg-surface-2/60 sm:p-6">
              <IconBadge icon={s.icon} />
              <div>
                <h3 className="font-semibold text-heading">{s.title}</h3>
                <p className="mt-1 text-[15px] text-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[15px] text-muted">Something else? That’s fine. <a href="/start" className="font-medium text-accent-text underline-offset-4 hover:underline">Describe it in your own words</a>.</p>
      </Section>

      <Section id="how" band>
        <SectionHead id="h-how" eyebrow="How it works" title="Three steps. You only need to do the first." center />
        <ol className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          <span aria-hidden className="absolute top-7 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-accent/10 via-accent/50 to-accent/10 md:block" />
          {SITE.steps.map((s, i) => (
            <li key={s.title} className="relative flex flex-col items-center text-center">
              <span className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-bright text-accent-fg shadow-[0_10px_24px_-12px_var(--accent)] ring-8 ring-surface-2">
                <s.icon className="size-6" aria-hidden />
              </span>
              <p className="mt-5 text-xs font-semibold tracking-[0.12em] text-subtle uppercase">Step {i + 1}</p>
              <h3 className="mt-1 font-display text-[22px] font-[650] text-heading">{s.title}</h3>
              <p className="mt-2 max-w-xs text-[15px] text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-14 flex justify-center">
          <ButtonLink href="/start" variant="primary" size="lg" icon={<ArrowRight className="size-4" />}>{SITE.cta}</ButtonLink>
        </div>
      </Section>

      <Section id="approach">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <SectionHead id="h-approach" eyebrow="How we work" title="Clear thinking before any code." lead="Most problems aren’t solved by more software. They’re solved by understanding the work properly, then building only what helps." />
            <ul className="mt-8 flex flex-col gap-3 text-[15px]">
              {SITE.expectations.map((e) => (
                <li key={e} className="flex items-start gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />{e}</li>
              ))}
            </ul>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {SITE.approach.map((a) => (
              <li key={a.title} className="rounded-2xl border border-border bg-surface p-6">
                <IconBadge icon={a.icon} tone="solid" />
                <h3 className="mt-4 font-semibold text-heading">{a.title}</h3>
                <p className="mt-1 text-[15px] text-muted">{a.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
