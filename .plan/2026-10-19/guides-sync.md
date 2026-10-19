# 引导文件区域化与 doclib sync

- 创建于：2026-10-19
- 来源：用户指示（对话中直接规划并实现，本文档为规划记录）
- 关联：feature-map #11/#15；PRD F5/v0.14；DESIGN §3.1

## 目的与效果

引导文件（CLAUDE.md/AGENTS.md）成为一等维护对象：对话中的重点规则（如迁移治理）进引导；引导自身随 DocLib 演进而更新，且不破坏项目定制内容。

## 问题点

- 有戳即整体覆盖 → 丢失 agent 定制内容
- 引导模板演进（新规则行）后，存量项目无从更新
- 任务书收尾缺少引导版本检查动作

## 研究结果 / 代码实际情况

- guides.ts 仅有 stamp 解析与三态覆盖（新写/有戳更新/无戳跳过）
- 引导模板为整段文本，无区域概念
- CLI 七命令中无引导更新入口；state.agents 已有但无消费者

## 设计方案

- **区域契约**：`managed`（规则区，CLI 全权再生）+ `custom`（定制区，agent 维护、sync 永不覆盖）；区域以 HTML 注释标记界定
- **merge 算法**：无文件→整写；无戳→跳过；有戳+双区→模板 managed + 保留 custom；有戳无区（旧版）→整体再生并记 legacy 提示查 diff；重建结果与现文件一致→记 unchanged 不写（幂等）
- **`doclib sync` 命令**：解析目标（--agents > state.agents）→ copyDir skills → writeGuides(light) → state.agents 持久化
- **任务书收尾**（Q4 机制③）：BUILD/UPDATE/REBUILD 收尾固定"doclib status 检查引导版本；过期运行 sync"
- **映射表**：实时同步表新增"引导文件规则演进"行（light/full/workflow 模板四处）

## 备选方案

- 只靠 agent 手工维护引导 → 不可靠（用户已点名否决）
- 用 git diff 三方合并 → 过度工程，区域标记已足够
- 复用未来 setup 命令 → sync 是其引导/skills 子集，先行落地，后续 setup 扩展

## 实施清单（已执行）

1. guides.ts v2（区域解析/merge/GuidesResult 四桶）
2. light/full 模板区域化 + 引导维护行 + sync 速查
3. sync.ts + cli 接线 + HELP
4. BUILD/UPDATE/REBUILD 任务书收尾步骤
5. guides.test.ts 五态覆盖（22/22）
6. 身先士卒：本仓库 AGENTS/CLAUDE 改造为戳+区域，sync 接管规则区（幂等验证通过）
7. PRD v0.14 / DESIGN / feature-map / progress 归档

## 验收记录

- typecheck ✓；测试 22/22 ✓；sync 幂等（二次运行"无变化"）✓；status/verify 显示 CLAUDE.md ✓ · AGENTS.md ✓

## 任务进度

**[2026-10-19 · 批次 2（用户指出：引导实时维护义务）]**
- 已修改：`assets/guides/light.md`、`assets/guides/full.md`、`assets/templates/library/40-guides/workflow.md`——映射表行改为"项目定制区实时维护"；会话自检三问扩为**四问**（+引导文件需要更新吗）；纪律底线新增"引导文件与图书馆同为一体"；`docs/PRD.md` v0.15
- 更改：build 后 sync 传播至本仓库 AGENTS.md/CLAUDE.md（grep 验证 四问/实时维护行均存在）
- 原因：用户指出"lib 应用到别的 repo，对应 repo 的引导文件也要实时更新"未体现
- 教训（实时入档 95-lessons）：sync 消费的是 dist 构建产物——改引导/模板后必须先 build 再 sync，否则静默"无变化"
- 阻碍因素：无
- 状态：未确认
