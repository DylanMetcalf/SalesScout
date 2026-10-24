/**
 * Opportunity content shapes, shared by server and client. AI output is always
 * stored separately from what the customer told us, and labelled as such.
 */

export const STAGES = ["new", "reviewing", "discovery", "proposal", "accepted", "building", "delivered", "lost", "declined", "archived"] as const;
export type Stage = (typeof STAGES)[number];
export const OPEN_STAGES: Stage[] = ["new", "reviewing", "discovery", "proposal", "accepted", "building"];

export const STAGE_META: Record<Stage, { label: string; tone: "info" | "accent" | "moderate" | "strong" | "neutral" | "weak" | "violet"; hint: string }> = {
  new: { label: "New", tone: "info", hint: "Just arrived. Read it and decide if it's worth a conversation." },
  reviewing: { label: "Reviewing", tone: "moderate", hint: "You're working out what's really going on." },
  discovery: { label: "Discovery", tone: "accent", hint: "In conversation with the customer." },
  proposal: { label: "Proposal", tone: "violet", hint: "A proposal is being prepared or is with them." },
  accepted: { label: "Accepted", tone: "strong", hint: "They said yes. Set up the project." },
  building: { label: "Building", tone: "strong", hint: "Work is under way." },
  delivered: { label: "Delivered", tone: "strong", hint: "Done and handed over." },
  lost: { label: "Lost", tone: "neutral", hint: "They went another way." },
  declined: { label: "Declined", tone: "neutral", hint: "Not a fit for us." },
  archived: { label: "Archived", tone: "neutral", hint: "Kept for reference." },
};

/** Optional context from the intake form. Every field is the customer's own words. */
export type ProblemContext = { business?: string; area?: string; current?: string; frequency?: string; ideal?: string };

export const AREAS = ["Sales and enquiries", "Quoting and documents", "Admin and finance", "Operations", "Customer service", "Reporting", "Team knowledge", "A new product idea", "Not sure"] as const;
export const FREQUENCIES = ["Every day", "Every week", "Every month", "Now and then"] as const;

export type Confidence = "low" | "medium" | "high";

export type Analysis = {
  customerSays: string;
  currentProcess: string;
  friction: string;
  impact: string;
  missingInfo: string[];
  questions: string[];
  directions: { title: string; why: string; confidence: Confidence }[];
  integrations: string[];
  risks: string[];
  nextAction: string;
  generatedAt: string;
};

export type Source = { url: string; title: string };

export type Research = {
  summary: string;
  offerings: string[];
  markets: string[];
  findings: { statement: string; kind: "observed" | "inferred"; sourceUrl: string | null }[];
  improvements: string[];
  questions: string[];
  gaps: string[];
  sources: Source[];
  researchedAt: string;
};

export type Visibility = {
  summary: string;
  /** Read directly from the site's HTML, robots.txt and sitemap by our own code. */
  observed: { finding: string; area: string; url: string | null }[];
  pagesChecked: string[];
  /** What a few web searches showed. Not rankings. */
  searchNotes: { note: string; sourceUrl: string | null }[];
  recommendations: { title: string; why: string; how: string; priority: "high" | "medium" | "low"; effort: "small" | "medium" | "large"; confidence: Confidence; measure: string }[];
  limitations: string[];
  sources: Source[];
  assessedAt: string;
};

/** Editable documents: plain text fields, so the operator can rewrite anything. */
export const BRIEF_FIELDS = [
  ["problem", "Problem statement"],
  ["currentProcess", "Current process"],
  ["desiredOutcome", "Desired outcome"],
  ["constraints", "Important constraints"],
  ["knownRequirements", "Known requirements"],
  ["unknownRequirements", "Still unknown"],
  ["approach", "Recommended approach"],
  ["features", "Potential features"],
  ["integrations", "Integrations that may be needed"],
  ["considerations", "Implementation considerations"],
  ["risks", "Risks and dependencies"],
  ["nextSteps", "Proposed next steps"],
  ["commercial", "Commercial considerations"],
] as const;

export const PROPOSAL_FIELDS = [
  ["problem", "The business problem"],
  ["situation", "Where things stand today"],
  ["outcomes", "What success looks like"],
  ["solution", "Proposed solution"],
  ["scope", "Scope and features"],
  ["deliverables", "Deliverables"],
  ["stages", "Implementation stages"],
  ["customerResponsibilities", "What we'll need from you"],
  ["dependencies", "Integrations and dependencies"],
  ["assumptions", "Assumptions"],
  ["exclusions", "Not included"],
  ["timeline", "Timeline"],
  ["commercialTerms", "Investment and terms"],
  ["support", "Ongoing support"],
  ["nextSteps", "Next steps"],
] as const;

export const PROJECT_FIELDS = [
  ["objectives", "Accepted problem and objectives"],
  ["scope", "Agreed scope"],
  ["requirements", "Requirements"],
  ["deliverables", "Deliverables"],
  ["milestones", "Milestones"],
  ["dependencies", "Customer dependencies"],
  ["decisions", "Decisions"],
] as const;

export type TextDoc = Record<string, string>;
export type ProposalStatus = "draft" | "ready" | "sent" | "accepted" | "declined";
export type ProjectStatus = "not_started" | "in_progress" | "on_hold" | "delivered";

export type ProductSignal = { candidate: boolean; category: string; components: string; notes: string };

export const DOC_KINDS = {
  assessment: "Problem assessment",
  briefing: "Company briefing",
  visibility: "Visibility assessment",
  solution_brief: "Solution brief",
  proposal: "Proposal",
  handover: "Project handover",
} as const;
export type DocKind = keyof typeof DOC_KINDS;
