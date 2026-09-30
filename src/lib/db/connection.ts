import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

export type DB = BetterSQLite3Database<typeof schema>;

const globalForDb = globalThis as unknown as { __salesScoutDb?: DB };

/** Opens (and migrates) the SQLite database once per process. */
export function dataDir(): string {
  return path.dirname(process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "salesscout.db"));
}

export function getDb(): DB {
  if (globalForDb.__salesScoutDb) return globalForDb.__salesScoutDb;
  const file = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "salesscout.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  // Jobs run inside this process, so any still "running" were interrupted by a restart.
  const now = Date.now();
  sqlite.prepare(`UPDATE jobs SET status = 'failed', error = 'Interrupted because the server restarted. Please try again.', updated_at = ? WHERE status IN ('queued', 'running')`).run(now);
  sqlite.prepare(`UPDATE search_runs SET status = 'failed', error = 'Interrupted because the server restarted. Please try again.', completed_at = ? WHERE status = 'running'`).run(now);
  sqlite.prepare(`UPDATE companies SET brain_status = CASE WHEN brain_analysed_at IS NULL THEN 'empty' ELSE 'review' END WHERE brain_status = 'analysing'`).run();
  globalForDb.__salesScoutDb = db;
  return db;
}
