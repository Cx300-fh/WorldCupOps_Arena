(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PlayerDuel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const METRICS = [
    ["goals", "进球", 6], ["assists", "助攻", 5], ["passes", "传球", 350],
    ["distance", "跑动 km", 60], ["speed", "速度 km/h", 38], ["xg", "xG", 5],
  ];

  function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
  function normalizeMetric(value, max) { return Math.max(0, Math.min(100, Math.round((number(value) / max) * 100))); }
  function comparePlayers(left, right) {
    if (!left || !right) throw new Error("Two players are required");
    if (left.id === right.id) throw new Error("Choose two different players");
    const metrics = METRICS.map(([key, label, max]) => {
      const leftValue = number(left.stats && left.stats[key]);
      const rightValue = number(right.stats && right.stats[key]);
      return {
        key, label, leftValue, rightValue,
        leftScore: normalizeMetric(leftValue, max), rightScore: normalizeMetric(rightValue, max),
        leader: leftValue === rightValue ? "tie" : leftValue > rightValue ? "left" : "right",
      };
    });
    return { left, right, metrics };
  }
  return { METRICS, normalizeMetric, comparePlayers };
});
