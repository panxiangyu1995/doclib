# 规划直通车：规划性文档 ↔ 图书馆 ↔ .plan 实施工单（planning-express）

- 日期：2026-10-27
- 状态：规划完成，用户已拍板（13 项 + 1 矛盾澄清），执行中
- 关联：feature-map #39（本轮登记）｜F8 bootstrap｜F9 规划载体｜F13 check｜ADR #24｜PRD v0.40（F17）
- 来源：用户指令「正式从 prd 等规划性文档到图书馆的功能，参考 bmad 敏捷开发的对话方式……规划成我们项目 cli 自动生成 .plan 实施规划文档用于实施，还有质量门禁等规划和开发的设计理念」+ 中途补充「如果用户自身已经习惯了使用 bmad，我希望我们项目也能兼容 bmad 敏捷开发的文档转成图书馆内容，这样我们的项目适用面更广，同理最好再找找其他的开发工具做好更多更全面的兼容」
- 规划载体：本对话（RIPER-5 RESEARCH → INNOVATE → PLAN → EXECUTE；planstore 四段纪律落盘）
- 关联产物：`src/core/implement.ts` · `src/commands/implement.ts` · `src/cli.ts` · `src/core/{docquality,archival,check,planning}.ts` · `src/commands/plan.ts` · `skills/{doclib-bootstrap,doclib-implement,doclib-dev,doclib-build,doclib-accept}` · `assets/templates/library/30-features/_index.md` · `doclib/40-guides/010-tool-adoption.md` · `doclib/30-features/040-planning-express.md` · `doclib/30-features/check.md` · `doclib/10-architecture/{prd,decisions}.md` · `doclib/INDEX.md` · `package.json`

## 会话导出登记

- 导出文件名：doclib/98-sessions/planning-express-20261027-01.md（用户 /export 导出后按规范重命名 + frontmatter 五要素：type: transcript / tool: opencode / session-id: ses_e850c8ae1ffecaskDbcY5VgjAe / date: 2026-10-27 / plan-slug: planning-express；已登记 98-sessions/_index）
- 敏感信息自查：本会话段无密钥/token/凭据；无警示

## 跨会话前情

| 前情 | 文件指针 | 依赖点 |
| --- | --- | --- |
| F9 双锚点与载体机制 | `doclib/10-architecture/prd.md` §F9 | 转化器 = 锚点一的特化执行器；载体声明/不进快照/提醒机制全复用 |
| 归档闭环三不变量（#35） | `.plan/2026-10-26/archival-loop-enforcement.md` + ADR #20 | 存在性判定零语义猜测执法哲学——门禁三件套同范式；implementation-anchor 与沉淀锚点缺失镜像 |
| 文体学与注记污染（#28） | `.plan/2026-10-23/genre-system.md` + ADR #15 | assumption-residue 复用 docquality 词面检查与 draft 降级惯例 |
| graph draft provenance 惯例（#25） | `.plan/2026-10-22/codegraph-integration.md` | 转化产物 frontmatter provenance 留痕同构先例 |
| featuremap.ts 抽取（#35） | `src/core/featuremap.ts` | implement 命令解析 planned 条目的复用点 |
| 测试登记教训（#38 执行期发现） | `doclib/95-lessons/lessons.md` | 新测试文件必须登记 package.json test script（漏登记=静默退出门禁） |
| BMAD 调研 | 本会话内完成（context7 `/bmad-code-org/bmad-method` + gh api + webfetch 四篇官方 docs/plan 文档 + advanced-elicitation SKILL.md 全文） | 对话协议与兼容映射的全部外部依据 |

## 一、目的与效果

1. 打通「规划性文档 ↔ 图书馆 ↔ 实施工单」正式通路：新项目可通过 BMAD 式对话规划直接产馆（对话产出即馆内各卷，无中间文档层）；已用 BMAD/spec-kit/OpenSpec/Kiro 的用户可快照式收编其规划文档入馆，习惯零打断；馆内 planned 功能可由 CLI 生成 .plan 实施骨架（AC 锚点预填），agent 对话填实后进入 doclib-dev 开发循环。
2. 验收标准写一次全生命周期消费：AC 编号贯穿「对话规划/工具转化 → 拆单骨架 → 施工自检 → accept 验收 → F14 同题共答双跑」五处。
3. 质量门禁补齐规划侧半边：验收锚点/假设残留/实施锚点三类机器执法，规划与开发同受治理健康分体系约束。

