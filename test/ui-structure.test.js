const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "src", "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");

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

test("primary navigation contains the five approved tournament views", () => {
  const labels = ["总览", "小组赛", "淘汰赛", "赛程中心", "数据中心"];
  labels.forEach((label) => assert.match(html, new RegExp(`<button[^>]+data-view-target="[^"]+"[^>]*>${label}</button>`)));
  assert.equal((html.match(/data-view-target=/g) || []).length, 5);
  assert.equal((html.match(/data-view-panel=/g) || []).length, 5);
});

test("group view contains a compact third-place disclosure", () => {
  assert.match(html, /id="thirdPlaceDisclosure"/);
  assert.match(html, /id="thirdPlaceToggle"[^>]+aria-expanded="false"/);
  assert.match(html, /id="thirdPlaceBody"/);
});

test("Vibe Coding lab is available as a global drawer", () => {
  assert.match(html, /id="teachingLabDrawer"/);
  assert.match(html, /id="openTeachingLab"[^>]+aria-controls="teachingLabDrawer"/);
  assert.match(html, /id="closeTeachingLab"/);
});

test("overview uses a full-bleed editorial match hero", () => {
  assert.match(html, /id="faceoffHero"/);
  assert.match(html, /id="heroBackdrop"/);
  assert.match(html, /class="hero-editorial"/);
  assert.match(html, /id="homeHeroPlayer"/);
  assert.match(html, /id="awayHeroPlayer"/);
  assert.match(html, /id="spotlightPrev"/);
  assert.match(html, /id="spotlightNext"/);
  assert.match(html, /id="spotlightRail"/);
  assert.match(html, /id="featuredAction"/);
  assert.doesNotMatch(html, />[^<]*教学[^<]*</);
});

test("application wires view navigation and layered tournament rendering", () => {
  assert.match(app, /function setActiveView\(/);
  assert.match(app, /Ops\.groupMatchesByDate\(/);
  assert.match(app, /Ops\.groupMatchesByStage\(/);
  assert.match(app, /function renderScheduleSections\(/);
  assert.match(app, /function renderKnockout\(/);
  assert.match(app, /function revealSelectedDate\(/);
  assert.match(app, /scrollIntoView\(\{ block: "nearest", inline: "center" \}\)/);
});

test("application enriches the hero with safe portraits and motion", () => {
  assert.match(app, /function selectHeroPlayer\(/);
  assert.match(app, /function updateHeroPortraits\(/);
  assert.match(app, /function selectSpotlightMatch\(/);
  assert.match(app, /Ops\.moveSpotlight\(/);
  assert.match(app, /data-spotlight-match/);
  assert.match(app, /function initializeRevealAnimations\(/);
  assert.match(app, /prefers-reduced-motion/);
});

test("possession keeps three percentages without a visible contest label", () => {
  assert.match(app, /<strong>控球率<\/strong>/);
  assert.doesNotMatch(app, /<span>争夺中<\/span>/);
  assert.match(app, /possession\.contest/);
});

test("task lab exposes a guided path with persistent progress", () => {
  assert.match(html, /id="taskPath"/);
  assert.match(html, /id="taskMeta"/);
  assert.match(html, /id="taskHint"/);
  assert.match(app, /function renderTaskPath\(/);
  assert.match(app, /worldcupops-task-progress/);
  assert.match(app, /Ops\.splitPossessionControl\(/);
  assert.match(html, /id="taskPreview"/);
  assert.match(app, /taskPath\.previewPath/);
});

test("disclosures keep their accessible expanded state in sync", () => {
  assert.match(app, /thirdPlaceToggle\.setAttribute\("aria-expanded"/);
  assert.match(app, /openTeachingLab\.setAttribute\("aria-expanded"/);
  assert.match(app, /teachingLabDrawer\.setAttribute\("aria-hidden"/);
});

test("visual system includes tournament atmosphere and sticky navigation", () => {
  assert.match(css, /body\s*\{[^}]*linear-gradient/s);
  assert.match(css, /\.hero-backdrop\s*\{/);
  assert.match(css, /\.hero-editorial\s*\{/);
  assert.match(css, /\.spotlight-rail\s*\{/);
  assert.match(css, /\.hero-player\s*\{/);
  assert.match(css, /\.tournament-stat-band\s*\{/);
  assert.match(css, /\.possession-segments\s*\{/);
  assert.match(css, /\.task-step\s*\{/);
  assert.match(css, /\.motion-reveal\s*\{/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /\.primary-nav\s*\{[^}]*position:\s*sticky/s);
  assert.match(css, /\.date-rail\s*\{/);
});

test("responsive UI defines drawer states and removes the old match wall", () => {
  assert.match(css, /\.teaching-drawer\.open\s*\{/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /\.primary-nav button\s*\{\s*flex:\s*1 1 20%;\s*min-width:\s*56px;/);
  assert.doesNotMatch(css, /\.match-grid\s*\{/);
});
