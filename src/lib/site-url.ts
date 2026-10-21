/**
 * The public address of the site, for sitemaps, link previews and the redirect
 * away from the onrender.com address. SITE_URL overrides the default.
 * Forgiving on purpose: "www.example.com" gains https://, and anything that still
 * isn't a valid address falls back to the default instead of breaking the build.
 */
const DEFAULT_SITE_URL = "https://www.salesscout.co.za";

export function siteUrl(): string {
  const fallback = process.env.NODE_ENV === "production" ? DEFAULT_SITE_URL : "http://localhost:3000";
  const raw = process.env.SITE_URL?.trim();
  if (!raw) return fallback;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.origin;
  } catch {
    console.warn(`[site-url] Ignoring SITE_URL="${raw}": not a valid address. Using ${fallback}.`);
    return fallback;
  }
}
