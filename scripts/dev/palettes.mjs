// Screenshots the website and app in every palette: OUT=<dir> node scripts/dev/palettes.mjs
import { chromium } from "playwright";
const OUT = process.env.OUT ?? ".";
const BASE = process.env.BASE ?? "http://localhost:3000";
const IDS = ["night", "indigo", "ocean", "forest", "plum", "graphite", "ember"];
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(BASE + "/login");
await page.getByLabel("Email").fill("demo@salesscout.app");
await page.getByLabel("Password").fill("salesscout-demo");
await page.getByRole("button", { name: /sign in|log in/i }).click();
await page.waitForURL(/\/home/);
for (const id of IDS) {
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), ["ss-palette", id]);
  for (const [name, path] of [["site", "/"], ["app", "/home"]]) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/pal_${id}_${name}.png` });
  }
}
await page.evaluate(() => localStorage.removeItem("ss-palette"));
await browser.close();
console.log("done");
