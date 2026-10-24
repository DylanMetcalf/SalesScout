// The private briefing viewer. Needs a running server and `npx tsx scripts/dev/briefing-fixture.mts` output
// (a READY briefing made from fixture content, not the real AI) passed as FIXTURE='{"token":..}'.
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = process.env.OUT;
const { token, revokedToken } = JSON.parse(process.env.FIXTURE);
const errors = [];
const ok = (m) => console.log("✓", m);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
page.on("pageerror", (e) => errors.push(e.message));

const res = await page.goto(`${BASE}/b/${token}`);
const h = res.headers();
h["cache-control"]?.includes("no-store") ? ok("no-store caching") : errors.push(`cache-control: ${h["cache-control"]}`);
h["x-robots-tag"]?.includes("noindex") ? ok("noindex header") : errors.push("missing X-Robots-Tag");
h["referrer-policy"] === "no-referrer" ? ok("no-referrer, so the token can't leak to the booking site") : errors.push(`referrer-policy: ${h["referrer-policy"]}`);
await page.getByRole("heading", { level: 1, name: "Getting every enquiry answered, every time" }).waitFor();
(await page.title()).includes("Fixture") ? errors.push("customer details in the page title") : ok("generic page title");
for (const s of ["The problem", "Our assessment", "Proposed solution", "What could improve", "Recommended direction", "Next steps"]) await page.getByRole("heading", { level: 2, name: new RegExp(s) }).waitFor();
ok("all six sections render");
(await page.getByRole("button", { name: /print|download|export|pdf/i }).count()) + (await page.getByRole("link", { name: /print|download|export|pdf/i }).count()) === 0 ? ok("no print/download/export actions") : errors.push("found a print/download action");
await page.emulateMedia({ media: "print" });
(await page.locator(".briefing-protect").isVisible()) ? errors.push("content visible when printing") : ok("printing shows a note instead of the content");
await page.emulateMedia({ media: "screen" });
const cta = page.getByRole("button", { name: "Let’s discuss your solution" });
(await cta.count()) ? ok("CTA present (no BOOKING_URL here, so it's a real call request)") : errors.push("CTA missing");
await cta.last().click();
await page.getByText("We’ll contact you to arrange a time").waitFor();
ok("call request recorded from the briefing");
if (fs.existsSync("node_modules/axe-core/axe.min.js")) {
  await page.waitForTimeout(800);
  await page.addScriptTag({ content: fs.readFileSync("node_modules/axe-core/axe.min.js", "utf8") });
  const v = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa"] })).violations.map((x) => `${x.id} (${x.nodes.length}) ${x.nodes[0]?.target}`));
  v.length ? errors.push(...v.map((x) => `a11y: ${x}`)) : ok("no WCAG A/AA violations");
}
if (OUT) await page.screenshot({ path: `${OUT}/briefing-desktop.png`, fullPage: true });

const m = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await m.goto(`${BASE}/b/${token}`);
await m.waitForTimeout(600);
(await m.evaluate(() => document.documentElement.scrollWidth > innerWidth)) ? errors.push("mobile: sideways scroll") : ok("mobile: fits the screen");
if (OUT) await m.screenshot({ path: `${OUT}/briefing-mobile.png`, fullPage: true });

for (const [label, t] of [["revoked", revokedToken], ["unknown", "A".repeat(43)], ["malformed", "nope"]]) {
  await page.goto(`${BASE}/b/${t}`);
  (await page.getByText("This link is no longer available").count()) ? ok(`${label} link: polite "no longer available"`) : errors.push(`${label} link not rejected`);
  if ((await page.content()).includes("Fixture Co")) errors.push(`${label} link leaked data`);
}
console.log("ERRORS:", JSON.stringify(errors, null, 1));
await b.close();
