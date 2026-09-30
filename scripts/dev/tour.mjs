// Captures a visual tour of Sales Scout using the demo login.
import { chromium } from "playwright";
const OUT = process.env.OUT;
const B = "http://localhost:3000";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);
const shot = async (name) => { await page.waitForTimeout(700); await page.screenshot({ path: `${OUT}/${name}.png` }); console.log(name); };

await page.goto(`${B}/login`);
await shot("01-sign-in");
await page.fill("input[name=email]", "demo@salesscout.app");
await page.fill("input[name=password]", "salesscout-demo");
await page.click("button[type=submit]");
await page.waitForURL(/home/);
await shot("02-home");

await page.goto(`${B}/discover`);
await page.fill("#discover-q", "Operations Managers at mining companies in South Africa");
await shot("03-discover");

await page.goto(`${B}/discover`);
await page.getByRole("link", { name: /Mining operations prospects/ }).click();
await page.waitForURL(/runs/);
await shot("04-search-results");
await page.getByRole("button", { name: /Why was .* suggested/ }).first().click();
await shot("05-why-this-lead");
await page.keyboard.press("Escape");

await page.goto(`${B}/prospects?tab=pipeline`);
await shot("06-prospects");
await page.getByRole("link", { name: "Kopano Platinum Concentrator" }).click();
await page.waitForURL(/prospects\/pr_/);
await shot("07-prospect-profile");
await page.getByRole("tab", { name: /Research/ }).click();
await shot("08-research-and-evidence");
await page.getByRole("button", { name: "Draft outreach" }).first().click();
await shot("09-outreach-assistant");
await page.keyboard.press("Escape");
await page.getByRole("button", { name: "Open brief" }).click();
await shot("10-sales-brief");
await page.keyboard.press("Escape");

await page.goto(`${B}/pipeline`);
await shot("11-pipeline");
await page.goto(`${B}/follow-ups`);
await shot("12-follow-ups");
await page.goto(`${B}/company`);
await shot("13-company-brain");
await page.goto(`${B}/company?tab=markets`);
await shot("14-market-discovery");
await page.goto(`${B}/company?tab=strategies`);
await shot("15-lead-strategies");
await page.goto(`${B}/home`);
await page.keyboard.press("Control+k");
await page.keyboard.type("kop");
await shot("16-command-menu");
await page.keyboard.press("Escape");
await page.goto(`${B}/settings`);
await page.locator("#ai").scrollIntoViewIfNeeded();
await shot("17-settings-ai-key");
await page.goto(`${B}/reports/prospects?scope=crm`);
await shot("18-client-report");

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${B}/home`);
await shot("19-mobile-home");
await page.goto(`${B}/pipeline`);
await shot("20-mobile-pipeline");
await browser.close();
