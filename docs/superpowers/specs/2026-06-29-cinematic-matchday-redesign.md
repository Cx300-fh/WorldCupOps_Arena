# Cinematic Matchday Redesign

**Status:** Approved through the B2 visual companion mockups on 2026-06-29.

## Goal

Turn the existing WorldCupOps Arena into a visually distinctive, motion-rich World Cup application while preserving its five-view information architecture, official-data refresh, cache fallback, predictions, match details, and responsive behavior.

## Visual Direction

The approved direction combines the B face-off composition with A's broadcast motion language:

- A real FIFA player portrait enters from each side of the featured match.
- The match title, players, score, and team labels use separate layout zones so text never covers a face or shirt.
- Team colors drive a split stadium background. Deep green remains the product anchor and lime is reserved for live/action emphasis.
- A moving result ticker, field markings, large tournament typography, and restrained scan/track lines create broadcast energy.
- Existing cards become flatter information surfaces over a layered green/blue page background.
- Motion uses CSS, the Web Animations API, and IntersectionObserver. `prefers-reduced-motion` disables nonessential motion.

## Real Image Strategy

- Use FIFA Digital Hub transparent PNG player portraits already present in official match-detail data.
- Store two approved fallback portraits locally so the first render remains visual without a network request.
- When a selected match includes player portraits, prefer the captain, then a starting forward, then another starter.
- If a match has no published lineup, retain the local portraits only for their matching teams; otherwise render large team flags without mislabelling players.
- Images use fixed aspect-ratio containers to avoid layout shift.

## Page Components

### Global shell

- Compact brand/header, live source state, manual refresh, and task-lab trigger.
- Sticky five-view navigation remains: 总览 / 小组赛 / 淘汰赛 / 赛程中心 / 数据中心.
- Background gains animated field geometry and translucent tournament arcs.

### Overview

- Featured face-off hero uses the first completed match with locally available detail, falling back to the existing selection logic.
- Upcoming matches remain in a compact list under the hero.
- Tournament progress and group snapshots retain their data density.
- Metric numbers animate once when data becomes available.

### Group, knockout, and schedule views

- Keep the approved progressive disclosure and date/round hierarchy.
- Add reveal transitions, active-state motion, and richer stage headers without increasing the number of simultaneously visible matches.

### Data center

- Possession becomes a three-state control: home possession, in contest, and away possession.
- The display values are rounded so the three visible integers always sum to 100.
- When possession values are absent or zero, show an unavailable state rather than claiming 100% in contest.
- Other match metrics retain the two-team comparison layout.

### Task lab

- Remove user-facing occurrences of the word “教学”.
- Each task shows difficulty, estimated duration, starting files, objective, and five stages: 观察现象, 生成计划, 执行最小改动, 制造失败, 提交证据.
- Add progressive hints, completion criteria, next challenge, prompt-copy actions, and persistent checklist progress.
- Keep GLM Coding Plan, opencode Execute, Debug Prompt, and task export.

## Data Flow

1. Tournament data loads from the Node API or bundled snapshot.
2. The overview renders immediately with stable fallbacks.
3. Match detail is requested only for the spotlight or an explicitly selected match and cached in memory after the first response.
4. Player portraits update the face-off hero only when they match the displayed teams.
5. Possession control derives the in-contest value from `1 - home - away` and rounds all three values as one unit.
6. Task progress is stored in `localStorage` by task ID.

## Error Handling

- Preserve the existing official/cache/stale-cache states.
- Broken player images collapse to team flags without shifting the hero.
- Missing match detail leaves the overview usable and data center displays explicit unavailable states.
- Clipboard failures leave the prompt visible and show a short inline status.
- Reduced-motion users receive immediate state changes without animation.

## Testing

- Unit-test possession splitting, rounding, and no-data behavior.
- Extend structural tests for the face-off hero, ticker, task path, and absence of the prohibited UI word.
- Preserve all server, normalization, cache, and tournament tests.
- Browser-test all five views, player-image fallback, task drawer, possession totals, date rail, desktop layout, and 390px mobile layout.
- Check console errors and horizontal overflow.
