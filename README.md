# WorldCupOps Arena

本作是以 FIFA 2026 美加墨世界杯为主题的实践系统。
项目通过本地 Node 服务同步 FIFA 官方网页实际使用的公开 JSON 接口，展示完整赛程、小组赛组积分榜、单场阵容、比赛事件和球员统计等可视化内容

## 数据与内容

- 104 场完整赛程
- 48 支球队、12 个小组
- 小组积分榜和最佳第三名排名
- 官方比分、球场、城市、比赛状态
- 单场首发/替补阵容和比赛事件
- 球员分钟、进球、助攻、传球、跑动距离、最高速度和 xG
- 浏览器本地竞猜
- 面向真实数据工程的 Vibe Coding 任务包
- 可切换 104 场比赛的动态球员主视觉
- 三段式控球率数据，显示比例但不显示中间状态标签
- 可持久化进度的五步任务路径

## 启动

进入克隆或解压后的项目目录：

```bash
cd WorldCupOps_Arena
npm start
```

默认打开 `http://127.0.0.1:5175`.端口被占用时可以指定其他端口，例如指定 5176 端口：

```bash
PORT=5176 npm start
```

请勿使用 `python -m http.server` 启动本项目；静态服务器无法提供 `/api/*` 路由。即使误用静态服务器，页面也会自动读取内置快照并给出简短提示。

## 刷新策略

- 比赛和积分榜默认每 1 小时刷新。
- 页面右上角支持手动刷新。
- 单场球员详情按需抓取并缓存。
- 进行中比赛详情缓存 5 分钟。
- 待赛比赛详情缓存 1 小时。
- 已完赛详情缓存 24 小时。
- 官方请求失败时继续使用最后一次成功 JSON 快照。

修改刷新周期：

```bash
FIFA_REFRESH_MS=1800000 node server/server.js
```

上例设置为 30 分钟。

## 手动同步

```bash
npm run sync
```

同步结果写入：

```text
data/fifa-2026.json
```

单场详情缓存在：

```text
data/matches/<match-id>.json
```

## 本地 API

- `GET /api/status`：服务状态和刷新周期
- `GET /api/tournament`：赛事快照
- `POST /api/refresh`：强制刷新赛事数据
- `GET /api/match/:id`：单场阵容、事件、球队和球员统计
- `GET /api/match/:id?refresh=1`：强制刷新单场数据

## FIFA 数据来源

系统读取 FIFA 官方赛事页实际使用的接口：

- `api.fifa.com/api/v3/calendar/matches`
- `api.fifa.com/api/v3/calendar/.../standing`
- `api.fifa.com/api/v3/live/football/...`
- `api.fifa.com/api/v3/timelines/...`
- `fdh-api.fifa.com/v1/stats/match/.../players.json`
- `fdh-api.fifa.com/v1/stats/match/.../teams.json`

这些接口由 FIFA 官方网页使用，但不是带稳定性承诺的公开开发者 API，因此项目保留了标准化层和缓存降级。

## 任务路径

- 接入 FIFA 官方 104 场赛程
- 实现 1 小时缓存降级
- 关联阵容与球员统计
- 修复小组排名 Tie-breaker
- 修复预测后图表同步
- 增加竞猜输入校验
- 开发球星对决台
- 开发比赛海报生成器
- 开发淘汰赛路径模拟器

## Skill

可复用 skill 位于：

```text
skills/sync-fifa-live-data/
```

它包含：

- `SKILL.md`：官方数据同步与缓存工作流
- `scripts/sync_fifa_data.mjs`：独立赛事/单场同步脚本
- `references/fifa-api-schema.md`：接口与字段参考
- `agents/openai.yaml`：Codex UI 元数据

## 测试

```bash
npm test
```

测试覆盖赛事算法、三段控球状态、FIFA 响应标准化、缓存降级、单场球员关联、本地服务 API 和关键 UI 结构。

## 现场实验包

缓存降级实验完全离线运行，不依赖 FIFA 接口：

```bash
npm run lab:reset
npm run lab:test
```

修复目标仅为 `labs/cache-fallback/workspace/cache-policy.js`。参考答案可通过 `npm run lab:solution` 恢复，完整流程见 `labs/cache-fallback/README.md`。

另外提供三个离线功能开发项目：

| 项目 | 重置 | 测试 | 参考答案 |
|---|---|---|---|
| 球星对决台 | `npm run lab:duel:reset` | `npm run lab:duel:test` | `npm run lab:duel:solution` |
| 比赛海报生成器 | `npm run lab:poster:reset` | `npm run lab:poster:test` | `npm run lab:poster:solution` |
| 淘汰赛路径模拟器 | `npm run lab:bracket:reset` | `npm run lab:bracket:test` | `npm run lab:bracket:solution` |

运行 `npm start` 后，可以从网页实验室打开各自的 workspace 预览。所有 fixtures 均保存在项目内，不需要访问 FIFA 接口。

球星对决和淘汰赛实验的数据可以从当前官方缓存重新生成：

```bash
npm run lab:data:build
```

球员统计由 `data/matches/` 中的官方单场缓存按 `IdPlayer` 汇总，32 强对阵来自 `data/fifa-2026.json` 的 `Round of 32` 赛程。球员头像和国旗保存在各实验的本地 `assets/` 目录。

## 图像与动效

- 首屏本地兜底人物位于 `assets/players/`，来源为 FIFA Digital Hub 透明 PNG。
- 比赛详情提供阵容图像时，首屏优先展示对应球队的队长或首发球员。
- 图片不可用时自动回退到球队旗帜。
- 视差、数字滚动、比赛切换和滚动入场动效均支持 `prefers-reduced-motion`。
- FIFA 的 Possession Control 包含三个比例，页面保留三段数值并保证可见整数合计为 100，中间状态不显示文字标签。

## 数据说明

官方赛果、阵容和统计归 FIFA 数据源所有。用户竞猜和任务派生指标与官方数据分开存储，不代表 FIFA 官方预测或评价。
