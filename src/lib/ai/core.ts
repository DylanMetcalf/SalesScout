import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type * as z from "zod/v4";
import { eq } from "drizzle-orm";
import { db, t } from "@/lib/db";
import { decryptSecret } from "@/lib/security/secrets";
import { newId } from "@/lib/ids";

export const MODEL = process.env.SALES_SCOUT_MODEL || "claude-opus-5-5";

/** Server-side refusal fallback: if the model declines, the API retries on its default fallback. */
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

/** Which tenant an AI call is made for. Used for usage tracking and scoped memory. */
export type AiContext = { accountId: string; workspaceId: string; companyId: string | null };

export class AiUnavailableError extends Error {
  constructor() {
    super("AI isn't connected. Paste an Anthropic API key in Settings, or set ANTHROPIC_API_KEY on the server.");
  }
}
export class AiFailedError extends Error {}

export type KeySource = "account" | "server";

/**
 * Which API key to use for an account:
 *   1. the account's own key, pasted in Settings (stored encrypted), else
 *   2. the server-wide key from the environment (ANTHROPIC_API_KEY), used
 *      for everyone on this installation.
 */
export function resolveKey(accountId: string): { key: string; source: KeySource } | null {
  const row = db.select({ enc: t.accounts.anthropicKeyEnc }).from(t.accounts).where(eq(t.accounts.id, accountId)).get();
  if (row?.enc) {
    const key = decryptSecret(row.enc);
    if (key) return { key, source: "account" };
  }
  const server = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN;
  return server ? { key: server, source: "server" } : null;
}

export function aiConfigured(accountId: string): boolean {
  return resolveKey(accountId) !== null;
}

const clients = new Map<string, Anthropic>();
function getClient(ctx: AiContext): Anthropic {
  const resolved = resolveKey(ctx.accountId);
  if (!resolved) throw new AiUnavailableError();
  let client = clients.get(resolved.key);
  if (!client) {
    const useAuthToken = resolved.source === "server" && !process.env.ANTHROPIC_API_KEY;
    client = new Anthropic({
      ...(useAuthToken ? { authToken: resolved.key, apiKey: null } : { apiKey: resolved.key }),
      maxRetries: 3,
      timeout: 10 * 60_000,
    });
    clients.set(resolved.key, client);
  }
  return client;
}

/** Checks a key works without spending tokens (a model lookup). */
export async function testKey(key: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await new Anthropic({ apiKey: key, maxRetries: 0, timeout: 20_000 }).models.retrieve(MODEL);
    return { ok: true };
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) return { ok: false, error: "Anthropic rejected this key. Check you copied all of it." };
    if (err instanceof Anthropic.PermissionDeniedError) return { ok: false, error: `This key doesn't have access to ${MODEL}.` };
    if (err instanceof Anthropic.NotFoundError) return { ok: false, error: `The model ${MODEL} isn't available to this key.` };
    return { ok: false, error: describeError(err) };
  }
}

function record(
  ctx: AiContext,
  agent: string,
  purpose: string,
  started: number,
  outcome: { status: "ok" | "error" | "refused"; usage?: Anthropic.Beta.BetaUsage; webSearches?: number; error?: string },
) {
  db.insert(t.aiInteractions)
    .values({
      id: newId("ai"),
      accountId: ctx.accountId,
      workspaceId: ctx.workspaceId,
      companyId: ctx.companyId,
      agent,
      purpose,
      model: MODEL,
      status: outcome.status,
      inputTokens: (outcome.usage?.input_tokens ?? 0) + (outcome.usage?.cache_read_input_tokens ?? 0),
      outputTokens: outcome.usage?.output_tokens ?? 0,
      webSearches: outcome.webSearches ?? 0,
      durationMs: Date.now() - started,
      error: outcome.error?.slice(0, 500) ?? null,
    })
    .run();
}

function describeError(err: unknown): string {
  if (err instanceof Anthropic.RateLimitError) return "The AI provider is busy right now (rate limited). Try again in a minute.";
  if (err instanceof Anthropic.AuthenticationError) return "The AI provider rejected the API key. Check ANTHROPIC_API_KEY.";
  if (err instanceof Anthropic.APIConnectionError) return "Couldn't reach the AI provider. Check the server's network connection.";
  if (err instanceof Anthropic.APIError) return `The AI provider returned an error (${err.status ?? "unknown"}).`;
  return err instanceof Error ? err.message : "Unknown error";
}

type GenerateArgs<S extends z.ZodType> = {
  ctx: AiContext;
  agent: string;
  purpose: string;
  system: string;
  prompt: string;
  schema: S;
  effort?: "low" | "medium" | "high";
};

