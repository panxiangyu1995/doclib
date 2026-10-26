# 对话原始记录档案区与导出纪律（transcript-archive）

- 日期：2026-10-26
- 状态：规划完成（RIPER-5 RESEARCH→INNOVATE→PLAN；六项决策点按 INNOVATE 推荐代定，用户保留异议退回权），待 ENTER EXECUTE MODE
- 关联：feature-map #33/#34（待登记）；PRD F9 双轨边界（Q10/Q12 v0.17 拍板）；30-features/_index「.plan 检测与双锚点提醒」（待写，非本次范围）
- 来源：用户担忧「.plan 蒸馏层可能遗漏关键信息，长久之后无法找回」；提出对话 .md 导出关联 .plan/spec 的思路 + planstore.md 精细化诉求

## 一、目的与效果

1. 建立「蒸馏层（.plan）+ 原始层（对话导出）」双层保真：蒸馏遗漏时可回查原始记录。
2. 根除会话记录 30 天自动清理导致的关键信息永久丢失。
3. 会话 ↔ .plan 双向可查：导出文件名挂 plan slug + frontmatter 元数据反查源会话。
4. .plan 记录质量提升：planstore 指令从单行升级为栏目清单 + 反遗漏自检。
5. 与复原基准 P1「信息零遗漏」目标同向——对话记录是比 .plan 更原始的决策过程证据。

## 二、问题点

| # | 问题 | 证据 |
| --- | --- | --- |
| Q1 | 会话记录默认 30 天自动清理，不导出即真丢 | Claude Code `cleanupPeriodDays` 30d、Gemini CLI `sessionRetention.maxAge` 30d（官方文档明文） |
| Q2 | .plan 蒸馏无反遗漏约束——用户纠正、被否理由、失败尝试易在蒸馏中丢失 | planstore.md 全文仅 1 行，无栏目强制 |
| Q3 | 现行 F9 双轨边界「过程材料永不入馆」与馆内落位直接冲突 | prd.md F9（Q10/Q12，v0.17 拍板）；需新 ADR 修订 |
| Q4 | 各工具导出能力不对称：部分 TUI-only、部分无导出、部分闭源 | 研究矩阵（§三） |
| Q5 | 馆内落位触发治理面：文体门禁扫全 doclib/、两级索引要求 | src/core/check.ts:227 `checkGenreCompliance(root/doclib)` 实证 |
| Q6 | .claude/commands/ 不存在——planstore 纪律只在 opencode 侧生效 | 本地目录实测 |

## 三、研究结果

### 3.1 agent 工具会话导出能力矩阵

| 工具 | 会话存储 | 官方导出 | 格式 | 证据 |
| --- | --- | --- | --- | --- |
| OpenCode | SQLite `~/.local/share/opencode/opencode.db`（session/message/part 表；本机 v1.19.0 schema 实测） | ✅ TUI `/export`（ctrl+x x）+ CLI `opencode export [sessionID]` | TUI→Markdown；CLI→JSON（有 --sanitize） | opencode.ai/docs/tui + /docs/cli + 本机实测 |
| Claude Code | JSONL `~/.claude/projects/<编码路径>/<session-uuid>.jsonl`（type 10 类） | ✅ `/export`（可传文件名直写，v2.1.280+） | 纯文本 | code.claude.com/docs/en/sessions |
| Codex CLI | rollout 文件持久化（--no-persist 可关） | ✅ `/export`，`/export session.md` 直写 | Markdown | developers.openai.com/codex/developer-commands |
| Gemini CLI | `~/.gemini/tmp/<project_hash>/chats/` | ❌ 无导出命令（仅 /resume + checkpoint） | — | google-gemini/gemini-cli docs/cli/session-management.md |
| Aider | 项目目录内 | ✅ 原生 Markdown：`--chat-history-file` 默认 `.aider.chat.history.md`，路径可配 | Markdown | aider.chat/docs/config/options.html |
| Cline | `globalStorage/saoudrizwan.claude-dev/tasks/<id>/`（api_conversation_history.json 等） | UI 导出按钮（task 级） | JSON/MD | 本机目录实测 |
| Cursor | 本地闭源（生态第三方只读工具佐证） | ❌ 无官方导出 | — | gh search 交叉验证 |

### 3.2 关键事实

1. **30 天清理是普遍行为**（Claude Code、Gemini CLI 双实证）——Q1 的机制级依据。
2. **官方警告勿脚本解析原始格式**：Claude Code JSONL「entry format is internal and changes between versions」——官方推荐 /export 路径；批量工具（M2）对 Claude Code 需宽容解析 + 优雅降级。
3. **CLI 级可编程导出目前仅 OpenCode**（`opencode export` JSON）；Claude Code/Codex 的 /export 均为 TUI 交互命令。
4. Gemini CLI 开源（Apache-2.0）可提上游 PR；Cursor 闭源无 PR 通道。
5. OpenCode 存储布局跨版本漂移（本机 1.19 单 SQLite vs 文档 v2 project/<slug>/storage/）——工具格式漂移是普遍现象，M2 需版本探测。

