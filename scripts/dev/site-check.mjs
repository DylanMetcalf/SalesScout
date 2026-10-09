// Screenshots every public website page (desktop + mobile), checks for errors, and submits the enquiry form.
import { chromium } from "playwright";
const OUT = process.env.OUT ?? ".";
const BASE = process.env.BASE ?? "http://localhost:3000";
const PAGES = [["home", "/"], ["platform", "/platform"], ["why", "/why-us"], ["how", "/how-it-works"], ["services", "/services"], ["contact", "/contact"]];
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
  if (!suffix) {
    await page.goto(BASE + "/contact", { waitUntil: "networkidle" });
    const form = page.locator("form");
    await form.getByLabel("Your name", { exact: true }).fill("Test Buyer");
    await form.getByLabel("Work email", { exact: true }).fill("buyer@example.com");
    await form.getByLabel(/What do you sell/).fill("We sell industrial maintenance services to mines.");
    await form.getByRole("button", { name: "Book a discovery call" }).click();
    await page.getByText("Thanks — we've got it.").waitFor({ timeout: 15000 });
    console.log("enquiry submitted");
  }
}
console.log("ERRORS:", JSON.stringify(errors));
await browser.close();
