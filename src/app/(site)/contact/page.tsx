import { SITE } from "@/content/site";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { Eyebrow } from "@/components/site/chrome";
import { IconBadge } from "@/components/site/visuals";

export const metadata = {
  title: "Contact",
  description: "Book a discovery call. Tell us what you sell and we'll find out who needs it.",
};

export default function Contact() {
  return (
    <section className="px-3 pb-6 pt-4 sm:px-5" aria-labelledby="h-contact">
      <div className="theme-ink brand-hero hero-grid mx-auto grid max-w-7xl gap-12 rounded-3xl px-6 py-14 sm:px-12 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
        <div>
          <Eyebrow>Book a discovery call</Eyebrow>
          <h1 id="h-contact" className="mt-3 text-[36px] leading-tight sm:text-[50px]">Tell us what you sell.</h1>
          <p className="mt-4 text-lg text-muted">A few lines is plenty.</p>
          <ol className="relative mt-10 flex flex-col gap-6 before:absolute before:top-5 before:bottom-5 before:left-[21px] before:w-0.5 before:bg-gradient-to-b before:from-accent before:to-accent-bright/20">
            {SITE.contactNext.map((s) => (
              <li key={s.title} className="relative flex items-center gap-4">
                <IconBadge icon={s.icon} tone="solid" className="ring-4 ring-bg" />
                <div>
                  <p className="font-semibold text-heading">{s.title}</p>
                  <p className="text-sm text-muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-10 text-sm text-subtle">
            Prefer email? <a href={`mailto:${SITE.contactEmail}`} className="font-medium text-accent-text hover:underline">{SITE.contactEmail}</a>
          </p>
        </div>
        <div className="theme-paper self-start rounded-2xl">
          <EnquiryForm />
        </div>
      </div>
    </section>
  );
}
