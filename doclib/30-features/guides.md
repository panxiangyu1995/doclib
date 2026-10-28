---
title: 引导文件体系规格（四区契约与图书馆反哺）
covers:
  - src/core/guides.ts
  - src/commands/sync.ts
  - src/commands/init.ts
  - assets/guides/light.md
status: stable
---

# 引导文件体系 · 四区契约与图书馆反哺规格

> 引导文件（`CLAUDE.md` / `AGENTS.md`）是 agent 的第一入口：既有 DocLib 工作流规则，又有图书馆反哺的项目知识、记忆快照与协作者画像，还有项目手写定制——四区各司其职，真相源各自清晰。

## 为什么

引导文件若只有「怎么用图书馆」的工作流规则，agent 每次会话回答「这项目是什么/架构怎样/硬规则有哪些」都必须进馆翻找，冷启动成本高；若把项目知识直接写进引导文件，又与图书馆形成双真相源。三区契约 + 图书馆反哺解决这对矛盾：**馆内知识蒸馏成「会话冷启动包」回流引导文件，真相仍单点在馆**——与 graph 输出「仅候选禁止直接入馆」对偶，反哺区「仅再生禁止直改」。

## 是什么

引导文件由首行版本戳（`<!-- doclib-guide cli=x structure=n -->`）与三区构成：

| 区 | 内容 | 真相源 | 再生方式 |
| --- | --- | --- | --- |
| managed | DocLib 工作流规则 | doclib 包内模板 `assets/guides/light.md` | `doclib sync` 机械再生 |

managed 区核心为**实时同步映射表**（改动类型→必须同步的卷），v0.6.1 新增「载体规划文档新增」行：feature-map 登记 planned + progress.md 补记——由 check「载体未登记」「进度账缺口」两不变量 strict 执法（见 [check.md](check.md)）；v0.6.2「修 bug」行增教训处置位事实：95-lessons 入档 + progress 条目末 `教训:` 声明去向（check「教训账缺口」执法）；v0.8.0 会话纪律自检句四问→五问（+踩坑处置——#38 期 skill 与模板漂移 REVIEW 轮顺手对齐；第 4 问含记忆快照刷新）。
| project | 图书馆反哺的项目知识摘要（五段：项目定位/架构速览/模块地图/开发宪法/命令速查） | 簿记 `.doclib/guide-project.md`（单源） | agent 蒸馏写入簿记 → `doclib sync` 注入 |
| memory | 记忆快照与协作者画像（v0.41 双层快照：近期工作记忆 ≤25 行 + 协作者画像 ≤12 行） | 簿记 `.doclib/guide-memory.md`（单源） | agent 会话收尾蒸馏写入簿记 → `doclib sync` 注入 |
| custom | 项目手写事项 | 引导文件自身 | 手写，sync 保留 |

归属判据：真相在图书馆的进 project 区；滚动状态与协作画像进 memory 区；真相只在引导文件里的进 custom 区。agent 映射：claude→`CLAUDE.md`，opencode/cursor/generic→`AGENTS.md`；多 agent 同名文件只写一份、内容一致。full 档已退役（v0.6.0，职责由 project 反哺取代）。

**开发宪法段（v0.6.3，「硬规则」升格）**：六篇固定框架——①架构铁律（分层/依赖方向/职责边界/架构原则，源 10-architecture + 20-modules）②编码铁律（语言/模块/错误面/命名/注释，源 40-guides/conventions + 95-lessons）③数据与迁移铁律（Schema/取号/forward-only，源 10-architecture/migrations + data-model）④UI/UX 铁律（设计系统唯一事实源指针，源 80-design）⑤测试与验收铁律（源 50-testing + 30-features）⑥禁区（负向清单，各卷红线蒸馏）；每条一行 + 馆内路径指针，细则在馆；不适用篇**显式写 N-A 行**（防静默省略）；段末置「规则唯一事实源指针」句（馆无规则→提案入 ADR/规格，禁止即兴发明）。宪法条目判据沿用「删掉会犯错吗」+「冷启动每天都要知道吗」。

## 怎么运转

**写入三岔路**（`writeGuides`）：文件不存在 → 写渲染模板；有版本戳 → `mergeGuide`（新模板整体 + 保留旧 custom 区；无 custom 标记的 legacy 旧版整体再生并提示）；无版本戳 → 跳过不动（保护手写文件，合并交由 agent）。

