"use server";

import { eq } from "drizzle-orm";
import * as z from "zod/v4";
import { db, t } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { attempt } from "./result";

const Profile = z.object({
  jobTitle: z.string().trim().max(100),
  signature: z.string().trim().max(1000),
  notifyOnKeep: z.boolean(),
});

/** Your sender profile (applied to outreach drafts) and email preferences. */
export async function saveProfileAction(input: z.input<typeof Profile>) {
  return attempt(async () => {
    const user = await getSessionUser();
    if (!user) throw new Error("Please sign in again.");
    const r = Profile.safeParse(input);
    if (!r.success) throw new Error(r.error.issues[0].message);
    db.update(t.users).set({ jobTitle: r.data.jobTitle || null, signature: r.data.signature || null, notifyOnKeep: r.data.notifyOnKeep }).where(eq(t.users.id, user.id)).run();
  });
}
