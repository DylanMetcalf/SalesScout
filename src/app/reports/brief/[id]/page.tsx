import { notFound, redirect } from "next/navigation";
import { getTenant, type CompanyTenant } from "@/lib/tenant";
import { buildSalesBrief, contactsOf, evidenceOf, mustGetProspect } from "@/lib/services/workflow";
import { emailState, phoneState, roleState, type FieldState } from "@/lib/verification";
import { STATUS_META } from "@/lib/status";
import { FIT_LABELS } from "@/components/ui/fit";
import { LogoMark } from "@/components/ui/logo";
import { CompanyLogo } from "@/components/ui/company-logo";
import { PrintButton } from "../../prospects/print-button";
import { AutoPrint } from "./auto-print";

export const metadata = { title: "Prospect brief", robots: { index: false } };

const LEVEL = { strong: "Strong", moderate: "Moderate", weak: "Weak", unknown: "Unknown" } as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h2 className="mb-2 border-b border-[#dbe1ea] pb-1.5 font-sans text-[11px] font-semibold tracking-[0.14em] text-[#0b6669] uppercase">{title}</h2>
      <div className="text-[13.5px] leading-[1.6] text-[#18213a]">{children}</div>
    </section>
  );
}

function Tag({ state }: { state: FieldState | null }) {
  if (!state) return null;
  return (
    <span title={state.detail} className="ml-2 rounded border border-[#c3ccd9] px-1.5 py-px text-[10.5px] font-medium whitespace-nowrap text-[#4d5874]">
      {state.label}
    </span>
  );
}

/**
 * The one-page prospect brief: its own page (no app chrome), so printing it
 * prints exactly one document. White surface, brand colour only in type and rules.
 */
