# Tournament Portal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize WorldCupOps Arena into five tournament views with compact standings, layered scheduling, and a globally accessible Vibe Coding lab.

**Architecture:** Keep the current dependency-free HTML/CSS/JavaScript stack and official-data API. Add pure grouping and selection helpers to `worldcup-core.js`, then render each main view from the existing tournament snapshot in `app.js`; the DOM owns view visibility and accessible disclosure state.

**Tech Stack:** HTML5, CSS, browser JavaScript, Node.js built-in test runner style with `assert`, local FIFA API cache.

---

### Task 1: Tournament navigation and schedule helpers

**Files:**
- Modify: `test/worldcup-core.test.js`
- Modify: `src/worldcup-core.js`

- [ ] **Step 1: Write the failing helper tests**

Add assertions that `groupMatchesByDate` returns chronological date sections, `groupMatchesByStage` preserves the official round order, `selectOverviewMatches` prioritizes live/upcoming matches, and `rankOfficialThirdPlaceTeams(groups, 8, true)` can return only the qualification zone.

```js
assert.deepEqual(Ops.groupMatchesByDate(matches).map((section) => section.key), ["2026-06-11", "2026-06-12"]);
assert.deepEqual(Ops.groupMatchesByStage(matches).map((section) => section.stage), ["Group Stage", "Round of 32"]);
assert.equal(Ops.selectOverviewMatches(matches, 4).length, 4);
assert.equal(Ops.rankOfficialThirdPlaceTeams(groups, 8, true).length, 8);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node test/worldcup-core.test.js`

Expected: FAIL because one or more new helper functions or arguments do not exist.

- [ ] **Step 3: Implement the pure helpers**

Export helpers that accept arrays, avoid mutation, and return deterministic sections. Use the tournament's stage names and chronological ISO dates as grouping keys.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node test/worldcup-core.test.js`

Expected: all core assertions pass.

### Task 2: Five-view page structure

**Files:**
- Create: `test/ui-structure.test.js`
- Modify: `package.json`
- Modify: `index.html`

- [ ] **Step 1: Write the failing structural test**

Read `index.html` and assert the exact five `data-view-target` labels, one corresponding section per view, a compact best-third disclosure, and the global teaching-lab drawer.

```js
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
for (const label of ["总览", "小组赛", "淘汰赛", "赛程中心", "数据中心"]) assert.match(html, new RegExp(`>${label}<`));
assert.match(html, /id="teachingLabDrawer"/);
assert.match(html, /id="thirdPlaceDisclosure"/);
```

Append `node test/ui-structure.test.js` to the `npm test` command.

- [ ] **Step 2: Run the structural test and verify RED**

Run: `node test/ui-structure.test.js`

Expected: FAIL because the five-view DOM and lab drawer are absent.

- [ ] **Step 3: Replace the single vertical flow with view sections**

Create a compact tournament header and sticky five-tab navigation. Add these view responsibilities:

```text
overview: progress, featured match, next matches, quick standings
groups: one selected group, its table and six matches, collapsed third-place comparison
knockout: round selector and matches grouped by official round
schedule: date rail and date sections with compact match rows
data: selected-match scoreboard, team/player statistics and data health
```

Move the existing task controls and prompts into an `aside` drawer triggered globally.

- [ ] **Step 4: Run the structural test and verify GREEN**

Run: `node test/ui-structure.test.js`

Expected: all structural assertions pass.

### Task 3: View rendering and layered match navigation

**Files:**
- Modify: `src/app.js`
- Modify: `test/ui-structure.test.js`

- [ ] **Step 1: Add failing source-level behavior assertions**

Assert that `app.js` wires tab clicks through `setActiveView`, uses `groupMatchesByDate` for schedule sections, uses `groupMatchesByStage` for knockout rounds, and toggles `aria-expanded` for the best-third disclosure and lab drawer.

- [ ] **Step 2: Run the UI test and verify RED**

Run: `node test/ui-structure.test.js`

Expected: FAIL because the rendering and accessibility hooks are not implemented.

- [ ] **Step 3: Implement rendering and interactions**

Render only the current view's data. Match selection opens the data-center detail without losing the selected match. The schedule defaults to the closest active/upcoming date, date groups are collapsible, and each group or round shows its own compact match rows. Keep local prediction storage and official-data refresh behavior unchanged.

- [ ] **Step 4: Run focused and full tests**

Run: `node test/ui-structure.test.js && npm test`

Expected: all tests pass.

### Task 4: Tournament visual system and responsive QA

**Files:**
- Modify: `styles.css`
- Modify: `test/ui-structure.test.js`

- [ ] **Step 1: Add failing visual-contract assertions**

Assert that the stylesheet defines pitch texture, translucent tournament arcs, sticky primary navigation, responsive schedule rows, and drawer states. Also assert the old four-column `.match-grid` rule is gone.

- [ ] **Step 2: Run the UI test and verify RED**

Run: `node test/ui-structure.test.js`

Expected: FAIL on missing visual-system selectors.

- [ ] **Step 3: Implement the approved visual direction**

Use a pale green/blue page gradient, subtle CSS pitch lines, translucent arcs, restrained white surfaces, compact score rows, and active green navigation. Keep radii at 8px or less and ensure desktop/mobile layouts do not clip.

- [ ] **Step 4: Verify tests and browser behavior**

Run: `npm test`

Then start `npm start`, inspect desktop and mobile layouts in the in-app browser, click all five tabs, expand the best-third table, open/close the teaching drawer, select a schedule match, and confirm the 104 matches are represented through date/round layers.

- [ ] **Step 5: Final review**

Review the final diff against every approved requirement: five exact main tabs, compact best-third display, layered match cards, tournament background treatment, preserved live refresh/cache behavior, and a globally available Vibe Coding lab.
