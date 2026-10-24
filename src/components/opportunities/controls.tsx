"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Check, FileText, NotebookPen, Sparkles, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { JobProgress } from "@/components/ai/job-progress";
import { useAction } from "@/components/prospects/shared";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/components/ui/cn";
import { formatDate, relativeDay, timeAgo } from "@/lib/format";
import {
  addItemAction,
  createDocumentAction,
  deleteItemAction,
  deleteOpportunityAction,
  saveDetailsAction,
  saveProductSignalAction,
  saveTextDocAction,
  setStageAction,
  setStatusAction,
  startAiAction,
  toggleTaskAction,
} from "@/app/actions/opportunities";
import { DOC_KINDS, STAGE_META, STAGES, type DocKind, type ProductSignal, type Stage } from "@/lib/opportunities/types";

export function StageSelect({ id, stage }: { id: string; stage: Stage }) {
  const { pending, run } = useAction();
  return (
    <Select
      aria-label="Stage"
      value={stage}
      disabled={pending}
      className="h-9 w-auto min-w-40 font-medium"
      onChange={(e) => {
        const next = e.target.value as Stage;
        const reason = ["lost", "declined"].includes(next) ? window.prompt(`Why ${next === "lost" ? "was it lost" : "are we declining"}? (optional)`) ?? undefined : undefined;
        run(() => setStageAction(id, next, reason), { success: `Moved to ${STAGE_META[next].label}` });
      }}
    >
      {STAGES.map((s) => <option key={s} value={s}>{STAGE_META[s].label}</option>)}
    </Select>
  );
}

