const fs = require("fs/promises");
const path = require("path");
const [lab, state] = process.argv.slice(2);
const labs = new Set(["player-duel", "match-poster", "knockout-path"]);
const states = new Set(["starter", "solution"]);
if (!labs.has(lab) || !states.has(state)) {
  console.error("Usage: set-state.js <player-duel|match-poster|knockout-path> <starter|solution>");
  process.exit(1);
}
const root = path.resolve(__dirname, "..");
const source = path.join(root, lab, state);
const target = path.join(root, lab, "workspace");
fs.mkdir(target, { recursive: true })
  .then(() => fs.readdir(source))
  .then((files) => Promise.all(files.map((file) => fs.copyFile(path.join(source, file), path.join(target, file)))))
  .then(() => console.log(`${lab}: ${state} applied to workspace`))
  .catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
