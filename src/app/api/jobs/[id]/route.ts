import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { getTenant } from "@/lib/tenant";

/** Progress for a background job, only visible within the workspace that owns it. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenant = await getTenant();
  if (!tenant) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  const job = db
    .select({ id: t.jobs.id, type: t.jobs.type, status: t.jobs.status, steps: t.jobs.steps, result: t.jobs.result, error: t.jobs.error })
    .from(t.jobs)
    .where(and(eq(t.jobs.id, id), eq(t.jobs.workspaceId, tenant.workspace.id), eq(t.jobs.accountId, tenant.account.id)))
    .get();
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(job, { headers: { "cache-control": "no-store" } });
}
