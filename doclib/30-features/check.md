---
title: doclib check 强验证规格
covers:
  - src/commands/check.ts
  - src/core/check.ts
  - src/core/ledger.ts
  - src/core/orphan.ts
  - src/core/orphan.test.ts
  - src/core/docquality.ts
  - src/core/state.ts
  - src/core/archival.ts
  - src/core/archival.test.ts
  - src/core/featuremap.ts
  - src/commands/ack.ts
  - src/commands/hook.ts
status: stable
---

# doclib check · 强验证规格

> 强验证是纪律的兜底执行者：把「实时同步、归位宪法、迁移治理」从自觉变为机器对账，每条违规都有确定性的判定规则。

## 为什么

把"文档实时更新"与"馆外归位"变为机器可判定：快照 v3 双账本（代码账 files + 文档账 docs）确定性对账，违规项在提交前暴露；治理健康分使治理改善可感知；乐观锁 revision 使并发写馆的静默覆盖不可能。

## 是什么

`doclib check [--strict] [--json]`——对代码账与文档账双账本对账的强验证命令：违规分类（含文体违规）、馆外四态判定、治理健康分、乐观锁 revision 展示；`--strict` 可挂 pre-commit/CI 作提交门禁。

## 怎么运转

`doclib check [--strict] [--json]`——无 AI、无网络、可复现。违规分类 17 类（另含非违规状态 3 类与豁免提示 notices）：

