import "server-only";
import { and, desc, eq, inArray, ne, type SQL } from "drizzle-orm";
import { db, t } from "@/lib/db";
import type { CrmStatus } from "@/lib/db/schema";
import { newId } from "@/lib/ids";
import { FIT_LABELS } from "@/components/ui/fit";
import { STATUS_META } from "@/lib/status";
import { inCompany, tenantCols, type CompanyTenant } from "@/lib/tenant";

export type ExportFilter = { scope: "crm" | "all" | "run"; runId?: string; statuses?: CrmStatus[]; ids?: string[] };

export const EXPORT_COLUMNS = [
  "Company", "Website", "Industry", "Location", "Description", "Contact", "Role", "Email", "Phone", "Professional profile",
  "Company fit", "Fit details", "Why relevant", "Potential opportunity", "Suggested approach", "Sources", "Status", "Next follow-up", "Notes",
] as const;

export function exportRows(tenant: CompanyTenant, filter: ExportFilter) {
  const where: (SQL | undefined)[] = [];
  if (filter.ids?.length) where.push(inArray(t.prospects.id, filter.ids));
  else if (filter.scope === "crm") where.push(eq(t.prospects.inCrm, true), ne(t.prospects.status, "rejected"));
  else if (filter.scope === "run" && filter.runId) where.push(eq(t.prospects.searchRunId, filter.runId), ne(t.prospects.status, "rejected"));
  else where.push(ne(t.prospects.status, "rejected"));
  if (filter.statuses?.length) where.push(inArray(t.prospects.status, filter.statuses));

  const prospects = db.select().from(t.prospects).where(inCompany(t.prospects, tenant, ...where)).orderBy(desc(t.prospects.updatedAt)).all();
  const ids = prospects.map((p) => p.id);
  const contacts = ids.length ? db.select().from(t.contacts).where(inCompany(t.contacts, tenant, inArray(t.contacts.prospectId, ids))).all() : [];
  const evidence = ids.length ? db.select().from(t.evidence).where(inCompany(t.evidence, tenant, inArray(t.evidence.prospectId, ids))).all() : [];
  const notes = ids.length ? db.select().from(t.activities).where(inCompany(t.activities, tenant, inArray(t.activities.prospectId, ids), eq(t.activities.type, "note"))).all() : [];

  return prospects.map((p) => {
    const people = contacts.filter((c) => c.prospectId === p.id);
    const primary = people.find((c) => c.name) ?? people[0];
    const fitSummary = p.fit
      ? (Object.keys(FIT_LABELS) as (keyof typeof FIT_LABELS)[]).map((k) => `${FIT_LABELS[k]}: ${p.fit![k]?.level ?? "unknown"}`).join("; ")
      : "";
    // Missing values stay empty. Nothing is filled in or guessed.
    return {
      prospect: p,
      people,
      evidence: evidence.filter((e) => e.prospectId === p.id),
      notes: notes.filter((n) => n.prospectId === p.id),
      row: {
        Company: p.name,
        Website: p.website ?? "",
        Industry: p.industry ?? "",
        Location: p.location ?? "",
        Description: p.whatTheyDo ?? "",
        Contact: primary?.name ?? "",
        Role: primary?.role ?? "",
        Email: primary?.email ?? "",
        Phone: primary?.phone ?? "",
        "Professional profile": primary?.profileUrl ?? "",
        "Company fit": p.fit?.company.level ?? "",
        "Fit details": fitSummary,
        "Why relevant": p.whyRelevant ?? "",
        "Potential opportunity": p.potentialOpportunity ?? "",
        "Suggested approach": p.suggestedNextStep ?? "",
        Sources: evidence.filter((e) => e.prospectId === p.id && e.url).map((e) => e.url).join(" "),
        Status: STATUS_META[p.status].label,
        "Next follow-up": p.nextFollowUpAt ? p.nextFollowUpAt.toISOString().slice(0, 10) : "",
        Notes: notes.filter((n) => n.prospectId === p.id).map((n) => n.body).join(" | "),
      } satisfies Record<(typeof EXPORT_COLUMNS)[number], string>,
    };
  });
}

/** Neutralises spreadsheet formula injection in exported cells. */
function safeCell(v: string) {
  return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
}

export function toCsv(rows: Record<string, string>[]) {
  const esc = (v: string) => {
    const s = safeCell(v ?? "");
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + [EXPORT_COLUMNS.join(","), ...rows.map((r) => EXPORT_COLUMNS.map((c) => esc(r[c])).join(","))].join("\r\n");
}

export async function toXlsx(rows: Record<string, string>[], companyName: string) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Sales Scout";
  const ws = wb.addWorksheet("Prospects", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = EXPORT_COLUMNS.map((c) => ({
    header: c,
    key: c,
    width: ["Description", "Why relevant", "Potential opportunity", "Suggested approach", "Fit details", "Notes", "Sources"].includes(c) ? 48 : 20,
  }));
  for (const r of rows) ws.addRow(Object.fromEntries(EXPORT_COLUMNS.map((c) => [c, safeCell(r[c] ?? "")])));
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1C6A56" } };
  header.alignment = { vertical: "middle" };
  header.height = 22;
  ws.eachRow((row, n) => {
    if (n > 1) row.alignment = { vertical: "top", wrapText: true };
  });
  ws.autoFilter = { from: "A1", to: { row: 1, column: EXPORT_COLUMNS.length } };
  const about = wb.addWorksheet("About");
  about.addRow([`Prospect export for ${companyName}`]).font = { bold: true, size: 14 };
  about.addRow([`Exported ${new Date().toLocaleString("en-GB")} from Sales Scout.`]);
  about.addRow(["Empty cells mean the information wasn't found. Sales Scout never fills in missing details."]);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export function logExport(tenant: CompanyTenant, format: "csv" | "xlsx" | "report", count: number, filter: ExportFilter) {
  db.insert(t.exportsLog).values({ id: newId("exp"), ...tenantCols(tenant), userId: tenant.user.id, format, rowCount: count, filters: filter }).run();
}

export function runTitle(tenant: CompanyTenant, runId: string) {
  return db.select({ title: t.searchRuns.title }).from(t.searchRuns).where(and(inCompany(t.searchRuns, tenant), eq(t.searchRuns.id, runId))).get()?.title;
}
