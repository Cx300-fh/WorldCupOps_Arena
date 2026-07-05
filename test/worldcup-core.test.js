const assert = require("assert");

const {
  calculateStandings,
  rankThirdPlaceTeams,
  updateFixturePrediction,
  estimateQualificationChances,
  buildVibeTaskPack,
  createInitialFixtures,
  filterMatches,
  rankOfficialThirdPlaceTeams,
  groupMatchesByDate,
  groupMatchesByStage,
  selectOverviewMatches,
  splitPossessionControl,
  formatHttpError,
  moveSpotlight,
  selectSpotlightWindow,
  latestCompletedMatch,
} = require("../src/worldcup-core.js");

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

test("calculateStandings awards points and goal difference from predictions", () => {
  const fixtures = [
    { home: "Canada", away: "Mexico", homeGoals: 2, awayGoals: 1 },
    { home: "USA", away: "Japan", homeGoals: 0, awayGoals: 0 },
    { home: "Canada", away: "USA", homeGoals: 1, awayGoals: 3 },
  ];
  const standings = calculateStandings(["Canada", "Mexico", "USA", "Japan"], fixtures);

  assert.equal(standings[0].team, "USA");
  assert.equal(standings[0].points, 4);
  assert.equal(standings[0].goalDifference, 2);
  assert.equal(standings[1].team, "Canada");
  assert.equal(standings[1].points, 3);
  assert.equal(standings[2].team, "Japan");
  assert.equal(standings[2].points, 1);
  assert.equal(standings[3].team, "Mexico");
});

test("calculateStandings ranks tied teams by goal difference then goals for", () => {
  const fixtures = [
    { home: "A", away: "B", homeGoals: 2, awayGoals: 0 },
    { home: "C", away: "D", homeGoals: 3, awayGoals: 1 },
    { home: "A", away: "C", homeGoals: 1, awayGoals: 3 },
    { home: "B", away: "D", homeGoals: 4, awayGoals: 0 },
  ];
  const standings = calculateStandings(["A", "B", "C", "D"], fixtures);

  assert.deepEqual(
    standings.map((row) => row.team),
    ["C", "B", "A", "D"],
  );
  assert.equal(standings[0].points, 6);
  assert.equal(standings[1].points, 3);
  assert.equal(standings[1].goalsFor, 4);
});

test("rankThirdPlaceTeams sorts third-place rows across groups", () => {
  const groups = [
    [
      { team: "A1", points: 7, goalDifference: 4, goalsFor: 6, rank: 1 },
      { team: "A2", points: 5, goalDifference: 2, goalsFor: 4, rank: 2 },
      { team: "A3", points: 4, goalDifference: 1, goalsFor: 5, rank: 3 },
    ],
    [
      { team: "B1", points: 6, goalDifference: 1, goalsFor: 5, rank: 1 },
      { team: "B2", points: 4, goalDifference: 0, goalsFor: 4, rank: 2 },
      { team: "B3", points: 4, goalDifference: 2, goalsFor: 3, rank: 3 },
    ],
  ];
  const thirds = rankThirdPlaceTeams(groups);

  assert.deepEqual(
    thirds.map((row) => row.team),
    ["B3", "A3"],
  );
});

test("updateFixturePrediction returns a new fixture list with edited goals", () => {
  const fixtures = createInitialFixtures();
  const updated = updateFixturePrediction(fixtures, "M1", 4, 2);

  assert.notEqual(updated, fixtures);
  assert.equal(updated.find((match) => match.id === "M1").homeGoals, 4);
  assert.equal(updated.find((match) => match.id === "M1").awayGoals, 2);
  assert.equal(fixtures.find((match) => match.id === "M1").homeGoals, 1);
});

test("estimateQualificationChances returns bounded teaching probabilities", () => {
  const standings = calculateStandings(["Canada", "Mexico", "USA", "Japan"], createInitialFixtures());
  const chances = estimateQualificationChances(standings, { hostMomentum: 8, upsetIndex: 4 });

  assert.equal(chances.length, 4);
  chances.forEach((row) => {
    assert.ok(row.chance >= 5);
    assert.ok(row.chance <= 95);
  });
});

