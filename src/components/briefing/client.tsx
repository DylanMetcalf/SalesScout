"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { briefingCallRequestAction } from "@/app/actions/briefing";

/** Used when no calendar is configured: a real request, never a dead booking button. */
export function CallRequestButton({ token, requested, tone = "primary" }: { token: string; requested: boolean; tone?: "primary" | "secondary" }) {
  const [done, setDone] = useState(requested);
  const [pending, setPending] = useState(false);
  if (done) return <p role="status" className="flex items-center gap-2 font-medium"><CircleCheck className="size-5 text-accent" aria-hidden /> Thanks. We’ll contact you to arrange a time.</p>;
  return (
    <Button
      variant={tone}
      size="xl"
      shape="pill"
      loading={pending}
      icon={<PhoneCall className="size-4" />}
      onClick={async () => {
        setPending(true);
        const r = await briefingCallRequestAction(token);
        setPending(false);
        if (r.ok) setDone(true);
      }}
    >
      Let’s discuss your solution
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
