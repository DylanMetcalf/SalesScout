"use server";

import { accessByToken, recordView } from "@/lib/opportunities/briefings";
import { requestCallFor } from "@/lib/opportunities/service";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/client-ip";

/** From inside a briefing: ask us to arrange the conversation (when no calendar is configured). */
export async function briefingCallRequestAction(token: string) {
  if (!rateLimit(`briefing-call:${await clientIp()}`, 20, 3_600_000)) return { ok: false };
  const a = accessByToken(token);
  if (a.state === "unavailable") return { ok: false };
  requestCallFor(a.opportunity.id);
  return { ok: true };
}

/** Counted from the page itself, so email link scanners that only fetch the URL don't register as opens. */
export async function recordBriefingViewAction(token: string) {
  if (!rateLimit(`briefing-view:${await clientIp()}`, 60, 3_600_000)) return;
  const a = accessByToken(token);
  if (a.state === "ready") recordView(a.briefing.id);
}
