// Accessibility scan (axe-core) of public and signed-in pages. Needs: npm i --no-save axe-core
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3000";
const axe = fs.readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const scan = async (path) => {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.addScriptTag({ content: axe });
  const res = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "best-practice"] })).violations.map((v) => `${v.impact} ${v.id} (${v.nodes.length}): ${v.nodes[0].target.join(" ")}`));
  console.log(path, res.length ? "\n  " + res.join("\n  ") : "OK");
};
for (const p of ["/", "/start", "/book", "/privacy", "/terms", "/login", "/signup"]) await scan(p);
await page.goto(BASE + "/login");
await page.getByLabel("Work email").fill("demo@salesscout.app");
await page.getByLabel("Password").fill("salesscout-demo");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL(/\/home/);
for (const p of ["/home", "/discover", "/prospects", "/pipeline", "/follow-ups", "/company", "/settings", "/settings/billing", "/verify", "/admin", "/admin/operations", "/opportunities"]) await scan(p);
await b.close();
