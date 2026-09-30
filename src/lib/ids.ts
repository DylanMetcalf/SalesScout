import { randomBytes } from "node:crypto";

/** Short, URL-safe, sortable-enough identifiers: `${prefix}_${time}${random}`. */
export function newId(prefix: string): string {
  const time = Date.now().toString(36);
  const rand = randomBytes(8).toString("base64url").replace(/[-_]/g, "").slice(0, 10);
  return `${prefix}_${time}${rand}`;
}
