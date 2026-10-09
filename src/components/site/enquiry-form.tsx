"use client";

import { useActionState } from "react";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { ErrorState } from "@/components/ui/error-state";
import { submitEnquiry, type EnquiryState } from "@/app/actions/enquiry";

export function EnquiryForm() {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(submitEnquiry, undefined);
  if (state?.ok) {
    return (
      <div className="flex flex-col items-center rounded-2xl bg-surface px-6 py-12 text-center animate-rise" role="status">
        <CircleCheck className="size-10 text-accent animate-check-pop" aria-hidden />
        <p className="mt-4 font-display text-2xl font-[650] text-heading">Thanks — we&apos;ve got it.</p>
        <p className="mt-2 max-w-sm text-muted">We&apos;ll read about your business and come back to you to arrange a short discovery call.</p>
      </div>
    );
  }
  const f = state?.fields ?? {};
  return (
    <form action={action} className="flex flex-col gap-4 rounded-2xl bg-surface p-6 shadow-lg sm:p-8" noValidate>
      {state?.error && <ErrorState title={state.error} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name">{(p) => <Input {...p} name="name" autoComplete="name" defaultValue={f.name} required />}</Field>
        <Field label="Work email">{(p) => <Input {...p} name="email" type="email" autoComplete="email" defaultValue={f.email} required />}</Field>
        <Field label="Company" optional>{(p) => <Input {...p} name="company" autoComplete="organization" defaultValue={f.company} />}</Field>
        <Field label="Website" optional>{(p) => <Input {...p} name="website" inputMode="url" defaultValue={f.website} placeholder="yourcompany.com" />}</Field>
      </div>
      <Field label="What do you sell, and who to?" hint="A few sentences is plenty. We'll ask the rest on the call.">
        {(p) => <Textarea {...p} name="message" defaultValue={f.message} className="min-h-28" required />}
      </Field>
      <input type="text" name="fax" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <Button type="submit" variant="primary" size="lg" loading={pending} className="mt-1 w-full sm:w-auto sm:self-start">
        Book a discovery call
      </Button>
    </form>
  );
}