### 3.3 治理面实证（馆内落位约束）

- 文体门禁扫**整个 doclib/**（check.ts:227）→ 新分区需豁免（99-archive/ledger 先例）。
- `doclib/` 自身不入代码快照（design.md:172）→ 馆内导出**不会**进快照/漂移账（免费好处）。
- 导出文件不 covers 代码路径 → 不参与文档账同步核对；不属 12 卷 → 不进 place 收编闭集（place.ts LIBRARY_VOLUMES）。
- feature-map「对应文档」列混合引用惯例（.plan 载体路径 + 馆内路径 + ` + ` 连接）→ 关联零改动兼容。

## 四、代码实际情况

- `.opencode/commands/planstore.md`：全文 1 行（七栏目蒸馏要求，无反遗漏自检、无导出动作）。
- `.plan/<日期>/` 产出样本：七栏目结构化文档，近期 6 篇 30~155 行（蒸馏质量靠 agent 自觉）。
- `.claude/commands/` 目录不存在；`.opencode/commands/` 另有 r5.md（RIPER-5 协议）/review.md/intest.md。
- `src/core/docquality.ts`：INDEX.md/README.md/_index.md 跳过链接扫描；文体豁免清单机制在 docquality 内（实施时读码对齐 99-archive 豁免，不臆造）。
- `src/core/assets.test.ts`：骨架断言清单枚举各卷 _index.md——加 98-sessions 需同步。
- 骨架文件计数（24/32 等）在 init-v2.md/overview/README×2/testing.md 多处出现——执行时全馆 grep 以实测为准修正。

## 五、设计方案

### 5.1 六项代定决策（用户可异议退回）

| 决策点 | 代定值 |
| --- | --- |
| 分区命名 | `doclib/98-sessions/`（98 序号=档案但未失效，与 99-archive 失效棺材对偶） |
| F9 修订口径 | β 白名单例外——边界不变，唯一例外：对话原始记录入 98-sessions 档案区 |
| 命名形态 | N3：文件名 `<slug>-<yyyymmdd>-<NN>.md` + frontmatter 五要素（type: transcript/tool/session-id/date/plan-slug） |
| 批量轨 | M2 立项（`doclib transcript`，仅 OpenCode 起步），本次只登记不实施 |
| 脱敏 | 保真优先：不默认改写 + 警示 + `--redact` 可选（随 M2 细化） |
| 分期 | M1（本次实施）→ M2 → M3 |

### 5.2 分期

- **M1 纪律与落位（本次）**：馆内 98-sessions 分区 + F9 修订（ADR #19）+ 文体豁免 + planstore 双侧重写（七栏目 + 反遗漏自检 + 会话收尾三动作）+ 馆内联动 + dogfooding。
- **M2 批量回捞（planned #34）**：`doclib transcript` 命令——OpenCode SQLite 渲染器（正文+关键工具调用摘要）、按 cwd 过滤、干跑默认 + --apply、未归档会话检测（status/transcript 提醒行，与双锚点提醒同构）、--redact 可选、Claude Code 宽容解析（格式探测 + 降级）、安全声明（首个读用户主目录的能力面，只读）。
- **M3 生态扩展**：Gemini CLI 上游 PR（/export 或 CLI export）候选登记；Cursor 闭源如实标注仅人工轨。

### 5.3 关联闭环

会话收尾三动作：① agent 提醒用户执行 per-tool 导出（OpenCode `/export` → 编辑器另存；Codex/Claude Code `/export <文件>` 直写；Aider 原生文件复制）至 `doclib/98-sessions/`；② 文件命名 `<slug>-<yyyymmdd>-<NN>.md` + 补 frontmatter 五要素；③ .plan 文档头部登记导出文件名（双向可查；feature-map/progress 现行惯例零改动）。

## 六、有无备选方案

| 备选 | 否决理由 |
| --- | --- |
| F9 修订 α：全量重写「过程材料可入馆」 | 破坏「载体与图书馆互不侵扰」基石，波及面过大 |
| F9 修订 γ：论证对话记录属事实源非过程材料 | 语义牵强，对话明显是过程 |
| 落位 L2：既有卷下子分区 | 无天然归宿卷（对话是全项目级材料）；卷语义被稀释 |
| 落位 L3：馆内根级小写目录 | 破坏数字前缀命名纪律，孤儿/索引判定面歧义 |
| 落位馆外独立目录（如 .conversations/） | 用户明确选馆内；且需 ack/声明治理配置；与「凭 doclib/ 复原」目标相悖（原始证据离开馆） |
| 管线 P1：纯纪律不落工具 | 本仓 v0.5.0 忘装钩子实证「机制在、执行不在岗」——单靠纪律重蹈覆辙 |
| 管线 B1：一次性脚本散件 | 不入产品、无验收、无测试，违背本仓工程纪律 |
| 管线 B3：仅包装 opencode export（JSON）转 md | JSON 全量仍需裁剪渲染，省不了核心工作，多一道格式依赖 |
| 命名 N1：日期+序号（无元数据） | 机器无法精确反查源会话 |
| 命名 N2：会话 ID 短码做文件名 | 人读差，无法从文件名感知日期与归属 |

## 七、实施清单

```
实施清单：
1. 落盘规划文档 .plan/2026-10-26/transcript-archive.md（本文件）
2. 新建 doclib/98-sessions/_index.md（frontmatter: title/covers:[]/status:living/type:index；
   正文：定位=对话原始记录档案区 / 命名规范 / frontmatter 五要素 /
   与 .plan 双向关联规则 / 隐私警示）
3. 新建 assets/templates/library/98-sessions/_index.md（通用项目口径模板）
4. src/core/docquality.ts：98-sessions 入 checkGenreCompliance 豁免面
   （先读码对齐 99-archive 豁免机制再改，不臆造）
5. src/core/docquality.test.ts：+1 用例（98-sessions 下 .md 不触发文体违规）
6. src/core/assets.test.ts：骨架断言 +98-sessions/_index.md + 计数同步
7. 重写 .opencode/commands/planstore.md：七栏目保留 + 反遗漏自检
   （用户纠正与拍板理由/被否方案及理由/失败尝试/验收口径变更/跨会话前情）
   + 会话收尾三动作（§5.3）
8. 新建 .claude/commands/planstore.md（与 7 内容一致）
9. prd.md：F9 双轨边界段补「唯一例外：对话原始记录入 98-sessions 档案区」
   + 版本号推进 v0.35 + 版本历史表加行（关联本 .plan 与 #33）
10. decisions.md：ADR #19 登记（背景：30 天清理实证 + 蒸馏遗漏风险 + 复原 P1 同向；
    决策：98 分区 + N3 命名；被否备选：α/γ/L2/L3/馆外；后果：文体豁免 + 索引 + 隐私自检责任）
11. design.md：.plan 注释行与双层结构叙述补对话档案例外
12. 新建 doclib/40-guides/transcripts.md（narrative 教科书五段）：
    为什么（清理机制+遗漏风险）/ 是什么（98 分区+双轨）/ 怎么运转（per-tool 导出操作 +
    关联规范）/ 怎么验收（AC）/ 生态路线段（Gemini PR 候选 / Cursor 闭源标注 / M2 预告）
13. INDEX.md + 40-guides/_index.md 两级索引登记（行格数按各表头列数）
14. feature-map.md：#33 对话档案区与导出纪律（in-progress）+ #34 transcript 批量回捞
    （planned；描述含 OpenCode 渲染器/干跑默认 --apply/未归档会话检测/--redact 可选/
    Claude Code 宽容解析/Gemini PR 路线）
15. progress.md：时间线补记（锚点一登记，关联本 .plan 路径）
16. config.md：分区语义表 +98-sessions 行（不入快照/不入漂移/文体豁免）
17. AGENTS.md/CLAUDE.md custom 区各加对话导出纪律一行（预算内）
18. 全馆 grep 骨架文件计数 → 实测后逐一修正（init-v2/overview/README×2/testing）
19. npm run typecheck + npm test 全绿
20. 冒烟（临时目录）：init --agents claude,opencode → 98-sessions 在馆 → check 违规 0 →
    构造样例导出落位 → check 仍 0（豁免实证）→ 双侧 planstore.md 落位核对
21. 本仓 dogfooding：本会话导出为
    doclib/98-sessions/transcript-archive-20261026-01.md（首个档案，frontmatter 五要素）+
    本 .plan 文档头部登记该文件名
22. doclib check（违规 0、治理不降）→ doclib snapshot 固化
23. REVIEW 逐项核对清单 1-22
```

## 八、验收标准

- AC-TA1 Given 临时目录 `doclib init` When 完成 Then 馆内含 `98-sessions/_index.md` 且 check 违规 0
- AC-TA2 Given `98-sessions/` 下存在不合文体五段的 .md When `doclib check` Then 不触发 genre 违规（豁免实证）
- AC-TA3 Given 会话收尾 When agent 执行 planstore 指令 Then 完成导出提醒 + 落位 98-sessions + .plan 头部登记（双向关联闭环）
- AC-TA4 Given 双侧 planstore.md When 逐字节对比 Then 内容一致
- AC-TA5 Given prd.md/decisions.md/design.md When 核对 Then F9 例外句 / ADR #19 / design 例外叙述三处齐备
- AC-TA6 Given 全馆 When grep 骨架文件计数 Then 无失真残留（以 assets.test.ts 实测为准）
- AC-TA7 Given `npm run typecheck` + `npm test` When 执行 Then 全绿
- AC-TA8 Given 本仓 dogfooding When 本会话收尾 Then `doclib/98-sessions/transcript-archive-20261026-01.md` 落位且 frontmatter 五要素齐备
- AC-TA9 Given `doclib check` → `doclib snapshot` When 收尾 Then 违规 0、治理分不降、基线固化
- AC-TA10 Given feature-map/progress.md When 核对 Then #33 in-progress、#34 planned、时间线补记在案

## 会话导出登记

- 导出文件：doclib/98-sessions/transcript-archive-20261026-01.md（清单 21 落位）
