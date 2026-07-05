const assert = require("assert");
const { buildPosterModel, teamColor } = require("../workspace/core.js");
const tournament = require("../../../data/fifa-2026.json");

const match = {
  id: "m1",
  date: "2026-07-19T19:00:00Z",
  venue: "New York New Jersey Stadium",
  home: { name: "Argentina", code: "ARG" },
  away: { name: "France", code: "FRA" },
  score: { home: 2, away: 1 },
};

const pre = buildPosterModel(match, "pre");
assert.equal(pre.centerText, "KICKOFF");
assert.match(pre.detailText, /New York/);

const post = buildPosterModel(match, "post");
assert.equal(post.centerText, "2 : 1");
assert.equal(post.modeLabel, "FULL TIME");
assert.match(teamColor("Argentina"), /^#[0-9a-f]{6}$/i);
assert.equal(teamColor("Argentina"), teamColor("Argentina"));
assert.throws(() => buildPosterModel(null, "pre"), /match is required/i);
assert.equal(tournament.matches.length, 104);
assert.ok(tournament.matches.some((item) => item.stage === "Round of 32"));

console.log("PASS match poster view model and deterministic colors");
