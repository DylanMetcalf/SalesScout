"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarCheck, Circle, CircleCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Menu } from "@/components/ui/menu";
import { cn } from "@/components/ui/cn";
import { createFollowUpAction, rescheduleFollowUpAction, setFollowUpDoneAction } from "@/app/actions/prospects";
import { useAction } from "@/components/prospects/shared";
import { relativeDay, formatDate } from "@/lib/format";

type Item = { id: string; title: string; notes: string | null; dueAt: number; completedAt: number | null; prospectId: string; prospectName: string };

const iso = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

export function FollowUpsView({ open, done, prospects, startNew }: { open: Item[]; done: Item[]; prospects: { id: string; name: string }[]; startNew: boolean }) {
  const [creating, setCreating] = useState(startNew);
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const endOfToday = startOfToday + 86_400_000;
  const overdue = open.filter((f) => f.dueAt < startOfToday);
  const today = open.filter((f) => f.dueAt >= startOfToday && f.dueAt < endOfToday);
  const upcoming = open.filter((f) => f.dueAt >= endOfToday);

  const groups: { key: string; title: string; items: Item[]; tone?: string; empty?: string }[] = [
    { key: "today", title: "Due today", items: today, empty: "Nothing due today." },
    { key: "overdue", title: "Overdue", items: overdue, tone: "text-weak" },
    { key: "upcoming", title: "Upcoming", items: upcoming },
    { key: "done", title: "Completed", items: done },
  ];

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setCreating(true)} disabled={!prospects.length}>
          New follow-up
        </Button>
      </div>
      {open.length === 0 && done.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface shadow-sm">
          <EmptyState
            icon={<CalendarCheck />}
            title="No follow-ups yet."
            body="Schedule one from any prospect and it will show up here on the right day — so nothing slips."
            action={<Button variant="primary" onClick={() => setCreating(true)} disabled={!prospects.length}>Schedule a follow-up</Button>}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((g) =>
            g.items.length === 0 && !g.empty ? null : (
              <section key={g.key} aria-labelledby={`h-${g.key}`}>
                <h2 id={`h-${g.key}`} className={cn("mb-2.5 flex items-center gap-2 text-sm font-semibold", g.tone)}>
                  {g.title}
                  <span className="rounded-full bg-surface-3 px-1.5 text-xs font-medium tabular-nums text-muted">{g.items.length}</span>
                </h2>
                {g.items.length === 0 ? (
                  <p className="text-sm text-muted">{g.empty}</p>
                ) : (
                  <ul className="divide-y divide-border rounded-lg border border-border bg-surface shadow-sm">
                    {g.items.map((f) => (
                      <Row key={f.id} f={f} overdue={g.key === "overdue"} />
                    ))}
                  </ul>
                )}
              </section>
            ),
          )}
        </div>
      )}
      <NewFollowUp open={creating} onClose={() => setCreating(false)} prospects={prospects} />
    </>
  );
}

function Row({ f, overdue }: { f: Item; overdue: boolean }) {
  const { pending, run } = useAction();
  return (
    <li className={cn("flex items-center gap-3 px-4 py-3", pending && "opacity-60")}>
      <button
        aria-label={f.completedAt ? `Mark "${f.title}" as not done` : `Mark "${f.title}" as done`}
        onClick={() => run(() => setFollowUpDoneAction(f.id, !f.completedAt), { success: f.completedAt ? "Reopened" : `Done — ${f.prospectName} is one step further` })}
        className="text-subtle hover:text-accent"
      >
        {f.completedAt ? <CircleCheck className="size-5 text-strong animate-check-pop" /> : <Circle className="size-5" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("font-medium", f.completedAt && "text-subtle line-through")}>{f.title}</p>
        <Link href={`/prospects/${f.prospectId}`} className="text-sm text-muted hover:text-text hover:underline">
          {f.prospectName}
        </Link>
      </div>
      <span className={cn("shrink-0 text-sm", overdue ? "font-medium text-weak" : "text-muted")} title={formatDate(f.dueAt)}>
        {f.completedAt ? `Done ${relativeDay(f.completedAt).toLowerCase()}` : relativeDay(f.dueAt)}
      </span>
      {!f.completedAt && (
        <Menu
          align="end"
          width={180}
          items={[
            { type: "label", label: "Snooze to" },
            { label: "Tomorrow", onSelect: () => run(() => rescheduleFollowUpAction(f.id, `${iso(1)}T09:00:00`), { success: "Moved to tomorrow" }) },
            { label: "In 3 days", onSelect: () => run(() => rescheduleFollowUpAction(f.id, `${iso(3)}T09:00:00`), { success: "Snoozed 3 days" }) },
            { label: "Next week", onSelect: () => run(() => rescheduleFollowUpAction(f.id, `${iso(7)}T09:00:00`), { success: "Moved to next week" }) },
          ]}
          trigger={({ ref, ...p }) => (
            <Button ref={ref} {...p} size="sm" variant="ghost">Snooze</Button>
          )}
        />
      )}
    </li>
  );
}

function NewFollowUp({ open, onClose, prospects }: { open: boolean; onClose: () => void; prospects: { id: string; name: string }[] }) {
  const [prospectId, setProspectId] = useState(prospects[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState(iso(1));
  const { pending, run } = useAction();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title="New follow-up"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={pending} disabled={!title.trim() || !prospectId} onClick={() => run(() => createFollowUpAction({ prospectId, title, dueAt: `${due}T09:00:00` }), { success: "Follow-up scheduled", then: () => { setTitle(""); onClose(); } })}>
            Schedule
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Prospect">{(p) => <Select {...p} value={prospectId} onChange={(e) => setProspectId(e.target.value)}>{prospects.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>}</Field>
        <Field label="What needs to happen?">{(p) => <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />}</Field>
        <Field label="When">{(p) => <Input {...p} type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-48" />}</Field>
      </div>
    </Dialog>
  );
}
