---
title: 外部规划工具收编指南
covers:
  - src/core/planning.ts
  - src/core/implement.ts
  - skills/doclib-bootstrap/SKILL.md
status: stable
---

# 外部规划工具收编指南

> 导读：本指南定义 DocLib 与主流规划工具的兼容方式——用户已在用 BMAD、GitHub Spec Kit、OpenSpec 或 Kiro 做需求与架构规划时，其规划产出物可经统一语义映射表拆解入馆，习惯零打断。核心是「快照式收编」语义：转化时刻的内容入馆即成为唯一事实源，源文档原位保留，此后源侧的任何改动都是新的规划信号。转化执行由 doclib-bootstrap 的兼容层流程承担，本指南是该流程的知识事实源。

## 为什么

DocLib 的适用面不该以「弃用既有工具」为代价。大量团队已有成熟的规划工作流：BMAD 用多 agent 对话产出 brief/PRD/架构文档，spec-kit 用 specs 目录管理需求与任务，OpenSpec 用 changes 目录管理变更提案，Kiro 用 EARS 语法写可测需求。若要求他们丢弃这些产出重新对话建馆，等于要求推翻既有习惯——这与 F9「不约束既有载体」的立馆原则相悖。

真正的障碍不是格式，而是**双事实源**：如果工具文档与图书馆并存且各自演进，agent 开发时读到的规格可能滞后于工具侧的最新决策。快照式收编正是为此设计的边界——馆是转化时刻的权威定格，源侧改动通过 provenance 对账显影为「待再转化」提醒，漂移永远可见、永远有下一步动作，而不是静默腐烂。

选择映射表而非逐工具适配器的理由：四工具产出物全为纯 Markdown，其内容都可分解为同一组语义件（一个 PRD 无论叫 prd.md 还是 spec.md，里面的功能需求总该落在 30-features，验收标准总该编号化为 AC）。映射表把「工具差异」压缩在源形态一列，转化逻辑只面向语义件——第五个、第六个工具的接入成本只是新增一列源形态。

## 是什么

**八类语义件**是外部规划产出物的统一分类轴，也是映射表的行：愿景定位、术语、功能规格与验收、技术方案、UI/UX、任务拆单、编码宪法、深度材料。每类语义件在馆内有唯一归宿（归位决策树的延伸）。

**映射表**（每行一个语义件，列 = 四工具源形态 + 馆归宿）：

| 语义件 | BMAD | spec-kit | OpenSpec | Kiro | 馆归宿 |
| --- | --- | --- | --- | --- | --- |
| 愿景定位 | `brief.md`（深度在 addendum） | `spec.md` 概览与方案节 | `proposal.md` 的 why/impact | `requirements.md` 前言 | `00-overview/project.md` |
| 术语 | PRD 的 Glossary 节 | 散见各文档 | 散见各文档 | 散见各文档 | `00-overview/glossary.md`（合并去重） |
| 功能规格与验收 | `prd.md` 的 FR + Consequences | `spec.md` 需求 + 验收场景 | `specs/<能力>/spec.md` Requirement + Scenario | `requirements.md` EARS 语句 | `30-features/`（每功能一册 + AC 编号） |
| 技术方案 | `architecture.md`（取舍在 addendum） | `plan.md` + `research.md` + `data-model.md` + `contracts/` | `design.md` | `design.md` | `10-architecture/`（overview/data-model/data-flow；关键取舍入 ADR） |
| UI/UX | `DESIGN.md` + `EXPERIENCE.md` | spec 内嵌时入对应功能规格 | 无独立文档 | 无独立文档 | `80-design/` |
| 任务拆单 | `tickets.toml`（initiative→epic→story）+ story plan | `tasks.md`（`T001 [P] [US1]` 复选行） | `tasks.md` | `tasks.md` | feature-map planned 候选（确认后登记）；实施细节可入 .plan |
| 编码宪法 | 工具生成的 AGENTS.md（不收） | `constitution.md` | 无 | steering 目录 | `40-guides/conventions.md`（经双向裁决） |
| 深度材料 | `addendum.md` | `research.md`/`quickstart.md` | design 内嵌 | 无 | 就近挂靠：选型对比入 dependencies/ADR；上手指南入 40-guides |

**形态识别闭集**（CLI 侧仅持此表做检测与预览，语义判断归 agent）：

