"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useAction } from "@/components/prospects/shared";
import { updateWorkspaceAction } from "@/app/actions/workspace";

export function WorkspaceSettings({ initial, canEdit }: { initial: { name: string; description: string; context: string }; canEdit: boolean }) {
  const [f, setF] = useState(initial);
  const { pending, run } = useAction();
  const dirty = JSON.stringify(f) !== JSON.stringify(initial);
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => updateWorkspaceAction(f), { success: "Workspace saved" });
      }}
    >
      <Field label="Name">{(p) => <Input {...p} value={f.name} disabled={!canEdit} onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))} />}</Field>
      <Field label="Description" optional>{(p) => <Input {...p} value={f.description} disabled={!canEdit} onChange={(e) => setF((x) => ({ ...x, description: e.target.value }))} />}</Field>
      <Field label="Shared context" optional hint="Anything Sales Scout should know for every company here, e.g. “We're an agency prospecting on behalf of clients.”">
        {(p) => <Textarea {...p} value={f.context} disabled={!canEdit} onChange={(e) => setF((x) => ({ ...x, context: e.target.value }))} />}
      </Field>
      {canEdit && (
        <div>
          <Button type="submit" variant="primary" loading={pending} disabled={!dirty}>Save</Button>
        </div>
      )}
    </form>
  );
}
