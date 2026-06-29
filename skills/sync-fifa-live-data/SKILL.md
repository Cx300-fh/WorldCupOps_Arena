---
name: sync-fifa-live-data
description: Sync and normalize FIFA World Cup 2026 official match, standings, lineup, timeline, team-stat, and player-stat JSON into local cache files. Use when Codex needs to build or refresh a FIFA-backed dashboard, add hourly cache fallback, inspect official FIFA API fields, or debug joins between match lineups and FDH player statistics.
---

# Sync FIFA Live Data

Use the bundled script to create stable local JSON snapshots from FIFA's public endpoints. Keep official requests in a local service or sync job; let browser code consume normalized cache files.

## Workflow

1. Run a tournament sync:

   ```bash
   node scripts/sync_fifa_data.mjs --output data/fifa-2026.json
   ```

2. Verify the snapshot contains 104 matches, 12 groups, and 48 teams.
3. Fetch a single match with lineup and player statistics when needed:

   ```bash
   node scripts/sync_fifa_data.mjs --output data/fifa-2026.json --match-id 400021443 --match-output data/matches/400021443.json
   ```

4. Serve cached JSON from a local Node service. Refresh tournament data every hour by default. Refresh live match detail more frequently only while a match is in progress.
5. Preserve the last successful cache when an official request fails. Never replace a valid cache with a partial response.

## Validation Rules

- Require `Results` arrays for calendar and standings responses.
- Join player statistics to lineup entries by `IdPlayer`; do not join by player name.
- Treat player and team statistics as optional. Keep lineup data usable when FDH endpoints return no data.
- Record `syncedAt`, source URLs, match count, group count, and team count.
- Label snapshots as FIFA official public JSON and link to the official tournament page.

## Endpoint Changes

Read `references/fifa-api-schema.md` before changing endpoint paths or normalization fields. FIFA's JSON endpoints are public and used by the official site, but they are not a versioned public developer contract.

## Safety

- Use low request frequency, timeouts, and local caching.
- Do not bypass authentication, cookies, access controls, or rate limits.
- Keep predictions and derived teaching metrics separate from official results.
- Attribute FIFA as the source and expose the last synchronization time.

