const assert = require("assert");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");

const { loadWithCache } = require("../workspace/cache-policy.js");

async function makeCache(data) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "worldcup-cache-lab-"));
  const cacheFile = path.join(root, "tournament.json");
  if (data) await fs.writeFile(cacheFile, JSON.stringify(data));
  return cacheFile;
}

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

const fresh = {
  meta: { syncedAt: "2026-07-03T08:30:00.000Z" },
  matches: [{ id: "cached-match" }],
};

const official = {
  meta: { syncedAt: "2026-07-03T10:00:00.000Z" },
  matches: [{ id: "official-match" }],
};

test("fresh cache avoids an unnecessary official request", async () => {
  const cacheFile = await makeCache(fresh);
  let calls = 0;
  const result = await loadWithCache({
    cacheFile,
    ttlMs: 60 * 60 * 1000,
    now: () => Date.parse("2026-07-03T09:00:00.000Z"),
    fetchOfficial: async () => {
      calls += 1;
      return official;
    },
  });

  assert.equal(result.source, "cache");
  assert.equal(result.stale, false);
  assert.equal(result.data.matches[0].id, "cached-match");
  assert.equal(calls, 0);
});

test("stale cache is replaced after a successful official request", async () => {
  const cacheFile = await makeCache(fresh);
  const result = await loadWithCache({
    cacheFile,
    ttlMs: 60 * 60 * 1000,
    now: () => Date.parse("2026-07-03T12:00:00.000Z"),
    fetchOfficial: async () => official,
  });
  const saved = JSON.parse(await fs.readFile(cacheFile, "utf8"));

  assert.equal(result.source, "official");
  assert.equal(result.stale, false);
  assert.equal(saved.matches[0].id, "official-match");
});

test("failed official request returns stale cache without overwriting it", async () => {
  const cacheFile = await makeCache(fresh);
  const before = await fs.readFile(cacheFile, "utf8");
  const result = await loadWithCache({
    cacheFile,
    ttlMs: 60 * 60 * 1000,
    now: () => Date.parse("2026-07-03T12:00:00.000Z"),
    fetchOfficial: async () => {
      throw new Error("simulated FIFA timeout");
    },
  });
  const after = await fs.readFile(cacheFile, "utf8");

  assert.equal(result.source, "stale-cache");
  assert.equal(result.stale, true);
  assert.match(result.error, /simulated FIFA timeout/);
  assert.equal(result.data.matches[0].id, "cached-match");
  assert.equal(after, before);
});
