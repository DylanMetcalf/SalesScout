"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { createFollowUpAction } from "@/app/actions/prospects";
import { useAction } from "./shared";

function inDays(n: number) {
  const d = new Date(Date.now() + n * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export function FollowUpDialog({ open, onClose, prospectId, prospectName, suggestion }: { open: boolean; onClose: () => void; prospectId: string; prospectName: string; suggestion?: string | null }) {
  const [title, setTitle] = useState(suggestion ?? "");
  const [due, setDue] = useState(inDays(3));
  const [notes, setNotes] = useState("");
  const { pending, run } = useAction();
  const submit = () =>
    run(() => createFollowUpAction({ prospectId, title, dueAt: `${due}T09:00:00`, notes }), {
      success: "Follow-up scheduled",
      then: () => {
        setTitle("");
        setNotes("");
        onClose();
      },
    });
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title="Schedule a follow-up"
      description={prospectName}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={pending} disabled={!title.trim()} onClick={submit}>Schedule</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="What needs to happen?">{(p) => <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Call Thabo about the site visit" autoFocus />}</Field>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fu-due" className="text-sm font-medium">When</label>
          <div className="flex flex-wrap gap-2">
            {[
              ["Tomorrow", 1],
              ["In 3 days", 3],
              ["Next week", 7],
              ["In 2 weeks", 14],
            ].map(([l, n]) => (
              <button key={l} type="button" onClick={() => setDue(inDays(n as number))} className={`rounded-full border px-3 py-1 text-sm ${due === inDays(n as number) ? "border-accent bg-accent-soft text-accent-text" : "border-border text-muted hover:text-text"}`}>
                {l}
              </button>
            ))}
          </div>
          <Input id="fu-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} className="mt-1 w-48" />
        </div>
        <Field label="Notes" optional>{(p) => <Textarea {...p} value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-20" />}</Field>
      </div>
    </Dialog>
  );
}
