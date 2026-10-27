# 记忆快照与协作者画像反哺（guide-memory-snapshot）

- 日期：2026-10-27
- 状态：已归档（#40 implemented，snap-080；23 步清单+根治+REVIEW R-1..R-4 全修，实测 350/350）

## REVIEW 轮留痕（2026-10-27，用户指令「对本次更改做漏洞审查」→「都修了」）

双轨审查：计划符合性（23 步+根治轮逐项对齐，偏差 P-1 测试分布/P-2 冒烟前置/P-3 三次 snapshot/P-4 计划外联动文件——均已留痕）+ 漏洞猎捕（4 命中 4 解除）。

| 项 | 级别 | 发现与修复 |
| --- | --- | --- |
| R-1 | 中 | readGuideMemory 日期仅形状校验——2026-13-45 放行且字典序永判不滞后 → Date.parse 语义校验 fail-fast + 回归（guides.test） |
| R-2 | 低 | 界定符家族未闭合：ASCII 引号吞界定符、「」吞尾随文本（lesson-source 同病先在）→ 字符集补 " ' 「 」，四形态回归双面 |
| R-3 | 低 | token 含 `..` 穿越 → stat 根外路径+检测盲区（共享既有特征）→ 穿越 token 直接判违规/提示不 stat（共享防御）+ 回归 |
| R-4 | 低 | managed 模板自检句「四问」与 skill「五问」#38 期漂移 → 模板五问化（含记忆快照）sync 再生 |
| 解除 | — | verify 无 memory 面｜全局正则 lastIndex 安全｜双闸/预算/合并/legacy/init 行为一致｜错误插值无注入面 |
- 关联：feature-map #40（本轮登记）｜#32 反哺三区契约｜#37 开发宪法与走查账｜#33/#34 会话档案与批量回捞｜#38 来源行执法｜PRD v0.41（F18）｜ADR #25
- 来源：用户指令「项目近期内容实施了什么我都是先规划成 .plan 规划文档且是按文档实施的，所以项目的 memory 管理我觉得可以总结近 10-30 天的 .plan 成记忆快照到 claude.md 和 agents.md 文档中，这样每次开始新的会话不会有之前记忆的丢失……最好再加上总结我们几次对话的语气，和我的习惯也做份快照」+「可以使用 context7 mcp 和 gh cli 获取相关信息作为参考」+「近期修改我们是有做将 doclib/98-sessions 目录中保存完整对话的」
- 规划载体：本对话（RIPER-5 RESEARCH → INNOVATE → PLAN → EXECUTE；planstore 纪律落盘）
- 关联产物：`src/core/guides.ts` · `src/core/archival.ts` · `src/core/check.ts` · `src/commands/{status,check}.ts` · `assets/guides/light.md` · `package.json` · `skills/doclib-dev/SKILL.md` · `.opencode/commands/planstore.md` + `.claude/commands/planstore.md` · `doclib/{30-features,10-architecture,00-overview,20-modules,50-testing,INDEX.md}`

## 会话导出登记

- 导出文件名：guide-memory-snapshot-20261027-01.md（已落位 doclib/98-sessions/，frontmatter 五要素齐备）
- 敏感信息自查：本会话段无密钥/token/凭据；导出件词面甄别（63 处命中均为源码/术语文本，无 sk-/ghp_ 真密钥格式）——无警示

## 跨会话前情

| 前情 | 文件指针 | 依赖点 |
| --- | --- | --- |
| 三区契约与反哺注入机制（#32） | `.plan/2026-10-26/guide-feed.md` + ADR #18 | 第四区完全复用其注入管线/保留标记 fail-fast 三面分层/空状态合法语义 |
| 开发宪法与 12 卷走查账（#37） | `.plan/2026-10-26/guide-constitution.md` + ADR #22 | 反哺区蒸馏模式先例；走查账机制证明簿记 frontmatter 可承载执法字段 |
| 会话档案区与导出纪律（#33） | `.plan/2026-10-26/transcript-archive.md` + ADR #19 | 98-sessions 作为画像素材旁证源；30 天清理实证（时间敏感结论） |
| 批量回捞规划（#34） | `.plan/2026-10-26/transcript-archive.md`（§5.2） | v2 素材升级路径（OpenCode DB session/message/part 三表），v1 不碰 |
| 来源行 token 存在性执法（#38） | `.plan/2026-10-26/lesson-realtime.md` + ADR #23 | 快照指针存在性核对复用 `SOURCE_PATH_TOKEN_RE` 词面与 trim 规则 |
| 引导预算体系（#30） | PRD F5 + `assets/guides/light.md` | 记忆区独立预算 40 行的契约基础 |

