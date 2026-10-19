# AGENTS.md — DocLib 自身

面向在本仓库工作的 agent。本文件与 `CLAUDE.md` 同步维护，实时同步原则同样适用于这两个引导文件本身。

## 命令

- 构建: `npm run build`（tsc + `scripts/copy-assets.js`，把 assets/templates、assets/guides、skills 拷入 dist/assets）
- 类型检查: `npm run typecheck`
- 测试: `npm test`（构建 + node:test 跑 dist/core 下指定 *.test.js）
- 本地试 CLI: `node dist/cli.js <命令>`；当前版本 0.2.0（structure v2）

## 结构

- `src/cli.ts` — 入口，分发六命令，统一捕获 `DoclibError`
- `src/commands/` — 每命令一文件，返回 `{ text, json }`：init / plan / diff / snapshot / status / verify
- `src/core/` — 纯逻辑：
  - `fsutil.ts` 遍历/hash/树渲染（ignore：内置默认 + .gitignore + .doclibignore，含 `.plan/`）
  - `frontmatter.ts` frontmatter 解析（covers 锚点，支持 block/inline 数组）
  - `state.ts` 状态模型 v2（快照链、漂移、structureVersion/agents 兼容归一化）
  - `detect.ts` 语言/框架/入口探测
  - `mapping.ts` covers 索引与路径→文档映射
  - `version.ts` CLI 版本与结构版本（引导戳数据源）
  - `assets.ts` 资产定位/拷贝/渲染
  - `agents.ts` agent 适配表（claude/opencode/cursor/generic）
  - `prompts.ts` TTY 交互问卷（非 TTY 降级）
  - `guides.ts` 引导渲染/版本戳/覆盖策略（有戳更新、无戳跳过）
- `assets/` — 模板资产：`templates/library/`（12 卷基线 22 文件）、`guides/`（light/full）；build 时经 copy-assets 连同 `skills/` 拷入 `dist/assets/`
- `skills/` — agent 操作手册源（三核心已实现，七新增待建）；与 CLI 行为必须同步
- `docs/` — `PRD.md`（需求事实源）、`DESIGN.md`（架构）
- `doclib/` — 本仓库自己的图书馆（12 卷）；`.plan/<日期>/` — 开发规划；`.doclib/` — 簿记

## 约定

- ESM（导入带 `.js` 后缀）；TypeScript strict + noUncheckedIndexedAccess
- 运行时依赖仅 `ignore`；源码不写注释；错误一律抛 `DoclibError`
- 术语：图书馆=doclib/、簿记=.doclib/、任务书=.doclib/tasks/、基线=snapshot、漂移=drift、锚点=covers

## 验证

改动后：`npm run typecheck && npm test`；涉及命令行为时在临时目录冒烟：
init --agents claude,opencode → plan → snapshot → 改文件 → diff → plan → verify → plan --rebuild。

## DocLib 工作流（本仓库已启用，身先士卒）

### 实时同步规则（最高优先级，12 卷一视同仁）

开发中凡触及图书馆任一卷知识的改动，**当场更新入馆，不等 diff、不等会话结束**：

| 改动类型 | 必须同步 |
| --- | --- |
| 修 bug / 踩坑 / 解决办法 | `doclib/95-lessons/lessons.md`（现象/根因/解决/规避） |
| 新功能 / 行为变更 / 新命令 | `doclib/30-features/`（规格 + 验收标准）+ feature-map 状态 |
| 模块增删 / 职责变化 | `doclib/20-modules/_index.md` |
| 架构 / 数据模型 / 数据流 | `doclib/10-architecture/` |
| 依赖增删换 | `doclib/10-architecture/dependencies.md` |
| 数据库迁移 / Schema 变更 | `doclib/10-architecture/migrations.md`（先取号、后登记账本）+ `data-model.md` |
| 新设计决策 | `doclib/10-architecture/decisions.md`（ADR） |
| 测试变化 | `doclib/50-testing/testing.md` |
| 构建 / lint / CI / 环境变量 | `doclib/60-config/config.md` |
| 部署 / 发布 | `doclib/70-deploy/deploy.md` |
| 界面 | `doclib/80-design/`（不适用须显式声明） |
| 接口参考 | `doclib/90-reference/` |
| 任何进度变化 | `doclib/00-overview/feature-map.md` + `progress.md` |

### 会话纪律

1. 开始：`node dist/cli.js status`
2. 结束前自检三问：**改动归档了吗？feature-map 状态推进了吗？progress.md 补记了吗？**

### 开发流程（.plan 双锚点）

1. `.plan/<日期>/<名称>.md` 规划，七栏目：目的与效果、问题点、研究结果、代码实际情况、设计方案、备选方案、实施清单
2. 规划完成 → feature-map 登记 planned（锚点一）
3. 开发中按实时同步规则随时入馆
4. 开发完成 → 长期价值沉淀 ADR/规格/参考卷、状态 → implemented、progress.md 补记（锚点二）
5. `node dist/cli.js snapshot --note "<主题>"` 固化基线

### 纪律底线

- 每篇文档 frontmatter `covers` 指向真实代码路径，随改动保持准确
- 文档写行为/契约/意图/验收标准；除 ≤10 行示意片段外禁止搬运源码
- 兜底：`diff` 揪漂移、`reconcile` 对账重建——不依赖兜底

### skills 触发速查

| Skill | 状态 | 触发 |
| --- | --- | --- |
| doclib-build | 已实现 | BUILD 任务书（蒸馏建馆） |
| doclib-update | 已实现 | UPDATE 任务书（增量更新） |
| doclib-rebuild | 已实现 | REBUILD 任务书（从零复原） |
| doclib-dev / bootstrap / resume / reconcile / audit / accept / setup | 待建（feature-map #6） | 各自任务书/场景 |

### CLI 速查

`status` 概览｜`diff` 漂移+映射｜`plan` 任务书（BUILD/UPDATE/REBUILD，--rebuild）｜`snapshot` 基线（--note）｜`verify` 覆盖度+引导版本｜`init` 骨架落位（--agents claude,opencode,cursor,generic；--guide light|none；--force）

### 进度指针

需求事实源 `docs/PRD.md`（v0.13）｜架构 `docs/DESIGN.md`（v2）｜功能进度 `doclib/00-overview/feature-map.md`｜时间线 `doclib/00-overview/progress.md`
