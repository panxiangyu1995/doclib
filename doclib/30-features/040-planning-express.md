---
title: F17 规划直通车规格
covers:
  - src/commands/implement.ts
  - src/core/implement.ts
  - src/commands/plan.ts
  - src/core/planning.ts
  - src/core/docquality.ts
  - src/core/archival.ts
  - skills/doclib-bootstrap/SKILL.md
  - skills/doclib-implement/SKILL.md
status: stable
---

# F17 规划直通车 · 行为规格

> 导读：规划直通车打通「规划性文档 ↔ 图书馆 ↔ .plan 实施工单」的双向通路：新项目经五阶段对话规划直接产馆（bootstrap v2），外部工具（BMAD/spec-kit/OpenSpec/Kiro）规划文档快照式收编入馆，馆内 planned 功能由 `doclib implement` 生成实施骨架、agent 对话填实后进入开发循环；三件门禁全程执法。双入口一管道：对话规划与工具转化殊途同归于「馆 + feature-map planned（AC 锚点）」，共用拆单与门禁。

## 为什么

F8 bootstrap 已解决「想法→馆」，但三个缺口使规划知识无法正式入馆：已有 PRD/架构/UIUX 文档（无论手写还是 BMAD 等工具产出）没有转化通路；对话规划缺乏深度协议（模式选择、推断显式化、深化检查），产出质量依赖 agent 自觉；馆内规划到可实施工单的最后一跳完全人工，验收标准与实施清单脱钩导致「验收自说自话」。F17 以既有机制为地基（F9 载体、双锚点、featuremap 解析、docquality 词面检查、graph draft 的 provenance 惯例）补齐这三跳，并确立 F9/Q11 的服务边界——所有生成能力均为用户显式请求（命令驱动、opt-in），不属于「输出工作流」的约束范围。

## 是什么

四个组件（行为归属）：

1. **对话规划引擎（bootstrap v2）**——skill 行为：五阶段协议（Brain dump → 定位与术语 → 功能规格 → 架构决策 → UI/UX）、Fast/Coaching 双模式、ASSUMPTION 推断标签、深化菜单（9 方法，HALT + Apply/Reject 门控）、Glossary 锚定、架构 spine 判据；兼容层流程（外部工具识别 → 映射预览 → 对话转化 → 提取登记 → provenance 留痕）并入本 skill，映射知识事实源在 `40-guides/010-tool-adoption.md`。
2. **拆单器**——CLI 行为：`doclib implement [--feature N] [--apply]`；agent 行为：新 skill `doclib-implement` 对话填实骨架。
3. **门禁三件套**——check 行为：acceptance-anchor / assumption-residue / implementation-anchor 三类违规（判定细节见 `30-features/check.md`）。
4. **provenance 对账**——CLI 行为：馆内带 source-hash 的文档与源文件现 hash 比对，soft 提醒接入 status/plan。

**骨架契约**：`doclib implement --apply` 产出的 .plan 文档带 frontmatter `type: plan-skeleton`、`feature: <N>`、`generated: <日期>`、`anchors: [<规格路径#AC-x>...]`（anchors 支持列表或标量两种 YAML 形态，执法同权）；正文预填目的/边界/引用锚点（馆内确定性字段），方案设计与实施清单节留 `TODO(agent)` 契约位。实施文档落 `.plan/<日期>/<slug>.md`（slug 为功能名 kebab-case）——工单落 `.doclib/workorders/` 簿记（0.11.0 前为 `.doclib/tasks/`，ADR #30）、实施文档落 `.plan/` 载体，落点语义不同分开不混。

**AC 编号规范**：30-features 验收标准条目编号 `AC-1..N`；新增文档强制、存量不追溯。AC 锚点以 `规格路径#AC-x` 形式被骨架 frontmatter anchors、实施清单条目、accept 答卷、同题共答答卷引用。

## 怎么运转

**implement 命令流程**：

