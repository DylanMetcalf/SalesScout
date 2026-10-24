"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Waypoints } from "@/components/brand/waypoints";

type Status = "queued" | "generating" | "ready" | "failed" | "manual" | "none";

/** Live status of the visitor's briefing. Shows only what's true right now; never a pretend report. */
export function BriefingStatus({ refId, initial, viewHref, emailConfigured }: { refId: string; initial: Status; viewHref: string | null; emailConfigured: boolean }) {
  const [status, setStatus] = useState<Status>(initial);
  const [email, setEmail] = useState<string | null>(null);
  const working = status === "queued" || status === "generating";

  useEffect(() => {
    if (!working) return;
    let stop = false;
    let tries = 0;
    const tick = async () => {
      tries++;
      try {
        const r = await fetch(`/api/briefings/status?ref=${encodeURIComponent(refId)}`, { cache: "no-store" });
        if (r.ok) {
          const d = (await r.json()) as { status: Status; email: string | null };
          if (stop) return;
          setStatus(d.status);
          setEmail(d.email);
          if (d.status !== "queued" && d.status !== "generating") return;
        }
      } catch {
        /* try again */
      }
      if (!stop && tries < 100) setTimeout(tick, tries < 10 ? 3000 : 6000);
    };
    const id = setTimeout(tick, 2500);
    return () => {
      stop = true;
      clearTimeout(id);
    };
  }, [working, refId]);

  if (status === "none") return null;
  const steps = [
    { label: "Problem received", state: "done" as const },
    { label: "Analysing it", state: working ? ("current" as const) : ("done" as const) },
    { label: "Your briefing", state: status === "ready" ? ("done" as const) : working ? ("todo" as const) : ("current" as const) },
  ];

  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-sm sm:p-7" aria-live="polite">
      <Waypoints label="Your briefing" steps={steps} className="max-w-md" />
      {working && (
        <div className="mt-6">
          <p className="font-display text-[22px] font-[620] tracking-[-0.02em] text-heading">We’re writing your briefing now.</p>
          <p className="mt-2 text-muted">It usually takes a minute or two. You can wait here{emailConfigured ? ", or close this page: we’ll email you a private link when it’s ready" : ""}.</p>
        </div>
      )}
      {status === "ready" && (
        <div className="mt-6">
          <p className="font-display text-[22px] font-[620] tracking-[-0.02em] text-heading">Your briefing is ready.</p>
          {viewHref ? (
            <>
              <p className="mt-2 text-muted">Our initial read of your problem, and one direction we think is worth exploring. The link is private to you.</p>
              <ButtonLink href={viewHref} variant="primary" size="xl" shape="pill" className="mt-5" trailing={<ArrowRight className="size-4" />}>View my briefing</ButtonLink>
            </>
          ) : (
            <p className="mt-2 flex items-start gap-2 text-muted"><Mail className="mt-1 size-4 shrink-0" aria-hidden />{email === "sent" ? "We’ve emailed you a private link to it." : "We’ll send you a private link to it shortly."}</p>
          )}
        </div>
      )}
      {(status === "failed" || status === "manual") && (
        <div className="mt-6">
          <p className="font-display text-[22px] font-[620] tracking-[-0.02em] text-heading">We’ll prepare your briefing personally.</p>
          <p className="mt-2 text-muted">We couldn’t produce it automatically this time. Your problem is saved and a member of our team will follow up with you.</p>
        </div>
      )}
    </div>
  );
}
