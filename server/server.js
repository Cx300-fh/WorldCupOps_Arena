const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const { createFifaClient } = require("./fifa-client.js");

function createAppServer({ projectRoot, client, autoRefresh = true }) {
  let lastRun = null;
  let lastError = null;
  let timer = null;

  async function runRefresh(force = false) {
    try {
      const result = await client.loadTournament({ force });
      lastRun = new Date().toISOString();
      lastError = result.error || null;
      return result;
    } catch (error) {
      lastRun = new Date().toISOString();
      lastError = error.message;
      throw error;
    }
  }

  if (autoRefresh) {
    runRefresh(false).catch(() => {});
    timer = setInterval(() => runRefresh(true).catch(() => {}), client.constants.refreshMs);
    timer.unref();
  }

  async function readTournamentWithoutBlocking() {
    const cached = await client.peekTournament();
    if (!cached) return runRefresh(false);
    if (cached.stale) runRefresh(false).catch(() => {});
    return cached.stale && lastError ? { ...cached, error: lastError } : cached;
  }

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost");
      if (url.pathname === "/api/status" && request.method === "GET") {
        return json(response, 200, {
          refreshMs: client.constants.refreshMs,
          lastRun,
          lastError,
        });
      }

      if (url.pathname === "/api/tournament" && request.method === "GET") {
        const result = await readTournamentWithoutBlocking();
        return json(response, 200, result);
      }

      if (url.pathname === "/api/refresh" && request.method === "POST") {
        const result = await runRefresh(true);
        return json(response, 200, result);
      }

      const matchRoute = url.pathname.match(/^\/api\/match\/([^/]+)$/);
      if (matchRoute && request.method === "GET") {
        const tournament = await readTournamentWithoutBlocking();
        const match = tournament.data.matches.find((item) => item.id === decodeURIComponent(matchRoute[1]));
        if (!match) return json(response, 404, { error: "Match not found" });
        const result = await client.getMatchDetail(match, { force: url.searchParams.get("refresh") === "1" });
        return json(response, 200, result);
      }

      if (url.pathname.startsWith("/api/")) return json(response, 404, { error: "API route not found" });
      return serveStatic(projectRoot, url.pathname, response);
    } catch (error) {
      return json(response, 500, { error: error.message });
    }
  });

  server.on("close", () => {
    if (timer) clearInterval(timer);
  });
  return server;
}

async function serveStatic(projectRoot, pathname, response) {
  const requested = pathname === "/" || pathname.endsWith("/") ? `${pathname}index.html` : pathname;
  const decoded = decodeURIComponent(requested);
  const candidate = path.resolve(projectRoot, `.${decoded}`);
  const root = path.resolve(projectRoot);
  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) {
    return json(response, 403, { error: "Forbidden" });
  }
  try {
    const data = await fs.readFile(candidate);
    response.writeHead(200, {
      "Content-Type": contentType(candidate),
      "Cache-Control": candidate.endsWith(".json") ? "no-cache" : "public, max-age=60",
    });
    response.end(data);
  } catch (error) {
    if (error.code === "ENOENT") return json(response, 404, { error: "File not found" });
    throw error;
  }
}

function json(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

function contentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return (
    {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
    }[extension] || "application/octet-stream"
  );
}

if (require.main === module) {
  const projectRoot = path.resolve(__dirname, "..");
  const refreshMs = Number(process.env.FIFA_REFRESH_MS || 60 * 60 * 1000);
  const port = Number(process.env.PORT || 5175);
  const client = createFifaClient({
    refreshMs,
    cacheFile: path.join(projectRoot, "data", "fifa-2026.json"),
    matchCacheDir: path.join(projectRoot, "data", "matches"),
  });
  const server = createAppServer({ projectRoot, client, autoRefresh: true });
  server.listen(port, "127.0.0.1", () => {
    console.log(`WorldCupOps Arena: http://127.0.0.1:${port}`);
    console.log(`FIFA refresh interval: ${Math.round(refreshMs / 60000)} minutes`);
  });
}

module.exports = { createAppServer, serveStatic, contentType };
