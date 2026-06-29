const assert = require("assert");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");

const { createFifaClient } = require("../server/fifa-client.js");

async function test(name, fn) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

function response(data, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    async json() {
      return data;
    },
  };
}

const calendar = {
  Results: [
    {
      IdCompetition: "17",
      IdSeason: "285023",
      IdStage: "289273",
      IdGroup: "289275",
      IdMatch: "400021443",
      Date: "2026-06-11T19:00:00Z",
      MatchStatus: 0,
      ResultType: 1,
      MatchNumber: 1,
      StageName: [{ Locale: "en-GB", Description: "First Stage" }],
      GroupName: [{ Locale: "en-GB", Description: "Group A" }],
      Home: { IdTeam: "43911", TeamName: [{ Description: "Mexico" }], Abbreviation: "MEX" },
      Away: { IdTeam: "43883", TeamName: [{ Description: "South Africa" }], Abbreviation: "RSA" },
      HomeTeamScore: 2,
      AwayTeamScore: 0,
      Properties: { IdIFES: "151600" },
    },
  ],
};

const standings = {
  Results: [
    {
      IdGroup: "289275",
      Group: [{ Description: "Group A" }],
      Position: 1,
      Played: 3,
      Won: 2,
      Drawn: 1,
      Lost: 0,
      For: 6,
      Against: 2,
      Points: 7,
      Team: { IdTeam: "43911", Name: [{ Description: "Mexico" }], Abbreviation: "MEX" },
    },
  ],
};

async function makePaths() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "fifa-client-test-"));
  return {
    root,
    cacheFile: path.join(root, "fifa-2026.json"),
    matchCacheDir: path.join(root, "matches"),
  };
}

test("refreshTournament fetches, normalizes, and writes a cache snapshot", async () => {
  const paths = await makePaths();
  const fetchImpl = async (url) => response(url.includes("standing") ? standings : calendar);
  const client = createFifaClient({ ...paths, fetchImpl, now: () => 1_000_000 });

  const result = await client.refreshTournament();
  const saved = JSON.parse(await fs.readFile(paths.cacheFile, "utf8"));

  assert.equal(result.matches.length, 1);
  assert.equal(result.groups.length, 1);
  assert.equal(result.meta.matchCount, 1);
  assert.equal(saved.meta.syncedAt, new Date(1_000_000).toISOString());
});

test("loadTournament returns a fresh cache without calling FIFA", async () => {
  const paths = await makePaths();
  const data = { meta: { syncedAt: new Date(900_000).toISOString() }, matches: [], groups: [] };
  await fs.writeFile(paths.cacheFile, JSON.stringify(data));
  let calls = 0;
  const client = createFifaClient({
    ...paths,
    now: () => 1_000_000,
    refreshMs: 60 * 60 * 1000,
    fetchImpl: async () => {
      calls += 1;
      return response({});
    },
  });

  const result = await client.loadTournament();
  assert.equal(result.source, "cache");
  assert.equal(result.stale, false);
  assert.equal(calls, 0);
});

test("loadTournament falls back to stale cache when FIFA refresh fails", async () => {
  const paths = await makePaths();
  const data = { meta: { syncedAt: new Date(0).toISOString() }, matches: [{ id: "cached" }], groups: [] };
  await fs.writeFile(paths.cacheFile, JSON.stringify(data));
  const client = createFifaClient({
    ...paths,
    now: () => 10_000_000,
    refreshMs: 1000,
    fetchImpl: async () => {
      throw new Error("network down");
    },
  });

  const result = await client.loadTournament();
  assert.equal(result.source, "stale-cache");
  assert.equal(result.stale, true);
  assert.equal(result.data.matches[0].id, "cached");
});

test("getMatchDetail fetches live, timeline, and FDH stats then caches them", async () => {
  const paths = await makePaths();
  const live = {
    IdMatch: "400021443",
    IdCompetition: "17",
    IdSeason: "285023",
    IdStage: "289273",
    MatchStatus: 0,
    ResultType: 1,
    HomeTeam: {
      IdTeam: "43911",
      TeamName: [{ Description: "Mexico" }],
      Players: [{ IdPlayer: "1", IdTeam: "43911", PlayerName: [{ Description: "Player One" }], Status: 1 }],
    },
    AwayTeam: { IdTeam: "43883", TeamName: [{ Description: "South Africa" }], Players: [] },
    Properties: { IdIFES: "151600" },
  };
  const fetchImpl = async (url) => {
    if (url.includes("timelines")) return response({ Event: [] });
    if (url.includes("players.json")) return response({ 1: [["Passes", 25, true]] });
    if (url.includes("teams.json")) return response({});
    return response(live);
  };
  const client = createFifaClient({ ...paths, fetchImpl, now: () => 1_000_000 });
  const match = {
    id: "400021443",
    competitionId: "17",
    seasonId: "285023",
    stageId: "289273",
    status: "completed",
    ifesId: "151600",
  };

  const result = await client.getMatchDetail(match, { force: true });
  const cachePath = path.join(paths.matchCacheDir, "400021443.json");
  const saved = JSON.parse(await fs.readFile(cachePath, "utf8"));

  assert.equal(result.data.home.players[0].stats.passes, 25);
  assert.equal(saved.meta.matchId, "400021443");
});

(async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
})();
