# Cost & operations assessment (October 2026)

What's confirmed from the code, what's still a guess, and what was changed. No figure here is a measured cost: production hasn't run priced, real searches yet.

## Architecture (confirmed)
- One Next.js app, SQLite on a persistent disk, in-process background jobs (`src/lib/jobs.ts`). One server instance, no queue service.
- Every AI call goes through `src/lib/ai/core.ts` (`generate` and `research`), and every call is logged in `ai_interactions`. That is the single choke point for metering, routing and kill switches.
- Pipeline: interpret → discover candidates (web search) → research up to 5 per batch in slices of 3 → qualify → preview → user keeps (1 credit) → optional deep research → outreach draft (never sent).
- Billing has credits with an idempotent ledger, atomic usage counters, Paystack, and admin manual plans. There are no unlimited plans: admins are unlimited, everyone else is capped.

## Cost drivers
**Confirmed:**
- All agents defaulted to the most capable model.
- Research uses web search (up to 12 for discovery, and 1/3/6 by depth) plus page fetches of up to 12k tokens each, in up to 5 `pause_turn` continuations. Fetched pages are re-sent as input on each continuation.
- "Verified" mode researches up to 10 candidates to find 5 good ones.
- Prompt caching isn't used.

**Hypotheses, to be measured with Operations:**
- Fetched-page input tokens dominate the spend.
- Verified mode costs roughly twice what Broad mode costs per kept prospect.
- Deep research (depth 3) is the most expensive single action.
- Outreach and qualification could move to a cheaper model without a quality loss.

## Changes in this pass
| Area | Change |
|---|---|
| Cost observability | Each AI call records cached tokens, page fetches, run and prospect ids, an **estimated** cost, and the price version used. Missing prices mean "unknown", never $0. (`ai/pricing.ts`, migration 0009) |
| Routing | `modelFor(agent)` lets one step trial another model through `SALES_SCOUT_MODEL_<AGENT>`. Defaults are unchanged. |
| Guardrails | A per-batch token budget (and an optional USD budget) stops research early and keeps the results. The admin kill switches are **Pause all AI** and **Pause new searches**; both are DB-backed, take effect at once, and are recorded with who changed them. |
| Cancellation | Users can stop a running search; the work already done is kept. |
| Feedback | A structured "Report a problem" with 11 reasons, on every prospect. |
| Monthly budget (pass 2) | `AI_MONTHLY_BUDGET_USD` / `AI_MONTHLY_TOKEN_BUDGET` cap the **server key's** spend each month, checked before every paid call. It fails closed: a USD cap without prices pauses AI. Customers' own-key spend is tracked separately (`key_source`) and never counted against the cap. (`ai/budget.ts`) |
| Per-step kill switches (pass 2) | Each AI step (Brain, market suggestions, discovery and research, qualification, outreach) can be paused on its own. |
| Accounting fix (pass 2) | Cache-write tokens were not recorded, so input could have been undercounted once caching is used. They are now counted and priced. |
| Feedback triage (pass 2) | Operators classify each report: confirmed error, customer preference, policy change, duplicate, or no problem. Only confirmed errors should count as data-quality failures. |
| Operator view | Admin → Operations shows spend by step and model, cost per search and per kept prospect, quality rates, problem reports, the stage funnel (with no causal claims) and stuck jobs. It shows metadata only, with no prospect content. |

## Confirmed in pass 2
- **Restart recovery:** `db/connection.ts` marks interrupted jobs and searches as failed on boot. Kept prospects and charged credits survive.
- **Concurrency:** one running search per account (`assertNoOtherRunning`). Double-clicks reuse the same job.
- **Printing:** the brief and print pages assemble stored data only and never call AI.

## Security & tenancy (unchanged, re-checked)
- New per-tenant writes (feedback, cancel) go through `inCompany`/`getRun` scoping.
- Operations is admin-only (`requireAdmin`/`assertAdmin`) and reads aggregates only.
- No keys are exposed: pricing and model settings are server env only.

## Automation maturity
**Level 2 (partially automated).** Discovery, research and qualification run unattended within budgets. People decide what to keep, what to send and every strategy change. Spend is visible and can be stopped, but nothing automatically adjusts it yet.

## Deferred (deliberately)
- **Client portal / multi-workspace membership (Mode B):** this needs memberships, roles and per-workspace billing. Today it's one login per company.
- **Shared cross-tenant intelligence or caching:** deferred for privacy (POPIA). Results are cached only within a tenant.
- **Prompt caching** of the system prompt and company digest: likely cheap to add, but it should be measured first.
- **Provider fallback; mailbox-level email verification:** each needs an external provider account.
- **Using triaged feedback** to change ranking or qualification automatically: deferred until enough confirmed corrections exist to justify it.
- **Per-account USD budgets and reservations:** per-account monthly token allowances, credits and one-search-at-a-time already bound spend. A reservation ledger is worth it only with concurrent self-service.
- **Durable job queue:** only worth it with more than one instance.

## Recommended next experiment
1. Set the `AI_PRICE_*` variables from current Anthropic pricing.
2. Run about 20 real searches, split across Broad and Verified, to get a **baseline cost per kept prospect** by step.
3. Using the same cases, trial `SALES_SCOUT_MODEL_OUTREACH` and `SALES_SCOUT_MODEL_QUALIFICATION` on a cheaper model. Compare the problem-report rate, the keep rate and cost. Switch only if quality holds.
