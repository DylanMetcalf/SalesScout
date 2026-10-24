import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,560px)]">
      <aside className="theme-ink brand-hero hero-grid relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Logo />
        <svg aria-hidden className="pointer-events-none absolute inset-x-0 bottom-20 h-40 w-full opacity-70" viewBox="0 0 800 160" preserveAspectRatio="none" fill="none">
          <path d="M-10 120 C 140 120 160 40 300 46 S 480 140 620 104 S 760 60 820 64" stroke="var(--signal)" strokeWidth="2" strokeDasharray="2 9" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="relative max-w-md">
          <p className="caption-mono text-subtle">The Sales Scout workspace</p>
          <p className="mt-5 font-display text-[44px] leading-[1.02] font-[650] tracking-[-0.035em] text-heading">
            Every problem, and the <span className="accent-serif text-signal">way forward,</span> in one place.
          </p>
          <ul className="mt-10 space-y-3 text-muted">
            {["What customers told us, in their own words", "Research that separates facts from guesses", "Briefs, proposals and handovers you control"].map((t) => (
              <li key={t} className="flex gap-3">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-signal" aria-hidden />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-subtle">Nothing is ever sent on your behalf.</p>
      </aside>
      <main className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
