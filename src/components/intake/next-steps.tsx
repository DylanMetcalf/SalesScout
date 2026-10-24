"use client";

import { useState } from "react";
import { ArrowRight, CalendarCheck, CircleCheck, PhoneCall } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { visitorStepAction } from "@/app/actions/intake";

/** The one next step after submitting: book a call, or carry on and hear from us. */
export function NextSteps({ refId, hasBooking, preference, callRequested }: { refId: string | null; hasBooking: boolean; preference: string; callRequested: boolean }) {
  const [mode, setMode] = useState<"choose" | "later">("choose");
  const [asked, setAsked] = useState(callRequested);
  const [pending, setPending] = useState(false);
  const bookHref = refId ? `/book?ref=${encodeURIComponent(refId)}` : "/book";

  const requestCall = async () => {
    if (!refId) return;
    setPending(true);
    const r = await visitorStepAction(refId, "call_requested");
    setPending(false);
    if (r.ok) setAsked(true);
  };

  if (mode === "later") {
    return (
      <div className="animate-rise" role="status">
        <p className="font-semibold text-heading">No problem. We’ll be in touch {preference === "email" ? "by email" : preference === "whatsapp" ? "on WhatsApp" : "by phone"} once we’ve reviewed it.</p>
        <p className="mt-1.5 text-[15px] text-muted">If something changes or you think of more detail, just reply to our message. You can still book a time whenever suits you.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <ButtonLink href={bookHref} variant="secondary" className="rounded-full" icon={<CalendarCheck className="size-4" />}>Book after all</ButtonLink>
          <ButtonLink href="/" variant="ghost">Back to the website</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {hasBooking ? (
        <ButtonLink href={bookHref} variant="primary" size="lg" trailing={<ArrowRight className="size-4" />} className="h-12 self-start rounded-full px-6">Book a conversation</ButtonLink>
      ) : asked ? (
        <p className="flex items-center gap-2 font-medium text-heading" role="status"><CircleCheck className="size-5 text-accent animate-check-pop" aria-hidden /> Thanks. We’ll contact you to arrange a time.</p>
      ) : (
        <Button variant="primary" size="lg" loading={pending} onClick={requestCall} icon={<PhoneCall className="size-4" />} className="h-12 self-start rounded-full px-6">Ask us to arrange a conversation</Button>
      )}
      <button type="button" onClick={() => setMode("later")} className="self-start text-sm text-muted underline-offset-4 hover:text-text hover:underline">Continue without booking</button>
    </div>
  );
}
