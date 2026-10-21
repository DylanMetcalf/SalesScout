import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/connection";
import { processInfo, storage } from "@/lib/system";

export const dynamic = "force-dynamic";

/** Used by Render and the uptime monitor. Fails (503) if the database can't be read. */
export function GET() {
  const { uptimeSeconds, commit } = processInfo();
  try {
    getDb().get(sql`select 1`);
    return NextResponse.json({ ok: true, db: true, uptimeSeconds, commit, persistentDisk: storage().persistent });
  } catch (err) {
    console.error("[health] database check failed", err);
    return NextResponse.json({ ok: false, db: false, uptimeSeconds, commit }, { status: 503 });
  }
}
