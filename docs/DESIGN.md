# Sales Scout design language

**Feel:** "Scout Night". Navy ink for structure, a calm teal for action, a soft cool-grey workspace, and one amber "signal" for where your attention is needed.

## Brand
- **Mark:** the S-curve with two waypoints on a teal tile (`src/components/ui/logo.tsx`). While Sales Scout is working, the S traces itself (`<LogoMark working />`). `<Needle>` is the small S glyph used to mark Sales Scout's reasoning. There's no mascot.
- **Voice:** first person, plain, confident, never hype. "Found 5 companies worth a look." "I couldn't verify this." "I've got a clearer picture of your market."

## Tokens (`src/app/globals.css`)
| Role | Token | Use for |
| --- | --- | --- |
| Background / surfaces | `bg`, `surface`, `surface-2/3`, `border` | Layout. Prefer dividers and spacing over extra cards. |
| Ink | `text`, `brand-tile` | Text, the mark, the "Next step" block. |
| Action | `accent` (teal) | Primary buttons and links. One primary per view. |
| Signal | `signal` (amber) | Needs-you counts, "Start here", the needle tip. Use sparingly. |
| Insight | `insight`, `insight-border` + `<Insight>` / `<Needle>` | Anywhere Sales Scout explains itself: why a market or lead, what it noticed, research progress, the brief's next step. Never sparkles or gradients. |
| Navigation | `sidebar`, active = `accent-soft` + 3px pine edge | The brand anchor on every screen. |
| Meaning | `strong` / `moderate` / `weak` / `info` / `violet` | Fit levels, knowledge labels, status. `violet` = "suggested" knowledge and example data only. |

## Type
- **Display** (Bricolage Grotesque): `h1`, `h2` only. Page titles and section questions.
- **Body** (Geist): everything you read. Base 14.5px; never below 12px.
- Small uppercase labels are for data captions only, not section titles.

## Brand scopes
- `.theme-paper` does the opposite: a light card inside a dark area (the website contact form and product preview).
- `.theme-ink` re-points every token to the dark brand palette, so any component inside it adapts automatically. Used for the sidebar, mobile top bar, demo banner, sign-in panel, heroes and research progress.
- `.brand-hero` is the Sales Scout gradient (deep → primary green, a soft mint glow and a faint amber warmth). Use it only for hero moments: the Home briefing, Discover, research in progress, sign-in. Never on ordinary cards.
- Primary buttons use the green gradient with a coloured shadow. They're the only buttons that "pop".
- The workspace background is tinted green-slate, never plain white. Cards are the lightest surface.
- Prospect cards carry a fit-coloured left edge, and pipeline columns carry their stage colour on top.

## Public website
The marketing site for the done-for-you service lives in `src/app/(site)/` (`/`, `/why-us`, `/how-it-works`, `/services`, `/contact`) with shared chrome in `src/components/site/chrome.tsx`; new public pages must also be added to `PUBLIC` in `src/middleware.ts`. All its copy lives in `src/content/site.ts`. Enquiries from its form are stored in `enquiries` and listed under Settings → Website enquiries for the installation owner (the first account). Never add invented stats, testimonials or prices there.

## Patterns
- **Answer the question the screen exists for first.** Home: "what should I do today?" Prospect: who, what, why, who to speak to, what to say, what next.
- **One primary action per view.** Secondary actions are ghost buttons; rare ones go in the ⋯ menu; destructive ones stay restrained.
- **Progressive disclosure.** Evidence, raw fit explanations, audit trails and filters sit one click away.
- **Every empty state** names what belongs there and offers the next action.
- **Interaction:** primary = pine fill; secondary and ghost turn pine on hover; focus is always the pine ring; menus highlight in pine tint. No page-specific button colours.
- **Colour lives in tokens only.** The only literal hex values allowed are the print report, platform marks and avatar tones.
- **Long work** shows real steps (`JobProgress`) and ends with a human line (`doneTitle`).
- **Mobile:** the key action sits in a bottom bar within thumb reach; sidebars become tab bars and sheets.

## Palettes
Scout Night is the default. Alternatives are five base colours each under `[data-palette]` in `globals.css` (every token is derived from them) and listed in `src/lib/palettes.ts`. Users try them from Settings → Appearance or the "Colours" button on the website (signed-in only); the choice is saved per browser. To make one the default, move its five colours into the `:root` tokens. `OUT=<dir> node scripts/dev/palettes.mjs` screenshots every palette.