| 分类 | 判定 | 违规 |
| --- | --- | --- |
| 已对账 | 漂移路径 covers 命中文档 hash 已变 | 否 |
| 漏更 | 命中但全未变（列出覆盖文档） | 是 |
| 无归属 | 无 covers 命中 | 是 |
| 文档先行 | 只改文档 | 否 |
| 已豁免 | ack 命中（once 绑定基线 / standing 长期） | 否 |
| 迁移违规 | migrations/ 脚本未登记、编号重复、断号、账本指向不存在、命名不符 | 是 |
| 引导过期 | 引导 managed 区落后模板，或 project 区≠簿记注入结果（直改/落后） | 提示 sync |
| 反哺过期 | 簿记 `docs-hash` ≠ 当前馆内指纹（馆变了反哺没跟上，`core/check.ts`） | 是（strict 计入门禁） |
| 孤儿文档 | 馆外知识型 .md 未收编且未豁免（豁免：根 README/CHANGELOG/CONTRIBUTING **及其多语言变体**（`README.<locale>.md` 等，locale 标签形如 `en`/`zh-CN`/`pt_BR`）+ 工具链目录闭集 26 项 + 任意层级引导文件 + 归档指针文件） | 是（strict 计入门禁；默认 soft 报告语义） |
| 文档质量 | 馆内相对 .md 链接失效（外链/锚点/根绝对路径跳过；INDEX.md 自身跳过；**98-sessions 会话档案区跳过 v0.6.3**——对话原文中的路径提及非馆内链接契约，与文体豁免同口径 ADR #19；与 verify 同源扫描 `core/docquality.ts`） | 是（strict 计入门禁） |
| 文体违规 | 按 PRD §7.6 文体逐篇检查（`checkGenreCompliance`）：①narrative 缺导读/三段（为什么/是什么/怎么运转）②narrative 正文有效行 <10 且有效字符 <400（卡片化，双阈值抓稀薄）③注记污染（过程短语，全文体生效）——三项违规；`status: draft` 文档的①②降级为警告（不计门禁），③不降级；④倾倒（表格/列表行占比 >70%）仅 verify 警告不进 check。豁免：_index/README/INDEX、98-sessions（对话原始记录档案区——**全豁免含污染检查**，对话原文不改写，ADR #19）、99-archive、50-testing/benchmark 档案区、ledger·00-overview·95-lessons 免结构检查；frontmatter `type` 覆盖 > 卷默认 | 是（strict 计入门禁） |
| 载体未登记 | 已声明规划路径（`state.planning`）下每个 `.md`：未被 feature-map「对应文档」列任一行引用（原始子串判定，存在性非 mtime 零噪音）且无 ack 豁免（`core/archival.ts`）——归档闭环不变量①，拦「锚点一漏登记」 | 是（strict 计入门禁） |
| 进度账缺口 | feature-map 行引用的载体路径（按已声明前缀匹配，注解括号切分后按「 + 」拆分）未出现在 `progress.md` 原文中——归档闭环不变量②，拦「进度账记一半」（feature-map 有 / progress 无） | 是（strict 计入门禁） |
| 沉淀锚点缺失 | feature-map 行 status=implemented 且「对应文档」列为空或 "—"——归档闭环不变量③（语义沉淀的机械子集，不追溯仅引用目录的既有行），拦「实现了却零文档沉淀」 | 是（strict 计入门禁） |
| 教训账缺口 | progress.md 含 `<!-- doclib:lesson-epoch: YYYY-MM-DD -->` 标记（缺席=不变量不活跃，存量库零破坏；标记在而日期非法 → fail-fast）时：①epoch 之后条目缺末字段 `教训:` 处置位 ②处置引用（`95-lessons[@<dir>] <date> · <标题>`，多条「；」分隔）在目标馆 lessons.md 无 `## <date> · <标题>` 前缀命中（`core/archival.ts`）——归档闭环不变量④，拦「教训没想过」与「声明了却没入档」 | 是（strict 计入门禁） |
| 走查账违规 | 反哺簿记 frontmatter 12 卷走查账（`volumes-fed`/`volumes-na` 双列表必须齐备，单边判非法）：①未知卷名（12 卷基线外）②fed∪na≠12 卷闭集（漏裁决）③两集重叠（重复裁决）④字段非列表（`core/check.ts` `guideWalkVerdict`）；**走查账缺席仅 notice 不违规**（存量零破坏，ADR #21 先例）——拦「蒸馏漏卷」与「闭集覆盖不可判定」 | 是（strict 计入门禁） |
| 教训来源缺失 | lessons.md 置 `<!-- doclib:lesson-source-epoch: YYYY-MM-DD -->` 标记（缺席=不变量不活跃存量零破坏；非法 fail-fast）后：epoch（条目标题日期 ≥ epoch）条目①缺 `来源[:：]` 行 ②来源行中路径 token（doclib/|.plan|src/skills 等前缀）在仓库根/馆内不存在（防幻觉路径；无路径 token 的描述性来源合法）——`core/archival.ts` `lessonSourceFindings`，拦「记了却不可回溯」与「来源指鹿为马」（v0.6.4 #38） | 是（strict 计入门禁） |
| 验收锚点缺失 | 已声明规划路径下 frontmatter `type: plan-skeleton` 的**生成物**文档：实施清单条目（`- [ ]` 复选行）缺 AC 引用 token（`AC-<数字>`），或引用的 `规格路径#AC-x` 锚点（规格文档或 AC 编号）在馆内不存在——**仅约束 CLI 生成物，用户自由格式 .plan 不受检**（F9 不解析载体格式的边界；v0.40 #39），拦「实施与验收脱钩的自说自话」 | 是（strict 计入门禁） |
| 假设残留 | 馆内 narrative 文档正文含未清假设标签词面（带冒号载荷的行内标签；词面规则归 `core/docquality.ts` 实现，规范文档不落词面防自指误报——同注记污染纪律）——对话规划的推断残留毒化事实源（v0.40 #39）；`status: draft` 降级警告不阻断（同文体①②惯例） | 是（strict 计入门禁） |
| 实施锚点缺失 | feature-map 行 status=in-progress 且「对应文档」列为空、"-" 或 "—"（ASCII 与全角空位同判）——沉淀锚点缺失的镜像对称（in-progress 应有 .plan 实施文档或馆内规格在改；v0.40 #39），拦「开工了却无实施载体」 | 是（strict 计入门禁） |

