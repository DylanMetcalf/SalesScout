"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useAction } from "@/components/prospects/shared";
import { changePasswordAction } from "@/app/actions/password";

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const save = useAction();
  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        save.run(() => changePasswordAction(current, next), { success: "Password changed", refresh: false, then: () => { setCurrent(""); setNext(""); } });
      }}
    >
      <Field label="Current password" hint="Or your access code.">{(p) => <Input {...p} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />}</Field>
      <Field label="New password" hint="At least 8 characters.">{(p) => <Input {...p} type="password" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} required />}</Field>
      <Button type="submit" variant="secondary" loading={save.pending} className="sm:mb-[22px]">Change password</Button>
    </form>
  );
}
