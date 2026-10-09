"use client";

import { useEffect, useState } from "react";
import { Check, Palette } from "lucide-react";
import { PALETTES, PALETTE_KEY, type PaletteId } from "@/lib/palettes";
import { cn } from "./cn";

function apply(id: PaletteId) {
  const root = document.documentElement;
  if (id === "night") delete root.dataset.palette;
  else root.dataset.palette = id;
  try {
    localStorage.setItem(PALETTE_KEY, id);
  } catch {}
}

/** Swatch list for trying colour palettes. Saved in this browser only. */
export function PalettePicker({ className }: { className?: string }) {
  const [current, setCurrent] = useState<PaletteId>("night");
  useEffect(() => setCurrent((document.documentElement.dataset.palette as PaletteId) ?? "night"), []);

  return (
    <div role="radiogroup" aria-label="Colour palette" className={cn("grid gap-2 sm:grid-cols-2", className)}>
      {PALETTES.map((p) => {
        const on = p.id === current;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => {
              apply(p.id);
              setCurrent(p.id);
            }}
            className={cn("flex items-center gap-3 rounded-lg border bg-surface px-3 py-2.5 text-left transition-colors hover:border-border-strong", on ? "border-accent ring-1 ring-accent" : "border-border")}
          >
            <span className="flex shrink-0 overflow-hidden rounded-md" aria-hidden>
              {p.swatch.map((c) => (
                <span key={c} className="size-6" style={{ background: c }} />
              ))}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-heading">{p.name}</span>
              <span className="block truncate text-xs text-muted">{p.note}</span>
            </span>
            {on && <Check className="size-4 text-accent-text" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}

/** Floating "Colours" button for previewing palettes on the website (signed-in owners only). */
export function PaletteDock() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-4 left-4 z-50">
      {open && (
        <div className="mb-2 w-[min(92vw,520px)] rounded-xl border border-border bg-surface p-3 shadow-lg animate-rise">
          <p className="px-1 pb-2 text-sm font-semibold text-heading">Try a colour palette</p>
          <PalettePicker />
          <p className="px-1 pt-2 text-xs text-subtle">Only you see this. It&apos;s saved in this browser.</p>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-heading shadow-lg hover:border-border-strong"
      >
        <Palette className="size-4 text-accent" aria-hidden /> Colours
      </button>
    </div>
  );
}