分类口径统一（v0.29 修正措辞；v0.32 增文体；v0.6.1 增归档闭环三不变量；v0.6.2 增教训账缺口；v0.6.3 增走查账违规并补列 guide-feed-stale——口径行历史上漏计该类，与 union 对齐；v0.6.4 增教训来源缺失；v0.40 增验收锚点缺失/假设残留/实施锚点缺失）：**违规 findings 17 类**（unaccounted / uncovered / migration / guide-stale / guide-feed-stale / guide-feed-walk / orphan-doc / doc-quality / genre / carrier-unregistered / ledger-gap / anchor-missing / lesson-gap / lesson-source / acceptance-anchor / assumption-residue / implementation-anchor）＋**非违规状态 3 类**（已对账 / 文档先行 / 已豁免）＋**豁免与提示 notices**（不计门禁、不扣治理分，仅计数可见；v0.6.3 增 `guide-feed-walk-absent` 走查缺席提示）。归档闭环四不变量**不计入治理健康分五分项**（公式不变），执法面走 strict 门禁与 pre-commit hook；验收锚点/假设残留/实施锚点三新类同不入五分项（v0.40，公式不变）。

## 四态判定与三层防线【v0.29】

馆外文档分四态，判定面与扫描面分离：

| 态 | 判定 | 处置 | 进代码账 | 门禁/扣分 |
| --- | --- | --- | --- | --- |
| ① 馆内 | 路径在 `doclib/` | 正常维护 | 是 | — |
| ② 非文档资产 | L1 忽略面（vendor/third_party/deps/extern/external/.changeset 等） | 不参与文档扫描 | 否 | 否 |
| ③ 工具链豁免 | L2 闭集：工具链目录 27 项 + 任意层级引导文件（AGENTS/CLAUDE/CLAUDE.local/GEMINI/CONVENTIONS）+ 归档指针文件 + 根级门面文件（README/CHANGELOG/CONTRIBUTING **及其多语言变体**） | 豁免（counts 可见） | 是 | 否 |
| ④ 待归位孤儿 | 真·馆外知识文档 | `doclib place` 处置 | 是 | **是** |

- **L1 扫描面**：`core/fsutil.ts` `DEFAULT_IGNORES` + `.gitignore` + `.doclibignore`——决定哪些文件参与文档扫描与代码账
- **L2 判定面**：`core/orphan.ts` 工具链闭集 + 根级门面文件模式识别（`README.<locale>.md` 等多语言变体与基名同权，locale 标签按 BCP-47 形状判定：`^[a-z]{2}([-_][A-Za-z0-9]{2,8}){0,2}$`——`en`/`zh-CN`/`pt_BR`/`sr-Latn` 命中，`wip`/`2024`/`abc` 不命中）+ `state.dirExempts`（`doclib ack --dir` 登记，项目级零代码扩展）——决定哪些文件不判孤儿
- **L3 处置面**：`core/place.ts` + `commands/place.ts`——决定孤儿怎么处置
- **豁免语义边界**：`ack --dir` = 不判孤儿但**仍进代码账**（可漂移感知），**登记时校验目录存在**（拼写错误直接拒绝，移除豁免不受限）；`.doclibignore` = **完全不进代码账**（不 hash、不漂移检测）
- **闭集滞后兜底**：`check` 输出 notices 提示「疑似新工具目录」（顶层点目录 + `SKILL.md`/`*.mdc`/引导文件/工具子目录特征，不在闭集）——soft 不阻断，提示 `doclib ack --dir <前缀>`
- **notices 聚合口径**：豁免类 notices（工具链/引导/指针）按「类型 + 顶层目录」聚合并保留样例路径（≤3），suspect 类逐条保留——文本与 `--json` 载荷同时收敛，规避大仓逐文件输出
- **漂移语义修正**：文件因新增忽略规则退出代码账 ≠ 真删除——按磁盘存在性区分，被新忽略者不计漂移、不判违规，只记一条 `newly-ignored` notice

- `--strict`：存在违规 → 退出码 1（可挂 pre-commit/CI）
- 旧基线无文档账：降级（仅无归属/迁移/引导检查）并提示重建基线
- once-ack 在下次 snapshot 自动清除；standing 用 `ack --remove` 移除
- 输出头含 `revision: N`——入馆写前记录、写后比对，已变即重新对账（乐观锁）

## 治理健康分

