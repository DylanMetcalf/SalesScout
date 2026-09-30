"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleHelp, Pencil, Plus, Trash2, X } from "lucide-react";
import { BRAIN } from "@/lib/brain-fields";
import { BRAIN_SECTIONS, type BrainSection, type Knowledge } from "@/lib/db/schema";
import { Button, IconButton } from "@/components/ui/button";
import { Textarea, Select } from "@/components/ui/input";
import { KnowledgeBadge } from "@/components/ui/knowledge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/components/ui/cn";
import { addFactAction, confirmFactAction, removeFactAction, updateFactAction } from "@/app/actions/brain";

export type FactLite = {
  id: string;
  section: BrainSection;
  field: string;
  value: string;
  knowledge: Knowledge;
  rationale: string | null;
  sourceIds: string[];
  origin: string;
};

type Run = (fn: () => Promise<{ ok: boolean; error?: string }>, success?: string) => void;

function useRun(): [boolean, Run] {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const run: Run = (fn, success) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) toast({ kind: "error", title: (r as { error: string }).error });
      else {
        if (success) toast({ title: success });
        router.refresh();
      }
    });
  return [pending, run];
}

/** The reviewable, editable Company Brain. Everything the AI believes is visible and changeable. */
export function BrainEditor({ facts, sourceLabels, sections = BRAIN_SECTIONS }: { facts: FactLite[]; sourceLabels: Record<string, string>; sections?: readonly BrainSection[] }) {
  return (
    <div className="flex flex-col gap-5">
      {sections.map((section) => (
        <SectionCard key={section} section={section} facts={facts.filter((f) => f.section === section)} sourceLabels={sourceLabels} />
      ))}
    </div>
  );
}

