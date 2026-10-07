# Sales Scout roadmap

Maintained by the `platform-steward` agent (`/evolve`). Most valuable first within each section.

## Fix now
- Validate discovery quality end to end with a real API key: run 3–5 real searches, review the results as a salesperson would, and tune the prompts in `src/lib/ai/agents.ts`.

## Next
- Reuse research: cache company research by domain across searches within a company, so the same site isn't researched twice.
- Scheduled discovery: re-run a lead strategy weekly and surface only new companies on Home.
- Bulk triage on search results: keep or reject several at once, with keyboard shortcuts.
- Sales brief as PDF, and an "email me today's follow-ups" digest.
- Duplicate protection: import existing customers and CRM contacts from CSV.

## Later
- Gmail / Outlook OAuth: log sent mail and detect replies, moving status to "Replied" automatically (with approval).
- LinkedIn / Meta authorised APIs for reading the owner's own page posts into the Company Brain.
- Contact enrichment via an approved provider (e.g. Apollo or Hunter), behind the integration registry, with clear sourcing.
- Team features: invites, roles, assignment, territories. The data model is already account → workspace → company.
- Postgres with row-level security for multi-server hosting. A job queue (e.g. a separate worker) instead of in-process jobs.
- Browser extension: "Add to Sales Scout" / "Find similar" from any company website.
- CRM sync (HubSpot, Salesforce, Pipedrive).

## Done
- 2026-10-07 — UI/UX pass: compass brand mark (doubles as the research indicator), refined palette with one amber signal colour, display typeface, Home rebuilt as a "Today" briefing with an ask box, conversational Discover, prospect page as a one-screen sales briefing with a mobile action bar, WHY? verdict summary, human copy throughout. See docs/DESIGN.md.
- 2026-09-30 — V1: design system, multi-tenant foundation, onboarding, Company Brain, market discovery, discovery pipeline, WHY panel, CRM, pipeline, follow-ups, outreach, learning, exports, demo company.
- 2026-09-30 — API key can be pasted in Settings (encrypted per account; falls back to a server key). Key can also be pasted during onboarding. Jobs interrupted by a restart are marked failed (with retry) instead of hanging. Render blueprint, closable sign-ups, uploads stored next to the database, platform-steward agent + /evolve.
