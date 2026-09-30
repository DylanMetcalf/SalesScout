import "server-only";
import * as z from "zod/v4";
import { ALL_FIELDS, BRAIN, fieldLabel } from "@/lib/brain-fields";
import { BRAIN_SECTIONS, type SearchInterpretation } from "@/lib/db/schema";
import { domainOf } from "@/lib/security/url";
import { generate, HOUSE_RULES, research, type AiContext, type ResearchResult } from "./core";

/*
 * The agents behind Sales Scout. The user experiences them as one assistant;
 * each is a focused prompt + schema. Every agent that touches the outside
 * world goes through `research()`, and its output is checked against the
 * sources that research actually returned.
 */

export type BrainFactLite = { section: string; field: string; value: string; knowledge: string };

/** Compact, prompt-ready view of the Company Brain. */
export function brainDigest(company: { name: string; description: string | null; summary: string | null }, facts: BrainFactLite[]) {
  const lines = [`Company: ${company.name}`];
  if (company.summary) lines.push(`Summary: ${company.summary}`);
  else if (company.description) lines.push(`Description (from the user): ${company.description}`);
  for (const section of BRAIN_SECTIONS) {
    const sectionFacts = facts.filter((f) => f.section === section && f.knowledge !== "unknown");
    if (!sectionFacts.length) continue;
    lines.push(`\n## ${BRAIN[section].title}`);
    for (const f of sectionFacts) lines.push(`- ${fieldLabel(f.section, f.field)} [${f.knowledge}]: ${f.value}`);
  }
  return lines.join("\n");
}

// Company Understanding ------------------------------------------------------

const knowledgeEnum = z.enum(["confirmed", "inferred", "suggested"]);
const sectionEnum = z.enum(BRAIN_SECTIONS);
const fieldEnum = z.enum(ALL_FIELDS.map((f) => f.field) as [string, ...string[]]);

const UnderstandingSchema = z.object({
  summary: z.string().describe("2-3 sentence plain-English summary of what the company does and for whom."),
  facts: z.array(
    z.object({
      section: sectionEnum,
      field: fieldEnum,
      value: z.string().describe("One concise statement. Lists as comma-separated items."),
      knowledge: knowledgeEnum,
      rationale: z.string().describe("Why you believe this; name the source."),
      source_ids: z.array(z.string()).describe("IDs of the sources that support this. Empty for suggestions."),
    }),
  ),
  unknowns: z.array(
    z.object({ section: sectionEnum, field: fieldEnum, question: z.string().describe("What we don't know, phrased plainly.") }),
  ),
});
export type Understanding = z.infer<typeof UnderstandingSchema>;

export async function understandCompany(
  ctx: AiContext,
  company: { name: string; description: string | null },
  sources: { id: string; label: string; text: string }[],
): Promise<Understanding> {
  const budget = 90_000;
  let used = 0;
  const blocks = sources.map((s) => {
    const take = Math.max(0, Math.min(s.text.length, 20_000, budget - used));
    used += take;
    return `<source id="${s.id}" label="${s.label.replace(/"/g, "'")}">\n${s.text.slice(0, take)}\n</source>`;
  });
  const fields = ALL_FIELDS.map((f) => `${f.section}.${f.field}: ${f.label}`).join("\n");
  return generate({
    ctx,
    agent: "company_understanding",
    purpose: `Build Company Brain for ${company.name}`,
    effort: "medium",
    schema: UnderstandingSchema,
    system: `${HOUSE_RULES}

You are the Company Understanding Agent. Read what a business has shared about itself and build its "Company Brain": a structured understanding of what it sells, to whom, the problems it solves, its markets and positioning.
Knowledge levels:
- confirmed: stated directly in a source (cite its id).
- inferred: a reasonable conclusion from the sources (cite the sources you inferred from).
- suggested: your own hypothesis worth investigating (e.g. adjacent markets, likely buyer roles). No source needed.
Only use these fields (section.field):
${fields}
Add at most 3 facts per field. Leave exclusions empty unless a source states them. List important gaps as unknowns.`,
    prompt: `Business name: ${company.name}
What the user told us: ${company.description?.trim() || "(nothing yet)"}

Sources we actually read:
${blocks.join("\n\n") || "(no sources could be read)"}

Build the Company Brain.`,
  });
}

// Market Discovery -----------------------------------------------------------

const MarketsSchema = z.object({
  intro: z.string().describe("One or two sentences introducing the recommendations, in the first person."),
  opportunities: z.array(
    z.object({
      title: z.string().describe("Short market name, e.g. 'Mining operations in South Africa'"),
      summary: z.string(),
      reasoning: z.string().describe("Why am I suggesting this? Tie it to specific parts of the Company Brain."),
      knowledge: z.enum(["inferred", "suggested"]),
      industries: z.array(z.string()),
      company_types: z.array(z.string()),
      buyer_roles: z.array(z.string()),
      job_titles: z.array(z.string()),
      geographies: z.array(z.string()),
      use_cases: z.array(z.string()),
      keywords: z.array(z.string()).describe("Search terminology a buyer's website might use."),
    }),
  ),
});
export type Markets = z.infer<typeof MarketsSchema>;

