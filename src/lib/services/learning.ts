import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { newId } from "@/lib/ids";
import { audit } from "@/lib/audit";
import { inCompany, tenantCols, type CompanyTenant } from "@/lib/tenant";

/*
 * The Learning Agent. It watches user decisions (rejections, removed roles,
 * edits to drafts) and proposes changes — it never changes strategy or the
 * Company Brain on its own. Every suggestion needs the user's approval.
 */

const THRESHOLD = 3;

/** Phrases salespeople commonly strip out of generated drafts. */
const GENERIC_PHRASES = [
  "I hope this message finds you well",
  "I hope this email finds you well",
  "I hope you're doing well",
  "I hope you are doing well",
  "I wanted to reach out",
  "I'm reaching out because",
  "Just following up",
  "Just checking in",
  "touch base",
  "synergy",
  "circle back",
  "Don't hesitate to reach out",
  "Looking forward to hearing from you",
  "I'd love to pick your brain",
  "quick call",
];

function suggest(tenant: CompanyTenant, s: { kind: "strategy" | "brain" | "writing" | "exclusion"; signature: string; title: string; body: string; change: Record<string, unknown> }) {
  const exists = db
    .select({ id: t.learningSuggestions.id })
    .from(t.learningSuggestions)
    .where(inCompany(t.learningSuggestions, tenant, eq(t.learningSuggestions.signature, s.signature)))
    .get();
  if (exists) return;
  db.insert(t.learningSuggestions).values({ id: newId("ls"), ...tenantCols(tenant), ...s }).run();
}

/** Looks for repeated rejection patterns worth turning into exclusions. */
export function learnFromFeedback(tenant: CompanyTenant) {
  const rows = db
    .select({ industry: t.prospects.industry, kind: t.feedback.kind, strategyId: t.prospects.strategyId })
    .from(t.feedback)
    .innerJoin(t.prospects, eq(t.prospects.id, t.feedback.prospectId))
    .where(inCompany(t.feedback, tenant, eq(t.feedback.kind, "not_relevant")))
    .all();
  const counts = new Map<string, { n: number; strategyId: string | null }>();
  for (const r of rows) {
    if (!r.industry) continue;
    const key = r.industry.trim();
    const c = counts.get(key) ?? { n: 0, strategyId: r.strategyId };
    counts.set(key, { n: c.n + 1, strategyId: c.strategyId ?? r.strategyId });
  }
  for (const [industry, { n, strategyId }] of counts) {
    if (n < THRESHOLD) continue;
    const strategy = strategyId ? db.select().from(t.leadStrategies).where(inCompany(t.leadStrategies, tenant, eq(t.leadStrategies.id, strategyId))).get() : undefined;
    suggest(tenant, {
      kind: strategy ? "strategy" : "exclusion",
      signature: `reject-industry:${industry.toLowerCase()}:${strategyId ?? "none"}`,
      title: strategy ? `Stop looking in ${industry} for "${strategy.name}"?` : `Exclude ${industry}?`,
      body: `I noticed you've marked ${n} ${industry} companies as not relevant. Would you like me to ${strategy ? `exclude ${industry} from the "${strategy.name}" strategy` : `stop suggesting ${industry} companies`}?`,
      change: strategy ? { type: "strategy_exclusion", strategyId: strategy.id, value: industry } : { type: "exclusion", kind: "industry", value: industry },
    });
  }

  const roles = db.select({ value: t.feedback.value }).from(t.feedback).where(inCompany(t.feedback, tenant, eq(t.feedback.kind, "role_removed"))).all();
  const roleCounts = new Map<string, number>();
  for (const r of roles) if (r.value) roleCounts.set(r.value.toLowerCase(), (roleCounts.get(r.value.toLowerCase()) ?? 0) + 1);
  for (const [role, n] of roleCounts) {
    if (n < THRESHOLD) continue;
    suggest(tenant, {
      kind: "brain",
      signature: `remove-role:${role}`,
      title: `Stop suggesting "${role}" contacts?`,
      body: `You've removed ${n} contacts with the role "${role}". Should I add it to the roles to avoid in your Company Brain?`,
      change: { type: "brain_fact", section: "exclusions", field: "roles_to_avoid", value: role },
    });
  }
}

