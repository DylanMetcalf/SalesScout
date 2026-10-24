import { MessagesSquare, ScanSearch, Waypoints as RouteIcon } from "lucide-react";
import { publicSummary } from "@/lib/opportunities/service";
import { bookingUrl } from "@/lib/booking";
import { Eyebrow } from "@/components/site/chrome";
import { IconBadge } from "@/components/site/visuals";
import { NextSteps } from "@/components/intake/next-steps";
import { BriefingStatus } from "@/components/intake/briefing-status";
import { cookies } from "next/headers";
import { opportunityByRef } from "@/lib/opportunities/service";
import { briefingFor, customerEmailConfigured, hashToken } from "@/lib/opportunities/briefings";
import { BRIEFING_COOKIE } from "@/lib/opportunities/briefing-cookie";
import { Waypoints } from "@/components/brand/waypoints";

export const metadata = { title: "We’ve got it", robots: { index: false } };
export const dynamic = "force-dynamic";

const WHAT_NEXT = [
  { icon: ScanSearch, title: "Your briefing", text: "Our initial read of the problem and one direction worth exploring, prepared with the help of AI. Private to you." },
  { icon: MessagesSquare, title: "We read it too", text: "A person on our team reads what you sent, so the conversation starts in the right place." },
  { icon: RouteIcon, title: "Let’s discuss your solution", text: "A short conversation to check our understanding and work out how to take it forward. If we can’t help, we’ll say so." },
];

export default async function Received({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const s = ref ? publicSummary(ref) : null;
  const o = s && ref ? opportunityByRef(ref) : null;
  const briefing = o ? briefingFor(o.id) : null;
  // This browser submitted it (cookie set at submission) and the link is still valid: show it here.
  const cookieToken = (await cookies()).get(BRIEFING_COOKIE)?.value;
  const viewHref = briefing && cookieToken && briefing.tokenHash === hashToken(cookieToken) && !briefing.revokedAt ? `/b/${cookieToken}` : null;

  return (
    <section className="mx-auto max-w-6xl px-4 pt-12 pb-20 sm:px-6 sm:pt-16" aria-labelledby="h-received">
      <Waypoints
        className="max-w-2xl animate-rise"
        label="Where things stand"
        steps={[
          { label: "The problem", state: "done" },
          { label: "Context", state: "done", detail: s ? (Object.keys(s.context).length ? undefined : "Skipped") : "Optional" },
          { label: "Sent to us", state: "done" },
          { label: "Your briefing", state: briefing?.status === "ready" ? "done" : "current" },
          { label: "A conversation", state: briefing?.status === "ready" || !briefing ? "current" : "todo" },
        ]}
      />
      <div className="mt-14 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div className="animate-rise [animation-delay:120ms]">
          <Eyebrow index="✓">Received</Eyebrow>
          <h1 id="h-received" className="mt-5 text-[40px] leading-[1.02] tracking-[-0.035em] sm:text-[60px]">
            {s ? <>Thank you, {s.firstName}. Your problem is in <span className="accent-serif text-signal">good hands.</span></> : <>Thank you. Your problem is in <span className="accent-serif text-signal">good hands.</span></>}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted">{briefing ? "We’re preparing your Business Problem & Solution Briefing: our initial read of the problem and a direction worth exploring." : "You’ve given us a clearer picture of what’s happening. We’ll review it and work out the most useful next step for your business."}</p>
          {briefing && ref && (
            <div className="mt-10">
              <BriefingStatus refId={ref} initial={briefing.status} viewHref={viewHref} emailConfigured={customerEmailConfigured()} />
            </div>
          )}
          <div className={briefing ? "mt-8 px-1" : "mt-10 rounded-card border border-border bg-surface p-6 shadow-sm sm:p-7"}>
            <p className="mb-4 font-display text-[20px] font-[620] tracking-[-0.02em] text-heading">{briefing ? "Ready to talk it through?" : "The quickest way forward is a short conversation."}</p>
            <NextSteps refId={s ? ref! : null} hasBooking={Boolean(bookingUrl())} preference={s?.contactPreference ?? "email"} callRequested={Boolean(s?.callRequested)} />
          </div>

          <h2 className="mt-14 text-[26px] tracking-[-0.025em]">What happens next</h2>
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
          <aside className="relative self-start rounded-card border border-border bg-surface p-6 shadow-md animate-rise [animation-delay:240ms] lg:sticky lg:top-24" aria-labelledby="h-recap">
            <span aria-hidden className="absolute -top-3 left-6 rounded-full bg-text px-3 py-1 caption-mono text-bg">Your words</span>
            <h2 id="h-recap" className="mt-2 text-[22px] tracking-[-0.02em]">What you told us</h2>
            <p className="mt-0.5 text-xs text-subtle">Exactly as sent{s.companyName ? ` for ${s.companyName}` : ""}.</p>
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
