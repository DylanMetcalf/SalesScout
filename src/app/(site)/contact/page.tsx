import { SITE } from "@/content/site";
import { LogoMark } from "@/components/ui/logo";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { Eyebrow } from "@/components/site/chrome";

export const metadata = {
  title: "Contact",
  description: "Book a discovery call. Tell us what you sell and we'll find out who needs it.",
};

export default function Contact() {
  return (
    <section className="px-3 pb-6 pt-4 sm:px-5" aria-labelledby="h-contact">
      <div className="theme-ink brand-hero mx-auto grid max-w-7xl gap-12 rounded-3xl px-6 py-14 sm:px-12 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
        <div>
          <LogoMark size={44} label={null} />
          <Eyebrow className="mt-6">Book a discovery call</Eyebrow>
          <h1 id="h-contact" className="mt-3 text-[34px] leading-tight sm:text-[48px]">Tell us what you sell. We&apos;ll find out who needs it.</h1>
          <p className="mt-4 text-lg leading-8 text-muted">A few lines is plenty. We&apos;ll come back to you within two working days.</p>
          <ol className="mt-10 flex flex-col gap-5">
            {SITE.contactNext.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent font-display font-[650] text-accent-fg" aria-hidden>{i + 1}</span>
                <div>
                  <p className="font-semibold text-heading">{s.title}</p>
                  <p className="mt-0.5 leading-7 text-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-10 text-sm text-subtle">
            Prefer email? <span className="select-all font-medium text-accent-text">{SITE.contactEmail}</span>
          </p>
        </div>
        <div className="theme-paper self-start rounded-2xl">
          <EnquiryForm />
        </div>
      </div>
    </section>
  );
}
