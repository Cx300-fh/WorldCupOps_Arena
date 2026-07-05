# Offline Sync Lab Design

## Goal

Make tournament loading reliable when FIFA is unreachable and provide one self-contained cache-fallback exercise for a live Vibe Coding demonstration.

## Runtime behavior

- `GET /api/tournament` returns an existing cache immediately.
- When that cache is stale, the server starts one background refresh instead of blocking the page.
- `POST /api/refresh` still waits for an official refresh and reports stale-cache fallback on failure.
- Network failures expose a useful cause such as DNS failure or timeout.
- Concurrent refresh requests share one in-flight operation.
- A successful manual sync refreshes `data/fifa-2026.json`; failure never overwrites it.

## Exercise package

`labs/cache-fallback` is isolated from production code. It contains a deliberately broken starter, a resettable workspace, a reference solution, deterministic fixtures, tests, and a concise runbook. The exercise demonstrates fresh-cache, official-refresh, and stale-cache states without internet access.

The live workflow is:

1. Run `npm run lab:reset`.
2. Run `npm run lab:test` and observe the intended failure.
3. Copy the cache-fallback Plan prompt from the site.
4. Ask the coding agent to edit only `labs/cache-fallback/workspace/cache-policy.js`.
5. Run `npm run lab:test` again and review the evidence.

## Verification

- Production unit tests cover immediate stale reads, deduplicated refreshes, and detailed network errors.
- Exercise tests fail after reset and pass with the reference solution.
- The full existing test suite remains green.