export async function discoverMarkets(ctx: AiContext, digest: string, avoid: string[], already: string[]): Promise<Markets> {
  return generate({
    ctx,
    agent: "market_discovery",
    purpose: "Discover markets",
    effort: "medium",
    schema: MarketsSchema,
    system: `${HOUSE_RULES}

You are the Market Discovery Agent. Based on a Company Brain, suggest where this business could look for customers.
Return 4 to 6 opportunities, most relevant first. Each must be a distinct, concrete direction a salesperson could act on.
Use "inferred" when the brain clearly points to the market (e.g. an industry already served) and "suggested" for adjacent or new ideas.
Keep lists short (2-5 items each).`,
    prompt: `${digest}

Avoid: ${avoid.join(", ") || "nothing specified"}
Markets the user has already saved or dismissed (don't repeat): ${already.join("; ") || "none"}

Here's what I think we could explore — suggest the opportunities.`,
  });
}

// Query interpretation -------------------------------------------------------

const InterpretationSchema = z.object({
  summary: z.string().describe("One sentence, first person: what I'll look for and how I'll prioritise."),
  industries: z.array(z.string()),
  company_types: z.array(z.string()),
  geographies: z.array(z.string()),
  company_sizes: z.array(z.string()),
  buyer_roles: z.array(z.string()),
  keywords: z.array(z.string()),
  exclusions: z.array(z.string()),
  requested: z.number().describe("How many companies to find. Default 10 unless the user says otherwise; never more than 25."),
});

export async function interpretQuery(ctx: AiContext, digest: string, query: string, strategyText: string | null): Promise<SearchInterpretation> {
  const r = await generate({
    ctx,
    agent: "prospect_discovery",
    purpose: "Interpret discovery request",
    effort: "low",
    schema: InterpretationSchema,
    system: `${HOUSE_RULES}

You translate a salesperson's request into a concrete search plan for finding companies. Fill gaps from the Company Brain and the lead strategy, but never contradict what the user asked for. Keep every list short.`,
    prompt: `${digest}
${strategyText ? `\nActive lead strategy:\n${strategyText}` : ""}

The user asked: "${query}"`,
  });
  return {
    summary: r.summary,
    industries: r.industries,
    companyTypes: r.company_types,
    geographies: r.geographies,
    companySizes: r.company_sizes,
    buyerRoles: r.buyer_roles,
    keywords: r.keywords,
    exclusions: r.exclusions,
    requested: Math.max(3, Math.min(25, Math.round(r.requested || 10))),
  };
}

// Prospect Discovery ---------------------------------------------------------

const CandidatesSchema = z.object({
  candidates: z.array(
    z.object({
      name: z.string(),
      website: z.string().nullable().describe("The company's own website URL, only if seen in the sources."),
      industry: z.string().nullable(),
      location: z.string().nullable(),
      what_they_do: z.string(),
      why_appeared: z.string().describe("Why this company surfaced for this search, citing what was seen."),
      source_urls: z.array(z.string()).describe("URLs from the source list where this company was seen."),
    }),
  ),
});
export type Candidate = z.infer<typeof CandidatesSchema>["candidates"][number];

function interpretationText(i: SearchInterpretation) {
  return [
    `Industries: ${i.industries.join(", ") || "any"}`,
    `Company types: ${i.companyTypes.join(", ") || "any"}`,
    `Geographies: ${i.geographies.join(", ") || "any"}`,
    `Company sizes: ${i.companySizes.join(", ") || "any"}`,
    `Keywords: ${i.keywords.join(", ") || "none"}`,
    `Exclude: ${i.exclusions.join(", ") || "none"}`,
  ].join("\n");
}

function sourceList(r: ResearchResult) {
  return r.sources.map((s, n) => `[${n + 1}] ${s.title} — ${s.url}`).join("\n");
}

/** Keeps only URLs that research actually returned. */
function verifiedUrls(urls: string[], r: ResearchResult) {
  const known = new Set(r.sources.map((s) => s.url));
  const knownDomains = new Set(r.sources.map((s) => domainOf(s.url)));
  return urls.filter((u) => known.has(u) || knownDomains.has(domainOf(u)));
}

