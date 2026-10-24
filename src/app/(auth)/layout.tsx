import { Logo } from "@/components/ui/logo";
import { FrameGlyph } from "@/components/brand/focus";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,560px)]">
      <aside className="theme-ink brand-hero hero-grid relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Logo />
        <div className="relative max-w-md">
          <p className="flex items-center gap-2 text-sm font-semibold text-signal"><FrameGlyph /> The Sales Scout workspace</p>
          <p className="mt-5 text-[42px] leading-[1.05] font-semibold tracking-[-0.04em] text-heading">
            Every problem, and the <span className="accent-word">way forward,</span> in one place.
          </p>
          <ul className="mt-10 space-y-3 text-muted">
            {["What customers told us, in their own words", "Research that separates facts from guesses", "Briefs, proposals and handovers you control"].map((t) => (
              <li key={t} className="flex gap-3">
                <span className="mt-[9px] size-1.5 shrink-0 rounded-[2px] bg-signal" aria-hidden />
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
