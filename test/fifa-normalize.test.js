const assert = require("assert");

const {
  normalizeCalendar,
  normalizeStandings,
  normalizeMatchDetail,
  getMatchDetailTtl,
} = require("../server/fifa-normalize.js");

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

const calendarFixture = {
  Results: [
    {
      IdCompetition: "17",
      IdSeason: "285023",
      IdStage: "289273",
      IdGroup: "289275",
      IdMatch: "400021443",
      Date: "2026-06-11T19:00:00Z",
      MatchStatus: 0,
      ResultType: 1,
      MatchNumber: 1,
      StageName: [{ Locale: "en-GB", Description: "First Stage" }],
      GroupName: [{ Locale: "en-GB", Description: "Group A" }],
      Home: {
        IdTeam: "43911",
        TeamName: [{ Locale: "en-GB", Description: "Mexico" }],
        Abbreviation: "MEX",
        IdCountry: "MEX",
      },
      Away: {
        IdTeam: "43883",
        TeamName: [{ Locale: "en-GB", Description: "South Africa" }],
        Abbreviation: "RSA",
        IdCountry: "RSA",
      },
      HomeTeamScore: 2,
      AwayTeamScore: 0,
      Stadium: {
        Name: [{ Locale: "en-GB", Description: "Mexico City Stadium" }],
        CityName: [{ Locale: "en-GB", Description: "Mexico City" }],
      },
      Attendance: "80824",
      Properties: { IdIFES: "151600" },
    },
  ],
};

const standingsFixture = {
  Results: [
    {
      IdGroup: "289275",
      GroupName: [{ Locale: "en-GB", Description: "Group A" }],
      Position: 1,
      Played: 3,
      Won: 2,
      Drawn: 1,
      Lost: 0,
      For: 6,
      Against: 2,
      Points: 7,
      Team: {
        IdTeam: "43911",
        TeamName: [{ Locale: "en-GB", Description: "Mexico" }],
        Abbreviation: "MEX",
        IdCountry: "MEX",
      },
    },
  ],
};

const liveFixture = {
  IdCompetition: "17",
  IdSeason: "285023",
  IdStage: "289273",
  IdMatch: "400021443",
  MatchStatus: 0,
  ResultType: 1,
  Date: "2026-06-11T19:00:00Z",
  HomeTeam: {
    IdTeam: "43911",
    Score: 2,
    TeamName: [{ Locale: "en-GB", Description: "Mexico" }],
    Players: [
      {
        IdPlayer: "485070",
        IdTeam: "43911",
        ShirtNumber: 1,
        Status: 1,
        Captain: false,
        PlayerName: [{ Locale: "en-GB", Description: "Raul RANGEL" }],
        Position: 0,
      },
    ],
  },
  AwayTeam: {
    IdTeam: "43883",
    Score: 0,
    TeamName: [{ Locale: "en-GB", Description: "South Africa" }],
    Players: [],
  },
  Properties: { IdIFES: "151600" },
};

const playerStatsFixture = {
  485070: [
    ["Goals", 0, true],
    ["Passes", 33, true],
    ["PassesCompleted", 29, true],
    ["TimePlayed", 101.004, true],
    ["TopSpeed", 23.157, true],
    ["TotalDistance", 5476.38, true],
    ["XG", 0, true],
  ],
};

test("normalizeCalendar maps official matches to stable local fields", () => {
  const result = normalizeCalendar(calendarFixture);
  assert.equal(result.length, 1);
  assert.deepEqual(result[0], {
    id: "400021443",
    competitionId: "17",
    seasonId: "285023",
    stageId: "289273",
    groupId: "289275",
    stage: "First Stage",
    group: "Group A",
    date: "2026-06-11T19:00:00Z",
    status: "completed",
    matchNumber: 1,
    home: { id: "43911", name: "Mexico", code: "MEX", country: "MEX" },
    away: { id: "43883", name: "South Africa", code: "RSA", country: "RSA" },
    score: { home: 2, away: 0, homePenalties: null, awayPenalties: null },
    stadium: "Mexico City Stadium",
    city: "Mexico City",
    attendance: 80824,
    ifesId: "151600",
  });
});

test("normalizeStandings groups official rows by group name", () => {
  const groups = normalizeStandings(standingsFixture);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].name, "Group A");
  assert.equal(groups[0].rows[0].team.name, "Mexico");
  assert.equal(groups[0].rows[0].goalDifference, 4);
});

test("normalizeMatchDetail joins player names with FDH statistics", () => {
  const detail = normalizeMatchDetail(liveFixture, { Event: [] }, playerStatsFixture, {});
  assert.equal(detail.home.players.length, 1);
  assert.equal(detail.home.players[0].name, "Raul RANGEL");
  assert.equal(detail.home.players[0].stats.passes, 33);
  assert.equal(detail.home.players[0].stats.passesCompleted, 29);
  assert.equal(detail.home.players[0].stats.totalDistanceKm, 5.48);
  assert.equal(detail.home.players[0].stats.topSpeed, 23.16);
});

test("getMatchDetailTtl refreshes live matches faster than completed matches", () => {
  assert.equal(getMatchDetailTtl({ status: "live" }), 5 * 60 * 1000);
  assert.equal(getMatchDetailTtl({ status: "scheduled" }), 60 * 60 * 1000);
  assert.equal(getMatchDetailTtl({ status: "completed" }), 24 * 60 * 60 * 1000);
});
