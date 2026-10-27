# 教训实时性：一行制 + 收尾核对 + 来源行执法（lesson-realtime）

- 日期：2026-10-26
- 状态：规划完成，用户已拍板（α+β+γ+δ 一步到位 + 双落点），执行中
- 关联：feature-map #38（本轮登记）｜#36 教训账缺口（执法基座）｜#37 guide-constitution（本问题显影场）｜ADR #21/#23｜planstore 三段纪律
- 来源：用户研究指令「经验教训为什么刚才没有记录进 lessons.md？怎么解决这种情形？在agents.md和claude.md中强调一下有用么？」
- 规划载体：本对话（RIPER-5 RESEARCH → INNOVATE → PLAN → EXECUTE；planstore 纪律落盘）
- 关联产物：`src/core/archival.ts` · `src/core/ledger.ts` · `src/commands/check.ts` · `src/core/archival.test.ts` · `assets/templates/library/95-lessons/lessons.md` · `.opencode/commands/planstore.md`（双侧） · `skills/{doclib-dev,doclib-audit}/SKILL.md` · `doclib/95-lessons/lessons.md` · `doclib/30-features/check.md` · `doclib/10-architecture/{decisions,prd}.md` · `doclib/INDEX.md` · `doclib/20-modules/_index.md` · `doclib/50-testing/testing.md` · `package.json`

## 会话导出登记

- 导出文件名：本项与 #37 同一 session（ses_e88a…）同一 .plan 纪律下连续执行——会话终局导出统一落 **doclib/98-sessions/guide-constitution-20261026-02.md**（plan-slug 沿主载体，frontmatter 五要素：type: transcript / tool: opencode / session-id: ses_e88a… / date: 2026-10-26 / plan-slug: guide-constitution），本文件不单独导出（登记于此防遗漏）
- 敏感信息自查：本会话段无密钥/token/凭据；无警示

## 跨会话前情

| 前情 | 文件指针 | 依赖点 |
| --- | --- | --- |
| #37 宪法反哺会话（同一 session 前半场） | `.plan/2026-10-26/guide-constitution.md` | 问题显影场：.plan 第九节「实时补记」承诺空置 + lessons 轮末批量——本项直接诱因 |
| 教训账缺口不变量（#36） | `.plan/2026-10-26/lesson-gap-enforcement.md` + ADR #21 | δ 完全复用其 epoch 模式/存在性判定/存量零破坏哲学；来源: 行可选约定是 δ 的升格基座 |
| 纯自觉三次实证失效 | ADR #20 背景、ADR #21 被否备选③、本轮研究第三次 | 「再次强调」被否的依据 |
| F9 不解析载体 | PRD §F9 + ADR #21 被否备选① | δ 只做 .plan 路径存在性（仓库根解析），不解析内容——硬约束 |

## 一、目的与效果

1. 补齐教训链路「何时记」的执法盲区：#36 管「记了没」，本项管「上游素材不丢」与「记了可回溯」。
2. 踩坑上游素材实时保真：踩坑当下 `.plan` 第九节记一行（β 一行制，成本降到可执行）——防会话中断永久丢失（风险 A）。
3. 收尾强制核对（α 四动作）：坑必已回填、已入档或声明去向——中断窗口缩小到两次收尾之间。
4. lessons 条目可回溯机器化（δ）：epoch 后条目必带 `来源:` 行且路径真实存在（存在性判定，F9 合规）——防幻觉路径，双向闭环（progress→lessons 已有，lessons→来源→上游补齐）。
5. audit 语义兜底（γ）：来源行所指上游与坑的语义对应人核。

## 二、问题点（研究实证）

| # | 问题 | 证据 |
| --- | --- | --- |
| P-1 | 用户指控「教训没入 lessons.md」与磁盘事实不符（两条在馆 + check 引用命中），但 .plan 第九节承诺空置实质成立 | grep 两条在 L140/L148 + strict 通过 = 引用存在性命中；.plan 第九节仍为「无」 |
| P-2 | 入档时机轮末批量非实时（3 个执行轮踩坑延迟记录） | lessons 均收尾 cat >> 批量追加 |
| P-3 | 「记了没」有执法、「何时记」零执法 | #36 判定面无时效维度 |
| P-4 | 纯强调第三次无效 | managed 区第 14 行实时强调在岗仍延迟（研究轮证据链） |
| P-5 | lessons 来源行 8/10 已有、仅 2-3 条缺（POSIX sh/幂等 chmod/验证 CLI 副作用） | grep 来源行与标题对位 |
| P-6 | 来源行存在幻觉路径风险（无校验） | 既有条目无任何存在性核对 |

## 三、方案设计（拍板：α+β+γ+δ + 双落点）

