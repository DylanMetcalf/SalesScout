import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getDocument } from "@/lib/opportunities/service";
import { BRIEF_FIELDS, DOC_KINDS, PROJECT_FIELDS, PROPOSAL_FIELDS, type Analysis, type DocKind, type ProblemContext, type Research, type Visibility } from "@/lib/opportunities/types";
import { SITE } from "@/content/site";
import { LogoMark } from "@/components/ui/logo";
import { PrintButton } from "../../prospects/print-button";
import { AutoPrint } from "../../brief/[id]/auto-print";

export const metadata = { title: "Document", robots: { index: false } };

type Company = { name: string | null; website: string | null; region: string | null; contact: string; role: string | null };

const INK = "text-[#18213a]";
const MUTED = "text-[#5e667b]";

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 border-b border-[#dbe1ea] pb-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#0b6669] uppercase">{children}</h2>;
}

function Sec({ title, children, keep }: { title: string; children: React.ReactNode; keep?: boolean }) {
  return (
    <section className={keep ? "keep" : undefined}>
      <H>{title}</H>
      <div className={`text-[13.5px] leading-[1.65] ${INK}`}>{children}</div>
    </section>
  );
}

function Bullets({ items, empty }: { items: string[]; empty?: string }) {
  if (!items.length) return <p className={MUTED}>{empty ?? "None noted."}</p>;
  return <ul className="flex list-disc flex-col gap-1 pl-5">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;
}

/** Plain text fields as written by the operator: blank lines become paragraphs, "- " lines become bullets. */
function Prose({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <>
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (lines.every((l) => /^\s*[-•*]\s+/.test(l))) return <ul key={i} className="mb-2 flex list-disc flex-col gap-1 pl-5">{lines.map((l, j) => <li key={j}>{l.replace(/^\s*[-•*]\s+/, "")}</li>)}</ul>;
        return <p key={i} className="mb-2 whitespace-pre-wrap">{b}</p>;
      })}
    </>
  );
}

function Sources({ items }: { items: { url: string; title: string }[] }) {
  if (!items.length) return null;
  return (
    <Sec title="Sources">
      <ol className="flex list-decimal flex-col gap-1 pl-5 text-[11.5px]">
        {items.map((s) => <li key={s.url} className="[overflow-wrap:anywhere]"><span>{s.title}</span> <span className="text-[#0b6669]">{s.url}</span></li>)}
      </ol>
    </Sec>
  );
}

function Fields({ fields, values }: { fields: readonly (readonly [string, string])[]; values: Record<string, string> }) {
  return <>{fields.filter(([k]) => values[k]?.trim()).map(([k, label]) => <Sec key={k} title={label}><Prose text={values[k]} /></Sec>)}</>;
}

