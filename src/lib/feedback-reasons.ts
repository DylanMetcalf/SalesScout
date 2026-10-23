/** Structured problem reports. Kept separate from "not relevant" (a preference), so facts and tastes don't mix. */
export const PROBLEM_REASONS = {
  wrong_company: "Wrong company identified",
  duplicate: "Duplicate of another prospect",
  existing_customer: "Already a customer",
  already_contacted: "Already contacted before",
  wrong_person: "Wrong decision-maker",
  wrong_title: "Incorrect job title",
  invalid_email: "Email address doesn't work",
  wrong_phone: "Phone number is wrong",
  stale: "Information is out of date",
  unsupported_claim: "A claim isn't supported by the sources",
  other: "Something else",
} as const;
export type ProblemReason = keyof typeof PROBLEM_REASONS;

/** How an operator classifies a report. Only confirmed corrections say the data was wrong. */
export const RESOLUTIONS = {
  correction_confirmed: "Confirmed: our data was wrong",
  customer_preference: "Customer preference, not an error",
  policy_change: "Qualification rules need changing",
  duplicate: "Duplicate: now suppressed",
  not_an_issue: "Checked: no problem found",
} as const;
export type Resolution = keyof typeof RESOLUTIONS;
