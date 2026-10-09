"use server";

import { headers } from "next/headers";
import * as z from "zod/v4";
import { db, t } from "@/lib/db";
import { newId } from "@/lib/ids";
import { rateLimit } from "@/lib/security/rate-limit";

export type EnquiryState = { ok?: boolean; error?: string; fields?: Record<string, string> } | undefined;

const Enquiry = z.object({
  name: z.string().trim().min(1, "Tell us your name").max(100),
  email: z.email("That email doesn't look right"),
  company: z.string().trim().max(150).optional(),
  website: z.string().trim().max(200).optional(),
  message: z.string().trim().min(10, "Tell us a little about what you sell").max(3000),
});

/** Saves a website enquiry for the team to follow up. */
export async function submitEnquiry(_: EnquiryState, form: FormData): Promise<EnquiryState> {
  const fields = Object.fromEntries(["name", "email", "company", "website", "message"].map((k) => [k, String(form.get(k) ?? "")]));
  // Hidden field humans never fill in: quietly accept and drop bot submissions.
  if (String(form.get("fax") ?? "")) return { ok: true };
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`enquiry:${ip}`, 5, 3_600_000)) return { error: "Too many messages from here. Please email us instead.", fields };
  const parsed = Enquiry.safeParse(fields);
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields };
  db.insert(t.enquiries)
    .values({ id: newId("enq"), ...parsed.data, company: parsed.data.company || null, website: parsed.data.website || null })
    .run();
  return { ok: true };
}