| 工具 | 目录/文件特征 |
| --- | --- |
| BMAD | `_bmad-output/`（planning-artifacts/ 或 initiative 目录）、`_bmad/` |
| spec-kit | `.specify/` 目录 + `specs/NNN-*/` 功能目录 |
| OpenSpec | `openspec/changes/`（含 archive/）或 `openspec/specs/` |
| Kiro | `.kiro/specs/<slug>/`（requirements.md + design.md + tasks.md 三件套） |

**provenance 三元组**是转化的留痕契约：转化产物 frontmatter 记 `source-tool`（bmad/spec-kit/openspec/kiro）、`source-path`（仓库相对路径）、`source-hash`（源文件内容 hash）。它与 graph 草稿的 provenance 惯例同构——机器留痕可对账，语义裁决归 agent。

## 怎么运转

转化分五步，由 doclib-bootstrap 兼容层流程执行（对话式，逐语义件推进）：

1. **识别**：CLI 扫描形态识别闭集，命中即在 status/对话中提示识别到的工具与产物清单；用户确认后声明为规划载体（进 state.planning，享受双锚点与提醒机制）。
2. **映射预览**：按映射表生成「源文件 → 馆归宿」清单，干跑展示（不落盘）；用户可逐行调整归宿。
3. **对话转化**：逐语义件读源文档——按 §7.6 文体学重写（教科书五段，非搬运）、走归位决策树落位、登记两级索引；验收类内容无损转写为 AC（EARS 的 WHEN/IF/THEN SHALL 与 OpenSpec 的 Scenario WHEN/THEN 逐条转为 AC-x 的 Given/When/Then，条目尾注 source-id 保留溯源）。
4. **提取登记**：从任务清单（tickets.toml/tasks.md）提取 planned 条目候选，agent 逐条与用户确认后写入 feature-map——机器出候选不代写。
5. **provenance 留痕**：转化产物写入 source-tool/source-path/source-hash 三元组；此后每次 status/plan 由 CLI 比对源文件现 hash，不一致即输出 soft 提醒「源已变更待再转化：<路径>」，agent 按语义件增量再转化（最小扰动，只改受影响段落）。

**收编纪律**（执行转化时必须遵守）：

- 转化不是搬运：源内容按文体学重写入馆，源文档原位保留、永不删除、不做收编式清空
- 馆是已转化内容的唯一事实源：用户继续用工具产出新规划合法，但已入馆内容的修改必须走再转化入馆——开发依据以馆为准（记忆冲突以馆为准纪律的延伸）
- 工具生成的机器文件（.memlog、tickets.toml 等）不收编：它们是工具私有状态，其知识价值已由语义件映射承载
- 双向裁决：源项目的既有规则文档（constitution 等）按「描述性实况优先/规定性文档声称优先」裁决后进 conventions，不盲抄

## 怎么验收

- Given 仓库存在 `_bmad-output/planning-artifacts/prd.md` When 执行兼容层流程 Then 识别为 BMAD 且映射预览列出 brief/prd/DESIGN/architecture 的馆归宿
- Given BMAD PRD 含 Glossary 与 FR Consequences When 转化 Then 术语入 glossary、功能入 30-features 且每条 Consequences 对应一个 AC 编号
- Given Kiro requirements.md 的 EARS 语句 When 转化 Then 逐条转写为 AC（Given/When/Then 形）且尾注 source-id
- Given OpenSpec tasks.md 含 12 条任务 When 提取 Then 产出 12 条 planned 候选，agent 与用户逐条确认后登记 feature-map
- Given 转化完成 When 读产物 frontmatter Then source-tool/source-path/source-hash 三元组齐备
- Given 源文件在转化后被修改 When status Then 输出「源已变更待再转化」提醒行；再转化后提醒消失
- Given 用户自由维护的工具文档（未被转化）When check Then 不受 acceptance-anchor 检查（F9 边界）

## 参考

- 行为规格与验收：`30-features/040-planning-express.md`（AC 全集）
- PRD：`10-architecture/prd.md` F17（Q43–Q48 拍板）；ADR #24
- 文体学与归位决策树：PRD §7.6、§7.5
- 对话规划引擎（转化流程的上游与下游）：`skills/doclib-bootstrap/SKILL.md`
