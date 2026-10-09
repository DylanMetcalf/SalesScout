import { Compass, Download, FileSpreadsheet, FileText, Home, KanbanSquare, Layers, Search, Send, Users } from "lucide-react";
import { LogoMark } from "@/components/ui/logo";
import { Needle } from "@/components/ui/needle";
import { FitLevelIndicator, FIT_LABELS } from "@/components/ui/fit";
import { cn } from "@/components/ui/cn";

/*
 * Static product screens for the website. They mirror the real app's design,
 * use fictional example companies, and always say so.
 */

export function AppWindow({ children, url = "app.salesscout.co", className }: { children: React.ReactNode; url?: string; className?: string }) {
  return (
    <div className={cn("theme-paper overflow-hidden rounded-2xl border border-border bg-surface text-text shadow-lg", className)} role="img" aria-label="Example screen from the Sales Scout platform">
      <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-weak/70" />
          <span className="size-2.5 rounded-full bg-moderate/70" />
          <span className="size-2.5 rounded-full bg-strong/70" />
        </span>
        <span className="mx-auto rounded-md bg-surface px-3 py-0.5 font-mono text-[11px] text-subtle">{url}</span>
      </div>
      {children}
      <p className="border-t border-border bg-surface-2 px-4 py-1.5 text-[11px] text-subtle">Example data — these companies are fictional.</p>
    </div>
  );
}

const NAV = [
  [Home, "Today"],
  [Compass, "Discover"],
  [Users, "Prospects"],
  [KanbanSquare, "Pipeline"],
  [Layers, "Strategy"],
] as const;

const ROWS = [
  { name: "Kopano Platinum Concentrator", meta: "Mining · Rustenburg", fit: "strong", why: "Runs ball mills and slurry pumps 24/7 — matches your best case study." },
  { name: "Highveld Aggregates", meta: "Quarrying · Witbank", fit: "strong", why: "Expanding crushing capacity; tender notice mentions maintenance contracts." },
  { name: "Umgeni Water Works", meta: "Utilities · Durban", fit: "moderate", why: "Large pump estate; unclear whether maintenance is outsourced." },
] as const;

/** A compact version of the whole app: sidebar, search and results. */
export function AppMock() {
  return (
    <AppWindow>
      <div className="grid grid-cols-[150px_1fr] max-sm:grid-cols-1">
        <aside className="theme-ink sidebar-brand flex flex-col gap-1 p-3 max-sm:hidden">
          <div className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold text-heading">
            <LogoMark size={22} label={null} /> Sales Scout
          </div>
          {NAV.map(([Icon, label], i) => (
            <span key={label} className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-xs", i === 1 ? "bg-accent-soft text-accent-text shadow-[inset_3px_0_0_var(--accent)]" : "text-muted")}>
              <Icon className="size-3.5" aria-hidden /> {label}
            </span>
          ))}
        </aside>
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs">
            <Search className="size-3.5 text-subtle" aria-hidden />
            <span className="flex-1 truncate">Mines and quarries in Gauteng that run heavy pumps</span>
            <span className="rounded-md bg-accent px-2 py-0.5 font-semibold text-accent-fg">Find</span>
          </div>
          <p className="text-[11px] font-medium text-subtle">3 companies checked and kept · 9 set aside</p>
          {ROWS.map((r) => (
            <div key={r.name} className={cn("rounded-lg border border-border border-l-4 bg-surface p-3", r.fit === "strong" ? "border-l-accent" : "border-l-moderate")}>
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[13px] font-semibold text-heading">{r.name}</p>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", r.fit === "strong" ? "bg-strong-soft text-strong" : "bg-moderate-soft text-moderate")}>{r.fit === "strong" ? "Strong fit" : "Moderate fit"}</span>
              </div>
              <p className="text-[11px] text-muted">{r.meta}</p>
              <p className="mt-1.5 text-[12px] leading-5">{r.why}</p>
            </div>
          ))}
        </div>
      </div>
    </AppWindow>
  );
}

/** Live research progress, as shown while a search runs. */
export function ResearchMock() {
  const steps = [
    ["Understanding your request", "done"],
    ["Searching public sources", "done"],
    ["Checking 12 companies against your Company Brain", "active"],
    ["Finding the right people", "todo"],
  ] as const;
  return (
    <AppWindow url="app.salesscout.co/discover">
      <div className="theme-ink brand-hero p-5">
        <div className="flex items-center gap-3">
          <LogoMark size={32} working label={null} />
          <div>
            <p className="text-sm font-semibold text-heading">Researching your market</p>
            <p className="text-xs text-muted">Every company is checked before it reaches you.</p>
          </div>
        </div>
        <ol className="mt-4 flex flex-col gap-2">
          {steps.map(([label, s]) => (
            <li key={label} className="flex items-center gap-2.5 text-[13px]">
              <span className={cn("flex size-4 items-center justify-center rounded-full", s === "done" ? "bg-accent text-accent-fg" : s === "active" ? "border-2 border-accent" : "border border-border-strong")} aria-hidden>
                {s === "done" && "✓"}
              </span>
              <span className={s === "todo" ? "text-subtle" : "text-text"}>{label}</span>
            </li>
          ))}
        </ol>
      </div>
    </AppWindow>
  );
}

