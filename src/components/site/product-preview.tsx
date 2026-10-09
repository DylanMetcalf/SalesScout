import { CircleHelp, UserCheck, UserRound } from "lucide-react";
import { FitLevelIndicator } from "@/components/ui/fit";
import { Needle } from "@/components/ui/needle";

/** A faithful, static preview of a Sales Scout prospect card (example company). */
export function ProductPreview() {
  return (
    <div className="theme-paper relative rounded-2xl" aria-label="Example of a Sales Scout prospect card" role="img">
      <div className="rounded-2xl border border-border border-l-4 border-l-accent bg-surface p-5 text-text shadow-lg sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-xl font-[650] text-heading">Kopano Platinum Concentrator</p>
            <p className="text-sm text-muted">Mining · Rustenburg, North West</p>
          </div>
          <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-strong-soft px-2.5 text-xs font-semibold text-strong">Strong fit</span>
        </div>
        <div className="mt-4 rounded-lg border border-insight-border border-l-[3px] border-l-accent bg-insight px-4 py-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-accent-text">
            <Needle className="size-3.5 text-accent-text" /> Why this lead?
          </p>
          <p className="text-sm leading-6">Runs ball mills and slurry pumps around the clock — the same equipment in your best case study.</p>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-3">
          {(
            [
              ["Company", "strong"],
              ["Need", "moderate"],
              ["Contacts", "strong"],
            ] as const
          ).map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="mt-0.5"><FitLevelIndicator level={v} /></dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5"><UserCheck className="size-3.5 text-strong" aria-hidden />Engineering Manager</span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-muted"><UserRound className="size-3.5" aria-hidden />Maintenance Planner</span>
        </div>
        <div className="mt-4 rounded-lg bg-brand-deep px-4 py-3 text-sm text-white">
          <p className="font-semibold">Next step</p>
          <p className="text-white/75">Send the case study before the site visit.</p>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-subtle"><CircleHelp className="size-3.5" aria-hidden /> Example data — this company is fictional.</p>
      </div>
    </div>
  );
}
