import Link from "next/link";
import { ArrowRight, Check, ChevronRight, type LucideIcon } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";

/*
 * Infographic building blocks for the public site. Icons and layout carry the
 * message; text stays to a few words per item.
 */

type Item = { icon: LucideIcon; title: string; text: string };

export function IconBadge({ icon: Icon, tone = "soft", className }: { icon: LucideIcon; tone?: "soft" | "solid" | "signal" | "muted"; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-xl",
        tone === "solid" && "bg-gradient-to-br from-accent to-accent-bright text-accent-fg shadow-[0_8px_20px_-10px_var(--accent)]",
        tone === "soft" && "bg-accent-soft text-accent-text",
        tone === "signal" && "bg-signal-soft text-signal-text",
        tone === "muted" && "bg-surface-2 text-subtle",
        className,
      )}
      aria-hidden
    >
      <Icon className="size-5" />
    </span>
  );
}

/** Grid of icon + title + one line. */
export function IconGrid({ items, cols = 3, tone = "soft", card = true }: { items: Item[]; cols?: 1 | 2 | 3 | 4; tone?: "soft" | "solid"; card?: boolean }) {
  return (
    <ul className={cn("grid gap-4 sm:grid-cols-2", cols === 1 && "lg:grid-cols-1", cols === 3 && "lg:grid-cols-3", cols === 4 && "lg:grid-cols-4")}>
      {items.map((it) => (
        <li key={it.title} className={cn("flex items-start gap-4", card && "rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-md")}>
          <IconBadge icon={it.icon} tone={tone} />
          <div>
            <h3 className="font-semibold text-heading">{it.title}</h3>
            <p className="mt-0.5 text-[15px] leading-6 text-muted">{it.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Numbered process flow: horizontal on desktop, vertical on phones. */
export function FlowDiagram({ steps }: { steps: Item[] }) {
  return (
    <ol className="relative grid gap-6 lg:grid-cols-5 lg:gap-4">
      <span className="absolute top-7 right-[10%] left-[10%] hidden h-0.5 bg-gradient-to-r from-accent/20 via-accent to-accent-bright lg:block" aria-hidden />
      <span className="absolute top-7 bottom-7 left-7 w-0.5 bg-gradient-to-b from-accent/20 via-accent to-accent-bright lg:hidden" aria-hidden />
      {steps.map((s, i) => {
        const Icon = s.icon;
        const last = i === steps.length - 1;
        return (
          <li key={s.title} className="relative flex items-center gap-4 lg:flex-col lg:text-center">
            <span
              className={cn(
                "relative z-10 flex size-14 shrink-0 items-center justify-center rounded-2xl ring-4 ring-bg",
                last ? "bg-gradient-to-br from-accent to-accent-bright text-accent-fg shadow-[0_10px_24px_-10px_var(--accent)]" : "border border-border bg-surface text-accent-text shadow-sm",
              )}
            >
              <Icon className="size-6" aria-hidden />
              <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-heading font-mono text-[10px] font-semibold text-bg">{i + 1}</span>
            </span>
            <div className="lg:mt-3">
              <h3 className="font-semibold text-heading">{s.title}</h3>
              <p className="text-sm text-muted">{s.text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Problem → our answer, one row each. */
export function ProblemSolution({ items }: { items: (Item & { answer: string })[] }) {
  return (
    <ul className="grid gap-3">
      {items.map((p) => (
        <li key={p.title} className="grid items-center gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5 md:grid-cols-[1fr_auto_1fr] md:gap-6">
          <div className="flex items-center gap-4">
            <IconBadge icon={p.icon} tone="signal" />
            <div>
              <h3 className="font-semibold text-heading">{p.title}</h3>
              <p className="text-[15px] text-muted">{p.text}</p>
            </div>
          </div>
          <ArrowRight className="hidden size-5 text-accent md:block" aria-hidden />
          <p className="flex items-center gap-3 rounded-xl border border-insight-border bg-insight px-4 py-3 text-[15px] font-medium text-text">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg" aria-hidden>
              <Check className="size-3.5" />
            </span>
            <span><span className="sr-only">Our answer: </span>{p.answer}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}

/** How a market narrows to a shortlist. Widths are illustrative, not data. */
export function VettingFunnel() {
  const stages = [
    { label: "Companies found", note: "Public sources searched", w: "100%", cls: "bg-surface-3 text-text" },
    { label: "Checked for fit", note: "Need, size, region, evidence", w: "78%", cls: "bg-accent-soft text-accent-text" },
    { label: "Duplicates & clients removed", note: "Competitors excluded", w: "58%", cls: "bg-insight text-accent-text border border-insight-border" },
    { label: "Your shortlist", note: "Briefed and ready", w: "38%", cls: "bg-gradient-to-r from-accent to-accent-bright text-accent-fg shadow-[0_10px_24px_-12px_var(--accent)]" },
  ];
  return (
    <figure className="flex flex-col items-center gap-2.5" aria-label="How a market narrows to your shortlist">
      {stages.map((s) => (
        <div key={s.label} style={{ width: s.w }} className={cn("flex min-w-[240px] items-center justify-between gap-3 rounded-xl px-4 py-3", s.cls)}>
          <span className="text-sm font-semibold">{s.label}</span>
          <span className="hidden text-xs opacity-80 sm:inline">{s.note}</span>
        </div>
      ))}
      <figcaption className="mt-2 text-xs text-subtle">Illustrative. Only companies that pass every check reach you.</figcaption>
    </figure>
  );
}

/** Pricing tier with the lead volume as the hero number. */
export function TierCard({ name, leads, summary, items, featured }: { name: string; leads: string; summary: string; items: string[]; featured: boolean }) {
  return (
    <article className={cn("relative flex flex-col rounded-2xl p-7", featured ? "theme-ink brand-hero shadow-lg lg:-my-4 lg:py-11" : "border border-border bg-surface shadow-sm")}>
      {featured && <span className="absolute -top-3 left-7 rounded-full bg-signal px-3 py-1 text-xs font-semibold text-[var(--brand-deep)] shadow">Recommended</span>}
      <h3 className="text-sm font-semibold tracking-wide text-accent-text uppercase">{name}</h3>
      <p className="mt-4">
        <span className="block font-display text-5xl font-[700] tracking-tight whitespace-nowrap text-heading tabular-nums">{leads}</span>
        <span className="mt-1 block text-sm font-medium text-muted">qualified leads per month</span>
      </p>
      <p className="mt-2 text-muted">{summary}</p>
      <ul className="mt-6 flex flex-1 flex-col gap-2.5 border-t border-border pt-6">
        {items.map((it) => (
          <li key={it} className="flex gap-2.5 text-[15px]">
            <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
            {it}
          </li>
        ))}
      </ul>
      <ButtonLink href="/contact" variant={featured ? "primary" : "secondary"} className="mt-8 w-full" size="lg">
        Get a quote
      </ButtonLink>
    </article>
  );
}

/** Small inline list of icon + label chips. */
export function ProofChips({ items, className }: { items: { icon: LucideIcon; label: string }[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-5 gap-y-2", className)}>
      {items.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-2 text-sm text-muted">
          <Icon className="size-4 text-accent" aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}

export function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 font-medium text-accent-text hover:underline">
      {children} <ChevronRight className="size-4" aria-hidden />
    </Link>
  );
}
