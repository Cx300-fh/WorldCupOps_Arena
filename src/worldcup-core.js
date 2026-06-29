(function initWorldCupOps(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.WorldCupOps = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function worldCupOpsFactory() {
  const DEMO_TEAMS = [
    { name: "Canada", country: "Host", color: "#d62828", city: "Toronto / Vancouver" },
    { name: "Mexico", country: "Host", color: "#0f8b45", city: "Mexico City / Guadalajara / Monterrey" },
    { name: "USA", country: "Host", color: "#1d4ed8", city: "New York-New Jersey / Los Angeles / Dallas" },
    { name: "Japan", country: "Guest", color: "#7c3aed", city: "Teaching demo opponent" },
  ];

  const HOST_CITIES = [
    { city: "Toronto", country: "Canada" },
    { city: "Vancouver", country: "Canada" },
    { city: "Guadalajara", country: "Mexico" },
    { city: "Mexico City", country: "Mexico" },
    { city: "Monterrey", country: "Mexico" },
    { city: "Atlanta", country: "USA" },
    { city: "Boston", country: "USA" },
    { city: "Dallas", country: "USA" },
    { city: "Houston", country: "USA" },
    { city: "Kansas City", country: "USA" },
    { city: "Los Angeles", country: "USA" },
    { city: "Miami", country: "USA" },
    { city: "New York-New Jersey", country: "USA" },
    { city: "Philadelphia", country: "USA" },
    { city: "San Francisco Bay Area", country: "USA" },
    { city: "Seattle", country: "USA" },
  ];

  const STAGE_ORDER = [
    "First Stage",
    "Round of 32",
    "Round of 16",
    "Quarter-final",
    "Semi-final",
    "Play-off for third place",
    "Final",
  ];

  const TASKS = {
    "tie-breaker-bug": {
      title: "修复小组排名 Tie-breaker",
      goal: "修复积分榜排名逻辑，使同分球队按净胜球、进球数、队名稳定排序。",
      inputs: "6 场小组赛预测比分。",
      outputs: "排序正确的小组积分榜、晋级标签和验证记录。",
      constraints: "只修改排名与积分计算相关函数，保持页面结构不变。",
      acceptance: [
        "胜场得 3 分，平局得 1 分，负场得 0 分。",
        "同分先比较净胜球，净胜球高者排名靠前。",
        "净胜球相同再比较进球数，进球数高者排名靠前。",
        "测试中给出的同分样例排序稳定。",
      ],
      seedBug: "当前版本可能只按积分排序，忽略净胜球和进球数。",
    },
    "chart-sync-bug": {
      title: "修复预测后图表同步",
      goal: "修改比分预测后，积分榜、晋级概率条和混乱指数同时刷新。",
      inputs: "用户编辑后的单场比分。",
      outputs: "同步更新的表格、图表和分数面板。",
      constraints: "只调整状态更新和渲染入口，不重写计算函数。",
      acceptance: [
        "任意一场比分变化后，积分榜立即变化。",
        "积分柱状图与积分榜分值一致。",
        "晋级概率条与最新积分榜一致。",
      ],
      seedBug: "表格刷新了，但图表仍显示旧数据。",
    },
    "prediction-validator": {
      title: "增加竞猜输入校验",
      goal: "为比分输入增加校验，禁止负数、小数和过大比分进入模拟器。",
      inputs: "用户输入的主队进球和客队进球。",
      outputs: "合法比分、错误提示和不变的旧预测。",
      constraints: "校验逻辑放在输入处理层，核心计算函数只接收合法整数。",
      acceptance: [
        "负数输入被拒绝。",
        "小数输入被拒绝。",
        "超过 20 的比分被拒绝。",
        "非法输入不改变当前积分榜。",
      ],
      seedBug: "输入 -1 或 2.5 时仍会更新积分榜。",
    },
    "official-data-sync": {
      title: "接入 FIFA 官方 104 场赛程",
      goal: "把 FIFA 官方 calendar 与 standings 响应标准化为稳定的本地赛事模型。",
      inputs: "FIFA calendar 和 standings JSON。",
      outputs: "104 场比赛、48 支球队、12 个小组和同步元数据。",
      constraints: "官方字段只能在服务端适配；前端只读取本地标准化结构。",
      acceptance: [
        "同步结果包含 104 场比赛。",
        "积分榜包含 12 个小组和 48 支球队。",
        "刷新失败时不覆盖最后一次成功缓存。",
        "页面显示数据来源和最后同步时间。",
      ],
      seedBug: "前端直接依赖 FIFA 原始字段，接口字段变化后整个页面无法渲染。",
    },
    "cache-fallback": {
      title: "实现 1 小时缓存降级",
      goal: "实现自动刷新、手动刷新、原子写缓存和失败回退。",
      inputs: "官方请求结果、缓存文件时间、刷新间隔。",
      outputs: "live、cache、stale-cache 三种可观察状态。",
      constraints: "失败请求不得删除或覆盖有效缓存。",
      acceptance: [
        "缓存未超过 1 小时时不重复请求。",
        "手动刷新可以跳过 TTL。",
        "官网不可用时继续返回旧缓存。",
        "页面明确标注当前数据状态。",
      ],
      seedBug: "官方接口超时后服务返回 500，课堂页面完全不可用。",
    },
    "player-stat-join": {
      title: "关联阵容与球员统计",
      goal: "用 IdPlayer 将 live 阵容与 FDH 球员统计关联。",
      inputs: "单场 live JSON、timeline、players.json 和 teams.json。",
      outputs: "球员姓名、号码、首发、分钟、进球、传球、距离、速度和 xG。",
      constraints: "球员统计缺失时仍要展示阵容；字段缺失使用明确空值。",
      acceptance: [
        "主客队阵容能按 IdPlayer 关联统计。",
        "统计接口失败时阵容仍可用。",
        "距离转换为公里并控制小数位。",
        "未开赛场次显示统计尚不可用。",
      ],
      seedBug: "代码用球员姓名关联数据，重名或大小写变化导致统计错配。",
    },
  };

  const TASK_GUIDES = {
    "tie-breaker-bug": {
      difficulty: "入门",
      duration: "20 分钟",
      startFiles: ["src/worldcup-core.js", "test/worldcup-core.test.js"],
      observe: "运行同分样例，记录积分相同球队当前的错误顺序。",
      hint: "把排序条件拆成积分、净胜球、进球数和稳定兜底四层，每层只在上一层相等时执行。",
      nextChallenge: "加入公平竞赛积分，并为完全相同的数据设计可复现的抽签策略。",
    },
    "chart-sync-bug": {
      difficulty: "入门",
      duration: "25 分钟",
      startFiles: ["src/app.js", "src/worldcup-core.js"],
      observe: "修改一场预测比分，对比表格和图表是否读取了同一份最新状态。",
      hint: "先找出唯一状态源，再让表格、图表和概率条从同一个渲染入口更新。",
      nextChallenge: "加入撤销与重做，并验证连续修改三场比赛后状态仍一致。",
    },
    "prediction-validator": {
      difficulty: "入门",
      duration: "20 分钟",
      startFiles: ["src/app.js", "test/worldcup-core.test.js"],
      observe: "依次输入负数、小数、空值和 21，记录哪些值进入了当前预测。",
      hint: "先判断是否为整数，再判断上下界；校验失败时不要覆盖上一份合法状态。",
      nextChallenge: "增加键盘提交和输入级错误提示，同时保持移动端布局稳定。",
    },
    "official-data-sync": {
      difficulty: "进阶",
      duration: "40 分钟",
      startFiles: ["server/fifa-client.js", "server/fifa-normalize.js", "test/fifa-normalize.test.js"],
      observe: "保存一份官方响应，列出前端真正需要的字段和可能缺失的字段。",
      hint: "把官方字段转换集中在服务端标准化层，前端只依赖稳定的 match、team 和 group 结构。",
      nextChallenge: "为上游新增或缺失字段加入契约快照，并输出一次兼容性报告。",
    },
    "cache-fallback": {
      difficulty: "进阶",
      duration: "30 分钟",
      startFiles: ["server/fifa-client.js", "server/server.js", "test/fifa-client.test.js"],
      observe: "分别记录缓存命中、强制刷新和官网超时三种情况下的 source 与 stale 状态。",
      hint: "成功响应写入临时文件后再原子替换；失败路径只能读取旧缓存，不能覆盖它。",
      nextChallenge: "加入指数退避和最近一次失败原因，让连续故障也保持可观察。",
    },
    "player-stat-join": {
      difficulty: "挑战",
      duration: "45 分钟",
      startFiles: ["server/fifa-normalize.js", "server/fifa-client.js", "test/fifa-normalize.test.js"],
      observe: "选取一个重名或姓名格式不同的球员，比较姓名关联与 IdPlayer 关联的结果。",
      hint: "以 IdPlayer 建立 Map，阵容作为主表；统计缺失时保留球员并填入明确的默认值。",
      nextChallenge: "增加球员对比视图，并允许按位置、分钟和 xG 筛选。",
    },
  };

  function createInitialFixtures() {
    return [
      { id: "M1", hostCity: "Mexico City", home: "Mexico", away: "Canada", homeGoals: 1, awayGoals: 1 },
      { id: "M2", hostCity: "Los Angeles", home: "USA", away: "Japan", homeGoals: 2, awayGoals: 1 },
      { id: "M3", hostCity: "Vancouver", home: "Canada", away: "Japan", homeGoals: 0, awayGoals: 0 },
      { id: "M4", hostCity: "Dallas", home: "USA", away: "Mexico", homeGoals: 1, awayGoals: 2 },
      { id: "M5", hostCity: "Seattle", home: "Canada", away: "USA", homeGoals: 2, awayGoals: 2 },
      { id: "M6", hostCity: "Guadalajara", home: "Japan", away: "Mexico", homeGoals: 1, awayGoals: 3 },
    ];
  }

  function emptyRow(team) {
    return {
      team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      rank: 0,
    };
  }

  function calculateStandings(teamNames, fixtures) {
    const table = new Map(teamNames.map((team) => [team, emptyRow(team)]));

    fixtures.forEach((match) => {
      if (!Number.isFinite(match.homeGoals) || !Number.isFinite(match.awayGoals)) {
        return;
      }
      const home = table.get(match.home);
      const away = table.get(match.away);
      if (!home || !away) {
        return;
      }

      home.played += 1;
      away.played += 1;
      home.goalsFor += match.homeGoals;
      home.goalsAgainst += match.awayGoals;
      away.goalsFor += match.awayGoals;
      away.goalsAgainst += match.homeGoals;

      if (match.homeGoals > match.awayGoals) {
        home.wins += 1;
        away.losses += 1;
        home.points += 3;
      } else if (match.homeGoals < match.awayGoals) {
        away.wins += 1;
        home.losses += 1;
        away.points += 3;
      } else {
        home.draws += 1;
        away.draws += 1;
        home.points += 1;
        away.points += 1;
      }
    });

    const rows = Array.from(table.values()).map((row) => ({
      ...row,
      goalDifference: row.goalsFor - row.goalsAgainst,
    }));

    return sortRows(rows).map((row, index) => ({
      ...row,
      rank: index + 1,
      qualification: index < 2 ? "Direct" : index === 2 ? "Third-place watch" : "Risk",
    }));
  }

  function sortRows(rows) {
    return rows.slice().sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.team.localeCompare(b.team);
    });
  }

  function rankThirdPlaceTeams(groups) {
    const thirdRows = groups
      .map((group, index) => {
        const third = group.find((row) => row.rank === 3) || group[2];
        return third ? { ...third, group: String.fromCharCode(65 + index) } : null;
      })
      .filter(Boolean);
    return sortRows(thirdRows).map((row, index) => ({
      ...row,
      thirdRank: index + 1,
      status: index < 8 ? "Advance" : "Out",
    }));
  }

  function updateFixturePrediction(fixtures, fixtureId, homeGoals, awayGoals) {
    return fixtures.map((match) => {
      if (match.id !== fixtureId) {
        return { ...match };
      }
      return {
        ...match,
        homeGoals: Number(homeGoals),
        awayGoals: Number(awayGoals),
      };
    });
  }

  function estimateQualificationChances(standings, options = {}) {
    const hostMomentum = Number(options.hostMomentum || 0);
    const upsetIndex = Number(options.upsetIndex || 0);
    const maxPoints = Math.max(...standings.map((row) => row.points), 1);
    return standings.map((row) => {
      const rankBonus = Math.max(0, 5 - row.rank) * 8;
      const pointScore = (row.points / maxPoints) * 52;
      const goalScore = Math.max(-12, Math.min(12, row.goalDifference * 5));
      const hostBonus = ["Canada", "Mexico", "USA"].includes(row.team) ? hostMomentum * 1.5 : 0;
      const chaosPenalty = row.rank <= 2 ? upsetIndex * 0.8 : -upsetIndex * 0.6;
      const chance = clamp(Math.round(20 + pointScore + rankBonus + goalScore + hostBonus - chaosPenalty), 5, 95);
      return {
        team: row.team,
        chance,
      };
    });
  }

  function calculateChaosIndex(fixtures, standings) {
    const draws = fixtures.filter((match) => match.homeGoals === match.awayGoals).length;
    const pointSpread = standings[0].points - standings[standings.length - 1].points;
    const thirdGap = standings[1].points - standings[2].points;
    return clamp(Math.round(35 + draws * 9 - pointSpread * 5 - thirdGap * 6), 8, 95);
  }

  function buildVibeTaskPack(taskId) {
    const task = TASKS[taskId] || TASKS["tie-breaker-bug"];
    const guide = TASK_GUIDES[taskId] || TASK_GUIDES["tie-breaker-bug"];
    const taskCard = {
      title: task.title,
      goal: task.goal,
      input: task.inputs,
      output: task.outputs,
      constraints: task.constraints,
      acceptance: task.acceptance,
      exclusions: "真实赛程接入、用户系统、后端数据库、本轮不处理。",
      seedBug: task.seedBug,
    };

    const planPrompt = [
      "请基于下面任务卡片生成实现计划，先不要写代码。",
      "",
      `任务：${taskCard.title}`,
      `目标：${taskCard.goal}`,
      `输入：${taskCard.input}`,
      `输出：${taskCard.output}`,
      `约束：${taskCard.constraints}`,
      `验收标准：\n${taskCard.acceptance.map((item, index) => `${index + 1}. ${item}`).join("\n")}`,
      "",
      "请输出：需要阅读的文件、3-5 步最小实现步骤、每一步验证方式、主要风险、需要确认的问题。",
    ].join("\n");

    const executePrompt = [
      "请根据任务卡片和实现计划执行最小改动。",
      "",
      `任务：${taskCard.title}`,
      `目标：${taskCard.goal}`,
      "执行要求：只修改相关文件；保持最小改动；运行验证命令；汇总修改点、验证结果和未解决问题。",
    ].join("\n");

    const debugPrompt = [
      "以下是运行命令、完整报错、相关输入和最近改动。",
      "",
      `任务：${taskCard.title}`,
      "失败信息：【粘贴完整报错或失败截图描述】",
      "",
      "请判断最可能原因，给出最小修复方案，并说明修复后重新运行哪些验证。",
    ].join("\n");

    const taskPath = {
      ...guide,
      steps: [
        { title: "观察现象", detail: guide.observe, action: "记录输入" },
        { title: "生成计划", detail: `先阅读 ${guide.startFiles.join("、")}，列出最小改动和验证命令。`, action: "复制 Plan" },
        { title: "执行最小改动", detail: task.constraints, action: "复制 Execute" },
        { title: "制造失败", detail: `主动复现：${task.seedBug}`, action: "查看提示" },
        { title: "提交证据", detail: `至少满足：${task.acceptance[0]}`, action: "核对条件" },
      ],
      completionConditions: task.acceptance,
    };

    return {
      taskCard,
      taskPath,
      planPrompt,
      executePrompt,
      debugPrompt,
      verificationChecklist: [
        "任务卡片字段完整。",
        "Plan 中每一步有验证方式。",
        "Execute 阶段只做最小改动。",
        ...task.acceptance,
      ],
    };
  }

  function filterMatches(matches, filters = {}) {
    const group = filters.group || "";
    const stage = filters.stage || "";
    const teamId = filters.teamId || "";
    const status = filters.status || "";
    return (matches || []).filter((match) => {
      if (group && match.group !== group) return false;
      if (stage && match.stage !== stage) return false;
      if (status && match.status !== status) return false;
      if (teamId && match.home.id !== teamId && match.away.id !== teamId) return false;
      return true;
    });
  }

  function groupMatchesByDate(matches, timeZone = "Asia/Shanghai") {
    const formatter = new Intl.DateTimeFormat("en", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const sections = new Map();
    (matches || [])
      .slice()
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach((match) => {
        const parts = Object.fromEntries(formatter.formatToParts(new Date(match.date)).map((part) => [part.type, part.value]));
        const key = `${parts.year}-${parts.month}-${parts.day}`;
        if (!sections.has(key)) sections.set(key, []);
        sections.get(key).push(match);
      });
    return Array.from(sections, ([key, dateMatches]) => ({ key, matches: dateMatches }));
  }

  function groupMatchesByStage(matches) {
    const sections = new Map();
    (matches || []).forEach((match) => {
      const stage = match.stage || "Other";
      if (!sections.has(stage)) sections.set(stage, []);
      sections.get(stage).push(match);
    });
    return Array.from(sections, ([stage, stageMatches]) => ({
      stage,
      matches: stageMatches.slice().sort((a, b) => new Date(a.date) - new Date(b.date)),
    })).sort((a, b) => {
      const aIndex = STAGE_ORDER.indexOf(a.stage);
      const bIndex = STAGE_ORDER.indexOf(b.stage);
      return (aIndex < 0 ? STAGE_ORDER.length : aIndex) - (bIndex < 0 ? STAGE_ORDER.length : bIndex);
    });
  }

  function selectOverviewMatches(matches, limit = 4, now = new Date()) {
    const time = now.getTime();
    const live = (matches || []).filter((match) => match.status === "live").sort((a, b) => new Date(a.date) - new Date(b.date));
    const upcoming = (matches || []).filter((match) => match.status === "scheduled" && new Date(match.date).getTime() >= time).sort((a, b) => new Date(a.date) - new Date(b.date));
    const otherScheduled = (matches || []).filter((match) => match.status === "scheduled" && new Date(match.date).getTime() < time).sort((a, b) => new Date(b.date) - new Date(a.date));
    const completed = (matches || []).filter((match) => match.status === "completed").sort((a, b) => new Date(b.date) - new Date(a.date));
    return [...live, ...upcoming, ...otherScheduled, ...completed].slice(0, limit);
  }

  function moveSpotlight(matches, currentId, direction) {
    if (!(matches || []).length) return null;
    const currentIndex = matches.findIndex((match) => String(match.id) === String(currentId));
    const startIndex = currentIndex < 0 ? 0 : currentIndex;
    const nextIndex = (startIndex + Math.sign(direction || 1) + matches.length) % matches.length;
    return matches[nextIndex];
  }

  function selectSpotlightWindow(matches, currentId, size = 5) {
    if (!(matches || []).length || size <= 0) return [];
    const count = Math.min(size, matches.length);
    const currentIndex = Math.max(0, matches.findIndex((match) => String(match.id) === String(currentId)));
    const centeredStart = currentIndex - Math.floor(count / 2);
    const start = Math.max(0, Math.min(centeredStart, matches.length - count));
    return matches.slice(start, start + count);
  }

  function formatHttpError(status, contentType, body = "") {
    if (String(contentType).includes("text/html")) return "本地数据服务未启动，请运行 npm start";
    let detail = String(body).trim();
    if (String(contentType).includes("application/json") && detail) {
      try {
        const parsed = JSON.parse(detail);
        detail = parsed.error || parsed.message || detail;
      } catch {
        // Keep the short response body when an upstream labels malformed JSON.
      }
    }
    detail = String(detail).replace(/\s+/g, " ").slice(0, 120);
    return detail ? `请求失败（${status}）：${detail}` : `请求失败（${status}）`;
  }

  function splitPossessionControl(homeValue, awayValue) {
    const home = Number(homeValue || 0);
    const away = Number(awayValue || 0);
    if (home <= 0 && away <= 0) return null;

    let shares = [home <= 1 ? home * 100 : home, 0, away <= 1 ? away * 100 : away];
    shares[1] = Math.max(0, 100 - shares[0] - shares[2]);
    const total = shares.reduce((sum, value) => sum + value, 0);
    if (total > 100) shares = shares.map((value) => (value / total) * 100);

    const rounded = shares.map(Math.floor);
    let remaining = 100 - rounded.reduce((sum, value) => sum + value, 0);
    const remainderOrder = shares
      .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
      .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
    for (let index = 0; index < remaining; index += 1) rounded[remainderOrder[index % remainderOrder.length].index] += 1;

    return { home: rounded[0], contest: rounded[1], away: rounded[2] };
  }

  function rankOfficialThirdPlaceTeams(groups, qualifiedCount = 8, qualificationZoneOnly = false) {
    const ranked = (groups || [])
      .map((group) => {
        const row = (group.rows || []).find((item) => item.position === 3);
        return row ? { ...row, group: group.name } : null;
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        if ((b.fairPlayCoefficient || 0) !== (a.fairPlayCoefficient || 0)) {
          return (b.fairPlayCoefficient || 0) - (a.fairPlayCoefficient || 0);
        }
        return a.team.name.localeCompare(b.team.name);
      })
      .map((row, index) => ({
        ...row,
        thirdRank: index + 1,
        status: index < qualifiedCount ? "Advance" : "Out",
      }));
    return qualificationZoneOnly ? ranked.slice(0, qualifiedCount) : ranked;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  return {
    DEMO_TEAMS,
    HOST_CITIES,
    TASKS,
    createInitialFixtures,
    calculateStandings,
    rankThirdPlaceTeams,
    updateFixturePrediction,
    estimateQualificationChances,
    calculateChaosIndex,
    buildVibeTaskPack,
    filterMatches,
    groupMatchesByDate,
    groupMatchesByStage,
    selectOverviewMatches,
    moveSpotlight,
    selectSpotlightWindow,
    formatHttpError,
    splitPossessionControl,
    rankOfficialThirdPlaceTeams,
  };
});
