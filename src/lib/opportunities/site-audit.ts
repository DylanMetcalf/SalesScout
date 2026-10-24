import "server-only";
import { fetchPublic } from "@/lib/research/website";
import { normaliseUrl } from "@/lib/security/url";

/**
 * Deterministic website checks: only what can be read directly from the
 * site's own HTML, robots.txt and sitemap. No rankings, traffic or indexing
 * claims; those need Search Console or analytics access we don't have.
 */

export type PageCheck = {
  url: string;
  title: string;
  description: string;
  h1: string[];
  canonical: string | null;
  robotsMeta: string | null;
  lang: string | null;
  viewport: boolean;
  openGraph: boolean;
  schemaTypes: string[];
  words: number;
  images: number;
  imagesWithoutAlt: number;
};

export type SiteAudit = {
  home: string;
  https: boolean;
  robotsTxt: { found: boolean; blocksAll: boolean; sitemaps: string[] };
  sitemap: { url: string; found: boolean; urls: number | null };
  llmsTxt: boolean;
  pages: PageCheck[];
  failures: { url: string; reason: string }[];
  observations: { finding: string; area: string; url: string | null }[];
  checkedAt: string;
};

const attr = (tag: string, name: string) => tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] ?? null;
const metaTag = (html: string, key: string, value: string) =>
  [...html.matchAll(/<meta\b[^>]{0,2000}>/gi)].map((m) => m[0]).find((t) => attr(t, key)?.toLowerCase() === value) ?? null;
const text = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();

const MAX_HTML = 600_000;

/**
 * Every <tag …>…</tag> block, found with indexOf rather than a backtracking regex,
 * so a hostile page (thousands of unclosed tags) costs linear time, not quadratic.
 */
function blocks(html: string, tag: string): { open: string; inner: string; start: number; end: number }[] {
  const lower = html.toLowerCase();
  const out: { open: string; inner: string; start: number; end: number }[] = [];
  let i = 0;
  while ((i = lower.indexOf(`<${tag}`, i)) !== -1) {
    const after = lower[i + tag.length + 1];
    if (after && !/[\s>/]/.test(after)) {
      i += tag.length + 1;
      continue;
    }
    const openEnd = lower.indexOf(">", i);
    if (openEnd === -1) break;
    const close = lower.indexOf(`</${tag}`, openEnd);
    if (close === -1) break; // unclosed: stop rather than rescan the rest of the page
    out.push({ open: html.slice(i, openEnd + 1), inner: html.slice(openEnd + 1, close), start: i, end: lower.indexOf(">", close) + 1 || close });
    i = close;
  }
  return out;
}

function strip(html: string, tags: string[]) {
  let out = html;
  for (const tag of tags) {
    const found = blocks(out, tag);
    if (!found.length) continue;
    let res = "";
    let pos = 0;
    for (const b of found) {
      res += out.slice(pos, b.start) + " ";
      pos = b.end;
    }
    out = res + out.slice(pos);
  }
  return out;
}

