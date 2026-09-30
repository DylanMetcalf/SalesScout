# Setting up Sales Scout — top to bottom

Three stages. Do stage 1 now; stages 2–3 when you want it online.

---

## Stage 1 — Run it on your own computer

**You need:** Node.js 22 LTS (from nodejs.org) and Git.

```bash
git clone https://github.com/DylanMetcalf/SalesScout.git
cd SalesScout
git checkout claude/stoic-rubin-jbjib7   # until this branch is merged into main
npm install
npm run dev
```

Open http://localhost:3000, create your account, and follow the onboarding.

**Connect AI (once):**
1. Go to https://console.anthropic.com. Add billing, then go to **Settings → API keys → Create key**.
2. Also in the console, set a **monthly spend limit** so costs can never surprise you.
3. In Sales Scout, paste the key either during onboarding (the "Connect AI" box on the documents step) or any time in **Settings → AI & research**. Click **Save & test**.

The key is checked with Anthropic, stored encrypted on your machine (`data/`), and never shown again. Usage appears under Settings → AI & research.

Your data lives in the `data/` folder. Back it up if it matters. Delete it to start fresh.

Want example data first? Run `npm run db:seed`, then sign in as `demo@salesscout.app` / `salesscout-demo`.

---

## Stage 2 — Put it online (Render + GitHub)

Once it's online, a key set on the server is used in the background for **everyone** who uses your Sales Scout. Nobody has to paste anything. A key pasted in Settings still takes priority for that one account.

**GitHub (one-time):** the code is on the branch `claude/stoic-rubin-jbjib7`. Either merge it into `main` (ask Claude to open a pull request), or point Render at this branch directly. Nothing else is needed on GitHub; Render reads the repo.

**Render:**
1. Sign up at https://render.com and connect your GitHub account.
2. **New + → Blueprint**, then pick the `SalesScout` repo (and branch). Render reads `render.yaml` and sets up:
   - a web service (paid **Starter** instance, needed for the persistent disk that holds your database; check Render's current pricing),
   - a 1 GB disk at `/var/data` for the database and uploads,
   - `APP_ENCRYPTION_KEY`, generated automatically. **Never change it**, or saved keys become unreadable.
3. When asked for `ANTHROPIC_API_KEY`, paste your key. That's the "used in the background for everyone" key.
4. Click **Apply**. After a few minutes you'll get a URL like `https://sales-scout-xxxx.onrender.com`.
5. Open it and create **your** account.
6. **Close sign-ups:** in Render, go to the service → **Environment**, set `ALLOW_SIGNUPS` = `false`, and save (it redeploys). Otherwise anyone who finds the URL could sign up and spend your AI credit.
7. Optional: **Settings → Custom Domains** to use your own domain.

From then on, every push to the connected branch redeploys automatically. Your data on the disk is kept.

**Keep it to one instance.** The database and research jobs live inside the web service. Don't scale to multiple instances. (Moving to Postgres plus a worker is on the roadmap for when you need teams at scale.)

---

## Stage 3 — Optional connections (only when you want them)

| What | Works today | To go further |
| --- | --- | --- |
| Gmail / Outlook | "Open in Gmail/Outlook" with the reviewed draft | Google or Microsoft OAuth app → set `GOOGLE_CLIENT_ID/SECRET` or `MICROSOFT_CLIENT_ID/SECRET` (sync is on the roadmap) |
| LinkedIn / Facebook / Instagram | Profiles saved as sources | Each platform's official API access. Sales Scout will not scrape. |
| Other CRMs | CSV / Excel export imports into most CRMs | Direct sync is on the roadmap |

---

## Keeping it improving

This repo includes a Claude Code agent, **platform-steward**. It audits the whole app, fixes problems, improves flows and adds capabilities, and records everything in `docs/ROADMAP.md`.

In Claude Code (terminal, desktop or claude.ai/code) with this repo open:

```
/evolve                    # full pass: audit → fix → enhance → evolve
/evolve audit              # just find and rank problems
/evolve evolve scheduled discovery
```

It works in verified steps (typecheck, tests, build, browser walkthrough), commits on a branch, and ends with a plain report, including anything you need to do.

## Later: as a plug-in

Two natural routes, both on the roadmap: a **browser extension** ("Add to Sales Scout" / "Find similar" from any company website), and a **Claude plugin/MCP connector** so you can ask Claude "find me mining companies like X" and have results land in Sales Scout. Both build on the API and services that already exist.
