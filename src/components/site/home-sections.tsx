import Link from "next/link";
import { ArrowRight, ArrowUpRight, EyeOff, Lock, Trash2, UserRound } from "lucide-react";
import { SITE, type Hue } from "@/content/site";
import { LogoMark } from "@/components/ui/logo";
import { cn } from "@/components/ui/cn";
import { HUE_VAR } from "./hues";

const hue = (h: Hue) => ({ ["--hue" as string]: HUE_VAR[h] });

/** Eight colour-coded problem cards, two of them wide, plus an ink card for "something else". */
export function CategoryGrid() {
  const wide = new Set([0, 5]);
  return (
    <ul className="mt-14 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      {SITE.solve.map((c, i) => (
        <li key={c.title} className={cn("reveal", wide.has(i) && "lg:col-span-2")}>
          <Link
            href={`/start?area=${encodeURIComponent(c.area)}`}
            style={hue(c.hue)}
            className="hue group/card relative flex h-full min-h-[168px] flex-col overflow-hidden rounded-card border border-border bg-surface p-4 sm:min-h-[200px] sm:p-5 transition-[background,border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[var(--hue-line)] hover:bg-[var(--hue-soft)] hover:shadow-md focus-visible:border-[var(--hue-line)] focus-visible:bg-[var(--hue-soft)]"
          >
            <div className="flex items-start justify-between">
              <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--hue-soft)] text-[var(--hue-ink)] transition-[background,color,transform] duration-200 group-hover/card:-rotate-6 group-hover/card:bg-[var(--hue)] group-hover/card:text-bg" aria-hidden>
                <c.icon className="size-5" />
              </span>
              <span className="caption-mono text-subtle">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <h3 className={cn("mt-5 font-display text-[18px] leading-tight font-[620] tracking-[-0.02em] text-heading sm:mt-6", wide.has(i) ? "sm:text-[28px]" : "sm:text-[20px]")}>{c.title}</h3>
            <p className="mt-1.5 text-sm text-muted sm:text-[15px]">{c.text}</p>
            <p className="mt-auto flex items-end justify-between gap-3 pt-5 text-sm">
              <span className="hidden text-subtle sm:inline"><span className="sr-only">For example: </span>“{c.example}”</span>
              <ArrowUpRight className="size-4 shrink-0 text-[var(--hue-ink)] transition-transform duration-200 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5" aria-hidden />
            </p>
          </Link>
        </li>
      ))}
      <li className="reveal col-span-2">
        <Link href="/start" className="theme-ink group/card relative flex h-full min-h-[200px] flex-col justify-between overflow-hidden rounded-card bg-[var(--bg)] p-6 transition-transform duration-200 hover:-translate-y-0.5">
          <span className="caption-mono text-subtle">09 · Something else</span>
          <div>
            <p className="font-display text-[26px] leading-tight font-[620] tracking-[-0.02em] text-heading sm:text-[30px]">Not on the list? <span className="accent-serif text-signal">Describe it</span> in your own words.</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent-text">{SITE.cta} <ArrowRight className="size-4 transition-transform group-hover/card:translate-x-0.5" aria-hidden /></span>
          </div>
        </Link>
      </li>
    </ul>
  );
}

