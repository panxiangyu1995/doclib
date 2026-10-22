---
title: doclib graph 代码知识图谱规格（F15 阶段 2 落地）
covers:
  - src/commands/graph.ts
  - src/core/codegraph/engine.ts
  - src/core/codegraph/draft.ts
  - src/cli.ts
  - src/commands/init.ts
  - src/commands/plan.ts
  - src/core/fsutil.ts
  - src/core/orphan.ts
  - vendor/codegraph/
  - FORK-NOTES.md
  - tsconfig.vendor.json
  - scripts/copy-assets.js
status: living
---

# doclib graph · 代码知识图谱（F15 阶段 2 落地）

## 目的

大 repo 场景下 agent 无法也不应读取全部代码（token 限制）。本功能将 colbymchenry/codegraph（v1.6.2，74.6k★，MIT）以 **git subtree 克隆 + 二次开发**方式集成（`vendor/codegraph/`，非 npm 依赖直调——API 主权/telemetry 主权/深度耦合自由），作为图书馆的**语义知识图谱加速器**：实体候选发现（对账）、影响面分析、符号导航省 token。服务三阶段战略 P1（面穷举兜底）→ P2（深挖导航）→ P3（升华挖掘）。

**定位铁律**：图书馆是唯一事实源与唯一产品；`.codegraph/` 是**可再生内部缓存**（与 `.doclib/` 簿记同级，删了可重建）。图输出**永远只是候选**，agent 裁决（三铁律之一，机器只出候选不代写）。

## 行为

### 命令族

| 命令 | 语义 | 前置 | 输出 | 错误/降级 |
| --- | --- | --- | --- | --- |
| `doclib init --graph`（交互第 4 问，回车=否） | init 时同步建图 | Node >= 22.5 | `- 知识图谱: .codegraph/（N 文件/M 符号/K 边）` | 引擎不可用/索引失败→告警行，**init 仍退出 0**；未启用→提示 `doclib graph index` 可随时启用 |
| `doclib graph index [--force]` | 建图/增量同步/重建 | Node 门禁 | 摘要（文件/符号/边/路由/语言/框架/耗时/索引状态）；`--json` | 已有索引无 `--force`→open+catch-up sync；`--force`→`CodeGraph.recreate` 全量重建；失败→DoclibError |
| `doclib graph status [--json]` | 只读状态 | 索引存在 | state（complete/partial/failed）/计数/语言覆盖/路由数/框架/lastIndexedAt/stale | 未初始化→提示建图；不可读→提示 `--force` 重建 |
| `doclib graph draft [--force]` | 图→登记簿候选草稿 | 索引存在 | 写 `.doclib/drafts/` 四册 + 计数摘要 | 草稿已存在且无 `--force`→拒绝（防覆盖 agent 裁决进度） |
| `doclib graph explore <query>` | 符号导航/上下文查询 | 索引存在 | `buildContext(query, {format:'markdown'})` 直出 stdout（agent 消费面） | 缺 query→用法错误；open 前自动 catch-up sync |

### 草稿导出（机器候选管道）

`doclib graph draft` 产四册至 `.doclib/drafts/`（簿记区，天然不入快照），格式遵循 Q26/Q34：

| 文件 | 数据源 | 图书馆归宿 | 预填要素 |
| --- | --- | --- | --- |
| `routes.md` | route 节点 + references/calls 边 → handler 绑定（17 框架感知） | 80-design · routes 册 | 标识 `ROUTE-NNN`/covers（file:line 双端）/status: active |
| `modules.md` | `getModuleAggregation`（顶层目录聚合，declared/uncertain 置信计数） | 20-modules | 链接表 + 职责叙述 TODO(agent) |
| `dependencies.md` | `getFileDependencyPairs`(0.5) + `getTopDependedOn`(20) | 10-architecture · dependencies | 依赖对表 + fan-in 表 + 设计意图 TODO(agent) |
| `unused.md` | `getUnreferencedNodes`（排除 generated） | 登记簿状态机 unused 候选 | **仅线索非结论**：导出/动态调用/反射不计入引用，agent 必须逐条核实 |

每份文件头固定警示 `<!-- doclib:graph-draft · provenance: codegraph-draft · 机器候选草稿，禁止直接入馆…-->`；条目正文含 `契约细节: TODO(agent)` + `时间线: TODO(agent)`。

### 架构与降级