## 二、问题点（研究实证）

1. 「已有 PRD/架构/UIUX 文档 → 馆」通路不存在：bootstrap 输入假设是无预写文档（五项直问）；F1 冷启动收编是存量散档语义，非结构化规划文档的语义级拆解转化。
2. 对话深度差距：BMAD 三机制（brain dump 后 Fast/Coaching 双模式、`[ASSUMPTION]` 推断显式化标签、advanced-elicitation 菜单 + HALT + Apply/Reject 门控）在本馆任何 skill 中无对应物。
3. 「图书馆 → .plan 实施文档」生成不存在：`plan` 命令五任务书类型（BUILD/UPDATE/REBUILD/BOOTSTRAP/RESUME）均落 `.doclib/tasks/` 簿记；规划载体 `.plan/` 完全手写（Q11）。
4. 规划质量门禁半边存在：归档三不变量已 strict 执法；但「实施清单不引用验收标准」（验收自说自话）与「对话推断残留毒化事实源」无机器面。
5. 外部工具生态实证：BMAD 54.6k★（`_bmad-output/planning-artifacts/`：brief/prd/DESIGN/EXPERIENCE/architecture + tickets.toml）、spec-kit 143k★（`specs/[###-feature]/`：spec/plan/tasks + constitution）、OpenSpec 73k★（`openspec/changes/<id>/`：proposal/specs/design/tasks）、Kiro（`.kiro/specs/<feature>/`：requirements(EARS)/design/tasks）——四工具产物全为纯 Markdown，任务清单格式趋同（checkbox + 稳定 ID），OpenSpec Scenario 与 Kiro EARS 与本馆 AC（Given/When/Then）语义同构，映射表驱动转化边际成本低。

## 三、研究结果（代码与外部）

**代码实际情况**：

| 事实 | 位置 | 与本功能的接口 |
| --- | --- | --- |
| plan 命令 281 行，五任务书类型互斥校验，写 `.doclib/tasks/` | `src/commands/plan.ts` | implement 为独立命令不混入；bootstrapTask 模板需同步 |
| check 核心 `runCheckCore`/`healthScore` | `src/core/check.ts` | 三新违规类判定入口 |
| 文体门禁 POLLUTION_PATTERN 词面机制 + draft 降级 | `src/core/docquality.ts` | assumption-residue 同构扩展 |
| 归档三不变量 `core/archival.ts`（载体未登记/进度账缺口/沉淀锚点缺失） | `src/core/archival.ts` | implementation-anchor 镜像扩展；featuremap.ts 已抽取可复用 |
| 规划提醒 `planningReminderReport` | `src/core/planning.ts` | provenance 源 hash 对账提醒接入点 |
| graph draft `provenance: codegraph-draft` + TODO(agent) 契约位 | `src/core/codegraph/` | 骨架生成物 provenance 与 TODO(agent) 惯例先例 |
| 引导硬预算 managed ≤150 行 | assets/guides/ | 本功能不增引导行（避免超预算），操作方法论全进 skill |

**外部调研**：BMAD 对话设计（brain dump → Fast 批量补漏整篇草稿带标签 / Coaching 逐节拉取 push back；会话可暂停恢复；elicitation 菜单 HALT + Apply/Reject；富输入零提问/稀输入分流/过薄转介）；PRD 模板（Glossary 锚定同义词即纪律违规 / FR 全局编号 / Consequences (testable) / addendum 分仓）；架构 spine 判据（「两个单元独立建造会不会选不兼容」只记冲突面）；拆单（tickets.toml 稳定 ID / `R1 (FR-2, FR-5)` 溯源 / plan 文件 built→done / refined: false 薄信封）；readiness gate（stories 不依赖无记录决策）。

## 四、方案设计

**F17 规划直通车四组件**（双入口一管道）：

