"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "./cn";

export type MenuItem =
  | { type?: "item"; label: ReactNode; icon?: ReactNode; onSelect: () => void; danger?: boolean; hint?: ReactNode }
  | { type: "separator" }
  | { type: "label"; label: ReactNode };

/** Dropdown menu with keyboard navigation (arrows, Home/End, Escape) and outside-click close. */
export function Menu({
  trigger,
  items,
  align = "start",
  className,
  width = 240,
}: {
  trigger: (props: { onClick: () => void; "aria-expanded": boolean; "aria-haspopup": "menu"; "aria-controls": string; ref: React.RefObject<HTMLButtonElement | null> }) => ReactNode;
  items: MenuItem[];
  align?: "start" | "end";
  className?: string;
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    requestAnimationFrame(() => itemRefs.current.find(Boolean)?.focus());
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const focusable = () => itemRefs.current.filter(Boolean) as HTMLButtonElement[];
  const onKey = (e: React.KeyboardEvent) => {
    const els = focusable();
    const i = els.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown") els[(i + 1) % els.length]?.focus();
    else if (e.key === "ArrowUp") els[(i - 1 + els.length) % els.length]?.focus();
    else if (e.key === "Home") els[0]?.focus();
    else if (e.key === "End") els[els.length - 1]?.focus();
    else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      btn.current?.focus();
      if (e.key === "Tab") return;
    } else return;
    e.preventDefault();
  };

  itemRefs.current = [];
  return (
    <div ref={wrap} className={cn("relative", className)}>
      {trigger({ onClick: () => setOpen((o) => !o), "aria-expanded": open, "aria-haspopup": "menu", "aria-controls": id, ref: btn })}
      {open && (
        <div
          id={id}
          role="menu"
          onKeyDown={onKey}
          style={{ width }}
          className={cn(
            "absolute z-40 mt-1.5 rounded-lg border border-border bg-surface p-1 shadow-lg animate-rise",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {items.map((item, i) => {
            if (item.type === "separator") return <div key={i} role="separator" className="my-1 h-px bg-border" />;
            if (item.type === "label")
              return (
                <div key={i} className="px-2.5 pt-2 pb-1 text-xs font-medium text-subtle">
                  {item.label}
                </div>
              );
            return (
              <button
                key={i}
                role="menuitem"
                ref={(el) => {
                  itemRefs.current.push(el);
                }}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm outline-none hover:bg-accent-soft/50 focus:bg-accent-soft/60",
                  item.danger ? "text-weak" : "text-text",
                )}
              >
                {item.icon && <span className="text-muted [&>svg]:size-4">{item.icon}</span>}
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.hint && <span className="text-xs text-subtle">{item.hint}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
