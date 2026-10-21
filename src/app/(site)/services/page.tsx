import { Check, Equal, Plus, X } from "lucide-react";
import { Fragment } from "react";
import { SITE } from "@/content/site";
import { CtaBand, PageHero, Section, SectionHead } from "@/components/site/chrome";
import { TierCard } from "@/components/site/visuals";

export const metadata = {
  title: "Pricing",
  description: "Monthly done-for-you research: 10–20, 20–30 or 40–50 qualified leads a month.",
};

export default function Pricing() {
  return (
    <>
      <PageHero eyebrow="Pricing" title="Choose your monthly lead volume." body="Same careful research in every tier. Fixed quote after a short call." />

      <Section id="tiers">
        <h2 id="h-tiers" className="sr-only">Packages</h2>
        <div className="grid gap-6 lg:grid-cols-3 lg:items-center">
          {SITE.packages.map((p) => <TierCard key={p.name} {...p} />)}
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-muted">{SITE.packagesNote}</p>
      </Section>

      <Section id="lead" band>
        <SectionHead id="h-lead" eyebrow="Definition" title="What counts as a qualified lead?" center />
        <div className="mt-12 flex flex-col items-center gap-3 lg:flex-row lg:justify-center">
          {SITE.qualifiedLead.map(({ icon: Icon, text }, i) => (
            <Fragment key={text}>
              {i > 0 && <Plus className="size-5 shrink-0 text-subtle" aria-hidden />}
              <div className="flex w-full max-w-xs items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 lg:w-auto lg:flex-col lg:px-6 lg:py-6 lg:text-center">
                <Icon className="size-6 shrink-0 text-accent" aria-hidden />
                <span className="font-medium text-heading">{text}</span>
              </div>
            </Fragment>
          ))}
          <Equal className="size-5 shrink-0 text-subtle" aria-hidden />
          <div className="theme-ink brand-hero flex w-full max-w-xs items-center justify-center rounded-2xl px-6 py-5 font-display text-xl font-[650] text-heading lg:w-auto lg:py-9">1 lead</div>
        </div>
        <p className="mt-6 text-center text-sm text-muted">Not a row in a spreadsheet. Companies we can&apos;t verify don&apos;t count.</p>
      </Section>

      <Section id="fit">
        <SectionHead id="h-fit" eyebrow="Is it right for you?" title="Who we work best with." center />
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-insight-border border-t-4 border-t-accent bg-insight p-7">
            <h3 className="font-semibold text-heading">A great fit</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {SITE.goodFit.map((x) => <li key={x} className="flex gap-3"><Check className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />{x}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl border border-border border-t-4 border-t-signal bg-surface p-7">
            <h3 className="font-semibold text-heading">Not for you if you want</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {SITE.notFit.map((x) => <li key={x} className="flex gap-3 text-muted"><X className="mt-0.5 size-5 shrink-0 text-signal-text" aria-hidden />{x}</li>)}
            </ul>
          </div>
        </div>
      </Section>

      <Section id="faq" band narrow>
        <SectionHead id="h-faq" eyebrow="Questions" title="Good to know" center />
        <div className="mt-10 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {SITE.faqs.map((f) => (
            <details key={f.q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-heading">
                {f.q}
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-text transition-transform group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-3 leading-7 text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <CtaBand title="Not sure which tier?" body="Tell us about your market. We'll recommend one, with a fixed quote." />
    </>
  );
}