## 一、目的与效果

1. 消除新会话冷启动记忆丢失：近 10-30 天工作轨迹（当前焦点/近期完成/活跃注意）与协作者画像（决策风格/沟通偏好/工作流习惯）以快照形式常驻 CLAUDE.md/AGENTS.md，新会话零动作即得。
2. 快照是蒸馏物不是事实源：progress.md/feature-map/.plan/拍板记录仍是唯一事实源，快照每条附真实路径指针可回溯，check 软执法防「记忆编造」。
3. 与现有反哺体系同构共生：第四保留区 + 簿记单源 + sync 注入 + soft 新鲜度提醒，复用三区契约全部既有机制，不新增命令。

## 二、问题点（研究实证）

1. 反哺区只蒸馏「图书馆静态状态」（六段：定位/架构/模块/宪法/命令），**无任何「近期工作轨迹」语义**——新会话对「最近 10-30 天做了什么」零知识，需主动读 progress.md/.plan 才能重建。
2. 用户习惯/语气素材大量存在（.plan 拍板记录 24 份 × 原话保留；OpenCode DB 本仓 285 会话/24,919 条消息/近 14 天 4,035 条），但无任何机制把它蒸馏成冷启动可加载形式。
3. 现有新鲜度锚点 `docs-hash = fingerprintOf(doclib/**/*.md)`（`src/core/check.ts:217`）结构上不覆盖 .plan 与会话素材（F9：载体不入馆不进快照）——快照需独立新鲜度机制。
4. project 反哺区预算 50 行已用 32 行（余量 18 行），工作记忆 + 用户画像装不下；「滚动状态」与「项目知识」混排违背 Cline activeContext/projectbrief 分置与 Claude Code 索引/主题分置先例。
5. 会话原始层时间敏感：Claude Code transcript 默认 30 天自动清理（`doclib/40-guides/transcripts.md` 实证）；98-sessions 人工轨仅 3 份——依赖导出件的机制不稳定，v1 素材必须以馆内/簿记已蒸馏层为主。

## 三、研究结果（代码与外部）

**代码实际情况**：

| 事实 | 位置 | 与本功能的接口 |
| --- | --- | --- |
| 三区标记/预算常量/`readGuideProject` fail-fast 契约/`applyProjectRegion`/`renderFullGuide` 注入 | `src/core/guides.ts:14-28,41-74` | 第四区逐一同构扩展；`REGION_MARKERS` 扩两项即让标记污染校验自动覆盖 |
| 注入漂移检测 `managedRegionFresh` 比对 managed+project 区 | `src/core/guides.ts:162-180` | 扩 memory 区比对 → 直改报 guide-stale |
| 双闸 check：guide-feed-stale（docs-hash）/guide-stale | `src/core/check.ts:210-226` | 记忆滞后不进 check（服务新鲜度≠事实源失真）；指针存在性走 notices（soft） |
| soft notice 机制与「豁免与提示」汇总 | `src/core/check.ts:16-54` + `src/commands/check.ts:89-116` | `memory-pointer` 按 assumption-draft 先例接入 |
| progress 条目日期解析 `ENTRY_SPLIT_RE`/`ENTRY_DATE_RE` | `src/core/archival.ts:14-15` | 导出 `latestProgressDate(root)` 复用，零重复解析器 |
| status 反哺行三态（未蒸馏/正常/异常降级）与 json `guides` 载荷 | `src/commands/status.ts:36-59,124` | 「记忆」行同构三态 |
| planstore 收尾四动作（双侧同文） | `.opencode/commands/planstore.md` + `.claude/commands/planstore.md` | 扩五动作（+记忆快照刷新） |

