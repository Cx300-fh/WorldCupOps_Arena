const assert = require("assert");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");

const { createAppServer } = require("../server/server.js");

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "worldcup-server-test-"));
  await fs.writeFile(path.join(root, "index.html"), "<h1>test</h1>");
  const tournament = {
    meta: { syncedAt: "2026-06-28T00:00:00.000Z", matchCount: 104 },
    matches: [{ id: "m1" }],
    groups: [],
  };
  const client = {
    constants: { refreshMs: 60 * 60 * 1000 },
    async loadTournament({ force = false } = {}) {
      return { data: tournament, source: force ? "official" : "cache", stale: false };
    },
    async getMatchDetail(match) {
      return { data: { id: match.id, home: { players: [] }, away: { players: [] } }, source: "cache" };
    },
  };
  const server = createAppServer({ projectRoot: root, client, autoRefresh: false });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  try {
    const status = await fetch(`${base}/api/status`).then((response) => response.json());
    assert.equal(status.refreshMs, 60 * 60 * 1000);

    const result = await fetch(`${base}/api/tournament`).then((response) => response.json());
    assert.equal(result.data.meta.matchCount, 104);
    assert.equal(result.source, "cache");

    const refreshed = await fetch(`${base}/api/refresh`, { method: "POST" }).then((response) => response.json());
    assert.equal(refreshed.source, "official");

    const detail = await fetch(`${base}/api/match/m1`).then((response) => response.json());
    assert.equal(detail.data.id, "m1");

    const page = await fetch(`${base}/`).then((response) => response.text());
    assert.ok(page.includes("test"));

    console.log("PASS local server API and static routes");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error("FAIL local server API and static routes");
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
