import type { ReactNode } from "react";
import { ArrowUpRight, CheckCheck, Clock, Eye, Layers, ShieldCheck, Smile, Sparkles, Zap } from "lucide-react";
import type { BenefitArea, Briefing } from "@/lib/opportunities/types";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { FrameGlyph } from "@/components/brand/focus";
import { LogoMark } from "@/components/ui/logo";
import { CallRequestButton } from "./client";

const BENEFIT: Record<BenefitArea, { label: string; icon: typeof Clock }> = {
  time: { label: "Time", icon: Clock },
  consistency: { label: "Consistency", icon: CheckCheck },
  visibility: { label: "Visibility", icon: Eye },
  responsiveness: { label: "Responsiveness", icon: Zap },
  workload: { label: "Workload", icon: Layers },
  quality: { label: "Quality", icon: Sparkles },
  customer_experience: { label: "Customer experience", icon: Smile },
};

export const SECTIONS = [
  ["problem", "The problem"],
  ["assessment", "Our assessment"],
  ["solution", "Proposed solution"],
  ["benefits", "What could improve"],
  ["direction", "Recommended direction"],
  ["next", "Next steps"],
] as const;

function Section({ id, index, title, children }: { id: string; index: number; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`h-${id}`} className="scroll-mt-24 border-t border-border pt-10 sm:pt-12">
      <p className="text-xs font-semibold text-accent-text">Part {index} of {SECTIONS.length}</p>
      <h2 id={`h-${id}`} className="mt-1.5 flex items-center gap-2.5 text-[24px] leading-tight sm:text-[28px]"><FrameGlyph className="size-4 text-accent" />{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Bullets({ items, empty }: { items: string[]; empty?: string }) {
  if (!items.length) return <p className="text-muted">{empty ?? "None noted."}</p>;
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((x, i) => (
        <li key={i} className="flex gap-3 text-[15.5px] leading-7"><span aria-hidden className="mt-[11px] size-1.5 shrink-0 rounded-[2px] bg-accent" />{x}</li>
      ))}
    </ul>
  );
}

/** The call to action: the real calendar if configured, otherwise a real call request. */
export function DiscussCta({ bookingHref, token, requested, compact }: { bookingHref: string | null; token: string; requested: boolean; compact?: boolean }) {
  if (bookingHref) {
    return (
      <a href={bookingHref} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", compact ? "md" : "xl", compact ? "px-4" : undefined)}>
        Let’s Discuss Your Solution
        <span aria-hidden className="inline-flex transition-transform duration-150 group-hover:translate-x-0.5"><ArrowUpRight className="size-4" /></span>
        <span className="sr-only"> (opens the booking calendar in a new tab)</span>
      </a>
    );
  }
  // Without a calendar, the top-of-page CTA takes them to the real call request at the end.
  if (compact) return <a href="#next" className={buttonClass("primary", "md", "px-4")}>Let’s Discuss Your Solution</a>;
  return <CallRequestButton token={token} requested={requested} />;
}

