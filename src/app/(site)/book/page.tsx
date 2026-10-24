import { ArrowRight, CalendarCheck } from "lucide-react";
import { SITE } from "@/content/site";
import { Eyebrow } from "@/components/site/chrome";
import { IconBadge } from "@/components/site/visuals";
import { ButtonLink } from "@/components/ui/button";
import { NextSteps } from "@/components/intake/next-steps";
import { BookingOpened } from "@/components/intake/booking-opened";
import { bookingEmbedUrl, bookingUrl } from "@/lib/booking";
import { publicSummary } from "@/lib/opportunities/service";
import { siteUrl } from "@/lib/site-url";

export const metadata = {
  title: "Book a call",
  description: "Book a short online conversation about what’s not working in your business.",
  alternates: { canonical: "/book" },
};

// Reads BOOKING_URL at request time, so changing it needs no rebuild.
export const dynamic = "force-dynamic";

function Steps() {
  return (
    <ol className="relative mt-10 flex flex-col gap-6 before:absolute before:top-5 before:bottom-5 before:left-[21px] before:w-0.5 before:bg-gradient-to-b before:from-accent before:to-accent-bright/20">
      {SITE.bookingSteps.map((s) => (
        <li key={s.title} className="relative flex items-center gap-4">
          <IconBadge icon={s.icon} tone="solid" className="rounded-full ring-4 ring-[var(--bg)]" />
          <div>
            <p className="font-semibold text-heading">{s.title}</p>
            <p className="text-sm text-muted">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

const Email = () => <a href={`mailto:${SITE.contactEmail}`} className="font-medium text-accent-text hover:underline">{SITE.contactEmail}</a>;

export default async function Book({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const s = ref ? publicSummary(ref) : null;
  const booking = bookingUrl();

  if (!booking) {
    // No calendar configured: never show a broken button. Offer what works.
    return (
      <section className="mx-auto max-w-3xl px-4 pt-12 pb-20 sm:px-6 sm:pt-16" aria-labelledby="h-book">
        <Eyebrow index="→">Book a call</Eyebrow>
        <h1 id="h-book" className="mt-5 text-[40px] leading-[1.02] tracking-[-0.035em] sm:text-[60px]">Let’s find a time <span className="accent-serif text-signal">to talk.</span></h1>
        {s ? (
          <>
            <p className="mt-4 text-lg text-muted">Online booking isn’t open right now. Ask us and we’ll contact you to arrange a time.</p>
            <div className="mt-8"><NextSteps refId={ref!} hasBooking={false} preference={s.contactPreference} callRequested={s.callRequested} /></div>
          </>
        ) : (
          <>
            <p className="mt-4 text-lg text-muted">Start by telling us briefly what’s not working. Then we’ll contact you to arrange a conversation.</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <ButtonLink href="/start" variant="primary" size="lg" className="h-12 rounded-full px-6" trailing={<ArrowRight className="size-4" />}>{SITE.cta}</ButtonLink>
              <p className="text-sm text-muted">Or email <Email /></p>
            </div>
          </>
        )}
      </section>
    );
  }

  // Calendly pre-fills name and email so the visitor doesn't retype them; the operator matches the
  // booking by email. Our private reference never leaves this site.
  const target = new URL(bookingEmbedUrl(booking, new URL(siteUrl()).host));
  if (s && target.hostname.endsWith("calendly.com")) {
    target.searchParams.set("name", s.name);
    target.searchParams.set("email", s.email);
  }

  return (
    <section className="px-3 pt-4 pb-6 sm:px-5" aria-labelledby="h-book">
      {s && <BookingOpened refId={ref!} />}
      <div className="theme-ink brand-hero hero-grid mx-auto grid max-w-7xl gap-12 rounded-[28px] px-6 py-14 sm:px-12 lg:grid-cols-[0.8fr_1.2fr] lg:py-16">
        <div>
          <Eyebrow index="→">Book a call</Eyebrow>
          <h1 id="h-book" className="mt-5 text-[38px] leading-[1.02] tracking-[-0.035em] sm:text-[54px]">{s ? <>Pick a time, <span className="accent-serif text-signal">{s.firstName}.</span></> : <>Pick a time that <span className="accent-serif text-signal">suits you.</span></>}</h1>
          <p className="mt-4 text-lg text-muted">{s ? "We’ll have read what you sent before we speak." : "30 minutes, online. The meeting link arrives with your calendar invite."}</p>
          <Steps />
          {!s && <p className="mt-10 text-sm text-subtle">Rather write it down first? <a href="/start" className="font-medium text-accent-text hover:underline">{SITE.cta}</a></p>}
        </div>
        <div className="theme-paper overflow-hidden rounded-2xl bg-surface shadow-lg">
          <iframe src={target.toString()} title="Book a call" className="block h-[720px] w-full border-0" loading="lazy" />
          <p className="flex items-center gap-2 border-t border-border px-4 py-2.5 text-xs text-muted">
            <CalendarCheck className="size-3.5 text-accent" aria-hidden />
            Calendar not loading? <a href={booking} target="_blank" rel="noopener noreferrer" className="font-medium text-accent-text hover:underline">Open the booking page</a> or email <Email />
          </p>
        </div>
      </div>
    </section>
  );
}
