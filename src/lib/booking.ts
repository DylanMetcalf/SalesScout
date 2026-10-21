/**
 * Discovery-call booking. Set BOOKING_URL on the server to a scheduling page:
 * Calendly, Cal.com, Google Calendar appointment schedule or Zoom Scheduler.
 * Those tools create the Zoom or Google Meet link and send the invites; the
 * website just shows the calendar. Unset = the contact form alone.
 */
export function bookingUrl(): string | null {
  const raw = process.env.BOOKING_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** The same page in the provider's embeddable form, where it needs one. */
export function bookingEmbedUrl(url: string, siteHost: string): string {
  const u = new URL(url);
  if (u.hostname.endsWith("calendly.com")) {
    u.searchParams.set("embed_type", "Inline");
    u.searchParams.set("embed_domain", siteHost);
    u.searchParams.set("hide_gdpr_banner", "1");
  } else if (u.hostname === "calendar.google.com" && u.pathname.includes("/appointments/")) {
    u.searchParams.set("gv", "true");
  } else if (u.hostname === "cal.com" || u.hostname.endsWith(".cal.com")) {
    u.searchParams.set("embed", "true");
  }
  return u.toString();
}