- **组件一 · 对话规划引擎（bootstrap v2）**：五阶段对话协议——阶段 0 Brain dump（用户倒出一切 + 指向已有文件/工具目录；识别到四工具产物即转兼容层流程）→ 阶段 1 定位与术语（`00-overview/project.md` + glossary.md，Glossary 锚定此后全程逐字用术语）→ 阶段 2 功能规格（`30-features/`：行为叙述 + AC-1..N 编号验收标准 + Out of Scope；推断打 `[ASSUMPTION: ...]` 用户确认后清零）→ 阶段 3 架构决策（spine 判据只记冲突面）→ 阶段 4 UI/UX（有界面才做，`80-design/`）。Fast/Coaching 双模式；每阶段收尾进深化菜单。
- **深化菜单（9 方法固定写死 skill 文本，零脚本零依赖）**：红队攻击 / 第一性原理 / 边界穷举 / 用户旅程走查 / 反漏项核对 / 前置条件质疑 / 换位审问（复原者·新用户·审计者三视角）/ 反例构造（每条 AC 构造失败反例）/ 简化挑战。交互：按目标列 5 个 + 换一批 + 继续；HALT 等选择；Apply/Reject 门控——未经用户接受不改稿。
- **组件四 · 工具兼容层**：Z 快照式收编（转化时刻内容入馆即唯一事实源；源侧再改动 = 新规划信号 → 增量再转化）；四工具全上；统一语义映射表入馆 `40-guides/010-tool-adoption.md`（愿景→00-overview/project、术语→glossary、功能规格+验收→30-features（EARS/Scenario 无损转写 AC）、技术方案→10-architecture（关键取舍入 ADR）、UI/UX→80-design、任务拆单→feature-map planned 候选、宪法→40-guides/conventions、深度材料→就近挂靠）；转化流程并入 doclib-bootstrap；CLI 侧仅持形态识别模式闭集（`_bmad-output/`、`.specify/`+`specs/`、`openspec/changes/`、`.kiro/specs/`）+ 映射预览干跑；转化产物 frontmatter 记 `source-tool`/`source-path`/`source-hash`；planned 自动提取候选 + agent 逐条与用户确认。
- **组件二 · 拆单器**：`doclib implement [--feature N] [--apply]`——无 feature 列 planned 候选清单；有则 readiness 校验（对应文档列有值 + AC 锚点可解析）→ 干跑展示骨架 → `--apply` 落盘 `.plan/<日期>/<slug>.md`；骨架 frontmatter `type: plan-skeleton` + `feature: N` + `generated` + `anchors: [<规格路径#AC-x>...]`，正文目的/边界/引用锚点预填，方案设计/实施清单 `TODO(agent)` 契约位（graph draft 同款惯例）；agent 面新 skill `doclib-implement` 对话填实（施工顺序/方案/备选），实施清单每条引用 AC 锚点，填实保留 frontmatter（执法前提）。
- **组件三 · 门禁三件套**（全部存在性/词面判定，零语义猜测）：`acceptance-anchor`（载体中 `type: plan-skeleton` 文档的实施清单条目缺 AC 引用 token 或引用的 AC 在馆内不存在——**仅约束 CLI 生成物，F9 不解析用户自由格式**）；`assumption-residue`（馆内 narrative 正文含未清 ASSUMPTION 词面，draft 态降级警告）；`implementation-anchor`（feature-map in-progress 行对应文档列空/"-" → 违规，与沉淀锚点缺失镜像）。
- **provenance 对账提醒**：馆内带 source-hash 的文档与源文件现 hash 比对，不一致 → status/plan 输出 soft 提醒行「源已变更待再转化」。
- **AC 编号规范**：30-features 验收标准编号 AC-1..N（新增文档强制，存量不追溯，Q33 先例）；骨架 frontmatter anchors 与 check/accept/同题共答答卷共用该锚点。
- **版本 0.7.0**；F9/Q11 原则文字不动，F17 条款登记边界（用户显式请求的服务，命令驱动非默认行为，不属于「输出工作流」约束范围）。

## 五、备选方案与被否理由

