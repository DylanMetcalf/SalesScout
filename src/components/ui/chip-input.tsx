"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "./cn";

/** Edits a short list of strings (industries, roles, keywords...). Enter or comma adds. */
export function ChipInput({
  value,
  onChange,
  placeholder,
  id,
  className,
  ariaLabel,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const items = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const next = [...value];
    for (const item of items) if (!next.some((v) => v.toLowerCase() === item.toLowerCase())) next.push(item);
    onChange(next);
    setDraft("");
  };
  return (
    <div
      className={cn(
        "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1.5 shadow-sm focus-within:border-accent focus-within:shadow-[var(--ring)]",
        className,
      )}
    >
      {value.map((v) => (
        <span key={v} className="inline-flex h-7 items-center gap-1 rounded-md bg-surface-2 pl-2.5 pr-1 text-sm">
          {v}
          <button type="button" aria-label={`Remove ${v}`} className="rounded p-0.5 text-subtle hover:bg-surface-3 hover:text-text" onClick={() => onChange(value.filter((x) => x !== v))}>
            <X className="size-3.5" />
          </button>
        </span>
      ))}
      <input
        id={id}
        aria-label={ariaLabel}
        value={draft}
        onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter" && draft.trim()) {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => draft.trim() && add(draft)}
        placeholder={value.length ? "" : placeholder}
        className="h-7 min-w-24 flex-1 bg-transparent px-1 text-[14.5px] outline-none placeholder:text-subtle"
      />
    </div>
  );
}
