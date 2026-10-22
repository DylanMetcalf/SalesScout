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

Once it's online, the key set on the server is **yours**: administrators (the emails in `ADMIN_EMAILS`) use it without limits. Everyone else brings their own key in Settings, unless you grant them yours in **Admin**, optionally with a monthly allowance. A key pasted in Settings always takes priority for that account.

**GitHub (one-time):** the code is on the branch `claude/stoic-rubin-jbjib7`. Either merge it into `main` (ask Claude to open a pull request), or point Render at this branch directly. Nothing else is needed on GitHub; Render reads the repo.

**Render:**
1. Sign up at https://render.com and connect your GitHub account.
2. **New + → Blueprint**, then pick the `SalesScout` repo (and branch). Render reads `render.yaml` and sets up:
   - a web service (paid **Starter** instance, needed for the persistent disk that holds your database; check Render's current pricing),
   - a 1 GB disk at `/var/data` for the database and uploads,
   - `APP_ENCRYPTION_KEY`, generated automatically. **Never change it**, or saved keys become unreadable.
3. When asked for `ANTHROPIC_API_KEY`, paste your key. When asked for `ADMIN_EMAILS`, enter the email you'll log in with.
4. Click **Apply**. After a few minutes you'll get a URL like `https://sales-scout-xxxx.onrender.com`.
5. Open it and create **your** account with that email. You'll see **Admin** in the sidebar.
6. Optional: set `ALLOW_SIGNUPS` = `false` (Environment tab) to make sign-up invite-only. Invite codes are created in **Admin**, and administrator emails can always sign up. Either way, new accounts can't spend your AI key unless you allow it.
7. **Settings → Custom Domains** to use your own domain, (the site already defaults to `https://www.salesscout.co.za`; set `SITE_URL` only if that changes).

**Clients and access codes:** in **Admin → Access codes**, create a code (ideally tied to the client's email, with an access length such as 30 days) and send them the ready-made message. They sign in at `/login` with their email and the code as the password. Under **Accounts** you can **Pause** them (signed out at once), **Resume**, or change **Access until** when they renew.

**Discovery calls:** create a booking page in Calendly, Cal.com or Google Calendar (appointment schedule), connect Zoom or Google Meet there, then set `BOOKING_URL` to its link. The Contact page shows the calendar; the tool sends the invite with the meeting link.

**Enquiry emails:** create a free account at resend.com using the inbox that should receive enquiries, create an API key, and set `RESEND_API_KEY`.

**Monitoring:** `.github/workflows/uptime.yml` checks the live site every 10 minutes and opens a GitHub issue (which emails you) if it's down, closing it when it's back.

**Selling subscriptions (Paystack):**
1. Create a Paystack business account (paystack.com) and complete its verification.
2. In Paystack → Products → Plans, create monthly plans (Scout, Growth, Scale) in ZAR. Copy each plan code (`PLN_…`).
3. In Paystack → Settings → API Keys & Webhooks, set the webhook URL to `https://www.salesscout.co.za/api/billing/paystack` and copy the secret key.
4. In Render → Environment set `PAYSTACK_SECRET_KEY`, `PAYSTACK_PLAN_SCOUT/GROWTH/SCALE` and `PLAN_PRICE_ZAR_SCOUT/GROWTH/SCALE` (the same prices as the Paystack plans).
5. Test with Paystack's test keys first (`sk_test_…` and a test card), then switch to live keys.
Until then, put clients on plans manually in **Admin → Accounts → Plan** (credits and limits apply the same way).

**Plans and limits** live in `src/lib/billing/plans.ts`. Free accounts get 5 unlocks once (one per mailbox; Gmail aliases share it). Keeping a prospect uses 1 unlock; previews, skips and rejections don't. Searches, previews and deep research have monthly/daily limits per plan.

**Free-account protection:** set `REQUIRE_EMAIL_VERIFICATION=true` (needs a verified sending domain in Resend) and/or `REQUIRE_PHONE_VERIFICATION=true` with Twilio Verify credentials. The free unlocks then arrive only after verification, and one phone number can't claim them twice.

**Locked out?** In Admin, each user has a **Reset link** button: send them the one-time link. If you're the one locked out, open the service's **Shell** tab in Render and run `npm run reset-link -- you@example.com`.

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