**β 一行制**：踩坑当下 .plan 第九节记一行现象（10 秒）；lessons 四段蒸馏留收尾。
**α 收尾四动作**：planstore 三动作扩四动作（+踩坑回填与教训入档核对）。
**γ audit 第 10 项**：教训上游完整性抽查（来源行 ↔ .plan 第九节语义对应，人核）。
**δ 来源行执法**：lessons.md 头部落 `<!-- doclib:lesson-source-epoch: YYYY-MM-DD -->`（缺席不活跃/非法 fail-fast，与 lesson-epoch 同构）；epoch 后条目（标题日期 ≥ epoch）缺 `来源[:：]` 行 → 新违规类 `lesson-source`（第 14 类）；有来源行则路径 token（`doclib/|.plan|.doclib|src|skills|assets|dist|migrations|test/` 前缀）逐个存在性核对（doclib/ 前缀按馆、其余仓库根），任一失效违规；无路径 token 合法（描述性来源）。实现落 archival.ts 并入 archivalFindings 单点返回（check.ts 核心零改动）。

## 四、备选与被否理由

| 备选 | 否决理由 |
| --- | --- |
| check 解析 .plan 第九节内容 | 违 F9 不解析载体（ADR #21 被否备选①原文）——一票否决 |
| mtime 时效执法 | Q23 已拍板 soft（语义错位噪音大，ADR #20） |
| commit-msg 关键词拦截 | #21 被否备选②（启发式误报漏报不可控） |
| 再次 managed 强调 | 第三次重复已实证无效手段 |
| 每坑写完整 lessons 四段 | 成本实证过高（本轮连轮末批量都延迟） |
| 来源行全量追溯（存量无来源全部违规不豁免） | 违存量零破坏先例（ADR #3/#21）→ epoch 日期内条目补齐而非追溯更早 |

## 五、实施清单

22 步（见对话计划，此处留档要点）：载体/登记 → archival.ts δ → ledger/check 注册 → 测试六场景 → 冒烟 → 模板 epoch → 本仓落标记+存量补来源 → .plan 违约回填 → planstore 四动作双侧 → doclib-dev 五问 → audit 第 10 项 → sync+版本 0.6.4 → check.md 14 类 → ADR #23/PRD v0.39 → INDEX/20-modules/testing → progress/lessons 自我实践 → #38 implemented → snapshot。

## 六、验收标准

| # | Given | When | Then |
| --- | --- | --- | --- |
| AC-1 | lessons.md 无 source-epoch 标记 | doclib check | 不变量不活跃，零违规（存量零破坏） |
| AC-2 | 标记日期非法 | doclib check | fail-fast DoclibError |
| AC-3 | epoch 后条目缺来源行 | doclib check | 报「教训来源缺失」（lesson-source），strict 可阻断 |
| AC-4 | 来源行路径 token 不存在 | doclib check | 违规 detail 列失效路径（防幻觉） |
| AC-5 | 来源行为纯描述（无路径 token） | doclib check | 合法（如「progress 2026-10-26 hook REVIEW 轮（D-02）」） |
| AC-6 | 条目日期 < epoch | doclib check | 豁免（存量零破坏） |
| AC-7 | planstore 双侧 | diff | 逐字节一致 |
| AC-8 | 本仓落标记后 | doclib check | 违规 0（存量已补齐）· 治理 100/100(A) · strict 通过 |

## 七、反遗漏自检（五项核对）

1. **用户纠正与拍板原话要点**：Q-A「α+β+γ+δ 一步到位」（延续此前 γ 风格）；Q-B「双落点（planstore+doclib-dev）」；「进入创新模式/计划模式/执行模式」推进信号 ✓（本节+第四节记录）
2. **被否方案及理由**：第四节六项全录 ✓
3. **失败尝试与踩坑**：本会话前半场 3 坑已回填 guide-constitution.md 第九节（第 12 步执行）；本项执行轮踩坑实时按 β 一行制补记本节第八节 ✓
4. **验收口径变更过程**：无变更（研究→创新→计划一脉）✓
5. **跨会话前情**：第一节表格四指针 ✓

## 八、失败尝试与踩坑（β 一行制实时补记）

- （执行轮实时追加位）
- 2026-10-26 δ 实现：来源行路径 token 正则漏全角左括号「（」——`doclib/...md（F-1）` 的 token 吞进括号致 stat 误判失效；修复=排除集补（(【[。教训方向：CJK 全角标点在「路径 token 截断集」里左右括号必须成对出现，漏一半即半个 token
- 2026-10-26 冒烟脚本 zsh 变量：CLI="node /path..." 后 $CLI 整体当一个命令名（沿用 #37 轮已踩过的同一坑——验证 β 价值：一行制若在 #37 轮就执行，本轮不会重踩）
