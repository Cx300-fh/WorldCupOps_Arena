const leftSelect = document.querySelector("#left");
const rightSelect = document.querySelector("#right");
const arena = document.querySelector("#arena");
const status = document.querySelector("#status");
let players = [];

fetch("../fixtures/players.json").then((response) => response.json()).then((data) => {
  players = data;
  const options = players.map((player) => `<option value="${player.id}">${player.name} · ${player.team}</option>`).join("");
  leftSelect.innerHTML = rightSelect.innerHTML = options;
  rightSelect.selectedIndex = 1;
  render();
}).catch((error) => { status.textContent = `数据读取失败：${error.message}`; });

[leftSelect, rightSelect].forEach((select) => select.addEventListener("change", render));
function render() {
  try {
    const result = PlayerDuel.comparePlayers(players.find((p) => p.id === leftSelect.value), players.find((p) => p.id === rightSelect.value));
    arena.innerHTML = `${playerCard(result.left, "left")}<div class="metrics">${result.metrics.map(metricRow).join("")}</div>${playerCard(result.right, "right")}`;
    status.textContent = `统计来自 FIFA 官方单场缓存汇总 · ${players.length} 名球员可选`;
  } catch (error) { arena.innerHTML = ""; status.textContent = error.message; }
}
function playerCard(player, side) {
  return `<article class="player ${side}"><div class="portrait"><img src="${player.picture}" alt="${player.name}" onerror="this.hidden=true" /><b>${player.number ?? "--"}</b></div><p>${player.country}</p><h2>${player.name}</h2><span>${player.team}</span></article>`;
}
function metricRow(metric) {
  return `<div class="metric"><div><strong class="${metric.leader === "left" ? "leader" : ""}">${metric.leftValue}</strong><span>${metric.label}</span><strong class="${metric.leader === "right" ? "leader" : ""}">${metric.rightValue}</strong></div><div class="track"><i style="width:${metric.leftScore}%"></i><i style="width:${metric.rightScore}%"></i></div></div>`;
}
