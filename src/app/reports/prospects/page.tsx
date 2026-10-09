import { redirect } from "next/navigation";
import { getTenant, type CompanyTenant } from "@/lib/tenant";
import { exportRows, logExport, runTitle, type ExportFilter } from "@/lib/services/exports";
import { CRM_STATUSES, type CrmStatus } from "@/lib/db/schema";
import { FIT_LABELS } from "@/components/ui/fit";
import { LogoMark } from "@/components/ui/logo";
import { STATUS_META } from "@/lib/status";
import { PrintButton } from "./print-button";

export const metadata = { title: "Prospecting report" };

/** A client-ready research deliverable. Designed for screen and print (Save as PDF). */
export default async function Report({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const tenant = await getTenant();
  if (!tenant?.company) redirect("/login");
  const ct = tenant as CompanyTenant;
  const sp = await searchParams;
  const scope = (["crm", "all", "run"].includes(sp.scope ?? "") ? sp.scope : "crm") as ExportFilter["scope"];
  const statuses = (sp.status?.split(",") ?? []).filter((s): s is CrmStatus => (CRM_STATUSES as readonly string[]).includes(s));
  const filter: ExportFilter = { scope, runId: sp.run, statuses, ids: sp.ids?.split(",").filter(Boolean) };
  const rows = exportRows(ct, filter);
  logExport(ct, "report", rows.length, filter);
  const campaign = sp.run ? runTitle(ct, sp.run) : scope === "crm" ? "Active pipeline" : "Prospect research";
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const examples = rows.some((r) => r.prospect.isExample);

  return (
    <div className="min-h-dvh bg-surface-2 py-10 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[820px] justify-end px-4 print:hidden">
        <PrintButton />
      </div>
      <article className="mx-auto max-w-[820px] bg-white px-10 py-12 text-[#16203a] shadow-md sm:px-14 print:max-w-none print:px-0 print:py-0 print:shadow-none">
        <header className="border-b-2 border-[#0f8285] pb-8">
          <div className="flex items-center gap-2 text-sm text-[#4d5874]">
            <LogoMark size={22} /> Prepared with Sales Scout
          </div>
          <p className="mt-10 text-xs font-semibold uppercase tracking-[0.14em] text-[#0f8285]">Prospecting report</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.02em]">{ct.company.name}</h1>
          <dl className="mt-6 grid grid-cols-3 gap-6 text-sm">
            <div><dt className="text-[#7b85a0]">Campaign</dt><dd className="font-medium">{campaign}</dd></div>
            <div><dt className="text-[#7b85a0]">Date</dt><dd className="font-medium">{date}</dd></div>
            <div><dt className="text-[#7b85a0]">Prospects</dt><dd className="font-medium">{rows.length}</dd></div>
          </dl>
          {examples && <p className="mt-6 rounded bg-[#f1ebf9] px-3 py-2 text-sm text-[#7349ad]">This report contains example data. Companies and people are fictional.</p>}
        </header>

        <section className="border-b border-[#dbe1ea] py-8 text-[15px] leading-7 text-[#3b3d42]">
          <h2 className="mb-2 text-lg font-semibold text-[#16203a]">About this report</h2>
          <p>
            Each company below was researched from public sources. For every prospect we explain why it may be relevant, the opportunity we see, and the people worth
            speaking to. Where we inferred something rather than confirmed it, we say so. Contact details appear only when they were published in a source; blanks mean
            we didn&apos;t find them.
          </p>
        </section>

        {rows.length === 0 && <p className="py-10 text-center text-[#4d5874]">No prospects match this report.</p>}

        {rows.map(({ prospect: p, people, evidence }, i) => (
          <section key={p.id} className="break-inside-avoid-page border-b border-[#dbe1ea] py-10 last:border-0">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-[-0.01em]">
                <span className="mr-3 text-[#7b85a0]">{String(i + 1).padStart(2, "0")}</span>
                {p.name}
              </h2>
              {p.fit && <span className="shrink-0 text-sm font-semibold uppercase tracking-wide text-[#0f8285]">{p.fit.company.level} fit</span>}
            </div>
            <p className="mt-1 text-sm text-[#4d5874]">{[p.industry, p.location, p.website && !p.isExample ? p.website : p.website ? `${p.domain} (example)` : null, STATUS_META[p.status].label].filter(Boolean).join(" · ")}</p>

            <div className="mt-6 grid gap-6 text-[14.5px] leading-7 sm:grid-cols-2">
              <div><h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7b85a0]">What they do</h3><p className="mt-1">{p.whatTheyDo ?? "—"}</p></div>
              <div><h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7b85a0]">Why relevant</h3><p className="mt-1">{p.whyRelevant ?? "—"}</p></div>
              <div><h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7b85a0]">Potential opportunity</h3><p className="mt-1">{p.potentialOpportunity ?? "—"}</p></div>
              <div><h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7b85a0]">Suggested approach</h3><p className="mt-1">{p.suggestedNextStep ?? "—"}</p></div>
            </div>

            {p.fit && (
              <table className="mt-6 w-full text-sm">
                <tbody>
                  {(Object.keys(FIT_LABELS) as (keyof typeof FIT_LABELS)[]).map((k) => (
                    <tr key={k} className="border-t border-[#e9edf3] align-top">
                      <th scope="row" className="w-40 py-1.5 pr-3 text-left font-medium text-[#4d5874]">{FIT_LABELS[k]}</th>
                      <td className="w-24 py-1.5 font-medium capitalize">{p.fit![k]?.level}</td>
                      <td className="py-1.5 text-[#4d5874]">{p.fit![k]?.explanation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.1em] text-[#7b85a0]">Relevant contacts</h3>
            {people.length ? (
              <ul className="mt-2 flex flex-col gap-2 text-[14.5px]">
                {people.map((c) => (
                  <li key={c.id}>
                    <span className="font-medium">{c.name ?? `${c.role} (to be identified)`}</span>
                    {c.name && <span className="text-[#4d5874]"> — {c.role}</span>}
                    {(c.email || c.phone) && <span className="text-[#4d5874]"> · {[c.email, c.phone].filter(Boolean).join(" · ")}</span>}
                    <p className="text-sm text-[#4d5874]">{c.relevance}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-1 text-sm text-[#4d5874]">None identified.</p>}

            {p.unknowns.length > 0 && (
              <>
                <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.1em] text-[#7b85a0]">Still to confirm</h3>
                <ul className="mt-2 list-disc pl-5 text-sm text-[#4d5874]">{p.unknowns.map((u) => <li key={u}>{u}</li>)}</ul>
              </>
            )}

            {evidence.length > 0 && (
              <>
                <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.1em] text-[#7b85a0]">Sources</h3>
                <ol className="mt-2 list-decimal pl-5 text-xs text-[#4d5874]">{evidence.map((e) => <li key={e.id}>{e.title}{e.url && ` — ${e.url}`}</li>)}</ol>
              </>
            )}
          </section>
        ))}
        <footer className="pt-8 text-xs text-[#7b85a0]">Prepared {date}. Research reflects public information available at the time and should be verified before contact.</footer>
      </article>
    </div>
  );
}
