"use server";

import { revalidatePath } from "next/cache";
import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { newId } from "@/lib/ids";
import { actionTenant, inCompany, tenantCols } from "@/lib/tenant";
import { normaliseUrl } from "@/lib/security/url";
import { extractText, isAllowedFile, MAX_UPLOAD_BYTES } from "@/lib/research/documents";
import { detectPlatform, PLATFORMS } from "@/components/ui/platform-icon";
import { rateLimit } from "@/lib/security/rate-limit";
import { audit } from "@/lib/audit";
import { attempt } from "./result";

export async function setWebsiteAction(url: string) {
  return attempt(async () => {
    const tenant = await actionTenant();
    const website = normaliseUrl(url);
    if (!website) throw new Error("That doesn't look like a web address.");
    db.transaction((tx) => {
      tx.update(t.companies).set({ website, updatedAt: new Date() }).where(eq(t.companies.id, tenant.company.id)).run();
      tx.delete(t.sources).where(inCompany(t.sources, tenant, eq(t.sources.kind, "website"))).run();
      tx.insert(t.sources).values({ id: newId("src"), ...tenantCols(tenant), kind: "website", label: new URL(website).hostname, url: website, status: "pending" }).run();
    });
    revalidatePath("/", "layout");
  });
}

const PAGE_TYPES: Record<string, string> = {
  about: "About page", services: "Services", products: "Products", case_studies: "Case studies",
  portfolio: "Portfolio", pricing: "Pricing", other: "Other page",
};

export async function addPageAction(input: { url: string; subtype: string }) {
  return attempt(async () => {
    const tenant = await actionTenant();
    const url = normaliseUrl(input.url);
    if (!url) throw new Error("That doesn't look like a web address.");
    const subtype = PAGE_TYPES[input.subtype] ? input.subtype : "other";
    const id = newId("src");
    db.insert(t.sources).values({ id, ...tenantCols(tenant), kind: "page", subtype, label: PAGE_TYPES[subtype], url, status: "pending" }).run();
    revalidatePath("/", "layout");
    return id;
  });
}

export async function addSocialAction(input: { url: string; label?: string }) {
  return attempt(async () => {
    const tenant = await actionTenant();
    const url = normaliseUrl(input.url);
    if (!url) throw new Error("That doesn't look like a profile address.");
    const platform = detectPlatform(url);
    const id = newId("src");
    db.insert(t.sources)
      .values({
        id,
        ...tenantCols(tenant),
        kind: "social",
        subtype: platform,
        label: input.label?.trim() || `${PLATFORMS[platform].label} profile`,
        url,
        // We only read platforms through authorised connections, never by scraping.
        status: "requires_permission",
        statusDetail: "Saved. Reading posts needs an authorised connection.",
      })
      .run();
    revalidatePath("/", "layout");
    return id;
  });
}

export async function removeSourceAction(id: string) {
  return attempt(async () => {
    const tenant = await actionTenant();
    const src = db.select().from(t.sources).where(inCompany(t.sources, tenant, eq(t.sources.id, id))).get();
    if (!src) return;
    const doc = db.select().from(t.documents).where(inCompany(t.documents, tenant, eq(t.documents.sourceId, id))).get();
    if (doc) await fs.rm(doc.storagePath, { force: true });
    db.delete(t.sources).where(eq(t.sources.id, src.id)).run();
    if (src.kind === "website") db.update(t.companies).set({ website: null }).where(eq(t.companies.id, tenant.company.id)).run();
    audit(tenant, { entityType: "source", entityId: id, action: "removed", source: "user", summary: `Removed source ${src.label}` });
    revalidatePath("/", "layout");
  });
}

/** Uploads documents, stores them per tenant, and extracts their text right away. */
export async function uploadDocumentsAction(form: FormData) {
  return attempt(async () => {
    const tenant = await actionTenant();
    if (!rateLimit(`upload:${tenant.user.id}`, 60, 3_600_000)) throw new Error("Too many uploads. Try again later.");
    const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (!files.length) throw new Error("Choose at least one file.");
    const dir = path.join(process.cwd(), "data", "uploads", tenant.workspace.id, tenant.company.id);
    await fs.mkdir(dir, { recursive: true });
    const results: { name: string; ok: boolean; detail: string }[] = [];
    for (const file of files) {
      const name = path.basename(file.name).replace(/[^\w.\- ()]/g, "_").slice(0, 120);
      if (!isAllowedFile(name)) {
        results.push({ name, ok: false, detail: "This file type isn't supported" });
        continue;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        results.push({ name, ok: false, detail: "Larger than 15 MB" });
        continue;
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const sourceId = newId("src");
      const storagePath = path.join(dir, `${sourceId}-${name}`);
      await fs.writeFile(storagePath, buffer, { mode: 0o600 });
      let text: string | null = null;
      let detail: string;
      try {
        text = await extractText(buffer, name);
        detail = text ? `${Math.round(text.length / 1000) || 1}k characters read` : "Stored, but we couldn't read text from it";
      } catch {
        detail = "Stored, but we couldn't read this file";
      }
      db.transaction((tx) => {
        tx.insert(t.sources)
          .values({ id: sourceId, ...tenantCols(tenant), kind: "document", label: name, status: text ? "analysed" : "failed", statusDetail: detail, extractedText: text, lastAnalysedAt: text ? new Date() : null })
          .run();
        tx.insert(t.documents).values({ id: newId("doc"), ...tenantCols(tenant), sourceId, fileName: name, mimeType: file.type || "application/octet-stream", sizeBytes: file.size, storagePath }).run();
      });
      results.push({ name, ok: !!text, detail });
    }
    revalidatePath("/", "layout");
    return results;
  });
}
