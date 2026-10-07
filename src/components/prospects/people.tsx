"use client";

import { useState } from "react";
import { ExternalLink, Mail, Phone, Plus, Trash2, UserCheck, UserRound } from "lucide-react";
import { Button, IconButton } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { KnowledgeBadge } from "@/components/ui/knowledge";
import { addContactAction, removeContactAction } from "@/app/actions/prospects";
import type { Knowledge } from "@/lib/db/schema";
import { useAction, type ContactFull } from "./shared";

/** Relevant people: named people only when a source shows them; otherwise the roles to find. */
export function People({ prospectId, contacts, isExample, onDraft }: { prospectId: string; contacts: ContactFull[]; isExample: boolean; onDraft: (contactId: string) => void }) {
  const [adding, setAdding] = useState(false);
  const { pending, run } = useAction();
  return (
    <section aria-labelledby="h-people">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="h-people" className="text-lg">Who should I speak to?</h2>
        <Button size="sm" variant="ghost" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>Add person</Button>
      </div>
      {contacts.length === 0 ? (
        <p className="text-muted">I haven&apos;t found the right person yet. Research deeper, or add someone you already know.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {contacts.map((c, i) => (
            <li key={c.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-start gap-3">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${c.name ? "bg-strong-soft text-strong" : "bg-surface-3 text-subtle"}`}>
                  {c.name ? <UserCheck className="size-4" /> : <UserRound className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{c.name ?? c.role}</p>
                    {i === contacts.findIndex((x) => x.name) && contacts.filter((x) => x.name).length > 1 && (
                      <span className="rounded-full bg-signal-soft px-2 py-0.5 text-xs font-medium text-signal-text">Start here</span>
                    )}
                    {c.name ? <span className="text-muted">{c.role}</span> : <KnowledgeBadge value={"suggested" as Knowledge} />}
                  </div>
                  {!c.name && <p className="text-sm text-subtle">A role worth finding — no named person confirmed in the sources.</p>}
                  <p className="mt-1 text-[14.5px] text-text/85">{c.relevance}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {c.email && <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 text-accent-text hover:underline"><Mail className="size-3.5" />{c.email}</a>}
                    {c.phone && <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 text-accent-text hover:underline"><Phone className="size-3.5" />{c.phone}</a>}
                    {c.profileUrl && <a href={c.profileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-accent-text hover:underline"><ExternalLink className="size-3.5" />Professional profile</a>}
                    {c.sourceUrl && !isExample && <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-muted hover:text-text"><ExternalLink className="size-3.5" />Where we found them</a>}
                    {c.sourceUrl && isExample && <span className="text-subtle">Found on: {c.sourceUrl} (example)</span>}
                    {c.name && !c.email && !c.phone && <span className="text-subtle">No published contact details</span>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => onDraft(c.id)}>Draft</Button>
                  <IconButton label={`Remove ${c.name ?? c.role}`} size="sm" disabled={pending} onClick={() => run(() => removeContactAction(c.id), { success: "Removed — we'll learn from this" })}>
                    <Trash2 className="size-3.5" />
                  </IconButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <AddContact open={adding} onClose={() => setAdding(false)} prospectId={prospectId} />
    </section>
  );
}

function AddContact({ open, onClose, prospectId }: { open: boolean; onClose: () => void; prospectId: string }) {
  const [f, setF] = useState({ name: "", role: "", email: "", phone: "", profileUrl: "" });
  const { pending, run } = useAction();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title="Add a person"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={pending} disabled={!f.role.trim()} onClick={() => run(() => addContactAction(prospectId, f), { success: "Person added", then: () => { setF({ name: "", role: "", email: "", phone: "", profileUrl: "" }); onClose(); } })}>
            Add
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Name" optional>{(p) => <Input {...p} value={f.name} onChange={set("name")} autoFocus />}</Field>
        <Field label="Role">{(p) => <Input {...p} value={f.role} onChange={set("role")} placeholder="e.g. Operations Manager" />}</Field>
        <Field label="Email" optional>{(p) => <Input {...p} type="email" value={f.email} onChange={set("email")} />}</Field>
        <Field label="Phone" optional>{(p) => <Input {...p} type="tel" value={f.phone} onChange={set("phone")} />}</Field>
        <Field label="Professional profile" optional>{(p) => <Input {...p} value={f.profileUrl} onChange={set("profileUrl")} placeholder="https://" />}</Field>
      </div>
    </Dialog>
  );
}