/** The six-dimension fit explanation. */
export function FitMock() {
  const levels = ["strong", "strong", "strong", "moderate", "strong", "unknown"] as const;
  return (
    <AppWindow url="app.salesscout.co/prospects/kopano">
      <div className="p-5">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-accent-text"><Needle className="size-3.5" /> Why this lead?</p>
        <p className="mt-1 font-semibold text-heading">Strong on 4 of 6. One thing we couldn&apos;t confirm.</p>
        <dl className="mt-3 divide-y divide-border">
          {(Object.keys(FIT_LABELS) as (keyof typeof FIT_LABELS)[]).map((k, i) => (
            <div key={k} className="flex items-center justify-between gap-4 py-2">
              <dt className="text-[13px] text-muted">{FIT_LABELS[k]}</dt>
              <dd><FitLevelIndicator level={levels[i]} /></dd>
            </div>
          ))}
        </dl>
        <div className="mt-3 rounded-lg border border-insight-border border-l-[3px] border-l-accent bg-insight px-3 py-2 text-[12px]">
          <span className="font-semibold text-accent-text">Sources · </span>
          <span className="text-muted">kopano.example · /services · news: plant expansion</span>
        </div>
      </div>
    </AppWindow>
  );
}

/** Mini pipeline board. */
export function PipelineMock() {
  const cols = [
    ["New", "border-t-border-strong", ["Umgeni Water Works"]],
    ["Contacted", "border-t-info", ["Highveld Aggregates", "Bushveld Mills"]],
    ["Meeting", "border-t-accent", ["Kopano Platinum"]],
    ["Won", "border-t-strong", ["Karoo Cement"]],
  ] as const;
  return (
    <AppWindow url="app.salesscout.co/pipeline">
      <div className="grid grid-cols-4 gap-2 p-4 max-sm:grid-cols-2">
        {cols.map(([name, color, items]) => (
          <div key={name} className={cn("rounded-lg border border-border border-t-[3px] bg-surface-2 p-2", color)}>
            <p className="px-1 pb-2 text-[11px] font-semibold text-heading">{name} <span className="text-subtle">{items.length}</span></p>
            <div className="flex flex-col gap-1.5">
              {items.map((it) => (
                <div key={it} className="rounded-md border border-border bg-surface px-2 py-1.5 text-[11px] font-medium">{it}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppWindow>
  );
}

/** Outreach draft, clearly for the user to send. */
export function DraftMock() {
  return (
    <AppWindow url="app.salesscout.co/prospects/kopano/outreach">
      <div className="p-5 text-[13px]">
        <p className="text-xs text-subtle">Draft for: Plant Engineering Manager · Kopano Platinum</p>
        <p className="mt-2 font-semibold text-heading">Subject: Keeping your mill pumps running through the expansion</p>
        <p className="mt-2 leading-6 text-muted">
          Hi — I saw Kopano is adding a second milling line this year. We maintain slurry pumps for concentrators of a similar size, and the first months after an expansion are usually when unplanned stops cost the most…
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-accent-fg">Copy to my email</span>
          <span className="rounded-md border border-border px-2.5 py-1 text-xs">Make it shorter</span>
          <span className="ml-auto flex items-center gap-1 text-[11px] text-subtle"><Send className="size-3" aria-hidden /> You send it. Never us.</span>
        </div>
      </div>
    </AppWindow>
  );
}

/** Export formats. */
export function ExportMock() {
  const files = [
    [FileSpreadsheet, "prospects.xlsx", "Excel, CRM-ready"],
    [FileText, "prospects.csv", "Any CRM import"],
    [Download, "client-report.pdf", "Polished summary"],
  ] as const;
  return (
    <AppWindow url="app.salesscout.co/exports">
      <ul className="flex flex-col gap-2 p-4">
        {files.map(([Icon, name, note]) => (
          <li key={name} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
            <span className="flex size-8 items-center justify-center rounded-md bg-accent-soft text-accent-text"><Icon className="size-4" aria-hidden /></span>
            <span className="flex-1">
              <span className="block font-mono text-[12px] font-medium">{name}</span>
              <span className="block text-[11px] text-subtle">{note}</span>
            </span>
            <span className="text-[11px] text-subtle">Blanks stay blank</span>
          </li>
        ))}
      </ul>
    </AppWindow>
  );
}
