# Development Labs Implementation Plan

**Goal:** Add three offline, resettable feature-development labs with previews, tests, solutions, and Arena task entries.

**Architecture:** Each lab owns fixtures, a browser workspace, pure CommonJS-compatible core logic, acceptance tests, a broken starter, and a verified solution. Root scripts reset or solve one lab without touching production code.

**Tech Stack:** HTML, CSS, browser JavaScript, Node.js assertions, Canvas, localStorage.

## Tasks

1. Write failing core acceptance tests for player comparison, poster view models, and bracket propagation.
2. Build Player Duel starter, solution, preview, fixtures, reset scripts, and documentation.
3. Build Match Poster starter, solution, Canvas preview, fixtures, reset scripts, and documentation.
4. Build Knockout Path starter, solution, bracket preview, fixtures, reset scripts, and documentation.
5. Add root npm commands and Arena task-pack metadata with preview links.
6. Verify each reset fails for the intended missing feature, each solution passes, production tests pass, and all previews render without console errors.