export async function discoverCompanies(
  ctx: AiContext,
  digest: string,
  interp: SearchInterpretation,
  opts: { avoidDomains: string[]; avoidNames: string[]; seed?: string },
): Promise<{ candidates: Candidate[]; research: ResearchResult; dropped: number }> {
  const want = interp.requested;
  const r = await research({
    ctx,
    agent: "prospect_discovery",
    purpose: `Search for ${want} companies`,
    maxSearches: Math.min(12, 4 + Math.ceil(want / 3)),
    maxFetches: 4,
    system: `${HOUSE_RULES}

You are the Prospect Discovery Agent. Use web search to find REAL companies that match a search plan. Prefer the companies' own websites and reputable directories. For each company you find, note its name, its website, what it does, where it is, and the URL where you saw it. Do not invent companies; if you can't find enough, say so.`,
    prompt: `We sell on behalf of this business:
${digest}

Search plan:
${interpretationText(interp)}
${opts.seed ? `\nFind companies similar to this one:\n${opts.seed}` : ""}

Find about ${Math.ceil(want * 1.4)} candidate companies (we will vet them). Skip these known companies: ${[...opts.avoidNames, ...opts.avoidDomains].slice(0, 80).join(", ") || "none"}.
Write your findings as a list.`,
  });

  if (!r.sources.length) return { candidates: [], research: r, dropped: 0 };

  const extracted = await generate({
    ctx,
    agent: "prospect_discovery",
    purpose: "Identify companies from research",
    effort: "low",
    schema: CandidatesSchema,
    system: `${HOUSE_RULES}

Extract the companies that the research actually found. Every company must be supported by at least one URL from the numbered source list (copy URLs exactly). Omit anything that isn't. Do not add companies from memory.`,
    prompt: `Research notes:
${r.notes || "(none)"}

Source list (the only URLs you may cite):
${sourceList(r)}`,
  });

  let dropped = 0;
  const candidates = extracted.candidates.flatMap((c) => {
    const urls = verifiedUrls(c.source_urls, r);
    if (!urls.length) {
      dropped++;
      return [];
    }
    return [{ ...c, source_urls: urls }];
  });
  return { candidates, research: r, dropped };
}

// Company research & qualification ------------------------------------------

const fitDim = z.object({ level: z.enum(["strong", "moderate", "weak", "unknown"]), explanation: z.string() });

const QualificationSchema = z.object({
  is_real_company: z.boolean().describe("False if the sources don't show this is a real, operating company."),
  canonical_name: z.string(),
  website: z.string().nullable(),
  industry: z.string().nullable(),
  location: z.string().nullable(),
  what_they_do: z.string(),
  why_relevant: z.string().describe("Why they may be relevant to what we sell. Specific and honest."),
  potential_opportunity: z.string().describe("What we might help them with. Phrase as possibility, not fact."),
  suggested_next_step: z.string(),
  fit: z.object({
    company: fitDim,
    industry: fitDim,
    geography: fitDim,
    need: fitDim,
    contact: fitDim,
    evidence: fitDim,
  }),
  confirmed_facts: z.array(z.string()),
  inferences: z.array(z.string()),
  unknowns: z.array(z.string()),
  evidence: z.array(
    z.object({
      kind: z.enum(["website", "search_result", "news", "profile", "directory", "document"]),
      title: z.string(),
      url: z.string(),
      snippet: z.string().describe("Short quote or paraphrase of what the source says."),
      supports: z.string().describe("Which claim this supports."),
    }),
  ),
  people: z.array(
    z.object({
      name: z.string().nullable().describe("Only if a named person appears in a source. Otherwise null."),
      role: z.string(),
      relevance: z.string().describe("Why this person or role matters for this opportunity."),
      source_url: z.string().nullable().describe("Where the named person was found. Null for role suggestions."),
      email: z.string().nullable().describe("Only if published in a fetched source. Never guess patterns."),
      phone: z.string().nullable().describe("Only if published in a fetched source."),
      profile_url: z.string().nullable(),
    }),
  ),
  recent_activity: z.array(z.object({ title: z.string(), url: z.string().nullable(), date: z.string().nullable() })),
});
export type Qualification = z.infer<typeof QualificationSchema>;

