import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Module from "node:module";

// Stub "server-only" outside Next's bundle (same as key-resolution.test).
const resolve = (Module as unknown as { _resolveFilename: (...a: unknown[]) => string })._resolveFilename;
(Module as unknown as { _resolveFilename: (...a: unknown[]) => string })._resolveFilename = function (req: unknown, ...rest: unknown[]) {
  if (req === "server-only") return path.join(os.tmpdir(), "ss-server-only-stub.js");
  return resolve.call(this, req, ...rest);
};
fs.writeFileSync(path.join(os.tmpdir(), "ss-server-only-stub.js"), "");

process.env.DATABASE_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ss-opps-")), "test.db");
const { getDb } = await import("../src/lib/db/connection");
const t = await import("../src/lib/db/schema");
const svc = await import("../src/lib/opportunities/service");
const { checkPage, parseRobots, observe } = await import("../src/lib/opportunities/site-audit");
const { eq } = await import("drizzle-orm");
const db = getDb();

const input = (key: string) => ({
  problem: "We retype every order into three systems and things get missed.",
  context: { area: "Operations" },
  name: "Thandi Mokoena",
  email: "Thandi@Example.co.za",
  companyName: "Example Logistics",
  website: "example.co.za",
  role: null,
  phone: null,
  region: "Gauteng",
  contactPreference: "email" as const,
  idempotencyKey: key,
});

test("a submission is saved once, however often it's sent", () => {
  const a = svc.createFromIntake(input("key-aaaaaaaaaaaaaaaa"));
  const b = svc.createFromIntake(input("key-aaaaaaaaaaaaaaaa"));
  assert.equal(a.created, true);
  assert.equal(b.created, false);
  assert.equal(a.ref, b.ref);
  const rows = db.select().from(t.opportunities).where(eq(t.opportunities.idempotencyKey, "key-aaaaaaaaaaaaaaaa")).all();
  assert.equal(rows.length, 1);
  const o = rows[0];
  assert.equal(o.email, "thandi@example.co.za");
  assert.equal(o.website, "https://example.co.za/");
  assert.ok(o.consentAt, "consent time recorded");
  assert.equal(o.privacyVersion, svc.PRIVACY_VERSION);
  assert.notEqual(o.ref, o.id, "the public reference is not the record id");
  assert.equal(svc.itemsOf(o.id).filter((i) => i.kind === "activity").length, 1);
});

test("a visitor's reference shows only what they typed, and only for a week", () => {
  const { ref } = svc.createFromIntake(input("key-bbbbbbbbbbbbbbbb"));
  const s = svc.publicSummary(ref)!;
  assert.equal(s.firstName, "Thandi");
  assert.equal(s.problem, input("x").problem);
  assert.equal("analysis" in s || "research" in s || "id" in s, false);
  assert.equal(svc.publicSummary("not-a-real-reference"), null);
  db.update(t.opportunities).set({ createdAt: new Date(Date.now() - 8 * 86_400_000) }).where(eq(t.opportunities.ref, ref)).run();
  assert.equal(svc.publicSummary(ref), null);
});

test("call requests and booking clicks are recorded once", () => {
  const { ref } = svc.createFromIntake(input("key-cccccccccccccccc"));
  assert.equal(svc.recordVisitorStep(ref, "call_requested"), true);
  assert.equal(svc.recordVisitorStep(ref, "call_requested"), true);
  const o = svc.opportunityByRef(ref)!;
  assert.ok(o.callRequestedAt);
  assert.equal(svc.itemsOf(o.id).filter((i) => /get in touch/.test(i.body)).length, 1);
  assert.equal(svc.recordVisitorStep("unknown-ref-123", "booking_opened"), false);
});

test("documents are frozen as numbered versions", () => {
  const { ref } = svc.createFromIntake(input("key-dddddddddddddddd"));
  const o = svc.opportunityByRef(ref)!;
  const v1 = svc.snapshotDocument(o.id, "solution_brief", { fields: { problem: "first" } }, "op@example.com");
  const v2 = svc.snapshotDocument(o.id, "solution_brief", { fields: { problem: "second" } }, "op@example.com");
  assert.deepEqual([v1.version, v2.version], [1, 2]);
  assert.deepEqual(svc.getDocument(v1.id).content, { fields: { problem: "first" } });
  assert.equal(svc.documentsOf(o.id).length, 2);
});

test("stage changes are logged, and acceptance opens the project", () => {
  const { ref } = svc.createFromIntake(input("key-eeeeeeeeeeeeeeee"));
  const o = svc.opportunityByRef(ref)!;
  svc.setStage(o.id, "accepted", "op@example.com");
  const after = svc.getOpportunity(o.id);
  assert.equal(after.stage, "accepted");
  assert.equal(after.projectStatus, "not_started");
  assert.ok(svc.itemsOf(o.id).some((i) => /New to Accepted/.test(i.body)));
});

test("deleting an opportunity removes everything attached to it", () => {
  const { ref } = svc.createFromIntake(input("key-ffffffffffffffff"));
  const o = svc.opportunityByRef(ref)!;
  svc.snapshotDocument(o.id, "proposal", { fields: {} }, "op");
  svc.deleteOpportunity(o.id);
  assert.equal(svc.opportunityByRef(ref), null);
  assert.equal(db.select().from(t.opportunityItems).where(eq(t.opportunityItems.opportunityId, o.id)).all().length, 0);
  assert.equal(db.select().from(t.opportunityDocuments).where(eq(t.opportunityDocuments.opportunityId, o.id)).all().length, 0);
});

