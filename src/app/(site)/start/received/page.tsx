import { MessagesSquare, ScanSearch, Waypoints } from "lucide-react";
import { publicSummary } from "@/lib/opportunities/service";
import { bookingUrl } from "@/lib/booking";
import { Eyebrow } from "@/components/site/chrome";
import { IconBadge } from "@/components/site/visuals";
import { NextSteps } from "@/components/intake/next-steps";

export const metadata = { title: "We’ve got it", robots: { index: false } };
export const dynamic = "force-dynamic";

const WHAT_NEXT = [
  { icon: ScanSearch, title: "We review it", text: "A person reads what you sent and looks at your public website to understand your business." },
  { icon: MessagesSquare, title: "We talk it through", text: "In a short conversation we ask the questions that matter: how the work happens today, what it costs you, what good looks like." },
  { icon: Waypoints, title: "You get a clear next step", text: "If we can help, we’ll suggest a practical way forward. If we can’t, we’ll say so." },
];

export default async function Received({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const s = ref ? publicSummary(ref) : null;

  return (
    <section className="mx-auto max-w-5xl px-4 pt-12 pb-20 sm:px-6 sm:pt-16" aria-labelledby="h-received">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Eyebrow>Received</Eyebrow>
          <h1 id="h-received" className="mt-3 text-[36px] leading-tight text-balance sm:text-[48px]">{s ? `Thank you, ${s.firstName}. Your problem is in good hands.` : "Thank you. Your problem is in good hands."}</h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-muted">You’ve given us a clearer picture of what’s happening. We’ll review it and work out the most useful next step for your business.</p>
          <div className="mt-9">
            <p className="mb-3 font-semibold text-heading">The quickest way forward is a short conversation.</p>
            <NextSteps refId={s ? ref! : null} hasBooking={Boolean(bookingUrl())} preference={s?.contactPreference ?? "email"} callRequested={Boolean(s?.callRequested)} />
          </div>

          <h2 className="mt-14 text-[22px]">What happens next</h2>
          <ol className="mt-5 flex flex-col gap-5">
            {WHAT_NEXT.map((w) => (
              <li key={w.title} className="flex items-start gap-4">
                <IconBadge icon={w.icon} />
                <div>
                  <p className="font-semibold text-heading">{w.title}</p>
                  <p className="text-[15px] text-muted">{w.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {s && (
          <aside className="self-start rounded-2xl border border-border bg-surface p-6 shadow-sm" aria-labelledby="h-recap">
            <h2 id="h-recap" className="text-lg font-semibold">What you told us</h2>
            <p className="mt-0.5 text-xs text-subtle">Your words, exactly as sent{s.companyName ? ` for ${s.companyName}` : ""}.</p>
            <blockquote className="mt-4 max-h-72 overflow-auto border-l-2 border-signal pl-4 text-[15px] leading-7 whitespace-pre-wrap text-text">{s.problem}</blockquote>
            {Object.keys(s.context).length > 0 && (
              <dl className="mt-5 grid gap-3 border-t border-border pt-4 text-sm">
                {[["Affects", s.context.area], ["How often", s.context.frequency], ["Today", s.context.current], ["Ideally", s.context.ideal]].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k}><dt className="text-subtle">{k}</dt><dd className="text-text">{v}</dd></div>
                ))}
              </dl>
            )}
            <p className="mt-5 border-t border-border pt-4 text-xs text-subtle">We’ll reply to {s.email}. Need to add something or change your mind? Reply to our message or email us, and we’ll update or delete it.</p>
          </aside>
        )}
      </div>
    </section>
  );
}
