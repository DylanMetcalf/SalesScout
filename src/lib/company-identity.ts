/**
 * A company's icon, taken from its own website's favicon via its domain. We only
 * show it when we have the official domain, so it can't be a look-alike's logo.
 */
export function companyIconUrl(domain: string | null | undefined, size = 64): string | null {
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}

export function initials(name: string): string {
  return name.replace(/\b(pty|ltd|inc|llc|the)\b/gi, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}