/** Compares what we generated with what the user kept, to learn writing style. */
export function learnFromEdit(tenant: CompanyTenant, original: string, edited: string) {
  const lower = edited.toLowerCase();
  const removed = GENERIC_PHRASES.filter((p) => original.toLowerCase().includes(p.toLowerCase()) && !lower.includes(p.toLowerCase()));
  for (const phrase of removed) {
    db.insert(t.feedback)
      .values({ id: newId("fb"), ...tenantCols(tenant), userId: tenant.user.id, kind: "correction", dimension: "writing_phrase_removed", value: phrase })
      .run();
  }
  const history = db
    .select({ value: t.feedback.value })
    .from(t.feedback)
    .where(inCompany(t.feedback, tenant, and(eq(t.feedback.dimension, "writing_phrase_removed"), eq(t.feedback.userId, tenant.user.id))))
    .all();
  const counts = new Map<string, number>();
  for (const h of history) if (h.value) counts.set(h.value, (counts.get(h.value) ?? 0) + 1);
  for (const [phrase, n] of counts) {
    if (n < 2) continue;
    suggest(tenant, {
      kind: "writing",
      signature: `phrase:${tenant.user.id}:${phrase.toLowerCase()}`,
      title: `Leave out "${phrase}"?`,
      body: `You've removed "${phrase}" from ${n} drafts. Generic openings like this seem inconsistent with how you write. Should I stop using it in your drafts?`,
      change: { type: "writing_preference", rule: `Don't use the phrase "${phrase}" or similar generic filler.`, scope: "user" },
    });
  }
  // Consistently shortening drafts is a signal too.
  if (edited.length < original.length * 0.6 && original.length > 300) {
    db.insert(t.feedback).values({ id: newId("fb"), ...tenantCols(tenant), userId: tenant.user.id, kind: "correction", dimension: "writing_shortened", value: "shorter" }).run();
    const shortened = db.select({ id: t.feedback.id }).from(t.feedback).where(inCompany(t.feedback, tenant, and(eq(t.feedback.dimension, "writing_shortened"), eq(t.feedback.userId, tenant.user.id)))).all().length;
    if (shortened >= 2)
      suggest(tenant, {
        kind: "writing",
        signature: `shorter:${tenant.user.id}`,
        title: "Write shorter drafts?",
        body: `You've cut ${shortened} drafts down substantially. Should I aim for noticeably shorter messages?`,
        change: { type: "writing_preference", rule: "Keep messages short: 3-5 sentences, no preamble.", scope: "user" },
      });
  }
}

export function pendingSuggestions(tenant: CompanyTenant) {
  return db
    .select()
    .from(t.learningSuggestions)
    .where(inCompany(t.learningSuggestions, tenant, eq(t.learningSuggestions.status, "pending")))
    .orderBy(desc(t.learningSuggestions.createdAt))
    .all();
}

/** Applies a suggestion the user approved. */
export function applySuggestion(tenant: CompanyTenant, id: string) {
  const s = db.select().from(t.learningSuggestions).where(inCompany(t.learningSuggestions, tenant, eq(t.learningSuggestions.id, id))).get();
  if (!s || s.status !== "pending") return;
  const c = s.change as Record<string, string>;
  if (c.type === "strategy_exclusion") {
    const st = db.select().from(t.leadStrategies).where(inCompany(t.leadStrategies, tenant, eq(t.leadStrategies.id, c.strategyId))).get();
    if (st) db.update(t.leadStrategies).set({ exclusions: [...new Set([...st.exclusions, c.value])], industries: st.industries.filter((i) => i.toLowerCase() !== c.value.toLowerCase()), updatedAt: new Date() }).where(eq(t.leadStrategies.id, st.id)).run();
  } else if (c.type === "exclusion") {
    db.insert(t.exclusions).values({ id: newId("ex"), ...tenantCols(tenant), kind: c.kind as "industry", value: c.value, reason: "Learned from your feedback" }).run();
  } else if (c.type === "brain_fact") {
    db.insert(t.brainFacts).values({ id: newId("bf"), ...tenantCols(tenant), section: c.section as "exclusions", field: c.field, value: c.value, knowledge: "confirmed", rationale: "You approved this after repeated feedback", origin: "user" }).run();
  } else if (c.type === "writing_preference") {
    db.insert(t.writingPreferences).values({ id: newId("wp"), ...tenantCols(tenant), scope: c.scope === "company" ? "company" : "user", userId: c.scope === "company" ? null : tenant.user.id, rule: c.rule }).run();
  }
  db.update(t.learningSuggestions).set({ status: "applied" }).where(eq(t.learningSuggestions.id, s.id)).run();
  audit(tenant, { entityType: "learning_suggestion", entityId: s.id, action: "applied", source: "user", summary: `Applied: ${s.title}`, detail: s.change });
}

export function ignoreSuggestion(tenant: CompanyTenant, id: string) {
  db.update(t.learningSuggestions).set({ status: "ignored" }).where(inCompany(t.learningSuggestions, tenant, eq(t.learningSuggestions.id, id))).run();
}

/** Writing preferences that apply to this user in this company. */
export function preferencesFor(tenant: CompanyTenant) {
  return db
    .select()
    .from(t.writingPreferences)
    .where(inCompany(t.writingPreferences, tenant))
    .all()
    .filter((p) => p.scope === "company" || p.userId === tenant.user.id);
}
