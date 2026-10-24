// Creates a READY briefing from fixture content (not the real AI) for browser testing of the viewer.
// Usage: npx tsx scripts/dev/briefing-fixture.mts  → prints JSON { token, opportunityId, revokedToken }
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
const svc = await import("../../src/lib/opportunities/service");
const br = await import("../../src/lib/opportunities/briefings");
const FIXTURE = {
  title: "Getting every enquiry answered, every time",
  summary: { challenge: "Enquiries arrive by WhatsApp, email and the website form, and some never get a reply.", affects: "How quickly and reliably new customers hear back from you.", underlyingIssue: "There appears to be no single place where enquiries land, and no one clearly owns replying to each one." },
  assessment: {
    whyItMatters: "Every unanswered enquiry is a customer who may go elsewhere, and the gaps are hardest to see on your busiest days.",
    consequences: ["Lost sales from people who never hear back", "Slow replies that make a good business look disorganised", "No clear picture of how many enquiries you receive"],
    assumptions: ["Most enquiries come through the three channels you mentioned", "A small team shares the job of replying"],
    questions: ["Roughly how many enquiries arrive in a typical week?", "Who replies today, and how do they know an enquiry is theirs?", "Which tools does the team already use every day?"],
  },
  solution: {
    name: "One inbox for every enquiry",
    concept: "Bring enquiries from every channel into one shared place, make it clear who owns each one, and remind the team when something is waiting.",
    howItWorks: ["An enquiry arrives on any channel", "It appears in one shared inbox with its source", "It's assigned to a person, with a simple status", "Anything unanswered after a set time triggers a reminder"],
    approaches: ["A shared inbox with rules", "WhatsApp Business integration", "Simple reminders", "Optional AI-suggested first replies"],
  },
  benefits: [
    { area: "responsiveness", text: "Faster first replies, because nothing waits unseen in someone's phone." },
    { area: "visibility", text: "A clear view of what's open, who has it, and what came in this week." },
    { area: "consistency", text: "Every enquiry handled the same way, whoever is on duty." },
  ],
  direction: { approach: "Start with the channel that brings the most enquiries, prove the shared inbox works for a few weeks, then add the others.", investigate: ["Which channels matter most", "How replies are written today"], dependencies: ["A WhatsApp Business account", "Agreement on who owns which enquiries"] },
  alternatives: [{ name: "A light CRM", when: "If you also want to track quotes and follow-ups, not just first replies." }],
  nextSteps: { clarify: ["Your enquiry volumes and peak times", "Who should own replies"], information: ["A few anonymised example enquiries", "The tools you use today"], howWeHelp: "We'd run a short discovery, confirm the right first step, and scope it with you before anything is built." },
  confidence: "medium" as const,
  confidenceNote: "Your description was clear, but we haven't seen your volumes or tools yet.",
};
const { ref } = svc.createFromIntake({ problem: "Enquiries come in on WhatsApp, email and the website, and some never get a reply.", context: { area: "Sales and enquiries" }, name: "Fixture Customer", email: "fixture@example.com", companyName: "Fixture Co", website: null, role: null, phone: null, region: null, contactPreference: "email", idempotencyKey: `fixture-${Date.now()}-abcdefgh` });
const o = svc.opportunityByRef(ref)!;
const { token } = br.createBriefing(o.id);
await br.runBriefing(o.id, null, { ctx: { accountId: "x", workspaceId: "x", companyId: null }, write: async () => FIXTURE });
// A second, revoked briefing to test the "no longer available" page.
const { ref: ref2 } = svc.createFromIntake({ problem: "Second fixture problem for revocation.", context: {}, name: "Other", email: "other@example.com", companyName: null, website: null, role: null, phone: null, region: null, contactPreference: "email", idempotencyKey: `fixture2-${Date.now()}-abcdefgh` });
const o2 = svc.opportunityByRef(ref2)!;
const t2 = br.createBriefing(o2.id).token!;
br.revokeLink(br.briefingFor(o2.id)!.id);
console.log(JSON.stringify({ token, opportunityId: o.id, revokedToken: t2 }));
