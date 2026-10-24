"use server";

import { accessByToken } from "@/lib/opportunities/briefings";
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
