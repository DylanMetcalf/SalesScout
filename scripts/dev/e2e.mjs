// End-to-end walkthrough of the first-run experience against a running dev server.
import { chromium } from "playwright";
const BASE = process.env.BASE || "http://localhost:3000";
const OUT = process.env.OUT;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const errors = [];
const log = (...a) => console.log("✓", ...a);
async function newUser(label) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, acceptDownloads: true });
  const page = await ctx.newPage();
  page.setDefaultTimeout(90000);
  page.on("console", (m) => m.type() === "error" && errors.push(`${label}: ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`${label} PAGEERROR ${e.message}`));
  page.on("response", (r) => r.status() === 404 && errors.push(`${label} 404 ${r.url()}`));
  return { ctx, page };
}
const shot = (page, n) => OUT && page.screenshot({ path: `${OUT}/e2e_${n}.png`, fullPage: false });
const email = `test${Date.now()}@example.com`;
const { page } = await newUser("A");

await page.goto(`${BASE}/signup`);
await page.getByLabel("Your name").fill("Dylan Test");
await page.getByLabel("Work email").fill(email);
await page.getByLabel("Password").fill("password123");
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL(/onboarding$/);
log("signup → onboarding");
await page.getByLabel("What should we call your workspace?").fill("Mea Creo");
await page.getByRole("button", { name: "Continue" }).click();
await page.waitForURL(/onboarding\/company/);
await page.getByLabel("Company name").fill("Mea Creo");
await page.getByLabel(/What does your business do/).fill("We design and build websites and brand identities for engineering and industrial firms in South Africa.");
await page.getByRole("button", { name: "Continue" }).click();
await page.waitForURL(/step=website/);
log("company created");
await page.getByLabel("Company website").fill("meacreo.example");
await page.getByRole("button", { name: "Save" }).click();
await page.getByText("Website saved", { exact: true }).first().waitFor();
await page.getByLabel("Page address").fill("meacreo.example/services");
await page.getByRole("button", { name: "Add page" }).click();
await page.getByText("Page added", { exact: true }).first().waitFor();
await shot(page, "01_website");
log("website + page added");
await page.getByRole("link", { name: "Continue" }).first().click();
await page.waitForURL(/step=profiles/);
await page.getByLabel("Profile address").fill("linkedin.com/company/meacreo");
await page.getByRole("button", { name: "Add", exact: true }).click();
await page.getByText("Requires permission", { exact: true }).first().waitFor();
log("social profile saved as requires-permission");
await page.getByRole("link", { name: "Continue" }).first().click();
await page.waitForURL(/step=documents/);
await page.setInputFiles('input[type=file]', { name: "capabilities.txt", mimeType: "text/plain", buffer: Buffer.from("Mea Creo builds websites for mining suppliers and engineering consultancies. Services: web design, branding, SEO.") });
await page.getByText(/characters read/).first().waitFor();
log("document uploaded + text extracted");
await page.getByRole("link", { name: "Analyse everything" }).click();
try { await page.waitForURL(/onboarding\/understand/, { timeout: 60000 }); } catch (e) { await shot(page, "err_analyse"); console.log("URL", page.url(), await page.locator("main").innerText()); throw e; }
await shot(page, "02_understand");
log("analysis finished → understand");
await page.getByRole("button", { name: "This looks right" }).click();
const reqs = []; page.on("request", (r) => reqs.push(r.method() + " " + r.url()));
try { await page.waitForURL(/onboarding\/markets/, { timeout: 45000 }); } catch (e) { await shot(page, "err_approve"); console.log(reqs.slice(-15)); throw e; }
await shot(page, "03_markets");
await page.getByRole("link", { name: "Skip to home" }).click();
await page.waitForURL(/home/);
log("onboarding complete");

// Manual prospect, then workflow.
await page.goto(`${BASE}/prospects?add=1`);
await page.getByLabel("Company name").fill("Acme Engineering");
await page.getByLabel(/Website/).fill("acme-engineering.example");
await page.getByRole("button", { name: "Add and research" }).click();
await page.waitForURL(/prospects\/pr_/);
const prospectUrl = page.url().split("?")[0];
log("manual prospect added", prospectUrl);
await page.getByRole("tab", { name: /Activity/ }).click();
await page.getByLabel("Details", { exact: true }).fill("Met their marketing lead at a trade show.");
await page.getByRole("button", { name: "Add note" }).click();
await page.getByText("Note added", { exact: true }).first().waitFor();
log("note added");
await page.getByRole("button", { name: "Follow up" }).first().click();
await page.getByLabel("What needs to happen?").fill("Call about website refresh");
await page.getByRole("dialog").getByRole("button", { name: "Schedule" }).click();
await page.getByText("Follow-up scheduled", { exact: true }).first().waitFor();
log("follow-up scheduled");
await page.getByRole("button", { name: /Status:/ }).click();
await page.getByRole("menuitem", { name: /Qualified/ }).click();
await page.getByText("Moved to Qualified", { exact: true }).first().waitFor();
log("status → qualified");
await page.getByRole("button", { name: "Draft outreach" }).first().click();
await page.getByRole("dialog").getByRole("button", { name: /Create a template draft|Draft it/ }).click();
await page.getByLabel("Message").waitFor();
const body = await page.getByLabel("Message").inputValue();
await page.getByLabel("Message").fill(body + "\n\nP.S. Loved your recent project.");
await page.getByRole("dialog").getByRole("button", { name: "Save draft" }).click();
await page.getByText("Draft saved", { exact: true }).first().waitFor();
await shot(page, "04_outreach");
log("outreach drafted + edited");
await page.keyboard.press("Escape");

// Pipeline, follow-ups, exports.
await page.goto(`${BASE}/pipeline`);
await page.getByText("Acme Engineering", { exact: true }).first().waitFor();
log("pipeline shows prospect");
await page.goto(`${BASE}/follow-ups`);
await page.getByText("Call about website refresh", { exact: true }).first().waitFor();
log("follow-ups list");
for (const fmt of ["csv", "xlsx"]) {
  const res = await page.request.get(`${BASE}/api/export?format=${fmt}&scope=crm`);
  if (!res.ok()) throw new Error(`export ${fmt} ${res.status()}`);
  const buf = await res.body();
  log(`export ${fmt}`, buf.length, "bytes", fmt === "csv" ? buf.toString().split("\n")[1]?.slice(0, 80) : "");
}
const rep = await page.goto(`${BASE}/reports/prospects?scope=crm`);
log("report", rep.status());

// Tenant isolation: a second account must not see A's prospect or jobs.
const { page: b } = await newUser("B");
await b.goto(`${BASE}/signup`);
await b.getByLabel("Your name").fill("Other User");
await b.getByLabel("Work email").fill(`other${Date.now()}@example.com`);
await b.getByLabel("Password").fill("password123");
await b.getByRole("button", { name: "Create account" }).click();
await b.waitForURL(/onboarding$/);
await b.getByRole("button", { name: "Explore the demo" }).click();
await b.waitForURL(/home/);
const r = await b.goto(prospectUrl);
const iso = r.status() === 404 || (await b.getByText("We couldn't find that page").count()) > 0;
log("tenant isolation (B cannot open A's prospect):", iso ? "PASS" : "FAIL");
const exp = await b.request.get(`${BASE}/api/export?format=csv&ids=${prospectUrl.split("/").pop()}`);
const leaked = (await exp.text()).includes("Acme Engineering");
log("tenant isolation (B cannot export A's prospect):", leaked ? "FAIL" : "PASS");
await b.setViewportSize({ width: 390, height: 844 });
await b.goto(`${BASE}/home`);
await shot(b, "05_mobile_home");
await b.goto(`${BASE}/prospects`);
await shot(b, "06_mobile_prospects");
console.log("ERRORS:", JSON.stringify(errors, null, 1));
await browser.close();
if (!iso || leaked) process.exit(1);
