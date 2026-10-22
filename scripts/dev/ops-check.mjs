// Admin → Operations: renders, kill switches pause and resume discovery, axe-clean.
// Needs a server started with ADMIN_EMAILS=demo@salesscout.app ANTHROPIC_API_KEY=<anything> and axe-core (npm i --no-save axe-core).
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3000";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const errors = [];
const ok = (m) => console.log("✓", m);
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(BASE + "/login");
await page.getByLabel("Work email").fill("demo@salesscout.app");
await page.getByLabel("Password").fill("salesscout-demo");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL(/\/home|\/onboarding/);
await page.goto(BASE + "/admin");
await page.getByRole("link", { name: /Operations/ }).click();
await page.getByRole("heading", { name: "Operations", level: 1 }).waitFor();
for (const h of ["Kill switches", "Spend by step (last 30 days)", "Recent searches", "Quality (last 30 days)", "Kept prospects by stage"]) await page.getByText(h, { exact: true }).waitFor();
ok("operations page renders every section");

await page.getByLabel("Reason for Pause new searches").fill("E2E budget check");
await page.getByRole("button", { name: "Pause" }).first().click();
await page.getByRole("button", { name: "Resume" }).waitFor();
ok("discovery can be paused");
const res = await page.evaluate(async () => (await fetch("/discover")).status);
await page.goto(BASE + "/discover");
const body = await page.textContent("body");
console.log(/paused/i.test(body) ? "✓ discover explains the pause" : "· discover page doesn't mention the pause until a search starts (status " + res + ")");
await page.goto(BASE + "/admin/operations");
await page.getByRole("button", { name: "Resume" }).click();
await page.getByRole("button", { name: "Pause" }).first().waitFor();
await page.waitForTimeout(500);
if (await page.getByRole("button", { name: "Resume" }).count()) errors.push("still paused after resume");
else ok("discovery resumed");

await page.addScriptTag({ content: fs.readFileSync("node_modules/axe-core/axe.min.js", "utf8") });
const v = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa"] })).violations.map((x) => `${x.id} (${x.nodes.length})`));
v.length ? errors.push(...v) : ok("axe: no WCAG A/AA violations");
const m = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await m.context().addCookies(await page.context().cookies());
await m.goto(BASE + "/admin/operations");
const overflow = await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
overflow ? errors.push("mobile page scrolls sideways") : ok("mobile: no sideways page scroll");
if (process.env.OUT) await page.screenshot({ path: process.env.OUT + "/operations.png", fullPage: true });
console.log("ERRORS:", JSON.stringify(errors, null, 1));
await browser.close();