export function checkPage(url: string, rawHtml: string): PageCheck & { links: string[] } {
  const html = rawHtml.slice(0, MAX_HTML);
  const scripts = blocks(html, "script");
  const schemaTypes = new Set<string>();
  for (const b of scripts.filter((x) => /application\/ld\+json/i.test(x.open))) {
    for (const t of b.inner.slice(0, 50_000).matchAll(/"@type"\s*:\s*(\[[^\]]{0,500}\]|"[^"]{1,100}")/g)) for (const v of t[1].matchAll(/"([^"]{1,100})"/g)) schemaTypes.add(v[1]);
  }
  const body = strip(html, ["script", "style", "noscript", "template"]);
  const imgs = [...body.matchAll(/<img\b[^>]{0,2000}>/gi)].map((m) => m[0]);
  const links: string[] = [];
  for (const m of body.matchAll(/<a\b[^>]{0,2000}?href=["']([^"'#]{1,2000})["']/gi)) {
    try {
      links.push(new URL(m[1], url).toString());
    } catch {
      /* ignore malformed links */
    }
  }
  const canonicalTag = [...html.matchAll(/<link\b[^>]{0,2000}>/gi)].map((m) => m[0]).find((t) => attr(t, "rel")?.toLowerCase() === "canonical");
  const title = blocks(html, "title")[0]?.inner ?? "";
  return {
    url,
    title: text(title),
    description: attr(metaTag(html, "name", "description") ?? "", "content") ?? "",
    h1: blocks(body, "h1").map((b) => text(b.inner)).filter(Boolean),
    canonical: canonicalTag ? attr(canonicalTag, "href") : null,
    robotsMeta: attr(metaTag(html, "name", "robots") ?? "", "content"),
    lang: attr(html.match(/<html\b[^>]{0,2000}>/i)?.[0] ?? "", "lang"),
    viewport: Boolean(metaTag(html, "name", "viewport")),
    openGraph: Boolean(metaTag(html, "property", "og:title")),
    schemaTypes: [...schemaTypes],
    words: text(body).split(" ").filter(Boolean).length,
    images: imgs.length,
    imagesWithoutAlt: imgs.filter((i) => !/\balt\s*=\s*["'][^"']+["']/i.test(i)).length,
    links,
  };
}

/**
 * robots.txt as it applies to us: the group for our user agent if there is one,
 * otherwise the "*" group. Consecutive User-agent lines share one group.
 */
export function parseRobots(txt: string, agent = "salesscoutbot") {
  type Group = { agents: string[]; disallow: string[]; allow: string[] };
  const groups: Group[] = [];
  const sitemaps: string[] = [];
  let cur: Group | null = null;
  let lastWasAgent = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const k = line.slice(0, idx).trim().toLowerCase();
    const v = line.slice(idx + 1).trim();
    if (k === "user-agent") {
      if (!cur || !lastWasAgent) groups.push((cur = { agents: [], disallow: [], allow: [] }));
      cur.agents.push(v.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (k === "sitemap" && v) sitemaps.push(v);
    else if (cur && k === "disallow" && v) cur.disallow.push(v);
    else if (cur && k === "allow" && v) cur.allow.push(v);
  }
  const mine = groups.filter((g) => g.agents.some((a) => a !== "*" && agent.includes(a)));
  const applies = mine.length ? mine : groups.filter((g) => g.agents.includes("*"));
  const disallow = applies.flatMap((g) => g.disallow);
  const allow = applies.flatMap((g) => g.allow);
  /** Longest matching rule wins, as crawlers do; "*" and "$" wildcards are supported. */
  const allowed = (path: string) => {
    const match = (rule: string) => new RegExp("^" + rule.replace(/[.+?^{}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$")).test(path);
    const d = disallow.filter(match).sort((a, b) => b.length - a.length)[0];
    const a = allow.filter(match).sort((x, y) => y.length - x.length)[0];
    return !d || (a !== undefined && a.length >= d.length);
  };
  return { blocksAll: !allowed("/"), sitemaps, allowed };
}

/** Turns raw checks into plain findings. Every finding names the page it was seen on. */
export function observe(a: Omit<SiteAudit, "observations">): SiteAudit["observations"] {
  const out: SiteAudit["observations"] = [];
  const add = (finding: string, area: string, url: string | null) => out.push({ finding, area, url });
  if (!a.https) add("The site isn't served over HTTPS.", "Technical", a.home);
  if (!a.robotsTxt.found) add("No robots.txt file was found.", "Crawling", null);
  if (a.robotsTxt.blocksAll) add("robots.txt asks all crawlers not to crawl any page.", "Crawling", null);
  if (!a.sitemap.found) add("No XML sitemap was found at the usual address or in robots.txt.", "Crawling", a.sitemap.url);
  else if (a.sitemap.urls !== null) add(`The sitemap lists ${a.sitemap.urls} address${a.sitemap.urls === 1 ? "" : "es"}.`, "Crawling", a.sitemap.url);
  if (!a.llmsTxt) add("No llms.txt file (an emerging, optional summary for AI assistants) was found.", "AI answers", null);
  for (const p of a.pages) {
    if (!p.title) add("The page has no title.", "Page basics", p.url);
    else if (p.title.length > 65) add(`The title is ${p.title.length} characters; search results usually cut off around 60.`, "Page basics", p.url);
    if (!p.description) add("The page has no meta description, so search engines choose their own snippet.", "Page basics", p.url);
    if (p.h1.length === 0) add("The page has no main (H1) heading.", "Structure", p.url);
    if (p.h1.length > 1) add(`The page has ${p.h1.length} main (H1) headings.`, "Structure", p.url);
    if (p.robotsMeta && /noindex/i.test(p.robotsMeta)) add(`The page asks search engines not to index it (robots: ${p.robotsMeta}).`, "Indexing signals", p.url);
    if (!p.canonical) add("The page doesn't declare a canonical address.", "Indexing signals", p.url);
    if (!p.lang) add("The page doesn't declare its language.", "Technical", p.url);
    if (!p.viewport) add("The page has no mobile viewport setting.", "Technical", p.url);
    if (!p.schemaTypes.length) add("No structured data (schema.org) was found on the page.", "Structured data", p.url);
    else add(`Structured data found: ${p.schemaTypes.join(", ")}.`, "Structured data", p.url);
    if (!p.openGraph) add("No Open Graph tags, so links shared on social media may show no preview.", "Sharing", p.url);
    if (p.imagesWithoutAlt) add(`${p.imagesWithoutAlt} of ${p.images} images have no alt text.`, "Accessibility", p.url);
    if (p.words < 150) add(`Only about ${p.words} words of readable text, which gives search engines and AI assistants little to work with.`, "Content", p.url);
  }
  return out;
}

/** A real text file, not a site's HTML "not found" or login page served with status 200. */
async function fetchTextFile(url: string): Promise<string | null> {
  const { body, headers } = await fetchPublic(url, "text");
  if (/html/i.test(headers.get("content-type") ?? "") || /^\s*<(!doctype|html)/i.test(body)) return null;
  return body;
}

const PAGE_HINT = /(about|service|solution|product|what-we-do|contact|pricing|industr|work|case|project)/i;

export async function auditSite(website: string, maxPages = 5): Promise<SiteAudit> {
  const home = normaliseUrl(website);
  if (!home) throw new Error("This opportunity has no usable website address.");
  const origin = new URL(home).origin;
  const failures: SiteAudit["failures"] = [];

  let robotsTxt = { found: false, blocksAll: false, sitemaps: [] as string[] };
  let allowed = (_path: string) => true;
  try {
    const txt = await fetchTextFile(`${origin}/robots.txt`);
    if (txt !== null) {
      const r = parseRobots(txt);
      robotsTxt = { found: true, blocksAll: r.blocksAll, sitemaps: r.sitemaps };
      allowed = r.allowed;
    }
  } catch (e) {
    const reason = e instanceof Error ? e.message : "Not readable";
    failures.push({ url: `${origin}/robots.txt`, reason });
    // A server error on robots.txt means "don't crawl" by convention; respect it.
    if (/responded with 5\d\d/.test(reason)) robotsTxt = { found: false, blocksAll: true, sitemaps: [] };
  }

  const sitemapUrl = robotsTxt.sitemaps[0] ?? `${origin}/sitemap.xml`;
  let sitemap: SiteAudit["sitemap"] = { url: sitemapUrl, found: false, urls: null };
  try {
    const body = (await fetchPublic(sitemapUrl, "text")).body;
    if (/<(urlset|sitemapindex)\b/i.test(body)) sitemap = { url: sitemapUrl, found: true, urls: (body.match(/<loc>/gi) ?? []).length };
  } catch {
    /* recorded as not found */
  }

  let llmsTxt = false;
  try {
    llmsTxt = Boolean((await fetchTextFile(`${origin}/llms.txt`))?.trim());
  } catch {
    /* not present */
  }

  const pages: PageCheck[] = [];
  if (!robotsTxt.blocksAll) {
    const queue = [home];
    const seen = new Set<string>();
    while (queue.length && pages.length < maxPages) {
      const u = queue.shift()!;
      const key = u.replace(/[?#].*$/, "").replace(/\/+$/, "");
      if (seen.has(key)) continue;
      seen.add(key);
      if (!allowed(new URL(u).pathname)) {
        failures.push({ url: u, reason: "robots.txt asks crawlers not to read this page, so we didn't." });
        continue;
      }
      try {
        const { url, body } = await fetchPublic(u);
        const { links, ...check } = checkPage(url, body);
        pages.push(check);
        if (pages.length === 1) {
          const host = new URL(url).hostname.replace(/^www\./, "");
          const internal = links.filter((l) => {
            try {
              const h = new URL(l).hostname.replace(/^www\./, "");
              return h === host && PAGE_HINT.test(new URL(l).pathname);
            } catch {
              return false;
            }
          });
          queue.push(...new Set(internal));
        }
      } catch (e) {
        failures.push({ url: u, reason: e instanceof Error ? e.message : "Couldn't read the page" });
      }
    }
  }

  const base = { home, https: home.startsWith("https://"), robotsTxt, sitemap, llmsTxt, pages, failures, checkedAt: new Date().toISOString() };
  return { ...base, observations: observe(base) };
}
