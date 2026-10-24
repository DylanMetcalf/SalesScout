import "server-only";
import * as z from "zod/v4";
import { generate, HOUSE_RULES, research, type AiContext } from "@/lib/ai/core";
import { BRIEF_FIELDS, PROPOSAL_FIELDS, type Analysis, type Research, type TextDoc, type Visibility } from "./types";
import { itemsOf, type Opportunity } from "./service";
import type { SiteAudit } from "./site-audit";

/*
 * Bounded AI tasks for an opportunity. Each is one call with a validated
 * schema. The operator reviews everything; nothing here is sent to a customer.
 */

const RULES = `${HOUSE_RULES}
- You are helping Mea Creo's operator understand a business problem a company brought to us, so we can decide whether and how to help with software, AI or automation.
- Keep what the customer SAID separate from what you INFER. Never present an inference as fact.
- Never invent numbers: no ROI, savings, hours, prices, delivery dates or guarantees. If a saving could be estimated, say what information would be needed.
- If the information is thin, say so plainly and ask better questions rather than padding.`;

/** Everything we know, labelled by where it came from. Original words first; later notes add to them. */
export function opportunityDigest(o: Opportunity, opts: { research?: boolean } = {}) {
  const c = o.context ?? {};
  const lines = [
    "## What the customer told us (their own words)",
    `Problem: ${o.problem}`,
    c.business && `What their business does: ${c.business}`,
    c.area && `Part of the business affected: ${c.area}`,
    c.current && `How they handle it today: ${c.current}`,
    c.frequency && `How often it happens: ${c.frequency}`,
    c.ideal && `What they'd like instead: ${c.ideal}`,
    `Company: ${o.companyName ?? "not given"}${o.website ? ` (${o.website})` : ""}${o.region ? `, ${o.region}` : ""}`,
    o.role && `Their role: ${o.role}`,
  ].filter(Boolean) as string[];
  const notes = itemsOf(o.id).filter((i) => i.kind === "note" || i.kind === "meeting").reverse();
  if (notes.length) {
    lines.push("", "## Operator notes and meeting notes (newer understanding; may refine the original)");
    let used = 0;
    for (const n of notes) {
      if (used > 6000) break;
      const s = `- [${n.kind}, ${n.createdAt.toISOString().slice(0, 10)}] ${n.body}`;
      used += s.length;
      lines.push(s);
    }
  }
  if (opts.research && o.research) {
    lines.push("", "## Company research (from public sources)", o.research.summary);
    for (const f of o.research.findings.slice(0, 12)) lines.push(`- [${f.kind}] ${f.statement}${f.sourceUrl ? ` (${f.sourceUrl})` : ""}`);
  }
  return lines.join("\n");
}

// Problem analysis ------------------------------------------------------------

const AnalysisSchema = z.object({
  customerSays: z.string().describe("What the customer says is happening, faithfully summarised in 2-3 sentences."),
  currentProcess: z.string().describe("The current process as described, or 'Not described yet.'"),
  friction: z.string().describe("Where the friction appears to come from. Mark inferences with 'appears' / 'may'."),
  impact: z.string().describe("Business impact only as the customer described it. No invented numbers."),
  missingInfo: z.array(z.string()).describe("What we'd need to know to understand this properly."),
  questions: z.array(z.string()).describe("5-8 specific questions to ask next, most important first."),
  directions: z.array(z.object({ title: z.string(), why: z.string(), confidence: z.enum(["low", "medium", "high"]) })).describe("2-4 possible solution directions in plain language."),
  integrations: z.array(z.string()).describe("Systems or data this might need to connect to. Only those mentioned or clearly implied; say 'may'."),
  risks: z.array(z.string()),
  nextAction: z.string().describe("The single most useful next step for the operator."),
});

