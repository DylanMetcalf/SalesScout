"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useAction } from "@/components/prospects/shared";
import { saveProfileAction } from "@/app/actions/profile";

export function ProfileForm({ initial }: { initial: { jobTitle: string; signature: string; notifyOnKeep: boolean } }) {
  const [f, setF] = useState(initial);
  const save = useAction();
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.run(() => saveProfileAction(f), { success: "Saved" });
      }}
    >
      <Field label="Your job title" hint="Used when drafting outreach." optional>
        {(p) => <Input {...p} value={f.jobTitle} maxLength={100} onChange={(e) => setF({ ...f, jobTitle: e.target.value })} placeholder="e.g. Sales Director" />}
      </Field>
      <Field label="Email signature" hint="Added to the end of email drafts." optional>
        {(p) => <Textarea {...p} value={f.signature} maxLength={1000} onChange={(e) => setF({ ...f, signature: e.target.value })} className="min-h-24 font-mono text-sm" placeholder={"Jane Smith\nSales Director, Acme\n+27 …"} />}
      </Field>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" checked={f.notifyOnKeep} onChange={(e) => setF({ ...f, notifyOnKeep: e.target.checked })} className="mt-0.5 size-4 accent-[var(--accent)]" />
        <span>
          <span className="font-medium">Email me a brief when I keep a prospect</span>
          <span className="block text-muted">With a link to the brief and a suggested next step. Nothing is sent to the prospect.</span>
        </span>
      </label>
      <Button type="submit" variant="secondary" loading={save.pending} className="self-start">Save</Button>
    </form>
  );
}
