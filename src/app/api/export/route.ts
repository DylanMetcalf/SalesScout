import { NextResponse, type NextRequest } from "next/server";
import { getTenant, type CompanyTenant } from "@/lib/tenant";
import { exportRows, logExport, toCsv, toXlsx, type ExportFilter } from "@/lib/services/exports";
import { CRM_STATUSES, type CrmStatus } from "@/lib/db/schema";
import { rateLimit } from "@/lib/security/rate-limit";

export async function GET(req: NextRequest) {
  const tenant = await getTenant();
  if (!tenant?.company) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!rateLimit(`export:${tenant.user.id}`, 60, 3_600_000)) return NextResponse.json({ error: "Too many exports" }, { status: 429 });
  const sp = req.nextUrl.searchParams;
  const format = sp.get("format") === "xlsx" ? "xlsx" : "csv";
  const scope = (["crm", "all", "run"].includes(sp.get("scope") ?? "") ? sp.get("scope") : "crm") as ExportFilter["scope"];
  const statuses = (sp.get("status")?.split(",") ?? []).filter((s): s is CrmStatus => (CRM_STATUSES as readonly string[]).includes(s));
  const filter: ExportFilter = { scope, runId: sp.get("run") ?? undefined, statuses, ids: sp.get("ids")?.split(",").filter(Boolean) };
  const ct = tenant as CompanyTenant;
  const rows = exportRows(ct, filter).map((r) => r.row);
  logExport(ct, format, rows.length, filter);
  const base = `${ct.company.name.replace(/[^\w]+/g, "-").toLowerCase()}-prospects-${new Date().toISOString().slice(0, 10)}`;
  if (format === "xlsx") {
    const buf = await toXlsx(rows, ct.company.name);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="${base}.xlsx"`,
        "cache-control": "no-store",
      },
    });
  }
  return new NextResponse(toCsv(rows), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${base}.csv"`, "cache-control": "no-store" },
  });
}