/** How it works: three waypoints on one route. You only do the first. */
export function ProcessRoute() {
  const outcomes = ["Your problem, in your words", "A clearer picture and the right questions", "A practical next step, or an honest no"];
  return (
    <div className="relative mt-16">
      <svg aria-hidden className="pointer-events-none absolute top-[38px] left-0 hidden h-10 w-full md:block" viewBox="0 0 1000 40" preserveAspectRatio="none" fill="none">
        <path d="M40 20 C 200 20 220 4 340 4 S 520 36 660 36 S 860 20 960 20" stroke="var(--signal)" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="route-on-view" style={{ ["--route-len" as string]: "1100" }} />
      </svg>
      <ol className="relative grid gap-6 md:grid-cols-3 md:gap-8">
        {SITE.steps.map((s, i) => {
          const last = i === SITE.steps.length - 1;
          return (
            <li key={s.title} className="reveal relative">
              <div className="flex items-center gap-4">
                <span aria-hidden className={cn("relative flex size-[76px] items-center justify-center rounded-full border-2 bg-bg", last ? "border-signal" : "border-text")}>
                  <span className={cn("accent-serif text-[40px] leading-none", last ? "text-signal" : "text-heading")}>{i + 1}</span>
                </span>
                {i === 0 && <span className="rounded-full bg-signal-soft px-2.5 py-1 text-xs font-semibold text-signal-text">You do this</span>}
                {i > 0 && <span className="rounded-full bg-surface-3 px-2.5 py-1 text-xs font-semibold text-muted">We do this</span>}
              </div>
              <div className="mt-6 rounded-card border border-border bg-surface p-6">
                <h3 className="font-display text-[22px] font-[620] tracking-[-0.02em] text-heading">{s.title}</h3>
                <p className="mt-2 text-[15px] text-muted">{s.text}</p>
                <p className="mt-5 flex items-center gap-2 border-t border-dashed border-border pt-4 text-sm text-text">
                  <s.icon className="size-4 shrink-0 text-accent" aria-hidden /> {outcomes[i]}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** What the conversation produces, shown as a labelled example of the real assessment document. */
export function ExampleOutput() {
  const r = SITE.routes[2];
  return (
    <div className="mt-14 grid items-center gap-8 lg:grid-cols-[0.9fr_auto_1.3fr] lg:gap-6">
      <figure className="reveal rounded-card border border-border bg-surface p-6 shadow-sm">
        <figcaption className="caption-mono text-subtle">What you send</figcaption>
        <blockquote className="mt-4 border-l-2 border-signal pl-4 text-[17px] leading-7 text-heading">“{r.said}”</blockquote>
        <p className="mt-5 text-sm text-muted">A few sentences. No forms full of jargon, no technical terms.</p>
      </figure>
      <div aria-hidden className="flex justify-center lg:flex-col lg:items-center">
        <svg viewBox="0 0 80 24" className="w-20 rotate-90 lg:rotate-0" fill="none">
          <path d="M2 12 H64" stroke="var(--signal)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 7" />
          <circle cx="72" cy="12" r="5" fill="var(--signal)" />
        </svg>
      </div>
      <figure className="reveal relative">
        <span className="absolute -top-3 right-5 z-10 rounded-full bg-text px-3 py-1 text-xs font-semibold text-bg">Example</span>
        <div className="rotate-[0.6deg] rounded-[14px] border border-border bg-white p-6 shadow-lg sm:p-8 text-[#16161d]">
          <div className="flex items-center justify-between border-b-2 border-[#2f45e0] pb-3">
            <span className="flex items-center gap-2"><LogoMark size={22} label={null} /><span className="font-display text-sm font-[650]">Sales Scout</span></span>
            <span className="caption-mono text-[#5f5e68]">Problem assessment · v1</span>
          </div>
          <p className="caption-mono mt-5 text-[#2638c8]">Our understanding so far</p>
          <p className="mt-1.5 text-sm leading-6">Orders are entered three times, so the busiest days carry the most risk of a missed order. The friction appears to be the hand-off between systems, not the people.</p>
          <p className="caption-mono mt-5 text-[#2638c8]">What we’d like to understand next</p>
          <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-sm leading-6">
            {r.steps.slice(0, 1).map((s) => <li key={s.text}>{s.text}</li>)}
            <li>Roughly how many orders arrive on a busy day?</li>
          </ol>
          <p className="caption-mono mt-5 text-[#2638c8]">Possible direction</p>
          <p className="mt-1.5 text-sm leading-6">{r.steps[1].text}</p>
          <figcaption className="mt-6 border-t border-[#ddd7cb] pt-3 text-xs text-[#5f5e68]">Illustrative. Your assessment is written by us after reading your problem, and is never sent automatically.</figcaption>
        </div>
      </figure>
    </div>
  );
}

/** Reassurance about what happens to what they share. Plain facts, all true of the product today. */
export function PrivacyStrip() {
  const items = [
    { icon: UserRound, text: "Read by a person, not just a machine" },
    { icon: Lock, text: "Private to our team" },
    { icon: EyeOff, text: "Never added to a mailing list" },
    { icon: Trash2, text: "Deleted whenever you ask" },
  ];
  return (
    <ul className="mt-12 grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
      {items.map((x) => (
        <li key={x.text} className="flex items-center gap-3 bg-surface px-5 py-4 text-[15px]">
          <x.icon className="size-4 shrink-0 text-accent" aria-hidden /> {x.text}
        </li>
      ))}
    </ul>
  );
}
