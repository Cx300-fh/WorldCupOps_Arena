(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PlayerDuel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function normalizeMetric() { throw new Error("Implement normalizeMetric"); }
  function comparePlayers() { throw new Error("Implement comparePlayers"); }
  return { normalizeMetric, comparePlayers };
});