- **vendor CJS 岛**：`vendor/codegraph/src/` 核心子集经 `tsconfig.vendor.json` 编译为 CommonJS 至 `dist/vendor/`（含 `package.json {"type":"commonjs"}` 作用域标记，防根 ESM 声明污染）；主工程 ESM 经 `src/core/codegraph/engine.ts` 的 `createRequire` 单点桥接入，自有最小类型面，类型零耦合
- **编译面裁剪**：telemetry/mcp（主模块）/installer/bin/upgrade/ui-server/ui 不进构建——**telemetry 物理隔离不触网**；`mcp/version.ts` 与 `mcp/dynamic-boundaries.ts` 为无遥测叶子模块纳入编译面
- **fork 就地编辑仅一处**（FORK-NOTES F-1~F-3 登记处）：`index.ts` 移除 `MCPServer` re-export；v1.6.2 无 `import.meta`（F-2 无需）；Q28 语言子集 13 文法全部 in-tree（F-3 无需补拷）
- **无 daemon**：不做 watcher/后台进程，所有查询走 open+catch-up sync（复用上游连接时对账）
- **优雅降级**（三铁律三）：Node < 22.5 或引擎缺失→graph 全家抛 DoclibError（文案明示"doclib 核心流程不受影响"）；init 不阻塞；skills/任务书候选段按存在性自适应
- **运行时依赖**：ignore + web-tree-sitter + picomatch + jsonc-parser（皆纯 JS 零原生；+3 需 ADR #13 修订"仅依赖 ignore"条款）；wasm 文法随 dist 分发（Q28 口径 13 个）

### 排除与治理适配

- 用户项目：`.codegraph/` 入 `fsutil.DEFAULT_IGNORES`（快照/漂移免疫）+ `orphan.TOOLCHAIN_DIRS`（孤儿豁免，闭集 28 项）
- 本仓库：`vendor/` 以 `doclib ack --dir vendor` 显式登记目录豁免（馆外例外显式化）；subtree 同步纪律见 FORK-NOTES.md
- 引导注入最小面：light/full 各一行速查（≤150 行预算）；详细纪律入 skills（build/dev/rebuild/accept 四份）

## 约束

- 图输出永不直接入馆（铁律一）；agent 逐条裁决回灌
- graph 命令族为可选增强：任何 graph 失败不得阻塞 doclib 核心流程（init/plan/diff/snapshot/status/verify/check/ack/place/hook/reconcile/sync）
- `.doclib/drafts/` 属簿记区：不入快照、不入漂移；草稿被 agent 消费后即为过程产物
- vendored 源码修改必须登记 FORK-NOTES.md（subtree 合并审计锚点）

## 验收标准

| # | Given/When/Then |
| --- | --- |
| AC1 | Given 仓库根 When `npm run build` → Then `dist/vendor/index.js`、`dist/vendor/db/schema.sql`、`dist/vendor/extraction/wasm/`（13 文法）在位且 `dist/vendor/package.json` 为 `{"type":"commonjs"}` |
| AC2 | Given `isNodeCompatible("22.4.9")` / `("22.5.0")` / `("24.15.0")` / `("abc")` → Then false/true/true/false；Node 不满足时 graph 命令抛 DoclibError 且文案含"doclib 核心流程不受影响"，init 同条件退出 0 且输出告警行 |
| AC3 | Given 迷你 TS fixture When `graph index` → Then 计数 >0 且 `graph status --json` 字段完整；再次 index 走"已同步"路径；`--force` 走重建路径 |
| AC4 | When `graph draft` → Then 四文件生成且各含警示头与 `provenance: codegraph-draft`、routes 条目含标识/covers/status 与 TODO(agent)；重复 draft 无 `--force` 被拒 |
| AC5 | Given 存在 `.codegraph/` When `doclib snapshot`/`diff`/`check` → Then `.codegraph/` 不出现在文件账/漂移/孤儿报告 |
| AC6 | When `doclib init --graph` → Then 输出含 `- 知识图谱: .codegraph/` 且图建成；交互问卷含第 4 问 |
| AC7 | Given `.codegraph/` 存在 When `doclib plan` → Then BUILD 任务书含"知识图谱候选"段；不存在则不含 |
| AC8 | When 全量检索 `dist/vendor/` → Then 无 telemetry 端点（`telemetry.getcodegraph.com`）与出网调用路径 |
| AC9 | When `npm run typecheck && npm test` → Then 全绿无回归 |
| AC10 | When 清洁临时目录走 init --graph → index → status → draft → plan → snapshot → explore 全流程 → Then 每步符合上表预期 |
