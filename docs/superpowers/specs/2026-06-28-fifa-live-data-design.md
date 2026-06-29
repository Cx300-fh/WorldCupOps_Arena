# FIFA Live Data Upgrade Design

## Goal

Upgrade WorldCupOps Arena from a four-team teaching demo to a 2026 World Cup system backed by FIFA's official public JSON endpoints, with all 104 matches, 12 groups, knockout stages, standings, lineups, and player statistics.

## Architecture

- A local Node server serves the existing static app and exposes `/api/tournament`, `/api/match/:id`, `/api/refresh`, and `/api/status`.
- A FIFA client fetches the official calendar and standings once per hour, normalizes them, and writes `data/fifa-2026.json` atomically.
- Match detail is lazy-loaded. Opening a match fetches official live/lineup data and, when available, FDH player/team statistics. Each normalized detail is cached under `data/matches/`.
- The browser reads local APIs first. If the server is unavailable, it falls back to the checked-in tournament snapshot and keeps prediction features usable.

## Refresh Policy

- Tournament calendar and standings TTL: 60 minutes by default, configurable with `FIFA_REFRESH_MS`.
- Manual refresh: available in the UI and through `POST /api/refresh`.
- Match detail TTL: 5 minutes while a match is live, 60 minutes for scheduled matches, and 24 hours for completed matches.
- Requests use timeouts, a descriptive user agent, low concurrency, and cached fallback. No authentication bypass or private endpoints are used.

## Data Sources

- Calendar: `api.fifa.com/api/v3/calendar/matches`, season `285023`.
- Standings: `api.fifa.com/api/v3/calendar/17/285023/289273/standing`.
- Match detail/lineups: `api.fifa.com/api/v3/live/football/{competition}/{season}/{stage}/{match}`.
- Timeline: `api.fifa.com/api/v3/timelines/{match}`.
- Player and team stats: `fdh-api.fifa.com/v1/stats/match/{IdIFES}/players.json` and `teams.json`.

## UI

- Data-source status, last sync time, refresh button, and cache/offline state.
- Stage/group/team filters across all 104 matches.
- Twelve group standings and best-third-place view.
- Match detail with official score, venue, lineup, events, team metrics, and player stat table.
- Prediction remains separate from official results and is stored only in browser state.
- Vibe Coding tasks cover data normalization, cache fallback, player-stat joins, live refresh, and ranking rules.

## Failure Handling

- A failed refresh never overwrites a valid cache.
- API responses are schema-checked before normalization.
- Unavailable future-match lineups or FDH statistics render as an explicit unavailable state.
- The UI shows whether data is live, cached, or bundled.

## Testing

- Unit tests for normalization, TTL policy, standings grouping, match-detail joining, and cache fallback.
- Integration tests using local fixture JSON rather than FIFA network calls.
- Browser smoke tests for filters, refresh, match detail, player table, and mobile layout.

