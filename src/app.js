const Ops = window.WorldCupOps;

const state = {
  tournament: null,
  source: "loading",
  activeView: "overview",
  selectedGroup: "",
  selectedKnockoutStage: "Round of 32",
  selectedDateKey: "",
  selectedMatchId: "",
  spotlightMatchId: "",
  selectedDetail: null,
  detailCache: new Map(),
  revealObserver: null,
  taskId: "official-data-sync",
  predictions: loadPredictions(),
  taskProgress: loadTaskProgress(),
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const refs = {
  sourceBadge: $("#sourceBadge"), lastSync: $("#lastSync"), refreshInterval: $("#refreshInterval"), syncMessage: $("#syncMessage"),
  matchCount: $("#matchCount"), completedCount: $("#completedCount"), scheduledCount: $("#scheduledCount"), teamCount: $("#teamCount"),
  progressPercent: $("#progressPercent"), progressBar: $("#progressBar"), featuredStatus: $("#featuredStatus"), featuredMatch: $("#featuredMatch"),
  faceoffHero: $("#faceoffHero"), featuredStage: $("#featuredStage"), featuredKickoff: $("#featuredKickoff"), featuredVenue: $("#featuredVenue"),
  homeHeroPlayer: $("#homeHeroPlayer"), awayHeroPlayer: $("#awayHeroPlayer"), homeHeroFlag: $("#homeHeroFlag"), awayHeroFlag: $("#awayHeroFlag"),
  homeHeroLabel: $("#homeHeroLabel"), awayHeroLabel: $("#awayHeroLabel"), featuredAction: $("#featuredAction"),
  spotlightPrev: $("#spotlightPrev"), spotlightNext: $("#spotlightNext"), spotlightRail: $("#spotlightRail"),
  overviewMatches: $("#overviewMatches"), overviewGroups: $("#overviewGroups"),
  stageFilter: $("#stageFilter"), groupFilter: $("#groupFilter"), teamFilter: $("#teamFilter"), statusFilter: $("#statusFilter"), filteredCount: $("#filteredCount"),
  tournamentCacheStatus: $("#tournamentCacheStatus"), detailCacheStatus: $("#detailCacheStatus"), groupTabs: $("#groupTabs"), standingsTitle: $("#standingsTitle"),
  standingsBody: $("#standingsBody"), pointsBars: $("#pointsBars"), groupMatches: $("#groupMatches"), groupMatchCount: $("#groupMatchCount"),
  thirdPlacePreview: $("#thirdPlacePreview"), thirdPlaceBody: $("#thirdPlaceBody"), thirdPlaceToggle: $("#thirdPlaceToggle"), thirdPlaceDisclosure: $("#thirdPlaceDisclosure"),
  knockoutRoundTabs: $("#knockoutRoundTabs"), knockoutStageSummary: $("#knockoutStageSummary"), knockoutMatches: $("#knockoutMatches"),
  knockoutMatchesTitle: $("#knockoutMatchesTitle"), knockoutMatchCount: $("#knockoutMatchCount"), scheduleDateRail: $("#scheduleDateRail"), scheduleSections: $("#scheduleSections"),
  refreshMatch: $("#refreshMatch"), matchEmpty: $("#matchEmpty"), matchDetail: $("#matchDetail"), matchDetailTitle: $("#matchDetailTitle"),
  homeTeamBlock: $("#homeTeamBlock"), awayTeamBlock: $("#awayTeamBlock"), officialScore: $("#officialScore"), matchMeta: $("#matchMeta"),
  predictionHome: $("#predictionHome"), predictionAway: $("#predictionAway"), predictionResult: $("#predictionResult"),
  teamComparison: $("#teamComparison"), eventList: $("#eventList"), homeLineupTitle: $("#homeLineupTitle"), awayLineupTitle: $("#awayLineupTitle"),
  homeLineup: $("#homeLineup"), awayLineup: $("#awayLineup"), playerStatsBody: $("#playerStatsBody"), playerCountBadge: $("#playerCountBadge"),
  taskControls: $("#taskControls"), taskCard: $("#taskCard"), planPrompt: $("#planPrompt"), executePrompt: $("#executePrompt"),
  taskMeta: $("#taskMeta"), taskPath: $("#taskPath"), taskMissionKicker: $("#taskMissionKicker"), taskMissionTitle: $("#taskMissionTitle"), taskMissionGoal: $("#taskMissionGoal"),
  taskHint: $("#taskHint"), taskCompletion: $("#taskCompletion"), taskChallenge: $("#taskChallenge"), copyStatus: $("#copyStatus"),
  verifyList: $("#verifyList"), failureInput: $("#failureInput"), debugPrompt: $("#debugPrompt"),
  openTeachingLab: $("#openTeachingLab"), closeTeachingLab: $("#closeTeachingLab"), teachingLabDrawer: $("#teachingLabDrawer"), drawerBackdrop: $("#drawerBackdrop"),
};

async function loadTournament(force = false) {
  setSourceState("loading", force ? "正在强制刷新" : "正在读取数据");
  try {
    const result = await fetchJson(force ? "/api/refresh" : "/api/tournament", force ? { method: "POST" } : {});
    state.tournament = result.data;
    state.source = result.source;
    setSourceState(result.stale ? "stale" : "live", sourceLabel(result.source));
    refs.tournamentCacheStatus.textContent = result.stale ? "旧缓存降级" : result.source === "official" ? "刚刚同步" : "1 小时缓存";
    refs.syncMessage.textContent = result.error ? `官方刷新失败，已使用缓存：${result.error}` : "比赛与积分榜每小时同步，单场球员数据按需缓存";
  } catch (apiError) {
    try {
      state.tournament = await fetchJson("data/fifa-2026.json", { cache: "no-store" });
      state.source = "bundled-snapshot";
      setSourceState("stale", "内置官方快照");
      refs.tournamentCacheStatus.textContent = "内置快照";
      refs.syncMessage.textContent = apiError.message.includes("npm start")
        ? "正在使用内置官方快照 · 启动实时数据请运行 npm start"
        : `实时数据暂不可用，已读取最后同步快照：${apiError.message}`;
    } catch (snapshotError) {
      setSourceState("error", "数据不可用");
      refs.syncMessage.textContent = `${apiError.message}; ${snapshotError.message}`;
      return;
    }
  }

  initializeSelection();
  populateFilters();
  renderTournament();
}

function initializeSelection() {
  const groups = state.tournament.groups || [];
  const matches = state.tournament.matches || [];
  if (!groups.some((group) => group.name === state.selectedGroup)) state.selectedGroup = groups[0]?.name || "";

  const knockoutSections = Ops.groupMatchesByStage(matches.filter((match) => match.stage !== "First Stage"));
  if (!knockoutSections.some((section) => section.stage === state.selectedKnockoutStage)) {
    state.selectedKnockoutStage = knockoutSections[0]?.stage || "";
  }

  if (!matches.some((match) => match.id === state.selectedMatchId)) {
    const completed = matches.find((match) => match.status === "completed");
    state.selectedMatchId = completed?.id || matches[0]?.id || "";
  }
  if (!matches.some((match) => match.id === state.spotlightMatchId)) {
    const localPortraitMatch = matches.find((match) => match.id === "400021443");
    const completed = matches.find((match) => match.status === "completed");
    state.spotlightMatchId = localPortraitMatch?.id || completed?.id || matches[0]?.id || "";
  }

  const dateSections = Ops.groupMatchesByDate(matches);
  if (!dateSections.some((section) => section.key === state.selectedDateKey)) {
    state.selectedDateKey = pickScheduleDate(dateSections);
  }
}

function populateFilters() {
  const matches = state.tournament.matches || [];
  setOptions(refs.stageFilter, unique(matches.map((match) => match.stage)), "全部阶段", stageLabel);
  setOptions(refs.groupFilter, unique(matches.map((match) => match.group).filter(Boolean)), "全部小组", groupLabel);
  refs.teamFilter.innerHTML = '<option value="">全部球队</option>' + (state.tournament.teams || []).map((team) => `<option value="${escapeHtml(team.id)}">${escapeHtml(team.name)}</option>`).join("");
}

function renderTournament() {
  const matches = state.tournament.matches || [];
  const teams = state.tournament.teams || [];
  const meta = state.tournament.meta || {};
  const completed = meta.completedCount ?? matches.filter((match) => match.status === "completed").length;
  const total = meta.matchCount ?? matches.length;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  refs.lastSync.textContent = formatDateTime(meta.syncedAt);
  refs.refreshInterval.textContent = "1 小时";
  refs.matchCount.textContent = total;
  refs.completedCount.textContent = completed;
  refs.scheduledCount.textContent = meta.scheduledCount ?? matches.filter((match) => match.status === "scheduled").length;
  refs.teamCount.textContent = meta.teamCount ?? teams.length;
  refs.progressPercent.textContent = `${progress}%`;
  refs.progressBar.style.width = `${progress}%`;

  renderOverview();
  renderGroupTabs();
  renderStandings();
  renderGroupMatches();
  renderThirdPlace();
  renderKnockout();
  renderScheduleSections();
  renderTaskControls();
  renderTaskPack();
  loadSpotlightDetail();
  initializeRevealAnimations();
  animateSummaryMetrics();
}

function renderOverview() {
  const allMatches = state.tournament.matches || [];
  const featured = allMatches.find((match) => match.id === state.spotlightMatchId);
  const matches = Ops.selectOverviewMatches(allMatches.filter((match) => match.id !== state.spotlightMatchId), 4, new Date());
  if (!featured) {
    refs.featuredStatus.textContent = "暂无比赛";
    refs.featuredAction.disabled = true;
  } else {
    refs.featuredStatus.className = `live-pill ${featured.status}`;
    refs.featuredStatus.textContent = statusText(featured.status);
    refs.featuredStage.textContent = `${stageLabel(featured.stage)} · MATCH ${featured.matchNumber || featured.id}`;
    refs.featuredKickoff.textContent = formatDateTime(featured.date);
    refs.featuredVenue.textContent = featured.stadium || featured.city || "WORLD CUP 26";
    refs.featuredAction.disabled = false;
    refs.featuredAction.dataset.matchId = featured.id;
    refs.featuredAction.querySelector("strong").textContent = `${featured.score.home ?? "-"} : ${featured.score.away ?? "-"}`;
    refs.homeHeroLabel.innerHTML = `<strong>${escapeHtml(featured.home.name)}</strong><small>${escapeHtml(featured.home.code || "HOME")}</small>`;
    refs.awayHeroLabel.innerHTML = `<strong>${escapeHtml(featured.away.name)}</strong><small>${escapeHtml(featured.away.code || "AWAY")}</small>`;
    refs.faceoffHero.style.setProperty("--home-team-color", teamColor(featured.home, 0));
    refs.faceoffHero.style.setProperty("--away-team-color", teamColor(featured.away, 1));
    resetHeroPortraits(featured);
    refs.spotlightRail.innerHTML = Ops.selectSpotlightWindow(allMatches, featured.id, 5).map((match) => spotlightCardMarkup(match, featured.id)).join("");
  }
  refs.overviewMatches.innerHTML = matches.map(matchRowMarkup).join("") || '<div class="empty-state">暂无后续比赛。</div>';

  refs.overviewGroups.innerHTML = (state.tournament.groups || []).map((group) => {
    const leader = group.rows?.[0];
    const third = group.rows?.find((row) => row.position === 3);
    return `<button type="button" class="group-snapshot" data-overview-group="${escapeHtml(group.name)}"><span class="group-letter">${escapeHtml(groupLabel(group.name))}</span><span><small>领跑</small><strong>${escapeHtml(leader?.team?.name || "待定")}</strong></span><b>${leader?.points ?? 0} 分</b><em>第三名 ${escapeHtml(third?.team?.name || "待定")}</em></button>`;
  }).join("");
}

function spotlightCardMarkup(match, currentId) {
  const active = match.id === currentId;
  return `<button type="button" data-spotlight-match="${escapeHtml(match.id)}" class="${active ? "active" : ""}" aria-pressed="${active}"><span>${String(match.matchNumber || "--").padStart(2, "0")}</span><strong>${escapeHtml(match.home.code || shortTeamName(match.home.name))}<i>${match.score.home ?? "-"}:${match.score.away ?? "-"}</i>${escapeHtml(match.away.code || shortTeamName(match.away.name))}</strong><small>${escapeHtml(shortStageLabel(match.stage))} · ${formatDateTime(match.date)}</small></button>`;
}

function selectSpotlightMatch(matchId) {
  const match = state.tournament?.matches?.find((item) => item.id === matchId);
  if (!match || match.id === state.spotlightMatchId) return;
  state.spotlightMatchId = match.id;
  refs.faceoffHero.classList.remove("match-changing");
  void refs.faceoffHero.offsetWidth;
  refs.faceoffHero.classList.add("match-changing");
  renderOverview();
  loadSpotlightDetail();
  window.setTimeout(() => refs.faceoffHero.classList.remove("match-changing"), 720);
}

function moveSpotlight(direction) {
  const match = Ops.moveSpotlight(state.tournament?.matches || [], state.spotlightMatchId, direction);
  if (match) selectSpotlightMatch(match.id);
}

function renderGroupTabs() {
  refs.groupTabs.innerHTML = (state.tournament.groups || []).map((group) => `<button type="button" data-group-tab="${escapeHtml(group.name)}" class="${group.name === state.selectedGroup ? "active" : ""}">${escapeHtml(groupLabel(group.name))}</button>`).join("");
}

function renderStandings() {
  const group = selectedGroup();
  if (!group) return;
  refs.standingsTitle.textContent = `${groupLabel(group.name)} 组`;
  refs.standingsBody.innerHTML = group.rows.map((row) => {
    const status = row.position <= 2 ? ["direct", "直接晋级"] : row.position === 3 ? ["watch", "第三名比较"] : ["out", "出局"];
    return `<tr><td><strong>${row.position}</strong></td><td>${teamMarkup(row.team)}</td><td>${row.played}</td><td>${row.won}</td><td>${row.drawn}</td><td>${row.lost}</td><td>${signed(row.goalDifference)}</td><td><strong>${row.points}</strong></td><td><span class="qualify ${status[0]}">${status[1]}</span></td></tr>`;
  }).join("");
  const max = Math.max(...group.rows.map((row) => row.points), 1);
  refs.pointsBars.innerHTML = group.rows.map((row) => barRow(row.team.name, row.points, max, "分")).join("");
}

function renderGroupMatches() {
  const matches = (state.tournament.matches || []).filter((match) => match.group === state.selectedGroup).sort((a, b) => new Date(a.date) - new Date(b.date));
  refs.groupMatchCount.textContent = `${matches.length} 场`;
  refs.groupMatches.innerHTML = matches.map(matchRowMarkup).join("") || '<div class="empty-state">暂无本组比赛。</div>';
}

function renderThirdPlace() {
  const rows = Ops.rankOfficialThirdPlaceTeams(state.tournament.groups, 8);
  const qualified = Ops.rankOfficialThirdPlaceTeams(state.tournament.groups, 8, true);
  refs.thirdPlacePreview.innerHTML = qualified.map((row) => `<div class="third-place-chip"><span>${row.thirdRank}</span>${flag(row.team)}<div><strong>${escapeHtml(row.team.name)}</strong><small>${escapeHtml(groupLabel(row.group))} · ${row.points} 分 · ${signed(row.goalDifference)}</small></div></div>`).join("");
  refs.thirdPlaceBody.innerHTML = rows.map((row) => `<tr><td>${row.thirdRank}</td><td>${escapeHtml(groupLabel(row.group))}</td><td>${teamMarkup(row.team)}</td><td>${row.points}</td><td>${signed(row.goalDifference)}</td><td>${row.goalsFor}</td><td><span class="qualify ${row.status === "Advance" ? "advance" : "out"}">${row.status === "Advance" ? "晋级" : "出局"}</span></td></tr>`).join("");
}

function renderKnockout() {
  const sections = Ops.groupMatchesByStage((state.tournament.matches || []).filter((match) => match.stage !== "First Stage"));
  const selected = sections.find((section) => section.stage === state.selectedKnockoutStage) || sections[0];
  if (!selected) return;
  state.selectedKnockoutStage = selected.stage;

  refs.knockoutRoundTabs.innerHTML = sections.map((section) => `<button type="button" data-knockout-stage="${escapeHtml(section.stage)}" class="${section.stage === selected.stage ? "active" : ""}">${escapeHtml(shortStageLabel(section.stage))}</button>`).join("");
  refs.knockoutStageSummary.innerHTML = sections.map((section, index) => `<button type="button" class="round-card ${section.stage === selected.stage ? "active" : ""}" data-round-select="${escapeHtml(section.stage)}"><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(stageLabel(section.stage))}</strong><small>${section.matches.length} 场</small></button>`).join("");
  refs.knockoutMatchesTitle.textContent = stageLabel(selected.stage);
  refs.knockoutMatchCount.textContent = `${selected.matches.length} 场`;
  refs.knockoutMatches.innerHTML = selected.matches.map(matchRowMarkup).join("") || '<div class="empty-state">本轮对阵尚未确定。</div>';
}

function renderScheduleSections() {
  const filtered = Ops.filterMatches(state.tournament.matches || [], currentFilters());
  const sections = Ops.groupMatchesByDate(filtered);
  refs.filteredCount.textContent = `${filtered.length} 场`;
  if (!sections.some((section) => section.key === state.selectedDateKey)) state.selectedDateKey = pickScheduleDate(sections);

  refs.scheduleDateRail.innerHTML = sections.map((section) => `<button type="button" data-date-key="${section.key}" class="${section.key === state.selectedDateKey ? "active" : ""}"><span>${formatDateRail(section.key)}</span><small>${section.matches.length} 场</small></button>`).join("") || '<span class="empty-state">当前筛选没有比赛日。</span>';

  const selected = sections.find((section) => section.key === state.selectedDateKey);
  if (!selected) {
    refs.scheduleSections.innerHTML = '<div class="empty-state">当前筛选没有比赛。</div>';
    return;
  }

  const clusters = new Map();
  selected.matches.forEach((match) => {
    const key = match.group || match.stage || "比赛";
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key).push(match);
  });
  refs.scheduleSections.innerHTML = `<header class="match-day-heading"><div><span>${formatWeekday(selected.key)}</span><h3>${formatFullDate(selected.key)}</h3></div><strong>${selected.matches.length} 场比赛</strong></header>` + Array.from(clusters, ([label, matches]) => `<article class="schedule-cluster panel"><div class="cluster-heading"><h3>${escapeHtml(label.startsWith("Group ") ? `${groupLabel(label)} 组` : stageLabel(label))}</h3><span>${matches.length} 场</span></div><div class="compact-match-list">${matches.map(matchRowMarkup).join("")}</div></article>`).join("");
}

