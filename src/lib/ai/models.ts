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