**数据源盘点（实测）**：`.plan/` 近 30 天 24 份约 4000 行（拍板记录节保留用户原话）；`doclib/98-sessions/` 3 份导出；OpenCode DB `~/.local/share/opencode/opencode.db` 本仓 285 会话/24,919 消息（session/message/part 表，#34 已登记形态）。

**外部调研（context7 + gh 实证）**：

1. **Claude Code 原生 auto memory**：`~/.claude/projects/<project>/memory/` 下 MEMORY.md 索引（每会话自动加载，一行一条）+ 主题文件；`autoMemoryEnabled`/`autoMemoryDirectory` 设置；`@path` import 语法（仅 Claude Code）。启示：索引常驻+主题按需是官方 token 预算模式；但存用户主目录且工具私有，与「馆为准」哲学冲突。
2. **Cline Memory Bank**（社区事实标准，920★ MCP 衍生）：六核心文件层级，`activeContext.md`=当前工作焦点/近期变更/下一步/活动决策，任务收尾更新——与用户诉求同构；印证「近期状态」独立于「项目知识」成文。
3. **kuitos/opencode-claude-memory**（75★，已下架）：OpenCode 与 Claude Code 共享 Markdown 记忆——跨工具共享记忆是已验证真实需求（本仓 .claude/ 与 .opencode/ 双侧同文即同一诉求）。
4. **OpenCode 可编程访问面**：`opencode export [sessionID]`（JSON，--sanitize）+ DB 18 表——v2 素材升级通道。

## 四、方案设计

**双层记忆快照 + 引导第四区（8+1 项拍板见 §六）**：

- **落位**：簿记新文件 `.doclib/guide-memory.md`（与 guide-project.md 同构：真相单源在簿记，sync 注入引导；不落馆内——快照是 progress/.plan 的投影，馆内落位=双写漂移）。
- **注入**：引导文件第四保留区 `<!-- doclib:memory-begin -->`/`<!-- doclib:memory-end -->`（位置：project 区与 custom 区之间）；`renderFullGuide` = 模板 → 注 project → 注 memory；`mergeGuide` 不改（memory 区随模板整体再生）；`managedRegionFresh` 扩 memory 比对（直改 → guide-stale → sync 修复）。
- **簿记 frontmatter 契约**：`work-as-of`/`user-as-of`（ISO 日期，非法 fail-fast）+ `window`（默认 30，仅展示）；正文两段——「近期工作记忆」（≤25 行：当前焦点=in-progress #N+载体路径 / 近期完成=30 天 implemented 一行一条 / 活跃注意=未闭合观察项）+「协作者画像」（≤12 行：决策风格/沟通偏好/工作流习惯三类，不写私人化评价）；正文空=未蒸馏（空状态合法）；正文含任一区域保留标记 → DoclibError（三面分层：注入面 fail-fast / 观测面降级 ⚠ / 执法面 fail-fast——与 guide-project D-1 修复同款）。
- **新鲜度（soft，仅 status）**：`work-as-of < progress 最新条目日期` → 「⚠ 工作记忆滞后 → 刷新簿记后 sync」；`user-as-of` 同法报「⚠ 画像可刷新」；不进 check 违规、不进治理分。
- **反幻觉执法（soft）**：快照正文路径 token（复用 archival `SOURCE_PATH_TOKEN_RE` 词面与 trim 规则）逐个 stat 核对，不存在 → `memory-pointer` notice（不进 findings/strict/治理分）；check「豁免与提示」汇总行报「记忆指针警告 N」。
- **预算**：memory 区 ≤40 行独立预算（managed 150/project 50 不变），`guideBudgetReport` 增报。
- **素材边界（v1）**：馆内/簿记已蒸馏素材——progress.md 时间线（骨架）+ feature-map 状态（焦点）+ in-progress .plan 载体（细节，agent 读，CLI 不解析 F9 合规）+ .plan 拍板记录节（画像主素材）+ 98-sessions 现有导出件（旁证，有则用）；OpenCode DB 回捞留 v2（#34 落地后）。
- **蒸馏执行者**：agent（会话收尾，planstore 五动作；机器出候选不代写哲学）；CLI 只做检测/注入/软执法。
- **版本 0.8.0**（引导契约三区→四区变更）。

