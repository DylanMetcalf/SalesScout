import "server-only";
import { SITE } from "@/content/site";

/**
 * Emails a new website enquiry to the team via Resend (https://resend.com).
 * Needs RESEND_API_KEY. Until a domain is verified in Resend, its default
 * sender only delivers to the Resend account's own email, so sign up to
 * Resend with the address in ENQUIRY_EMAIL (default: the site contact email).
 */
export function enquiryEmailsEnabled() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function notifyEnquiry(e: { name: string; email: string; company?: string | null; website?: string | null; message: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const to = process.env.ENQUIRY_EMAIL || SITE.contactEmail;
  const from = process.env.RESEND_FROM || "Sales Scout <onboarding@resend.dev>";
  const lines = [
    `Name: ${e.name}`,
    `Email: ${e.email}`,
    e.company ? `Company: ${e.company}` : null,
    e.website ? `Website: ${e.website}` : null,
    "",
    e.message,
    "",
    "Reply to this email to answer them directly. All enquiries are in Admin.",
  ].filter((l) => l !== null);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], reply_to: e.email, subject: `New enquiry: ${e.name}${e.company ? ` (${e.company})` : ""}`, text: lines.join("\n") }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}
