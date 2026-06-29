const path = require("path");

const { createFifaClient } = require("./fifa-client.js");

async function main() {
  const projectRoot = path.resolve(__dirname, "..");
  const client = createFifaClient({
    cacheFile: path.join(projectRoot, "data", "fifa-2026.json"),
    matchCacheDir: path.join(projectRoot, "data", "matches"),
    refreshMs: Number(process.env.FIFA_REFRESH_MS || 60 * 60 * 1000),
  });
  const data = await client.refreshTournament();
  console.log(JSON.stringify(data.meta, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
