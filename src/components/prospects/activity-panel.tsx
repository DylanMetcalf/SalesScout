"use client";

import { useState } from "react";
import { CalendarCheck, Circle, CircleCheck, Mail, MessageSquare, Phone, Users, Compass, Flag, History, Send, Telescope, ThumbsDown, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/components/ui/cn";
import { addNoteAction, logTouchAction, setFollowUpDoneAction } from "@/app/actions/prospects";
import { formatDate, relativeDay, timeAgo } from "@/lib/format";
import { useAction } from "./shared";

export type ActivityItem = { id: string; type: string; title: string; body: string | null; createdAt: number };
export type FollowUpItem = { id: string; title: string; notes: string | null; dueAt: number; completedAt: number | null };
export type AuditItem = { id: string; summary: string; source: string; createdAt: number };

const ICONS: Record<string, typeof Circle> = {
  note: MessageSquare, call: Phone, email: Mail, meeting: Users, outreach: Send, status: ArrowRightLeft,
  created: Compass, research: Telescope, feedback: ThumbsDown, follow_up: CalendarCheck, export: Flag,
};

export function ActivityPanel({ prospectId, activities, followUps, audit, onFollowUp }: { prospectId: string; activities: ActivityItem[]; followUps: FollowUpItem[]; audit: AuditItem[]; onFollowUp: () => void }) {
  const [note, setNote] = useState("");
  const [kind, setKind] = useState<"note" | "call" | "email" | "meeting">("note");
  const [showAudit, setShowAudit] = useState(false);
  const { pending, run } = useAction();
  const open = followUps.filter((f) => !f.completedAt);
  const done = followUps.filter((f) => f.completedAt);
  const today = new Date().setHours(0, 0, 0, 0);

  const submit = () =>
    run(() => (kind === "note" ? addNoteAction(prospectId, note) : logTouchAction(prospectId, kind, note)), {
      success: kind === "note" ? "Note added" : "Logged",
      then: () => setNote(""),
    });

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="h-fu">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="h-fu" className="text-xs font-semibold uppercase tracking-[0.08em] text-subtle">Follow-ups</h2>
          <Button size="sm" variant="ghost" icon={<CalendarCheck className="size-4" />} onClick={onFollowUp}>Schedule</Button>
        </div>
        {open.length === 0 && <p className="text-muted">Nothing scheduled.</p>}
        <ul className="flex flex-col gap-1">
          {[...open, ...done.slice(0, 3)].map((f) => {
            const overdue = !f.completedAt && f.dueAt < today;
            return (
              <li key={f.id} className="flex items-center gap-3 rounded-md px-1 py-1.5">
                <button
                  aria-label={f.completedAt ? `Mark "${f.title}" as not done` : `Mark "${f.title}" as done`}
                  onClick={() => run(() => setFollowUpDoneAction(f.id, !f.completedAt))}
                  className="text-subtle hover:text-accent"
                >
                  {f.completedAt ? <CircleCheck className="size-5 text-strong animate-check-pop" /> : <Circle className="size-5" />}
                </button>
                <span className={cn("flex-1", f.completedAt && "text-subtle line-through")}>{f.title}</span>
                <span className={cn("text-sm", overdue ? "font-medium text-weak" : "text-muted")}>{relativeDay(f.dueAt)}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="h-log">
        <h2 id="h-log" className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-subtle">Add to the record</h2>
        <div className="rounded-lg border border-border bg-surface focus-within:border-accent focus-within:shadow-[var(--ring)]">
          <div role="radiogroup" aria-label="What are you recording?" className="flex gap-1 border-b border-border p-1.5">
            {(
              [
                ["note", "Note", MessageSquare],
                ["call", "Call", Phone],
                ["email", "Email", Mail],
                ["meeting", "Meeting", Users],
              ] as const
            ).map(([k, l, Icon]) => (
              <button key={k} role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium", kind === k ? "bg-surface-2 text-text" : "text-muted hover:text-text")}>
                <Icon className="size-3.5" aria-hidden />
                {l}
              </button>
            ))}
          </div>
          <label htmlFor="log-body" className="sr-only">Details</label>
          <Textarea
            id="log-body"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={kind === "note" ? "Write a note…" : `What happened on the ${kind}?`}
            className="min-h-20 border-0 shadow-none focus:shadow-none"
          />
          <div className="flex justify-end px-2 pb-2">
            <Button size="sm" variant="primary" loading={pending} disabled={kind === "note" && !note.trim()} onClick={submit}>
              {kind === "note" ? "Add note" : `Log ${kind}`}
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="h-timeline">
        <h2 id="h-timeline" className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-subtle">Activity</h2>
        <ol className="relative flex flex-col gap-5 border-l border-border pl-6">
          {activities.map((a) => {
            const Icon = ICONS[a.type] ?? Circle;
            return (
              <li key={a.id} className="relative">
                <span className="absolute top-0.5 -left-[35px] flex size-[22px] items-center justify-center rounded-full border border-border bg-surface text-muted">
                  <Icon className="size-3" aria-hidden />
                </span>
                <p className="text-[14.5px] font-medium">{a.title}</p>
                {a.body && <p className="mt-0.5 whitespace-pre-line text-sm text-muted">{a.body}</p>}
                <time className="text-xs text-subtle" dateTime={new Date(a.createdAt).toISOString()} title={formatDate(a.createdAt, true)}>
                  {timeAgo(a.createdAt)}
                </time>
              </li>
            );
          })}
        </ol>
      </section>

      {audit.length > 0 && (
        <section>
          <button className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text" onClick={() => setShowAudit((s) => !s)} aria-expanded={showAudit}>
            <History className="size-4" aria-hidden /> {showAudit ? "Hide" : "Show"} audit trail
          </button>
          {showAudit && (
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {audit.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className="w-28 shrink-0 text-subtle">{formatDate(a.createdAt, true)}</span>
                  <span className="flex-1">{a.summary}</span>
                  <span className="shrink-0 text-xs text-subtle">{{ user: "You", ai: "AI analysis", web_research: "Web research", system: "System", extraction: "Extraction" }[a.source] ?? a.source}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
