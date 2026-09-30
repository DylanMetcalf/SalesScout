# Sales Scout — notes for Claude

AI sales-intelligence, prospect-discovery and lightweight CRM. Read `README.md` for the product overview and `docs/ROADMAP.md` for what's next.

## Commands
- `npm run dev` — dev server on :3000 (DB auto-migrates on first request)
- `npm run typecheck` · `npm test` · `npm run build`
- `npm run db:seed` — demo login `demo@salesscout.app` / `salesscout-demo`
- `node scripts/dev/e2e.mjs` — browser walkthrough (needs a running server; uses Chromium at `/opt/pw-browsers/chromium` in cloud sessions)
- `OUT=<dir> node scripts/dev/shot.mjs /home /prospects` — logged-in screenshots
- Schema changes: edit `src/lib/db/schema.ts`, then `npx drizzle-kit generate --name <change>`. Never hand-edit generated migrations. Tenant-guard triggers are in `drizzle/0001_tenant_guards.sql`; add triggers for any new company-scoped table in a new custom migration.

## Map
- `src/lib/db` schema + connection · `src/lib/tenant` scoping (`requireCompany`, `actionTenant`, `inCompany`, `tenantCols`)
- `src/lib/ai/core.ts` Claude client, key resolution (account key → server key), `generate()` structured calls, `research()` web search/fetch with source tracking
- `src/lib/ai/agents.ts` all prompts + schemas · `src/lib/services/*` business logic · `src/app/actions/*` server actions (always wrapped in `attempt()`)
- `src/components/ui` design system — reuse before creating anything new
- `src/lib/integrations/registry.ts` — the only place provider-specific details live

## Non-negotiables
1. **Never fabricate.** Companies need a verified source URL. People need a source, or they become a "role to find". Emails/phones only if they appear verbatim in a fetched page. Missing stays missing: in the UI, in exports, in reports.
2. **Tenant isolation.** Every query on company data uses `inCompany(...)`; every insert spreads `tenantCols(...)`. Server actions resolve the tenant themselves and never trust an id from the client without scoping it.
3. **The user decides.** AI suggests; it never silently changes strategy, the Company Brain, or anything outward-facing. Nothing is ever sent on the user's behalf.
4. **Honest states.** If a capability isn't connected, say so and offer the next step. Never show simulated results.
5. **Knowledge labels.** Distinguish confirmed / inferred / suggested / unknown everywhere AI knowledge appears.
6. **Secrets stay server-side.** API keys are encrypted at rest (`src/lib/security/secrets.ts`) and never returned to the client.
7. **No scraping** of platforms that forbid it. Use authorised APIs via the integration registry.
8. **UX first.** Calm, plain language, progressive disclosure, useful empty/loading/error states, keyboard + screen-reader support, works on mobile. Less cognitive load beats more features.

## Style
Match surrounding code: small focused components, Tailwind with design tokens (`bg-surface`, `text-muted`, `text-accent-text`, …), no new colours outside `globals.css`, comments only where intent isn't obvious.
