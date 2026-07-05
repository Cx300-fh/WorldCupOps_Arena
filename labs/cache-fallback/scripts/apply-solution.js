const fs = require("fs/promises");
const path = require("path");

const root = path.resolve(__dirname, "..");

fs.copyFile(
  path.join(root, "solution", "cache-policy.js"),
  path.join(root, "workspace", "cache-policy.js")
).then(() => {
  console.log("Cache fallback reference solution applied.");
}).catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
