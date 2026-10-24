# Sales Scout design language: "Signal"

Sales Scout is a software, AI and automation partner. The brand should feel like a precise, calm technology company: clear structure, one strong action colour, one signal accent, and nothing that reads as editorial or newspaper-like.

## Brand reset (October 2026)
The previous direction ("Field Notes": warm paper, serif-italic accent words, numbered mono captions, vermilion route lines) borrowed an editorial, newspaper-like vocabulary and was too close to the separate Over Coffee publication. It was replaced at the token level, not patched. Don't reintroduce serif accents, paper tones, numbered "01 —" captions or vermilion.

## Brand
- **Mark:** the focus frame. Four corner brackets close in on one signal dot (`LogoMark`, `FRAME_PATH` in `src/components/ui/logo.tsx`). Meaning: finding the thing that matters inside a messy problem. While Sales Scout is working the dot pulses (`working`).
- **Wordmark:** "Sales Scout" in Geist Sans semibold, tracking −0.025em.
- **Assets:** `public/brand/` has the mark (default, reverse, mono), the lockup (default, reverse; text outlined, so no font needed), PNGs at 512/64 px (64 px is used in emails). Favicon `src/app/icon.svg`, `apple-icon.png`, OG image `opengraph-image.tsx`.
- **Clear space:** at least the width of one bracket arm (5/32 of the tile) around the mark. Minimum size 16 px.

## Colour
| Role | Token | Light | Dark (`.theme-ink`) |
|---|---|---|---|
| Page | `bg` | Cloud White `#F4F7FB` | Deep Ink `#0B1220` |
| Card | `surface` | `#FFFFFF` | Technical Slate `#17263D` |
| Text / heading | `text`, `heading` | `#0B1220` | `#E6EDF7` / `#F4F7FB` |
| Secondary text | `muted`, `subtle` | `#3B4A63`, `#56657D` | `#A9B6CC`, `#8A99B3` |
| Action | `accent` | Signal Cobalt `#315EFB` (white text, 5.1:1) | same cobalt, white text |
| Link / accent text | `accent-text` | `#2447D6` | `#A3B9FF` |
| Signal | `signal` | cobalt | Electric Cyan `#43D9FF` |
| Controls' borders | `border-strong` | `#7F8FA8` (3.3:1) | `#5A6D8C` |

Electric Cyan is only used on dark surfaces: it fails contrast on light ones. Status colours (`strong`, `moderate`, `weak`, `info`) carry meaning only; every text pairing is AA (checked with axe and a contrast script). No colours outside `globals.css`, except emails, print reports, platform marks and avatar tones.

## Type
Geist Sans for everything: headings semibold with tight tracking (−0.03 to −0.045em), body regular. Emphasis in a headline is colour (`.accent-word`), never a second typeface. Geist Mono (`.caption-mono`) only for technical metadata: references, IDs, labels inside data and example tags.

## Motif
**Focus frames and signal paths.** `.frame` puts corner brackets around the one thing that matters in a view (the proposed solution, the last step, the intake form); `.frame-hover` reveals them on hover/focus; `.frame-inset` for boxes that clip overflow. `FrameGlyph` is the small version for section labels. Signal paths are thin lines from neutral nodes to a cobalt/cyan node (`Waypoints`, the homepage process and problem scan). Use one frame per view.

## Brand scopes
- `.theme-ink` re-points every token to the dark palette, so components inside adapt. Used for hero bands, the final CTA, the briefing cover and the workspace sidebar.
- `.theme-paper`: a light card inside a dark area.
- `.brand-hero`: Deep Ink with a restrained cobalt light source. `.hero-grid` / `.tech-grid`: a fine 48 px technical grid.

## Motion
Short, functional: `animate-rise` on entry, `.reveal` (transform-only scroll lift), `waypoint-pulse` on the current node and the working mark. Everything respects `prefers-reduced-motion`.

## Public website
One job: help a business explain what isn't working. `src/app/(site)/`: `/` (home), `/start` (problem intake), `/start/received` (confirmation), `/book` (booking or call-request fallback), plus privacy and terms. Shared chrome in `src/components/site/chrome.tsx`; copy in `src/content/site.ts`; new public pages must also be added to `PUBLIC` in `src/middleware.ts`.
- One primary CTA everywhere: "Explore My Problem". "Book a call" is the only secondary. In a briefing the CTA is "Let’s Discuss Your Solution".
- The headline and primary CTA must be in the first viewport on desktop and mobile.
- No invented proof: no testimonials, logos, stats or results. Illustrative examples are labelled "Example".
- Visitor-facing copy never promises savings, timelines or a free solution.

## Briefings
`/b/[token]` is a brand asset: a Deep Ink cover (mark, reference, title, prepared-for/date/status), then six parts with "Part n of 6" labels and frame-glyph headings, the proposed solution as a framed ink panel, and an ink "Let’s discuss your solution" close. The customer email uses the same identity (ink header with the PNG mark, cobalt button).

## Operator documents
Generated documents (`/reports/...`) share one print shell: white A4, an ink header rule ending in a cobalt node, page numbers from `@page`, `.keep` for blocks that shouldn't split. Literal hex colours are allowed here.

## Patterns
- **Answer the question the screen exists for first.** Home: "what should I do today?" Prospect: who, what, why, who to speak to, what to say, what next.
- **One primary action per view.** Secondary actions are ghost buttons; rare ones go in the ⋯ menu; destructive ones stay restrained.
- **Progressive disclosure.** Evidence, raw fit explanations, audit trails and filters sit one click away.
- **Every empty state** names what belongs there and offers the next action.
- **Interaction:** primary = cobalt fill; secondary and ghost turn cobalt on hover; focus is always the cobalt ring; menus highlight in cobalt tint. No page-specific button colours.
- **Colour lives in tokens only.** The only literal hex values allowed are the print report, platform marks and avatar tones.
- **Long work** shows real steps (`JobProgress`) and ends with a human line (`doneTitle`).
- **Mobile:** the key action sits in a bottom bar within thumb reach; sidebars become tab bars and sheets.

