const fs = require("fs/promises");
const path = require("path");

const {
  normalizeCalendar,
  normalizeStandings,
  normalizeMatchDetail,
  getMatchDetailTtl,
} = require("./fifa-normalize.js");

const CALENDAR_URL =
  "https://api.fifa.com/api/v3/calendar/matches?language=en&count=500&idSeason=285023";
const STANDINGS_URL =
  "https://api.fifa.com/api/v3/calendar/17/285023/289273/standing?language=en&count=200";

function createFifaClient(options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const now = options.now || Date.now;
  const refreshMs = Number(options.refreshMs || 60 * 60 * 1000);
  const cacheFile = options.cacheFile;
  const matchCacheDir = options.matchCacheDir;
  const requestTimeoutMs = Number(options.requestTimeoutMs || 20_000);

  if (typeof fetchImpl !== "function") throw new Error("A fetch implementation is required");
  if (!cacheFile || !matchCacheDir) throw new Error("cacheFile and matchCacheDir are required");

  async function fetchJson(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      const response = await fetchImpl(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "WorldCupOps-Arena/1.0 educational-cache-sync",
        },
      });
      if (!response.ok) throw new Error(`FIFA request failed (${response.status}) for ${url}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function refreshTournament() {
    const [calendarRaw, standingsRaw] = await Promise.all([
      fetchJson(CALENDAR_URL),
      fetchJson(STANDINGS_URL),
    ]);
    const matches = normalizeCalendar(calendarRaw);
    const groups = normalizeStandings(standingsRaw);
    const teams = uniqueTeams(matches);
    const data = {
      meta: {
        seasonId: "285023",
        competitionId: "17",
        syncedAt: new Date(now()).toISOString(),
        source: "FIFA official public JSON",
        sourceUrl: CALENDAR_URL,
        matchCount: matches.length,
        groupCount: groups.length,
        teamCount: teams.length,
        completedCount: matches.filter((match) => match.status === "completed").length,
        liveCount: matches.filter((match) => match.status === "live").length,
        scheduledCount: matches.filter((match) => match.status === "scheduled").length,
      },
      teams,
      groups,
      matches,
    };
    await writeJsonAtomic(cacheFile, data);
    return data;
  }

  async function loadTournament({ force = false } = {}) {
    const cached = await readJson(cacheFile);
    if (!force && cached && isFresh(cached.meta && cached.meta.syncedAt, refreshMs, now())) {
      return { data: cached, source: "cache", stale: false };
    }
    try {
      const data = await refreshTournament();
      return { data, source: "official", stale: false };
    } catch (error) {
      if (cached) {
        return { data: cached, source: "stale-cache", stale: true, error: error.message };
      }
      throw error;
    }
  }

  async function getMatchDetail(match, { force = false } = {}) {
    if (!match || !match.id) throw new Error("A normalized match is required");
    const cachePath = path.join(matchCacheDir, `${match.id}.json`);
    const cached = await readJson(cachePath);
    const ttl = getMatchDetailTtl(match);
    if (!force && cached && isFresh(cached.meta && cached.meta.syncedAt, ttl, now())) {
      return { data: cached.data, meta: cached.meta, source: "cache", stale: false };
    }

    try {
      const liveUrl = `https://api.fifa.com/api/v3/live/football/${match.competitionId}/${match.seasonId}/${match.stageId}/${match.id}?language=en`;
      const timelineUrl = `https://api.fifa.com/api/v3/timelines/${match.id}?language=en`;
      const [live, timeline] = await Promise.all([fetchJson(liveUrl), safeFetch(timelineUrl, {})]);
      const ifesId =
        match.ifesId || (live.Properties && live.Properties.IdIFES ? String(live.Properties.IdIFES) : null);
      const [playerStats, teamStats] = ifesId
        ? await Promise.all([
            safeFetch(`https://fdh-api.fifa.com/v1/stats/match/${ifesId}/players.json`, {}),
            safeFetch(`https://fdh-api.fifa.com/v1/stats/match/${ifesId}/teams.json`, {}),
          ])
        : [{}, {}];
      const data = normalizeMatchDetail(live, timeline, playerStats, teamStats);
      const meta = {
        matchId: String(match.id),
        ifesId,
        syncedAt: new Date(now()).toISOString(),
        source: "FIFA official public JSON",
      };
      await writeJsonAtomic(cachePath, { meta, data });
      return { data, meta, source: "official", stale: false };
    } catch (error) {
      if (cached) {
        return {
          data: cached.data,
          meta: cached.meta,
          source: "stale-cache",
          stale: true,
          error: error.message,
        };
      }
      throw error;
    }
  }

  async function safeFetch(url, fallback) {
    try {
      return await fetchJson(url);
    } catch {
      return fallback;
    }
  }

  return {
    refreshTournament,
    loadTournament,
    getMatchDetail,
    constants: { CALENDAR_URL, STANDINGS_URL, refreshMs },
  };
}

function uniqueTeams(matches) {
  const teams = new Map();
  matches.forEach((match) => {
    [match.home, match.away].forEach((team) => {
      if (team && team.id) teams.set(team.id, team);
    });
  });
  return Array.from(teams.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function isFresh(syncedAt, ttl, now) {
  const timestamp = Date.parse(syncedAt || "");
  return Number.isFinite(timestamp) && now - timestamp < ttl;
}

async function readJson(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT" || error instanceof SyntaxError) return null;
    throw error;
  }
}

async function writeJsonAtomic(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await fs.rename(tempPath, filePath);
}

module.exports = {
  createFifaClient,
  uniqueTeams,
  isFresh,
  readJson,
  writeJsonAtomic,
  CALENDAR_URL,
  STANDINGS_URL,
};