export default async function Brief({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ print?: string }> }) {
  const tenant = await getTenant();
  if (!tenant?.company) redirect("/login");
  const ct = tenant as CompanyTenant;
  const { id } = await params;
  const { print } = await searchParams;
  let p;
  try {
    p = mustGetProspect(ct, id);
  } catch {
    notFound();
  }
  // Briefs are part of a kept prospect's full profile.
  if (!p.inCrm && !p.isExample) redirect(`/prospects/${id}`);
  buildSalesBrief(ct, id); // keeps the brief history
  const people = contactsOf(ct, id);
  const sources = evidenceOf(ct, id);
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const fit = p.fit;
  const strong = fit ? Object.values(fit).filter((d) => d.level === "strong").length : 0;
  const named = people.filter((c) => c.name);
  const lead = named[0] ?? people[0];

  return (
    <div className="min-h-dvh bg-[#eef1f6] py-8 print:bg-white print:py-0">
      {print === "1" && <AutoPrint />}
      <div className="mx-auto mb-4 flex max-w-[794px] items-center justify-between px-4 print:hidden">
        <a href={`/prospects/${id}`} className="text-sm font-medium text-[#0b6669] hover:underline">← Back to prospect</a>
        <PrintButton />
      </div>

      <article className="brief mx-auto flex max-w-[794px] flex-col gap-6 bg-white px-12 py-10 text-[#18213a] shadow-md print:max-w-none print:gap-5 print:p-0 print:shadow-none">
        <header className="flex items-center justify-between border-b-2 border-[#0f8285] pb-4">
          <div className="flex items-center gap-2.5">
            <LogoMark size={26} label={null} />
            <div className="leading-tight">
              <p className="font-display text-[15px] font-[650] text-[#16203a]">Sales Scout</p>
              <p className="text-[11px] text-[#5e667b]">Prospect brief</p>
            </div>
          </div>
          <div className="text-right text-[11px] leading-tight text-[#5e667b]">
            <p>Prepared {date}</p>
            <p>for {ct.company.name}</p>
          </div>
        </header>

        {p.isExample && <p className="text-[12px] text-[#9a4d12]">Example data. This company is fictional.</p>}

        <section className="flex items-start gap-4">
          <CompanyLogo name={p.name} domain={p.domain} size={52} />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[28px] leading-tight font-[650] text-[#16203a]">{p.name}</h1>
            <p className="mt-0.5 text-[13px] text-[#4d5874]">
              {[p.industry, p.location].filter(Boolean).join(" · ") || "Industry and location not confirmed"}
              {p.website && <> · <a href={p.website} className="text-[#0b6669]">{p.domain ?? p.website}</a></>}
            </p>
          </div>
          <dl className="shrink-0 text-right text-[11px] leading-snug">
            <dt className="text-[#5e667b]">Pipeline</dt>
            <dd className="font-semibold">{STATUS_META[p.status].label}</dd>
            {fit && (
              <>
                <dt className="mt-1.5 text-[#5e667b]">Fit</dt>
                <dd className="font-semibold">Strong on {strong} of 6</dd>
              </>
            )}
          </dl>
        </section>

        {p.whatTheyDo && <Section title="What they do">{p.whatTheyDo}</Section>}

        <div className="grid grid-cols-2 gap-6 print:gap-5">
          <Section title="Why they're worth pursuing">{p.whyRelevant ?? <span className="text-[#5e667b]">Not yet assessed.</span>}</Section>
          <Section title="Potential opportunity">{p.potentialOpportunity ?? <span className="text-[#5e667b]">Not yet assessed.</span>}</Section>
        </div>

        <Section title="Who to speak to">
          {people.length === 0 ? (
            <p className="text-[#5e667b]">No people identified yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {(lead ? [lead, ...people.filter((c) => c !== lead)] : people).slice(0, 4).map((c) => (
                <li key={c.id}>
                  <p>
                    <span className="font-semibold">{c.name ?? c.role}</span>
                    {c.name && <span className="text-[#4d5874]"> · {c.role}</span>}
                    <Tag state={roleState(c.checks, Boolean(c.name && c.sourceUrl))} />
                  </p>
                  {(c.email || c.phone) && (
                    <p className="text-[12.5px] text-[#4d5874]">
                      {c.email && <span>{c.email}<Tag state={emailState(c.checks, true)} /></span>}
                      {c.email && c.phone && <span className="mx-2">·</span>}
                      {c.phone && <span>{c.phone}<Tag state={phoneState(c.checks, true)} /></span>}
                    </p>
                  )}
                  {c.relevance && <p className="text-[12.5px] text-[#4d5874]">{c.relevance}</p>}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {fit && (
          <Section title="How they fit">
            <dl className="grid grid-cols-3 gap-x-6 gap-y-1.5 text-[12.5px]">
              {(Object.keys(FIT_LABELS) as (keyof typeof FIT_LABELS)[]).map((k) => (
                <div key={k} className="flex justify-between gap-2 border-b border-dotted border-[#dbe1ea] pb-1">
                  <dt className="text-[#4d5874]">{FIT_LABELS[k]}</dt>
                  <dd className="font-semibold">{LEVEL[fit[k].level]}</dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        <div className="grid grid-cols-2 gap-6 print:gap-5">
          <Section title="Evidence and sources">
            {sources.length === 0 ? (
              <p className="text-[#5e667b]">No sources recorded.</p>
            ) : (
              <ol className="flex list-decimal flex-col gap-1 pl-4 text-[12.5px]">
                {sources.slice(0, 6).map((e) => (
                  <li key={e.id}>
                    {e.title}
                    {e.url && <span className="block truncate text-[11px] text-[#0b6669]">{e.url}</span>}
                  </li>
                ))}
              </ol>
            )}
          </Section>
          <Section title="To confirm">
            {p.unknowns.length === 0 ? (
              <p className="text-[#5e667b]">Nothing flagged.</p>
            ) : (
              <ul className="flex list-disc flex-col gap-1 pl-4 text-[12.5px]">
                {p.unknowns.slice(0, 6).map((u) => <li key={u}>{u}</li>)}
              </ul>
            )}
          </Section>
        </div>

        <section className="break-inside-avoid border-l-4 border-[#0f8285] py-1 pl-4">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#0b6669] uppercase">Recommended next step</p>
          <p className="mt-1 text-[14px] font-medium">{p.suggestedNextStep ?? "Review the research, then decide whether to reach out."}</p>
        </section>

        <footer className="mt-auto flex justify-between border-t border-[#dbe1ea] pt-3 text-[10.5px] text-[#5e667b]">
          <span>Prepared with Sales Scout · salesscout.co.za</span>
          <span>Researched from public sources. Confidential, for internal use.</span>
        </footer>
      </article>
    </div>
  );
}
