import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,560px)]">
      <aside className="relative hidden overflow-hidden border-r border-border bg-surface-2 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Logo />
        <div className="max-w-md">
          <p className="text-4xl font-semibold leading-[1.15] tracking-[-0.02em] text-text">
            Tell us what you sell.
            <br />
            <span className="text-muted">We&apos;ll help you figure out who needs it.</span>
          </p>
          <ul className="mt-10 space-y-4 text-muted">
            {[
              ["Who", "Companies that could genuinely need what you offer."],
              ["Why", "An honest explanation for every lead — what we know and what we don't."],
              ["Who inside", "The people worth speaking to, and why they matter."],
              ["What next", "A clear next step, a draft, and a reminder."],
            ].map(([h, b]) => (
              <li key={h} className="flex gap-3">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                <span>
                  <span className="font-medium text-text">{h}.</span> {b}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-subtle">A sales assistant sitting beside you — not another CRM.</p>
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
