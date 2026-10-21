import "server-only";
import fs from "node:fs";
import { dataDir } from "@/lib/db/connection";

/**
 * Is the database on its own disk (Render's persistent disk), or on the
 * container's throwaway filesystem? On the latter, every deploy wipes all data.
 */
export function storage(): { dir: string; persistent: boolean | null } {
  const dir = dataDir();
  try {
    const own = fs.statSync(dir).dev;
    const root = fs.statSync("/").dev;
    // Locally (no DATABASE_PATH) there's no separate disk to expect.
    return { dir, persistent: process.env.DATABASE_PATH ? own !== root : null };
  } catch {
    return { dir, persistent: false };
  }
}

export function processInfo() {
  return {
    uptimeSeconds: Math.round(process.uptime()),
    memoryMb: Math.round(process.memoryUsage().rss / 1_048_576),
    commit: process.env.RENDER_GIT_COMMIT?.slice(0, 7) ?? null,
  };
}