function Body({ kind, c }: { kind: DocKind; c: Record<string, unknown> }) {
  switch (kind) {
    case "assessment": {
      const a = c.analysis as Analysis;
      const ctx = (c.context ?? {}) as ProblemContext;
      return (
        <>
          <Sec title="What you told us"><p className="border-l-2 border-[#e8833a] pl-3 whitespace-pre-wrap">{String(c.problem)}</p>{ctx.ideal && <p className="mt-2"><span className="font-semibold">What you’d like instead: </span>{ctx.ideal}</p>}</Sec>
          <Sec title="Our understanding so far" keep><p>{a.customerSays}</p><p className="mt-2"><span className="font-semibold">Where the friction appears to be: </span>{a.friction}</p></Sec>
          <Sec title="Possible directions" keep><ul className="flex flex-col gap-2">{a.directions.map((d, i) => <li key={i}><span className="font-semibold">{d.title}.</span> {d.why}</li>)}</ul></Sec>
          <Sec title="What we’d like to understand next" keep><ol className="flex list-decimal flex-col gap-1 pl-5">{a.questions.map((q, i) => <li key={i}>{q}</li>)}</ol></Sec>
          <Sec title="Things that could affect the approach" keep><Bullets items={[...a.integrations.map((x) => `May involve: ${x}`), ...a.risks]} /></Sec>
          <p className={`text-[11.5px] ${MUTED}`}>This is a preliminary assessment based only on what you’ve shared so far. It isn’t a diagnosis or a recommendation to buy anything; a conversation will tell us much more.</p>
        </>
      );
    }
    case "briefing": {
      const r = c.research as Research;
      const observed = r.findings.filter((f) => f.kind === "observed");
      const inferred = r.findings.filter((f) => f.kind === "inferred");
      return (
        <>
          <Sec title="Company overview"><p>{r.summary}</p></Sec>
          <div className="grid grid-cols-2 gap-6">
            <Sec title="Offerings" keep><Bullets items={r.offerings} empty="Not found in public sources." /></Sec>
            <Sec title="Markets and customers" keep><Bullets items={r.markets} empty="Not found in public sources." /></Sec>
          </div>
          <Sec title="The problem they raised"><p className="border-l-2 border-[#e8833a] pl-3 whitespace-pre-wrap">{String(c.problem)}</p></Sec>
          {observed.length > 0 && <Sec title="What public sources show"><ul className="flex list-disc flex-col gap-1 pl-5">{observed.map((f, i) => <li key={i}>{f.statement} {f.sourceUrl && <span className="text-[11px] text-[#0b6669] [overflow-wrap:anywhere]">({f.sourceUrl})</span>}</li>)}</ul></Sec>}
          {inferred.length > 0 && <Sec title="Our inferences (unconfirmed)"><Bullets items={inferred.map((f) => f.statement)} /></Sec>}
          <Sec title="Possible improvement areas (hypotheses)" keep><Bullets items={r.improvements} /></Sec>
          <Sec title="Questions for the conversation" keep><ol className="flex list-decimal flex-col gap-1 pl-5">{[...r.questions, ...((c.questions as string[]) ?? [])].slice(0, 12).map((q, i) => <li key={i}>{q}</li>)}</ol></Sec>
          <Sec title="Gaps and uncertainties" keep><Bullets items={r.gaps} /></Sec>
          <p className={`text-[11.5px] ${MUTED}`}>Researched {new Date(r.researchedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} from public sources, which may be incomplete or out of date.</p>
          <Sources items={r.sources} />
        </>
      );
    }
    case "visibility": {
      const v = c.visibility as Visibility;
      const recs = [...v.recommendations].sort((a, b) => ["high", "medium", "low"].indexOf(a.priority) - ["high", "medium", "low"].indexOf(b.priority));
      const areas = [...new Set(v.observed.map((x) => x.area))];
      return (
        <>
          <Sec title="Summary"><p>{v.summary}</p></Sec>
          <Sec title="How to read this report" keep>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              <li><span className="font-semibold">Observed</span>: read directly from your website’s pages, robots.txt and sitemap ({v.pagesChecked.length} pages).</li>
              <li><span className="font-semibold">Search observations</span>: what a few web searches showed. These are not rankings.</li>
              <li><span className="font-semibold">Recommendations</span>: our analysis of what to improve, prioritised by likely value, confidence and effort.</li>
            </ul>
          </Sec>
          <Sec title="Recommendations">
            <ol className="flex flex-col gap-4">
              {recs.map((x, i) => (
                <li key={i} className="keep rounded border border-[#dbe1ea] p-3">
                  <p className="font-semibold">{i + 1}. {x.title} <span className={`ml-1 text-[11px] font-normal ${MUTED}`}>{x.priority} priority · {x.effort} effort · {x.confidence} confidence</span></p>
                  <p className="mt-1">{x.why}</p>
                  <div className="mt-1.5 text-[12.5px]"><span className="font-semibold">How: </span><span className="whitespace-pre-wrap [overflow-wrap:anywhere]">{x.how}</span></div>
                  <p className="mt-1 text-[12.5px]"><span className="font-semibold">How to measure: </span>{x.measure}</p>
                </li>
              ))}
            </ol>
          </Sec>
          <Sec title="What we observed">
            {areas.map((a) => (
              <div key={a} className="keep mb-3">
                <h3 className="text-[12.5px] font-semibold">{a}</h3>
                <ul className="flex list-disc flex-col gap-0.5 pl-5 text-[12.5px]">{v.observed.filter((x) => x.area === a).map((x, i) => <li key={i}>{x.finding}{x.url && <span className="text-[10.5px] text-[#0b6669] [overflow-wrap:anywhere]"> ({x.url})</span>}</li>)}</ul>
              </div>
            ))}
          </Sec>
          {v.searchNotes.length > 0 && <Sec title="Search observations" keep><Bullets items={v.searchNotes.map((n) => n.note)} /></Sec>}
          <Sec title="Limitations" keep><Bullets items={v.limitations} /></Sec>
          <Sources items={v.sources} />
        </>
      );
    }
    case "solution_brief":
      return <Fields fields={BRIEF_FIELDS} values={c.fields as Record<string, string>} />;
    case "proposal":
      return <Fields fields={PROPOSAL_FIELDS} values={c.fields as Record<string, string>} />;
    case "handover":
      return (
        <>
          <Sec title="The original problem"><p className="border-l-2 border-[#e8833a] pl-3 whitespace-pre-wrap">{String(c.problem)}</p></Sec>
          <Fields fields={PROJECT_FIELDS} values={c.fields as Record<string, string>} />
        </>
      );
  }
}

const AUDIENCE: Record<DocKind, string> = {
  assessment: "Prepared for",
  briefing: "Internal briefing on",
  visibility: "Prepared for",
  solution_brief: "Internal: solution brief for",
  proposal: "Prepared for",
  handover: "Internal: project handover for",
};

/**
 * One branded document shell for every document type: its own page (no app
 * chrome) so printing produces exactly the document. Content is the frozen version.
 */
export default async function OpportunityDocument({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ print?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { print } = await searchParams;
  let d;
  try {
    d = getDocument(id);
  } catch {
    notFound();
  }
  const c = d.content as Record<string, unknown> & { company: Company };
  const internal = AUDIENCE[d.kind].startsWith("Internal");
  const date = d.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-dvh bg-[#eef1f6] py-8 print:bg-white print:py-0">
      {print === "1" && <AutoPrint />}
      <div className="mx-auto mb-4 flex max-w-[794px] items-center justify-between px-4 print:hidden">
        <a href={`/opportunities/${d.opportunityId}?tab=documents`} className="text-sm font-medium text-[#0b6669] hover:underline">← Back to opportunity</a>
        <PrintButton />
      </div>
      <article className={`doc mx-auto flex max-w-[794px] flex-col gap-6 bg-white px-12 py-10 shadow-md print:max-w-none print:gap-5 print:p-0 print:shadow-none ${INK}`}>
        <header className="flex items-center justify-between border-b-2 border-[#0f8285] pb-4">
          <div className="flex items-center gap-2.5">
            <LogoMark size={26} label={null} />
            <div className="leading-tight">
              <p className="font-display text-[15px] font-[650] text-[#16203a]">{SITE.name}</p>
              <p className="text-[11px] text-[#5e667b]">by Mea Creo</p>
            </div>
          </div>
          <div className="text-right text-[11px] leading-tight text-[#5e667b]">
            <p>{date}</p>
            <p>Version {d.version}</p>
          </div>
        </header>

        <section className="keep">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#0b6669] uppercase">{DOC_KINDS[d.kind]}</p>
          <h1 className="mt-1 font-display text-[30px] leading-tight font-[650] text-[#16203a]">{c.company.name || c.company.contact}</h1>
          <p className="mt-1 text-[13px] text-[#4d5874] [overflow-wrap:anywhere]">
            {AUDIENCE[d.kind]} {c.company.name ? `${c.company.contact}${c.company.role ? `, ${c.company.role}` : ""}, ${c.company.name}` : c.company.contact}
            {c.company.website && <> · {c.company.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</>}
          </p>
        </section>

        <Body kind={d.kind} c={c} />

        <footer className="keep mt-auto flex justify-between gap-6 border-t border-[#dbe1ea] pt-3 text-[10.5px] text-[#5e667b]">
          <span>{SITE.name} · {SITE.operator.replace(/\.$/, "")} · {SITE.contactEmail}</span>
          <span className="text-right">{internal ? "Internal and confidential." : `Confidential: prepared for ${c.company.name || c.company.contact}.`}</span>
        </footer>
      </article>
    </div>
  );
}