## 五、备选方案与被否理由

1. M2 并入现有反哺区加段：余量 18 行装不下；滚动状态与项目知识混排违背 Cline/官方分置先例；新鲜度语义不同互相污染检测。
2. M3 馆内新分区：快照是投影不是事实源，馆内落位=与 progress.md 双写漂移，违反单一事实源。
3. M4 仓库根独立 MEMORY.md：Claude Code 只自动加载 CLAUDE.md、opencode 只自动加载 AGENTS.md——独立文件不进冷启动上下文，「零记忆丢失」目标直接失效。
4. E2 managed 区一行指针（agent 自行读簿记）：省预算但依赖 agent 服从性，冷启动多一步且可能被跳过——「兜底不是用来依赖的」要防的形态。
5. E3 Claude Code `@import` 引导引用簿记：已验证仅 Claude Code 支持（context7 官方文档），opencode 无此机制——双工具行为分裂，违背引导双侧同文原则。
6. F2 复用 docs-hash 指纹管记忆新鲜度：图书馆没变但工作推进（未 snapshot）时记忆也该刷；.plan 变更不触发指纹；语义不匹配。
7. F3 记忆滞后进 check strict：记忆滞后是服务新鲜度不是事实源失真（反哺过期 strict 的正当性在于馆与引导失配）；strict 会告警疲劳。
8. 启用 Claude Code 原生 auto memory（autoMemoryDirectory 指进仓库）：工具私有（opencode 无对应物）、Claude 自主写入不受「馆为准」约束、与簿记双写。
9. CLI 全自动生成快照：拍板理由/语气蒸馏是语义裁决不是文本抽取，违反「机器出候选不代写」哲学。
10. 快照进 skill（doclib-dev 收尾时注入对话）：只在加载该 skill 的会话生效，冷启动失效。
11. v1 直接读 OpenCode DB 挖画像：scope creep 与 #34 规划冲突；.plan 拍板记录已是高质量蒸馏层，解决 80% 诉求。
12. 工作记忆与画像拆两个簿记文件/两个保留区：节奏不同但体量小，两文件两区域=簿记与契约面翻倍无必要；单文件两段+双 as-of 已表达节奏差。

## 六、用户拍板记录

提问于 INNOVATE 轮 8 项决策点，用户拍板「按推荐，进入计划模式」（原话保留要点）：

| # | 决策点 | 拍板 |
| --- | --- | --- |
| 1 | 落位 | M1 簿记新文件 `.doclib/guide-memory.md` |
| 2 | 注入 | E1 引导第四保留区，sync 注入 |
| 3 | 预算与结构 | ≤40 行（工作 ≤25 + 画像 ≤12） |
| 4 | 工作记忆窗口 | 30 天（frontmatter 可调） |
| 5 | 新鲜度 | F1 双 as-of + status soft 提醒 |
| 6 | 反幻觉执法 | 快照指针 token 存在性核对，soft（推荐项） |
| 7 | 素材边界 | v1 只用馆内/簿记素材，DB 回捞留 v2 |
| 8 | 用户画像口径 | 沉淀「协作风格」三类，不写私人化评价 |
| 9 | PLAN 批准 | 「按推荐，进入计划模式」→「进入执行模式」 |

## 七、实施清单（23 步）

