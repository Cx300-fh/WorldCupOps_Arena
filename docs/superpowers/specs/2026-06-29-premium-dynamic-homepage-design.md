# WorldCupOps Arena Premium Dynamic Homepage

## Goal

Rebuild the overview as a high-impact tournament homepage while preserving the five existing data views and Vibe Coding task lab. The first viewport should feel like an event broadcast and editorial campaign, not a dashboard.

## Visual Direction

- Create an original `Tournament Editorial` identity instead of reproducing any single reference: cinematic event imagery in the hero, bold Swiss-style information typography, and clean magazine-like content bands below.
- Use deep ink, cool stadium blue, warm ivory, and electric chartreuse as the stable product palette. Trophy gold appears only where the subject itself introduces it.
- Use the active teams' colors as changing accents so every selected match has a distinct visual identity without changing the product's overall character.
- Use a full-bleed stadium photograph as environmental depth. Choose the strongest locally available wide image after testing crops; the supplied stadium-and-trophy image remains a safe fallback rather than a mandatory visual.
- Combine oversized editorial typography, real player cutouts, large team names, subtle grain, stadium light, and sparse interface chrome.
- Keep text, player imagery, score, and controls in separate layout zones at all breakpoints.

## Homepage Structure

### Global Header

- Place the WorldCupOps identity, five primary views, data state, refresh action, and experiment drawer entry in a slim translucent header over the hero.
- The header becomes a solid sticky bar after the hero or on internal views.

### Dynamic Match Hero

- Fill most of the first viewport with the stadium background.
- Show tournament label, stage, kickoff, venue, status, large team names, score, flags, and one representative player per team.
- Add previous and next controls plus a compact match selector rail.
- Selecting a match updates the hero in place: match metadata, score, team colors, flags, names, and portraits transition together.
- A separate action opens the selected match in Data Center.
- Completed matches request their detail payload and choose the best available player portrait. Scheduled matches attempt the same request but gracefully use flags and team typography when lineups are unavailable.
- The Mexico vs South Africa local portraits remain offline fallbacks, not a fixed homepage composition.

### Editorial Tournament Summary

- Move from the cinematic hero into bright editorial content bands instead of extending the dark treatment throughout the page.
- Replace the current side dashboard with a full-width oversized summary band for total matches, teams, host cities, completed matches, and tournament progress.
- Place upcoming matches in a horizontally scannable selector rather than a long stack.
- Keep group snapshots below as a compact grid with clear entry into standings.

## Data And Error Behavior

- Continue requesting `/api/tournament` and `/api/match/:id` when the Node service is available.
- When an API route returns HTML or 404, classify it as a missing local Node service instead of exposing raw response markup.
- Automatically load `data/fifa-2026.json` and bundled match snapshots where available.
- Show a short offline-snapshot message with the correct start command. Do not print response bodies into the UI.
- Keep the one-hour server refresh and stale-cache behavior unchanged.

## Possession Display

- Keep FIFA's three-part possession calculation so visible percentages total 100.
- Label the module `控球率`.
- Show the middle percentage inside its narrow segment but do not display the phrase `争夺中` anywhere in the visible component.
- Show only the two team names below the bar.

## Motion

- Use a short masked transition when changing the active match.
- Crossfade the stadium treatment, slide team names, and animate player cutouts from opposite sides.
- Add restrained pointer parallax to the hero and gentle motion to light/grain layers.
- Respect `prefers-reduced-motion` and preserve immediate interaction during transitions.

## Responsive Behavior

- Desktop: editorial copy on the left, score at center, player/flag composition across the full hero.
- Tablet: reduce typography and move the match selector to the bottom edge.
- Mobile: stack metadata above the faceoff, preserve all five main tabs, keep both teams visible, and use flags when player cutouts would crowd the score.
- No horizontal overflow at 390 px.

## Testing

- Unit-test concise API error classification and possession markup requirements.
- Structure-test the dynamic hero selector and absence of visible `争夺中` text.
- Browser-test match switching, portrait fallback, Data Center navigation, offline snapshot messaging, desktop layout, 390 px layout, and console errors.

## Scope

- Keep existing group, knockout, schedule, data, prediction, caching, and task-lab features.
- Do not add accounts, ticketing, news, commerce, or a new frontend framework.
