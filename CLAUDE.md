# CLAUDE.md — DocLib 仓库

> 本文件与 `AGENTS.md` 同步维护，内容保持一致；本文件无 doclib 版本戳（本仓库引导为手工维护，属"无戳不覆盖"保护对象）。

DocLib：把任意项目蒸馏成可复原的文档图书馆（系统化规格与验收系统）。本仓库已启用 DocLib 自身（身先士卒）。

## 实时同步规则（最高优先级，12 卷一视同仁）

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

## 会话纪律

1. 开始：`node dist/cli.js status`
2. 结束前自检三问：**改动归档了吗？feature-map 状态推进了吗？progress.md 补记了吗？**

## 开发流程（.plan 双锚点）

1. `.plan/<日期>/<名称>.md` 规划，七栏目：目的与效果、问题点、研究结果、代码实际情况、设计方案、备选方案、实施清单
2. 规划完成 → feature-map 登记 planned（锚点一）
3. 开发中按实时同步规则随时入馆
4. 开发完成 → 长期价值沉淀 ADR/规格/参考卷、状态 → implemented、progress.md 补记（锚点二）
5. `node dist/cli.js snapshot --note "<主题>"` 固化基线

## 纪律底线

- 每篇文档 frontmatter `covers` 指向真实代码路径，随改动保持准确
- 文档写行为/契约/意图/验收标准；除 ≤10 行示意片段外禁止搬运源码
- 兜底：`doclib diff` 揪漂移、`doclib reconcile` 对账重建——不依赖兜底

## 命令与结构速查

- `npm run build`（tsc + copy-assets）/ `npm run typecheck` / `npm test`
- CLI：`node dist/cli.js status / diff / plan / snapshot / verify / init`（详见 AGENTS.md CLI 速查）
- 结构与约定详见 `AGENTS.md`；需求 `docs/PRD.md`；架构 `docs/DESIGN.md`
- 进度：`doclib/00-overview/feature-map.md`（14+ 条目）｜时间线 `doclib/00-overview/progress.md`
