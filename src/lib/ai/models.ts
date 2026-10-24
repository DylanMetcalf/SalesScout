/**
 * Which model each agent uses. One place to route work, so a cheaper model can be
 * trialled for one agent (e.g. SALES_SCOUT_MODEL_OUTREACH=…) and compared on cost
 * and quality in Admin → Operations before it becomes the default. Unset = the
 * default model (SALES_SCOUT_MODEL), i.e. today's behaviour.
 */
export const DEFAULT_MODEL = process.env.SALES_SCOUT_MODEL || "claude-opus-5-5";

export function modelFor(agent: string): string {
  return process.env[`SALES_SCOUT_MODEL_${agent.toUpperCase()}`] || DEFAULT_MODEL;
}

/** Every AI step, in pipeline order, with the name operators see. Each can be paused on its own. */
export const AGENTS = {
  company_understanding: "Company Brain analysis",
  market_discovery: "Market suggestions",
  prospect_discovery: "Prospect discovery",
  company_research: "Prospect research",
  company_research_deep: "Deep prospect research",
  qualification: "Qualification",
  outreach: "Outreach drafts",
  customer_briefing: "Customer briefings",
  opportunity_analysis: "Problem analysis",
  opportunity_research: "Company intelligence",
  solution_design: "Solution briefs and proposals",
  visibility: "Visibility assessments",
} as const;
export type Agent = keyof typeof AGENTS;