`check` 末行与 `status` 输出 `治理: NN/100 (X)`：

| 分项 | 计分 | 权重 |
| --- | --- | --- |
| 对账完整性 | 无漂移满分；否则 1−（漏更+无归属）/漂移总数 | 40% |
| 迁移纪律 | 每项违规扣 0.2 | 20% |
| 归位卫生 | 每个孤儿扣 0.1 | 20% |
| 引导新鲜度 | 每项过期扣 0.5 | 10% |
| 文档质量 | 馆内相对链接失效每项扣 0.1 | 10% |

- 等级：A ≥90 / B ≥75 / C ≥60 / D ≥40 / F <40；check 附分项明细百分比
- 权重可由 F14 基准实验数据校准（ADR #11）

## 乐观锁 revision

- state 增 `revision` 字段（旧 state 归一化 0）；每次 snapshot 递增
- `check`/`status`/`plan` 均输出 revision——agent 入馆写前记录，写后 check 比对，已变即重新对账；不做写队列/文件锁

## 引导硬预算

- `status` 输出"引导预算: CLAUDE.md N/150 行 · AGENTS.md N/150 行"（managed 区行数）
- ≤150 行（`GUIDE_BUDGET_LINES`）；超限提示瘦身（裁剪判据：删掉会犯错吗）——只显示不阻断

## 配套

- `doclib ack <路径> [--note] [--standing] [--remove]`；`doclib ack --dir <目录前缀> [--note] [--remove]`（目录豁免：不判孤儿但仍进代码账）
- `doclib place list|collect|archive|ack|restore`（孤儿归位；写操作默认干跑，`--apply` 执行——规格见 [place.md](place.md)）
- `doclib hook install [--strict] / remove / --ci github`（钩子带 `# doclib-hook` 标记；非标记既有钩子拒改；fail-closed 自检 + 相对/绝对路径策略 + worktree gitdir 解析，规格见 30-features/hook.md）

## 验收标准

