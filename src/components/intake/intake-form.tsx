"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CircleCheck, Lightbulb, Lock, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { ErrorState } from "@/components/ui/error-state";
import { cn } from "@/components/ui/cn";
import { submitProblem, type IntakeState } from "@/app/actions/intake";
import { AREAS, FREQUENCIES } from "@/lib/opportunities/types";
import { Waypoints, type WaypointState } from "@/components/brand/waypoints";

const STEPS = ["The problem", "A little context", "How to reach you"] as const;

// Shown on request to help people start. Never inserted into their answer.
const NUDGES = [
  "Orders come in by phone and email, and we retype them into our accounting system. On busy days some get missed.",
  "Quotes take us two days because each one is rebuilt by hand from an old one.",
  "Our team keeps asking the same questions because the answers are spread across emails and folders.",
];

/**
 * Three short steps in one form, so nothing typed is lost moving between them.
 * Only the problem, name, email and company are required.
 */
export function IntakeForm({ idempotencyKey, initialArea }: { idempotencyKey: string; initialArea?: string | null }) {
  const [state, action, pending] = useActionState<IntakeState, FormData>(submitProblem, undefined);
  const [step, setStep] = useState(1);
  const [problem, setProblem] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  // Controlled fields: React resets uncontrolled inputs after every action, which would lose them on a validation error.
  const [v, setV] = useState<Record<string, string>>({ contactPreference: "email", ...(initialArea && (AREAS as readonly string[]).includes(initialArea) && { area: initialArea }) });
  const [nudge, setNudge] = useState<number | null>(null);
  const mounted = useRef(false);
  const bind = (name: string) => ({ name, value: v[name] ?? "", onChange: (e: { target: { value: string } }) => setV((d) => ({ ...d, [name]: e.target.value })) });
  const pref = v.contactPreference;
  const setPref = (x: string) => setV((d) => ({ ...d, contactPreference: x }));
  const [consent, setConsent] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (state?.step) setStep(state.step);
  }, [state]);
  useEffect(() => {
    // Move focus to the new question when the step changes, but not on first load.
    if (mounted.current) headingRef.current?.focus();
    mounted.current = true;
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

  const enough = problem.trim().length >= 20;
  const stepStates = (i: number): WaypointState => (i + 1 < step ? "done" : i + 1 === step ? "current" : "todo");

  return (
    <div className="grid gap-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-14">
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <Waypoints orientation="vertical" label="Your progress" steps={[...STEPS.map((l, i) => ({ label: l, state: stepStates(i), detail: i === 1 ? "Optional" : undefined })), { label: "Sent to us", state: "todo" as const }]} />
          <ul className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted">
            <li className="flex gap-2.5"><UserRound className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden /> Read by a person on our team</li>
            <li className="flex gap-2.5"><Lock className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden /> Private, never on a mailing list</li>
            <li className="flex gap-2.5"><Trash2 className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden /> Deleted whenever you ask</li>
          </ul>
        </div>
      </aside>
    <form action={action} className="flex flex-col gap-6 rounded-card border border-border bg-surface p-5 shadow-md sm:p-9" noValidate>
      <div className="lg:hidden">
        <Waypoints label="Your progress" steps={STEPS.map((l, i) => ({ label: l, state: stepStates(i) }))} />
      </div>
      <p className="caption-mono -mb-3 text-subtle">Step {step} of 3</p>
      <h2 ref={headingRef} tabIndex={-1} className="text-[28px] leading-[1.08] tracking-[-0.03em] outline-none sm:text-[38px]">
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
              className="min-h-52 rounded-xl px-4 py-3.5 text-[17px] leading-8"
              placeholder="In your own words, as if you were telling a colleague…"
            />
          )}
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <p className={cn("flex items-center gap-1.5 transition-colors", enough ? "text-strong" : "text-subtle")} aria-live="polite">
            {enough ? <><CircleCheck className="size-3.5" aria-hidden /> That’s enough to start. Add more if you like.</> : "A couple of sentences is plenty."}
          </p>
          <p className="text-subtle tabular-nums">{problem.length > 4500 ? `${5000 - problem.length} characters left` : ""}</p>
        </div>
        <div className="mt-2 rounded-xl border border-dashed border-border bg-surface-2/50 p-3">
          <button type="button" onClick={() => setNudge((n) => (n === null ? 0 : (n + 1) % NUDGES.length))} className="flex items-center gap-2 text-sm font-medium text-accent-text underline-offset-4 hover:underline">
            <Lightbulb className="size-4" aria-hidden /> {nudge === null ? "Not sure how to put it? See an example" : "Show another example"}
          </button>
          {nudge !== null && <p className="mt-2 text-sm text-muted animate-rise" aria-live="polite"><span className="caption-mono mr-2 text-subtle">Example</span>“{NUDGES[nudge]}”</p>}
        </div>
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
            <Button type="button" variant="primary" size="xl" shape="pill" onClick={next} trailing={<ArrowRight className="size-4" />}>Continue</Button>
          </div>
        ) : (
          <Button type="submit" variant="primary" size="xl" shape="pill" loading={pending} trailing={<ArrowRight className="size-4" />}>{pending ? "Sending…" : "Send my problem"}</Button>
        )}
      </div>
    </form>
    </div>
  );
}
