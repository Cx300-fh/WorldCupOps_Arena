# Development Labs Design

## Goal

Add three feature-development projects to the WorldCupOps Arena lab: Player Duel, Match Poster, and Knockout Path. Each project must run offline, remain isolated from the production application, and support a complete Plan, Execute, Verify, Reset, and Reference Solution workflow.

## Shared Package Contract

Each project lives under `labs/<project-name>/` and contains:

- `README.md`: task, commands, files, acceptance criteria, and extension ideas.
- `starter/`: deterministic incomplete implementation used by reset.
- `workspace/`: files modified by opencode.
- `solution/`: verified reference implementation.
- `test/`: Node-based acceptance tests.
- `scripts/`: reset and apply-solution commands.
- `fixtures/`: local tournament, player, or bracket data required by the project.

Every workspace exposes a browser preview through the existing Node static server. No experiment may require FIFA availability, API credentials, package installation, or a database.

Root `package.json` provides commands in the form:

```text
npm run lab:<name>:reset
npm run lab:<name>:test
npm run lab:<name>:solution
```

## Player Duel

### User flow

The user selects two different players. The page compares goals, assists, passing, distance, speed, and xG, then marks the leader for each metric. Changing either player updates the comparison immediately.

### Development boundary

The starter includes the page shell, fixtures, and styling foundation. The workspace implementation adds player selection state, metric normalization, missing-value handling, leader calculation, and rendering.

### Acceptance criteria

- The same player cannot occupy both selections.
- Normalized chart values stay within 0 to 100.
- Missing statistics never render `NaN` or break the page.
- Switching players updates names, metrics, bars, and leaders together.
- Pure comparison logic is covered by Node tests.

## Match Poster

### User flow

The user selects a fixture and a poster mode. The preview combines teams, flags, score or kickoff time, date, venue, and generated team colors. The user exports a fixed-size PNG.

### Development boundary

The starter includes fixture data and the poster frame. The workspace implementation adds state selection, safe text fitting, deterministic team colors, image fallback, and export behavior.

### Acceptance criteria

- Fixture changes update every poster field.
- Pre-match and post-match modes display the correct time or score.
- Long team and venue names stay inside the poster.
- Missing or blocked images fall back without preventing export.
- Export produces a PNG with the specified dimensions.

## Knockout Path

### User flow

The user selects winners from the Round of 32 through the final. Winners advance to the correct next match, the selected route is highlighted, and the complete scenario persists locally.

### Development boundary

The starter includes deterministic Round-of-32 fixtures and bracket markup. The workspace implementation adds winner state, round propagation, downstream invalidation, persistence, reset, and champion highlighting.

### Acceptance criteria

- Each match has at most one selected winner.
- A selected winner appears in the correct downstream slot.
- Changing an earlier winner clears invalid downstream selections.
- Reloading restores a valid saved scenario.
- Reset removes all selections and restores the initial bracket.
- Bracket propagation is covered by pure Node tests.

## Arena Integration

The existing lab drawer adds three project entries. Each task pack contains:

- Feature goal, inputs, outputs, constraints, and acceptance criteria.
- Exact workspace and test paths.
- A Plan prompt that requires architecture, state flow, incremental steps, and verification.
- An Execute prompt that limits edits to the selected workspace and requires the project test command.
- Five progress steps and persistent completion checks.
- A preview link and command reference.

The current cache-fallback exercise remains unchanged.

## Error Handling

- Fixture parsing failures show a visible preview error.
- Local storage failures fall back to in-memory state.
- Image failures use local or generated placeholders.
- Export failures leave the preview usable and show an actionable message.
- Tests must use deterministic local data and cannot access the network.

## Verification

For each project:

1. Reset must reproduce the intended incomplete state and failing acceptance test.
2. Applying the solution must make all project tests pass.
3. The preview must load from the local server without console errors.
4. Desktop and mobile layouts must avoid clipping and overlap.
5. The existing `npm test` suite must remain green.

