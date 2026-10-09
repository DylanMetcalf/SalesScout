import { Check, ShieldCheck, X } from "lucide-react";
import { SITE } from "@/content/site";
import { ButtonLink } from "@/components/ui/button";
import { CtaBand, PageHero, SectionHead } from "@/components/site/chrome";
import { cn } from "@/components/ui/cn";

export const metadata = {
  title: "Services",
  description: "Done-for-you prospect research packages: a one-off snapshot, a monthly pipeline or an embedded research partner.",
};

const INCLUDED = [
  "Your Company Brain, built and kept up to date",
  "Every company traced to a public source",
  "A clear fit explanation, never a magic score",
  "Gaps marked as unknown, not guessed",
  "One-minute briefs and outreach drafts",
  "CSV, Excel and report exports",
];

export default function Services() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Start small. Scale when it works."
        body="Every package is the same careful research. The difference is how much, and how often. We'll recommend a starting point after your discovery call."
      />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6" aria-labelledby="h-packages">
        <h2 id="h-packages" className="sr-only">Packages</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {SITE.packages.map((pk) => (
            <article key={pk.name} className={cn("flex flex-col rounded-2xl p-7", pk.featured ? "theme-ink brand-hero shadow-lg lg:-my-3 lg:py-10" : "border border-border bg-surface shadow-sm")}>
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
              <ButtonLink href="/contact" variant={pk.featured ? "primary" : "secondary"} className="mt-8 w-full" size="lg">Ask for a quote</ButtonLink>
            </article>
          ))}
        </div>
        <p className="mt-6 text-muted">{SITE.packagesNote}</p>
      </section>

      <section className="border-y border-border bg-surface-2/70" aria-labelledby="h-included">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionHead id="h-included" eyebrow="In every package" title="The standard doesn't change with the price." />
          <ul className="mt-10 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {INCLUDED.map((x) => (
              <li key={x} className="flex gap-3 text-[16px]">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg"><Check className="size-3.5" aria-hidden /></span>
                {x}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6" aria-labelledby="h-fit">
        <SectionHead id="h-fit" eyebrow="Is it right for you?" title="Who we work best with." lead="We'd rather tell you now than take a fee for the wrong job." />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-insight-border border-t-4 border-t-accent bg-insight p-7">
            <h3 className="text-lg font-semibold text-heading">A good fit if…</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {SITE.goodFit.map((x) => (
                <li key={x} className="flex gap-3"><Check className="mt-1 size-4 shrink-0 text-accent" aria-hidden />{x}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border border-t-4 border-t-signal bg-surface p-7">
            <h3 className="text-lg font-semibold text-heading">Probably not for you if you want…</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {SITE.notFit.map((x) => (
                <li key={x} className="flex gap-3 text-muted"><X className="mt-1 size-4 shrink-0 text-signal-text" aria-hidden />{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <CtaBand title="Not sure which package fits?" body="Tell us about your business and we'll recommend one, with a fixed quote." />
    </>
  );
}
