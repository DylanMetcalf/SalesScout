"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { ErrorState } from "@/components/ui/error-state";
import { cn } from "@/components/ui/cn";
import { submitProblem, type IntakeState } from "@/app/actions/intake";
import { AREAS, FREQUENCIES } from "@/lib/opportunities/types";

const STEPS = ["The problem", "A little context", "How to reach you"] as const;

/**
 * Three short steps in one form, so nothing typed is lost moving between them.
 * Only the problem, name, email and company are required.
 */
export function IntakeForm({ idempotencyKey }: { idempotencyKey: string }) {
  const [state, action, pending] = useActionState<IntakeState, FormData>(submitProblem, undefined);
  const [step, setStep] = useState(1);
  const [problem, setProblem] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  // Controlled fields: React resets uncontrolled inputs after every action, which would lose them on a validation error.
  const [v, setV] = useState<Record<string, string>>({ contactPreference: "email" });
  const bind = (name: string) => ({ name, value: v[name] ?? "", onChange: (e: { target: { value: string } }) => setV((d) => ({ ...d, [name]: e.target.value })) });
  const pref = v.contactPreference;
  const setPref = (x: string) => setV((d) => ({ ...d, contactPreference: x }));
  const [consent, setConsent] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (state?.step) setStep(state.step);
  }, [state]);
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const next = () => {
    if (step === 1 && problem.trim().length < 20) {
      setLocalError("Tell us a little more: a couple of sentences is plenty.");
      return;
    }
    setLocalError(null);
    setStep((s) => Math.min(3, s + 1));
  };
  const error = localError ?? state?.error ?? null;
  const fieldError = (name: string) => (state?.field === name && state.step === step ? state.error ?? null : null);

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <ol className="flex gap-2" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1">
            <span className={cn("block h-1 rounded-full transition-colors", i + 1 <= step ? "bg-accent" : "bg-border")} />
            <span className={cn("mt-2 block text-xs", i + 1 === step ? "font-semibold text-text" : "text-subtle")} aria-current={i + 1 === step ? "step" : undefined}>
              <span className="sr-only">Step {i + 1} of 3: </span>{label}
            </span>
          </li>
        ))}
      </ol>

      <h2 ref={headingRef} tabIndex={-1} className="text-[26px] leading-tight outline-none sm:text-[32px]">
        {step === 1 ? "What would you like to improve in your business?" : step === 2 ? "Help us picture it." : "Where should we reply?"}
      </h2>

      {error && <ErrorState title={error} />}

      <div hidden={step !== 1} className="flex flex-col gap-2">
        <Field label="Describe it in your own words" hint="What’s taking too much time, causing frustration, creating errors, costing money, or stopping things working as well as they could?" error={fieldError("problem")}>
          {(p) => (
            <Textarea
              {...p}
              name="problem"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              maxLength={5000}
              className="min-h-48 text-base leading-7"
              placeholder="For example: we take orders by phone and email, then retype them into our accounting system, and things get missed when we’re busy…"
            />
          )}
        </Field>
        <p className="self-end text-xs text-subtle tabular-nums" aria-live="polite">{problem.length > 4500 ? `${5000 - problem.length} characters left` : ""}</p>
      </div>

      <div hidden={step !== 2} className="flex flex-col gap-5">
        <p className="-mt-2 text-muted">All optional. Skip anything you’re not sure about.</p>
        <Field label="What does your business do?" optional>{(p) => <Input {...p} {...bind("business")} maxLength={600} placeholder="e.g. We install solar systems for homes and small businesses" />}</Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Which part of the business does it affect?" optional>
            {(p) => (
              <Select {...p} {...bind("area")}>
                <option value="">Choose one</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </Select>
            )}
          </Field>
          <Field label="How often does it happen?" optional>
            {(p) => (
              <Select {...p} {...bind("frequency")}>
                <option value="">Choose one</option>
                {FREQUENCIES.map((a) => <option key={a} value={a}>{a}</option>)}
              </Select>
            )}
          </Field>
        </div>
        <Field label="How do you handle it today?" optional>{(p) => <Textarea {...p} {...bind("current")} maxLength={1500} className="min-h-20" placeholder="Spreadsheets, a particular system, someone’s inbox…" />}</Field>
        <Field label="What would you ideally like to happen instead?" optional>{(p) => <Textarea {...p} {...bind("ideal")} maxLength={1500} className="min-h-20" />}</Field>
      </div>

      <div hidden={step !== 3} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Your name" error={fieldError("name")}>{(p) => <Input {...p} {...bind("name")} autoComplete="name" maxLength={100} required />}</Field>
          <Field label="Business email" error={fieldError("email")}>{(p) => <Input {...p} {...bind("email")} type="email" autoComplete="email" maxLength={200} required />}</Field>
          <Field label="Company name" error={fieldError("companyName")}>{(p) => <Input {...p} {...bind("companyName")} autoComplete="organization" maxLength={150} required />}</Field>
          <Field label="Website" optional error={fieldError("website")}>{(p) => <Input {...p} {...bind("website")} inputMode="url" autoComplete="url" maxLength={200} placeholder="yourcompany.co.za" />}</Field>
          <Field label="Your role" optional>{(p) => <Input {...p} {...bind("role")} autoComplete="organization-title" maxLength={100} />}</Field>
          <Field label="Country or region" optional>{(p) => <Input {...p} {...bind("region")} autoComplete="country-name" maxLength={100} placeholder="e.g. Gauteng, South Africa" />}</Field>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-text">How would you like us to get in touch?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {[["email", "Email"], ["phone", "Phone call"], ["whatsapp", "WhatsApp"]].map(([v, l]) => (
              <label key={v} className={cn("cursor-pointer rounded-md border px-3.5 py-2 text-sm transition-colors has-focus-visible:shadow-[var(--ring)]", pref === v ? "border-accent bg-accent-soft text-accent-text" : "border-border bg-surface hover:border-accent/40")}>
                <input type="radio" name="contactPreference" value={v} checked={pref === v} onChange={() => setPref(v)} className="sr-only" />
                {l}
              </label>
            ))}
          </div>
        </fieldset>
        {pref !== "email" && (
          <Field label="Phone or WhatsApp number" error={fieldError("phone")}>{(p) => <Input {...p} {...bind("phone")} type="tel" autoComplete="tel" maxLength={30} />}</Field>
        )}
        <label className="flex items-start gap-3 rounded-lg border border-border bg-surface-2/60 p-4 text-sm">
          <input type="checkbox" name="consent" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]" aria-invalid={state?.field === "consent" || undefined} />
          <span>
            I’m happy for Sales Scout (Mea Creo) to use this information to understand my problem and contact me about it, as described in the{" "}
            <a href="/privacy#problems" target="_blank" className="font-medium text-accent-text underline">Privacy Policy</a>. We may use AI to help us review it, and look at your company’s public website.
          </span>
        </label>
      </div>

      <input type="hidden" name="key" value={idempotencyKey} />
      <input type="text" name="fax" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
        {step > 1 ? (
          <Button type="button" variant="ghost" icon={<ArrowLeft className="size-4" />} onClick={() => setStep((s) => s - 1)}>Back</Button>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-subtle"><Lock className="size-3.5" aria-hidden /> Private. Only our team reads it.</span>
        )}
        {step < 3 ? (
          <div className="flex items-center gap-2">
            {step === 2 && <Button type="button" variant="ghost" onClick={() => setStep(3)}>Skip</Button>}
            <Button type="button" variant="primary" size="lg" onClick={next}>Continue <ArrowRight className="size-4" aria-hidden /></Button>
          </div>
        ) : (
          <Button type="submit" variant="primary" size="lg" loading={pending}>Send my problem</Button>
        )}
      </div>
    </form>
  );
}
