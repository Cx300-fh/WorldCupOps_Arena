---
name: worldcup-vibe-coding
description: Use when creating or extending a WorldCupOps-style Vibe Coding teaching arena with sports prediction, standings simulation, data visualization, task cards, prompts, verification, and debugging exercises.
---

# WorldCup Vibe Coding Arena

Use this skill to build or extend a themed Vibe Coding teaching system that combines interactive simulation with task-card-driven coding practice.

## Core Pattern

Build every arena around five linked surfaces:

1. **Interactive domain state**: user-controlled predictions, sliders, filters, or scenario switches.
2. **Deterministic model**: pure functions for scoring, ranking, validation, and derived metrics.
3. **Data visualization**: charts or status panels that reveal state changes immediately.
4. **Vibe Coding task pack**: task card, GLM Coding Plan prompt, opencode Execute prompt, verification checklist, Debug prompt.
5. **Assessment hooks**: tests, hidden cases, score badges, exportable task package.

## Implementation Rules

- Keep domain logic in pure JavaScript functions that can run in Node tests and browser UI.
- Write tests first for scoring, sorting, validation, and task-pack generation.
- Treat visual bugs as teaching material: stale chart, wrong tie-breaker, invalid input, missing verification.
- Use sample data unless the user explicitly requests live data integration.
- Label sample data clearly when using real-world themes.

## Useful Function Boundaries

- `calculateStandings(teams, fixtures)`
- `updateFixturePrediction(fixtures, id, homeGoals, awayGoals)`
- `rankThirdPlaceTeams(groups)`
- `estimateQualificationChances(standings, options)`
- `buildVibeTaskPack(taskId)`

## Task Pack Template

Each task pack should include:

- Goal
- Input
- Output
- Constraints
- Acceptance criteria
- Seed bug
- Plan prompt
- Execute prompt
- Debug prompt
- Verification checklist

## Extension Ideas

- Hidden tests for algorithmic rules.
- Leaderboard based on prediction accuracy or task completion.
- Trace replay for prompt, code diff, test output, and debug loop.
- Real data import as an advanced task, not as the baseline.

For reusable testing and UI patterns, read `references/arena-patterns.md`.
