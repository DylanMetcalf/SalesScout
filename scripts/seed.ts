/**
 * Creates a demo login with a fully populated example company.
 *   Email:    demo@salesscout.app
 *   Password: salesscout-demo
 */
import { eq } from "drizzle-orm";
import { getDb } from "../src/lib/db/connection";
import * as t from "../src/lib/db/schema";
import { hashPassword } from "../src/lib/auth/password";
import { newId } from "../src/lib/ids";
import { createDemoCompany } from "../src/lib/services/demo";

async function main() {
  const db = getDb();
  const email = "demo@salesscout.app";
  if (db.select().from(t.users).where(eq(t.users.email, email)).get()) {
    console.log("Demo user already exists.");
    return;
  }
  const accountId = newId("acc");
  const userId = newId("usr");
  const workspaceId = newId("ws");
  db.insert(t.accounts).values({ id: accountId, name: "Demo account" }).run();
  db.insert(t.users).values({ id: userId, accountId, email, name: "Alex Morgan", passwordHash: await hashPassword("salesscout-demo"), lastWorkspaceId: workspaceId }).run();
  db.insert(t.workspaces).values({ id: workspaceId, accountId, name: "Demo workspace", description: "Example data to explore Sales Scout" }).run();
  db.insert(t.workspaceMembers).values({ workspaceId, userId, role: "owner" }).run();
  const companyId = createDemoCompany(db, { accountId, workspaceId, userId, userName: "Alex Morgan" });
  db.update(t.users).set({ lastCompanyId: companyId }).where(eq(t.users.id, userId)).run();
  console.log(`Seeded demo user ${email} / salesscout-demo`);
}

main();
