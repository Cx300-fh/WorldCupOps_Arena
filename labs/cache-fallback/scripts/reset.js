const fs = require("fs/promises");
const path = require("path");

const root = path.resolve(__dirname, "..");

fs.copyFile(
  path.join(root, "starter", "cache-policy.js"),
  path.join(root, "workspace", "cache-policy.js")
).then(() => {
  console.log("Cache fallback lab reset: workspace now contains the starter bug.");
}).catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
