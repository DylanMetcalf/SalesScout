# Sales Scout

**Tell us what you sell. We'll help you figure out who needs it — who to talk to, why, and what to do next.**

Sales Scout is an AI sales-intelligence and prospect-discovery app with a lightweight CRM. It learns what your business does (the *Company Brain*), suggests markets worth exploring, finds and vets real companies with live web research, identifies the people worth speaking to, explains *why* each prospect appeared, and helps you manage the relationship through to a decision.

> **New here? Read [`docs/SETUP.md`](docs/SETUP.md)** for a step-by-step guide: local use, connecting AI, putting it online with Render, and the improvement agent.

## Quick start

```bash
npm install
cp .env.example .env.local     # optional; you can also paste your API key in the app
npm run db:seed                 # optional: demo login with a fully populated example company
npm run dev                     # http://localhost:3000
```

Demo login (after `npm run db:seed`): `demo@salesscout.app` / `salesscout-demo`.
New users can also click **Explore the demo** during onboarding.

The SQLite database is created and migrated automatically in `data/` on first run.

| Script | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js dev server, production build, production server |
| `npm run typecheck` | TypeScript check |
| `npm test` | Tenant-isolation, duplicate-protection, demo-data and SSRF-guard tests |
| `npm run db:seed` / `db:reset` | Create the demo login / wipe and recreate the database |
| `/evolve` (Claude Code) | Runs the `platform-steward` agent to audit, fix, enhance and evolve the app |
| `node scripts/dev/e2e.mjs` | Browser walkthrough of first run → CRM → exports → cross-tenant checks (needs a running server) |

## Public website
Visiting `/` shows the marketing site for the done-for-you service (edit the wording, packages and contact email in `src/content/site.ts`). "Client login" leads to the workspace. Contact-form enquiries appear under Settings → Website enquiries.

## What works with and without AI

Sales Scout never shows fake results. When a capability isn't available it says so plainly.

AI is on when an Anthropic key is available: either pasted in **Settings → AI & research** (encrypted, per account) or set as `ANTHROPIC_API_KEY` on the server (used for every account that hasn't pasted its own).

| Capability | Without a key | With it |
| --- | --- | --- |
| Accounts, workspaces, companies, onboarding | ✅ | ✅ |
| Website reading, document text extraction (PDF, DOCX, XLSX, CSV, PPTX, TXT) | ✅ | ✅ |
| Company Brain | Records only what sources state directly | Full analysis with confirmed / inferred / suggested / unknown |
| Discover My Market, prospect discovery, Find Similar, deep research | Clearly switched off | Live web search + page reading, with source verification |
| Outreach drafts | Labelled template | AI draft that follows your writing preferences |
| CRM, pipeline, follow-ups, notes, sales briefs, learning suggestions | ✅ | ✅ |
| CSV / XLSX / client-ready report | ✅ | ✅ |

Social profiles are saved as sources and shown as **Requires permission**: reading posts needs each platform's authorised API. Sales Scout does not scrape. Email is draft-and-hand-off (**Open in Gmail / Outlook**); nothing is ever sent automatically.

## Architecture

- **Next.js 15 (App Router) + React 19 + TypeScript**, Tailwind CSS 4 with a token-based design system (`src/app/globals.css`, `src/components/ui`). Light and dark themes.
- **SQLite via Drizzle ORM** (`src/lib/db/schema.ts`, migrations in `drizzle/`). Swappable for Postgres.
- **Auth**: email + password (scrypt), opaque session tokens stored hashed, httpOnly cookies, DB-backed rate limiting.
- **Tenancy** — `ACCOUNT → WORKSPACE → COMPANY → data`:
  - Application level: every query goes through `inCompany()` / `tenantCols()` (`src/lib/tenant`), and membership is re-verified on every request.
  - Database level: triggers (`drizzle/0001_tenant_guards.sql`) reject any row whose workspace/company/prospect don't belong together, on insert and update.
- **AI orchestration** (`src/lib/ai`): one Claude client with structured outputs, plus a `research()` path that uses server-side web search/fetch and records **only URLs that the tools actually returned**. Agents: company understanding, market discovery, query interpretation, prospect discovery, company/contact research, qualification, outreach. A learning agent (`src/lib/services/learning.ts`) turns repeated decisions into suggestions that the user must approve.
- **Anti-fabrication checks**: a company without a verified source is dropped. A named person without a verified source becomes a *role to find*. Emails and phone numbers are kept only if they appear verbatim in a fetched page, and evidence links must come from research results. Missing data stays blank in the UI and in exports.
- **Background jobs** (`src/lib/jobs.ts`) with persisted, human-readable steps. The UI shows progress instead of a spinner.
- **Research depth**: Level 1 discovery → Level 2 qualification (default) → Level 3 deep research on request.
- **Integrations** go through a provider registry (`src/lib/integrations/registry.ts`), so no provider logic is scattered through the app.
- **Audit trail**: AI and user actions are logged with their source (AI analysis, web research, user, system). AI usage is recorded per workspace.
- **Security**: SSRF-guarded fetching (checks every redirect hop), CSV/XLSX formula-injection protection, upload type/size limits with private per-tenant storage, input validation with Zod, secrets kept server-side only, security headers.

## Configuration

See `.env.example`. Hosting: `render.yaml` (Render Blueprint, one instance plus a persistent disk). `ALLOW_SIGNUPS=false` closes sign-ups. `SALES_SCOUT_MODEL` overrides the model (default `claude-opus-5-5`). Research calls enable the API's server-side refusal fallback.

## Scope

V1 covers the full loop: tell Sales Scout about your business → understand it → suggest markets → find and vet companies → find the people → explain why → prepare the next action → manage the relationship → learn from the outcome.

The data model already has room for teams, roles, assignments, campaigns and usage. Sales-manager dashboards, autonomous outreach, forecasting and billing are deliberately left out of V1.
