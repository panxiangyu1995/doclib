---
title: 功能进度总账
covers:
  - src/
  - skills/
  - docs/
status: living
---

# 功能进度总账（feature-map）

> 全馆之锚与进度事实源。状态只认本表：`planned / in-progress / implemented / retired`。时间线视图见 [progress.md](progress.md)。

| # | 功能 | 一句话描述 | 对应文档 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | CLI 基础命令集 | init/plan/diff/snapshot/status/verify 六命令与核心纯逻辑 | 20-modules/（骨架） | implemented |
| 2 | 三核心 skills | build/update/rebuild 操作手册 | skills/ | implemented |
| 3 | 需求与架构文档体系 | PRD v0.13 + DESIGN v2 | docs/ | implemented |
| 4 | 图书馆启用（dogfooding） | 本仓库 12 卷图书馆 + 引导文件 + 进度账 | doclib/ | implemented |
| 5 | 12 卷基线模板 | assets/templates/library 22 文件 + copy-assets 构建链 | .plan/2026-10-17/phase1-skeleton-v2.md | implemented |
| 6 | 十 skill 体系 | +setup/bootstrap/resume/dev/reconcile/audit/accept | skills/（待建） | planned |
| 7 | npx 发布与 agent 适配 | npm 包 + init 交互/参数 + 适配表 + setup 命令 | 70-deploy/ | planned |
| 8 | BOOTSTRAP/RESUME 任务书 | plan 新增两种任务书类型 | 30-features/（待写） | planned |
| 9 | .plan 检测与双锚点提醒 | .plan 忽略 + status/plan 时间感知提醒 | 30-features/（待写） | planned |
| 10 | 进度对账与 reconcile | 对账报告 + reconcile 重建命令 + core/ledger.ts | 30-features/（待写） | planned |
| 11 | 引导文件模板与版本戳 | 轻量/完整两档 + 版本戳 + status/verify 检测 | .plan/2026-10-17/phase1-skeleton-v2.md | in-progress |
| 12 | 类别完备性检查 | verify 对照 12 卷基线报告缺失类别 | 30-features/（待写） | planned |
| 13 | git 感知基线 | 以 commit 为锚点的快照 | — | planned |
| 14 | watch 模式与多图书馆 | 文件监听自动提醒；多馆管理 | — | planned |
