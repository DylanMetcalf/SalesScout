// Screenshots the public website (desktop full page + mobile) and submits the enquiry form.
import { chromium } from "playwright";
const OUT = process.env.OUT;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const errors = [];
for (const [name, vp] of [["site", { width: 1440, height: 900 }], ["site_m", { width: 390, height: 844 }]]) {
  const page = await (await browser.newContext({ viewport: vp })).newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  if (name === "site") {
    await page.screenshot({ path: `${OUT}/site_top.png` });
    const form = page.locator("#contact form");
    await form.getByLabel("Your name", { exact: true }).fill("Test Buyer");
    await form.getByLabel("Work email", { exact: true }).fill("buyer@example.com");
    await form.getByLabel(/What do you sell/).fill("We sell industrial maintenance services to mines.");
    await page.getByRole("button", { name: "Book a discovery call" }).last().click();
    await page.getByText("Thanks — we've got it.").waitFor({ timeout: 15000 });
    console.log("enquiry submitted");
  }
}
console.log("ERRORS:", JSON.stringify(errors));
await browser.close();
