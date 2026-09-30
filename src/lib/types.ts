import type * as t from "@/lib/db/schema";

export type ProspectRow = typeof t.prospects.$inferSelect;
export type ContactRow = typeof t.contacts.$inferSelect;
export type EvidenceRow = typeof t.evidence.$inferSelect;

/** What the client needs to render a prospect card and its WHY panel. */
export type ProspectView = Pick<
  ProspectRow,
  | "id" | "name" | "website" | "industry" | "location" | "whatTheyDo" | "whyRelevant" | "potentialOpportunity" | "suggestedNextStep"
  | "fit" | "confirmedFacts" | "inferences" | "unknowns" | "status" | "inCrm" | "rejectionReason" | "isExample" | "researchDepth" | "origin"
> & {
  contacts: Pick<ContactRow, "id" | "name" | "role" | "relevance" | "knowledge" | "sourceUrl">[];
  evidence: Pick<EvidenceRow, "id" | "kind" | "title" | "url" | "snippet" | "supports">[];
  criteria?: { label: string; values: string[] }[];
};
