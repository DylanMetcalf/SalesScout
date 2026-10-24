import { randomUUID } from "node:crypto";
import { IntakeForm } from "@/components/intake/intake-form";
import { Eyebrow } from "@/components/site/chrome";

export const metadata = {
  title: "Tell us your problem",
  description: "Explain what’s not working in your business, in your own words. We’ll review it and suggest a practical next step.",
  alternates: { canonical: "/start" },
};

// A fresh idempotency key per visit: refreshing or double-submitting never creates two records.
export const dynamic = "force-dynamic";

export default function Start() {
  return (
    <section className="mx-auto max-w-2xl px-4 pt-12 pb-20 sm:px-6 sm:pt-16" aria-labelledby="h-start">
      <Eyebrow>Tell us your problem</Eyebrow>
      <h1 id="h-start" className="mt-3 text-[34px] leading-tight sm:text-[44px]">Let’s start with what’s not working.</h1>
      <p className="mt-3 text-lg text-muted">Three short steps, about five minutes. No technical knowledge needed.</p>
      <div className="mt-10 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-8">
        <IntakeForm idempotencyKey={randomUUID()} />
      </div>
    </section>
  );
}
