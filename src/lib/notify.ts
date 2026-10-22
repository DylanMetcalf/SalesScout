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

/** Sends one transactional email via Resend. Throws on failure; "sent" means Resend accepted it. */
export async function sendEmail(msg: { to: string; subject: string; text: string; html?: string; replyTo?: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Email isn't configured (RESEND_API_KEY).");
  const from = process.env.RESEND_FROM || "Sales Scout <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, text: msg.text, html: msg.html, ...(msg.replyTo && { reply_to: msg.replyTo }) }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

export async function notifyEnquiry(e: { name: string; email: string; company?: string | null; website?: string | null; message: string }) {
  if (!process.env.RESEND_API_KEY) return;
  const to = process.env.ENQUIRY_EMAIL || SITE.contactEmail;
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
  await sendEmail({ to, replyTo: e.email, subject: `New enquiry: ${e.name}${e.company ? ` (${e.company})` : ""}`, text: lines.join("\n") });
}
