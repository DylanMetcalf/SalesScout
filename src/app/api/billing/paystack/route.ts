import { NextResponse } from "next/server";
import { applyWebhook, verifySignature } from "@/lib/billing/paystack";

export const dynamic = "force-dynamic";

/** Paystack webhook: signature-checked (HMAC-SHA512 of the raw body) and idempotent. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    const result = applyWebhook(raw);
    if (result === "unmatched") console.warn("[paystack] webhook for an unknown account");
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[paystack] webhook failed", err);
    // 500 makes Paystack retry later; the event wasn't recorded if parsing failed.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