1. A2 新增独立 skill 群（doclib-prd/arch/ux）：否决——skill 10→15+ 爆炸；产出 PRD 中间文档层再转化 = 文档双写违反单一事实源（馆本身即 PRD+架构+UIUX 合体）。
2. B2 纯 CLI 全自动生成实施文档：否决——施工顺序/方案设计是语义裁决，违反「机器出候选不代写」哲学。
3. X 一次性迁移（兼容语义）：否决——打断 BMAD 既有用户习惯（用户明确要求兼容）。
4. Y 持续同步：否决——馆永远滞后于工具产出，agent 读馆可能读到旧规格；双事实源漂移是 F13 全体系最忌讳的事。
5. 映射表落 skill 内嵌：否决——馆内无对应文档，违背先馆后码铁律。
6. 映射表落 CLI 常量：否决——机器代写语义映射，违反三铁律第一条。
7. provenance 仅留痕不对账：否决——源侧改动馆无法感知，漂移风险。
8. planned 纯人工逐条登记：否决——转化大项目时对话轮次爆炸。
9. 拆单扩展 plan 第六类型：否决——任务书（.doclib/tasks/ 簿记工单）与 .plan（载体规划材料）落点语义不同，混命令必乱（Q41 同源逻辑）。
10. 拆单 agent 面并入 doclib-dev：被用户否选——选新 skill doclib-implement（单一触发场景纪律 + 与 CLI 命令显式配对）。
11. BMAD tickets.toml 三层拆单树：不吸收——DocLib 已有天然映射（feature → .plan 文档 → 实施清单条目），无新机制必要。
12. BMAD 多具名 agent 分工：不吸收——违反「每 skill 单触发场景」纪律；多角色可由单 skill 内分阶段达成。
13. BMAD methods.csv + python 脚本目录：不吸收——零重依赖铁律，9 方法固化 skill 文本。

## 六、用户拍板记录

提问工具两批共 14 项，保留原话要点：

| # | 决策点 | 拍板 |
| --- | --- | --- |
| 1 | 对话引擎载体 | A1 升级 bootstrap |
| 2 | 拆单 CLI | 独立命令 implement |
| 3 | 拆单 agent 面 | 新 skill doclib-implement |
| 4 | 门禁力度 | 三件全上 |
| 5 | AC 编号 | 编号化 |
| 6 | F9/Q11 | 「维持原原则」（选项描述含砍组件二语义）——与 #2/#3 拍板矛盾，触发澄清 |
| 7 | 深化菜单 | 「固定 8+ 方法」（偏离推荐 6 方法） |
| 8 | 兼容语义 | Z 快照式收编 |
| 9 | 首批工具 | 四工具全上 |
| 10 | 转化 skill | **并入 bootstrap**（偏离推荐「新 skill doclib-adopt」） |
| 11 | 映射表落点 | 40-guides |
| 12 | provenance | hash 对账进提醒 |
| 13 | planned 提取 | 自动提取+确认 |
| 14 | 矛盾澄清 | **原则不动+F17 登记**（推荐）——F9/Q11 文字不动；implement 生成定位为「用户显式请求的服务」，命令驱动非默认行为，不属「输出工作流」；新增 F17 条款说明边界 |

## 七、实施清单（22 步）

