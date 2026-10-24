import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { newId } from "@/lib/ids";
import { AiFailedError, AiUnavailableError, type AiContext } from "@/lib/ai/core";
import { modelFor } from "@/lib/ai/models";
import { bookingUrl } from "@/lib/booking";
import { sendEmail } from "@/lib/notify";
import { siteUrl } from "@/lib/site-url";
import { SITE } from "@/content/site";
import { rateLimit } from "@/lib/security/rate-limit";
import { writeBriefing, type BriefingInput } from "./briefing-ai";
import { getOpportunity, logActivity, operatorContext, type Opportunity } from "./service";
import type { Briefing } from "./types";

/*
 * The customer's private briefing link is a bearer token: 32 random bytes,
 * shown once, stored only as a SHA-256 hash. The briefing's reference
 * (SSB-XXXX-XXXX) is not a secret; it labels the document and the booking.
 */

export type BriefingRow = typeof t.briefings.$inferSelect;
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const newToken = () => randomBytes(32).toString("base64url");
const isTokenShaped = (token: string) => /^[A-Za-z0-9_-]{43}$/.test(token);

function newReference() {
  const c = Array.from(randomBytes(8), (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `SSB-${c.slice(0, 4)}-${c.slice(4)}`;
}

/** How long a private link works, from BRIEFING_LINK_DAYS (default 30, 1 to 365). */
export function linkDays() {
  const d = Number(process.env.BRIEFING_LINK_DAYS);
  return Number.isInteger(d) && d >= 1 && d <= 365 ? d : 30;
}

export function briefingFor(opportunityId: string): BriefingRow | null {
  return db.select().from(t.briefings).where(eq(t.briefings.opportunityId, opportunityId)).get() ?? null;
}

/** Creates the briefing record and its first private link. Returns the token once; null if it already existed. */
export function createBriefing(opportunityId: string): { briefing: BriefingRow; token: string | null } {
  const existing = briefingFor(opportunityId);
  if (existing) return { briefing: existing, token: null };
  const token = newToken();
  const now = new Date();
  db.insert(t.briefings)
    .values({ id: newId("brf"), opportunityId, reference: newReference(), tokenHash: hashToken(token), tokenIssuedAt: now, expiresAt: new Date(now.getTime() + linkDays() * 86_400_000) })
    .onConflictDoNothing()
    .run();
  const row = briefingFor(opportunityId)!;
  // Lost a race with a duplicate submit: the other request owns the token.
  return { briefing: row, token: row.tokenHash === hashToken(token) ? token : null };
}

/** A fresh private link (the old one stops working). Returns the token once. */
export function issueLink(briefingId: string): string {
  const token = newToken();
  const now = new Date();
  db.update(t.briefings)
    .set({ tokenHash: hashToken(token), tokenIssuedAt: now, expiresAt: new Date(now.getTime() + linkDays() * 86_400_000), revokedAt: null, updatedAt: now })
    .where(eq(t.briefings.id, briefingId))
    .run();
  return token;
}

export function revokeLink(briefingId: string) {
  db.update(t.briefings).set({ revokedAt: new Date(), updatedAt: new Date() }).where(eq(t.briefings.id, briefingId)).run();
}

export type Access =
  | { state: "ready"; briefing: BriefingRow & { content: Briefing }; opportunity: Opportunity }
  | { state: "preparing" | "personal"; briefing: BriefingRow; opportunity: Opportunity }
  | { state: "unavailable" };

/** Resolves a private link. Missing, revoked and expired links all look the same from outside. */
export function accessByToken(token: string): Access {
  if (!isTokenShaped(token)) return { state: "unavailable" };
  const b = db.select().from(t.briefings).where(eq(t.briefings.tokenHash, hashToken(token))).get();
  if (!b || b.revokedAt || !b.expiresAt || b.expiresAt.getTime() < Date.now()) return { state: "unavailable" };
  const opportunity = getOpportunity(b.opportunityId);
  if (b.status === "ready" && b.content) return { state: "ready", briefing: b as BriefingRow & { content: Briefing }, opportunity };
  return { state: b.status === "failed" || b.status === "manual" ? "personal" : "preparing", briefing: b, opportunity };
}

export function recordView(briefingId: string) {
  const b = db.select({ first: t.briefings.firstViewedAt, n: t.briefings.viewCount }).from(t.briefings).where(eq(t.briefings.id, briefingId)).get();
  if (!b) return;
  const now = new Date();
  db.update(t.briefings).set({ firstViewedAt: b.first ?? now, lastViewedAt: now, viewCount: b.n + 1 }).where(eq(t.briefings.id, briefingId)).run();
}

/** Where "Let's discuss your solution" goes: the configured calendar, pre-filled, tagged with the (non-secret) reference. */
export function bookingLink(o: Pick<Opportunity, "name" | "email">, reference: string): string | null {
  const url = bookingUrl();
  if (!url) return null;
  const u = new URL(url);
  if (u.hostname.endsWith("calendly.com")) {
    u.searchParams.set("name", o.name);
    u.searchParams.set("email", o.email);
    u.searchParams.set("utm_source", "briefing");
    u.searchParams.set("utm_content", reference);
  }
  return u.toString();
}

// Generation --------------------------------------------------------------------

type Deps = { write?: (ctx: AiContext, input: BriefingInput) => Promise<Briefing>; ctx?: AiContext | null; email?: typeof sendBriefingEmail };
const inFlight = new Set<string>();

function setStatus(id: string, patch: Partial<typeof t.briefings.$inferInsert>) {
  db.update(t.briefings).set({ ...patch, updatedAt: new Date() }).where(eq(t.briefings.id, id)).run();
}

/**
 * Writes the briefing. The enquiry is already saved; nothing here can lose it.
 * One retry on a provider failure; no retry when AI is unavailable (paused,
 * over budget, not configured), which hands it to a person instead.
 */
export async function runBriefing(opportunityId: string, token: string | null, deps: Deps = {}) {
  const b = briefingFor(opportunityId);
  if (!b || b.status === "ready" || inFlight.has(b.id)) return briefingFor(opportunityId);
  inFlight.add(b.id);
  const write = deps.write ?? writeBriefing;
  const o = getOpportunity(opportunityId);
  const ctx = deps.ctx !== undefined ? deps.ctx : operatorContext();
  try {
    if (!ctx) throw new AiUnavailableError("No operator account is set up to run AI.");
    const input: BriefingInput = { problem: o.problem, context: o.context ?? {}, companyName: o.companyName, role: o.role, region: o.region };
    let content: Briefing | null = null;
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2 && !content; attempt++) {
      setStatus(b.id, { status: "generating", attempts: (briefingFor(opportunityId)?.attempts ?? 0) + 1, error: null });
      try {
        content = await write(ctx, input);
      } catch (err) {
        lastError = err;
        if (!(err instanceof AiFailedError)) break; // unavailable or a bug: don't spend again
      }
    }
    if (!content) throw lastError ?? new Error("No briefing produced");
    setStatus(b.id, { status: "ready", content, model: modelFor("customer_briefing"), error: null });
    logActivity(opportunityId, `Customer briefing ${b.reference} is ready (AI)`, "system");
    if (token) await (deps.email ?? sendBriefingEmail)(o, briefingFor(opportunityId)!, token);
  } catch (err) {
    const manual = err instanceof AiUnavailableError;
    const message = (err instanceof Error ? err.message : "Unknown error").slice(0, 300);
    setStatus(b.id, { status: manual ? "manual" : "failed", error: message });
    logActivity(opportunityId, manual ? `Briefing not generated automatically (${message}). Prepare it by hand or retry.` : `Briefing generation failed: ${message}`, "system");
    await notifyOperatorOfFailure(o, b.reference, message).catch((e) => console.error("[briefing] operator alert failed", e));
  } finally {
    inFlight.delete(b.id);
  }
  return briefingFor(opportunityId);
}

/** Automatic briefings per day across all visitors (BRIEFING_DAILY_LIMIT, default 30): a flood can't run up AI costs. */
const dailyLimit = () => Number(process.env.BRIEFING_DAILY_LIMIT) || 30;

/** Starts generation without holding up the visitor's request. */
export function startBriefing(opportunityId: string, token: string | null) {
  if (!rateLimit("auto-briefing", dailyLimit(), 86_400_000)) {
    const b = briefingFor(opportunityId);
    if (b) setStatus(b.id, { status: "manual", error: "Daily limit for automatic briefings reached." });
    logActivity(opportunityId, "Daily limit for automatic briefings reached: prepare this one by hand or retry tomorrow.", "system");
    return;
  }
  void runBriefing(opportunityId, token).catch((err) => console.error("[briefing] unexpected", err));
}

// Email -------------------------------------------------------------------------

/**
 * Customer emails need a sender on a domain verified in Resend (RESEND_FROM).
 * Resend's shared test sender only delivers to the account owner, so without
 * RESEND_FROM we record "not_configured" rather than pretend.
 */
export function customerEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function briefingEmail(o: Pick<Opportunity, "name" | "companyName">, b: Pick<BriefingRow, "reference" | "expiresAt"> & { content: Briefing | null }, link: string) {
  const first = o.name.split(/\s+/)[0];
  const title = b.content?.title ?? "Your Business Problem & Solution Briefing";
  const until = b.expiresAt ? b.expiresAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;
  const text = [
    `Hi ${first},`,
    "",
    `Your Business Problem & Solution Briefing${o.companyName ? ` for ${o.companyName}` : ""} is ready: "${title}".`,
    "It's our initial read of the problem you described and one direction we think is worth exploring.",
    "",
    `View your briefing (private link${until ? `, works until ${until}` : ""}):`,
    link,
    "",
    "If it rings true, the next step is a short conversation to check our understanding and talk through how to take it forward.",
    "",
    `Reference: ${b.reference}`,
    "Sales Scout, a Mea Creo service",
    SITE.contactEmail,
  ].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#f4f1ea;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#16161d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fffdf8;border:1px solid #ddd7cb;border-radius:18px">
<tr><td style="padding:28px 32px 8px"><table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="width:28px;height:28px;background:#16161d;border-radius:7px;text-align:center;color:#fffdf8;font-weight:700;font-size:15px;line-height:28px">S</td>
<td style="padding-left:10px;font-weight:700;font-size:15px">Sales Scout</td></tr></table></td></tr>
<tr><td style="padding:16px 32px 0;font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:.08em;color:#a3361a;text-transform:uppercase">Business Problem &amp; Solution Briefing · ${esc(b.reference)}</td></tr>
<tr><td style="padding:10px 32px 0;font-size:26px;line-height:1.15;font-weight:700;letter-spacing:-.02em">Your briefing is ready, ${esc(first)}.</td></tr>
<tr><td style="padding:14px 32px 0;font-size:15px;line-height:1.6;color:#4a4a55">“${esc(title)}”. Our initial read of the problem you described${o.companyName ? ` for ${esc(o.companyName)}` : ""}, and one direction we think is worth exploring.</td></tr>
<tr><td style="padding:24px 32px 4px"><a href="${esc(link)}" style="display:inline-block;background:#c2381a;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 22px;border-radius:999px">View my briefing</a></td></tr>
<tr><td style="padding:8px 32px 0;font-size:12px;color:#5f5e68">A private link for you${until ? `, working until ${esc(until)}` : ""}. Please don’t forward it.</td></tr>
<tr><td style="padding:22px 32px 28px;font-size:14px;line-height:1.6;color:#4a4a55;border-top:1px solid #eeeae1">If it rings true, the next step is a short conversation to check our understanding and talk through how to take it forward. You’ll find the booking link inside the briefing.</td></tr>
</table>
<p style="font-size:12px;color:#5f5e68;margin:16px 0 0">Sales Scout, a Mea Creo service · ${esc(SITE.contactEmail)}</p>
</td></tr></table></body></html>`;
  return { subject: `Your briefing is ready: ${title}`, text, html };
}

export async function sendBriefingEmail(o: Opportunity, b: BriefingRow, token: string) {
  if (!customerEmailConfigured()) {
    setStatus(b.id, { emailStatus: "not_configured", emailError: "RESEND_FROM (a sender on a verified domain) isn't set." });
    return;
  }
  try {
    const msg = briefingEmail(o, b, `${siteUrl()}/b/${token}`);
    await sendEmail({ to: o.email, ...msg, replyTo: process.env.ENQUIRY_EMAIL || SITE.contactEmail });
    setStatus(b.id, { emailStatus: "sent", emailSentAt: new Date(), emailError: null });
    logActivity(o.id, "Briefing link emailed to the customer", "system");
  } catch (err) {
    setStatus(b.id, { emailStatus: "failed", emailError: (err instanceof Error ? err.message : "Unknown").slice(0, 300) });
    logActivity(o.id, "Couldn't email the briefing link; send it by hand from the opportunity", "system");
  }
}

async function notifyOperatorOfFailure(o: Opportunity, reference: string, reason: string) {
  if (!process.env.RESEND_API_KEY) return;
  await sendEmail({
    to: process.env.ENQUIRY_EMAIL || SITE.contactEmail,
    subject: `Briefing needs attention: ${o.companyName || o.name}`,
    text: `The briefing ${reference} for ${o.name}${o.companyName ? ` (${o.companyName})` : ""} wasn't generated automatically.\n\nReason: ${reason}\n\nThe enquiry is saved. Retry or follow up personally: ${siteUrl()}/opportunities/${o.id}`,
  });
}