/** One structured call: returns data validated against `schema`, or throws. */
export async function generate<S extends z.ZodType>({ ctx, agent, purpose, system, prompt, schema, effort = "medium" }: GenerateArgs<S>): Promise<z.infer<S>> {
  const anthropic = getClient(ctx);
  const started = Date.now();
  try {
    const res = await anthropic.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      system,
      messages: [{ role: "user", content: prompt }],
      output_config: { effort, format: betaZodOutputFormat(schema) },
    });
    if (res.stop_reason === "refusal") {
      record(ctx, agent, purpose, started, { status: "refused", usage: res.usage });
      throw new AiFailedError("The AI declined this request.");
    }
    if (res.parsed_output == null) {
      record(ctx, agent, purpose, started, { status: "error", usage: res.usage, error: `unparsed (${res.stop_reason})` });
      throw new AiFailedError("The AI response couldn't be read. Please try again.");
    }
    record(ctx, agent, purpose, started, { status: "ok", usage: res.usage });
    return res.parsed_output as z.infer<S>;
  } catch (err) {
    if (err instanceof AiFailedError) throw err;
    const message = describeError(err);
    record(ctx, agent, purpose, started, { status: "error", error: message });
    throw new AiFailedError(message);
  }
}

export type ResearchSource = { url: string; title: string; pageAge?: string | null };
export type ResearchResult = {
  /** The model's written findings. */
  notes: string;
  /** Every URL that search actually returned or that was actually fetched. */
  sources: ResearchSource[];
  /** Plain text of pages actually fetched, keyed by URL (used to verify contact details). */
  fetched: Map<string, string>;
  searches: number;
};

/**
 * Live web research using Claude's server-side web search and fetch tools.
 * Only URLs that appear in real tool results are returned as sources, so
 * downstream steps can reject anything the model did not actually see.
 */
export async function research({
  ctx,
  agent,
  purpose,
  system,
  prompt,
  maxSearches = 6,
  maxFetches = 6,
}: {
  ctx: AiContext;
  agent: string;
  purpose: string;
  system: string;
  prompt: string;
  maxSearches?: number;
  maxFetches?: number;
}): Promise<ResearchResult> {
  const anthropic = getClient(ctx);
  const started = Date.now();
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: prompt }];
  const sources = new Map<string, ResearchSource>();
  const fetched = new Map<string, string>();
  const notes: string[] = [];
  let searches = 0;
  const usage: Anthropic.Beta.BetaUsage = {
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
  } as Anthropic.Beta.BetaUsage;

  try {
    for (let turn = 0; turn < 5; turn++) {
      const stream = anthropic.beta.messages.stream({
        model: MODEL,
        max_tokens: 32000,
        betas: [FALLBACK_BETA],
        fallbacks: "default",
        system,
        messages,
        output_config: { effort: "medium" },
        tools: [
          { type: "web_search_20260209", name: "web_search", max_uses: maxSearches },
          { type: "web_fetch_20260209", name: "web_fetch", max_uses: maxFetches, max_content_tokens: 12000 },
        ],
      });
      const res = await stream.finalMessage();
      usage.input_tokens += res.usage.input_tokens;
      usage.output_tokens += res.usage.output_tokens;

      for (const block of res.content) {
        if (block.type === "text") notes.push(block.text);
        else if (block.type === "server_tool_use" && block.name === "web_search") searches++;
        else if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
          for (const r of block.content) {
            if (r.type === "web_search_result") sources.set(r.url, { url: r.url, title: r.title, pageAge: r.page_age ?? null });
          }
        } else if (block.type === "web_fetch_tool_result" && block.content.type === "web_fetch_result") {
          const doc = block.content.content;
          const url = block.content.url;
          sources.set(url, { url, title: doc.title ?? url });
          if (doc.source.type === "text") fetched.set(url, doc.source.data);
        }
      }

      if (res.stop_reason === "refusal") {
        record(ctx, agent, purpose, started, { status: "refused", usage, webSearches: searches });
        throw new AiFailedError("The AI declined this research request.");
      }
      if (res.stop_reason !== "pause_turn") break;
      // Server-side tool loop paused: send the turn back so it resumes where it left off.
      messages.push({ role: "assistant", content: res.content });
    }
    record(ctx, agent, purpose, started, { status: "ok", usage, webSearches: searches });
    return { notes: notes.join("\n").trim(), sources: [...sources.values()], fetched, searches };
  } catch (err) {
    if (err instanceof AiFailedError) throw err;
    const message = describeError(err);
    record(ctx, agent, purpose, started, { status: "error", usage, webSearches: searches, error: message });
    throw new AiFailedError(message);
  }
}

/** Shared voice for every agent. */
export const HOUSE_RULES = `You are part of Sales Scout, a sales intelligence assistant for salespeople and small businesses.
Principles you must follow:
- Never fabricate companies, people, contact details, facts or sources. Missing information stays missing.
- Distinguish clearly between CONFIRMED (directly supported by provided information or a source), INFERRED (a reasonable conclusion), SUGGESTED (a hypothesis worth investigating) and UNKNOWN.
- Social content, a website or a directory listing never proves that a company needs something. Say "may", "appears", "could" when describing need.
- Write in plain, calm, confident English a non-technical salesperson understands. No hype, no jargon, no emojis.
- Keep explanations short and specific: cite what you saw.`;