function revealSelectedDate() {
  const active = refs.scheduleDateRail.querySelector(".active");
  if (active) active.scrollIntoView({ block: "nearest", inline: "center" });
}

function setActiveView(view) {
  if (!$( `[data-view-panel="${view}"]` )) return;
  state.activeView = view;
  const update = () => {
    $$('[data-view-target]').forEach((button) => {
      const active = button.dataset.viewTarget === view;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    $$('[data-view-panel]').forEach((panel) => {
      const active = panel.dataset.viewPanel === view;
      panel.classList.toggle("active", active);
      panel.hidden = !active;
    });
  };
  if (document.startViewTransition && !prefersReducedMotion()) document.startViewTransition(update);
  else update();
  if (view === "schedule") requestAnimationFrame(revealSelectedDate);
  if (view === "data" && state.selectedMatchId && !state.selectedDetail) loadMatchDetail(state.selectedMatchId, false);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleThirdPlace() {
  const expanded = refs.thirdPlaceToggle.getAttribute("aria-expanded") === "true";
  refs.thirdPlaceToggle.setAttribute("aria-expanded", String(!expanded));
  refs.thirdPlaceToggle.textContent = expanded ? "查看完整 12 队排名" : "收起完整排名";
  refs.thirdPlaceDisclosure.hidden = expanded;
}

function setTeachingLab(open) {
  refs.openTeachingLab.setAttribute("aria-expanded", String(open));
  refs.teachingLabDrawer.setAttribute("aria-hidden", String(!open));
  refs.teachingLabDrawer.classList.toggle("open", open);
  refs.drawerBackdrop.hidden = !open;
  document.body.classList.toggle("drawer-open", open);
  if (open) refs.closeTeachingLab.focus();
}

async function loadSpotlightDetail() {
  const match = state.tournament?.matches?.find((item) => item.id === state.spotlightMatchId);
  if (!match) return;
  try {
    const detail = await getMatchDetailData(match.id, false);
    if (state.spotlightMatchId !== match.id) return;
    updateHeroPortraits(match, detail.data);
  } catch {
    if (state.spotlightMatchId !== match.id) return;
    resetHeroPortraits(match);
  }
}

function selectHeroPlayer(players) {
  return (players || [])
    .filter((player) => player.picture)
    .slice()
    .sort((a, b) => heroPlayerScore(b) - heroPlayerScore(a))[0] || null;
}

function heroPlayerScore(player) {
  return Number(player.captain) * 100 + Number(player.starter) * 30 + Number(player.position === 3) * 15 + Number(player.stats?.goals || 0) * 8 + Number(player.stats?.minutes || 0) / 100;
}

function updateHeroPortraits(match, detail) {
  if (!detail || String(detail.home?.id) !== String(match.home.id) || String(detail.away?.id) !== String(match.away.id)) return;
  setHeroPortrait("home", match.home, selectHeroPlayer(detail.home.players), fallbackPortrait(match.home));
  setHeroPortrait("away", match.away, selectHeroPlayer(detail.away.players), fallbackPortrait(match.away));
}

function resetHeroPortraits(match) {
  setHeroPortrait("home", match.home, null, fallbackPortrait(match.home));
  setHeroPortrait("away", match.away, null, fallbackPortrait(match.away));
}

function setHeroPortrait(side, team, player, fallback) {
  const image = side === "home" ? refs.homeHeroPlayer : refs.awayHeroPlayer;
  const flagContainer = side === "home" ? refs.homeHeroFlag : refs.awayHeroFlag;
  const label = side === "home" ? refs.homeHeroLabel : refs.awayHeroLabel;
  const source = player?.picture || fallback;
  if (source) {
    image.src = source;
    image.alt = player ? `${player.name}, ${team.name}` : team.name;
    image.hidden = false;
    flagContainer.hidden = true;
    if (player) label.innerHTML = `<strong>${escapeHtml(team.name)}</strong><small>${escapeHtml(player.name)}</small>`;
  } else {
    image.hidden = true;
    flagContainer.hidden = false;
    flagContainer.innerHTML = flag(team);
  }
}

function fallbackPortrait(team) {
  return ({ MEX: "assets/players/mexico-montes.png", RSA: "assets/players/south-africa-williams.png" })[team.code] || "";
}

async function getMatchDetailData(matchId, force = false) {
  if (!force && state.detailCache.has(matchId)) return { data: state.detailCache.get(matchId), source: "memory", stale: false };
  try {
    const result = await fetchJson(`/api/match/${encodeURIComponent(matchId)}${force ? "?refresh=1" : ""}`);
    state.detailCache.set(matchId, result.data);
    return result;
  } catch (apiError) {
    const cached = await fetchJson(`data/matches/${encodeURIComponent(matchId)}.json`, { cache: "no-store" });
    state.detailCache.set(matchId, cached.data);
    return { data: cached.data, source: "bundled-match", stale: true, error: apiError.message };
  }
}

async function loadMatchDetail(matchId, force = false) {
  const match = state.tournament.matches.find((item) => item.id === matchId);
  if (!match) return;
  state.selectedMatchId = matchId;
  state.selectedDetail = null;
  renderMatchShell(match);
  refs.detailCacheStatus.textContent = "读取中";
  refs.refreshMatch.disabled = true;
  try {
    const result = await getMatchDetailData(matchId, force);
    state.selectedDetail = result.data;
    refs.detailCacheStatus.textContent = result.source === "official" ? "官方数据" : result.source === "memory" ? "详情缓存" : result.stale ? "内置单场快照" : "详情缓存";
  } catch (error) {
    refs.detailCacheStatus.textContent = "详情暂不可用";
    renderMatchUnavailable(match, error.message);
    refs.refreshMatch.disabled = false;
    return;
  }
  renderMatchDetail(match, state.selectedDetail);
  if (match.id === state.spotlightMatchId) updateHeroPortraits(match, state.selectedDetail);
  refs.refreshMatch.disabled = false;
}

function renderMatchShell(match) {
  refs.matchEmpty.hidden = true;
  refs.matchDetail.hidden = false;
  refs.matchDetailTitle.textContent = `${match.home.name} vs ${match.away.name}`;
  renderTeamBlock(refs.homeTeamBlock, match.home, false);
  renderTeamBlock(refs.awayTeamBlock, match.away, true);
  refs.officialScore.textContent = `${match.score.home ?? "-"} : ${match.score.away ?? "-"}`;
  refs.matchMeta.textContent = `${formatDateTime(match.date)} · ${match.stadium || match.city || stageLabel(match.stage)}`;
  renderPrediction(match);
  refs.teamComparison.innerHTML = '<div class="empty-state">正在读取球队统计...</div>';
  refs.eventList.innerHTML = '<div class="empty-state">正在读取事件...</div>';
  refs.homeLineup.innerHTML = refs.awayLineup.innerHTML = '<div class="empty-state">正在读取阵容...</div>';
  refs.playerStatsBody.innerHTML = "";
}

function renderMatchUnavailable(match, message) {
  renderMatchShell(match);
  const unavailable = `<div class="empty-state">${match.status === "scheduled" ? "比赛尚未开始，阵容和球员统计尚未公布。" : `单场详情暂不可用：${escapeHtml(message)}`}</div>`;
  refs.teamComparison.innerHTML = unavailable;
  refs.eventList.innerHTML = unavailable;
  refs.homeLineup.innerHTML = refs.awayLineup.innerHTML = unavailable;
}

function renderMatchDetail(match, detail) {
  renderTeamBlock(refs.homeTeamBlock, detail.home, false);
  renderTeamBlock(refs.awayTeamBlock, detail.away, true);
  refs.officialScore.textContent = `${detail.home.score ?? match.score.home ?? "-"} : ${detail.away.score ?? match.score.away ?? "-"}`;
  refs.homeLineupTitle.textContent = `${detail.home.name} 阵容${detail.home.tactics ? ` · ${detail.home.tactics}` : ""}`;
  refs.awayLineupTitle.textContent = `${detail.away.name} 阵容${detail.away.tactics ? ` · ${detail.away.tactics}` : ""}`;
  renderTeamComparison(detail);
  renderEvents(detail.events || []);
  renderLineup(refs.homeLineup, detail.home.players || []);
  renderLineup(refs.awayLineup, detail.away.players || []);
  renderPlayerStats(detail);
}

function renderTeamComparison(detail) {
  const possession = Ops.splitPossessionControl(detail.teamStats.home?.Possession, detail.teamStats.away?.Possession);
  const possessionMarkup = possession ? `<section class="possession-control" aria-label="控球率：主队 ${possession.home}%，中间比例 ${possession.contest}%，客队 ${possession.away}%"><div class="possession-heading"><strong>控球率</strong><span>合计 100%</span></div><div class="possession-segments"><b class="home" style="width:${possession.home}%">${possession.home}%</b><b class="contest" style="width:${possession.contest}%">${possession.contest}%</b><b class="away" style="width:${possession.away}%">${possession.away}%</b></div><div class="possession-labels"><span>${escapeHtml(detail.home.name)}</span><span aria-hidden="true"></span><span>${escapeHtml(detail.away.name)}</span></div></section>` : '<div class="empty-state compact-empty">暂无控球率数据。</div>';
  const metrics = [["AttemptAtGoal", "射门"], ["AttemptAtGoalOnTarget", "射正"], ["Passes", "传球"], ["PassesCompleted", "成功传球"], ["XG", "xG"], ["TopSpeed", "最高速度"], ["TotalDistance", "总跑动 km"]];
  const comparisonMarkup = metrics.map(([key, label]) => {
    const home = metric(detail.teamStats.home, key, false, key === "TotalDistance");
    const away = metric(detail.teamStats.away, key, false, key === "TotalDistance");
    return `<div class="comparison-row"><strong>${home}</strong><span>${label}</span><strong>${away}</strong></div>`;
  }).join("");
  refs.teamComparison.innerHTML = possessionMarkup + comparisonMarkup;
}

function renderEvents(events) {
  const useful = events.filter((event) => event.description || event.type).slice(-24).reverse();
  refs.eventList.innerHTML = useful.length ? useful.map((event) => `<div class="event-item"><strong>${escapeHtml(event.minute || "-")}</strong><span>${escapeHtml(event.description || event.type)}</span></div>`).join("") : '<div class="empty-state">暂无事件数据。</div>';
}

function renderLineup(container, players) {
  const sorted = players.slice().sort((a, b) => Number(b.starter) - Number(a.starter) || a.position - b.position || (a.shirtNumber || 99) - (b.shirtNumber || 99));
  container.innerHTML = sorted.length ? sorted.map((player) => `<div class="player-card">${player.picture ? `<img src="${escapeHtml(player.picture)}" alt="${escapeHtml(player.name)}" />` : `<span class="avatar">${initials(player.name)}</span>`}<div><strong>#${player.shirtNumber ?? "-"} ${escapeHtml(player.name)}${player.captain ? " (C)" : ""}</strong><span>${positionText(player.position)} · ${player.stats.minutes || 0} min</span></div>${player.starter ? '<span class="starter-tag">首发</span>' : ""}</div>`).join("") : '<div class="empty-state">阵容尚未公布。</div>';
}

function renderPlayerStats(detail) {
  const players = [...(detail.home.players || []).map((player) => ({ ...player, teamName: detail.home.name })), ...(detail.away.players || []).map((player) => ({ ...player, teamName: detail.away.name }))].sort((a, b) => b.stats.minutes - a.stats.minutes || b.stats.goals - a.stats.goals);
  refs.playerCountBadge.textContent = `${players.length} 名`;
  refs.playerStatsBody.innerHTML = players.length ? players.map((player) => `<tr><td><strong>#${player.shirtNumber ?? "-"} ${escapeHtml(player.name)}</strong></td><td>${escapeHtml(player.teamName)}</td><td>${player.starter ? "是" : "否"}</td><td>${player.stats.minutes}</td><td>${player.stats.goals}</td><td>${player.stats.passes}</td><td>${player.stats.passesCompleted}</td><td>${player.stats.totalDistanceKm}</td><td>${player.stats.topSpeed}</td><td>${player.stats.xg}</td></tr>`).join("") : '<tr><td colspan="10">球员统计尚不可用。</td></tr>';
}

function renderPrediction(match) {
  const prediction = state.predictions[match.id];
  refs.predictionHome.value = prediction?.home ?? "";
  refs.predictionAway.value = prediction?.away ?? "";
  refs.predictionResult.textContent = predictionLabel(match, prediction);
}

function savePrediction() {
  const match = selectedMatch();
  const home = Number(refs.predictionHome.value);
  const away = Number(refs.predictionAway.value);
  if (!match || !Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0 || home > 20 || away > 20) {
    refs.predictionResult.textContent = "请输入 0-20 的整数比分";
    return;
  }
  state.predictions[match.id] = { home, away, savedAt: new Date().toISOString() };
  localStorage.setItem("worldcupops-predictions", JSON.stringify(state.predictions));
  refs.predictionResult.textContent = predictionLabel(match, state.predictions[match.id]);
}

function predictionLabel(match, prediction) {
  if (!prediction) return "尚未竞猜";
  if (match.status !== "completed" || match.score.home == null) return `已保存 ${prediction.home}:${prediction.away}`;
  if (prediction.home === match.score.home && prediction.away === match.score.away) return "命中准确比分";
  return outcome(prediction.home, prediction.away) === outcome(match.score.home, match.score.away) ? "命中胜平负" : "未命中";
}

function renderTaskControls() {
  refs.taskControls.innerHTML = Object.entries(Ops.TASKS).map(([id, task]) => {
    const completed = state.taskProgress[id]?.steps?.length || 0;
    return `<button type="button" data-task="${id}" class="${id === state.taskId ? "active" : ""}">${escapeHtml(task.title)}<small>${completed}/5</small></button>`;
  }).join("");
}

function renderTaskPack() {
  const pack = Ops.buildVibeTaskPack(state.taskId);
  renderTaskPath(pack);
  refs.taskCard.innerHTML = [taskRow("目标", pack.taskCard.goal), taskRow("输入", pack.taskCard.input), taskRow("输出", pack.taskCard.output), taskRow("约束", pack.taskCard.constraints), taskRow("预设 bug", pack.taskCard.seedBug)].join("");
  refs.planPrompt.textContent = pack.planPrompt;
  refs.executePrompt.textContent = pack.executePrompt;
  const progress = progressForTask();
  refs.verifyList.innerHTML = pack.verificationChecklist.map((item, index) => `<label><input type="checkbox" data-verify-index="${index}" ${progress.checks.includes(index) ? "checked" : ""} /><span>${escapeHtml(item)}</span></label>`).join("");
  renderDebugPrompt();
}

function renderTaskPath(pack) {
  const progress = progressForTask();
  refs.taskMeta.innerHTML = [`难度 · ${pack.taskPath.difficulty}`, `预计 · ${pack.taskPath.duration}`, `起始文件 · ${pack.taskPath.startFiles.join(" / ")}`].map((item) => `<span>${escapeHtml(item)}</span>`).join("");
  refs.taskMissionKicker.textContent = state.taskId.replaceAll("-", " ").toUpperCase();
  refs.taskMissionTitle.textContent = pack.taskCard.title;
  refs.taskMissionGoal.textContent = pack.taskCard.goal;
  refs.taskPath.innerHTML = pack.taskPath.steps.map((step, index) => {
    const done = progress.steps.includes(index);
    return `<button type="button" class="task-step ${done ? "done" : ""}" data-task-step="${index}" aria-pressed="${done}"><b>${done ? "✓" : index + 1}</b><span><strong>${escapeHtml(step.title)}</strong><small>${escapeHtml(step.detail)}</small></span><em>${escapeHtml(step.action)}</em></button>`;
  }).join("");
  refs.taskHint.textContent = pack.taskPath.hint;
  refs.taskCompletion.innerHTML = pack.taskPath.completionConditions.map((item) => `<span>${escapeHtml(item)}</span>`).join("");
  refs.taskChallenge.textContent = pack.taskPath.nextChallenge;
}

function progressForTask() {
  if (!state.taskProgress[state.taskId]) state.taskProgress[state.taskId] = { steps: [], checks: [] };
  return state.taskProgress[state.taskId];
}

function toggleTaskStep(index) {
  const progress = progressForTask();
  progress.steps = progress.steps.includes(index) ? progress.steps.filter((item) => item !== index) : [...progress.steps, index].sort((a, b) => a - b);
  persistTaskProgress();
  renderTaskControls();
  renderTaskPath(Ops.buildVibeTaskPack(state.taskId));
}

function persistTaskProgress() {
  localStorage.setItem("worldcupops-task-progress", JSON.stringify(state.taskProgress));
}

function renderDebugPrompt() {
  const pack = Ops.buildVibeTaskPack(state.taskId);
  refs.debugPrompt.textContent = pack.debugPrompt.replace("【粘贴完整报错或失败截图描述】", refs.failureInput.value.trim() || "【粘贴完整报错或失败截图描述】");
}

function exportTaskPack() {
  const pack = Ops.buildVibeTaskPack(state.taskId);
  const content = [`# ${pack.taskCard.title}`, "", `- 数据快照：${state.tournament.meta.syncedAt}`, `- 数据来源：${state.tournament.meta.source}`, "", "## 任务卡片", `- 目标：${pack.taskCard.goal}`, `- 输入：${pack.taskCard.input}`, `- 输出：${pack.taskCard.output}`, `- 约束：${pack.taskCard.constraints}`, "", "## GLM Coding Plan", "```text", pack.planPrompt, "```", "", "## opencode Execute", "```text", pack.executePrompt, "```", "", "## Debug", "```text", refs.debugPrompt.textContent, "```"].join("\n");
  downloadText("worldcupops-live-data-task.md", content);
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function initializeRevealAnimations() {
  const targets = $$(".panel, .page-heading, .round-overview");
  state.revealObserver?.disconnect();
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    targets.forEach((target) => target.classList.add("motion-visible"));
    return;
  }
  state.revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("motion-visible");
      state.revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  targets.forEach((target) => {
    target.classList.add("motion-reveal");
    state.revealObserver.observe(target);
  });

  if (!refs.faceoffHero.dataset.motionReady) {
    refs.faceoffHero.dataset.motionReady = "true";
    refs.faceoffHero.addEventListener("pointermove", (event) => {
      const rect = refs.faceoffHero.getBoundingClientRect();
      refs.faceoffHero.style.setProperty("--parallax-x", `${((event.clientX - rect.left) / rect.width - 0.5) * 12}px`);
      refs.faceoffHero.style.setProperty("--parallax-y", `${((event.clientY - rect.top) / rect.height - 0.5) * 8}px`);
    });
    refs.faceoffHero.addEventListener("pointerleave", () => {
      refs.faceoffHero.style.setProperty("--parallax-x", "0px");
      refs.faceoffHero.style.setProperty("--parallax-y", "0px");
    });
  }
}

function animateSummaryMetrics() {
  if (prefersReducedMotion()) return;
  [refs.matchCount, refs.completedCount, refs.scheduledCount, refs.teamCount].forEach((element) => {
    const target = Number(element.textContent);
    if (!Number.isFinite(target) || element.dataset.animatedValue === String(target)) return;
    element.dataset.animatedValue = String(target);
    const startedAt = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / 650);
      element.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function matchRowMarkup(match) {
  return `<button type="button" class="match-row ${match.id === state.selectedMatchId ? "selected" : ""}" data-match-id="${match.id}"><span class="match-time"><strong>${formatTime(match.date)}</strong><small>${statusText(match.status)}</small></span><span class="row-team home">${flag(match.home)}<b>${escapeHtml(match.home.name)}</b></span><span class="row-score">${match.score.home ?? "-"}<i>:</i>${match.score.away ?? "-"}</span><span class="row-team away"><b>${escapeHtml(match.away.name)}</b>${flag(match.away)}</span><span class="match-context">${escapeHtml(match.group ? `${groupLabel(match.group)} 组` : shortStageLabel(match.stage))}<small>${escapeHtml(match.city || "")}</small></span></button>`;
}

function pickScheduleDate(sections) {
  if (!sections.length) return "";
  const live = sections.find((section) => section.matches.some((match) => match.status === "live"));
  if (live) return live.key;
  const upcoming = sections.find((section) => section.matches.some((match) => match.status === "scheduled" && new Date(match.date) >= new Date()));
  if (upcoming) return upcoming.key;
  const scheduled = sections.find((section) => section.matches.some((match) => match.status === "scheduled"));
  return scheduled?.key || sections[sections.length - 1].key;
}

function currentFilters() { return { stage: refs.stageFilter.value, group: refs.groupFilter.value, teamId: refs.teamFilter.value, status: refs.statusFilter.value }; }
function selectedGroup() { return state.tournament.groups.find((group) => group.name === state.selectedGroup) || state.tournament.groups[0]; }
function selectedMatch() { return state.tournament.matches.find((match) => match.id === state.selectedMatchId); }
function setOptions(select, values, allLabel, labeler = (value) => value) { const current = select.value; select.innerHTML = `<option value="">${allLabel}</option>` + values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(labeler(value))}</option>`).join(""); if (values.includes(current)) select.value = current; }
function unique(values) { return [...new Set(values)].sort((a, b) => a.localeCompare(b, "en", { numeric: true })); }
function statusText(status) { return ({ completed: "已完赛", live: "进行中", scheduled: "待赛" })[status] || status; }
function sourceLabel(source) { return ({ official: "FIFA 官方实时", cache: "1 小时缓存", "stale-cache": "旧缓存降级" })[source] || source; }
function stageLabel(stage) { return ({ "First Stage": "小组赛", "Round of 32": "32 强", "Round of 16": "16 强", "Quarter-final": "四分之一决赛", "Semi-final": "半决赛", "Play-off for third place": "季军赛", Final: "决赛" })[stage] || stage || "赛事"; }
function shortStageLabel(stage) { return ({ "Round of 32": "32 强", "Round of 16": "16 强", "Quarter-final": "八强", "Semi-final": "四强", "Play-off for third place": "季军赛", Final: "决赛" })[stage] || stageLabel(stage); }
function groupLabel(group) { return String(group || "").replace("Group ", ""); }
function teamColor(team, side) {
  const known = { MEX: "#087653", RSA: "#173d67", BRA: "#0a704c", JPN: "#b63c4c", ARG: "#2f6d9d", FRA: "#25468b", GER: "#342f34", ESP: "#a62f3b", USA: "#284e87", CAN: "#a7313e", ENG: "#8d2e3d", POR: "#176b50" };
  if (known[team?.code]) return known[team.code];
  const seed = String(team?.country || team?.name || side).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return `hsl(${(seed * 37 + side * 83) % 360} 46% 29%)`;
}
function setSourceState(kind, label) { refs.sourceBadge.className = `source-badge ${kind}`; refs.sourceBadge.textContent = label; }
function flag(team) { return team?.country ? `<img src="https://api.fifa.com/api/v3/picture/flags-sq-1/${escapeHtml(team.country)}" alt="" />` : '<span class="flag-placeholder"></span>'; }
function teamMarkup(team) { return `<span class="team-name">${flag(team)}${escapeHtml(team.name)}</span>`; }
function barRow(label, value, max, suffix) { return `<div class="bar-row"><div class="bar-label"><span>${escapeHtml(label)}</span><span>${value} ${suffix}</span></div><div class="bar-track"><div class="bar-fill" style="width:${Math.max(4, Math.round((value / max) * 100))}%"></div></div></div>`; }
function renderTeamBlock(container, team, away) { const image = flag(team); container.innerHTML = away ? `<div><strong>${escapeHtml(team.name)}</strong><span>${escapeHtml(team.code || "")}</span></div>${image}` : `${image}<div><strong>${escapeHtml(team.name)}</strong><span>${escapeHtml(team.code || "")}</span></div>`; }
function metric(stats, key, percent, distance) { let value = Number(stats?.[key] || 0); if (percent) value = Math.round(value * 100); if (distance) value = Math.round((value / 1000) * 10) / 10; return percent ? `${value}%` : Number.isInteger(value) ? value : Math.round(value * 100) / 100; }
function signed(value) { return value > 0 ? `+${value}` : String(value); }
function positionText(position) { return ["门将", "后卫", "中场", "前锋"][position] || "球员"; }
function initials(name) { return String(name).split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
function shortTeamName(name) { return String(name || "---").replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "---"; }
function outcome(home, away) { return home > away ? "H" : home < away ? "A" : "D"; }
function taskRow(label, value) { return `<div class="task-row"><strong>${label}</strong><span>${escapeHtml(value)}</span></div>`; }
function formatDateTime(value) { if (!value) return "--"; return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value)); }
function formatTime(value) { return new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value)); }
function keyDate(key) { return new Date(`${key}T12:00:00`); }
function formatDateRail(key) { return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(keyDate(key)); }
function formatWeekday(key) { return new Intl.DateTimeFormat("zh-CN", { weekday: "long" }).format(keyDate(key)); }
function formatFullDate(key) { return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" }).format(keyDate(key)); }
function loadPredictions() { try { return JSON.parse(localStorage.getItem("worldcupops-predictions") || "{}"); } catch { return {}; } }
function loadTaskProgress() { try { return JSON.parse(localStorage.getItem("worldcupops-task-progress") || "{}"); } catch { return {}; } }
async function fetchJson(url, options = {}) { const response = await fetch(url, options); if (!response.ok) { const body = await response.text(); throw new Error(Ops.formatHttpError(response.status, response.headers.get("content-type"), body)); } return response.json(); }
function downloadText(filename, text) { const blob = new Blob([text], { type: "text/markdown;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url); }
function escapeHtml(value) { return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }

$("#refreshData").addEventListener("click", () => loadTournament(true));
$("#resetFilters").addEventListener("click", () => { refs.stageFilter.value = refs.groupFilter.value = refs.teamFilter.value = refs.statusFilter.value = ""; renderScheduleSections(); });
[refs.stageFilter, refs.groupFilter, refs.teamFilter, refs.statusFilter].forEach((select) => select.addEventListener("change", renderScheduleSections));
refs.groupTabs.addEventListener("click", (event) => { const button = event.target.closest("[data-group-tab]"); if (!button) return; state.selectedGroup = button.dataset.groupTab; renderGroupTabs(); renderStandings(); renderGroupMatches(); });
refs.knockoutRoundTabs.addEventListener("click", selectKnockoutStage);
refs.knockoutStageSummary.addEventListener("click", selectKnockoutStage);
refs.scheduleDateRail.addEventListener("click", (event) => { const button = event.target.closest("[data-date-key]"); if (!button) return; state.selectedDateKey = button.dataset.dateKey; renderScheduleSections(); requestAnimationFrame(revealSelectedDate); });
refs.thirdPlaceToggle.addEventListener("click", toggleThirdPlace);
refs.refreshMatch.addEventListener("click", () => state.selectedMatchId && loadMatchDetail(state.selectedMatchId, true));
$("#savePrediction").addEventListener("click", savePrediction);
refs.taskControls.addEventListener("click", (event) => { const button = event.target.closest("[data-task]"); if (!button) return; state.taskId = button.dataset.task; renderTaskControls(); renderTaskPack(); });
refs.taskPath.addEventListener("click", (event) => { const step = event.target.closest("[data-task-step]"); if (!step) return; toggleTaskStep(Number(step.dataset.taskStep)); });
refs.verifyList.addEventListener("change", (event) => {
  const input = event.target.closest("[data-verify-index]");
  if (!input) return;
  const progress = progressForTask();
  const index = Number(input.dataset.verifyIndex);
  progress.checks = input.checked ? [...new Set([...progress.checks, index])].sort((a, b) => a - b) : progress.checks.filter((item) => item !== index);
  persistTaskProgress();
});
refs.failureInput.addEventListener("input", renderDebugPrompt);
$("#exportPack").addEventListener("click", exportTaskPack);
refs.openTeachingLab.addEventListener("click", () => setTeachingLab(true));
refs.closeTeachingLab.addEventListener("click", () => setTeachingLab(false));
refs.drawerBackdrop.addEventListener("click", () => setTeachingLab(false));
refs.homeHeroPlayer.addEventListener("error", () => showHeroFlag("home"));
refs.awayHeroPlayer.addEventListener("error", () => showHeroFlag("away"));
refs.spotlightPrev.addEventListener("click", () => moveSpotlight(-1));
refs.spotlightNext.addEventListener("click", () => moveSpotlight(1));
refs.spotlightRail.addEventListener("click", (event) => {
  const button = event.target.closest("[data-spotlight-match]");
  if (button) selectSpotlightMatch(button.dataset.spotlightMatch);
});

document.addEventListener("click", (event) => {
  const copyButton = event.target.closest("[data-copy-target]");
  if (copyButton) copyPrompt(copyButton.dataset.copyTarget);

  const nav = event.target.closest("[data-view-target], [data-go-view]");
  if (nav) setActiveView(nav.dataset.viewTarget || nav.dataset.goView);

  const group = event.target.closest("[data-overview-group]");
  if (group) {
    state.selectedGroup = group.dataset.overviewGroup;
    renderGroupTabs();
    renderStandings();
    renderGroupMatches();
    setActiveView("groups");
  }

  const match = event.target.closest("[data-match-id]");
  if (match) {
    setActiveView("data");
    loadMatchDetail(match.dataset.matchId, false);
  }
});

document.addEventListener("keydown", (event) => { if (event.key === "Escape" && refs.teachingLabDrawer.classList.contains("open")) setTeachingLab(false); });

function selectKnockoutStage(event) {
  const button = event.target.closest("[data-knockout-stage], [data-round-select]");
  if (!button) return;
  state.selectedKnockoutStage = button.dataset.knockoutStage || button.dataset.roundSelect;
  renderKnockout();
}

async function copyPrompt(targetId) {
  const target = document.getElementById(targetId);
  if (!target) return;
  try {
    await navigator.clipboard.writeText(target.textContent);
    refs.copyStatus.textContent = "已复制";
  } catch {
    refs.copyStatus.textContent = "复制失败，请手动选择文本";
  }
  window.setTimeout(() => { refs.copyStatus.textContent = ""; }, 1800);
}

function showHeroFlag(side) {
  const match = state.tournament?.matches?.find((item) => item.id === state.spotlightMatchId);
  if (!match) return;
  const image = side === "home" ? refs.homeHeroPlayer : refs.awayHeroPlayer;
  const flagContainer = side === "home" ? refs.homeHeroFlag : refs.awayHeroFlag;
  image.hidden = true;
  flagContainer.hidden = false;
  flagContainer.innerHTML = flag(side === "home" ? match.home : match.away);
}

loadTournament(false);
