"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { briefingCallRequestAction, recordBriefingViewAction } from "@/app/actions/briefing";

/** Used when no calendar is configured: a real request, never a dead booking button. */
export function CallRequestButton({ token, requested, tone = "primary" }: { token: string; requested: boolean; tone?: "primary" | "secondary" }) {
  const [done, setDone] = useState(requested);
  const [pending, setPending] = useState(false);
  if (done) return <p role="status" className="flex items-center gap-2 font-medium"><CircleCheck className="size-5 text-accent" aria-hidden /> Thanks. We’ll contact you to arrange a time.</p>;
  return (
    <Button
      variant={tone}
      size="xl"
     
      loading={pending}
      icon={<PhoneCall className="size-4" />}
      onClick={async () => {
        setPending(true);
        const r = await briefingCallRequestAction(token);
        setPending(false);
        if (r.ok) setDone(true);
      }}
    >
      Let’s Discuss Your Solution
    </Button>
  );
}

/** While the briefing is being written, check again every few seconds. */
export function RefreshWhilePreparing() {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 6000);
    return () => clearInterval(id);
  }, [router]);
  return null;
}

/** Records one open per browser session. Nothing else about the visit is tracked. */
export function CountView({ token }: { token: string }) {
  useEffect(() => {
    const key = `ss-viewed-${token.slice(0, 8)}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* storage unavailable: count anyway */
    }
    void recordBriefingViewAction(token);
  }, [token]);
  return null;
}