test("buildVibeTaskPack creates task card, prompts, checks, and debug script", () => {
  const pack = buildVibeTaskPack("tie-breaker-bug");

  assert.ok(pack.taskCard.goal.includes("排名"));
  assert.ok(pack.planPrompt.includes("先不要写代码"));
  assert.ok(pack.executePrompt.includes("最小改动"));
  assert.ok(pack.verificationChecklist.some((item) => item.includes("净胜球")));
  assert.ok(pack.debugPrompt.includes("完整报错"));
  assert.equal(pack.taskPath.steps.length, 5);
  assert.ok(pack.taskPath.difficulty);
  assert.ok(pack.taskPath.duration);
  assert.ok(pack.taskPath.startFiles.length > 0);
  assert.ok(pack.taskPath.hint);
  assert.ok(pack.taskPath.nextChallenge);
});

test("cache fallback prompts target the isolated lab and its verification command", () => {
  const pack = buildVibeTaskPack("cache-fallback");

  assert.match(pack.planPrompt, /labs\/cache-fallback\/workspace\/cache-policy\.js/);
  assert.match(pack.planPrompt, /npm run lab:test/);
  assert.match(pack.executePrompt, /只修改 labs\/cache-fallback\/workspace\/cache-policy\.js/);
  assert.match(pack.executePrompt, /npm run lab:test/);
});

