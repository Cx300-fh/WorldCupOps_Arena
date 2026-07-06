const assert = require("assert");
const { comparePlayers, normalizeMetric } = require("../workspace/core.js");
const officialPlayers = require("../fixtures/players.json");

const alex = { id: "p1", name: "Alex", stats: { goals: 3, assists: 1, passes: 120, distance: 22.4, speed: 31.2, xg: 2.7 } };
const bruno = { id: "p2", name: "Bruno", stats: { goals: 1, assists: 2, passes: null, distance: 19.2, speed: 33.1, xg: 1.4 } };

assert.equal(normalizeMetric(15, 10), 100);
assert.equal(normalizeMetric(-2, 10), 0);
assert.equal(normalizeMetric(null, 10), 0);

const comparison = comparePlayers(alex, bruno);
assert.equal(comparison.left.name, "Alex");
assert.equal(comparison.metrics.length, 6);
assert.equal(comparison.metrics.find((metric) => metric.key === "goals").leader, "left");
assert.equal(comparison.metrics.find((metric) => metric.key === "assists").leader, "right");
assert.equal(comparison.metrics.find((metric) => metric.key === "passes").rightValue, 0);
assert.ok(comparison.metrics.every((metric) => metric.leftScore >= 0 && metric.leftScore <= 100));
assert.throws(() => comparePlayers(alex, alex), /different players/i);
assert.ok(officialPlayers.length >= 20);
assert.ok(officialPlayers.every((player) => player.picture.endsWith(".png") && player.number != null));

console.log("PASS player duel comparison and normalization");
