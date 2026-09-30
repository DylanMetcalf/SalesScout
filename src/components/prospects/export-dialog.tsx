"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/components/ui/cn";
import { STATUS_META } from "@/lib/status";
import { CRM_STATUSES } from "@/lib/db/schema";

const FORMATS = [
  { id: "csv", label: "CSV", body: "For any spreadsheet or CRM import.", icon: Table },
  { id: "xlsx", label: "Excel", body: "Formatted workbook with filters.", icon: FileSpreadsheet },
  { id: "report", label: "Client-ready report", body: "A polished research document you can print or save as PDF.", icon: FileText },
] as const;

export function ExportDialog({ open, onClose, ids }: { open: boolean; onClose: () => void; ids?: string[] }) {
  const [format, setFormat] = useState<(typeof FORMATS)[number]["id"]>("xlsx");
  const [scope, setScope] = useState<"crm" | "all">("crm");
  const [statuses, setStatuses] = useState<string[]>([]);
  const go = () => {
    const params = new URLSearchParams({ scope });
    if (statuses.length) params.set("status", statuses.join(","));
    if (ids?.length) params.set("ids", ids.join(","));
    if (format === "report") window.open(`/reports/prospects?${params}`, "_blank");
    else window.location.href = `/api/export?format=${format}&${params}`;
    onClose();
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Export prospects"
      description="Missing details stay blank — Sales Scout never fills them in."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={go}>Export</Button>
        </>
      }
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Format</legend>
        {FORMATS.map((f) => (
          <label key={f.id} className={cn("flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3", format === f.id ? "border-accent bg-accent-soft/40" : "border-border hover:border-border-strong")}>
            <input type="radio" name="format" value={f.id} checked={format === f.id} onChange={() => setFormat(f.id)} className="accent-[var(--accent)]" />
            <f.icon className="size-4 text-muted" aria-hidden />
            <span>
              <span className="block font-medium">{f.label}</span>
              <span className="block text-sm text-muted">{f.body}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {!ids && (
        <>
          <fieldset className="mt-6">
            <legend className="mb-2 text-sm font-medium">Which prospects</legend>
            <div className="flex gap-2">
              {(
                [
                  ["crm", "In my pipeline"],
                  ["all", "Everything except set aside"],
                ] as const
              ).map(([v, l]) => (
                <label key={v} className={cn("flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm", scope === v ? "border-accent bg-accent-soft/40" : "border-border")}>
                  <input type="radio" name="scope" checked={scope === v} onChange={() => setScope(v)} className="accent-[var(--accent)]" />
                  {l}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-6">
            <legend className="mb-2 text-sm font-medium">Only these stages <span className="font-normal text-subtle">Optional</span></legend>
            <div className="flex flex-wrap gap-1.5">
              {CRM_STATUSES.filter((s) => s !== "rejected").map((s) => {
                const on = statuses.includes(s);
                return (
                  <button key={s} type="button" aria-pressed={on} onClick={() => setStatuses((x) => (on ? x.filter((y) => y !== s) : [...x, s]))} className={cn("rounded-full border px-3 py-1 text-sm", on ? "border-accent bg-accent-soft text-accent-text" : "border-border text-muted hover:text-text")}>
                    {STATUS_META[s].label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </>
      )}
    </Dialog>
  );
}