1. 创建 .plan/2026-10-27/guide-memory-snapshot.md（本文件）并按双锚点登记
2. feature-map 登记 #40 planned + progress.md 补记（锚点一）
3. PRD v0.41：F18 条款 + F5 区域契约三区→四区 + 修订记录行 + 术语表三词条 + Q49–Q53
4. ADR #25 入 decisions.md
5. 扩写 doclib/30-features/guides.md（memory 行规格 + 记忆链路 + AC-12..19）
6. 修订 doclib/30-features/check.md（豁免与提示增 memory-pointer 行）
7. src/core/guides.ts：第四区标记/常量/GuideMemory/readGuideMemory/applyMemoryRegion/renderFullGuide 注入/managedRegionFresh 扩面/guideBudgetReport 扩行/REGION_MARKERS 扩两项
8. src/core/archival.ts：导出 latestProgressDate(root)
9. src/core/check.ts：memoryPointerNotices + CheckNoticeKind "memory-pointer" + runCheckCore 接线
10. src/commands/status.ts：「记忆」行三态 + json guides.memory
11. src/commands/check.ts：豁免与提示增「记忆指针警告 N」
12. 单测 +13（guides 6/check 3/status 3/sync 1，全部入既有测试文件）
13. assets/guides/light.md：memory 保留区占位 + managed 引导维护行四区分工
14. npm run build + typecheck + test 全绿
15. package.json 版本 0.7.0 → 0.8.0
16. planstore 双侧收尾四动作→五动作（逐字节一致）
17. skills/doclib-dev 五问扩义 + doclib/40-guides/transcripts.md 五动作表述
18. INDEX.md + 20-modules/_index.md 联动
19. 临时目录冒烟 9 场景
20. doclib/50-testing/testing.md + cli-acceptance-suite.md
21. 本仓 dogfooding：蒸馏首份 .doclib/guide-memory.md → sync → check 治理核验
22. 归档闭环：#40 → implemented + progress 补记 + strict 通过 + snapshot
23. 会话收尾五动作自证 + 导出提醒登记

## 八、验收标准

规范锚点：`doclib/30-features/guides.md` AC-12..19（v0.8.0 增量）。

- AC-12 Given init 新馆 When 完成 Then 引导文件含四区标记且 memory 区为占位
- AC-13 Given 簿记 guide-memory 存在 When doclib sync Then 两份引导 memory 区一致且等于注入结果
- AC-14 Given 手工篡改引导 memory 区 When doclib check → sync Then 报引导过期 → sync 修复归零
- AC-15 Given 簿记正文含区域保留标记 When sync/status/check Then sync exit 1 拒注不污染；status 降级 ⚠；check fail-fast；修正后恢复
- AC-16 Given memory 区超 40 行 When doclib status Then ⚠ 超限提示
- AC-17 Given work-as-of 落后 progress 最新条目日期 When doclib status Then 记忆行报「⚠ 工作记忆滞后」
- AC-18 Given 快照指针 token 路径不存在 When doclib check Then memory-pointer soft notice（不进 strict 违规不计治理分）
- AC-19 Given 无 guide-memory 簿记 When check/status Then 零违规零报错（空状态合法）

## 失败尝试与踩坑（踩坑一行制：日期 + 现象一句话，实时回填）

- 2026-10-27 · archival.ts 导出 SOURCE_PATH_TOKEN_RE 时新增 export 行未删原 const 声明 → TS2451 重复声明，typecheck 拦截（教训去向：收尾蒸馏 lessons）
- 2026-10-27 · .plan 文档落盘时遗漏「失败尝试与踩坑」节（规划规格有、落盘漏写），踩坑一行制首次回填时发现补建——反遗漏自检五项的执行面价值自证
- 2026-10-27 · .doclib/guide-memory.md 快照路径用反引号包裹 → SOURCE_PATH_TOKEN_RE 截断字符集不含反引号，token 尾部带入界定符致 8 项指针 stat 失配（memory-pointer 与 lesson-source 共享词面同源缺陷）——用户拍板「顺手根治」同轮解决：字符集补反引号/星号 + 回归（check 1 例/archival 扩 2 场景块）+ lessons 界定符书写形态族纪律；快照恢复反引号包裹书写
- 2026-10-27 · 归档时序踩坑：先 doclib snapshot 后刷新反哺 docs-hash → snap-075 带着最后一项反哺过期固化——修正链路后重 snapshot（归档正确顺序=check 违规 0 在前、snapshot 在后）
- 2026-10-27 · REVIEW 轮 R-3 回归测试 json 类型注解漏 findings 字段 → TS2339，typecheck 拦截（与 #38 显式测试列表同族「测试也是产品面」教训——去向：重申既有教训不入新条）
