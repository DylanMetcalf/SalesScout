"use client";

import { useState, useTransition } from "react";
import { ArrowRight, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createWorkspaceAction, exploreDemoAction } from "@/app/actions/workspace";

export function WorkspaceForm({ showDemo }: { showDemo: boolean }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [demoPending, startDemo] = useTransition();

  return (
    <div className="animate-rise [animation-delay:80ms]">
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await createWorkspaceAction({ name });
            if (!r.ok) setError(r.error);
          });
        }}
      >
        <Field label="What should we call your workspace?" hint="Usually your business name. You can have several — e.g. “Client work” or “Personal”." error={error}>
          {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mea Creo" className="h-12 text-base" autoFocus />}
        </Field>
        <div>
          <Button type="submit" variant="primary" size="lg" loading={pending} disabled={!name.trim()} icon={<ArrowRight className="size-4" />}>
            Continue
          </Button>
        </div>
      </form>

      {showDemo && (
        <div className="mt-12 flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-soft text-violet">
            <FlaskConical className="size-5" aria-hidden />
          </span>
          <div className="flex-1">
            <p className="font-medium">Want to look around first?</p>
            <p className="text-sm text-muted">Explore a fully set-up example company with prospects, research and a pipeline.</p>
          </div>
          <Button
            loading={demoPending}
            onClick={() =>
              startDemo(async () => {
                const r = await exploreDemoAction();
                if (!r.ok) toast({ kind: "error", title: r.error });
              })
            }
          >
            Explore the demo
          </Button>
        </div>
      )}
    </div>
  );
}
