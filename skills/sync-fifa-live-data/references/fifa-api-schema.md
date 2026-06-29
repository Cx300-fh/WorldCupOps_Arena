# FIFA API Schema Reference

## Tournament identifiers

- Competition: `17`
- Season: `285023`
- Group stage: `289273`

## Official endpoints

### Calendar

```text
https://api.fifa.com/api/v3/calendar/matches?language=en&count=500&idSeason=285023
```

Important fields: `Results`, `IdMatch`, `IdStage`, `IdGroup`, `Date`, `MatchStatus`, `ResultType`, `Home`, `Away`, `HomeTeamScore`, `AwayTeamScore`, `Stadium`, `Properties.IdIFES`.

### Group standings

```text
https://api.fifa.com/api/v3/calendar/17/285023/289273/standing?language=en&count=200
```

Important fields: `Group`, `Position`, `Played`, `Won`, `Drawn`, `Lost`, `For`, `Against`, `GoalsDiference`, `Points`, `QualificationStatus`, `Team`.

`GoalsDiference` is the spelling used in the official response.

### Match detail and lineup

```text
https://api.fifa.com/api/v3/live/football/{competition}/{season}/{stage}/{match}?language=en
```

Important fields: `HomeTeam`, `AwayTeam`, `Players`, `Coaches`, `Tactics`, `Properties.IdIFES`.

### Timeline

```text
https://api.fifa.com/api/v3/timelines/{match}?language=en
```

Important fields: `Event`, `MatchMinute`, `TypeLocalized`, `EventDescription`, `IdTeam`.

### FDH player and team statistics

```text
https://fdh-api.fifa.com/v1/stats/match/{IdIFES}/players.json
https://fdh-api.fifa.com/v1/stats/match/{IdIFES}/teams.json
```

Player statistics are keyed by `IdPlayer`; each value is an array of `[metric, value, available]` records. Useful metrics include `Goals`, `Assists`, `Passes`, `PassesCompleted`, `TimePlayed`, `TotalDistance`, `TopSpeed`, and `XG`.

## Status interpretation

- `MatchStatus: 0` with a non-zero `ResultType`: completed.
- `MatchStatus: 1` with `ResultType: 0`: scheduled.
- Other active status values should be treated as live and refreshed frequently.

## Cache policy

- Calendar and standings: 60 minutes.
- Scheduled match detail: 60 minutes.
- Live match detail: 5 minutes.
- Completed match detail: 24 hours.
