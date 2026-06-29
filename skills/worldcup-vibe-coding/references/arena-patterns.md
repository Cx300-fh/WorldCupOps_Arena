# Arena Patterns

## Red-Green Core

Start with tests for deterministic logic:

```js
const standings = calculateStandings(["A", "B", "C", "D"], fixtures);
assert.equal(standings[0].team, "A");
```

Then implement the pure function. Only after core tests pass, connect the browser UI.

## Teaching Bug Types

- **Ranking bug**: sorting ignores a tie-breaker.
- **State bug**: table updates but chart remains stale.
- **Validation bug**: illegal input mutates state.
- **Prompt bug**: plan prompt skips verification.
- **Scope bug**: execute prompt allows unrelated edits.

## UI Sections

Use these sections for a complete teaching arena:

1. Control panel
2. Simulation state
3. Visualization
4. Task pack
5. Verification checklist
6. Export package
