#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const CALENDAR_URL = "https://api.fifa.com/api/v3/calendar/matches?language=en&count=500&idSeason=285023";
const STANDINGS_URL = "https://api.fifa.com/api/v3/calendar/17/285023/289273/standing?language=en&count=200";

const args = parseArgs(process.argv.slice(2));
const output = path.resolve(args.output || "data/fifa-2026.json");

const calendarRaw = await fetchJson(CALENDAR_URL);
const standingsRaw = await fetchJson(STANDINGS_URL);
const matches = normalizeCalendar(calendarRaw);
const groups = normalizeStandings(standingsRaw);
const teams = uniqueTeams(matches);
const snapshot = {
  meta: {
    seasonId: "285023",
    competitionId: "17",
    syncedAt: new Date().toISOString(),
    source: "FIFA official public JSON",
    sourceUrl: CALENDAR_URL,
    matchCount: matches.length,
    groupCount: groups.length,
    teamCount: teams.length,
  },
  teams,
  groups,
  matches,
};
await writeJsonAtomic(output, snapshot);
console.log(`Tournament snapshot: ${output}`);
console.log(`Matches ${matches.length}, groups ${groups.length}, teams ${teams.length}`);

if (args["match-id"]) {
  const match = matches.find((item) => item.id === String(args["match-id"]));
  if (!match) throw new Error(`Match ${args["match-id"]} was not found in the calendar`);
  const live = await fetchJson(`https://api.fifa.com/api/v3/live/football/${match.competitionId}/${match.seasonId}/${match.stageId}/${match.id}?language=en`);
  const timeline = await safeFetch(`https://api.fifa.com/api/v3/timelines/${match.id}?language=en`, { Event: [] });
  const ifesId = match.ifesId || live.Properties?.IdIFES;
  const playerStats = ifesId ? await safeFetch(`https://fdh-api.fifa.com/v1/stats/match/${ifesId}/players.json`, {}) : {};
  const teamStats = ifesId ? await safeFetch(`https://fdh-api.fifa.com/v1/stats/match/${ifesId}/teams.json`, {}) : {};
  const matchOutput = path.resolve(args["match-output"] || `data/matches/${match.id}.json`);
  await writeJsonAtomic(matchOutput, {
    meta: { matchId: match.id, ifesId: ifesId || null, syncedAt: new Date().toISOString(), source: "FIFA official public JSON" },
    data: normalizeMatchDetail(live, timeline, playerStats, teamStats),
  });
  console.log(`Match snapshot: ${matchOutput}`);
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "sync-fifa-live-data/1.0 educational-cache-sync" } });
  if (!response.ok) throw new Error(`FIFA request failed (${response.status}) for ${url}`);
  return response.json();
}

async function safeFetch(url, fallback) {
  try { return await fetchJson(url); } catch { return fallback; }
}

function localized(value, fallback = "") {
  if (typeof value === "string") return value;
  if (!Array.isArray(value) || !value.length) return fallback;
  return (value.find((item) => /^en(?:-|$)/i.test(item.Locale || "")) || value[0]).Description || fallback;
}

function team(raw = {}) {
  raw = raw || {};
  return { id: String(raw.IdTeam || ""), name: localized(raw.TeamName || raw.Name, raw.ShortClubName || raw.Abbreviation || "Unknown"), code: raw.Abbreviation || "", country: raw.IdCountry || raw.IdAssociation || "" };
}

function normalizeCalendar(raw) {
  if (!Array.isArray(raw.Results)) throw new Error("Calendar response is missing Results");
  return raw.Results.map((match) => ({
    id: String(match.IdMatch), competitionId: String(match.IdCompetition), seasonId: String(match.IdSeason), stageId: String(match.IdStage), groupId: match.IdGroup ? String(match.IdGroup) : null,
    stage: localized(match.StageName, "Unknown stage"), group: localized(match.GroupName, ""), date: match.Date, status: match.ResultType && match.MatchStatus === 0 ? "completed" : match.MatchStatus === 1 ? "scheduled" : "live", matchNumber: Number(match.MatchNumber || 0),
    home: team(match.Home), away: team(match.Away), score: { home: match.HomeTeamScore ?? null, away: match.AwayTeamScore ?? null, homePenalties: match.HomeTeamPenaltyScore ?? null, awayPenalties: match.AwayTeamPenaltyScore ?? null },
    stadium: localized(match.Stadium?.Name, ""), city: localized(match.Stadium?.CityName, ""), attendance: match.Attendance ? Number(match.Attendance) : null, ifesId: match.Properties?.IdIFES ? String(match.Properties.IdIFES) : null,
  }));
}

