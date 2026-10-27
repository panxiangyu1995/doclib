---
name: doclib-bootstrap
description: 新项目对话式规划建馆（五阶段协议）+ 外部规划工具兼容转化，文档先行开发验收（DocLib 文档驱动开发三模式之一）。当用户要启动一个全新项目（尚无代码或仅有骨架）、或已用 BMAD/spec-kit/OpenSpec/Kiro 做规划想把文档转入 DocLib 图书馆时使用。触发：plan --bootstrap 生成 BOOTSTRAP 任务书后。
---

# doclib-bootstrap · 对话式规划建馆

## 使命

把「想法/需求/已有规划文档」直接蒸馏成图书馆（规格与验收基准），再以图书馆为唯一事实源从零开发——文档先行，代码后写，逐条验收。

## 何时使用

- 已运行 `doclib init` 且 `doclib plan --bootstrap` 生成了 BOOTSTRAP 任务书
- 项目尚无代码或仅有空骨架
- 用户已用 BMAD / spec-kit / OpenSpec / Kiro 产出规划文档（转下方「兼容层流程」）

## 五阶段对话协议

每阶段收尾进深化菜单；结论实时入馆（写前记 revision，写后 check 比对）。

**阶段 0 · Brain dump**：让用户先倒出一切——想法、约束、竞品、偏好；已有文件（PRD 草稿/笔记/架构稿）直接指定路径读取。识别到外部工具产物（`_bmad-output/`、`.specify/`+`specs/NNN-*/`、`openspec/changes/`、`.kiro/specs/<slug>/`）→ 转「兼容层流程」。

**阶段 1 · 定位与术语** → `00-overview/project.md` + `glossary.md`：

- 项目定位、目标用户、一句话立意、边界与非目标（明确不做什么）
- **Glossary 锚定**：领域名词全部入术语表，此后所有对话与文档**逐字使用术语**——引入同义词即纪律违规；正文新增领域名词当轮回填术语表

**阶段 2 · 功能规格** → `30-features/`：

- 核心功能清单（编号，宁细勿粗）；每功能一份规格：行为叙述 + **AC 编号验收标准（AC-1..N，Given/When/Then，禁止"正常工作"类模糊表述）** + Out of Scope
- **ASSUMPTION 纪律**：未经用户确认的推断一律打 `[ASSUMPTION: ...]` 行内标签；用户确认后删除或转正——check「假设残留」执法，带标签的文档不得升级出 draft

**阶段 3 · 架构决策** → `10-architecture/`：

- **spine 判据**：只记「两个会话独立建造会不会选出不兼容的东西」的冲突面决策——设计方法/模块边界/状态变更/共享数据所有权；stack、目录树、数据形状是起点，代码存在后归代码所有
- 关键取舍写 ADR（决策/背景/被否备选/后果）；依赖选型带理由与替代品（dependencies 卷）

**阶段 4 · UI/UX** → `80-design/`（有界面才做，无则显式 N-A）：

- 视觉面（design.md：颜色/字体/间距/组件规范）与行为面（信息架构/交互状态/关键流程）两个语义面都要有落点；页面/路由登记 routes 册

### 双模式（开场确认一次）

- **Fast path**：批量补漏 1–2 个关键问题 → 按已有输入整篇起草，每处推断带 `[ASSUMPTION]` 标签 → 用户批量修正
- **Coaching path**：逐节拉取用户思考，答得薄就 push back（要例子、要边界、要反例），每节确认后落盘

### 深化菜单（每阶段收尾，HALT 等选择）

按阶段目标列 5 个（全集中抽）：①红队攻击 ②第一性原理 ③边界穷举 ④用户旅程走查 ⑤反漏项核对 ⑥前置条件质疑 ⑦换位审问（复原者/新用户/审计者三视角）⑧反例构造（每条 AC 构造失败反例）⑨简化挑战

- **换一批**：从全集中重新抽 5 个 ｜ **继续**：本阶段定稿 ｜ 任意其他回复 = 作为指令作用于当前产出
- 方法运行后展示发现与修改建议——**Apply/Reject 门控：未经用户接受不改稿**

## 兼容层流程（外部工具规划文档转化）

映射表唯一事实源：`doclib/40-guides/010-tool-adoption.md`（八类语义件 × 四工具 × 馆归宿）。

1. **识别**：形态闭集命中即提示工具与产物清单，建议声明为规划载体（享受双锚点与提醒）
2. **映射预览**：按映射表列「源文件 → 馆归宿」清单干跑展示，用户逐行确认
3. **对话转化**：逐语义件按文体学重写（非搬运）、走归位决策树落位、登记两级索引；验收类内容无损转写 AC（EARS/Scenario → Given/When/Then，条目尾注 source-id 溯源）
4. **提取登记**：从任务清单（tickets.toml/tasks.md）提取 planned 候选，逐条与用户确认后写入 feature-map（机器出候选不代写）
5. **provenance 留痕**：转化产物 frontmatter 记 `source-tool`/`source-path`/`source-hash`；源侧再改动 → status/plan 提醒「源已变更待再转化」→ 增量再转化

**快照式收编纪律**：转化时刻内容入馆即唯一事实源；源文档原位保留永不删改；开发依据以馆为准。

## 文档先行开发循环（馆就绪后）

1. **拆单**：`doclib implement` 列 planned 候选 → `doclib implement --feature <N>` 生成 .plan 实施骨架（readiness 校验 + AC 锚点预填）→ 转 **doclib-implement** skill 对话填实
2. **逐功能开发**：按实施清单施工 → 按 30-features AC 逐条自检 → feature-map 推 implemented → progress.md 补记
3. 开发中触及任何卷知识 → 实时同步入馆（doclib-dev 映射表）
4. 馆外存量四态判定（新项目馆外文档少但存在模板 README/引导文件/需求草稿）：①馆内 ②非文档资产 ③工具链豁免 ④待归位——过程材料留规划载体，不进馆

## 收尾

1. `doclib verify`
2. `doclib snapshot --note "bootstrap: initial spec"`
3. `doclib status` 检查引导版本；提示过期时运行 `doclib sync`

## 纪律

- 术语锚定：全程逐字用术语，同义词即违规
- 假设显式化：推断必带 `[ASSUMPTION]`，确认即清零；带标签文档停留 draft
- 深化门控：未经用户 Apply 不改稿；HALT 是协议不是建议
- 快照式收编：馆是唯一事实源；源侧改动走再转化，不做持续同步
- 挖掘结论实时入馆；过程材料留在规划载体（不进馆、不收编）
- 用户沉默处按架构卷惯例实现并记录；写前记录 revision，写后 check 比对
- 无账不答；记忆与图书馆冲突以馆为准