export async function qualifyCompany(
  ctx: AiContext,
  digest: string,
  interp: SearchInterpretation | null,
  candidate: { name: string; website: string | null; what_they_do?: string; source_urls?: string[] },
  depth: 1 | 2 | 3,
): Promise<{ q: Qualification; research: ResearchResult; removed: { people: number; evidence: number } }> {
  const r = await research({
    ctx,
    agent: depth === 3 ? "company_research_deep" : "company_research",
    purpose: `Research ${candidate.name}`,
    maxSearches: depth === 3 ? 6 : depth === 2 ? 3 : 1,
    maxFetches: depth === 3 ? 6 : depth === 2 ? 3 : 1,
    system: `${HOUSE_RULES}

You are the Company Research and Contact Research agents. Research one company to judge whether it's a sensible prospect.
Read its own website first (home, about, services, team/leadership pages). ${depth >= 2 ? "Look for publicly listed leaders or managers in the buyer roles named — only people shown on the company's site, press releases or other public pages." : "Keep it quick: identity and what they do."}
${depth === 3 ? "This is deep research: also look for recent news, projects, expansions, tenders, hiring or anything suggesting current need." : ""}
Report what you saw and where. Never guess email addresses.`,
    prompt: `Company: ${candidate.name}
Website: ${candidate.website ?? "unknown — find it"}
Seen at: ${(candidate.source_urls ?? []).join(", ") || "n/a"}
Buyer roles of interest: ${interp?.buyerRoles.join(", ") || "decision makers relevant to what we sell"}

What we sell:
${digest}`,
  });

  const q = await generate({
    ctx,
    agent: "qualification",
    purpose: `Qualify ${candidate.name}`,
    effort: depth === 3 ? "high" : "medium",
    schema: QualificationSchema,
    system: `${HOUSE_RULES}

You are the Qualification Agent. Assess the researched company against what we sell. Use fit levels strong / moderate / weak / unknown, each with a one-sentence explanation — no numeric scores.
"need" is about whether they may need what we sell; unless a source shows an explicit need, it is at most "moderate".
"contact" reflects whether we found relevant named people (strong), only relevant roles (moderate or weak), or nothing (unknown).
"evidence" reflects how much of the assessment rests on sources vs inference.
Evidence URLs and people's source_url must come from the source list. People: if nobody is named in the sources, return the 2-3 most relevant roles with name null. Never invent names, emails or phone numbers.`,
    prompt: `What we sell:
${digest}

${interp ? `Search plan:\n${interpretationText(interp)}\n` : ""}
Research notes on ${candidate.name}:
${r.notes || "(none)"}

Source list (the only URLs you may cite):
${sourceList(r) || "(no sources returned)"}`,
  });

  // Verification pass: drop anything not traceable to what research actually returned.
  const known = new Set(r.sources.map((s) => s.url));
  const fetchedText = [...r.fetched.values()].join("\n").toLowerCase();
  let removedPeople = 0;
  const people = q.people.map((p) => {
    const sourced = p.source_url && known.has(p.source_url);
    if (p.name && !sourced) {
      removedPeople++;
      return { ...p, name: null, source_url: null, email: null, phone: null, profile_url: null };
    }
    return {
      ...p,
      email: p.email && fetchedText.includes(p.email.toLowerCase()) ? p.email : null,
      phone: p.phone && fetchedText.includes(p.phone.replace(/\s+/g, " ").toLowerCase()) ? p.phone : null,
      profile_url: p.profile_url && known.has(p.profile_url) ? p.profile_url : null,
    };
  });
  const evidence = q.evidence.filter((e) => known.has(e.url));
  const recent = q.recent_activity.map((a) => ({ ...a, url: a.url && known.has(a.url) ? a.url : null }));
  return {
    q: { ...q, people, evidence, recent_activity: recent },
    research: r,
    removed: { people: removedPeople, evidence: q.evidence.length - evidence.length },
  };
}

// Outreach -------------------------------------------------------------------

const OutreachSchema = z.object({
  subject: z.string().nullable().describe("Email subject; null for non-email channels."),
  body: z.string(),
  approach_note: z.string().describe("One sentence on the angle you took and why."),
});

export async function draftOutreach(
  ctx: AiContext,
  input: {
    digest: string;
    prospect: string;
    contact: string;
    channel: "email" | "linkedin" | "call" | "follow_up";
    preferences: string[];
    senderName: string;
  },
) {
  const channelGuide = {
    email: "A short cold email (under 130 words) with a specific subject line.",
    linkedin: "A LinkedIn connection note or message (under 300 characters for a note, under 90 words for a message). No subject.",
    call: "A call introduction script: a 2-sentence opener, one discovery question, and a fallback if they're busy. No subject.",
    follow_up: "A polite follow-up email to a previous message that got no reply (under 90 words), adding one new, useful angle.",
  }[input.channel];
  return generate({
    ctx,
    agent: "outreach",
    purpose: `Draft ${input.channel} outreach`,
    effort: "medium",
    schema: OutreachSchema,
    system: `${HOUSE_RULES}

You are the Outreach Agent. Write outreach a thoughtful salesperson would actually send: specific to the prospect, grounded in the research, respectful of their time, one clear ask. Never claim to know they have a problem — reference what you observed and ask.
Channel: ${channelGuide}
${input.preferences.length ? `The user's writing preferences (always follow these):\n${input.preferences.map((p) => `- ${p}`).join("\n")}` : ""}
Sign off as ${input.senderName}. Use [square brackets] for anything the user must fill in.`,
    prompt: `What we sell:
${input.digest}

Prospect:
${input.prospect}

Recipient:
${input.contact}`,
  });
}
