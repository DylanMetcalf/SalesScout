/**
 * The public address of the site, for sitemaps and link previews. Set SITE_URL to
 * your custom domain (e.g. https://salesscout.co); Render's own URL is the fallback.
 */
export function siteUrl(): string {
  const url = process.env.SITE_URL || process.env.RENDER_EXTERNAL_URL || "http://localhost:3000";
  return url.replace(/\/+$/, "");
}
