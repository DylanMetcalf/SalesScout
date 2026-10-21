import { Check, CircleDashed, HelpCircle, Minus, X } from "lucide-react";
import { SITE } from "@/content/site";
import { CtaBand, PageHero, Section, SectionHead } from "@/components/site/chrome";
import { IconGrid, ProblemSolution } from "@/components/site/visuals";
import { cn } from "@/components/ui/cn";

export const metadata = {
  title: "Why Sales Scout",
  description: "What sellers struggle with, what we do differently, and why we're the right people to help.",
};

const MARK = {
  yes: { icon: Check, label: "Yes", className: "bg-accent text-accent-fg" },
  no: { icon: X, label: "No", className: "bg-surface-3 text-subtle" },
  partly: { icon: Minus, label: "Partly", className: "bg-signal-soft text-signal-text" },
  sometimes: { icon: Minus, label: "Sometimes", className: "bg-signal-soft text-signal-text" },
  rarely: { icon: Minus, label: "Rarely", className: "bg-surface-3 text-muted" },
  varies: { icon: CircleDashed, label: "Varies", className: "bg-surface-3 text-muted" },
} as const;

/** A typical list row next to a Sales Scout lead. */
function BeforeAfter() {
  return (
    <div className="theme-paper grid gap-3 sm:grid-cols-2" role="img" aria-label="A typical lead list row compared with a Sales Scout lead">
      <div className="rounded-2xl border border-border bg-surface p-5 text-text shadow-lg">
        <p className="text-xs font-semibold tracking-wide text-subtle uppercase">Typical list</p>
        <ul className="mt-4 flex flex-col gap-2.5 text-sm">
          {["Company name", "Generic info@ email", "Guessed job title", "No reason to call", "No source"].map((x) => (
            <li key={x} className="flex items-center gap-2 text-muted"><HelpCircle className="size-4 text-subtle" aria-hidden />{x}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-border border-t-4 border-t-accent bg-surface p-5 text-text shadow-lg">
        <p className="text-xs font-semibold tracking-wide text-accent-text uppercase">Sales Scout lead</p>
        <ul className="mt-4 flex flex-col gap-2.5 text-sm">
          {["Verified company", "Reason it needs you", "Buyer, named if public", "Fit on 6 dimensions", "Sources linked"].map((x) => (
            <li key={x} className="flex items-center gap-2"><Check className="size-4 text-accent" aria-hidden />{x}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function WhyUs() {
  const { comparison } = SITE;
  const ours = comparison.columns.length - 1;
  return (
    <>
      <PageHero eyebrow="Why Sales Scout" title="Selling got noisier. We make it specific." body="Six problems sellers face, and exactly how we fix each one." visual={<BeforeAfter />} />

      <Section id="struggle">
        <SectionHead id="h-struggle" eyebrow="Problem → solution" title="What's broken, and what we do instead." />
        <div className="mt-12"><ProblemSolution items={SITE.problems} /></div>
      </Section>

      <Section id="compare" band>
        <SectionHead id="h-compare" eyebrow="What we do differently" title="How we compare." />
        <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <table className="w-full table-fixed border-collapse text-left text-[13px] sm:text-[15px]">
            <caption className="sr-only">Sales Scout compared with lead lists, SDR agencies and DIY AI tools</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="w-[38%] p-2.5 sm:w-[34%] sm:p-4"><span className="sr-only">Capability</span></th>
                {comparison.columns.map((c, i) => (
                  <th key={c} scope="col" className={cn("px-1 py-3 text-center text-[11px] leading-tight font-semibold sm:p-4 sm:text-sm", i === ours ? "bg-accent text-accent-fg" : "text-heading")}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map((r) => (
                <tr key={r.label} className="border-b border-border last:border-0">
                  <th scope="row" className="p-2.5 font-medium sm:p-4">{r.label}</th>
                  {r.values.map((v, i) => {
                    const m = MARK[v as keyof typeof MARK];
                    const Icon = m.icon;
                    return (
                      <td key={i} className={cn("px-1 py-2.5 text-center sm:p-4", i === ours && "bg-accent-soft/60")}>
                        <span className={cn("inline-flex size-6 items-center justify-center rounded-full sm:size-7", m.className)} title={m.label}>
                          <Icon className="size-4" aria-hidden />
                          <span className="sr-only">{m.label}</span>
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-subtle">
          <p>{comparison.note}</p>
          <p className="flex flex-wrap gap-4">
            {(["yes", "partly", "no"] as const).map((k) => {
              const Icon = MARK[k].icon;
              return <span key={k} className="flex items-center gap-1.5"><span className={cn("flex size-4 items-center justify-center rounded-full", MARK[k].className)}><Icon className="size-2.5" aria-hidden /></span>{MARK[k].label}</span>;
            })}
          </p>
        </div>
        <div className="mt-14"><IconGrid items={SITE.differences} cols={4} tone="solid" /></div>
      </Section>

      <section className="px-3 py-20 sm:px-5" aria-labelledby="h-whyus">
        <div className="theme-ink brand-hero hero-grid mx-auto max-w-7xl rounded-3xl px-6 py-16 sm:px-12">
          <SectionHead id="h-whyus" eyebrow="Why us" title="The right people for this job." />
          <div className="mt-12"><IconGrid items={SITE.whyUs} cols={4} /></div>
        </div>
      </section>

      <CtaBand title="See a properly researched shortlist." />
    </>
  );
}
