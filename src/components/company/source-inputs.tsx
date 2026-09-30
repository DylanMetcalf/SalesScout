"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Globe, Plus, Trash2, Upload, CircleCheck, TriangleAlert } from "lucide-react";
import { Button, IconButton } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { PlatformIcon, detectPlatform, PLATFORMS } from "@/components/ui/platform-icon";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/components/ui/cn";
import { addPageAction, addSocialAction, removeSourceAction, setWebsiteAction, uploadDocumentsAction } from "@/app/actions/sources";

export type SourceLite = { id: string; kind: string; subtype: string | null; label: string; url: string | null; status: string; statusDetail: string | null };

function useRun() {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const run = <T,>(fn: () => Promise<{ ok: true; data: T } | { ok: false; error: string }>, success?: string, after?: (d: T) => void) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) toast({ kind: "error", title: r.error });
      else {
        if (success) toast({ title: success });
        after?.(r.data);
        router.refresh();
      }
    });
  return { pending, run };
}

export function WebsiteInput({ current }: { current: string | null }) {
  const [value, setValue] = useState(current ?? "");
  const { pending, run } = useRun();
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => setWebsiteAction(value), "Website saved");
      }}
    >
      <div className="relative flex-1">
        <Globe className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden />
        <Input aria-label="Company website" value={value} onChange={(e) => setValue(e.target.value)} placeholder="yourcompany.com" className="pl-9" inputMode="url" />
      </div>
      <Button type="submit" loading={pending} disabled={!value.trim() || value === current}>
        Save
      </Button>
    </form>
  );
}

const PAGE_OPTIONS = [
  ["about", "About page"], ["services", "Services"], ["products", "Products"], ["case_studies", "Case studies"],
  ["portfolio", "Portfolio"], ["pricing", "Pricing"], ["other", "Other page"],
] as const;

export function PagesInput({ pages }: { pages: SourceLite[] }) {
  const [url, setUrl] = useState("");
  const [type, setType] = useState("services");
  const { pending, run } = useRun();
  return (
    <div className="flex flex-col gap-3">
      {pages.length > 0 && <SourceList sources={pages} />}
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => addPageAction({ url, subtype: type }), "Page added", () => setUrl(""));
        }}
      >
        <Select aria-label="Page type" value={type} onChange={(e) => setType(e.target.value)} className="sm:w-40">
          {PAGE_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>
        <Input aria-label="Page address" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="yourcompany.com/services" className="flex-1" inputMode="url" />
        <Button type="submit" loading={pending} disabled={!url.trim()} icon={<Plus className="size-4" />}>
          Add page
        </Button>
      </form>
    </div>
  );
}

export function SocialInput({ profiles }: { profiles: SourceLite[] }) {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const { pending, run } = useRun();
  const platform = url ? detectPlatform(url) : null;
  return (
    <div className="flex flex-col gap-3">
      {profiles.length > 0 && <SourceList sources={profiles} />}
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => addSocialAction({ url, label }), "Profile added", () => {
            setUrl("");
            setLabel("");
          });
        }}
      >
        <div className="relative flex-1">
          <span className="absolute top-1/2 left-2 -translate-y-1/2">
            <PlatformIcon platform={platform ?? "other"} size={24} />
          </span>
          <Input aria-label="Profile address" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="linkedin.com/company/…" className="pl-11" inputMode="url" />
        </div>
        <Input aria-label="Label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={platform ? `${PLATFORMS[platform].label} — label (optional)` : "Label, e.g. Dylan's LinkedIn"} className="sm:w-56" />
        <Button type="submit" loading={pending} disabled={!url.trim()} icon={<Plus className="size-4" />}>
          Add
        </Button>
      </form>
    </div>
  );
}

export function DocumentUploader({ documents }: { documents: SourceLite[] }) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [results, setResults] = useState<{ name: string; ok: boolean; detail: string }[]>([]);
  const { pending, run } = useRun();
  const upload = (files: FileList | null) => {
    if (!files?.length) return;
    const fd = new FormData();
    for (const f of Array.from(files)) fd.append("files", f);
    run(() => uploadDocumentsAction(fd), undefined, (r) => setResults(r));
  };
  return (
    <div className="flex flex-col gap-3">
      {documents.length > 0 && <SourceList sources={documents} />}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          upload(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center rounded-lg border border-dashed px-6 py-8 text-center transition-colors",
          drag ? "border-accent bg-accent-soft/60" : "border-border-strong bg-surface-2/50",
        )}
      >
        <Upload className="size-5 text-subtle" aria-hidden />
        <p className="mt-2 font-medium">Drop brochures, case studies, proposals or catalogues</p>
        <p className="mt-0.5 text-sm text-muted">PDF, Word, Excel, CSV, PowerPoint or text · up to 15 MB each</p>
        <Button className="mt-4" loading={pending} onClick={() => input.current?.click()}>
          Choose files
        </Button>
        <input ref={input} type="file" multiple hidden accept=".pdf,.docx,.xlsx,.csv,.pptx,.txt,.md" onChange={(e) => upload(e.target.files)} />
      </div>
      {results.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm" aria-live="polite">
          {results.map((r) => (
            <li key={r.name} className="flex items-center gap-2">
              {r.ok ? <CircleCheck className="size-4 text-strong" /> : <TriangleAlert className="size-4 text-moderate" />}
              <span className="font-medium">{r.name}</span>
              <span className="text-muted">— {r.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const STATUS_TEXT: Record<string, { label: string; className: string }> = {
  connected: { label: "Connected", className: "text-strong" },
  analysed: { label: "Analysed", className: "text-strong" },
  pending: { label: "Not analysed yet", className: "text-muted" },
  available: { label: "Available", className: "text-info" },
  requires_permission: { label: "Requires permission", className: "text-moderate" },
  disabled: { label: "Disabled", className: "text-subtle" },
  unavailable: { label: "Unavailable", className: "text-subtle" },
  failed: { label: "Couldn't read", className: "text-weak" },
};

export function SourceStatus({ status }: { status: string }) {
  const s = STATUS_TEXT[status] ?? STATUS_TEXT.pending;
  return <span className={cn("text-xs font-medium", s.className)}>{s.label}</span>;
}

export function SourceList({ sources, removable = true }: { sources: SourceLite[]; removable?: boolean }) {
  const { pending, run } = useRun();
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
      {sources.map((s) => (
        <li key={s.id} className="flex items-center gap-3 px-3.5 py-2.5">
          {s.kind === "social" ? (
            <PlatformIcon platform={s.subtype ?? "other"} size={26} />
          ) : (
            <span className="flex size-[26px] items-center justify-center rounded-md bg-surface-3 text-muted">
              {s.kind === "document" ? <FileText className="size-3.5" /> : <Globe className="size-3.5" />}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{s.label}</p>
            <p className="truncate text-xs text-subtle">{s.url ?? s.statusDetail}</p>
          </div>
          <div className="hidden text-right sm:block">
            <SourceStatus status={s.status} />
            {s.url && s.statusDetail && <p className="max-w-56 truncate text-xs text-subtle">{s.statusDetail}</p>}
          </div>
          {removable && (
            <IconButton label={`Remove ${s.label}`} size="sm" disabled={pending} onClick={() => run(() => removeSourceAction(s.id), "Removed")}>
              <Trash2 className="size-3.5" />
            </IconButton>
          )}
        </li>
      ))}
    </ul>
  );
}
