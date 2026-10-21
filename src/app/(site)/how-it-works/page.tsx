import { Lock, PackageCheck, ScanSearch, Send, ShieldCheck, UserRound } from "lucide-react";
import { SITE } from "@/content/site";
import { CtaBand, PageHero, Section, SectionHead } from "@/components/site/chrome";
import { ProductPreview } from "@/components/site/product-preview";
import { ResearchMock } from "@/components/site/mocks";
import { FlowDiagram, IconBadge, IconGrid } from "@/components/site/visuals";

export const metadata = {
  title: "How it works",
  description: "Five steps from a discovery call to a briefed shortlist you can act on the same day.",
};

const ROLES = [
  { key: "you", label: "You", icon: UserRound, cls: "bg-surface-2 text-text" },
  { key: "we", label: "We", icon: ScanSearch, cls: "bg-surface-2 text-text" },
  { key: "get", label: "You get", icon: PackageCheck, cls: "border border-insight-border bg-insight text-text" },
] as const;

const PRIVACY = [
  { icon: Lock, title: "Private workspace", text: "Your data is never used for another client." },
  { icon: ShieldCheck, title: "Public sources only", text: "No scraping of platforms that forbid it." },
  { icon: Send, title: "Nothing sent for you", text: "Drafts only. You send from your inbox." },
];

export default function HowItWorks() {
  const half = Math.ceil(SITE.anatomy.length / 2);
  return (
    <>
      <PageHero eyebrow="How it works" title="One hour from you. The research from us." body="Five steps. You make every decision that matters." visual={<ResearchMock />} />

      <Section id="overview">
        <SectionHead id="h-overview" eyebrow="At a glance" title="Five steps to a shortlist." center />
        <div className="mt-14"><FlowDiagram steps={SITE.flow} /></div>
      </Section>

      <Section id="steps" band>
        <SectionHead id="h-steps" eyebrow="Step by step" title="Who does what." />
        <ol className="mt-12 flex flex-col gap-4">
          {SITE.detailedSteps.map((s, i) => (
            <li key={s.title} className="grid gap-4 rounded-2xl border border-border bg-surface p-5 lg:grid-cols-[240px_1fr] lg:items-center">
              <div className="flex items-center gap-4">
                <IconBadge icon={s.icon} tone="solid" />
                <div>
                  <p className="font-mono text-xs text-subtle">Step {i + 1}</p>
                  <h3 className="font-semibold text-heading">{s.title}</h3>
                </div>
              </div>
              <ul className="grid gap-2 sm:grid-cols-3">
                {ROLES.map(({ key, label, icon: Icon, cls }) => (
                  <li key={key} className={`flex items-start gap-2.5 rounded-xl px-3.5 py-3 ${cls}`}>
                    <Icon className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                    <p className="text-sm leading-5">
                      <span className="block text-[11px] font-semibold tracking-wide text-subtle uppercase">{label}</span>
                      {s[key]}
                    </p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="anatomy">
        <SectionHead id="h-anatomy" eyebrow="Anatomy of a lead" title="Eight things in every lead." center />
        <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_1.15fr_1fr] lg:items-center">
          <IconGrid items={SITE.anatomy.slice(0, half)} cols={1} card={false} />
          <ProductPreview />
          <IconGrid items={SITE.anatomy.slice(half)} cols={1} card={false} />
        </div>
      </Section>

      <Section id="privacy" band>
        <SectionHead id="h-privacy" eyebrow="Your data and reputation" title="Careful with your name." center />
        <div className="mt-12"><IconGrid items={PRIVACY} cols={3} /></div>
      </Section>

      <CtaBand />
    </>
  );
}
