const fs = require("fs/promises");
const path = require("path");

async function loadWithCache({ cacheFile, ttlMs, now = Date.now, fetchOfficial }) {
  const cached = await readJson(cacheFile);
  if (cached && isFresh(cached.meta && cached.meta.syncedAt, ttlMs, now())) {
    return { data: cached, source: "cache", stale: false };
  }

  try {
    const data = await fetchOfficial();
    await writeJsonAtomic(cacheFile, data);
    return { data, source: "official", stale: false };
  } catch (error) {
    if (!cached) throw error;
    return {
      data: cached,
      source: "stale-cache",
      stale: true,
      error: error.message,
    };
  }
}

function isFresh(syncedAt, ttlMs, now) {
  const timestamp = Date.parse(syncedAt || "");
  return Number.isFinite(timestamp) && now - timestamp < ttlMs;
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

module.exports = { loadWithCache, isFresh, readJson, writeJsonAtomic };
