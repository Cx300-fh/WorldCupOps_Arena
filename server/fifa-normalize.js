function localized(value, fallback = "") {
  if (typeof value === "string") return value;
  if (!Array.isArray(value) || value.length === 0) return fallback;
  const english = value.find((item) => /^en(?:-|$)/i.test(item.Locale || ""));
  return (english || value[0]).Description || fallback;
}

function matchStatus(raw) {
  if (raw.ResultType && raw.MatchStatus === 0) return "completed";
  if (raw.MatchStatus === 1 && !raw.ResultType) return "scheduled";
  if ([2, 3, 4, 5].includes(raw.MatchStatus)) return "live";
  if (raw.ResultType) return "completed";
  return "scheduled";
}

function normalizeTeam(team = {}) {
  return {
    id: String(team.IdTeam || team.Id || ""),
    name: localized(team.TeamName || team.Name, team.ShortClubName || team.Abbreviation || "Unknown"),
    code: team.Abbreviation || localized(team.DisplayName, ""),
    country: team.IdCountry || team.IdAssociation || "",
  };
}

function normalizeCalendar(raw) {
  const results = Array.isArray(raw) ? raw : raw && raw.Results;
  if (!Array.isArray(results)) throw new Error("FIFA calendar response is missing Results");
  return results.map((match) => ({
    id: String(match.IdMatch),
    competitionId: String(match.IdCompetition || ""),
    seasonId: String(match.IdSeason || ""),
    stageId: String(match.IdStage || ""),
    groupId: match.IdGroup ? String(match.IdGroup) : null,
    stage: localized(match.StageName, "Unknown stage"),
    group: localized(match.GroupName, ""),
    date: match.Date,
    status: matchStatus(match),
    matchNumber: Number(match.MatchNumber || 0),
    home: normalizeTeam(match.Home || match.HomeTeam),
    away: normalizeTeam(match.Away || match.AwayTeam),
    score: {
      home: match.HomeTeamScore ?? match.Home?.Score ?? match.HomeTeam?.Score ?? null,
      away: match.AwayTeamScore ?? match.Away?.Score ?? match.AwayTeam?.Score ?? null,
      homePenalties: match.HomeTeamPenaltyScore ?? null,
      awayPenalties: match.AwayTeamPenaltyScore ?? null,
    },
    stadium: localized(match.Stadium && match.Stadium.Name, ""),
    city: localized(match.Stadium && match.Stadium.CityName, ""),
    attendance: match.Attendance == null || match.Attendance === "" ? null : Number(match.Attendance),
    ifesId: match.Properties && match.Properties.IdIFES ? String(match.Properties.IdIFES) : null,
  }));
}

function normalizeStandings(raw) {
  const results = Array.isArray(raw) ? raw : raw && raw.Results;
  if (!Array.isArray(results)) throw new Error("FIFA standings response is missing Results");
  const groups = new Map();
  results.forEach((row) => {
    const name = localized(row.Group || row.GroupName, row.IdGroup ? `Group ${row.IdGroup}` : "Ungrouped");
    if (!groups.has(name)) groups.set(name, { id: String(row.IdGroup || ""), name, rows: [] });
    const goalsFor = Number(row.For || 0);
    const goalsAgainst = Number(row.Against || 0);
    groups.get(name).rows.push({
      position: Number(row.Position || 0),
      team: normalizeTeam(row.Team || { IdTeam: row.IdTeam }),
      played: Number(row.Played || 0),
      won: Number(row.Won || 0),
      drawn: Number(row.Drawn || 0),
      lost: Number(row.Lost || 0),
      goalsFor,
      goalsAgainst,
      goalDifference: Number(row.GoalsDiference ?? goalsFor - goalsAgainst),
      points: Number(row.Points || 0),
      qualificationStatus: row.QualificationStatus || "",
      fairPlayCoefficient: Number(row.FairPlayCoefficient || 0),
    });
  });
  return Array.from(groups.values())
    .map((group) => ({ ...group, rows: group.rows.sort((a, b) => a.position - b.position) }))
    .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
}

