"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "./cn";
import { IconButton } from "./button";

type Props = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** "sheet" slides in from the right; "modal" is centred. */
  variant?: "modal" | "sheet";
};

/**
 * Accessible modal & sheet built on the native <dialog> element: focus is
 * trapped and restored by the browser, Escape closes, and the page behind is inert.
 */
export function Dialog({ open, onClose, title, description, children, footer, size = "md", variant = "modal" }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="dialog-title"
      className={cn(
        "m-0 bg-transparent p-0 text-text backdrop:bg-[rgb(17_18_20/0.38)] backdrop:backdrop-blur-[2px] open:animate-fade-in",
        variant === "modal"
          ? "fixed inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] " + widths[size]
          : "fixed inset-y-0 right-0 left-auto h-dvh max-h-dvh w-full sm:w-[min(640px,92vw)] max-w-none",
      )}
    >
      {open && (
        <div
          className={cn(
            "flex flex-col bg-surface shadow-lg border border-border",
            variant === "modal" ? "max-h-[calc(100dvh-2rem)] rounded-xl animate-rise" : "h-full animate-slide-in",
          )}
        >
          <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
            <div className="min-w-0">
              <h2 id="dialog-title" className="text-lg font-semibold">
                {title}
              </h2>
              {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
            </div>
            <IconButton label="Close" onClick={onClose} className="-mr-2 -mt-1">
              <X className="size-4" />
            </IconButton>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">{children}</div>
          {footer && <footer className="flex items-center justify-end gap-2 border-t border-border px-6 py-3.5">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
