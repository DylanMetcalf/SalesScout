// Prints a prospect's sales brief the way the browser does and counts how many copies land in the PDF.
// Usage: node scripts/dev/print-check.mjs [old|new]   (needs a running server and the demo login)
import { chromium } from "playwright";
import { extractText, getDocumentProxy } from "unpdf";
const BASE = process.env.BASE ?? "http://localhost:3000";
const mode = process.argv[2] ?? "new";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
await p.goto(BASE + "/login");
await p.getByLabel("Work email").fill("demo@salesscout.app");
await p.getByLabel("Password").fill("salesscout-demo");
await p.getByRole("button", { name: "Sign in" }).click();
await p.waitForURL(/\/home/);
await p.goto(BASE + "/prospects");
const href = await p.locator('a[href^="/prospects/pr_"]').first().getAttribute("href");
const id = href.split("/").pop();
if (mode === "old") {
  await p.goto(BASE + href);
  await p.getByRole("button", { name: /brief/i }).first().click();
  await p.getByText("Suggested next step").waitFor();
} else {
  await p.goto(`${BASE}/reports/brief/${id}`);
}
await p.emulateMedia({ media: "print" });
const pdf = await p.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
const doc = await getDocumentProxy(new Uint8Array(pdf));
const { text, totalPages } = await extractText(doc, { mergePages: true });
const marker = mode === "old" ? "Suggested next step" : "Prepared with Sales Scout";
console.log(`${mode}: ${totalPages} page(s); "${marker}" appears ${text.toLowerCase().split(marker.toLowerCase()).length - 1}x`);
if (process.env.OUT) await p.screenshot({ path: `${process.env.OUT}/brief_${mode}.png`, fullPage: true });
await b.close();
