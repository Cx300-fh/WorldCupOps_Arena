const fs = require("fs/promises");
const path = require("path");

const root = path.resolve(__dirname, "../..");

async function main() {
  const tournament = JSON.parse(await fs.readFile(path.join(root, "data/fifa-2026.json"), "utf8"));
  const files = await fs.readdir(path.join(root, "data/matches"));
  const players = new Map();

  for (const file of files.filter((name) => name.endsWith(".json"))) {
    const snapshot = JSON.parse(await fs.readFile(path.join(root, "data/matches", file), "utf8"));
    for (const side of [snapshot.data.home, snapshot.data.away]) {
      for (const player of side.players || []) {
        if (!player.id || !player.picture || Number(player.stats?.minutes || 0) <= 0) continue;
        const current = players.get(player.id) || {
          id: player.id,
          name: titleCase(player.name),
          team: side.name,
          country: side.country,
          number: player.shirtNumber,
          pictureUrl: player.picture,
          picture: `../assets/players/${player.id}.png`,
          stats: { minutes: 0, goals: 0, assists: 0, passes: 0, distance: 0, speed: 0, xg: 0 },
        };
        current.number = player.shirtNumber ?? current.number;
        current.pictureUrl = player.picture || current.pictureUrl;
        current.stats.minutes += Number(player.stats.minutes || 0);
        current.stats.goals += Number(player.stats.goals || 0);
        current.stats.assists += Number(player.stats.assists || 0);
        current.stats.passes += Number(player.stats.passes || 0);
        current.stats.distance += Number(player.stats.totalDistanceKm || 0);
        current.stats.speed = Math.max(current.stats.speed, Number(player.stats.topSpeed || 0));
        current.stats.xg += Number(player.stats.xg || 0);
        players.set(player.id, current);
      }
    }
  }

  const ranked = Array.from(players.values())
    .filter((player) => player.stats.minutes >= 120)
    .sort((a, b) => performanceScore(b) - performanceScore(a))
    .slice(0, 24)
    .map((player) => ({ ...player, stats: roundStats(player.stats) }));

  const round32 = tournament.matches
    .filter((match) => match.stage === "Round of 32")
    .sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0));
  const bracketTeams = round32.flatMap((match) => [match.home, match.away]).map((team) => ({
    id: String(team.id), name: team.name, code: team.code, country: team.country,
  }));

  await fs.writeFile(path.join(root, "labs/player-duel/fixtures/players.json"), `${JSON.stringify(ranked, null, 2)}\n`);
  await fs.writeFile(path.join(root, "labs/knockout-path/fixtures/teams.json"), `${JSON.stringify(bracketTeams, null, 2)}\n`);
  console.log(`Generated ${ranked.length} real players and ${bracketTeams.length} Round-of-32 teams.`);
}

function performanceScore(player) {
  const s = player.stats;
  return s.goals * 100 + s.assists * 65 + s.xg * 15 + s.minutes / 20 + s.passes / 100;
}
function roundStats(stats) {
  return Object.fromEntries(Object.entries(stats).map(([key, value]) => [key, Math.round(value * 100) / 100]));
}
function titleCase(name) {
  return String(name).toLowerCase().replace(/(^|[ -])\p{L}/gu, (match) => match.toUpperCase());
}

main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
