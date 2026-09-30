"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { addProspectAction } from "@/app/actions/discovery";

export function AddProspectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const submit = () =>
    start(async () => {
      const r = await addProspectAction({ name, website });
      if (!r.ok) return setError(r.error);
      toast({ title: `${name} added`, body: r.data.jobId ? "Sales Scout is researching it now." : undefined });
      onClose();
      router.push(`/prospects/${r.data.id}${r.data.jobId ? `?job=${r.data.jobId}` : ""}`);
    });
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title="Add a prospect"
      description="Know a company already? Add it and Sales Scout will research it for you."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={pending} disabled={!name.trim()} onClick={submit}>Add and research</Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field label="Company name" error={error}>{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} autoFocus />}</Field>
        <Field label="Website" optional hint="Helps us research the right company.">
          {(p) => <Input {...p} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="company.com" inputMode="url" />}
        </Field>
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}
