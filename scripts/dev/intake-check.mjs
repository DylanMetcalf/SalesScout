// Problem intake → opportunity → documents, end to end. Needs a server started with
// ADMIN_EMAILS=demo@salesscout.app ANTHROPIC_API_KEY=sk-ant-fake (AI calls fail honestly; nothing is charged)
// and BOOKING_URL unset (tests the fallback). Optional: OUT=<dir> for screenshots; axe-core for a11y.
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = process.env.OUT;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const errors = [];
const ok = (m) => console.log("✓", m);
const shot = async (p, name) => OUT && p.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
const axe = fs.existsSync("node_modules/axe-core/axe.min.js") ? fs.readFileSync("node_modules/axe-core/axe.min.js", "utf8") : null;
const a11y = async (p, label) => {
  if (!axe) return;
  // Let entrance animations finish and streamed metadata (the <title>) arrive before measuring.
  await p.waitForTimeout(900);
  await p.waitForFunction(() => document.title.length > 0, null, { timeout: 5000 }).catch(() => {});
  await p.addScriptTag({ content: axe });
  const v = await p.evaluate(async () => (await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa"] })).violations.map((x) => `${x.id} (${x.nodes.length}): ${x.nodes[0]?.target}`));
  v.length ? errors.push(...v.map((x) => `${label} a11y: ${x}`)) : ok(`${label}: no WCAG A/AA violations`);
};
const noOverflow = async (p, label) => {
  if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) errors.push(`${label}: page scrolls sideways`);
};

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

// Home
await page.goto(BASE + "/");
await page.getByRole("heading", { level: 1, name: /better way forward/ }).waitFor();
const ctas = await page.getByRole("link", { name: "Tell us your problem" }).count();
ctas >= 2 ? ok(`home: primary CTA present (${ctas}x)`) : errors.push("home: CTA missing");
if (await page.getByText(/testimonial|\d+% (faster|cheaper)|trusted by/i).count()) errors.push("home: looks like unverified proof");
await page.waitForTimeout(900); // let the entrance animation settle before measuring contrast
await a11y(page, "home");
await shot(page, "home-desktop");

// Retired pages redirect
for (const [from, to] of [["/contact", "/book"], ["/services", "/"], ["/platform", "/"]]) {
  await page.goto(BASE + from);
  new URL(page.url()).pathname === to ? ok(`${from} → ${to}`) : errors.push(`${from} went to ${page.url()}`);
}

// Intake: validation
await page.goto(BASE + "/start");
await page.getByRole("button", { name: "Continue" }).click();
await page.getByText("Tell us a little more").waitFor();
ok("intake: too-short problem is caught");
const problem = "We take orders by phone and email and then retype them into our accounting system. Orders get missed when we're busy and customers chase us.";
await page.getByLabel("Describe it in your own words").fill(problem);
await page.getByRole("button", { name: "Continue" }).click();
await page.getByRole("heading", { name: "Help us picture it." }).waitFor();
await page.getByLabel(/Which part of the business/).selectOption("Operations");
await page.getByLabel(/How often/).selectOption("Every day");
await page.getByRole("button", { name: "Continue" }).click();
await page.getByLabel("Your name").fill("Thandi Mokoena");
await page.getByLabel("Business email").fill("thandi@example-logistics.co.za");
await page.getByLabel("Company name").fill("Example Logistics");
await page.getByRole("textbox", { name: /^Website/ }).fill("example.com");
await page.getByRole("button", { name: "Send my problem" }).click();
await page.getByText(/confirm you've read how we'll use/).waitFor();
ok("intake: consent is required (server-side)");
await a11y(page, "intake step 3");
await page.getByRole("checkbox").check();
await page.getByRole("button", { name: "Send my problem" }).click();
await page.waitForURL(/\/start\/received\?ref=/);
const ref = new URL(page.url()).searchParams.get("ref");
await page.getByRole("heading", { name: /Thank you, Thandi/ }).waitFor();
(await page.getByText(problem).count()) ? ok("received: shows their own words back") : errors.push("received: recap missing");
await a11y(page, "received");
await shot(page, "received");

// No BOOKING_URL: no broken calendar; the fallback works
await page.getByRole("button", { name: "Ask us to arrange a conversation" }).click();
await page.getByText("We’ll contact you to arrange a time").waitFor();
ok("received: call request fallback works");
await page.reload();
await page.getByText("We’ll contact you to arrange a time").waitFor();
ok("received: call request persisted");
await page.goto(BASE + "/book");
(await page.locator("iframe").count()) === 0 ? ok("book: no broken calendar without BOOKING_URL") : errors.push("book: iframe shown without BOOKING_URL");
await a11y(page, "book");

// Private routes are private
await page.goto(BASE + "/opportunities");
/\/login/.test(page.url()) ? ok("signed out: /opportunities → login") : errors.push("signed out could open /opportunities");
const r = await page.request.get(BASE + "/reports/opportunity/doc_anything", { maxRedirects: 0 });
[302, 303, 307, 308, 404].includes(r.status()) ? ok(`signed out: document URL refused (${r.status()})`) : errors.push(`document URL returned ${r.status()}`);

// Mobile
const m = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
for (const path of ["/", "/start", `/start/received?ref=${ref}`, "/book"]) {
  await m.goto(BASE + path);
  await noOverflow(m, `mobile ${path}`);
}
await m.goto(BASE + "/");
await shot(m, "home-mobile");
ok("mobile: public pages checked for sideways scroll");

// Operator
const op = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
op.on("pageerror", (e) => errors.push(`op pageerror: ${e.message}`));
await op.goto(BASE + "/login");
await op.getByLabel("Work email").fill("demo@salesscout.app");
await op.getByLabel("Password").fill("salesscout-demo");
await op.getByRole("button", { name: "Sign in" }).click();
await op.waitForURL(/\/home|\/onboarding/);
await op.getByRole("link", { name: /Opportunities/ }).first().click();
await op.getByRole("heading", { name: "Opportunities", level: 1 }).waitFor();
await a11y(op, "opportunities list");
await shot(op, "opportunities");
await op.getByRole("link", { name: /Example Logistics/ }).first().click();
await op.waitForURL(/\/opportunities\/opp_/);
await op.getByRole("blockquote").filter({ hasText: problem }).waitFor();
ok("operator: submission appears with the original words");
(await op.getByText("Call requested", { exact: false }).count()) || (await op.getByText(/Asked for a call/).count()) ? ok("operator: call request visible") : errors.push("call request not visible");
await op.waitForTimeout(800); // let the tab fade-in finish so contrast is measured at full opacity
await a11y(op, "opportunity detail");
await shot(op, "opportunity");

// Stage, note, task
await op.getByLabel("Stage", { exact: true }).selectOption("reviewing");
await op.getByText("Moved from New to Reviewing").waitFor();
ok("operator: stage change logged");
await op.getByRole("textbox", { name: "Note" }).fill("Spoke briefly; they use Sage and a shared inbox.");
await op.getByRole("button", { name: "Add", exact: true }).click();
await op.getByText("they use Sage").waitFor();
await op.getByRole("radio", { name: "Task" }).click();
await op.getByRole("textbox", { name: "Task" }).fill("Send discovery questions");
await op.getByRole("button", { name: "Add", exact: true }).click();
await op.getByText("Send discovery questions").waitFor();
ok("operator: note and task added");

// AI without a working key fails honestly, and the rest keeps working
await op.getByRole("button", { name: "Analyse the problem" }).click();
await op.getByText("We couldn't finish this.").waitFor({ timeout: 60_000 });
ok("operator: AI failure is shown honestly (nothing fabricated)");
await op.getByRole("button", { name: "Close" }).click();

// Solution brief → document → PDF
await op.getByRole("tab", { name: "Solution brief" }).click();
await op.getByLabel("Problem statement").fill("Orders arrive by phone and email and are retyped into Sage.\n\n- Orders are missed at busy times\n- Customers chase for updates");
await op.getByLabel("Recommended approach").fill("A shared order inbox that creates draft orders in Sage, with a daily summary of anything unconfirmed. To confirm: Sage version and API access.");
await op.getByRole("button", { name: "Save changes" }).click();
await op.getByRole("button", { name: "Saved" }).waitFor();
ok("operator: brief saved");
const [doc] = await Promise.all([op.context().waitForEvent("page"), op.getByRole("button", { name: "Create document" }).click()]);
await doc.waitForLoadState();
await doc.getByText("Recommended approach").waitFor();
ok("document: solution brief renders");
await a11y(doc, "document");
const pdf = await doc.pdf({ format: "A4", preferCSSPageSize: true, printBackground: true });
const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
pages >= 1 && pages <= 2 ? ok(`document: PDF exports (${pages} page${pages > 1 ? "s" : ""})`) : errors.push(`PDF has ${pages} pages`);
if (OUT) fs.writeFileSync(`${OUT}/solution-brief.pdf`, pdf);

// Proposal cannot be documented while placeholders remain
await op.getByRole("tab", { name: "Proposal" }).click();
await op.getByLabel("Investment and terms").fill("[To be completed by Mea Creo]");
await op.getByRole("button", { name: "Save changes" }).click();
await op.getByRole("button", { name: "Create proposal document" }).click();
await op.getByText(/Complete the sections marked/).waitFor();
ok("proposal: placeholders block the document");

// A non-admin with their own company can't see any of it
const other = await (await browser.newContext()).newPage();
await other.goto(BASE + "/signup");
await other.getByLabel("Your name").fill("Not Admin");
await other.getByLabel("Work email").fill(`notadmin${Date.now()}@example.com`);
await other.getByLabel("Password").fill("a-long-password-123");
await other.getByRole("button", { name: "Create account" }).click();
await other.waitForURL(/onboarding$/);
await other.getByLabel("What should we call your workspace?").fill("Other Co");
await other.getByRole("button", { name: "Continue" }).click();
await other.waitForURL(/onboarding\/company/);
await other.getByLabel("Company name").fill("Other Co");
await other.getByLabel(/What does your business do/).fill("We sell office furniture to small businesses in Cape Town.");
await other.getByRole("button", { name: "Continue" }).click();
await other.waitForURL(/step=website/);
const oppPath = new URL(op.url()).pathname;
for (const path of [oppPath, "/opportunities", new URL(doc.url()).pathname]) {
  await other.goto(BASE + path);
  const html = await other.content();
  if (html.includes("retype them into our accounting") || html.includes("Example Logistics")) errors.push(`non-admin saw opportunity data at ${path}`);
  else if (!/couldn.t find|not found/i.test(html) && !/onboarding/.test(other.url())) errors.push(`non-admin at ${path}: not a not-found page (${other.url()})`);
  else ok(`non-admin: ${path.split("/").slice(0, 3).join("/")}… shows nothing`);
}
await other.goto(BASE + "/home");
if (await other.getByRole("link", { name: /^Opportunities/ }).count()) errors.push("non-admin sees Opportunities in nav");
else ok("non-admin: no Opportunities in navigation");

console.log("ERRORS:", JSON.stringify(errors, null, 1));
await browser.close();