**反哺链路**：agent 读馆蒸馏五段 → 写 `.doclib/guide-project.md`（frontmatter 携 `snapshot` 蒸馏时基线版本、`docs-hash` 蒸馏时馆内文档指纹 `libraryFingerprint` 即 doclib/ 下 .md 的稳定 hash 不含引导文件自身、以及 **12 卷走查账**）→ `doclib sync` 读取并注入两份引导文件 project 区。无簿记文件或正文为空 → project 区保持模板占位（空状态合法，不判违规）。**正文禁含区域保留标记**（`doclib:managed/project/custom` 任一 begin/end 字符串）：含则注入面（init/sync）fail-fast 报 DoclibError 拒绝注入，观测面（status/verify）降级为 ⚠ 提示行，执法面（check）fail-fast——防注入破坏三区契约与 custom 保留语义（REVIEW 轮 D-1）。

**12 卷走查账（v0.6.3，γ 执法）**：蒸馏时对 12 卷闭集逐卷裁决——该卷知识已进反哺正文记 `volumes-fed`，显式不适用记 `volumes-na`（99-archive 恒 N-A；两列表必须齐备，单边判非法）。check 新违规类 `guide-feed-walk` 强校验三面：未知卷名 / fed∪na≠12 卷闭集 / 两集重叠；字段非列表判 `invalid` 同样违规。**缺席 soft**：旧簿记无走查字段仅 notice 提示不判违规（存量零破坏，对齐 lesson-epoch 先例 ADR #21）；观测面 status 反哺行报走查覆盖度（`走查 N/12`｜`未留账 ⚠`｜`非法 ⚠`）。「哪条规则算混用」属语义裁决不入确定性检测（确定性语义分层铁律）——语义面由蒸馏裁决纪律与 audit 抽查兜底。

**宪法裁决纪律（反哺蒸馏前置，v0.6.3）**：每条宪法条目落笔前过**裁决三问**——①馆内是否已有裁决（ADR/规格）？②实况是否存在多套并存（如命名混用）？③该条目是描述存量还是规定增量？三原则：**应然非实然**（宪法写裁决后规范，实况留馆内对应卷）；**裁决必留痕**（结构性裁决入 ADR「决策/背景/被否备选/后果」，轻量裁决条目行内标注「现状混用，以 X 为准，存量渐进收敛」；反哺蒸馏发现馆内缺陷按回灌飞轮先修馆再蒸馏）；**无法裁决须显式豁免**（vendored/第三方区域写明豁免于该规则）。项目原有规则文档（CONTRIBUTING/ARCHITECTURE/风格指南等）双向裁决：描述性分歧（文档说 X 存量做 Y）**实况优先**（复原对比对象是原仓库行为），规定性规则（新代码必须 X）**文档声称优先**；门面惯例文件物理保留原位、馆内卷 covers 锚定+摘要，非门面规则文档收编入馆；外部规则未入馆→先入馆再蒸馏，禁止跳馆转写。

**记忆快照链路（v0.8.0，F18 四区扩容）**：agent 会话收尾蒸馏双层快照 → 写 `.doclib/guide-memory.md`（frontmatter 携 `work-as-of`/`user-as-of` ISO 日期 + `window` 默认 30，**形状+语义双校验**（ISO 正则 + Date.parse）非法 fail-fast——REVIEW 轮 R-1：仅形状校验会放行 2026-13-45 类不可能日期且字典序永判不滞后）→ `doclib sync` 注入两份引导文件 memory 区（位于 project 与 custom 之间）。**近期工作记忆 ≤25 行**：当前焦点（feature-map in-progress #N + 载体路径 + 一句话进度）/近期完成（窗口内 implemented 一行一条 + progress 指针）/活跃注意（未闭合观察项）；**协作者画像 ≤12 行**：决策风格/沟通偏好/工作流习惯三类，只沉淀协作风格不写私人化评价。素材 v1=馆内/簿记已蒸馏层（progress 时间线+feature-map+in-progress .plan 细节——agent 读不违 F9，CLI 不解析——+.plan 拍板记录原话+98-sessions 旁证），OpenCode DB 回捞留 v2（#34）。**新鲜度 soft（仅 status）**：`work-as-of` 落后 progress 最新条目日期（`core/archival.ts` `latestProgressDate` 复用条目日期解析）→「⚠ 工作记忆滞后」；`user-as-of` 同法「⚠ 画像可刷新」——服务新鲜度≠事实源失真，不进 check 违规不进治理分。**反幻觉 soft 执法**：快照正文路径 token 逐个存在性核对（复用 lesson-source `SOURCE_PATH_TOKEN_RE` 词面与 trim 规则，`core/check.ts` `memoryPointerNotices`）→ `memory-pointer` notice，不进 strict。正文含区域保留标记 → 与 project 区同款三面分层（注入面 fail-fast/观测面降级 ⚠/执法面 fail-fast）。空状态合法：无簿记或正文空 → memory 区保持模板占位，不判违规。蒸馏执行者=agent 会话收尾（planstore 收尾动作 5 + doclib-dev 自检第 4 问扩义），CLI 零代写。

