# Sales Scout design language

**Feel:** a field guide, not a database. Calm paper surfaces, ink for structure, one pine green for action, and one amber "signal" for where your attention is needed.

## Brand
- **Mark:** a compass needle on an ink tile (`src/components/ui/logo.tsx`). The amber tip points to "where to go next". While Sales Scout is working, the needle seeks (`<LogoMark working />`); when it's done, it settles. That behaviour *is* the personality. There's no mascot.
- **Voice:** first person, plain, confident, never hype. "Found 5 companies worth a look." "I couldn't verify this." "I've got a clearer picture of your market."

## Tokens (`src/app/globals.css`)
| Role | Token | Use for |
| --- | --- | --- |
| Background / surfaces | `bg`, `surface`, `surface-2/3`, `border` | Layout. Prefer dividers and spacing over extra cards. |
| Ink | `text`, `brand-tile` | Text, the mark, the "Next step" block. |
| Action | `accent` (pine) | Primary buttons and links. One primary per view. |
| Signal | `signal` (amber) | Needs-you counts, "Start here", the needle tip. Use sparingly. |
| Insight | `insight`, `insight-border` + `<Insight>` / `<Needle>` | Anywhere Sales Scout explains itself: why a market or lead, what it noticed, research progress, the brief's next step. Never sparkles or gradients. |
| Navigation | `sidebar`, active = `accent-soft` + 3px pine edge | The brand anchor on every screen. |
| Meaning | `strong` / `moderate` / `weak` / `info` / `violet` | Fit levels, knowledge labels, status. `violet` = "suggested" knowledge and example data only. |

## Type
- **Display** (Bricolage Grotesque): `h1`, `h2` only. Page titles and section questions.
- **Body** (Geist): everything you read. Base 14.5px; never below 12px.
- Small uppercase labels are for data captions only, not section titles.

## Patterns
- **Answer the question the screen exists for first.** Home: "what should I do today?" Prospect: who, what, why, who to speak to, what to say, what next.
- **One primary action per view.** Secondary actions are ghost buttons; rare ones go in the ⋯ menu; destructive ones stay restrained.
- **Progressive disclosure.** Evidence, raw fit explanations, audit trails and filters sit one click away.
- **Every empty state** names what belongs there and offers the next action.
- **Interaction:** primary = pine fill; secondary and ghost turn pine on hover; focus is always the pine ring; menus highlight in pine tint. No page-specific button colours.
- **Colour lives in tokens only.** The only literal hex values allowed are the print report, platform marks and avatar tones.
- **Long work** shows real steps (`JobProgress`) and ends with a human line (`doneTitle`).
- **Mobile:** the key action sits in a bottom bar within thumb reach; sidebars become tab bars and sheets.
