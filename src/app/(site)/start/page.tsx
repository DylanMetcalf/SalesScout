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

export default async function Start({ searchParams }: { searchParams: Promise<{ area?: string }> }) {
  const { area } = await searchParams;
  return (
    <section className="relative" aria-labelledby="h-start">
      <div aria-hidden className="paper-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(#000,transparent)]" />
      <div className="relative mx-auto max-w-5xl px-4 pt-12 pb-20 sm:px-6 sm:pt-16">
        <Eyebrow index="→">Tell us your problem</Eyebrow>
        <h1 id="h-start" className="mt-5 max-w-3xl text-[40px] leading-[1.02] tracking-[-0.035em] sm:text-[60px]">
          Let’s start with what’s <span className="accent-serif text-signal">not working.</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">Three short steps, about five minutes. No technical knowledge needed, and nothing is committed until we’ve talked.</p>
        <div className="mt-12">
          <IntakeForm idempotencyKey={randomUUID()} initialArea={area ?? null} />
        </div>
      </div>
    </section>
  );
}
