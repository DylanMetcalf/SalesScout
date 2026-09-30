import { cn } from "@/components/ui/cn";
import { LogoMark } from "@/components/ui/logo";

export const ONBOARDING_STEPS = ["Workspace", "Your company", "Website", "Profiles", "Documents", "Analysis", "Understanding", "Markets", "Find companies"];

export function StepDots({ current }: { current: number }) {
  return (
    <div className="mb-10 flex items-center gap-3">
      <div className="flex gap-1" aria-hidden>
        {ONBOARDING_STEPS.map((s, i) => (
          <span key={s} className={cn("h-1.5 rounded-full transition-all", i < current ? "w-4 bg-accent/60" : i === current ? "w-7 bg-accent" : "w-4 bg-surface-3")} />
        ))}
      </div>
      <p className="text-sm text-subtle">
        Step {current + 1} of {ONBOARDING_STEPS.length}
        <span className="sr-only">: {ONBOARDING_STEPS[current]}</span>
      </p>
    </div>
  );
}

/** Sales Scout "speaking" — onboarding reads like a conversation, not a form. */
export function Prompt({ title, children }: { title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex gap-4 animate-rise">
      <LogoMark size={36} className="mt-0.5 hidden sm:block" />
      <div>
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.015em] sm:text-3xl">{title}</h1>
        {children && <p className="mt-2 text-lg text-muted">{children}</p>}
      </div>
    </div>
  );
}
