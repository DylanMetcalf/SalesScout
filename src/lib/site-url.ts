/**
 * The public address of the site, for sitemaps, link previews and the redirect
 * away from the onrender.com address. SITE_URL overrides the default.
 */
const DEFAULT_SITE_URL = "https://www.salesscout.co.za";

export function siteUrl(): string {
  const url = process.env.SITE_URL || (process.env.NODE_ENV === "production" ? DEFAULT_SITE_URL : "http://localhost:3000");
  return url.replace(/\/+$/, "");
}
