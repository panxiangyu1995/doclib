---
title: 进度时间线
covers: []
status: living
---

# 进度时间线（progress.md）

> 时间线只叙述，不另立状态；状态事实源见 [feature-map.md](feature-map.md)。每条记录：日期、关联 .plan、完成条目、涉及卷。

- **2026-10-17**
  - 关联 .plan：无（PRD 需求澄清阶段，以对话为规划载体）
  - 完成条目：#3（PRD v0.13：Q1-Q17 全部拍板；北极星/实时同步原则；F1-F11）；DESIGN.md 架构 v2
  - 涉及卷：00-overview、10-architecture、40-guides
  - 完成条目：#4（本图书馆启用：12 卷结构补齐、引导文件落位、进度账建立）
  - 状态变化：#1 #2 保持 implemented；#5-#14 登记 planned
  - 规划：`.plan/2026-10-17/phase1-skeleton-v2.md`（阶段 1 骨架 v2：12 卷模板 assets 化 + 引导文件模板/版本戳 + state v2 + init 参数化）；#5 → in-progress
  - 完成条目：#5（阶段 1 骨架 v2 执行完毕：清单 3-26 与 32-36 完成；27-31 经用户决定跳过——本仓库图书馆保持手工结构）；#11 推进至 in-progress（模板与版本戳已落地，status/verify 检测已实现）
  - 状态变化：#5 in-progress → implemented；#11 planned → in-progress；版本 0.2.0
  - 涉及卷：00-overview、10-architecture（dependencies 新增 copy-assets 构建链）、95-lessons（新增脚手架保护教训）
  - 补账与强化（用户指出的缺口）：引导文件全面强化（AGENTS.md/CLAUDE.md 重写为完整工作流手册；assets/guides/light.md 补入 12 卷实时同步映射全表/会话纪律/.plan 双锚点/skills 速查）；图书馆补账——10-architecture 五卷（overview/data-model/data-flow/dependencies/decisions）、20-modules/_index（18 模块）、30-features（_index + init-v2.md 行为规格）、60-config（构建链/files）、70-deploy（npm 配置就绪）、INDEX 重整；清理重复的 40-guides/testing.md
  - 迁移治理（用户拍板：混合账本制 + forward-only）：模板新增 10-architecture/migrations.md（馆骨架 22→23 文件）；实体在代码区 migrations/（NNN_YYYYMMDD_slug），账本唯一取号、applied 不可变、登记即完成；实时同步映射表（AGENTS/CLAUDE/light/workflow 模板）加入迁移行；本仓库账本空置建账