test("old website enquiries are copied into the pipeline exactly once", () => {
  db.insert(t.enquiries).values({ id: "enq_legacy1", name: "Old Lead", email: "old@example.com", message: "We sell valves to mines.", status: "contacted" }).run();
  const sql = fs.readFileSync(path.join(process.cwd(), "drizzle/0012_copy_enquiries.sql"), "utf8");
  const sqlite = (db as unknown as { $client: { exec: (s: string) => void } }).$client;
  sqlite.exec(sql);
  sqlite.exec(sql);
  const copied = db.select().from(t.opportunities).where(eq(t.opportunities.legacyEnquiryId, "enq_legacy1")).all();
  assert.equal(copied.length, 1);
  assert.equal(copied[0].stage, "reviewing");
  assert.equal(copied[0].consentAt, null, "legacy enquiries have no recorded consent");
  assert.equal(db.select().from(t.enquiries).where(eq(t.enquiries.id, "enq_legacy1")).all().length, 1, "originals untouched");
});

test("website checks read only what is in the HTML", () => {
  const html = `<!doctype html><html lang="en"><head><title>Acme Pumps | Industrial pumps in Gauteng</title>
    <meta name="description" content="Pumps and servicing."><meta name="viewport" content="width=device-width">
    <link rel="canonical" href="https://acme.co.za/"><meta property="og:title" content="Acme">
    <script type="application/ld+json">{"@context":"https://schema.org","@type":["Organization","LocalBusiness"]}</script></head>
    <body><h1>Acme Pumps</h1><h1>Second</h1><img src="a.png"><img src="b.png" alt="Pump"><a href="/about">About</a> ${"word ".repeat(200)}</body></html>`;
  const p = checkPage("https://acme.co.za/", html);
  assert.equal(p.title, "Acme Pumps | Industrial pumps in Gauteng");
  assert.equal(p.description, "Pumps and servicing.");
  assert.deepEqual(p.h1, ["Acme Pumps", "Second"]);
  assert.equal(p.canonical, "https://acme.co.za/");
  assert.equal(p.lang, "en");
  assert.deepEqual(p.schemaTypes.sort(), ["LocalBusiness", "Organization"]);
  assert.equal(p.imagesWithoutAlt, 1);
  assert.ok(p.links.includes("https://acme.co.za/about"));

  const all = parseRobots("User-agent: *\nDisallow: /\nSitemap: https://x.co/sm.xml");
  assert.equal(all.blocksAll, true);
  assert.deepEqual(all.sitemaps, ["https://x.co/sm.xml"]);
  assert.equal(parseRobots("User-agent: Googlebot\nDisallow: /\nUser-agent: *\nDisallow: /admin").blocksAll, false);

  const { links: _links, ...page } = p;
  const obs = observe({ home: "https://acme.co.za/", https: true, robotsTxt: { found: true, blocksAll: false, sitemaps: [] }, sitemap: { url: "https://acme.co.za/sitemap.xml", found: false, urls: null }, llmsTxt: false, pages: [page], failures: [], checkedAt: "" });
  assert.ok(obs.some((o) => /2 main \(H1\) headings/.test(o.finding)));
  assert.ok(obs.some((o) => /No XML sitemap/.test(o.finding)));
  assert.ok(obs.some((o) => /1 of 2 images have no alt text/.test(o.finding)));
  assert.ok(!obs.some((o) => /no meta description/i.test(o.finding)));
});

test("robots.txt groups, paths and our own user agent are respected", () => {
  // Consecutive User-agent lines share one group.
  assert.equal(parseRobots("User-agent: *\nUser-agent: OtherBot\nDisallow: /").blocksAll, true);
  const r = parseRobots("User-agent: *\nDisallow: /private\nAllow: /private/ok\nDisallow: /*.pdf$");
  assert.equal(r.allowed("/about"), true);
  assert.equal(r.allowed("/private/x"), false);
  assert.equal(r.allowed("/private/ok/page"), true);
  assert.equal(r.allowed("/files/a.pdf"), false);
  // A group naming us wins over "*".
  assert.equal(parseRobots("User-agent: *\nDisallow:\nUser-agent: SalesScoutBot\nDisallow: /").blocksAll, true);
});

test("a hostile page with thousands of unclosed tags is parsed quickly", () => {
  const evil = "<html><head><title>x</title></head><body>" + "<script>".repeat(40_000) + "<h1>".repeat(40_000) + "</body></html>";
  const started = Date.now();
  const p = checkPage("https://evil.example/", evil);
  assert.ok(Date.now() - started < 1500, `took ${Date.now() - started}ms`);
  assert.equal(p.title, "x");
});

test("visitor references stop working after a week, for every action", () => {
  const { ref } = svc.createFromIntake(input("key-gggggggggggggggg"));
  db.update(t.opportunities).set({ createdAt: new Date(Date.now() - 8 * 86_400_000) }).where(eq(t.opportunities.ref, ref)).run();
  assert.equal(svc.recordVisitorStep(ref, "call_requested"), false);
  assert.equal(svc.opportunityByRef(ref)!.callRequestedAt, null);
});
