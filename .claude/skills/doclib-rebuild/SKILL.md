---
name: doclib-rebuild
description: 只凭 DocLib 文档图书馆从零复原一个项目。当存在 REBUILD 任务书（.doclib/tasks/REBUILD-*.md）或用户要求"按文档重建项目"时使用。这是从零的重新开发，不是克隆：不访问源项目，不复制源码。
---

# doclib-rebuild · 从零复原

## 使命

只凭 doclib/ 图书馆（规格书 + 蓝图 + 实施指南），在目标目录从零开发出功能 ≥90% 复原的项目。

## 硬约束

- **信息隔离**：只允许读取 doclib/ 图书馆（及其 REBUILD 任务书）。禁止访问源项目目录、源码、git 历史
- **从零开发**：所有代码在目标目录新写。文档中的 ≤10 行示意片段是行为规格，不是拿来抄的代码
- **忠实于文档**：技术选型、模块边界、数据模型、行为细节以文档为准

## 工作流

1. **通读**：doclib/README.md → INDEX.md → 00-overview → 10-architecture → 40-guides/rebuild-plan.md
2. **制定施工计划**：依 rebuild-plan 的阶段划分，写入目标目录 REBUILD-LOG.md（阶段、依据文档、完成标准）
3. **逐阶段开发**：脚手架 → 数据层 → 核心域 → 接口层 → 次要功能 → 打磨。每阶段完成即对照依据文档自检，并在 REBUILD-LOG.md 记录结果
4. **验收**：逐条执行 30-features 的验收标准（Given/When/Then），记录通过/偏差；feature-map 全绿才算完成
5. **收尾**：在 REBUILD-LOG.md 输出差异清单——文档未覆盖而自行决策的部分、与文档不符被迫偏离的部分。这份清单将反哺图书馆的下一轮更新（回到源项目执行 doclib plan → doclib-update）

## 歧义处理

- 文档明确 → 照做
- 文档沉默 → 按架构卷的选型与 40-guides/conventions 的惯例做最自然的实现，记入差异清单
- 文档自相矛盾 → 优先级：30-features（行为规格）＞ 20-modules（结构描述）＞ 10-architecture（总览）＞ 00-overview（愿景），并记入差异清单
- 文档缺失关键信息无法继续 → 停下，在 REBUILD-LOG.md 记录阻塞点，请用户回到源项目补文档，而不是凭空捏造

## 目标感

90% 是设计值：缺的 10% 通常是纯实现细节（代码风格、内部小函数、历史 quirk）。但功能、行为、数据、接口、部署方式必须完整复原——这正是 30-features 验收标准存在的意义。