1. 创建 .plan/2026-10-27/planning-express.md（本文件）并按双锚点登记
2. PRD v0.40：F17 条款 + 修订记录行 + 术语表三词条（AC 锚点/语义件/规划直通车）+ Q43–Q48 记录
3. ADR #24 入 decisions.md
4. 新建 doclib/40-guides/010-tool-adoption.md（四工具语义映射表 + 收编纪律 + provenance 规范）
5. 新建 doclib/30-features/040-planning-express.md（行为规格 + AC-1..N 编号验收标准）
6. 修订 doclib/30-features/check.md（三类新违规判定与边界）
7. feature-map 登记 #39 planned + progress.md 补记 + INDEX/两级索引登记 → doclib check 自证
8. 重构 skills/doclib-bootstrap/SKILL.md（五阶段协议 + 9 方法菜单 + 兼容层转化流程）
9. 新建 skills/doclib-implement/SKILL.md；微调 doclib-dev/doclib-build/doclib-accept
10. assets/templates/library/30-features/_index.md 增 AC 编号规范模板
11. 新建 src/core/implement.ts（listCandidates/readinessVerdict/renderSkeleton/干跑）
12. 新建 src/commands/implement.ts + src/cli.ts 注册 implement 命令
13. src/core/docquality.ts 增 assumption-residue 检查
14. src/core/archival.ts 增 implementation-anchor 不变量
15. src/core/check.ts 增 acceptance-anchor 判定（仅 type: plan-skeleton 生成物）
16. src/core/planning.ts 增 provenance 源 hash 对账提醒 + status/plan 接入
17. src/commands/plan.ts bootstrapTask 模板同步五阶段指引
18. 新建 src/core/implement.test.ts + src/commands/implement.test.ts；archival/docquality/check/planning 测试各增例
19. package.json：新测试文件登记 test script + version 0.7.0
20. npm run typecheck + npm test 全量绿
21. 临时目录冒烟：init → 假 planned → implement 列候选/干跑/--apply → 骨架落盘与 frontmatter 核验 → 填实模拟 → check 三新违规类正反例 → 四工具目录形态识别与 provenance 提醒
22. 本仓 dogfooding 收尾：feature-map #39 → implemented + progress 补记 + doclib verify/check/snapshot --note "planning-express v0.7.0"

## 八、验收标准（AC-1..12）

- **AC-1**：`doclib implement` 无 --feature 时输出 planned 候选清单（功能号/名称/对应文档），exit 0
- **AC-2**：`doclib implement --feature <N>` 对对应文档列为空的条目报 readiness 不通过（列原因），不产出骨架，exit 非 0
- **AC-3**：readiness 通过时默认干跑——stdout 展示骨架全文，不落盘
- **AC-4**：`--apply` 落盘 `.plan/<日期>/<slug>.md`；frontmatter 含 `type: plan-skeleton`/`feature: N`/`generated`/`anchors`（规格路径#AC-x）；方案设计与实施清单节含 TODO(agent) 标记
- **AC-5**：check 对 `type: plan-skeleton` 文档：实施清单条目缺 AC 引用 token → `acceptance-anchor` 违规；引用的 AC 在馆内不存在 → 同违规；用户自由格式 .plan 不受此检查
- **AC-6**：馆内 narrative 正文含未清 ASSUMPTION 词面 → `assumption-residue` 违规；`status: draft` 文档降级为警告不阻断
- **AC-7**：feature-map in-progress 行对应文档列为空/"-" → `implementation-anchor` 违规；有值 → 无违规
- **AC-8**：馆内文档 frontmatter 带 source-path/source-hash 且源文件 hash 已变 → status/plan 输出「源已变更待再转化」提醒行；一致或无标记 → 无提醒
- **AC-9**：doclib-bootstrap skill 文本含五阶段/9 方法菜单/Fast-Coaching 双模式/ASSUMPTION 纪律/兼容层流程（指向 40-guides/010-tool-adoption.md）；BOOTSTRAP 任务书模板同步五阶段指引
- **AC-10**：40-guides/010-tool-adoption.md 含四工具语义映射表（BMAD/spec-kit/OpenSpec/Kiro → 馆归宿逐行）+ 快照式收编纪律 + provenance 规范
- **AC-11**：临时目录冒烟全链路通过（AC-1..8 逐条验证留痕）
- **AC-12**：typecheck + 全量测试绿（新测试文件已登记 package.json test script）

## 九、失败尝试与踩坑（上游素材，β 一行制实时补记）

