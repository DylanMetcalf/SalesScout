import "server-only";
import { eq } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { newId } from "@/lib/ids";
import type { CompanyTenant } from "@/lib/tenant";
import { enquiryEmailsEnabled, sendEmail } from "@/lib/notify";
import { siteUrl } from "@/lib/site-url";
import { emailState } from "@/lib/verification";
import { contactsOf, mustGetProspect } from "./workflow";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** The most useful next step for a prospect, given what has actually happened so far. */
export function nextAction(p: { id: string; status: string; lastContactAt: Date | null }): { label: string; path: string } {
  const base = `/prospects/${p.id}`;
  if (["replied", "meeting", "opportunity", "won", "lost"].includes(p.status)) return { label: "View prospect", path: base };
  if (p.lastContactAt || p.status === "contacted") return { label: "Draft a follow-up", path: `${base}?draft=follow_up` };
  return { label: "Draft initial email", path: `${base}?draft=email` };
}

/**
 * Emails the user a short brief after they keep a prospect. At most once per
 * prospect and user (retries are no-ops); respects the user's preference; every
 * attempt is recorded, and "sent" only means the email provider accepted it.
 */
export async function notifyKept(tenant: CompanyTenant, prospectId: string) {
  const user = tenant.user;
  const key = `kept:${prospectId}:${user.id}`;
  const status = !user.notifyOnKeep ? "skipped" : !enquiryEmailsEnabled() ? "skipped" : "sending";
  const res = db
    .insert(t.notifications)
    .values({ id: newId("nt"), idempotencyKey: key, accountId: tenant.account.id, userId: user.id, kind: "prospect_kept", status, error: status === "skipped" ? (!user.notifyOnKeep ? "Turned off by user" : "Email not configured") : null })
    .onConflictDoNothing()
    .run();
  if (res.changes === 0 || status === "skipped") return;

  const p = mustGetProspect(tenant, prospectId);
  const lead = contactsOf(tenant, prospectId).find((c) => c.name) ?? null;
  const base = siteUrl();
  const action = nextAction(p);
  const contactLine = lead
    ? `${lead.name}, ${lead.role}${lead.email ? ` · email: ${emailState(lead.checks, true)!.label.toLowerCase()}` : " · no published email yet"}`
    : "No named contact yet: roles to find are in the profile.";
  const why = p.whyRelevant ?? "You kept this prospect for follow-up.";
  const subject = `Your Sales Scout prospect brief is ready: ${p.name}`;
  const text = [
    `${p.name}${p.industry ? ` · ${p.industry}` : ""}${p.location ? ` · ${p.location}` : ""}`,
    "",
    `Why it's worth pursuing: ${why}`,
    `Who to speak to: ${contactLine}`,
    "",
    `${action.label}: ${base}${action.path}`,
    `Open the brief: ${base}/reports/brief/${p.id}`,
    "",
    "Nothing is sent to the prospect without you. You can turn these emails off in Settings.",
  ].join("\n");
  const button = (href: string, label: string, primary: boolean) =>
    `<a href="${esc(href)}" style="display:inline-block;padding:11px 18px;border-radius:8px;font-weight:600;font-size:14px;text-decoration:none;${primary ? "background:#2f45e0;color:#ffffff" : "border:1px solid #c6bfb0;color:#16161d"}">${esc(label)}</a>`;
  const html = `<!doctype html><html><body style="margin:0;background:#f4f1ea;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#16161d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#16161d;padding:18px 24px;color:#ffffff;font-weight:700;font-size:16px"><span style="display:inline-block;width:22px;height:22px;border-radius:6px;background:#2f45e0;color:#fff;text-align:center;line-height:22px;margin-right:8px">S</span>Sales Scout</td></tr>
<tr><td style="padding:24px">
<p style="margin:0;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#2638c8;font-weight:700">Prospect brief ready</p>
<h1 style="margin:6px 0 2px;font-size:22px;color:#16161d">${esc(p.name)}</h1>
<p style="margin:0 0 16px;font-size:13px;color:#4a4a55">${esc([p.industry, p.location].filter(Boolean).join(" · "))}</p>
<p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#5f5e68;text-transform:uppercase;letter-spacing:.08em">Why it's worth pursuing</p>
<p style="margin:0 0 14px;font-size:14px;line-height:1.55">${esc(why)}</p>
<p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#5f5e68;text-transform:uppercase;letter-spacing:.08em">Who to speak to</p>
<p style="margin:0 0 20px;font-size:14px;line-height:1.55">${esc(contactLine)}</p>
<p style="margin:0">${button(`${base}${action.path}`, action.label, true)}&nbsp; ${button(`${base}/reports/brief/${p.id}`, "Open the brief", false)}</p>
</td></tr>
<tr><td style="padding:14px 24px;border-top:1px solid #ddd7cb;font-size:11.5px;color:#5f5e68">Nothing is sent to the prospect without you. Links open your Sales Scout account. Turn these emails off in Settings.</td></tr>
</table></td></tr></table></body></html>`;

  try {
    await sendEmail({ to: user.email, subject, text, html });
    db.update(t.notifications).set({ status: "sent" }).where(eq(t.notifications.idempotencyKey, key)).run();
  } catch (err) {
    db.update(t.notifications).set({ status: "failed", error: err instanceof Error ? err.message.slice(0, 300) : "failed" }).where(eq(t.notifications.idempotencyKey, key)).run();
  }
}
