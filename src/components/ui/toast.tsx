"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "./cn";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; title: string; body?: string; action?: { label: string; onClick: () => void } };
type ToastFn = (t: Omit<Toast, "id" | "kind"> & { kind?: ToastKind }) => void;

const ToastContext = createContext<ToastFn>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);
  const push = useCallback<ToastFn>(
    (t) => {
      const id = nextId++;
      setToasts((ts) => [...ts.slice(-3), { id, kind: t.kind ?? "success", ...t }]);
      setTimeout(() => dismiss(id), t.kind === "error" ? 8000 : 4500);
    },
    [dismiss],
  );
  const icons = { success: CircleCheck, error: TriangleAlert, info: Info };
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed bottom-4 right-4 left-4 z-50 flex flex-col items-end gap-2 sm:left-auto">
        {toasts.map((t) => {
          const Icon = icons[t.kind];
          return (
            <div
              key={t.id}
              role={t.kind === "error" ? "alert" : "status"}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3 shadow-lg animate-rise"
            >
              <Icon className={cn("mt-0.5 size-4 shrink-0", t.kind === "success" && "text-accent", t.kind === "error" && "text-weak", t.kind === "info" && "text-info")} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t.title}</p>
                {t.body && <p className="mt-0.5 text-sm text-muted">{t.body}</p>}
                {t.action && (
                  <button className="mt-1.5 text-sm font-medium text-accent-text hover:underline" onClick={() => { t.action!.onClick(); dismiss(t.id); }}>
                    {t.action.label}
                  </button>
                )}
              </div>
              <button aria-label="Dismiss" className="text-subtle hover:text-text" onClick={() => dismiss(t.id)}>
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
