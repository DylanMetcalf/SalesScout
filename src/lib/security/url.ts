import { lookup } from "node:dns/promises";
import net from "node:net";

/** Normalise user-entered URLs ("acme.com" → "https://acme.com/"). Returns null if invalid. */
export function normaliseUrl(input: string | null | undefined): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (!url.hostname.includes(".")) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

/** Registrable-ish domain for duplicate detection: strips protocol, www and path. */
export function domainOf(input: string | null | undefined): string | null {
  const url = normaliseUrl(input);
  if (!url) return null;
  return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  return v6 === "::1" || v6 === "::" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80") ||
    (v6.startsWith("::ffff:") && isPrivateIp(v6.slice(7)));
}

/** Guards server-side fetches against SSRF: public http(s) hosts only. */
export async function assertPublicUrl(url: string): Promise<void> {
  const u = new URL(url);
  if (!["http:", "https:"].includes(u.protocol)) throw new Error("Only web addresses can be read.");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("That address isn't publicly reachable.");
  }
  const addrs = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (addrs.some((a) => isPrivateIp(a.address))) throw new Error("That address isn't publicly reachable.");
}
