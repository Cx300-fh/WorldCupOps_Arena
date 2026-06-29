# FIFA Live Data Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add official 2026 World Cup schedule, standings, lineup, event, and player-stat synchronization with hourly cache-backed refresh.

**Architecture:** A dependency-free Node server owns FIFA requests, normalization, cache persistence, and static file serving. The browser consumes normalized local APIs and falls back to a bundled JSON snapshot.

**Tech Stack:** Node.js built-ins, browser JavaScript, HTML/CSS, `node:test`-style assertions, Playwright smoke checks.

---

### Task 1: Data Normalization

**Files:**
- Create: `server/fifa-normalize.js`
- Create: `test/fifa-normalize.test.js`

- [ ] Write failing tests for calendar, standings, lineups, player stats, and TTL selection.
- [ ] Run `node test/fifa-normalize.test.js` and confirm the module-missing failure.
- [ ] Implement normalization functions with schema checks.
- [ ] Re-run the tests and confirm all pass.

### Task 2: FIFA Client and Cache

**Files:**
- Create: `server/fifa-client.js`
- Create: `test/fifa-client.test.js`
- Create: `data/fifa-2026.json`

- [ ] Write failing tests using injected fetch and temporary cache paths.
- [ ] Implement timeout, hourly TTL, atomic cache writes, and stale-cache fallback.
- [ ] Sync a real official snapshot and verify it contains 104 matches and 12 groups.

### Task 3: Local Server

**Files:**
- Create: `server/server.js`
- Modify: `package.json`

- [ ] Add API routes for status, tournament, refresh, and match detail.
- [ ] Serve static project files with safe path handling.
- [ ] Start the server and verify API responses locally.

### Task 4: Full Tournament UI

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.js`
- Modify: `src/worldcup-core.js`

- [ ] Add data status, filters, 104-match browser, 12-group standings, best-third ranking, and match detail.
- [ ] Add lineup, event, team-stat, and player-stat panels.
- [ ] Preserve prediction and Vibe Coding task workflows against official match data.
- [ ] Add bundled snapshot fallback when local APIs are unavailable.

### Task 5: Reusable Skill

**Files:**
- Create: `skills/sync-fifa-live-data/SKILL.md`
- Create: `skills/sync-fifa-live-data/scripts/sync_fifa_data.mjs`
- Create: `skills/sync-fifa-live-data/references/fifa-api-schema.md`
- Create: `skills/sync-fifa-live-data/agents/openai.yaml`

- [ ] Package the sync workflow and API schema as a project-local reusable skill.
- [ ] Run the bundled sync script against a temporary output.
- [ ] Validate the skill with `quick_validate.py`.

### Task 6: Verification

**Files:**
- Modify: `README.md`
- Modify: `project_brief.md`

- [ ] Run all unit and integration tests.
- [ ] Run desktop and mobile browser smoke tests.
- [ ] Confirm official refresh, cache fallback, and unavailable-player states.
- [ ] Document operation, refresh interval, attribution, and endpoint fragility.

