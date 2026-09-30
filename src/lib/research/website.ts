import "server-only";
import { assertPublicUrl, normaliseUrl } from "@/lib/security/url";

export type Page = {
  url: string;
  title: string;
  description: string;
  headings: string[];
  text: string;
  links: { href: string; text: string }[];
};

const MAX_BYTES = 1_500_000;
const UA = "SalesScoutBot/1.0 (+company profile analysis requested by the site owner's representative)";

function decodeEntities(s: string) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&ndash;|&mdash;/g, "–")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

const clean = (s: string) => decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

export function parseHtml(html: string, baseUrl: string): Omit<Page, "url"> {
  const title = clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const description = clean(
    html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] ??
      html.match(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']*)["']/i)?.[1] ??
      "",
  );
  const body = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|iframe|template)[\s\S]*?<\/\1>/gi, " ");
  const headings = [...body.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)]
    .map((m) => clean(m[1]))
    .filter((h) => h.length > 2 && h.length < 140);
  const links: Page["links"] = [];
  for (const m of body.matchAll(/<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      const href = new URL(m[1], baseUrl).toString();
      links.push({ href, text: clean(m[2]).slice(0, 80) });
    } catch {
      /* ignore malformed links */
    }
  }
  const text = clean(body.replace(/<(br|\/p|\/div|\/li|\/h\d)[^>]*>/gi, "\n")).slice(0, 20_000);
  return { title, description, headings: [...new Set(headings)].slice(0, 40), text, links };
}

/** Fetches one public page, re-checking every redirect hop against the SSRF guard. */
export async function fetchPage(input: string): Promise<Page> {
  let url = normaliseUrl(input);
  if (!url) throw new Error("That doesn't look like a web address.");
  for (let hop = 0; hop < 5; hop++) {
    await assertPublicUrl(url);
    const res: Response = await fetch(url, {
      redirect: "manual",
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(12_000),
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location")!, url).toString();
      continue;
    }
    if (!res.ok) throw new Error(`The site responded with ${res.status}.`);
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("html")) throw new Error("That address isn't a web page.");
    const reader = res.body?.getReader();
    let received = 0;
    const chunks: Uint8Array[] = [];
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      chunks.push(value);
      if (received > MAX_BYTES) {
        await reader.cancel();
        break;
      }
    }
    const html = Buffer.concat(chunks).toString("utf8");
    return { url, ...parseHtml(html, url) };
  }
  throw new Error("Too many redirects.");
}

const INTERESTING = /(about|who-we-are|company|service|solution|product|what-we-do|industr|sector|case|portfolio|project|client|customer|pricing|capabilit|expertise)/i;

/**
 * Reads a company website: the home page, any pages the user named, and a
 * handful of the most informative internal pages. Returns only pages that
 * were actually read, plus the ones that failed and why.
 */
export async function readWebsite(home: string, extraPages: string[] = [], limit = 7) {
  const pages: Page[] = [];
  const failures: { url: string; reason: string }[] = [];
  const seen = new Set<string>();
  const key = (u: string) => u.replace(/\/+$/, "").replace(/^https?:\/\/(www\.)?/, "");

  const tryRead = async (u: string) => {
    if (seen.has(key(u)) || pages.length >= limit) return;
    seen.add(key(u));
    try {
      pages.push(await fetchPage(u));
    } catch (e) {
      failures.push({ url: u, reason: e instanceof Error ? e.message : "Couldn't read the page" });
    }
  };

  await tryRead(home);
  for (const p of extraPages) await tryRead(p);

  const homeHost = pages[0] ? new URL(pages[0].url).hostname.replace(/^www\./, "") : null;
  if (homeHost) {
    const candidates = pages[0].links
      .filter((l) => {
        try {
          const u = new URL(l.href);
          return u.hostname.replace(/^www\./, "") === homeHost && INTERESTING.test(u.pathname + " " + l.text) && !/\.(pdf|jpg|png|zip)$/i.test(u.pathname);
        } catch {
          return false;
        }
      })
      .map((l) => l.href.split("#")[0]);
    for (const c of [...new Set(candidates)].slice(0, 10)) await tryRead(c);
  }
  return { pages, failures };
}