/** Starts a bounded AI task in the background and shows its real progress. */
export function AiTaskButton({ id, task, label, title, doneTitle, steps, variant = "secondary", disabled, disabledReason }: {
  id: string;
  task: string;
  label: string;
  title: string;
  doneTitle: string;
  steps: readonly { key: string; label: string }[];
  variant?: "primary" | "secondary" | "subtle";
  disabled?: boolean;
  disabledReason?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [job, setJob] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const start = async () => {
    setStarting(true);
    const r = await startAiAction(id, task);
    setStarting(false);
    if (!r.ok) return toast({ kind: "error", title: r.error });
    setJob(r.data);
  };
  if (job) {
    return (
      <JobProgress
        jobId={job}
        title={title}
        doneTitle={doneTitle}
        initialSteps={[...steps]}
        onDone={(j) => {
          if (j.status !== "failed") {
            setJob(null);
            router.refresh();
          }
        }}
        failureActions={() => (
          <>
            <Button size="sm" onClick={start}>Try again</Button>
            <Button size="sm" variant="ghost" onClick={() => setJob(null)}>Close</Button>
          </>
        )}
      />
    );
  }
  return (
    <span className="inline-flex flex-col gap-1">
      <Button variant={variant} icon={<Sparkles className="size-4" />} loading={starting} disabled={disabled} onClick={start} title={disabled ? disabledReason : undefined}>{label}</Button>
      {disabled && disabledReason && <span className="text-xs text-subtle">{disabledReason}</span>}
    </span>
  );
}

export function CreateDocButton({ id, kind, label, variant = "secondary" }: { id: string; kind: DocKind; label?: string; variant?: "secondary" | "ghost" | "primary" }) {
  const { pending, run } = useAction();
  return (
    <Button
      variant={variant}
      icon={<FileText className="size-4" />}
      loading={pending}
      onClick={() => run(() => createDocumentAction(id, kind), { success: `${DOC_KINDS[kind]} saved as a new version`, then: (docId) => window.open(`/reports/opportunity/${docId}`, "_blank") })}
    >
      {label ?? `Create ${DOC_KINDS[kind].toLowerCase()}`}
    </Button>
  );
}

/** Edits a brief, proposal or project record field by field. Nothing here is sent anywhere. */
export function TextDocEditor({ id, which, fields, values, prefill, footer }: { id: string; which: "brief" | "proposal" | "project"; fields: readonly (readonly [string, string])[]; values: Record<string, string> | null; prefill?: Record<string, string> | null; footer?: React.ReactNode }) {
  const { pending, run } = useAction();
  const [draft, setDraft] = useState<Record<string, string>>(() => Object.fromEntries(fields.map(([k]) => [k, values?.[k] ?? prefill?.[k] ?? ""])));
  const dirty = fields.some(([k]) => (values?.[k] ?? "") !== draft[k]);
  return (
    <div className="flex flex-col gap-5">
      {fields.map(([k, label]) => (
        <Field key={k} label={label}>
          {(p) => (
            <Textarea
              {...p}
              value={draft[k]}
              onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
              className={cn("min-h-20", /To be completed by Mea Creo|To confirm/i.test(draft[k]) && "border-moderate/60 bg-moderate-soft/30")}
            />
          )}
        </Field>
      ))}
      <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center gap-2 border-t border-border bg-surface/95 px-5 py-3 backdrop-blur">
        <Button variant="primary" loading={pending} disabled={!dirty} onClick={() => run(() => saveTextDocAction(id, which, draft), { success: "Saved" })}>
          {dirty ? "Save changes" : "Saved"}
        </Button>
        {footer}
      </div>
    </div>
  );
}

export function StatusSelect({ id, which, value, options }: { id: string; which: "proposal" | "project"; value: string | null; options: [string, string][] }) {
  const { pending, run } = useAction();
  return (
    <Select aria-label={`${which} status`} value={value ?? ""} disabled={pending} className="h-9 w-auto" onChange={(e) => run(() => setStatusAction(id, which, e.target.value), { success: "Status updated" })}>
      {!value && <option value="">Set status…</option>}
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </Select>
  );
}

type Item = { id: string; kind: "note" | "meeting" | "task" | "activity"; body: string; dueAt: Date | null; doneAt: Date | null; by: string | null; createdAt: Date };

/** Notes, meeting notes and tasks, plus the read-only activity trail. */
export function ActivityPanel({ id, items }: { id: string; items: Item[] }) {
  const { pending, run } = useAction();
  const [kind, setKind] = useState<"note" | "meeting" | "task">("note");
  const [body, setBody] = useState("");
  const [due, setDue] = useState("");
  const tasks = items.filter((i) => i.kind === "task");
  const openTasks = tasks.filter((t) => !t.doneAt).sort((a, b) => (a.dueAt?.getTime() ?? Infinity) - (b.dueAt?.getTime() ?? Infinity));
  const timeline = items.filter((i) => i.kind !== "task" || i.doneAt);
  const ICON = { note: NotebookPen, meeting: Users, task: Check, activity: CalendarClock };

  return (
    <div className="flex flex-col gap-5">
      <form
        className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => addItemAction(id, { kind, body, dueAt: due }), { success: kind === "task" ? "Task added" : "Saved", then: () => { setBody(""); setDue(""); } });
        }}
      >
        <div role="radiogroup" aria-label="Type" className="flex gap-1">
          {(["note", "meeting", "task"] as const).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={cn("rounded-md px-2.5 py-1 text-xs font-medium", kind === k ? "bg-accent-soft text-accent-text" : "text-muted hover:text-text")}>
              {k === "note" ? "Note" : k === "meeting" ? "Meeting notes" : "Task"}
            </button>
          ))}
        </div>
        <Textarea aria-label={kind === "task" ? "Task" : "Note"} value={body} onChange={(e) => setBody(e.target.value)} className="min-h-16" placeholder={kind === "task" ? "e.g. Send discovery questions" : kind === "meeting" ? "What you learned on the call. Future AI work uses this too." : "Anything worth remembering"} />
        <div className="flex items-center gap-2">
          {kind === "task" && <Input type="date" aria-label="Due date" value={due} onChange={(e) => setDue(e.target.value)} className="h-8 w-auto text-sm" />}
          <Button type="submit" size="sm" variant="primary" loading={pending} disabled={!body.trim()} className="ml-auto">Add</Button>
        </div>
      </form>

      {openTasks.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Open tasks</h3>
          <ul className="flex flex-col gap-1.5">
            {openTasks.map((t) => (
              <li key={t.id} className="group flex items-start gap-2.5 rounded-md border border-border bg-surface px-3 py-2">
                <button type="button" aria-label={`Mark "${t.body}" done`} onClick={() => run(() => toggleTaskAction(t.id))} className="mt-0.5 size-4 shrink-0 rounded border border-border-strong hover:border-accent" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{t.body}</p>
                  {t.dueAt && <p className={cn("text-xs", t.dueAt.getTime() < Date.now() ? "font-medium text-weak" : "text-subtle")}>Due {relativeDay(t.dueAt)}</p>}
                </div>
                <button type="button" aria-label="Delete task" onClick={() => run(() => deleteItemAction(t.id))} className="text-subtle opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-weak"><Trash2 className="size-3.5" /></button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold">History</h3>
        <ol className="flex flex-col">
          {timeline.map((i) => {
            const Icon = ICON[i.kind];
            return (
              <li key={i.id} className="group relative flex gap-3 pb-4 before:absolute before:top-6 before:bottom-0 before:left-[11px] before:w-px before:bg-border last:before:hidden">
                <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full", i.kind === "activity" ? "bg-surface-2 text-subtle" : "bg-accent-soft text-accent-text")}><Icon className="size-3.5" aria-hidden /></span>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm whitespace-pre-wrap", i.kind === "activity" ? "text-muted" : "text-text", i.kind === "task" && "line-through decoration-subtle")}>{i.kind === "meeting" && <span className="font-medium">Meeting notes: </span>}{i.body}</p>
                  <p className="text-xs text-subtle" title={formatDate(i.createdAt, true)}>{i.by && i.by !== "customer" && i.by !== "system" ? `${i.by.split("@")[0]} · ` : i.by === "customer" ? "Customer · " : ""}{timeAgo(i.createdAt)}</p>
                </div>
                {i.kind !== "activity" && i.kind !== "task" && (
                  <button type="button" aria-label="Delete" onClick={() => window.confirm("Delete this note?") && run(() => deleteItemAction(i.id))} className="self-start text-subtle opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-weak"><Trash2 className="size-3.5" /></button>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

type Details = { name: string; email: string; phone: string | null; role: string | null; companyName: string | null; website: string | null; region: string | null };

export function DetailsEditor({ id, details }: { id: string; details: Details }) {
  const { pending, run } = useAction();
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(details).map(([k, x]) => [k, x ?? ""])));
  const rows: [keyof Details, string][] = [["name", "Name"], ["email", "Email"], ["phone", "Phone"], ["role", "Role"], ["companyName", "Company"], ["website", "Website"], ["region", "Region"]];
  if (!edit) {
    return (
      <div>
        <dl className="grid grid-cols-[90px_1fr] gap-x-3 gap-y-2 text-sm">
          {rows.map(([k, l]) => (
            <div key={k} className="contents">
              <dt className="text-subtle">{l}</dt>
              <dd className="min-w-0 break-words">
                {k === "email" && details.email ? <a href={`mailto:${details.email}`} className="text-accent-text hover:underline">{details.email}</a>
                  : k === "website" && details.website ? <a href={/^https?:\/\//i.test(details.website) ? details.website : `https://${details.website}`} target="_blank" rel="noopener noreferrer" className="text-accent-text hover:underline">{details.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a>
                  : k === "phone" && details.phone ? <a href={`tel:${details.phone.replace(/\s/g, "")}`} className="text-accent-text hover:underline">{details.phone}</a>
                  : details[k] || <span className="text-subtle">Not given</span>}
              </dd>
            </div>
          ))}
        </dl>
        <Button size="sm" variant="ghost" className="mt-3 -ml-2" onClick={() => setEdit(true)}>Correct details</Button>
      </div>
    );
  }
  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); run(() => saveDetailsAction(id, v), { success: "Details updated", then: () => setEdit(false) }); }}>
      {rows.map(([k, l]) => (
        <Field key={k} label={l}>{(p) => <Input {...p} value={v[k]} onChange={(e) => setV((d) => ({ ...d, [k]: e.target.value }))} className="h-9" />}</Field>
      ))}
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="primary" loading={pending}>Save</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setEdit(false)}>Cancel</Button>
      </div>
    </form>
  );
}

export function ProductSignalForm({ id, value }: { id: string; value: ProductSignal | null }) {
  const { pending, run } = useAction();
  const [v, setV] = useState<ProductSignal>(value ?? { candidate: false, category: "", components: "", notes: "" });
  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); run(() => saveProductSignalAction(id, v), { success: "Saved" }); }}>
      <label className="flex items-center gap-2.5 text-sm font-medium">
        <input type="checkbox" checked={v.candidate} onChange={(e) => setV({ ...v, candidate: e.target.checked })} className="size-4 accent-[var(--accent)]" />
        This could become a reusable product
      </label>
      <Field label="Problem category" optional hint="Use the same words each time so similar problems group together.">{(p) => <Input {...p} value={v.category} onChange={(e) => setV({ ...v, category: e.target.value })} placeholder="e.g. Quote automation" />}</Field>
      <Field label="Reusable components" optional>{(p) => <Textarea {...p} value={v.components} onChange={(e) => setV({ ...v, components: e.target.value })} className="min-h-16" />}</Field>
      <Field label="Evidence and notes" optional hint="Delivery effort, maintenance, outcomes, similar demand.">{(p) => <Textarea {...p} value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} className="min-h-16" />}</Field>
      <Button type="submit" size="sm" variant="secondary" loading={pending} className="self-start">Save</Button>
    </form>
  );
}

export function DeleteOpportunity({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const { pending, run } = useAction();
  return (
    <Button
      variant="danger"
      size="sm"
      icon={<Trash2 className="size-4" />}
      loading={pending}
      onClick={() => {
        const typed = window.prompt(`This permanently deletes the opportunity, its notes, research and documents. Use it for deletion requests or spam.\n\nType "${name}" to confirm.`);
        if (typed !== null) run(() => deleteOpportunityAction(id, typed), { success: "Deleted", refresh: false, then: () => router.push("/opportunities") });
      }}
    >
      Delete permanently
    </Button>
  );
}