export function BriefingDocument({ b, bookingHref, token, requested }: { b: Briefing; bookingHref: string | null; token: string; requested: boolean }) {
  return (
    <div className="flex flex-col gap-12 sm:gap-14">
      <Section id="problem" index={1} title="The problem">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["The challenge", b.summary.challenge],
            ["What it affects", b.summary.affects],
            ["The underlying issue", b.summary.underlyingIssue],
          ].map(([k, v], i) => (
            <div key={k} className={cn("rounded-card border p-5", i === 2 ? "frame border-accent/40 bg-accent-soft/50" : "border-border bg-surface")}>
              <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-heading">{k}</h3>
              <p className="mt-2 text-[15.5px] leading-7 text-text">{v}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="assessment" index={2} title="Our assessment">
        <h3 className="text-[26px] leading-tight font-semibold tracking-[-0.025em] text-heading sm:text-[32px]">Why it <span className="accent-word">matters</span></h3>
        <p className="mt-4 max-w-3xl text-[17px] leading-8 text-text">{b.assessment.whyItMatters}</p>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-3 font-semibold text-heading">Possible consequences</h3>
            <Bullets items={b.assessment.consequences} />
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-heading">What we’re assuming</h3>
            <Bullets items={b.assessment.assumptions} />
          </div>
        </div>
        {b.assessment.questions.length > 0 && (
          <div className="mt-8 rounded-card bg-surface-2 p-6">
            <h3 className="font-semibold text-heading">Questions that would sharpen this</h3>
            <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-[15.5px] leading-7 marker:font-semibold marker:text-accent-text">
              {b.assessment.questions.map((q, i) => <li key={i}>{q}</li>)}
            </ol>
          </div>
        )}
      </Section>

      <Section id="solution" index={3} title="Proposed solution">
        <div className="theme-ink brand-hero hero-grid frame frame-inset relative overflow-hidden rounded-panel p-6 sm:p-10">
          <p className="text-sm font-semibold text-signal">The direction we’d explore</p>
          <h3 className="mt-3 text-[30px] leading-[1.05] font-semibold tracking-[-0.03em] text-heading sm:text-[40px]">{b.solution.name}</h3>
          <p className="mt-4 max-w-3xl text-[17px] leading-8 text-muted">{b.solution.concept}</p>
          {b.solution.howItWorks.length > 0 && (
            <ol className="relative mt-8 flex flex-col gap-5" aria-label="How it could work">
              <span aria-hidden className="absolute top-2 bottom-2 left-[11px] w-px bg-gradient-to-b from-border-strong to-signal" />
              {b.solution.howItWorks.map((s, i) => {
                const last = i === b.solution.howItWorks.length - 1;
                return (
                  <li key={i} className="relative flex gap-4">
                    <span aria-hidden className={cn("relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-[12px] font-semibold", last ? "border-signal bg-signal text-[var(--bg)]" : "border-border-strong bg-[var(--bg)] text-heading")}>{i + 1}</span>
                    <p className="text-[15.5px] leading-7 text-text">{s}</p>
                  </li>
                );
              })}
            </ol>
          )}
          {b.solution.approaches.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-2" aria-label="Approaches involved">
              {b.solution.approaches.map((a, i) => <li key={i} className="rounded-md border border-border bg-surface/50 px-3 py-1 text-sm text-muted">{a}</li>)}
            </ul>
          )}
        </div>
      </Section>

      <Section id="benefits" index={4} title="What could improve">
        <ul className="grid gap-3 sm:grid-cols-2">
          {b.benefits.map((x, i) => {
            const m = BENEFIT[x.area];
            return (
              <li key={i} className="flex gap-4 rounded-card border border-border bg-surface p-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-text" aria-hidden><m.icon className="size-5" /></span>
                <div>
                  <h3 className="font-semibold text-heading">{m.label}</h3>
                  <p className="mt-1 text-[15px] leading-7 text-text">{x.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-sm text-subtle">Possible improvements, not promises. How much they matter depends on details we’d confirm together.</p>
      </Section>

      <Section id="direction" index={5} title="Recommended direction">
        <p className="max-w-3xl text-[17px] leading-8 text-text">{b.direction.approach}</p>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div><h3 className="mb-3 font-semibold text-heading">What we’d look into first</h3><Bullets items={b.direction.investigate} /></div>
          <div><h3 className="mb-3 font-semibold text-heading">What it may depend on</h3><Bullets items={b.direction.dependencies} /></div>
        </div>
        {b.alternatives.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-3 font-semibold text-heading">Other directions worth knowing about</h3>
            <ul className="grid gap-3 sm:grid-cols-2">
              {b.alternatives.map((a, i) => <li key={i} className="rounded-card border border-dashed border-border-strong p-5"><p className="font-medium text-heading">{a.name}</p><p className="mt-1 text-[15px] text-muted">{a.when}</p></li>)}
            </ul>
          </div>
        )}
      </Section>

      <Section id="next" index={6} title="Next steps">
        <div className="grid gap-8 md:grid-cols-2">
          <div><h3 className="mb-3 font-semibold text-heading">What we’d clarify together</h3><Bullets items={b.nextSteps.clarify} /></div>
          <div><h3 className="mb-3 font-semibold text-heading">What would help us prepare</h3><Bullets items={b.nextSteps.information} /></div>
        </div>
        <div className="theme-ink brand-hero hero-grid relative mt-10 overflow-hidden rounded-panel px-6 py-10 sm:px-10 sm:py-12">
          <LogoMark size={36} label={null} />
          <p className="mt-6 text-sm font-semibold text-signal">The next step</p>
          <h3 className="mt-3 max-w-2xl text-[30px] leading-[1.05] font-semibold tracking-[-0.03em] text-heading sm:text-[42px]">Let’s discuss <span className="accent-word">your solution.</span></h3>
          <p className="mt-4 max-w-2xl text-[16.5px] leading-8 text-muted">{b.nextSteps.howWeHelp} This briefing is an initial assessment: a conversation lets us check our understanding, clarify what you need, and work out the best way forward.</p>
          <div className="mt-8"><DiscussCta bookingHref={bookingHref} token={token} requested={requested} /></div>
        </div>
      </Section>

      <aside className="flex gap-3 rounded-card border border-border bg-surface p-5 text-sm leading-6 text-muted" aria-label="About this briefing">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
        <p>
          <span className="font-medium text-text">Scope. </span>
          This briefing is based only on what you told us, prepared with the help of AI and written for you. It hasn’t been validated against your systems, and it isn’t a quote, specification or guarantee of results. Confidence in this initial read: <span className="font-medium text-text">{b.confidence}</span>. {b.confidenceNote}
        </p>
      </aside>
    </div>
  );
}
