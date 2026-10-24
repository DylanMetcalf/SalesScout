import { LEGAL, type LegalSection } from "@/content/legal";
import { Eyebrow } from "./chrome";

/** Readable legal page: summary chips, contents list and numbered sections. */
export function LegalPage({ title, intro, sections, summary }: { title: string; intro: string; sections: LegalSection[]; summary: string[] }) {
  const details = [LEGAL.entity, LEGAL.registration && `Registration ${LEGAL.registration}`, LEGAL.address].filter(Boolean);
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <Eyebrow index="§">Legal</Eyebrow>
      <h1 className="mt-5 text-[40px] leading-[1.02] tracking-[-0.035em] sm:text-[60px]">{title}</h1>
      <p className="caption-mono mt-4 text-subtle">Last updated {LEGAL.lastUpdated}</p>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">{intro}</p>

      <ul className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
        {summary.map((s) => (
          <li key={s} className="flex items-start gap-2.5 rounded-2xl border border-border bg-surface px-4 py-3.5 text-[15px] font-medium before:mt-2 before:size-1.5 before:shrink-0 before:rounded-full before:bg-signal">{s}</li>
        ))}
      </ul>

      <div className="mt-14 grid gap-12 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Contents" className="lg:sticky lg:top-24 lg:self-start">
          <p className="caption-mono text-subtle">Contents</p>
          <ol className="mt-3 flex flex-col gap-2 text-sm">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-muted hover:text-accent-text">
                  <span className="mr-2 font-mono text-xs text-subtle">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="flex max-w-3xl flex-col gap-10">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24" aria-labelledby={`l-${s.id}`}>
              <h2 id={`l-${s.id}`} className="flex items-baseline gap-3 text-[26px] tracking-[-0.025em]">
                <span className="font-mono text-sm text-signal-text">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </h2>
              <div className="mt-3 flex flex-col gap-3 leading-7 text-text/90">
                {s.body.map((b, j) =>
                  Array.isArray(b) ? (
                    <ul key={j} className="flex list-disc flex-col gap-1.5 pl-5 marker:text-accent">
                      {b.map((li) => <li key={li}>{li}</li>)}
                    </ul>
                  ) : (
                    <p key={j}>{b}</p>
                  ),
                )}
              </div>
            </section>
          ))}
          <section id="contact" className="scroll-mt-24 rounded-[22px] border border-border bg-surface p-6" aria-labelledby="l-contact">
            <h2 id="l-contact" className="text-xl">Contact us</h2>
            <p className="mt-2 leading-7 text-muted">
              Questions or requests: <a href={`mailto:${LEGAL.email}`} className="font-medium text-accent-text hover:underline">{LEGAL.email}</a>
              {LEGAL.informationOfficer && <> · Information Officer: {LEGAL.informationOfficer}</>}
            </p>
            {details.length > 0 && <p className="mt-1 text-sm text-subtle">{details.join(" · ")}</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
