# 缓存降级实验包

## 任务

修复 `workspace/cache-policy.js`：当缓存已经过期且 FIFA 请求失败时，返回最后一次有效快照，并且不得覆盖原缓存。

只允许修改：

```text
labs/cache-fallback/workspace/cache-policy.js
```

## 现场演示

```bash
npm run lab:reset
npm run lab:test
```

首次测试应出现一个预期失败：`simulated FIFA timeout`。然后从网页实验室选择“实现 1 小时缓存降级”，依次复制 GLM Coding Plan 和 opencode Execute。要求工具先输出计划，再修改 workspace 文件。

修复后运行：

```bash
npm run lab:test
```

三个场景都应通过：

1. 新鲜缓存直接返回 `cache`，不请求官网。
2. 陈旧缓存刷新成功后返回 `official` 并原子更新文件。
3. 官网失败后返回 `stale-cache`，保留旧文件并记录错误。

## 复位与参考答案

```bash
npm run lab:reset
npm run lab:solution
npm run lab:test
```

实验不访问网络，适合在断网或官方接口不可用时运行。
