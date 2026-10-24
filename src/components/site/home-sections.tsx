import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, EyeOff, Lock, Trash2, UserRound } from "lucide-react";
import { SITE } from "@/content/site";
import { LogoMark } from "@/components/ui/logo";
import { cn } from "@/components/ui/cn";

/** Eight problem cards and an ink card for "something else". The focus frame closes in on hover. */
export function CategoryGrid() {
  return (
    <ul className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {SITE.solve.map((c) => (
        <li key={c.title} className="reveal">
          <Link
            href={`/start?area=${encodeURIComponent(c.area)}`}
            className="frame frame-hover group/card flex h-full min-h-[172px] flex-col rounded-card border border-border bg-surface p-4 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md sm:min-h-[196px] sm:p-5"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-accent-soft text-accent-text transition-colors duration-200 group-hover/card:bg-accent group-hover/card:text-accent-fg" aria-hidden>
              <c.icon className="size-5" />
            </span>
            <h3 className="mt-5 text-[17px] leading-tight font-semibold tracking-[-0.015em] text-heading sm:text-[19px]">{c.title}</h3>
            <p className="mt-1.5 text-sm text-muted">{c.text}</p>
            <p className="mt-auto flex items-end justify-between gap-3 pt-4 text-sm">
              <span className="hidden text-subtle sm:inline"><span className="sr-only">For example: </span>“{c.example}”</span>
              <ArrowUpRight className="size-4 shrink-0 text-accent-text transition-transform duration-200 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5" aria-hidden />
            </p>
          </Link>
        </li>
      ))}
      <li className="reveal col-span-2 lg:col-span-4">
        <Link href="/start" className="theme-ink brand-hero group/card flex flex-col items-start justify-between gap-5 rounded-card p-6 transition-transform duration-200 hover:-translate-y-0.5 sm:flex-row sm:items-center sm:p-7">
          <p className="text-[22px] leading-tight font-semibold tracking-[-0.02em] text-heading sm:text-[26px]">Not on the list? <span className="accent-word">Describe it in your own words.</span></p>
          <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-accent-text">{SITE.cta} <ArrowRight className="size-4 transition-transform group-hover/card:translate-x-0.5" aria-hidden /></span>
        </Link>
      </li>
    </ul>
  );
}

/** How it works: three nodes on one signal path. You only do the first. */
export function ProcessRoute() {
  const outcomes = ["Your problem, in your words", "A private briefing, usually within minutes", "A practical next step, or an honest no"];
  return (
    <ol className="relative mt-14 grid gap-5 md:grid-cols-3">
      <span aria-hidden className="absolute top-[22px] right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-border-strong via-accent to-accent md:block" />
      {SITE.steps.map((s, i) => {
        const last = i === SITE.steps.length - 1;
        return (
          <li key={s.title} className="reveal relative flex flex-col items-start md:items-center md:text-center">
            <span aria-hidden className={cn("relative z-10 flex size-11 items-center justify-center rounded-full border text-[15px] font-semibold", last ? "border-accent bg-accent text-accent-fg" : "border-border-strong bg-surface text-heading")}>
              {i + 1}
            </span>
            <div className={cn("mt-5 w-full flex-1 rounded-card border bg-surface p-6 text-left shadow-sm", last ? "frame border-accent/40" : "border-border")}>
              <p className={cn("text-xs font-semibold", i === 0 ? "text-accent-text" : "text-subtle")}>{i === 0 ? "You do this" : "We do this"}</p>
              <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.02em] text-heading">{s.title}</h3>
              <p className="mt-2 text-[15px] text-muted">{s.text}</p>
              <p className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-sm text-text">
                <s.icon className="size-4 shrink-0 text-accent" aria-hidden /> {outcomes[i]}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** A labelled example of the briefing, drawn in the briefing's own identity. */
export function ExampleOutput() {
  const r = SITE.routes[2];
  return (
    <div className="mt-12 grid items-center gap-6 lg:grid-cols-[0.85fr_1.35fr] lg:gap-10">
      <figure className="reveal rounded-card border border-border bg-surface p-6 shadow-sm">
        <figcaption className="text-sm font-semibold text-subtle">What you send</figcaption>
        <blockquote className="mt-4 border-l-2 border-accent pl-4 text-[17px] leading-7 text-heading">“{r.said}”</blockquote>
        <p className="mt-5 text-sm text-muted">A few sentences. No forms full of jargon, no technical terms.</p>
      </figure>
      <figure className="reveal relative">
        <span className="theme-ink caption-mono absolute -top-3 right-5 z-10 rounded-md border border-border bg-[var(--bg)] px-2.5 py-1 text-heading">Example</span>
        <div className="overflow-hidden rounded-card border border-border bg-surface shadow-lg">
          <div className="theme-ink brand-hero hero-grid px-6 pt-6 pb-6 sm:px-7">
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted"><LogoMark size={18} label={null} /> Business Problem &amp; Solution Briefing <span className="caption-mono text-subtle">SSB-EXAM-PLE1</span></p>
            <p className="mt-4 text-[24px] leading-tight font-semibold tracking-[-0.03em] text-heading sm:text-[28px]">Getting every order entered once</p>
          </div>
          <div className="grid gap-4 px-6 py-5 sm:px-7">
            <div>
              <p className="text-xs font-semibold text-accent-text">The problem</p>
              <p className="mt-1.5 text-sm leading-6 text-text">Orders are typed into three systems, so the busiest days carry the most risk of a missed order. The friction appears to be the hand-off between systems, not the people.</p>
            </div>
            <div className="frame rounded-xl border border-accent/30 bg-accent-soft/50 p-4">
              <p className="text-xs font-semibold text-accent-text">Proposed solution</p>
              <p className="mt-1.5 text-[17px] font-semibold tracking-[-0.01em] text-heading">{r.steps[1].text.replace(/\.$/, "")}</p>
            </div>
            <ul className="grid gap-1.5 text-sm text-muted sm:grid-cols-2">
              {["What we understood", "Why it matters", "What we’d clarify", "A sensible first step"].map((t) => (
                <li key={t} className="flex items-center gap-2"><Check className="size-4 text-strong" aria-hidden /> {t}</li>
              ))}
            </ul>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-sm text-muted">Then: a short conversation.</p>
              <span aria-hidden className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg">Let’s Discuss Your Solution</span>
            </div>
          </div>
          <figcaption className="border-t border-border bg-surface-2/60 px-6 py-3 text-xs text-muted sm:px-7">Illustrative. Your briefing is written for your problem, is private to you and is viewed online.</figcaption>
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