function SectionCard({ section, facts, sourceLabels }: { section: BrainSection; facts: FactLite[]; sourceLabels: Record<string, string> }) {
  const meta = BRAIN[section];
  const known = facts.filter((f) => f.knowledge !== "unknown");
  const unknowns = facts.filter((f) => f.knowledge === "unknown");
  const fieldsWithFacts = Object.keys(meta.fields).filter((k) => known.some((f) => f.field === k));
  const [adding, setAdding] = useState(false);

  return (
    <section id={`brain-${section}`} className="scroll-mt-6 rounded-lg border border-border bg-surface shadow-sm" aria-labelledby={`brain-h-${section}`}>
      <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-3.5">
        <div>
          <h3 id={`brain-h-${section}`} className="font-semibold">
            {meta.title}
          </h3>
          <p className="text-sm text-muted">{meta.question}</p>
        </div>
        <Button size="sm" variant="ghost" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
          Add
        </Button>
      </header>
      <div className="divide-y divide-border">
        {fieldsWithFacts.length === 0 && !adding && (
          <p className="px-5 py-4 text-sm text-muted">
            {section === "exclusions" ? "No exclusions yet. Add industries, companies or roles you never want suggested." : "Nothing here yet."}
          </p>
        )}
        {fieldsWithFacts.map((field) => (
          <div key={field} className="grid gap-2 px-5 py-3.5 sm:grid-cols-[190px_1fr] sm:gap-5">
            <p className="text-sm font-medium text-muted sm:pt-0.5">{meta.fields[field]}</p>
            <ul className="flex flex-col gap-2.5">
              {known
                .filter((f) => f.field === field)
                .map((f) => (
                  <FactRow key={f.id} fact={f} sourceLabels={sourceLabels} />
                ))}
            </ul>
          </div>
        ))}
        {adding && <AddFact section={section} onClose={() => setAdding(false)} />}
        {unknowns.length > 0 && (
          <div className="bg-surface-2/50 px-5 py-3.5">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.08em] text-subtle">
              <CircleHelp className="size-3.5" aria-hidden /> What we don&apos;t know yet
            </p>
            <ul className="flex flex-col gap-1.5">
              {unknowns.map((u) => (
                <UnknownRow key={u.id} fact={u} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function FactRow({ fact, sourceLabels }: { fact: FactLite; sourceLabels: Record<string, string> }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(fact.value);
  const [why, setWhy] = useState(false);
  const [pending, run] = useRun();

  if (editing) {
    return (
      <li className="flex flex-col gap-2">
        <Textarea aria-label="Edit statement" value={value} onChange={(e) => setValue(e.target.value)} className="min-h-20" autoFocus />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="primary"
            loading={pending}
            onClick={() => {
              run(() => updateFactAction(fact.id, value), "Saved — marked as confirmed");
              setEditing(false);
            }}
          >
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setValue(fact.value); setEditing(false); }}>
            Cancel
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className={cn("group flex flex-col gap-1", pending && "opacity-60")}>
      <div className="flex items-start gap-3">
        <p className="min-w-0 flex-1 text-[14.5px] leading-6">{fact.value}</p>
        <div className="flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          {fact.knowledge !== "confirmed" && (
            <IconButton label="Confirm this is right" size="sm" onClick={() => run(() => confirmFactAction(fact.id), "Confirmed")}>
              <Check className="size-4" />
            </IconButton>
          )}
          <IconButton label="Edit" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="size-3.5" />
          </IconButton>
          <IconButton label="Remove" size="sm" onClick={() => run(() => removeFactAction(fact.id), "Removed")}>
            <Trash2 className="size-3.5" />
          </IconButton>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <KnowledgeBadge value={fact.knowledge} />
        {fact.origin === "user" && <span className="text-xs text-subtle">Yours</span>}
        {(fact.rationale || fact.sourceIds.length > 0) && (
          <button className="text-xs font-medium text-muted hover:text-text" aria-expanded={why} onClick={() => setWhy((w) => !w)}>
            {why ? "Hide why" : "Why?"}
          </button>
        )}
      </div>
      {why && (
        <div className="mt-1 rounded-md bg-surface-2 px-3 py-2 text-sm text-muted animate-fade-in">
          {fact.rationale && <p>{fact.rationale}</p>}
          {fact.sourceIds.length > 0 && (
            <p className="mt-1 text-xs">
              Sources: {fact.sourceIds.map((id) => sourceLabels[id] ?? "a removed source").join(" · ")}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function UnknownRow({ fact }: { fact: FactLite }) {
  const [answering, setAnswering] = useState(false);
  const [value, setValue] = useState("");
  const [pending, run] = useRun();
  return (
    <li className="text-sm">
      <div className="flex items-start gap-2">
        <span className="flex-1 text-muted">{fact.value}</span>
        {!answering && (
          <button className="shrink-0 text-xs font-medium text-accent-text hover:underline" onClick={() => setAnswering(true)}>
            Answer this
          </button>
        )}
        <IconButton label="Dismiss" size="sm" className="-my-1" onClick={() => run(() => removeFactAction(fact.id))}>
          <X className="size-3.5" />
        </IconButton>
      </div>
      {answering && (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Textarea aria-label={fact.value} value={value} onChange={(e) => setValue(e.target.value)} className="min-h-10 flex-1" rows={2} autoFocus />
          <div className="flex gap-2 sm:flex-col">
            <Button
              size="sm"
              variant="primary"
              loading={pending}
              disabled={!value.trim()}
              onClick={() => run(async () => {
                const r = await addFactAction({ section: fact.section, field: fact.field, value });
                if (r.ok) await removeFactAction(fact.id);
                return r;
              }, "Added to your Company Brain")}
            >
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAnswering(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

function AddFact({ section, onClose }: { section: BrainSection; onClose: () => void }) {
  const fields = Object.entries(BRAIN[section].fields);
  const [field, setField] = useState(fields[0][0]);
  const [value, setValue] = useState("");
  const [pending, run] = useRun();
  return (
    <form
      className="flex flex-col gap-2 bg-accent-soft/30 px-5 py-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => addFactAction({ section, field, value }), "Added");
        onClose();
      }}
    >
      <Select aria-label="What is this about?" value={field} onChange={(e) => setField(e.target.value)} className="sm:w-72">
        {fields.map(([k, l]) => (
          <option key={k} value={k}>{l}</option>
        ))}
      </Select>
      <Textarea aria-label="Statement" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Write it the way you'd explain it to a new colleague." className="min-h-20" autoFocus />
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="primary" loading={pending} disabled={!value.trim()}>
          Add
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
