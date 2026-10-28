---
title: 分支账
covers:
  - src/commands/branch.ts
  - src/core/branch.ts
status: living
---

# 分支账

> 主馆与分馆的唯一登记面。每条 git 分支一行：分支名 / 创建日期 / 目的 / 状态（active → merged | abandoned）/ 与主馆差异摘要 / 关联（功能号、.plan 载体、基线快照 ID）。
> 蒸馏或开发新建分支时先登记（`doclib branch register`）；合并回主馆后翻 merged 保留史；废弃翻 abandoned。分馆工作期的 progress 条目带 `[branch:分支名]` 标注。
> 图书馆入 gitignore 的项目（单馆）同样用本账登记基线归属（快照 git 字段由 snapshot 自动记录）。

| 分支 | 创建日期 | 目的 | 状态 | 差异摘要 | 关联 |
| --- | --- | --- | --- | --- | --- |
| main | 2026-10-17 | 主馆：图书馆唯一事实源与 CLI 主线 | active | 主线全量（v0.10.0 起 #13 git 感知基线、#44 分支账与主分馆管理） | #44 snap-095 |
