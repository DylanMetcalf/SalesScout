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
await page.evaluate(() => window.scrollTo(0, 620));
await shot("07b-prospect-briefing-continued");
await page.evaluate(() => window.scrollTo(0, 0));
await page.getByRole("tab", { name: /Evidence/ }).click();
await shot("08-research-and-evidence");
await page.getByRole("button", { name: "Draft outreach" }).first().click();
await shot("09-outreach-assistant");
await page.keyboard.press("Escape");
await page.getByRole("tab", { name: "Briefing" }).click();
await page.getByRole("button", { name: "One-minute brief" }).click();
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
await page.waitForLoadState("networkidle");
await page.getByRole("button", { name: /Search & actions/ }).click();
await page.getByPlaceholder("What would you like to do?").fill("find");
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
await page.goto(`${B}/prospects/${await (async () => { await page.goto(`${B}/prospects?tab=pipeline`); return (await page.getByRole("link", { name: "Kopano Platinum Concentrator" }).getAttribute("href")).split("/").pop(); })()}`);
await shot("19b-mobile-prospect");
await page.goto(`${B}/pipeline`);
await shot("20-mobile-pipeline");
await browser.close();
