import "server-only";
import { headers } from "next/headers";

/**
 * The visitor's IP for rate limiting. X-Forwarded-For can be pre-filled by the
 * client; the entry our hosting proxy adds is the last one, so that's the one we trust.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const chain = h.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  return chain.at(-1) || h.get("x-real-ip") || "local";
}