- 2026-10-27 β 一行制违约自认：执行期 5 坑未当下补记，收尾统一回填（planstore 收尾核对动作兜住——纪律在会话中段被遗忘，靠收尾核对兜底成立）
- 2026-10-27 CheckFinding.detail 可选字段 → 测试断言 `findings[0].detail.includes` 触发 noUncheckedIndexedAccess TS2532（typecheck 抓住）——可选字段访问需双重断言，属既有编码铁律范畴
- 2026-10-27 slugify 混名预期想当然：`CLI 基础命令集` 实际得 `cli`（ASCII 前缀存活、CJK 剥离）而非 `feature-1` 回退——断言前应手算实际行为而非假设
- 2026-10-27 改 BOOTSTRAP 任务书模板措辞（对话挖掘→五阶段协议）后既有 plan.test 断言 `content.includes("对话挖掘")` 失败——改产品面文本先 grep 既有测试断言
- 2026-10-27 acceptance-anchor 测试漏 seed 馆内规格文件（anchors 存在性校验依赖库内文件），首个用例 findings 数 2≠1——夹具依赖先列清单再写断言
- 2026-10-27 REVIEW 轮三项同根（双语表行错位/INDEX 状态失配/overview 数字陈旧）：多文档联动面新增内容时逐处核对不全——2026-10-26 既有教训「规格口径行与跨文档版本引用是 check 盲区——易腐数字须随轮校正」重申，不新增入档（处置: 既有教训覆盖，REVIEW 轮即修）

## 十、验收口径变更过程

本会话规划阶段 AC-1..12 一次定稿，无中途变更。执行期如口径变更（增删/放宽/收紧），回记此处并说明为什么改。

## 任务进度

- 2026-10-27：规划文档落盘（清单 #1 完成）。来源：RIPER-5 四模式全程（RESEARCH 双线调研 → INNOVATE 双批方案扩展 → PLAN 13+1 拍板 → EXECUTE 开始）。状态：进行中。
- 2026-10-27：执行完成（清单 22 步全过）：馆内联动（PRD v0.40/ADR #24/010-tool-adoption/040-planning-express/check.md 17 类/INDEX/两级索引/20-modules 两新模块+三行更新/testing.md 332 链）→ skills（bootstrap v2 重写/implement 新建/dev-build-accept 微调/模板 AC 编号）→ CLI（core/implement.ts+commands/implement.ts+cli 注册+plan.ts BOOTSTRAP 模板五阶段）→ 门禁（ledger 3 类/docquality assumptionFindings/archival implementation-anchor/check 接线/planning provenance 提醒+BMAD 载体闭集）→ 测试 314→332 全绿 + 冒烟 10 项全过（AC-1..8 + 四工具识别 + F9 边界）。状态：待终审。
- 2026-10-27：终审通过。**check 自证抓真问题并即修**——假设残留 3 项自指误报（馆内文档描述机制词面）→ 模式收紧为带冒号载荷形态 + 规范文档抽象化（同注记污染 ADR #16 纪律）；漏更 4 项（overview/acceptance-cli/cli-acceptance-suite 联动欠账）→ 补齐；README 双语命令表+skills 表 +implement。终态：**check 违规 0 · 治理 100/100(A) · strict 通过 · 332/332 · verify 文体 0 · snapshot snap-073 (version 73, revision 64)**。#39 → implemented，progress 补记（教训: 处置位指向 95-lessons 2026-10-27 · 改产品面文本先 grep 断言）。状态：成功（待用户确认）。
- 2026-10-27：REVIEW 轮（用户指令漏洞审查）双轨收口：**R-1** decisions.md ADR #24 词面 `[ASSUMPTION` 残留（潜伏自指，当前模式不误报）→ 抽象化；**R-2** README.en skills 表 implement 行错位（audit 后 vs 中文 bootstrap 后，违逐条对齐）→ 移位；**R-3** overview L48「13 命令表 + 10 skills」陈旧 → 14/11；**R-4** INDEX 两新行 status draft 与 frontmatter stable 失配 → stable；**R-5** implementation-anchor 仅判全角"—"、PRD 口径 ASCII "-" 漏判 → 三态同判 +1 测试；**R-6** anchors 标量形态静默忽略 → 兼容 +1 测试；**R-7 观察** CHECKBOX_RE 不区分代码围栏（骨架场景罕见，记录不修）。对账收口：check.md/040 口径同步 + suite 334 链 + 指纹重算 + snap-074。终态：**334/334 · check 0 · 治理 100/100(A) · strict 通过**。状态：REVIEW 通过。