**双闸检测**（`doclib check` 强验证，strict 门禁可阻断）：

| 闸 | 判据 | 违规类 | 解除 |
| --- | --- | --- | --- |
| 蒸馏过期 | 簿记 `docs-hash` ≠ 当前馆内指纹（馆变了反哺没跟上） | `guide-feed-stale`（反哺过期） | 重新蒸馏更新簿记（含新 docs-hash）→ sync |
| 注入漂移 | 引导文件 project/managed/memory 区 ≠ 模板或簿记注入结果（直改或落后） | `guide-stale`（引导过期） | `doclib sync` 修复 |

**预算**：managed 区 ≤150 行、project 区 ≤50 行、memory 区 ≤40 行（`doclib status` 报告行数，超限 ⚠ 提示；managed 裁剪判据「删掉会犯错吗」，project 判据「会话冷启动真的每天都要知道吗」，memory 判据「新会话不刷新就会犯错吗——滚动快照非知识库，过期条目删不补」）。

**版本戳报告**（status/verify）：cli/structure 与当前不符 → 「过期 → doclib sync」。

## 怎么验收

| # | Given | When | Then |
| --- | --- | --- | --- |
| AC-1 | 全新目录 | `doclib init --agents claude,opencode` | 两份引导含三区标记，project 区为占位 |
| AC-2 | 旧两区引导（有戳有 custom） | `doclib sync` | 升级三区，custom 原样保留，project 注入 |
| AC-3 | 簿记 guide-project 存在 | `doclib sync` | 两份 project 区一致且等于注入结果 |
| AC-4 | 手工篡改引导 project 区 | `doclib check` → `doclib sync` | 报引导过期 → 修复归零 |
| AC-5 | 馆文档变更且簿记未更新 | `doclib check` | 报反哺过期；更新 docs-hash 后归零 |
| AC-6 | project 区超 50 行 | `doclib status` | ⚠ 超限提示 |
| AC-7 | 无 guide-project | `doclib check` | 不报反哺过期（无误报） |
| AC-8 | guide-project 正文含区域保留标记 | `doclib sync` / `doclib status` | sync exit 1 拒注且引导文件不被污染；status 降级 ⚠ 提示行；修正后恢复 |
| AC-9 | 簿记带合法走查账（12 卷全覆盖） | `doclib check` / `doclib status` | 无走查违规；status 反哺行报「走查 12/12」 |
| AC-10 | 走查账缺卷/未知卷/两集重叠/字段非法 | `doclib check` | 报「走查账违规」（`guide-feed-walk`），detail 精确列明问题卷名；strict 门禁可阻断 |
| AC-11 | 旧簿记无走查账字段 | `doclib check` | 仅 soft notice（不进违规不计治理分），status 报「走查 未留账 ⚠」——存量零破坏 |
| AC-12 | 全新目录 | `doclib init --agents claude,opencode` | 两份引导含四区标记，memory 区为占位（AC-1 四区化） |
| AC-13 | 簿记 guide-memory 存在 | `doclib sync` | 两份 memory 区一致且等于注入结果 |
| AC-14 | 手工篡改引导 memory 区 | `doclib check` → `doclib sync` | 报引导过期 → 修复归零 |
| AC-15 | guide-memory 正文含区域保留标记 | `doclib sync` / `doclib status` / `doclib check` | sync exit 1 拒注不污染；status 降级 ⚠；check fail-fast；修正后恢复（AC-8 三面同款） |
| AC-16 | memory 区超 40 行 | `doclib status` | ⚠ 超限提示 |
| AC-17 | work-as-of 落后 progress 最新条目日期 | `doclib status` | 记忆行报「⚠ 工作记忆滞后 → 刷新簿记后 sync」；user-as-of 同法「⚠ 画像可刷新」 |
| AC-18 | 快照指针 token 路径不存在 | `doclib check` | `memory-pointer` soft notice（不进 strict 违规不计治理分）；check 汇总行报「记忆指针警告 N」 |
| AC-19 | 无 guide-memory 簿记 | `doclib check` / `doclib status` | 零违规零报错（空状态合法）；status 记忆行报「未蒸馏」 |

## 参考

- CLI 命令：`doclib sync`（引导/skills 同步）· `doclib init`（骨架落位，见 [init-v2.md](init-v2.md)）· `doclib check`（强验证，见 [check.md](check.md)）
- 蒸馏执行者：`doclib-build` / `doclib-accept` skill 收尾步骤；本仓实例 `.doclib/guide-project.md`

> v0.10.0（#44）增量：引导 light 档 CLI 速查增 `branch` 词条（`assets/guides/light.md` 再生源先行，sync 注入两份引导）；分区契约与注入管线不变。
