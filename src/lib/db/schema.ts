/**
 * Sales Scout data model.
 *
 * Tenancy: ACCOUNT → WORKSPACE → COMPANY → company data.
 * Every company-scoped row carries both `workspaceId` and `companyId`, and
 * database triggers (see drizzle/0001_tenant_guards.sql) reject rows whose
 * workspace/company pair does not belong together. The application layer
 * (src/lib/tenant) additionally filters every query by the active tenant.
 */
import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const id = () => text("id").primaryKey();
const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`);
const updatedAt = () =>
  integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`);
const json = <T>(name: string) => text(name, { mode: "json" }).$type<T>();

// Shared value types ---------------------------------------------------------

/** How well-supported a piece of knowledge is. Never present an inference as a fact. */
export type Knowledge = "confirmed" | "inferred" | "suggested" | "unknown";
export type FitLevel = "strong" | "moderate" | "weak" | "unknown";
export type FitDimension = { level: FitLevel; explanation: string };
export type FitAssessment = {
  company: FitDimension;
  industry: FitDimension;
  geography: FitDimension;
  need: FitDimension;
  contact: FitDimension;
  evidence: FitDimension;
};
export const CRM_STATUSES = [
  "new",
  "reviewed",
  "qualified",
  "contacted",
  "replied",
  "meeting",
  "opportunity",
  "won",
  "lost",
  "rejected",
] as const;
export type CrmStatus = (typeof CRM_STATUSES)[number];

export type JobStep = {
  key: string;
  label: string;
  status: "waiting" | "running" | "done" | "failed" | "skipped";
  detail?: string;
};

export type SearchInterpretation = {
  summary: string;
  industries: string[];
  companyTypes: string[];
  geographies: string[];
  companySizes: string[];
  buyerRoles: string[];
  keywords: string[];
  exclusions: string[];
  requested: number;
};

// Accounts & identity --------------------------------------------------------

export const accounts = sqliteTable("accounts", {
  id: id(),
  name: text("name").notNull(),
  /** Account-level memory: general preferences shared across workspaces. */
  preferences: json<Record<string, unknown>>("preferences").notNull().default({}),
  createdAt: createdAt(),
});

export const users = sqliteTable(
  "users",
  {
    id: id(),
    accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    lastWorkspaceId: text("last_workspace_id"),
    lastCompanyId: text("last_company_id"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const sessions = sqliteTable("sessions", {
  /** SHA-256 of the session token; the raw token only lives in the cookie. */
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: createdAt(),
});

// Workspaces -----------------------------------------------------------------

export const workspaces = sqliteTable(
  "workspaces",
  {
    id: id(),
    accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color").notNull().default("teal"),
    /** Workspace memory: context shared by all companies in the workspace. */
    context: text("context"),
    aiSettings: json<{ researchDepth?: 1 | 2 | 3 }>("ai_settings").notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [index("workspaces_account_idx").on(t.accountId)],
);

export const workspaceMembers = sqliteTable(
  "workspace_members",
  {
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "admin", "member"] }).notNull().default("member"),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.userId] })],
);

// Companies & Company Brain --------------------------------------------------

export const companies = sqliteTable(
  "companies",
  {
    id: id(),
    accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    website: text("website"),
    description: text("description"),
    /** One-paragraph synthesis of the Company Brain. */
    summary: text("summary"),
    brainStatus: text("brain_status", { enum: ["empty", "analysing", "review", "ready", "failed"] })
      .notNull()
      .default("empty"),
    brainAnalysedAt: integer("brain_analysed_at", { mode: "timestamp_ms" }),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("companies_workspace_idx").on(t.workspaceId)],
);

export const BRAIN_SECTIONS = ["business", "customer", "problem", "market", "positioning", "exclusions"] as const;
export type BrainSection = (typeof BRAIN_SECTIONS)[number];

