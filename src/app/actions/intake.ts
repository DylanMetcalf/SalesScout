"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import * as z from "zod/v4";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/client-ip";
import { notifyOpportunity } from "@/lib/notify";
import { siteUrl } from "@/lib/site-url";
import { createFromIntake, opportunityByRef, recordVisitorStep } from "@/lib/opportunities/service";
import { AREAS, FREQUENCIES } from "@/lib/opportunities/types";
import { createBriefing, linkDays, startBriefing } from "@/lib/opportunities/briefings";
import { BRIEFING_COOKIE } from "@/lib/opportunities/briefing-cookie";

export type IntakeState = { error?: string; field?: string; step?: number } | undefined;

const opt = (max: number) => z.string().trim().max(max).transform((v) => v || null);

const Intake = z.object({
  problem: z.string().trim().min(20, "Tell us a little more: a couple of sentences is plenty.").max(5000, "That's a lot to take in at once. Please keep it under 5,000 characters; we'll ask the rest on a call."),
  business: opt(600),
  area: z.union([z.literal(""), z.enum(AREAS)]).transform((v) => v || null),
  current: opt(1500),
  frequency: z.union([z.literal(""), z.enum(FREQUENCIES)]).transform((v) => v || null),
  ideal: opt(1500),
  name: z.string().trim().min(2, "Tell us your name").max(100),
  email: z.email("That email doesn't look right").max(200),
  companyName: z.string().trim().min(1, "Tell us your company's name").max(150),
  website: opt(200),
  role: opt(100),
  phone: z.string().trim().max(30).regex(/^[+\d\s()-]*$/, "That phone number has characters we can't use").transform((v) => v || null),
  region: opt(100),
  contactPreference: z.enum(["email", "phone", "whatsapp"]),
  consent: z.literal("on", { error: "Please confirm you've read how we'll use your information." }),
  key: z.string().regex(/^[A-Za-z0-9-]{16,64}$/, "Please refresh the page and try again."),
});

const STEP_OF: Record<string, number> = { problem: 1, business: 2, area: 2, current: 2, frequency: 2, ideal: 2 };

/** Saves a problem, notifies the operator, then shows the confirmation. AI is never needed to save. */
export async function submitProblem(_: IntakeState, form: FormData): Promise<IntakeState> {
  if (String(form.get("fax") ?? "")) redirect("/start/received"); // honeypot: bots get a polite dead end
  const raw = Object.fromEntries(["problem", "business", "area", "current", "frequency", "ideal", "name", "email", "companyName", "website", "role", "phone", "region", "contactPreference", "consent", "key"].map((k) => [k, String(form.get(k) ?? "")]));
  const parsed = Intake.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = String(issue.path[0]);
    return { error: issue.message, field, step: STEP_OF[field] ?? 3 };
  }
  if (!rateLimit(`intake:${await clientIp()}`, 6, 3_600_000)) return { error: "We've had several submissions from your connection in the last hour. Please email us instead.", step: 3 };
  const v = parsed.data;
  if (v.contactPreference !== "email" && !v.phone) return { error: "Add a phone number, or choose email as the way to reach you.", field: "phone", step: 3 };

  const { ref, created } = createFromIntake({
    problem: v.problem,
    context: Object.fromEntries(Object.entries({ business: v.business, area: v.area, current: v.current, frequency: v.frequency, ideal: v.ideal }).filter(([, x]) => x)) as Record<string, string>,
    name: v.name,
    email: v.email,
    companyName: v.companyName,
    website: v.website,
    role: v.role,
    phone: v.phone,
    region: v.region,
    contactPreference: v.contactPreference,
    idempotencyKey: v.key,
  });

  if (created) {
    const o = opportunityByRef(ref);
    if (o) {
      // The enquiry is saved. Now the briefing: create its record and private link, then write it in the background.
      const { token } = createBriefing(o.id);
      if (token) {
        (await cookies()).set(BRIEFING_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: linkDays() * 86_400 });
      }
      startBriefing(o.id, token);
      await notifyOpportunity(o, `${siteUrl()}/opportunities/${o.id}`).catch((err) => console.error("[intake] operator email failed", err));
    }
  }
  redirect(`/start/received?ref=${encodeURIComponent(ref)}`);
}

/** The visitor's next step on the confirmation page. Only touches the record their reference names. */
export async function visitorStepAction(ref: string, step: "call_requested" | "booking_opened") {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(ref) || !["call_requested", "booking_opened"].includes(step)) return { ok: false };
  if (!rateLimit(`visitor-step:${await clientIp()}`, 20, 3_600_000)) return { ok: false };
  return { ok: recordVisitorStep(ref, step) };
}
