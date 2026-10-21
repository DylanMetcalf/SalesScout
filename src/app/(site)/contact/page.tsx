import { CalendarCheck } from "lucide-react";
import { SITE } from "@/content/site";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { Eyebrow } from "@/components/site/chrome";
import { IconBadge } from "@/components/site/visuals";
import { bookingEmbedUrl, bookingUrl } from "@/lib/booking";
import { siteUrl } from "@/lib/site-url";

export const metadata = {
  title: "Contact",
  description: "Book a discovery call. Tell us what you sell and we'll find out who needs it.",
};

// Reads BOOKING_URL at request time, so changing it needs no rebuild.
export const dynamic = "force-dynamic";

function Steps({ steps }: { steps: typeof SITE.contactNext }) {
  return (
    <ol className="relative mt-10 flex flex-col gap-6 before:absolute before:top-5 before:bottom-5 before:left-[21px] before:w-0.5 before:bg-gradient-to-b before:from-accent before:to-accent-bright/20">
      {steps.map((s) => (
        <li key={s.title} className="relative flex items-center gap-4">
          <IconBadge icon={s.icon} tone="solid" className="ring-4 ring-bg" />
          <div>
            <p className="font-semibold text-heading">{s.title}</p>
            <p className="text-sm text-muted">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

const Email = () => (
  <a href={`mailto:${SITE.contactEmail}`} className="font-medium text-accent-text hover:underline">{SITE.contactEmail}</a>
);

export default function Contact() {
  const booking = bookingUrl();

  if (!booking) {
    return (
      <section className="px-3 pt-4 pb-6 sm:px-5" aria-labelledby="h-contact">
        <div className="theme-ink brand-hero hero-grid mx-auto grid max-w-7xl gap-12 rounded-3xl px-6 py-14 sm:px-12 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
          <div>
            <Eyebrow>Book a discovery call</Eyebrow>
            <h1 id="h-contact" className="mt-3 text-[36px] leading-tight sm:text-[50px]">Tell us what you sell.</h1>
            <p className="mt-4 text-lg text-muted">A few lines is plenty.</p>
            <Steps steps={SITE.contactNext} />
            <p className="mt-10 text-sm text-subtle">Prefer email? <Email /></p>
          </div>
          <div className="theme-paper self-start rounded-2xl">
            <EnquiryForm />
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="px-3 pt-4 sm:px-5" aria-labelledby="h-contact">
        <div className="theme-ink brand-hero hero-grid mx-auto grid max-w-7xl gap-12 rounded-3xl px-6 py-14 sm:px-12 lg:grid-cols-[0.8fr_1.2fr] lg:py-16">
          <div>
            <Eyebrow>Book a discovery call</Eyebrow>
            <h1 id="h-contact" className="mt-3 text-[36px] leading-tight sm:text-[50px]">Pick a time that suits you.</h1>
            <p className="mt-4 text-lg text-muted">30 minutes, online. The meeting link arrives with your calendar invite.</p>
            <Steps steps={SITE.bookingSteps} />
          </div>
          <div className="theme-paper overflow-hidden rounded-2xl bg-surface shadow-lg">
            <iframe
              src={bookingEmbedUrl(booking, new URL(siteUrl()).host)}
              title="Book a discovery call"
              className="block h-[720px] w-full border-0"
              loading="lazy"
            />
            <p className="flex items-center gap-2 border-t border-border px-4 py-2.5 text-xs text-muted">
              <CalendarCheck className="size-3.5 text-accent" aria-hidden />
              Calendar not loading? <a href={booking} target="_blank" rel="noopener noreferrer" className="font-medium text-accent-text hover:underline">Open the booking page</a>
            </p>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]" aria-labelledby="h-write">
        <div>
          <Eyebrow>Prefer to write?</Eyebrow>
          <h2 id="h-write" className="mt-3 text-[28px] leading-tight sm:text-[36px]">Send us a message instead.</h2>
          <p className="mt-4 text-muted">We&apos;ll reply by email. Or write to <Email /></p>
        </div>
        <div className="rounded-2xl border border-border bg-surface shadow-sm">
          <EnquiryForm submitLabel="Send message" />
        </div>
      </section>
    </>
  );
}
