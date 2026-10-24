// Screenshots every public website page (desktop + mobile) and checks for errors. The intake form is tested by intake-check.mjs.
import { chromium } from "playwright";
const OUT = process.env.OUT ?? ".";
const BASE = process.env.BASE ?? "http://localhost:3000";
const PAGES = [["home", "/"], ["start", "/start"], ["book", "/book"], ["privacy", "/privacy"], ["terms", "/terms"]];
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const errors = [];
for (const [suffix, vp] of [["", { width: 1440, height: 900 }], ["_m", { width: 390, height: 844 }]]) {
  const page = await (await browser.newContext({ viewport: vp })).newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  for (const [name, path] of PAGES) {
    const res = await page.goto(BASE + path, { waitUntil: "networkidle" });
    if (!res?.ok() || page.url().includes("/login")) errors.push(`${path} -> ${res?.status()} ${page.url()}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    if (overflow) errors.push(`${path}${suffix}: horizontal overflow`);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/site_${name}${suffix}.png`, fullPage: true });
  }
}
console.log("ERRORS:", JSON.stringify(errors));
await browser.close();
