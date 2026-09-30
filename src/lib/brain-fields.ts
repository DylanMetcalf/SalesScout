import type { BrainSection } from "@/lib/db/schema";

/** The Company Brain's structure: sections, and the fields inside each. */
export const BRAIN: Record<BrainSection, { title: string; question: string; fields: Record<string, string> }> = {
  business: {
    title: "Business",
    question: "What does the company do?",
    fields: {
      what_they_do: "What the company does",
      products: "Products",
      services: "Services",
      industries_served: "Industries served",
      locations: "Locations",
      business_model: "Business model",
    },
  },
  customer: {
    title: "Customers",
    question: "Who buys from you?",
    fields: {
      customer_types: "Existing customer types",
      ideal_customer: "Ideal customer profile",
      buyer_personas: "Buyer personas",
      decision_makers: "Decision makers",
      influencers: "Influencers",
      company_characteristics: "Typical company characteristics",
    },
  },
  problem: {
    title: "Problems solved",
    question: "Why do customers need you?",
    fields: {
      problems_solved: "Problems solved",
      pain_points: "Pain points",
      use_cases: "Use cases",
      outcomes: "Business outcomes",
    },
  },
  market: {
    title: "Markets",
    question: "Where do you sell?",
    fields: {
      current_markets: "Current markets",
      potential_markets: "Potential markets",
      adjacent_markets: "Adjacent markets",
      geographies: "Geographies",
    },
  },
  positioning: {
    title: "Positioning",
    question: "Why you, not someone else?",
    fields: {
      differentiators: "Differentiators",
      competitive_advantages: "Competitive advantages",
      brand_positioning: "Brand positioning",
      communication_style: "Communication style",
    },
  },
  exclusions: {
    title: "Exclusions",
    question: "Who should we avoid?",
    fields: {
      industries_to_avoid: "Industries to avoid",
      companies_to_avoid: "Companies to avoid",
      roles_to_avoid: "Roles to avoid",
      geographic_restrictions: "Geographic restrictions",
      other: "Other exclusions",
    },
  },
};

export const ALL_FIELDS = Object.entries(BRAIN).flatMap(([section, s]) =>
  Object.entries(s.fields).map(([field, label]) => ({ section: section as BrainSection, field, label })),
);

export function fieldLabel(section: string, field: string) {
  return BRAIN[section as BrainSection]?.fields[field] ?? field.replace(/_/g, " ");
}
