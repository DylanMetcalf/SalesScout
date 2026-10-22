// Free-user money path against a running server: uses the newest e2e account (test…@example.com / password123),
// plants one previewed (not kept) prospect with a contact email directly in the DB, then through the real UI:
// preview hides details · brief/export exclude previews · Keep uses exactly 1 of 5 unlocks · keeping again is free.
import { chromium } from "playwright";
import Database from "better-sqlite3";
const BASE = process.env.BASE ?? "http://localhost:3000";
const db = new Database(process.env.DATABASE_PATH ?? "data/salesscout.db");
const user = db.prepare("SELECT * FROM users WHERE email LIKE 'test%@example.com' ORDER BY created_at DESC LIMIT 1").get();
const company = db.prepare("SELECT c.* FROM companies c JOIN workspaces w ON w.id = c.workspace_id WHERE w.account_id = ? AND c.is_demo = 0 ORDER BY c.created_at DESC LIMIT 1").get(user.account_id);
const pid = `pr_credit${Date.now()}`;
db.prepare("INSERT INTO prospects (id, workspace_id, company_id, name, domain, website, why_relevant, origin, status, in_crm, vetting) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
  .run(pid, company.workspace_id, company.id, "Preview Test Co", `credit${Date.now()}.example`, "https://preview.example", "Planted for the credits check.", "web_research", "new", 0, "presented");
db.prepare("INSERT INTO contacts (id, workspace_id, company_id, prospect_id, name, role, email, relevance, source_url, knowledge, origin, checks) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
  .run(`ct_${Date.now()}`, company.workspace_id, company.id, pid, "Pat Preview", "Operations Manager", "pat@preview.example", "Runs operations", "https://preview.example/team", "confirmed", "web_research",
    JSON.stringify({ email: [{ status: "pass", method: "source", at: Date.now() }] }));
const ledger = () => db.prepare("SELECT coalesce(sum(amount),0) AS n FROM credit_ledger WHERE account_id = ?").get(user.account_id).n;
const ok = (m) => console.log("✓", m);
const fail = (m) => { console.log("✗", m); process.exitCode = 1; };

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await (await b.newContext()).newPage();
await p.goto(BASE + "/login");
await p.getByLabel("Work email").fill(user.email);
await p.getByLabel("Password").fill("password123");
await p.getByRole("button", { name: "Sign in" }).click();
await p.waitForURL(/\/home|\/onboarding/);

await p.goto(`${BASE}/prospects/${pid}`);
(await p.getByText("This is a preview").count()) && !(await p.getByText("pat@preview.example").count()) ? ok("preview hides the contact email") : fail("preview leaked details");
await p.goto(`${BASE}/reports/brief/${pid}`);
p.url().includes(`/prospects/${pid}`) ? ok("brief redirects for an unkept prospect") : fail(`brief not gated: ${p.url()}`);
const csv = await (await p.request.get(`${BASE}/api/export?format=csv&scope=all`)).text();
!csv.includes("Preview Test Co") ? ok("exports exclude previews") : fail("export leaked a preview");

await p.goto(`${BASE}/settings/billing`);
const before = ledger();
(await p.getByText("5", { exact: true }).count()) ? ok(`free plan shows 5 unlocks (ledger ${before})`) : fail("free unlocks not shown");
await p.goto(`${BASE}/prospects/${pid}`);
await p.getByRole("button", { name: /Keep/ }).first().click();
await p.getByText(/Kept Preview Test Co/).waitFor();
const after = ledger();
after === before - 1 ? ok("keeping used exactly 1 unlock") : fail(`ledger ${before} -> ${after}`);
await p.goto(`${BASE}/prospects/${pid}`);
(await p.getByText("pat@preview.example").count()) ? ok("full profile unlocked after keep") : fail("still locked after keep");
(await p.getByText("Published on source").count()) ? ok("email shows its verification label") : fail("no verification label");
const r = await p.request.get(`${BASE}/reports/brief/${pid}`);
r.ok() && (await r.text()).includes("Preview Test Co") ? ok("brief available after keep") : fail("brief unavailable");
db.prepare("UPDATE prospects SET in_crm = 0 WHERE id = ?").run(pid); // simulate a retry of the same keep
await p.goto(`${BASE}/prospects/${pid}`);
await p.getByRole("button", { name: /Keep/ }).first().click();
await p.getByText(/Kept Preview Test Co/).waitFor();
ledger() === after ? ok("keeping the same prospect again is free") : fail("double charge");
await b.close();
