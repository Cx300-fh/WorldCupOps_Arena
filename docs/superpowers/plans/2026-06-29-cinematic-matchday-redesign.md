# Cinematic Matchday Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved B2 real-player face-off design, correct FIFA possession-control rendering, and turn the task drawer into a guided five-stage workflow.

**Architecture:** Preserve the dependency-free HTML/CSS/browser-JavaScript application and Node data service. Add deterministic domain helpers to `worldcup-core.js`, render the new hero and task path from existing data in `app.js`, and keep image/motion fallbacks in local assets and CSS.

**Tech Stack:** HTML5, CSS animations, browser JavaScript, IntersectionObserver, Web Animations API, Node.js, FIFA official JSON and Digital Hub PNG assets.

---

### Task 1: FIFA possession-control calculation

**Files:**
- Modify: `test/worldcup-core.test.js`
- Modify: `src/worldcup-core.js`

- [ ] **Step 1: Add failing possession tests**

```js
test("splitPossessionControl preserves FIFA's in-contest state", () => {
  assert.deepEqual(splitPossessionControl(0.56, 0.36), { home: 56, contest: 8, away: 36 });
});

test("splitPossessionControl rounds three states to exactly 100", () => {
  const result = splitPossessionControl(0.5709360242, 0.3609120846);
  assert.equal(result.home + result.contest + result.away, 100);
});

test("splitPossessionControl reports missing possession", () => {
  assert.equal(splitPossessionControl(0, 0), null);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node test/worldcup-core.test.js`

Expected: FAIL because `splitPossessionControl` is not exported.

- [ ] **Step 3: Implement deterministic three-state rounding**

Compute raw home, away, and `Math.max(0, 1 - home - away)` shares. Convert to percentages with a largest-remainder allocation so visible integers total 100; return `null` when both teams have no value.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node test/worldcup-core.test.js`

Expected: all core assertions pass.

### Task 2: Approved face-off hero structure and assets

**Files:**
- Modify: `test/ui-structure.test.js`
- Modify: `index.html`
- Create: `assets/players/mexico-montes.png`
- Create: `assets/players/south-africa-williams.png`

- [ ] **Step 1: Add failing structural assertions**

```js
assert.match(html, /id="faceoffHero"/);
assert.match(html, /id="homeHeroPlayer"/);
assert.match(html, /id="awayHeroPlayer"/);
assert.match(html, /class="match-ticker"/);
assert.doesNotMatch(html, />[^<]*教学[^<]*</);
```

- [ ] **Step 2: Run the UI test and verify RED**

Run: `node test/ui-structure.test.js`

Expected: FAIL because the face-off DOM is absent.

- [ ] **Step 3: Download the approved official portraits**

Use the FIFA Digital Hub URLs already returned by match detail data and store the PNGs under `assets/players/`. Verify both files have nonzero size and PNG signatures.

- [ ] **Step 4: Replace the overview pitch panel**

Build four non-overlapping zones: match metadata header, player arena, central score/action, and team-name footer. Add a ticker immediately under the arena and preserve `featuredMatch` as the render target.

- [ ] **Step 5: Run structural tests**

Run: `node test/ui-structure.test.js`

Expected: face-off structure assertions pass.

### Task 3: Hero data, portrait selection, and motion orchestration

**Files:**
- Modify: `test/ui-structure.test.js`
- Modify: `src/app.js`

- [ ] **Step 1: Add failing source-level assertions**

```js
assert.match(app, /function selectHeroPlayer\(/);
assert.match(app, /function updateHeroPortraits\(/);
assert.match(app, /function initializeRevealAnimations\(/);
assert.match(app, /prefers-reduced-motion/);
```

- [ ] **Step 2: Run the UI test and verify RED**

Run: `node test/ui-structure.test.js`

Expected: FAIL because the hero portrait and motion functions do not exist.

- [ ] **Step 3: Render the approved face-off markup**

Use the selected completed match as spotlight, keep upcoming fixtures in `overviewMatches`, set deterministic team-color CSS variables, and render fixed image containers before data arrives.

- [ ] **Step 4: Add safe portrait enrichment**

Select captain first, then a starting forward, then a starter. Update the hero only when match-detail home/away IDs match the spotlight teams. Cache match-detail responses in memory and retain flags when no lineup exists.

- [ ] **Step 5: Add motion orchestration**

Use IntersectionObserver for reveal classes, pointer movement for a small hero parallax offset, animated counters for tournament metrics, and the View Transition API for view changes when available. Respect reduced-motion preferences.

- [ ] **Step 6: Run syntax and structural tests**

Run: `node --check src/app.js && node test/ui-structure.test.js`

Expected: both commands exit 0.

### Task 4: Three-state data center and guided task path

**Files:**
- Modify: `test/ui-structure.test.js`
- Modify: `src/worldcup-core.js`
- Modify: `src/app.js`
- Modify: `index.html`

- [ ] **Step 1: Add failing task-path assertions**

```js
assert.match(html, /id="taskPath"/);
assert.match(html, /id="taskMeta"/);
assert.match(html, /id="taskHint"/);
assert.match(app, /function renderTaskPath\(/);
assert.match(app, /worldcupops-task-progress/);
```

- [ ] **Step 2: Run UI tests and verify RED**

Run: `node test/ui-structure.test.js`

Expected: FAIL because guided task controls are absent.

- [ ] **Step 3: Enrich task definitions**

For every task, add difficulty, duration, start files, observation prompt, five concrete stages, a hint, completion conditions, and one next challenge. Keep existing prompt generation and acceptance criteria.

- [ ] **Step 4: Render and persist task progress**

Render five step rows, metadata pills, progressive hint, completion conditions, and copy buttons. Store checked verification items by task ID in `localStorage` and restore them when switching tasks.

- [ ] **Step 5: Render possession control separately**

Call `Ops.splitPossessionControl` for Possession and render a segmented bar with home, contest, and away values. Leave all remaining metrics in the current two-team comparison list.

- [ ] **Step 6: Run focused and full tests**

Run: `node test/worldcup-core.test.js && node test/ui-structure.test.js && npm test`

Expected: all tests pass.

### Task 5: Full visual system, responsive behavior, and delivery verification

**Files:**
- Modify: `styles.css`
- Modify: `test/ui-structure.test.js`
- Modify: `README.md`

- [ ] **Step 1: Add failing visual-contract assertions**

Assert the stylesheet defines `.faceoff-arena`, `.hero-player`, `.match-ticker`, `.possession-segments`, `.task-step`, reveal states, reduced-motion handling, and 390px-safe player positioning.

- [ ] **Step 2: Run UI tests and verify RED**

Run: `node test/ui-structure.test.js`

Expected: FAIL on missing approved visual selectors.

- [ ] **Step 3: Implement the complete B2 styling**

Apply split team colors, broadcast green shell, real-player cutouts, ticker movement, field lines, scroll reveals, active transitions, darker data surfaces, and mobile fallbacks. Keep readable contrast, stable aspect ratios, and card radii at or below 8px inside the app.

- [ ] **Step 4: Update run documentation**

Document `npm start`, the one-hour refresh behavior, API routes, image fallback behavior, and the possession-control third state.

- [ ] **Step 5: Run fresh automated verification**

Run: `npm test`

Expected: zero failures.

- [ ] **Step 6: Run browser verification**

Start the Node service on an available port. On desktop and 390px mobile: inspect all five views, confirm no horizontal overflow, verify the three possession values sum to 100, open/close the task lab, persist a checklist item, confirm selected date visibility, and inspect browser console errors.
