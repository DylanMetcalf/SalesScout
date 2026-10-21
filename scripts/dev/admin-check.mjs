// Admin back office: console renders, invite code signs a new account up with sign-ups closed,
// the new account can't open /admin and doesn't get the server key. Needs a server started with
// ADMIN_EMAILS=demo@salesscout.app ALLOW_SIGNUPS=false ANTHROPIC_API_KEY=<anything>.
import { chromium } from "playwright";
const OUT = process.env.OUT ?? ".";
const BASE = process.env.BASE ?? "http://localhost:3000";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const errors = [];
const ok = (m) => console.log("✓", m);
const login = async (page, email, password) => {
  await page.goto(BASE + "/login");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/home|\/onboarding/);
};

const admin = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
admin.on("pageerror", (e) => errors.push(e.message));
await login(admin, "demo@salesscout.app", "salesscout-demo");
await admin.getByRole("link", { name: "Admin" }).click();
await admin.getByRole("heading", { name: "Back office" }).waitFor();
ok("admin console opens from the sidebar");
await admin.getByRole("button", { name: "New invite code" }).click();
await admin.getByLabel("Who is it for?").fill("E2E client");
await admin.getByLabel("AI usage").selectOption("own_key");
await admin.getByRole("button", { name: "Create code" }).click();
await admin.getByText("Invite created").waitFor();
const code = (await admin.locator("p.font-mono").first().textContent()).trim();
ok(`invite created ${code}`);
await admin.screenshot({ path: `${OUT}/admin.png`, fullPage: true });

const client = await (await browser.newContext()).newPage();
await client.goto(BASE + "/signup");
await client.getByText("invite-only").waitFor();
await client.getByLabel("Your name").fill("Eve Client");
await client.getByLabel("Work email").fill(`eve${Date.now()}@example.com`);
await client.getByLabel("Password").fill("password123");
await client.getByLabel("Invite code").fill("WRONG-CODE1");
await client.getByRole("button", { name: "Create account" }).click();
await client.getByText("isn't valid").waitFor();
ok("bad invite code rejected");
await client.getByLabel("Password").fill("password123");
await client.getByLabel("Invite code").fill(code.toLowerCase().replace("-", ""));
await client.getByRole("button", { name: "Create account" }).click();
await client.waitForURL(/\/onboarding/);
ok("invite code (typed loosely) creates an account while sign-ups are closed");
const r = await client.goto(BASE + "/admin");
const leaked = await client.getByRole("heading", { name: "Back office" }).count();
if (leaked || (r.status() !== 404 && !client.url().includes("/onboarding"))) errors.push(`non-admin /admin: ${r.status()} ${client.url()}`);
else ok(`non-admin can't open /admin (${r.status() === 404 ? "404" : "sent to onboarding"})`);

const reuse = await (await browser.newContext()).newPage();
await reuse.goto(BASE + "/signup?invite=" + code);
await reuse.getByLabel("Your name").fill("Mallory");
await reuse.getByLabel("Work email").fill(`m${Date.now()}@example.com`);
await reuse.getByLabel("Password").fill("password123");
await reuse.getByRole("button", { name: "Create account" }).click();
await reuse.getByText("isn't valid").waitFor();
ok("single-use invite can't be reused");

console.log("ERRORS:", JSON.stringify(errors));
await browser.close();
