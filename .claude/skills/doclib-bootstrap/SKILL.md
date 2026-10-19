---
name: doclib-bootstrap
description: 新项目对话式挖掘建馆，文档先行开发验收（DocLib 文档驱动开发三模式之一）。当用户要启动一个全新项目（尚无代码或仅有骨架），希望以图书馆为规格与验收基准从零开发时使用。触发：plan --bootstrap 生成 BOOTSTRAP 任务书后。
---

# doclib-bootstrap · 新项目对话式建馆

## 使命

把"想法/需求"直接蒸馏成图书馆（规格与验收基准），再以图书馆为唯一事实源从零开发——**文档先行，代码后写，逐条验收**。

## 何时使用

- 已运行 `doclib init` 且 `doclib plan --bootstrap` 生成了 BOOTSTRAP 任务书
- 项目尚无代码或仅有空骨架

## 工作流

1. **对话式挖掘**（与用户逐项确认，不臆断）：
   - 项目定位与目标用户；一句话立意
   - 核心功能清单（编号，宁细勿粗）
   - 边界与非目标（明确不做什么）
   - 关键数据流与数据模型草案
   - 技术选型与理由（记录备选项）
2. **填馆顺序**：
   - `00-overview/`：project.md（定位）、glossary.md（术语）、feature-map（全量 planned）、progress.md
   - `10-architecture/`：overview/data-model/data-flow/dependencies（选型决策）/decisions（ADR）
   - `30-features/`：每功能一份规格（行为+边界+错误+**可执行验收标准 Given/When/Then**）
   - `40-guides/`、`60-config/` 等按需；不适用的卷显式声明不适用
   - `INDEX.md` 收录全部
3. **文档先行开发循环**（每功能）：
   - 选功能 → 按规格写代码 → 按 30-features 验收标准逐条自检 → feature-map 推 implemented → progress.md 补记
   - 开发中触及任何卷知识 → 实时同步入馆（见 doclib-dev 映射表）
4. **收尾**：`doclib verify` → `doclib snapshot --note "bootstrap: initial spec"` → `doclib status`

## 纪律

- 挖掘结论实时入馆；过程材料留在规划载体（不进馆、不收编）
- 用户沉默处按架构卷惯例实现并记录（resume 的歧义裁决规则同源）
- 写前记录 revision；写后 check 比对（乐观锁）
- 无账不答；记忆与图书馆冲突以馆为准