function statsMap(entries) {
  if (!Array.isArray(entries)) return {};
  return Object.fromEntries(entries.map(([name, value]) => [name, value]));
}

function normalizePlayer(player, rawStats) {
  const stats = statsMap(rawStats);
  return {
    id: String(player.IdPlayer || ""),
    teamId: String(player.IdTeam || ""),
    name: localized(player.PlayerName || player.ShortName, "Unknown player"),
    shirtNumber: player.ShirtNumber ?? null,
    position: Number(player.Position ?? -1),
    starter: player.Status === 1,
    captain: Boolean(player.Captain),
    picture: player.PlayerPicture && player.PlayerPicture.PictureUrl ? player.PlayerPicture.PictureUrl : null,
    stats: {
      minutes: round(stats.TimePlayed, 1),
      goals: Number(stats.Goals || 0),
      assists: Number(stats.Assists || 0),
      attempts: Number(stats.AttemptAtGoal || 0),
      shotsOnTarget: Number(stats.AttemptAtGoalOnTarget || 0),
      passes: Number(stats.Passes || 0),
      passesCompleted: Number(stats.PassesCompleted || 0),
      topSpeed: round(stats.TopSpeed, 2),
      totalDistanceKm: round(Number(stats.TotalDistance || 0) / 1000, 2),
      xg: round(stats.XG, 2),
    },
  };
}

function normalizeSide(team, playerStats) {
  const base = normalizeTeam(team);
  const players = Array.isArray(team && team.Players)
    ? team.Players.map((player) => normalizePlayer(player, playerStats && playerStats[player.IdPlayer]))
    : [];
  return {
    ...base,
    score: team && team.Score != null ? Number(team.Score) : null,
    tactics: team && team.Tactics ? team.Tactics : "",
    players,
  };
}

function normalizeEvents(timeline) {
  const events = timeline && Array.isArray(timeline.Event) ? timeline.Event : [];
  return events.map((event) => ({
    id: String(event.EventId || ""),
    teamId: event.IdTeam ? String(event.IdTeam) : null,
    minute: event.MatchMinute || "",
    type: localized(event.TypeLocalized, String(event.Type || "")),
    description: localized(event.EventDescription, ""),
    homeGoals: Number(event.HomeGoals || 0),
    awayGoals: Number(event.AwayGoals || 0),
  }));
}

function normalizeMatchDetail(live, timeline = {}, playerStats = {}, teamStats = {}) {
  if (!live || !live.IdMatch) throw new Error("FIFA live response is missing IdMatch");
  return {
    id: String(live.IdMatch),
    competitionId: String(live.IdCompetition || ""),
    seasonId: String(live.IdSeason || ""),
    stageId: String(live.IdStage || ""),
    date: live.Date,
    status: matchStatus(live),
    home: normalizeSide(live.HomeTeam || live.Home, playerStats),
    away: normalizeSide(live.AwayTeam || live.Away, playerStats),
    events: normalizeEvents(timeline),
    teamStats: {
      home: statsMap(teamStats && teamStats[(live.HomeTeam || live.Home || {}).IdTeam]),
      away: statsMap(teamStats && teamStats[(live.AwayTeam || live.Away || {}).IdTeam]),
    },
    ifesId: live.Properties && live.Properties.IdIFES ? String(live.Properties.IdIFES) : null,
  };
}

function getMatchDetailTtl(match) {
  if (match.status === "live") return 5 * 60 * 1000;
  if (match.status === "completed") return 24 * 60 * 60 * 1000;
  return 60 * 60 * 1000;
}

function round(value, digits) {
  const number = Number(value || 0);
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
}

module.exports = {
  localized,
  normalizeTeam,
  normalizeCalendar,
  normalizeStandings,
  normalizeMatchDetail,
  getMatchDetailTtl,
};
