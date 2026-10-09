import { ArrowRight, Database, Eye, FileClock, KeyRound, Link2, Repeat2, ShieldCheck, Tags } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { CtaBand, Eyebrow, SectionHead } from "@/components/site/chrome";
import { AppMock, DraftMock, ExportMock, FitMock, PipelineMock, ResearchMock } from "@/components/site/mocks";
import { cn } from "@/components/ui/cn";

export const metadata = {
  title: "Platform",
  description: "The Sales Scout platform: AI research with source tracking, explainable fit, a lightweight CRM and outreach drafts you send yourself.",
};

const FEATURES = [
  {
    eyebrow: "Discover",
    title: "Describe who you want. Watch it research.",
    body: "Ask in plain language: an industry, a region, a kind of buyer. The platform searches public sources, checks every company against your Company Brain and sets aside anything it can't verify. You see each step as it happens.",
    points: ["Searches the open web with source tracking", "Removes duplicates, competitors and existing customers", "Shows progress live, never a black box"],
    Mock: ResearchMock,
  },
  {
    eyebrow: "Explainable fit",
    title: "A reason you can read, not a score you have to trust.",
    body: "Each company is rated across six dimensions with a sentence of reasoning and the source behind it. Anything unconfirmed is labelled unknown, so you know exactly what to ask on the first call.",
    points: ["Six fit dimensions, each with evidence", "Confirmed, inferred, suggested and unknown, always labelled", "Every fact links to where it came from"],
    Mock: FitMock,
  },
  {
    eyebrow: "Outreach",
    title: "Drafts in your voice. Sent by you.",
    body: "The platform writes a first email or LinkedIn message grounded in something real about each company. You edit it, copy it and send it from your own inbox. Nothing is ever sent automatically.",
    points: ["Grounded in the company's own information", "Shorter, warmer or more direct in one click", "No auto-send, ever"],
    Mock: DraftMock,
  },
  {
    eyebrow: "Pipeline",
    title: "A lightweight CRM, built in.",
    body: "Keep the companies worth pursuing, move them through your stages, add notes and set follow-ups. Or skip it entirely and export to the CRM you already use.",
    points: ["Pipeline board, notes and follow-ups", "Today view: what needs you now", "Works on your phone"],
    Mock: PipelineMock,
  },
  {
    eyebrow: "Exports",
    title: "Take it anywhere.",
    body: "Download CRM-ready Excel or CSV, or a polished client report. Missing details stay blank, never filled with guesses.",
    points: ["Excel, CSV and report formats", "Clean columns for any CRM import", "Honest blanks, never invented data"],
    Mock: ExportMock,
  },
];

const UNDER_THE_HOOD = [
  { icon: Link2, title: "Source tracking", body: "Every company, person and contact detail is stored with the page it came from." },
  { icon: Tags, title: "Knowledge labels", body: "Confirmed, inferred, suggested and unknown are tracked separately and shown everywhere." },
  { icon: Repeat2, title: "Learning loop", body: "Your keeps, rejections and edits refine future searches. Strategy changes always need your approval." },
  { icon: Database, title: "Isolated workspaces", body: "Each client's data is kept separate, enforced in the application and in the database itself." },
  { icon: KeyRound, title: "Encrypted secrets", body: "API keys are encrypted at rest and never sent to the browser." },
  { icon: FileClock, title: "Audit trail", body: "Important actions are recorded, so you can always see what changed and why." },
];

export default function Platform() {
  return (
    <>
      <section className="px-3 pt-4 sm:px-5">
        <div className="theme-ink brand-hero mx-auto grid max-w-7xl items-center gap-12 overflow-hidden rounded-3xl px-6 py-14 sm:px-12 sm:py-20 lg:grid-cols-[1fr_1.15fr]">
          <div className="animate-rise">
            <Eyebrow>The platform</Eyebrow>
            <h1 className="mt-4 text-[36px] leading-[1.06] sm:text-[52px]">Sales intelligence software that shows its work.</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
              Sales Scout is our own AI research platform. It finds companies, explains why they fit, identifies who to speak to and prepares your outreach, with a source behind every fact.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/contact" variant="primary" size="lg" icon={<ArrowRight className="size-4" />}>Book a demo call</ButtonLink>
              <ButtonLink href="#ways" variant="ghost" size="lg">Ways to use it</ButtonLink>
            </div>
          </div>
          <div className="animate-rise [animation-delay:120ms]">
            <AppMock />
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl flex-col gap-24 px-4 py-24 sm:px-6">
        {FEATURES.map(({ eyebrow, title, body, points, Mock }, i) => (
          <section key={eyebrow} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16" aria-labelledby={`f-${i}`}>
            <div className={cn(i % 2 === 1 && "lg:order-2")}>
              <SectionHead id={`f-${i}`} eyebrow={eyebrow} title={title} lead={body} />
              <ul className="mt-6 flex flex-col gap-2.5">
                {points.map((p) => (
                  <li key={p} className="flex gap-2.5"><ShieldCheck className="mt-1 size-4 shrink-0 text-accent" aria-hidden />{p}</li>
                ))}
              </ul>
            </div>
            <Mock />
          </section>
        ))}
      </div>

      <section className="border-y border-border bg-surface-2/70" aria-labelledby="h-hood">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionHead id="h-hood" eyebrow="Under the hood" title="Built to be trusted, not just impressive." lead="The rules that keep the research honest are part of the software, not a policy document." />
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {UNDER_THE_HOOD.map(({ icon: Icon, title, body }) => (
              <li key={title} className="rounded-2xl border border-border bg-surface p-6">
                <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent-text"><Icon className="size-5" aria-hidden /></span>
                <h3 className="mt-4 text-lg font-semibold text-heading">{title}</h3>
                <p className="mt-2 leading-7 text-muted">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="ways" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6" aria-labelledby="h-ways">
        <SectionHead id="h-ways" eyebrow="Ways to use it" title="Software, run by people who know it best." />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <article className="theme-ink brand-hero rounded-2xl p-7">
            <span className="rounded-full bg-signal px-2.5 py-0.5 text-xs font-semibold text-white">Recommended</span>
            <h3 className="mt-4 font-display text-2xl font-[650] text-heading">Done for you</h3>
            <p className="mt-2 leading-7 text-muted">We run the platform on your behalf, review the results and deliver a briefed shortlist. You don&apos;t need to learn anything.</p>
          </article>
          <article className="rounded-2xl border border-border bg-surface p-7">
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent-text"><Eye className="size-5" aria-hidden /></span>
            <h3 className="mt-4 font-display text-2xl font-[650] text-heading">With your own workspace</h3>
            <p className="mt-2 leading-7 text-muted">Prefer to see everything live? Log in to your own client workspace to browse the research, keep or reject companies, manage your pipeline and export when you like.</p>
          </article>
        </div>
      </section>

      <CtaBand title="See the platform on your own market." body="Book a call and we'll walk you through it using companies from your industry." />
    </>
  );
}
