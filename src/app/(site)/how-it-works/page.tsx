import { Lock, ShieldCheck, Send } from "lucide-react";
import { SITE } from "@/content/site";
import { CtaBand, PageHero, SectionHead } from "@/components/site/chrome";
import { ProductPreview } from "@/components/site/product-preview";

export const metadata = {
  title: "How it works",
  description: "Our five-step process, from discovery call to a briefed shortlist you can act on the same day.",
};

const ROLES = [
  { key: "you", label: "You" },
  { key: "we", label: "We" },
  { key: "get", label: "You get" },
] as const;

const PRIVACY = [
  { icon: Lock, title: "Your information stays yours", body: "Everything you share is kept in a private workspace for your business only. It is never used for anyone else." },
  { icon: ShieldCheck, title: "Public sources only", body: "We research from public websites, news and authorised data sources. We don't scrape platforms that forbid it." },
  { icon: Send, title: "Nothing goes out in your name", body: "We prepare drafts. You decide what's sent, to whom and when, from your own inbox." },
];

export default function HowItWorks() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title="Five steps from a conversation to a shortlist worth calling."
        body="You give us an hour of your time up front. We do the research, the vetting and the preparation. You make every decision that matters."
      />

      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6" aria-labelledby="h-steps">
        <SectionHead id="h-steps" eyebrow="The process" title="What happens, who does it, and what you get." />
        <ol className="relative mt-12 flex flex-col gap-6 before:absolute before:bottom-6 before:left-5 before:top-6 before:w-px before:bg-border">
          {SITE.detailedSteps.map((s, i) => (
            <li key={s.title} className="relative grid gap-4 pl-16">
              <span className="absolute left-0 top-5 flex size-10 items-center justify-center rounded-xl bg-accent font-display text-lg font-[650] text-accent-fg shadow-[0_8px_20px_-10px_var(--accent)]" aria-hidden>
                {i + 1}
              </span>
              <article className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-heading">{s.title}</h3>
                <dl className="mt-4 grid gap-4 md:grid-cols-3">
                  {ROLES.map((r) => (
                    <div key={r.key} className={r.key === "get" ? "rounded-lg border border-insight-border bg-insight p-3" : "p-3"}>
                      <dt className={r.key === "get" ? "text-xs font-semibold uppercase tracking-[0.08em] text-accent-text" : "text-xs font-semibold uppercase tracking-[0.08em] text-subtle"}>{r.label}</dt>
                      <dd className="mt-1 leading-7 text-muted">{s[r.key]}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-border bg-surface-2/70" aria-labelledby="h-anatomy">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div>
            <SectionHead id="h-anatomy" eyebrow="Anatomy of a lead" title="What's inside every company we send you." />
            <dl className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {SITE.anatomy.map((a) => (
                <div key={a.label} className="border-l-2 border-accent pl-4">
                  <dt className="font-semibold text-heading">{a.label}</dt>
                  <dd className="mt-1 leading-7 text-muted">{a.body}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="lg:sticky lg:top-24">
            <ProductPreview />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6" aria-labelledby="h-privacy">
        <SectionHead id="h-privacy" eyebrow="Your data and reputation" title="Careful with your name, and everyone else's." />
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {PRIVACY.map(({ icon: Icon, title, body }) => (
            <li key={title} className="rounded-2xl border border-border bg-surface p-6">
              <Icon className="size-5 text-accent" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold text-heading">{title}</h3>
              <p className="mt-2 leading-7 text-muted">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <CtaBand />
    </>
  );
}