1. 无 `--feature`：解析 feature-map（复用 `core/featuremap.ts`），列出全部 planned 条目（功能号/名称/对应文档列/状态），exit 0。
2. 有 `--feature N`：readiness 校验——「对应文档」列非空且每个锚点可解析（`规格路径#AC-x` 中规格文档在馆内存在）；不通过则列明原因、exit 非 0、不产出骨架。
3. readiness 通过：渲染骨架（干跑——stdout 展示全文不落盘）；`--apply` 时写入 `.plan/<日期>/<slug>.md` 并提示下一步（加载 doclib-implement skill 对话填实；填实后按双锚点登记 feature-map）。

**doclib-implement skill 流程**：读骨架与 anchors 指向的馆内规格 → 与用户对话确定施工顺序、技术方案、备选权衡 → 填实实施清单（每条引用 AC 锚点，格式 `- [ ] <动作> → <规格路径#AC-x>`）→ **保留 frontmatter 不动**（验收锚点执法的前提）→ 完成后按 F9 锚点一登记。

**bootstrap v2 对话协议**：见 skill 全文（五阶段/双模式/深化菜单）；阶段 0 识别到四工具形态产物即转兼容层流程。

**provenance 提醒**：`core/planning.ts` 扫描馆内 frontmatter 带 `source-path`+`source-hash` 的文档，与源文件现 hash 比对；不一致 → status/plan 输出提醒行「源已变更待再转化：<路径>」；一致或无标记 → 无输出。

## 怎么验收

**AC-1**：Given 仓库含 feature-map planned 条目 When `doclib implement` Then 输出 planned 候选清单（功能号/名称/对应文档），exit 0。
**AC-2**：Given planned 条目「对应文档」列为空 When `doclib implement --feature <N>` Then 报 readiness 不通过并列明原因，exit 非 0，不产出骨架。
**AC-3**：Given 条目 readiness 通过 When `doclib implement --feature <N>`（无 --apply）Then stdout 展示骨架全文且 `.plan/` 无新文件落盘。
**AC-4**：Given readiness 通过 When `doclib implement --feature <N> --apply` Then `.plan/<日期>/<slug>.md` 落盘，frontmatter 含 type: plan-skeleton/feature/generated/anchors，方案设计与实施清单节含 TODO(agent) 标记。
**AC-5**：Given 载体中 type: plan-skeleton 文档的实施清单条目缺 AC 引用 token、或引用的 AC 在馆内不存在 When `doclib check` Then acceptance-anchor 违规；Given 用户自由格式 .plan（无该 frontmatter）Then 不受此检查。
**AC-6**：Given 馆内 narrative 正文含未清 ASSUMPTION 词面 When `doclib check` Then assumption-residue 违规；Given status: draft 同况 Then 降级为警告不阻断。
**AC-7**：Given feature-map in-progress 行「对应文档」列为空、"-" 或 "—" When `doclib check` Then implementation-anchor 违规；Given 列有值 Then 无违规。
**AC-8**：Given 馆内文档 frontmatter 带 source-path/source-hash 且源文件 hash 已变 When `doclib status`/`doclib plan` Then 输出「源已变更待再转化」提醒行；一致或无标记 Then 无提醒。
**AC-9**：Given doclib-bootstrap skill 文本 When 审阅 Then 含五阶段协议/9 方法菜单/Fast-Coaching 双模式/ASSUMPTION 纪律/兼容层流程（指向 40-guides/010-tool-adoption.md）；Given BOOTSTRAP 工单 Then 含五阶段指引。
**AC-10**：Given 40-guides/010-tool-adoption.md When 审阅 Then 含四工具语义映射表（逐语义件逐工具）+ 快照式收编纪律 + provenance 规范。
**AC-11**：Given 临时目录全流程（init → 假 planned → implement 候选/干跑/apply → 填实模拟 → check 三类正反例 → 形态识别与 provenance 提醒）When 执行 Then AC-1..8 逐条验证留痕。
**AC-12**：Given `npm run typecheck` + `npm test` When 执行 Then 全绿；新测试文件已登记 package.json test script。

## 参考

- 外部工具映射知识：`40-guides/010-tool-adoption.md`
- 门禁判定细节：`30-features/check.md`（三新违规类）
- PRD：`10-architecture/prd.md` F17；ADR #24
- 对话协议全文：`skills/doclib-bootstrap/SKILL.md`；填实流程：`skills/doclib-implement/SKILL.md`