export async function analyseProblem(ctx: AiContext, o: Opportunity): Promise<Analysis> {
  const a = await generate({
    ctx,
    agent: "opportunity_analysis",
    purpose: `Analyse problem from ${o.companyName ?? o.name}`,
    schema: AnalysisSchema,
    effort: "medium",
    system: RULES,
    prompt: `Analyse this submitted business problem for the operator.\n\n${opportunityDigest(o, { research: true })}`,
  });
  return { ...a, generatedAt: new Date().toISOString() };
}

// Company intelligence ---------------------------------------------------------

const ResearchSchema = z.object({
  summary: z.string().describe("3-4 sentences: what the company does, for whom, where. Only from sources."),
  offerings: z.array(z.string()),
  markets: z.array(z.string()),
  findings: z.array(
    z.object({
      statement: z.string(),
      kind: z.enum(["observed", "inferred"]).describe("observed = a source states it; inferred = your reasonable conclusion."),
      sourceUrl: z.string().nullable().describe("The exact source URL for observed findings. Null for inferences."),
    }),
  ),
  improvements: z.array(z.string()).describe("Hypotheses about where software/automation could help, given the stated problem. Each must read as a hypothesis."),
  questions: z.array(z.string()).describe("Questions for the discovery call that the research raised."),
  gaps: z.array(z.string()).describe("What we couldn't find or confirm."),
});

export async function researchCompany(ctx: AiContext, o: Opportunity): Promise<Research> {
  const r = await research({
    ctx,
    agent: "opportunity_research",
    purpose: `Research ${o.companyName ?? o.website ?? o.name}`,
    maxSearches: 4,
    maxFetches: 5,
    system: `${RULES}
Research one company from public sources only: its own website first (home, about, services), then reputable public pages. Do not try to access anything private or behind a login. Do not assume which software they use unless a source says so.`,
    prompt: `${opportunityDigest(o)}\n\nFind out what this company does, how it operates and anything public that helps us understand the problem above.`,
  });
  const allowed = new Set(r.sources.map((s) => s.url));
  const out = await generate({
    ctx,
    agent: "opportunity_research",
    purpose: `Structure research on ${o.companyName ?? o.name}`,
    schema: ResearchSchema,
    system: `${RULES}\nOnly cite URLs from the source list. Anything not supported by a listed source is 'inferred'.`,
    prompt: `${opportunityDigest(o)}\n\n## Research notes\n${r.notes}\n\n## Sources actually read or returned by search\n${r.sources.map((s) => `- ${s.url} (${s.title})`).join("\n") || "none"}`,
  });
  return {
    ...out,
    // A claim citing a URL research never saw is downgraded rather than shown as sourced.
    findings: out.findings.map((f) => (f.sourceUrl && allowed.has(f.sourceUrl) ? f : { ...f, kind: "inferred" as const, sourceUrl: null })),
    sources: r.sources.map((s) => ({ url: s.url, title: s.title })),
    researchedAt: new Date().toISOString(),
  };
}

// Solution brief and proposal drafts -------------------------------------------

const textSchema = (fields: readonly (readonly [string, string])[]) =>
  z.object(Object.fromEntries(fields.map(([k, label]) => [k, z.string().describe(label)])) as Record<string, z.ZodString>);

export async function draftBrief(ctx: AiContext, o: Opportunity): Promise<TextDoc> {
  return generate({
    ctx,
    agent: "solution_design",
    purpose: `Draft solution brief for ${o.companyName ?? o.name}`,
    schema: textSchema(BRIEF_FIELDS),
    effort: "high",
    system: `${RULES}\nWrite a first-draft solution brief the operator will edit. Short paragraphs or '- ' bullet lines. Where something is unknown, write 'To confirm: …'. Commercial considerations: factors only, never a price.`,
    prompt: `${opportunityDigest(o, { research: true })}${o.analysis ? `\n\n## Earlier analysis (AI, reviewed by operator)\nDirections: ${o.analysis.directions.map((d) => d.title).join("; ")}\nOpen questions: ${o.analysis.missingInfo.join("; ")}` : ""}`,
  });
}

