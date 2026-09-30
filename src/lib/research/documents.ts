import "server-only";
import path from "node:path";

export const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".xlsx", ".csv", ".pptx", ".txt", ".md"] as const;
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const MAX_CHARS = 60_000;

export function isAllowedFile(name: string) {
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(path.extname(name).toLowerCase());
}

/**
 * Extracts readable text from an uploaded document. Returns null (never
 * invented text) when the format can't be read.
 */
export async function extractText(buffer: Buffer, fileName: string): Promise<string | null> {
  const ext = path.extname(fileName).toLowerCase();
  let text: string | null = null;
  if (ext === ".txt" || ext === ".md" || ext === ".csv") {
    text = buffer.toString("utf8");
  } else if (ext === ".pdf") {
    const { extractText: pdfText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text: pages } = await pdfText(pdf, { mergePages: true });
    text = Array.isArray(pages) ? pages.join("\n") : pages;
  } else if (ext === ".docx") {
    const mammoth = await import("mammoth");
    text = (await mammoth.extractRawText({ buffer })).value;
  } else if (ext === ".xlsx") {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    const lines: string[] = [];
    wb.eachSheet((sheet) => {
      lines.push(`# ${sheet.name}`);
      sheet.eachRow((row) => {
        const values = (row.values as unknown[]).slice(1).map((v) => (v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v)));
        lines.push(values.join(" | "));
      });
    });
    text = lines.join("\n");
  } else if (ext === ".pptx") {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buffer);
    const slides = Object.keys(zip.files)
      .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
      .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]));
    const parts: string[] = [];
    for (const [i, f] of slides.entries()) {
      const xml = await zip.files[f].async("string");
      const runs = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]);
      parts.push(`Slide ${i + 1}: ${runs.join(" ")}`);
    }
    text = parts.join("\n");
  }
  if (text == null) return null;
  return text.replace(/\u0000/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, MAX_CHARS);
}
