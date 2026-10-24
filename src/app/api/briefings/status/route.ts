import { NextResponse } from "next/server";
import { publicSummary, opportunityByRef } from "@/lib/opportunities/service";
import { briefingFor, customerEmailConfigured } from "@/lib/opportunities/briefings";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/client-ip";

/** Status only (never content) for the visitor's own submission, by its 7-day reference. */
export async function GET(req: Request) {
  const ref = new URL(req.url).searchParams.get("ref") ?? "";
  const headers = { "cache-control": "no-store" };
  if (!rateLimit(`briefing-status:${await clientIp()}`, 300, 3_600_000)) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers });
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(ref) || !publicSummary(ref)) return NextResponse.json({ error: "Not found" }, { status: 404, headers });
  const b = briefingFor(opportunityByRef(ref)!.id);
  return NextResponse.json({ status: b?.status ?? "none", email: b?.emailStatus ?? null, emailConfigured: customerEmailConfigured() }, { headers });
}
