---
title: 开发工作流
covers: []
status: living
---

# 开发工作流

> DocLib 文档驱动开发的日常循环：规划双锚点 → 实时同步 → 会话纪律 → 兜底对账。

## 为什么

图书馆必须"活"：没有工作流约束，文档先于代码腐烂——本项目用三件套保活（北极星原则）。

## 是什么

三件套：双锚点（.plan 规划工作流）、实时同步规则（12 卷一视同仁）、会话纪律与兜底对账。

## 怎么运转

### 双锚点（.plan 规划工作流）

1. **锚点一 · 登记规划**：开发前将规划写入 `.plan/<今日日期>/`（目的与效果、问题点、研究结果、代码实际情况、方案、备选方案、实施清单——格式自定义）；完成后在 feature-map 登记 planned/in-progress 条目
2. **锚点二 · 归档成果**：开发完成后——长期价值内容（决策、研究结果、备选理由）沉淀进图书馆（ADR/规格/参考卷）；更新受影响的正式文档与 covers；feature-map 状态推进；progress.md 补记；`doclib snapshot` 固化基线

### 实时同步规则（12 卷一视同仁）

开发中凡触及任一卷知识的改动，实时更新入馆，不等 diff：
bug 与解决办法→`95-lessons/`；测试→`50-testing/`；配置/lint/CI→`60-config/`；部署→`70-deploy/`；界面→`80-design/`；接口→`90-reference/`；架构决策→`10-architecture/decisions.md`；功能/行为→`30-features/`；依赖变更→`10-architecture/dependencies.md`；**数据库迁移/Schema 变更→`10-architecture/migrations.md`（先取号、后登记账本）与 data-model.md**；进度→feature-map 与 progress.md；**引导文件（CLAUDE.md/AGENTS.md）→规则区由 `doclib sync` 再生，定制区实时维护（新规则/注意事项当场写入）**

### 会话纪律

- 会话开始：`doclib status`（漂移与待办）
- 会话结束自检四问：改动归档了吗？feature-map 状态推进了吗？progress.md 补记了吗？引导文件需要更新吗？
- 兜底：忘记上述任何一步，`doclib diff` / `doclib reconcile` 会把漂移揪出来——但不要依赖兜底
