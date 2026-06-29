# Premium Dynamic Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Turn the overview into a cinematic, match-switching tournament homepage with graceful static-snapshot fallback.

**Architecture:** Keep the existing static HTML/CSS/JavaScript application. Add a testable HTTP-error formatter to the core module, make the spotlight match a first-class UI state with a reusable selector, and rebuild only the overview markup and visual layer while preserving the other four views and task drawer.

**Tech Stack:** HTML5, CSS custom properties and animations, browser JavaScript, Node.js tests, local Node HTTP service.

---

### Task 1: Concise API Fallback

**Files:**
- Modify: `src/worldcup-core.js`
- Modify: `src/app.js`
- Test: `test/worldcup-core.test.js`

- [x] Add a failing test that expects HTML 404 responses to produce `本地数据服务未启动，请运行 npm start` and JSON failures to produce a short status message.
- [x] Run `node test/worldcup-core.test.js` and confirm the formatter is missing.
- [x] Add `formatHttpError(status, contentType, body)` to the core exports and call it from `fetchJson`:

```js
function formatHttpError(status, contentType, body = "") {
  if (String(contentType).includes("text/html")) return "本地数据服务未启动，请运行 npm start";
  const message = String(body).trim().slice(0, 120);
  return message ? `请求失败（${status}）：${message}` : `请求失败（${status}）`;
}
```

- [x] Update snapshot fallback copy so raw HTML is never rendered.
- [x] Re-run the core test.

### Task 2: Dynamic Spotlight State

**Files:**
- Modify: `src/worldcup-core.js`
- Modify: `src/app.js`
- Test: `test/worldcup-core.test.js`

- [x] Add tests for `moveSpotlight(matches, currentId, direction)` including wraparound.
- [x] Run the core test and confirm failure.
- [x] Implement and export the pure selector helper.
- [x] Add `selectSpotlightMatch`, previous/next actions, and a five-match selector rail in `src/app.js`.
- [x] Make selector clicks update hero metadata, colors, flags, score, and portraits in place while the dedicated detail action still opens Data Center.
- [x] Re-run core tests.

### Task 3: Editorial Hero Structure And Asset

**Files:**
- Create: `assets/hero/world-cup-stadium.jpg`
- Modify: `index.html`
- Modify: `test/ui-structure.test.js`

- [x] Add structure assertions for the full-bleed backdrop, editorial copy, previous/next controls, selector rail, and detail action.
- [x] Run `node test/ui-structure.test.js` and confirm failure.
- [x] Optimize the supplied wide stadium image into the local hero asset.
- [x] Replace the current overview hero and side progress card with one full-width hero containing separate typography, match, player, score, controls, and selector zones.
- [x] Add a full-width tournament-stat band below the hero while keeping the existing metric IDs.
- [x] Re-run UI structure tests.

### Task 4: Unified Visual System And Possession Copy

**Files:**
- Modify: `styles.css`
- Modify: `src/app.js`
- Modify: `test/ui-structure.test.js`

- [x] Add source assertions that visible possession markup contains `控球率` and does not contain a visible `争夺中` label.
- [x] Run `node test/ui-structure.test.js` and confirm failure.
- [x] Rebuild the overview CSS around the Tournament Editorial palette, full-bleed imagery, large responsive typography, dynamic team-color lighting, and bright content bands.
- [x] Add match-change animations and reduced-motion overrides.
- [x] Change possession labels to two team names with the middle percentage remaining inside the bar.
- [x] Add 760 px and 460 px layouts with no overflow and no player/text overlap.
- [x] Re-run UI structure tests.

### Task 5: Verification

**Files:**
- Verify: `index.html`, `styles.css`, `src/app.js`, `src/worldcup-core.js`

- [x] Run `node --check src/app.js` and `node --check src/worldcup-core.js`.
- [x] Run all non-network tests and the full suite when loopback permission is available.
- [x] Start the Node service with `PORT=5176 npm start` if it is not already active.
- [x] In the in-app browser, verify desktop match switching, portrait fallback, detail navigation, possession totals, concise offline messaging, and zero console errors.
- [x] Verify the same hero and drawer at 390 x 844, then reset the viewport.
