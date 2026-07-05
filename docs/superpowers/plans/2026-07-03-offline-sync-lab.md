# Offline Sync Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make FIFA synchronization non-blocking and add a deterministic cache-fallback exercise package for the lecture.

**Architecture:** The FIFA client owns cache inspection, refresh deduplication, and actionable errors. The HTTP server serves stale data immediately and refreshes it in the background. A separate lab workspace mirrors the three-state cache policy with no dependency on live FIFA services.

**Tech Stack:** Node.js built-ins, CommonJS, existing HTTP server and assertion-based tests.

---

### Task 1: Non-blocking tournament cache

**Files:**
- Modify: `server/fifa-client.js`
- Modify: `server/server.js`
- Test: `test/fifa-client.test.js`
- Test: `test/server.test.js`

- [ ] Add failing tests for cache inspection, refresh deduplication, and immediate stale API responses.
- [ ] Run the focused tests and confirm they fail for the missing behavior.
- [ ] Add `peekTournament()`, share in-flight refreshes, and start background refreshes from the server.
- [ ] Run the focused tests and confirm they pass.

### Task 2: Actionable synchronization errors

**Files:**
- Modify: `server/fifa-client.js`
- Test: `test/fifa-client.test.js`

- [ ] Add a failing test that supplies a nested `ENOTFOUND` cause.
- [ ] Confirm the current generic error fails the assertion.
- [ ] Format DNS and timeout errors with the endpoint hostname and cause.
- [ ] Run the focused tests.

### Task 3: Offline cache-fallback exercise

**Files:**
- Create: `labs/cache-fallback/README.md`
- Create: `labs/cache-fallback/starter/cache-policy.js`
- Create: `labs/cache-fallback/workspace/cache-policy.js`
- Create: `labs/cache-fallback/solution/cache-policy.js`
- Create: `labs/cache-fallback/test/cache-policy.test.js`
- Create: `labs/cache-fallback/scripts/reset.js`
- Create: `labs/cache-fallback/scripts/apply-solution.js`
- Modify: `package.json`
- Modify: `src/worldcup-core.js`

- [ ] Write exercise tests for fresh cache, successful refresh, and failed refresh fallback.
- [ ] Add the broken starter and confirm reset plus test produces the intended failure.
- [ ] Add the minimal reference solution and confirm the exercise passes after applying it.
- [ ] Point the in-app task card and prompts to the isolated workspace and exact commands.

### Task 4: Refresh snapshot and verify

**Files:**
- Modify when online: `data/fifa-2026.json`
- Modify: `README.md`

- [ ] Run the official sync once in the normal network environment.
- [ ] Run `npm test`.
- [ ] Run the exercise red-green sequence: reset/fail, apply solution/pass.
- [ ] Start the server on an unused port and verify status, tournament response time, and static page loading.

