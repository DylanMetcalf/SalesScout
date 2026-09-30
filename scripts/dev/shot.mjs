import { chromium } from "playwright";
const [,, ...paths] = process.argv;
const out = process.env.OUT;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const width = Number(process.env.W || 1440), height = Number(process.env.H || 900);
const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: process.env.SCHEME || "light" });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
await page.goto("http://localhost:3000/login");
await page.fill('input[name=email]', process.env.EMAIL || "demo@salesscout.app");
await page.fill('input[name=password]', process.env.PASS || "salesscout-demo");
await page.click('button[type=submit]');
await page.waitForURL(/home|onboarding/, { timeout: 60000 });
for (const p of paths) {
  await page.goto("http://localhost:3000" + p, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(500);
  const name = p.replace(/[^\w]+/g, "_") || "root";
  await page.screenshot({ path: `${out}/${name}${process.env.SUFFIX||""}.png`, fullPage: process.env.FULL === "1" });
  console.log("shot", p, page.url());
}
console.log("ERRORS:", JSON.stringify(errors.slice(0, 10), null, 1));
await browser.close();