function normalizeStandings(raw) {
  if (!Array.isArray(raw.Results)) throw new Error("Standings response is missing Results");
  const groups = new Map();
  for (const row of raw.Results) {
    const name = localized(row.Group || row.GroupName, String(row.IdGroup));
    if (!groups.has(name)) groups.set(name, { id: String(row.IdGroup || ""), name, rows: [] });
    groups.get(name).rows.push({ position: Number(row.Position), team: team(row.Team), played: Number(row.Played), won: Number(row.Won), drawn: Number(row.Drawn), lost: Number(row.Lost), goalsFor: Number(row.For), goalsAgainst: Number(row.Against), goalDifference: Number(row.GoalsDiference ?? row.For - row.Against), points: Number(row.Points), qualificationStatus: row.QualificationStatus || "" });
  }
  return [...groups.values()].map((group) => ({ ...group, rows: group.rows.sort((a, b) => a.position - b.position) })).sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
}

function normalizeMatchDetail(live, timeline, playerStats, teamStats) {
  const side = (raw) => ({ ...team(raw), score: raw.Score ?? null, tactics: raw.Tactics || "", players: (raw.Players || []).map((player) => {
    const stats = Object.fromEntries((playerStats[player.IdPlayer] || []).map(([name, value]) => [name, value]));
    return { id: String(player.IdPlayer), teamId: String(player.IdTeam), name: localized(player.PlayerName, "Unknown player"), shirtNumber: player.ShirtNumber ?? null, position: Number(player.Position ?? -1), starter: player.Status === 1, captain: Boolean(player.Captain), picture: player.PlayerPicture?.PictureUrl || null, stats: { minutes: round(stats.TimePlayed, 1), goals: Number(stats.Goals || 0), assists: Number(stats.Assists || 0), passes: Number(stats.Passes || 0), passesCompleted: Number(stats.PassesCompleted || 0), topSpeed: round(stats.TopSpeed, 2), totalDistanceKm: round(Number(stats.TotalDistance || 0) / 1000, 2), xg: round(stats.XG, 2) } };
  }) });
  return { id: String(live.IdMatch), date: live.Date, status: live.ResultType && live.MatchStatus === 0 ? "completed" : live.MatchStatus === 1 ? "scheduled" : "live", home: side(live.HomeTeam), away: side(live.AwayTeam), events: (timeline.Event || []).map((event) => ({ id: String(event.EventId || ""), teamId: event.IdTeam ? String(event.IdTeam) : null, minute: event.MatchMinute || "", type: localized(event.TypeLocalized, ""), description: localized(event.EventDescription, "") })), teamStats: { home: Object.fromEntries((teamStats[live.HomeTeam.IdTeam] || []).map(([name, value]) => [name, value])), away: Object.fromEntries((teamStats[live.AwayTeam.IdTeam] || []).map(([name, value]) => [name, value])) } };
}

function uniqueTeams(matches) { const map = new Map(); for (const match of matches) for (const item of [match.home, match.away]) if (item.id) map.set(item.id, item); return [...map.values()].sort((a, b) => a.name.localeCompare(b.name)); }
function round(value, digits) { const factor = 10 ** digits; return Math.round(Number(value || 0) * factor) / factor; }
function parseArgs(values) { const result = {}; for (let index = 0; index < values.length; index += 1) { const key = values[index]; if (!key.startsWith("--")) continue; const next = values[index + 1]; result[key.slice(2)] = next && !next.startsWith("--") ? values[++index] : true; } return result; }
async function writeJsonAtomic(file, data) { await fs.mkdir(path.dirname(file), { recursive: true }); const temp = `${file}.${process.pid}.tmp`; await fs.writeFile(temp, `${JSON.stringify(data, null, 2)}\n`); await fs.rename(temp, file); }
