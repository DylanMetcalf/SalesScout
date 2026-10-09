import { Check, CircleDashed, Minus, X } from "lucide-react";
import { SITE } from "@/content/site";
import { CtaBand, PageHero, SectionHead } from "@/components/site/chrome";
import { Needle } from "@/components/ui/needle";
import { cn } from "@/components/ui/cn";

export const metadata = {
  title: "Why Sales Scout",
  description: "What sellers are struggling with, what we do differently, and why we're the right people to help.",
};

const MARK = {
  yes: { icon: Check, label: "Yes", className: "bg-accent text-accent-fg" },
  no: { icon: X, label: "No", className: "bg-surface-2 text-subtle" },
  partly: { icon: Minus, label: "Partly", className: "bg-signal-soft text-signal-text" },
  sometimes: { icon: Minus, label: "Sometimes", className: "bg-signal-soft text-signal-text" },
  rarely: { icon: Minus, label: "Rarely", className: "bg-surface-2 text-muted" },
  varies: { icon: CircleDashed, label: "Varies", className: "bg-surface-2 text-muted" },
} as const;

export default function WhyUs() {
  const { comparison } = SITE;
  const ours = comparison.columns.length - 1;
  return (
    <>
      <PageHero
        eyebrow="Why Sales Scout"
        title="Selling got noisier. We make it specific again."
        body="Buyers are harder to reach, tools promise more than they deliver, and good research takes time nobody has. Here's what's going wrong, and what we do about it."
      />

      {/* Problem → answer */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6" aria-labelledby="h-struggle">
        <SectionHead id="h-struggle" eyebrow="What sellers are struggling with" title="Six problems we hear again and again." lead="None of these are solved by more data. They're solved by better research and more honesty about what's known." />
        <ol className="mt-12 flex flex-col gap-5">
          {SITE.problems.map((p, i) => (
            <li key={p.title} className="grid overflow-hidden rounded-2xl border border-border bg-surface md:grid-cols-2">
              <div className="p-6 sm:p-7">
                <p className="font-display text-sm font-[650] text-signal-text">The problem · 0{i + 1}</p>
                <h3 className="mt-2 text-xl font-semibold text-heading">{p.title}</h3>
                <p className="mt-2 leading-7 text-muted">{p.body}</p>
              </div>
              <div className="border-t border-insight-border bg-insight p-6 sm:p-7 md:border-l md:border-t-0">
                <p className="flex items-center gap-2 font-display text-sm font-[650] text-accent-text">
                  <Needle className="size-3.5" /> How we solve it
                </p>
                <p className="mt-2 text-[16px] leading-7">{p.answer}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Comparison */}
      <section className="border-y border-border bg-surface-2/70" aria-labelledby="h-compare">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionHead id="h-compare" eyebrow="What we do differently" title="How we compare with the usual options." />
          <div className="mt-12 overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
            <table className="w-full min-w-[720px] border-collapse text-left text-[15px]">
              <caption className="sr-only">Sales Scout compared with bought lead lists, outsourced SDR agencies and DIY AI tools</caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="p-4 font-medium text-muted"><span className="sr-only">Capability</span></th>
                  {comparison.columns.map((c, i) => (
                    <th key={c} scope="col" className={cn("p-4 text-center font-semibold", i === ours ? "bg-accent-soft text-accent-text" : "text-heading")}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.rows.map((r) => (
                  <tr key={r.label} className="border-b border-border last:border-0">
                    <th scope="row" className="p-4 font-medium text-text">{r.label}</th>
                    {r.values.map((v, i) => {
                      const m = MARK[v as keyof typeof MARK];
                      const Icon = m.icon;
                      return (
                        <td key={i} className={cn("p-4 text-center", i === ours && "bg-accent-soft/60")}>
                          <span className="inline-flex items-center gap-1.5">
                            <span className={cn("flex size-6 items-center justify-center rounded-full", m.className)}><Icon className="size-3.5" aria-hidden /></span>
                            <span className={cn("text-sm", i === ours ? "font-semibold text-accent-text" : "text-muted")}>{m.label}</span>
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-subtle">{comparison.note}</p>

          <ul className="mt-14 grid gap-6 sm:grid-cols-2">
            {SITE.differences.map((d, i) => (
              <li key={d.title} className="rounded-2xl border border-border bg-surface p-6">
                <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft font-display text-lg font-[650] text-accent-text" aria-hidden>{i + 1}</span>
                <h3 className="mt-4 text-lg font-semibold text-heading">{d.title}</h3>
                <p className="mt-2 leading-7 text-muted">{d.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Why us */}
      <section className="px-3 py-20 sm:px-5" aria-labelledby="h-whyus">
        <div className="theme-ink brand-hero mx-auto max-w-7xl rounded-3xl px-6 py-16 sm:px-12">
          <SectionHead id="h-whyus" eyebrow="Why us" title="Why we're the right people for this." lead="We built a research platform with one rule: if it can't be shown, it isn't said. Then we decided to run it for you." />
          <ul className="mt-12 grid gap-5 md:grid-cols-2">
            {SITE.whyUs.map((w) => (
              <li key={w.title} className="theme-paper rounded-2xl bg-surface p-6 text-text">
                <h3 className="text-lg font-semibold text-heading">{w.title}</h3>
                <p className="mt-2 leading-7 text-muted">{w.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand title="See what a properly researched shortlist looks like." />
    </>
  );
}
