import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.DATABASE_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ss-test-")), "test.db");
const { getDb } = await import("../src/lib/db/connection");
const t = await import("../src/lib/db/schema");
const { newId } = await import("../src/lib/ids");
const { createDemoCompany } = await import("../src/lib/services/demo");
const { eq } = await import("drizzle-orm");

const db = getDb();

function makeTenant(label: string) {
  const accountId = newId("acc");
  const userId = newId("usr");
  const workspaceId = newId("ws");
  db.insert(t.accounts).values({ id: accountId, name: label }).run();
  db.insert(t.users).values({ id: userId, accountId, email: `${label}-${userId}@test.dev`, name: label, passwordHash: "x" }).run();
  db.insert(t.workspaces).values({ id: workspaceId, accountId, name: label }).run();
  db.insert(t.workspaceMembers).values({ workspaceId, userId, role: "owner" }).run();
  const companyId = newId("co");
  db.insert(t.companies).values({ id: companyId, accountId, workspaceId, name: `${label} Co` }).run();
  return { accountId, userId, workspaceId, companyId };
}

const a = makeTenant("alpha");
const b = makeTenant("beta");

test("rows must name the workspace their company belongs to", () => {
  assert.throws(
    () => db.insert(t.prospects).values({ id: newId("pr"), companyId: a.companyId, workspaceId: b.workspaceId, name: "Leak", origin: "manual" }).run(),
    /tenant isolation/,
  );
});

test("valid company-scoped rows are accepted", () => {
  db.insert(t.prospects).values({ id: newId("pr"), companyId: a.companyId, workspaceId: a.workspaceId, name: "Fine", origin: "manual" }).run();
});

test("prospect children must belong to the prospect's company", () => {
  const pid = newId("pr");
  db.insert(t.prospects).values({ id: pid, companyId: a.companyId, workspaceId: a.workspaceId, name: "A's prospect", origin: "manual" }).run();
  assert.throws(
    () => db.insert(t.contacts).values({ id: newId("ct"), companyId: b.companyId, workspaceId: b.workspaceId, prospectId: pid, role: "CEO", relevance: "x", knowledge: "suggested", origin: "manual" }).run(),
    /tenant isolation/,
  );
});

test("moving a row to another tenant via UPDATE is rejected", () => {
  const pid = newId("pr");
  db.insert(t.prospects).values({ id: pid, companyId: a.companyId, workspaceId: a.workspaceId, name: "Mover", origin: "manual" }).run();
  assert.throws(() => db.update(t.prospects).set({ workspaceId: b.workspaceId }).where(eq(t.prospects.id, pid)).run(), /tenant isolation/);
});

test("a company can't be attached to another account's workspace", () => {
  assert.throws(
    () => db.insert(t.companies).values({ id: newId("co"), accountId: a.accountId, workspaceId: b.workspaceId, name: "Hijack" }).run(),
    /tenant isolation/,
  );
});

test("duplicate domains are rejected within a company but allowed across companies", () => {
  db.insert(t.prospects).values({ id: newId("pr"), companyId: a.companyId, workspaceId: a.workspaceId, name: "Dup", domain: "dup.example", origin: "manual" }).run();
  assert.throws(() => db.insert(t.prospects).values({ id: newId("pr"), companyId: a.companyId, workspaceId: a.workspaceId, name: "Dup 2", domain: "dup.example", origin: "manual" }).run());
  db.insert(t.prospects).values({ id: newId("pr"), companyId: b.companyId, workspaceId: b.workspaceId, name: "Dup", domain: "dup.example", origin: "manual" }).run();
});

test("the demo company seeds cleanly and marks everything as example data", () => {
  const id = createDemoCompany(db, { accountId: a.accountId, workspaceId: a.workspaceId, userId: a.userId, userName: "Alpha" });
  const prospects = db.select().from(t.prospects).where(eq(t.prospects.companyId, id)).all();
  assert.ok(prospects.length >= 8);
  assert.ok(prospects.every((p) => p.isExample && p.domain?.endsWith(".example")));
  const contacts = db.select().from(t.contacts).where(eq(t.contacts.companyId, id)).all();
  assert.ok(contacts.every((c) => !c.email || c.email.endsWith(".example")));
  assert.ok(contacts.every((c) => (c.name ? c.knowledge === "confirmed" && c.sourceUrl : c.knowledge === "suggested")));
});