- Given 改代码不改文档 When check Then 报漏更并列出覆盖文档；--strict 退出码 1
- Given 代码与覆盖文档同改 When check Then 已对账计数 +1，无违规
- Given narrative 文档缺"为什么"段 When check Then 文体违规检出（kind=structure，含缺失段名）；--strict 退出码 1
- Given narrative 正文有效行 <10 且有效字符 <400 When check Then 文体违规检出（kind=card）；status: draft 时同况仅警告
- Given draft 文档缺标准段 When check Then 仅警告（[draft 降级] 前缀，strict 不阻断）；Given 正文含过程短语且 status: draft When check Then 仍违规（pollution 不降级）
- Given 正文含过程短语类工作痕迹（词面清单见 doclib-build skill「写作方法论」与 `src/core/docquality.ts` POLLUTION_PATTERN）When check Then 文体违规检出（kind=pollution）
- Given 90-reference 分册 62 端点大表 When check Then 无任何文体输出（ledger 豁免）
- Given 30-features 下文档 frontmatter `type: ledger` When check Then 不查三段结构
- Given _index.md / 99-archive / 50-testing/benchmark/ When check Then 全豁免
- Given 新增路径无 covers When check Then 无归属；standing ack 后转为已豁免
- Given migrations/ 有脚本未登记 When check Then 迁移违规含"未在账本登记"
- Given v1 旧快照（无 docs 字段）When check Then 降级警告且不崩
- Given hook install --strict When 查看钩子 Then 含标记与 --strict 且可执行；remove 后不存在
- Given 馆外散落 .md When check Then 孤儿文档检出；standing ack 后转为已豁免；根 README 与 .claude/ 等工具链路径不检出
- Given 根级 README.en.md / README.zh-CN.md / CHANGELOG.en.md When check Then 不检出为孤儿（门面文件多语言变体，模式豁免，notices 计入「工具链豁免」）
- Given 根级 README.wip.md / README.2024.md When check Then 仍检出为孤儿（非 locale 后缀，不得借门面豁免逃逸）
- Given 顶层 .agents/skills/x/SKILL.md When check Then 不检出为孤儿，notices 计入「工具链豁免」
- Given 嵌套 packages/api/AGENTS.md When check Then 不检出为孤儿（引导文件任意层级豁免）
- Given vendor/lib/README.md When check Then 不进入任何分类（不进代码账）
- Given 新增忽略规则使文件退出代码账 When check Then 不产生「无归属」违规，仅记 newly-ignored notice
- Given 新工具目录 .foo/ 含 SKILL.md When check Then notices 报「疑似新工具目录」，不判违规
- Given 已 ack --dir .foo/ When check Then .foo/ 下 .md 不判孤儿，且仍进代码账
- Given 馆内文档含失效相对链接 When check Then 文档质量检出（path=所在文档）且质量分项 0.9、总分下降；--strict 退出码 1
- Given 全绿基线 When check Then 治理 100/100 (A)；产生漏更后对账分项归零、总分下降、等级按阈值变化
- Given snapshot 执行 When 查看 revision Then 递增 1；check/status/plan 输出该值
- Given managed 区超 150 行 When status Then 引导预算显示实际行数与超限提示
- Given 已声明规划路径下新增 .md 未被 feature-map 引用且无 ack When check Then 载体未登记检出；登记 planned 后归零
- Given feature-map 行引用载体路径但 progress.md 无补记 When check Then 进度账缺口检出（detail 含行号）；progress 补记后归零
- Given implemented 行对应文档列为空或 "—" When check Then 沉淀锚点缺失检出；planned 行同况不违规（不追溯既有目录引用行）
- Given 无载体仓库 When check Then 归档三不变量零误报
- Given progress 含 lesson-epoch 标记且 epoch 后条目缺 `教训:` 处置位 When check Then 教训账缺口检出（path=条目日期）
- Given 处置引用 `95-lessons <date> · <标题>` 在本馆 lessons.md 无前缀命中 When check Then 教训账缺口检出（path=引用串）；补录条目后归零
- Given 处置引用 `95-lessons@<dir> <date> · <标题>` When check Then 按 `<dir>/doclib/95-lessons/lessons.md` 解析；`教训: 无（理由）` 不需解析
- Given progress 无 lesson-epoch 标记 When check Then 教训账缺口不变量不活跃（存量库零破坏）；标记在而日期非法 Then fail-fast
- Given 反哺簿记走查账缺一卷/含未知卷/两集重叠/字段非列表 When check Then 走查账违规检出（kind=guide-feed-walk，detail 列明问题卷名）；--strict 退出码 1
- Given 反哺簿记走查账 12 卷全覆盖且两列表齐备 When check Then 无走查违规；status 反哺行报「走查 12/12」
- Given 反哺簿记无走查账字段（旧簿记） When check Then 仅 `guide-feed-walk-absent` notice（不计门禁不扣治理分）；status 报「走查 未留账 ⚠」
- Given lessons.md 无 source-epoch 标记 When check Then 不变量不活跃零违规（存量零破坏）；标记日期非法 Then fail-fast
- Given epoch 后 lessons 条目缺 `来源:` 行 When check Then 教训来源缺失检出（path=条目日期）；补来源后归零
- Given 来源行路径 token 不存在 When check Then 教训来源缺失检出（path=失效 token，防幻觉）；描述性来源（无路径 token）合法
- Given 条目日期早于 epoch When check Then 豁免
- Given 载体中 type: plan-skeleton 生成物的实施清单条目缺 AC 引用 token When check Then 验收锚点缺失检出；补 AC 引用后归零
- Given 生成物引用的 `规格路径#AC-x` 中规格文档或 AC 编号在馆内不存在 When check Then 验收锚点缺失检出（path=锚点串）
- Given 用户自由格式 .plan（无 plan-skeleton frontmatter）When check Then 不受验收锚点检查（F9 边界，零误报）
- Given narrative 正文含未清 ASSUMPTION 词面 When check Then 假设残留检出；status: draft 同况仅警告（[draft 降级] 前缀）
- Given in-progress 行对应文档列为空或 "—" When check Then 实施锚点缺失检出；列有值 Then 无违规（implemented/planned 行按既有不变量各自判定，互不越界）
