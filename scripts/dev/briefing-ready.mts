// Test helper: completes the briefing for the most recent opportunity with fixture content (NOT the real AI).
import Module from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const r = (Module as unknown as { _resolveFilename: (...a: unknown[]) => string })._resolveFilename;
(Module as unknown as { _resolveFilename: (...a: unknown[]) => string })._resolveFilename = function (q: unknown, ...rest: unknown[]) {
  if (q === "server-only") return path.join(os.tmpdir(), "ss-server-only-stub.js");
  return r.call(this, q, ...rest);
};
fs.writeFileSync(path.join(os.tmpdir(), "ss-server-only-stub.js"), "");
const { db, t } = await import("../../src/lib/db");
const { desc, eq } = await import("drizzle-orm");
const br = await import("../../src/lib/opportunities/briefings");
const email = process.argv[2];
const o = db.select().from(t.opportunities).where(eq(t.opportunities.email, email)).orderBy(desc(t.opportunities.createdAt)).get()!;
db.update(t.briefings).set({ status: "queued" }).where(eq(t.briefings.opportunityId, o.id)).run();
const b = await br.runBriefing(o.id, null, { ctx: { accountId: "x", workspaceId: "x", companyId: null }, write: async () => ({
  title: "Getting every order entered once",
  summary: { challenge: "Orders are retyped into the accounting system.", affects: "Order handling", underlyingIssue: "The systems appear not to share data." },
  assessment: { whyItMatters: "Missed orders cost customers.", consequences: ["Missed orders"], assumptions: ["One accounting system"], questions: ["How many orders a day?"] },
  solution: { name: "One entry, everywhere", concept: "Enter each order once and let it flow on.", howItWorks: ["Order arrives", "Captured once", "Flows to accounts"], approaches: ["Integration"] },
  benefits: [{ area: "time", text: "Less retyping." }],
  direction: { approach: "Start small.", investigate: ["APIs"], dependencies: ["Accounting system access"] },
  alternatives: [],
  nextSteps: { clarify: ["Volumes"], information: ["Example orders"], howWeHelp: "A short discovery." },
  confidence: "medium", confidenceNote: "Short description.",
}) });
console.log(b?.status);
