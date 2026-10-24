# Sales Scout design language: "Field Notes"

**Feel:** a well-kept field notebook for business problems. Warm paper and deep ink, one cobalt for action, and a vermilion **route**: the brand's signature line, running from where a business is (hollow waypoint) to where it wants to be (vermilion waypoint).

## How we got here (October 2026)
Researched live, in a browser: Stripe, Linear, Vercel, Raycast, Mercury, Attio, Arc/Dia, Framer, Anthropic and Website Design Awards (Awwwards and CSS Design Awards were unreachable from the build environment). What we took, as principles rather than looks:
- **Colour inside the headline** directs the eye (Stripe) → one serif-italic word in vermilion per headline.
- **Colour as category identity** (Raycast) → eight problem hues, one per kind of problem.
- **Product logic as connected cards** (Attio) → the hero's routed example and the route-style progress.
- **Restraint, line diagrams, numbered figures** (Linear, Vercel) → mono "Fig. 01" captions and section indices.
- **Warm paper, serif + grotesk, mono captions** (Anthropic, Website Design Awards) → the base palette and type system.
- **The product as the demo** (Mercury) → the labelled example assessment on the homepage.

Three directions were weighed: *Expressive technology* (dark, saturated: memorable but close to every AI site), *Editorial intelligence* (paper, serif, restraint: credible, calm) and *Interactive systems* (diagrams, connected cards: explains the service). **Chosen: editorial intelligence as the base, with interactive systems as the signature**, so it reads as thoughtful first and clever second. It also carries into the workspace and printed documents without decoration.

## Brand
- **Mark:** one S-shaped route on an ink tile, from a hollow waypoint to a vermilion one (`src/components/ui/logo.tsx`, `src/app/icon.svg`). While Sales Scout is working the route traces itself (`<LogoMark working />`).
- **The route** is the recurring motif: hero figure, "how it works", intake progress, confirmation, opportunity stage tracker, closing CTA, document headers. Reuse `<Waypoints>` (`src/components/brand/waypoints.tsx`) rather than drawing new progress UI.
- **Voice:** plain, calm, confident, never hype. "Your business has a better way forward." No invented proof, ever.

## Type
- **Display:** Bricolage Grotesque, tight tracking (−0.03 to −0.04em on large sizes). `h1`, `h2`, card titles.
- **Accent:** Instrument Serif *italic* (`.accent-serif`), one phrase per headline, usually in `text-signal`. Never for body text.
- **Body:** Geist. Base 15px; never below 12px.
- **Technical captions:** Geist Mono uppercase (`.caption-mono`, 12px): section indices ("01 — What we solve"), figure labels, metadata, stat labels.

## Tokens (`src/app/globals.css`)
| Role | Token | Use for |
| --- | --- | --- |
| Background / surfaces | `bg` (paper), `surface`, `surface-2/3`, `border` | Layout. Prefer dividers and spacing over extra cards. |
| Ink | `text`, `heading`, `brand-tile` | Text, the mark, dark brand areas. |
| Action | `accent` (cobalt) | Primary buttons and links. One primary per view. |
| Route | `signal` (vermilion) | The route line, waypoints, the accent word, needs-you counts. Graphics and large text only: never a background for small text. |
| Category hues | `hue-cobalt/vermilion/jade/saffron/orchid/sky/rose/olive` + `.hue` | Problem categories only. Set `--hue` and use `--hue-soft` (tint), `--hue-line` (border), `--hue-ink` (text). Solids are for icons and dots. |
| Insight | `insight`, `insight-border` + `<Insight>` / `<Needle>` | Anywhere Sales Scout explains itself: why a market or lead, what it noticed, research progress, the brief's next step. Never sparkles or gradients. |
| Navigation | `sidebar`, active = `accent-soft` + 3px accent edge | The brand anchor on every screen. |
| Meaning | `strong` / `moderate` / `weak` / `info` / `violet` | Fit levels, knowledge labels, status. `violet` = "suggested" knowledge and example data only. |

## Brand scopes
- `.theme-paper` does the opposite: a light card inside a dark area (the website contact form and product preview).
- `.theme-ink` re-points every token to the dark brand palette, so any component inside it adapts automatically. Used for the sidebar, mobile top bar, demo banner, sign-in panel, heroes and research progress.
- `.brand-hero` is ink with two quiet glows (cobalt top-right, vermilion bottom-left). Hero moments only: the homepage figure, closing CTA, sign-in, Home briefing, Discover, research in progress.
- `.hero-grid` / `.paper-grid`: a faint dot grid like graph paper, masked to fade out.
- Primary buttons are solid cobalt with a soft coloured shadow; public CTAs are pill-shaped with a trailing arrow (`trailing` prop) that nudges forward on hover.
- The background is warm paper, never stark white. Cards are the lightest surface.

## Motion
- Tokens: `--dur-fast` 140ms, `--dur` 220ms, `--dur-slow` 420ms; `--ease-out`, `--ease-spring`.
- Meaningful only: the route draws itself (`.route-draw`, `.route-on-view`), the current waypoint pulses, cards lift on hover, arrows nudge. No parallax, no scroll-jacking.
- Scroll-linked effects move things but **never hide them** (no opacity): print, crawlers and screenshots don't scroll.
- Everything respects `prefers-reduced-motion`.
- Prospect cards carry a fit-coloured left edge, and pipeline columns carry their stage colour on top.

## Public website
One job: help a business explain what isn't working. `src/app/(site)/`: `/` (home), `/start` (problem intake), `/start/received` (confirmation), `/book` (booking or call-request fallback), plus privacy and terms. Shared chrome in `src/components/site/chrome.tsx`; copy in `src/content/site.ts`; new public pages must also be added to `PUBLIC` in `src/middleware.ts`.
- One primary CTA everywhere: "Tell us your problem". "Book a call" is the only secondary.
- Homepage sections are numbered (`00`–`04`) with mono labels; each h2 carries one serif-italic accent phrase.
- No invented proof: no testimonials, logos, stats or results. The hero's example card is labelled "Example".
- Visitor-facing copy never promises savings, timelines or a free solution.

## Operator documents
Generated documents (`/reports/opportunity/[id]`) share one print shell: white A4, an ink header rule ending in a vermilion waypoint, mono section labels, page numbers from `@page`, `.keep` for blocks that shouldn't split. Each version is frozen when created. Literal hex colours are allowed here, as in the prospect brief.

## Patterns
- **Answer the question the screen exists for first.** Home: "what should I do today?" Prospect: who, what, why, who to speak to, what to say, what next.
- **One primary action per view.** Secondary actions are ghost buttons; rare ones go in the ⋯ menu; destructive ones stay restrained.
- **Progressive disclosure.** Evidence, raw fit explanations, audit trails and filters sit one click away.
- **Every empty state** names what belongs there and offers the next action.
- **Interaction:** primary = cobalt fill; secondary and ghost turn cobalt on hover; focus is always the cobalt ring; menus highlight in cobalt tint. No page-specific button colours.
- **Colour lives in tokens only.** The only literal hex values allowed are the print report, platform marks and avatar tones.
- **Long work** shows real steps (`JobProgress`) and ends with a human line (`doneTitle`).
- **Mobile:** the key action sits in a bottom bar within thumb reach; sidebars become tab bars and sheets.