test("development labs expose isolated workspaces, test commands, and previews", () => {
  const expected = {
    "player-duel": ["labs/player-duel/workspace/core.js", "npm run lab:duel:test"],
    "match-poster": ["labs/match-poster/workspace/core.js", "npm run lab:poster:test"],
    "knockout-path": ["labs/knockout-path/workspace/core.js", "npm run lab:bracket:test"],
  };
  Object.entries(expected).forEach(([id, [file, command]]) => {
    const pack = buildVibeTaskPack(id);
    assert.match(pack.planPrompt, new RegExp(file.replaceAll("/", "\\/")));
    assert.ok(pack.executePrompt.includes(command));
    assert.match(pack.taskPath.previewPath, /^\/labs\//);
  });
});

test("filterMatches combines group, team, stage, and status filters", () => {
  const matches = [
    { id: "1", group: "Group A", stage: "First Stage", status: "completed", home: { id: "MEX" }, away: { id: "RSA" } },
    { id: "2", group: "Group B", stage: "First Stage", status: "scheduled", home: { id: "CAN" }, away: { id: "SUI" } },
  ];
  const result = filterMatches(matches, { group: "Group B", teamId: "CAN", stage: "First Stage", status: "scheduled" });
  assert.deepEqual(result.map((match) => match.id), ["2"]);
});

test("rankOfficialThirdPlaceTeams selects and ranks the third row from every group", () => {
  const groups = [
    { name: "Group A", rows: [{ position: 1 }, { position: 2 }, { position: 3, team: { name: "A3" }, points: 4, goalDifference: 1, goalsFor: 5, fairPlayCoefficient: -2 }] },
    { name: "Group B", rows: [{ position: 1 }, { position: 2 }, { position: 3, team: { name: "B3" }, points: 4, goalDifference: 2, goalsFor: 3, fairPlayCoefficient: -1 }] },
  ];
  const result = rankOfficialThirdPlaceTeams(groups, 1);
  assert.deepEqual(result.map((row) => row.team.name), ["B3", "A3"]);
  assert.equal(result[0].status, "Advance");
  assert.equal(result[1].status, "Out");
});

test("groupMatchesByDate creates chronological match-day sections", () => {
  const matches = [
    { id: "3", date: "2026-06-13T01:00:00Z" },
    { id: "1", date: "2026-06-11T12:00:00Z" },
    { id: "2", date: "2026-06-11T18:00:00Z" },
  ];

  const sections = groupMatchesByDate(matches, "UTC");

  assert.deepEqual(sections.map((section) => section.key), ["2026-06-11", "2026-06-13"]);
  assert.deepEqual(sections[0].matches.map((match) => match.id), ["1", "2"]);
});

test("groupMatchesByStage follows the official knockout round order", () => {
  const matches = [
    { id: "final", stage: "Final", date: "2026-07-19T19:00:00Z" },
    { id: "r32", stage: "Round of 32", date: "2026-06-28T19:00:00Z" },
    { id: "semi", stage: "Semi-final", date: "2026-07-14T19:00:00Z" },
  ];

  const sections = groupMatchesByStage(matches);

  assert.deepEqual(sections.map((section) => section.stage), ["Round of 32", "Semi-final", "Final"]);
});

test("selectOverviewMatches prioritizes live and upcoming fixtures", () => {
  const matches = [
    { id: "old", status: "completed", date: "2026-06-10T12:00:00Z" },
    { id: "later", status: "scheduled", date: "2026-06-13T12:00:00Z" },
    { id: "live", status: "live", date: "2026-06-12T12:00:00Z" },
    { id: "next", status: "scheduled", date: "2026-06-12T18:00:00Z" },
  ];

  const selected = selectOverviewMatches(matches, 3, new Date("2026-06-12T13:00:00Z"));

  assert.deepEqual(selected.map((match) => match.id), ["live", "next", "later"]);
});

test("rankOfficialThirdPlaceTeams can return only the qualification zone", () => {
  const groups = Array.from({ length: 12 }, (_, index) => ({
    name: `Group ${String.fromCharCode(65 + index)}`,
    rows: [{ position: 3, team: { name: `Team ${index}` }, points: 12 - index, goalDifference: index, goalsFor: index }],
  }));

  const result = rankOfficialThirdPlaceTeams(groups, 8, true);

  assert.equal(result.length, 8);
  assert.ok(result.every((row) => row.status === "Advance"));
});

test("splitPossessionControl preserves FIFA's in-contest state", () => {
  assert.deepEqual(splitPossessionControl(0.56, 0.36), { home: 56, contest: 8, away: 36 });
});

test("splitPossessionControl rounds three states to exactly 100", () => {
  const result = splitPossessionControl(0.5709360242, 0.3609120846);
  assert.equal(result.home + result.contest + result.away, 100);
  assert.deepEqual(result, { home: 57, contest: 7, away: 36 });
});

test("splitPossessionControl reports missing possession", () => {
  assert.equal(splitPossessionControl(0, 0), null);
});

test("formatHttpError hides HTML error pages behind a start instruction", () => {
  assert.equal(
    formatHttpError(404, "text/html; charset=utf-8", "<!doctype html><h1>Error response</h1>"),
    "本地数据服务未启动，请运行 npm start",
  );
});

test("formatHttpError keeps JSON failures concise", () => {
  assert.equal(formatHttpError(502, "application/json", '{"error":"upstream timeout"}'), "请求失败（502）：upstream timeout");
});

test("moveSpotlight cycles through every match with wraparound", () => {
  const matches = [{ id: "m1" }, { id: "m2" }, { id: "m3" }];
  assert.equal(moveSpotlight(matches, "m2", 1).id, "m3");
  assert.equal(moveSpotlight(matches, "m3", 1).id, "m1");
  assert.equal(moveSpotlight(matches, "m1", -1).id, "m3");
});

test("selectSpotlightWindow keeps the schedule edges in chronological order", () => {
  const matches = Array.from({ length: 7 }, (_, index) => ({ id: `m${index + 1}` }));
  assert.deepEqual(selectSpotlightWindow(matches, "m1", 5).map((match) => match.id), ["m1", "m2", "m3", "m4", "m5"]);
  assert.deepEqual(selectSpotlightWindow(matches, "m4", 5).map((match) => match.id), ["m2", "m3", "m4", "m5", "m6"]);
  assert.deepEqual(selectSpotlightWindow(matches, "m7", 5).map((match) => match.id), ["m3", "m4", "m5", "m6", "m7"]);
});

test("latestCompletedMatch selects the most recently finished fixture", () => {
  const matches = [
    { id: "first", status: "completed", date: "2026-06-12T00:00:00Z" },
    { id: "latest", status: "completed", date: "2026-07-04T23:00:00Z" },
    { id: "future", status: "scheduled", date: "2026-07-19T00:00:00Z" },
  ];
  assert.equal(latestCompletedMatch(matches).id, "latest");
});
