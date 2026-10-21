import { ArrowRight, Ban, Database, Eye, FileClock, Filter, Gauge, KeyRound, Link2, ListChecks, type LucideIcon, MessageSquareText, MousePointerClick, Radio, Repeat2, Send, Smartphone, Table, Tags, Users } from "lucide-react";
import { SITE } from "@/content/site";
import { ButtonLink } from "@/components/ui/button";
import { CtaBand, Eyebrow, Section, SectionHead } from "@/components/site/chrome";
import { AppMock, DraftMock, ExportMock, FitMock, PipelineMock, ResearchMock } from "@/components/site/mocks";
import { IconBadge, IconGrid, ProofChips } from "@/components/site/visuals";
import { cn } from "@/components/ui/cn";

export const metadata = {
  title: "Platform",
  description: "AI research with source tracking, explainable fit, a built-in pipeline and outreach drafts you send yourself.",
};

type Feature = { icon: LucideIcon; eyebrow: string; title: string; points: { icon: LucideIcon; label: string }[]; Mock: () => React.ReactElement };

const FEATURES: Feature[] = [
  {
    icon: Radio,
    eyebrow: "Discover",
    title: "Describe your buyer. Watch it research.",
    points: [
      { icon: Link2, label: "Source-tracked web research" },
      { icon: Filter, label: "Duplicates, clients and competitors removed" },
      { icon: Eye, label: "Live progress, no black box" },
    ],
    Mock: ResearchMock,
  },
  {
    icon: Gauge,
    eyebrow: "Explainable fit",
    title: "Reasons you can read. Not a score.",
    points: [
      { icon: ListChecks, label: "Six dimensions, each explained" },
      { icon: Tags, label: "Confirmed · inferred · unknown, always labelled" },
      { icon: Link2, label: "A link behind every fact" },
    ],
    Mock: FitMock,
  },
  {
    icon: MessageSquareText,
    eyebrow: "Outreach",
    title: "Drafts in your voice. Sent by you.",
    points: [
      { icon: MousePointerClick, label: "Shorter, warmer or more direct in one click" },
      { icon: Send, label: "Copy to your own inbox" },
      { icon: Ban, label: "No auto-send. Ever." },
    ],
    Mock: DraftMock,
  },
  {
    icon: Users,
    eyebrow: "Pipeline",
    title: "A lightweight CRM, built in.",
    points: [
      { icon: ListChecks, label: "Stages, notes and follow-ups" },
      { icon: Eye, label: "A Today view of what needs you" },
      { icon: Smartphone, label: "Works on your phone" },
    ],
    Mock: PipelineMock,
  },
  {
    icon: Table,
    eyebrow: "Exports",
    title: "Take it to any CRM.",
    points: [
      { icon: Table, label: "Excel, CSV and client report" },
      { icon: Ban, label: "Blanks stay blank. Never guessed." },
    ],
    Mock: ExportMock,
  },
];

const UNDER_THE_HOOD = [
  { icon: Link2, title: "Source tracking", text: "Every fact stored with its page." },
  { icon: Tags, title: "Knowledge labels", text: "Confirmed vs inferred vs unknown." },
  { icon: Repeat2, title: "Learning loop", text: "Your feedback refines the search." },
  { icon: Database, title: "Isolated workspaces", text: "Enforced in app and database." },
  { icon: KeyRound, title: "Encrypted secrets", text: "Keys encrypted, never sent to browsers." },
  { icon: FileClock, title: "Audit trail", text: "See what changed, and why." },
];

export default function Platform() {
  return (
    <>
      <section className="px-3 pt-4 sm:px-5">
        <div className="theme-ink brand-hero hero-grid mx-auto grid max-w-7xl items-center gap-12 overflow-hidden rounded-3xl px-6 py-14 sm:px-12 sm:py-20 lg:grid-cols-[1fr_1.15fr]">
          <div className="animate-rise">
            <Eyebrow>The platform</Eyebrow>
            <h1 className="mt-4 text-[36px] leading-[1.06] sm:text-[52px]">Sales intelligence that shows its work.</h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-muted">Find, qualify, brief and reach out, from one workspace.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/contact" variant="primary" size="lg" icon={<ArrowRight className="size-4" />}>Book a demo call</ButtonLink>
              <ButtonLink href="/services" variant="ghost" size="lg">See pricing</ButtonLink>
            </div>
            <ProofChips items={SITE.hero.proof} className="mt-8" />
          </div>
          <div className="animate-rise [animation-delay:120ms]">
            <AppMock />
          </div>
        </div>
      </section>

      {/* Feature index */}
      <nav aria-label="Platform features" className="mx-auto mt-10 flex max-w-6xl flex-wrap justify-center gap-2 px-4">
        {FEATURES.map(({ icon: Icon, eyebrow }, i) => (
          <a key={eyebrow} href={`#f-${i}`} className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:border-accent hover:text-accent-text">
            <Icon className="size-4 text-accent" aria-hidden /> {eyebrow}
          </a>
        ))}
      </nav>

      <div className="mx-auto flex max-w-6xl flex-col gap-24 px-4 py-20 sm:px-6">
        {FEATURES.map(({ icon, eyebrow, title, points, Mock }, i) => (
          <section key={eyebrow} id={`f-${i}`} className="grid scroll-mt-24 items-center gap-10 lg:grid-cols-2 lg:gap-16" aria-labelledby={`h-f-${i}`}>
            <div className={cn(i % 2 === 1 && "lg:order-2")}>
              <IconBadge icon={icon} tone="solid" />
              <SectionHead id={`h-f-${i}`} eyebrow={eyebrow} title={title} className="mt-5" />
              <ul className="mt-6 flex flex-col gap-3">
                {points.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3 text-[16px]">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-accent-soft text-accent-text" aria-hidden><Icon className="size-4" /></span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <Mock />
          </section>
        ))}
      </div>

      <Section id="hood" band>
        <SectionHead id="h-hood" eyebrow="Under the hood" title="Trust is built into the software." center />
        <div className="mt-12"><IconGrid items={UNDER_THE_HOOD} cols={3} /></div>
      </Section>

      <Section id="ways">
        <SectionHead id="h-ways" eyebrow="Ways to use it" title="Done for you, or alongside you." center />
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          <article className="theme-ink brand-hero rounded-2xl p-7">
            <IconBadge icon={Send} tone="solid" />
            <h3 className="mt-5 font-display text-2xl font-[650] text-heading">Done for you</h3>
            <p className="mt-2 text-muted">We run it. You get the shortlist.</p>
          </article>
          <article className="rounded-2xl border border-border bg-surface p-7">
            <IconBadge icon={Eye} />
            <h3 className="mt-5 font-display text-2xl font-[650] text-heading">With your workspace</h3>
            <p className="mt-2 text-muted">Log in to see the research live, triage and export.</p>
          </article>
        </div>
      </Section>

      <CtaBand title="See it on your own market." body="We'll walk you through it with companies from your industry." />
    </>
  );
}
