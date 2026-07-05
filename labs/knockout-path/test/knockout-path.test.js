const assert = require("assert");
const { createBracket, selectWinner, champion } = require("../workspace/core.js");
const officialRound32 = require("../fixtures/teams.json");

const teams = Array.from({ length: 32 }, (_, index) => ({ id: `t${index + 1}`, name: `Team ${index + 1}` }));
let bracket = createBracket(teams);
assert.deepEqual(bracket.rounds.map((round) => round.matches.length), [16, 8, 4, 2, 1]);

bracket = selectWinner(bracket, 0, 0, "t1");
assert.equal(bracket.rounds[0].matches[0].winnerId, "t1");
assert.equal(bracket.rounds[1].matches[0].teams[0].id, "t1");

bracket = selectWinner(bracket, 0, 1, "t3");
bracket = selectWinner(bracket, 1, 0, "t1");
assert.equal(bracket.rounds[2].matches[0].teams[0].id, "t1");

bracket = selectWinner(bracket, 0, 0, "t2");
assert.equal(bracket.rounds[1].matches[0].teams[0].id, "t2");
assert.equal(bracket.rounds[1].matches[0].winnerId, null);
assert.equal(bracket.rounds[2].matches[0].teams[0], null);
assert.equal(champion(bracket), null);
assert.throws(() => selectWinner(bracket, 0, 0, "t9"), /not in match/i);
assert.equal(officialRound32.length, 32);
assert.ok(officialRound32.every((team) => team.country && team.code));

console.log("PASS knockout propagation and downstream invalidation");