export async function draftProposal(ctx: AiContext, o: Opportunity): Promise<TextDoc> {
  const brief = o.brief ? BRIEF_FIELDS.map(([k, label]) => `${label}: ${o.brief![k] ?? ""}`).join("\n") : "No solution brief yet.";
  return generate({
    ctx,
    agent: "solution_design",
    purpose: `Draft proposal for ${o.companyName ?? o.name}`,
    schema: textSchema(PROPOSAL_FIELDS),
    effort: "high",
    system: `${RULES}
Draft a client-facing proposal from the reviewed solution brief, in a calm, confident, plain voice addressed to the customer ("you").
Never state a price, fee, delivery date or guarantee. For 'Investment and terms' and 'Timeline' write '[To be completed by Mea Creo]' plus the factors that will determine them.`,
    prompt: `${opportunityDigest(o)}\n\n## Solution brief (operator-reviewed)\n${brief}`,
  });
}

// Visibility assessment ---------------------------------------------------------

const VisibilitySchema = z.object({
  summary: z.string().describe("3-4 sentences on what is observable and what most needs attention."),
  searchNotes: z.array(z.object({ note: z.string(), sourceUrl: z.string().nullable() })).describe("What the web searches showed about how the company appears. Never claim a ranking position."),
  recommendations: z.array(
    z.object({
      title: z.string(),
      why: z.string().describe("Why it may matter, tied to an observation."),
      how: z.string().describe("How to implement it safely; include a short code snippet where useful (e.g. a meta tag or JSON-LD)."),
      priority: z.enum(["high", "medium", "low"]),
      effort: z.enum(["small", "medium", "large"]),
      confidence: z.enum(["low", "medium", "high"]),
      measure: z.string().describe("How success could be measured, naming the tool needed (e.g. Google Search Console)."),
    }),
  ),
  limitations: z.array(z.string()),
});

export async function assessVisibility(ctx: AiContext, o: Opportunity, audit: SiteAudit): Promise<Omit<Visibility, "observed" | "pagesChecked" | "assessedAt">> {
  const name = o.companyName ?? new URL(audit.home).hostname;
  const r = await research({
    ctx,
    agent: "visibility",
    purpose: `Search visibility notes for ${name}`,
    maxSearches: 3,
    maxFetches: 1,
    system: `${RULES}\nSearch the web the way a potential customer of this company might: its name, and its main service plus location. Report only what the results show (which sites appear, whether the company's own site appears, what directories list it). Never claim exact rankings or traffic.`,
    prompt: `Company: ${name}\nWebsite: ${audit.home}\nWhat they do: ${o.context?.business ?? o.research?.summary ?? "see website"}\nRegion: ${o.region ?? "unknown"}`,
  });
  const allowed = new Set(r.sources.map((s) => s.url));
  const out = await generate({
    ctx,
    agent: "visibility",
    purpose: `Visibility recommendations for ${name}`,
    schema: VisibilitySchema,
    effort: "medium",
    system: `${RULES}
You are writing a website visibility assessment (search, AI answer engines and structured data). Base recommendations on the OBSERVED checks below; each recommendation must point to one.
Prioritise by likely value, confidence and effort. Never apply changes; recommend them. Always list the limitations (no Search Console, analytics or ranking data unless provided).`,
    prompt: `## Observed by our own checks (${audit.pages.length} pages read)
${audit.observations.map((x) => `- [${x.area}] ${x.finding}${x.url ? ` (${x.url})` : ""}`).join("\n")}
Pages read: ${audit.pages.map((p) => `${p.url} — title "${p.title}", ${p.words} words`).join("; ") || "none"}
Could not read: ${audit.failures.map((f) => `${f.url}: ${f.reason}`).join("; ") || "nothing"}

## Web search notes
${r.notes || "No search notes."}
Sources: ${r.sources.map((s) => s.url).join(", ") || "none"}`,
  });
  return { ...out, searchNotes: out.searchNotes.map((n) => (n.sourceUrl && !allowed.has(n.sourceUrl) ? { ...n, sourceUrl: null } : n)), sources: r.sources.map((s) => ({ url: s.url, title: s.title })) };
}