/** A single editable statement in the Company Brain, with its provenance. */
export const brainFacts = sqliteTable(
  "brain_facts",
  {
    id: id(),
    workspaceId: text("workspace_id").notNull(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    section: text("section", { enum: BRAIN_SECTIONS }).notNull(),
    field: text("field").notNull(),
    value: text("value").notNull(),
    knowledge: text("knowledge", { enum: ["confirmed", "inferred", "suggested", "unknown"] }).notNull(),
    rationale: text("rationale"),
    sourceIds: json<string[]>("source_ids").notNull().default([]),
    origin: text("origin", { enum: ["ai", "user", "extraction"] }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("brain_facts_company_idx").on(t.companyId, t.section)],
);

export type SourceKind = "website" | "page" | "social" | "document" | "web_research" | "note";
export type SourceStatus =
  | "connected"
  | "analysed"
  | "pending"
  | "available"
  | "requires_permission"
  | "disabled"
  | "unavailable"
  | "failed";

export const sources = sqliteTable(
  "sources",
  {
    id: id(),
    workspaceId: text("workspace_id").notNull(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    kind: text("kind").$type<SourceKind>().notNull(),
    /** e.g. services, about, case_studies for pages; linkedin, instagram for social. */
    subtype: text("subtype"),
    label: text("label").notNull(),
    url: text("url"),
    status: text("status").$type<SourceStatus>().notNull().default("pending"),
    statusDetail: text("status_detail"),
    /** Plain text actually read from the source (capped). Null if never accessed. */
    extractedText: text("extracted_text"),
    /** Pages actually read, for website sources. */
    pagesRead: json<{ url: string; title: string }[]>("pages_read").notNull().default([]),
    lastAnalysedAt: integer("last_analysed_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
  },
  (t) => [index("sources_company_idx").on(t.companyId)],
);

export const documents = sqliteTable("documents", {
  id: id(),
  workspaceId: text("workspace_id").notNull(),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  sourceId: text("source_id").notNull().references(() => sources.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  storagePath: text("storage_path").notNull(),
  createdAt: createdAt(),
});

// Integrations ---------------------------------------------------------------

export const integrationAccounts = sqliteTable("integration_accounts", {
  id: id(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  companyId: text("company_id").references(() => companies.id, { onDelete: "cascade" }),
  /** Provider key from the integration registry (src/lib/integrations). */
  provider: text("provider").notNull(),
  label: text("label").notNull(),
  status: text("status", { enum: ["not_connected", "requires_credentials", "connected", "error"] })
    .notNull()
    .default("not_connected"),
  createdAt: createdAt(),
});

// Market discovery & strategies ---------------------------------------------

export const marketOpportunities = sqliteTable(
  "market_opportunities",
  {
    id: id(),
    workspaceId: text("workspace_id").notNull(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    reasoning: text("reasoning").notNull(),
    knowledge: text("knowledge", { enum: ["confirmed", "inferred", "suggested", "unknown"] }).notNull().default("suggested"),
    industries: json<string[]>("industries").notNull().default([]),
    companyTypes: json<string[]>("company_types").notNull().default([]),
    buyerRoles: json<string[]>("buyer_roles").notNull().default([]),
    jobTitles: json<string[]>("job_titles").notNull().default([]),
    geographies: json<string[]>("geographies").notNull().default([]),
    useCases: json<string[]>("use_cases").notNull().default([]),
    keywords: json<string[]>("keywords").notNull().default([]),
    status: text("status", { enum: ["suggested", "saved", "accepted", "dismissed"] }).notNull().default("suggested"),
    strategyId: text("strategy_id"),
    createdAt: createdAt(),
  },
  (t) => [index("market_opps_company_idx").on(t.companyId)],
);

export const leadStrategies = sqliteTable(
  "lead_strategies",
  {
    id: id(),
    workspaceId: text("workspace_id").notNull(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    industries: json<string[]>("industries").notNull().default([]),
    companyTypes: json<string[]>("company_types").notNull().default([]),
    geographies: json<string[]>("geographies").notNull().default([]),
    companySizes: json<string[]>("company_sizes").notNull().default([]),
    buyerRoles: json<string[]>("buyer_roles").notNull().default([]),
    keywords: json<string[]>("keywords").notNull().default([]),
    exclusions: json<string[]>("exclusions").notNull().default([]),
    notes: text("notes"),
    status: text("status", { enum: ["active", "paused", "archived"] }).notNull().default("active"),
    origin: text("origin", { enum: ["market_discovery", "user"] }).notNull().default("user"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("strategies_company_idx").on(t.companyId)],
);

// Search runs & prospects ----------------------------------------------------

export const searchRuns = sqliteTable(
  "search_runs",
  {
    id: id(),
    workspaceId: text("workspace_id").notNull(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    strategyId: text("strategy_id"),
    similarToProspectId: text("similar_to_prospect_id"),
    mode: text("mode", { enum: ["discover", "specific", "similar"] }).notNull(),
    title: text("title").notNull(),
    query: text("query").notNull(),
    interpretation: json<SearchInterpretation>("interpretation"),
    status: text("status", { enum: ["interpreting", "interpreted", "running", "completed", "partial", "failed"] })
      .notNull()
      .default("interpreting"),
    requested: integer("requested").notNull().default(10),
    discovered: integer("discovered").notNull().default(0),
    duplicates: integer("duplicates").notNull().default(0),
    relevant: integer("relevant").notNull().default(0),
    rejected: integer("rejected").notNull().default(0),
    error: text("error"),
    jobId: text("job_id"),
    createdByUserId: text("created_by_user_id"),
    createdAt: createdAt(),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("search_runs_company_idx").on(t.companyId)],
);

export const prospects = sqliteTable(
  "prospects",
  {
    id: id(),
    workspaceId: text("workspace_id").notNull(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    searchRunId: text("search_run_id"),
    strategyId: text("strategy_id"),
    name: text("name").notNull(),
    /** Normalised registrable domain, used for duplicate protection. */
    domain: text("domain"),
    website: text("website"),
    industry: text("industry"),
    location: text("location"),
    whatTheyDo: text("what_they_do"),
    whyRelevant: text("why_relevant"),
    potentialOpportunity: text("potential_opportunity"),
    suggestedNextStep: text("suggested_next_step"),
    fit: json<FitAssessment>("fit"),
    confirmedFacts: json<string[]>("confirmed_facts").notNull().default([]),
    inferences: json<string[]>("inferences").notNull().default([]),
    unknowns: json<string[]>("unknowns").notNull().default([]),
    recentActivity: json<{ title: string; url?: string; date?: string }[]>("recent_activity").notNull().default([]),
    status: text("status").$type<CrmStatus>().notNull().default("new"),
    /** Whether the user has moved this prospect into their CRM/pipeline. */
    inCrm: integer("in_crm", { mode: "boolean" }).notNull().default(false),
    vetting: text("vetting", {
      enum: ["discovered", "identity_checked", "researched", "qualified", "presented", "failed"],
    })
      .notNull()
      .default("discovered"),
    researchDepth: integer("research_depth").notNull().default(1),
    ownerUserId: text("owner_user_id"),
    lastContactAt: integer("last_contact_at", { mode: "timestamp_ms" }),
    nextFollowUpAt: integer("next_follow_up_at", { mode: "timestamp_ms" }),
    origin: text("origin", { enum: ["web_research", "manual", "similar", "demo", "import"] }).notNull(),
    rejectionReason: text("rejection_reason"),
    isExample: integer("is_example", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("prospects_company_idx").on(t.companyId, t.status),
    uniqueIndex("prospects_company_domain_idx").on(t.companyId, t.domain),
  ],
);

export const evidence = sqliteTable(
  "evidence",
  {
    id: id(),
    workspaceId: text("workspace_id").notNull(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    prospectId: text("prospect_id").notNull().references(() => prospects.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["website", "search_result", "news", "profile", "directory", "document"] }).notNull(),
    title: text("title").notNull(),
    url: text("url"),
    snippet: text("snippet"),
    supports: text("supports"),
    createdAt: createdAt(),
  },
  (t) => [index("evidence_prospect_idx").on(t.prospectId)],
);

export const contacts = sqliteTable(
  "contacts",
  {
    id: id(),
    workspaceId: text("workspace_id").notNull(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    prospectId: text("prospect_id").notNull().references(() => prospects.id, { onDelete: "cascade" }),
    name: text("name"),
    role: text("role").notNull(),
    email: text("email"),
    phone: text("phone"),
    profileUrl: text("profile_url"),
    relevance: text("relevance").notNull(),
    /** Where the person was actually found. Required for AI-found contacts. */
    sourceUrl: text("source_url"),
    /** confirmed = named person found in a source; suggested = a role worth finding. */
    knowledge: text("knowledge", { enum: ["confirmed", "inferred", "suggested", "unknown"] }).notNull(),
    origin: text("origin", { enum: ["web_research", "manual", "demo"] }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("contacts_prospect_idx").on(t.prospectId)],
);

// Sales workflow -------------------------------------------------------------

export type ActivityType = "note" | "status" | "outreach" | "call" | "email" | "meeting" | "research" | "created" | "feedback" | "follow_up" | "export";

export const activities = sqliteTable(
  "activities",
  {
    id: id(),
    workspaceId: text("workspace_id").notNull(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    prospectId: text("prospect_id").references(() => prospects.id, { onDelete: "cascade" }),
    userId: text("user_id"),
    type: text("type", {
      enum: ["note", "status", "outreach", "call", "email", "meeting", "research", "created", "feedback", "follow_up", "export"],
    }).notNull(),
    title: text("title").notNull(),
    body: text("body"),
    createdAt: createdAt(),
  },
  (t) => [index("activities_prospect_idx").on(t.prospectId), index("activities_company_idx").on(t.companyId)],
);

export const followUps = sqliteTable(
  "follow_ups",
  {
    id: id(),
    workspaceId: text("workspace_id").notNull(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    prospectId: text("prospect_id").notNull().references(() => prospects.id, { onDelete: "cascade" }),
    contactId: text("contact_id"),
    userId: text("user_id"),
    title: text("title").notNull(),
    notes: text("notes"),
    dueAt: integer("due_at", { mode: "timestamp_ms" }).notNull(),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
  },
  (t) => [index("follow_ups_company_idx").on(t.companyId, t.dueAt)],
);

export const outreachDrafts = sqliteTable("outreach_drafts", {
  id: id(),
  workspaceId: text("workspace_id").notNull(),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  prospectId: text("prospect_id").notNull().references(() => prospects.id, { onDelete: "cascade" }),
  contactId: text("contact_id"),
  userId: text("user_id"),
  channel: text("channel", { enum: ["email", "linkedin", "call", "follow_up"] }).notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  /** What Sales Scout originally generated, kept to learn from user edits. */
  originalBody: text("original_body").notNull(),
  generatedBy: text("generated_by", { enum: ["ai", "template"] }).notNull(),
  status: text("status", { enum: ["draft", "edited", "handed_off"] }).notNull().default("draft"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const salesBriefs = sqliteTable("sales_briefs", {
  id: id(),
  workspaceId: text("workspace_id").notNull(),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  prospectId: text("prospect_id").notNull().references(() => prospects.id, { onDelete: "cascade" }),
  content: json<{
    headline: string;
    whatTheyDo: string;
    whyRelevant: string;
    opportunity: string;
    people: string[];
    evidence: string[];
    unknowns: string[];
    nextStep: string;
  }>("content").notNull(),
  generatedBy: text("generated_by", { enum: ["ai", "assembled"] }).notNull(),
  createdAt: createdAt(),
});

// Learning -------------------------------------------------------------------

export const feedback = sqliteTable(
  "feedback",
  {
    id: id(),
    workspaceId: text("workspace_id").notNull(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    prospectId: text("prospect_id"),
    searchRunId: text("search_run_id"),
    userId: text("user_id"),
    kind: text("kind", {
      enum: ["not_relevant", "already_known", "exclude", "keep", "competitor", "correction", "outcome", "role_removed"],
    }).notNull(),
    /** What the signal is about, e.g. industry, company_type, role, geography. */
    dimension: text("dimension"),
    value: text("value"),
    reason: text("reason"),
    createdAt: createdAt(),
  },
  (t) => [index("feedback_company_idx").on(t.companyId)],
);

export const exclusions = sqliteTable(
  "exclusions",
  {
    id: id(),
    workspaceId: text("workspace_id").notNull(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["company", "domain", "industry", "role", "geography", "competitor", "customer"] }).notNull(),
    value: text("value").notNull(),
    reason: text("reason"),
    createdAt: createdAt(),
  },
  (t) => [index("exclusions_company_idx").on(t.companyId)],
);

export const learningSuggestions = sqliteTable("learning_suggestions", {
  id: id(),
  workspaceId: text("workspace_id").notNull(),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  kind: text("kind", { enum: ["strategy", "brain", "writing", "exclusion"] }).notNull(),
  /** Stable key so the same pattern is not suggested twice. */
  signature: text("signature").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  change: json<Record<string, unknown>>("change").notNull(),
  status: text("status", { enum: ["pending", "applied", "ignored"] }).notNull().default("pending"),
  createdAt: createdAt(),
});

export const writingPreferences = sqliteTable("writing_preferences", {
  id: id(),
  workspaceId: text("workspace_id").notNull(),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  /** Preferences are scoped: to one user within a company, or to the whole company. */
  scope: text("scope", { enum: ["user", "company"] }).notNull(),
  userId: text("user_id"),
  rule: text("rule").notNull(),
  example: text("example"),
  createdAt: createdAt(),
});

// Exports, AI, audit, jobs ---------------------------------------------------

export const exportsLog = sqliteTable("exports", {
  id: id(),
  workspaceId: text("workspace_id").notNull(),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  userId: text("user_id"),
  format: text("format", { enum: ["csv", "xlsx", "report"] }).notNull(),
  rowCount: integer("row_count").notNull(),
  filters: json<Record<string, unknown>>("filters").notNull().default({}),
  createdAt: createdAt(),
});

export const aiInteractions = sqliteTable(
  "ai_interactions",
  {
    id: id(),
    accountId: text("account_id").notNull(),
    workspaceId: text("workspace_id").notNull(),
    companyId: text("company_id"),
    agent: text("agent").notNull(),
    purpose: text("purpose").notNull(),
    model: text("model").notNull(),
    status: text("status", { enum: ["ok", "error", "refused"] }).notNull(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    webSearches: integer("web_searches").notNull().default(0),
    durationMs: integer("duration_ms").notNull().default(0),
    error: text("error"),
    createdAt: createdAt(),
  },
  (t) => [index("ai_interactions_ws_idx").on(t.workspaceId, t.createdAt)],
);

export const auditLog = sqliteTable(
  "audit_log",
  {
    id: id(),
    accountId: text("account_id").notNull(),
    workspaceId: text("workspace_id"),
    companyId: text("company_id"),
    userId: text("user_id"),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    action: text("action").notNull(),
    /** Who or what caused this: a person, the AI, web research, or the system. */
    source: text("source", { enum: ["user", "ai", "web_research", "system", "extraction"] }).notNull(),
    summary: text("summary").notNull(),
    detail: json<Record<string, unknown>>("detail"),
    createdAt: createdAt(),
  },
  (t) => [index("audit_entity_idx").on(t.entityType, t.entityId), index("audit_company_idx").on(t.companyId)],
);

export const jobs = sqliteTable("jobs", {
  id: id(),
  accountId: text("account_id").notNull(),
  workspaceId: text("workspace_id").notNull(),
  companyId: text("company_id"),
  type: text("type").notNull(),
  status: text("status", { enum: ["queued", "running", "completed", "partial", "failed"] }).notNull().default("queued"),
  steps: json<JobStep[]>("steps").notNull().default([]),
  result: json<Record<string, unknown>>("result"),
  error: text("error"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: integer("window_start").notNull(),
  count: integer("count").notNull(),
});
