# 图书馆文体学与可读性门禁（genre-system）

- 日期：2026-10-23
- 状态：规划完成，待批准执行（EXECUTE 未启动）
- 关联：PRD §7（双层结构）§3（目标用户）F1（build）F3（rebuild）F4（verify）Q26（条目格式）→ **F17 新登记（feature-map #26）**｜ADR 新登记（decisions.md）
- 规划载体：本对话（RIPER-5 RESEARCH → INNOVATE → PLAN 三段；用户三问拍板：教科书式章节 / 一步到位全链路 / skill+门禁双保险）
- 关联产物：`src/core/docquality.ts`（门禁核心）、`assets/templates/library/*/​_index.md`（骨架模板）、5 个 skills 修订、PRD v0.31

---

## 一、目的与效果

把图书馆从**"信息库 / 对账卡片库"**升级为真**"图书馆"**——藏书有文体、人可读、agent 可查。治两大已证实的结构性缺陷：

1. **骨架缺陷**：12 卷基线只定义"架"（知识类别分卷），从未定义"书"（每篇藏书的文体与内部结构）——建馆产出是压缩条目与表格倾倒，不是可阅读的文档
2. **可读性缺陷**：人类可读性在 PRD 中几乎空白（无需求、无写作规范、无质量门禁），回灌机制又把基准实验的工作日志补丁直接贴进正文

**预期效果（可度量）**

| 指标 | 现状 | 目标 |
| --- | --- | --- |
| 叙述文档内部结构规范 | 无任何规范 | 教科书式段落定稿（导读/为什么/是什么/怎么运转/怎么验收/参考），新文档 100% 遵循 |
| 卡片化文档（正文 <10 行） | 无检测（memos 060-core.md 19 行全绿通过） | verify/check 报告检出，`--strict` 阻断 |
| 注记污染（实验编号/答卷日期/口径字样入正文） | 无检测（umami api-analytics.md 实证污染） | 检出并 `--strict` 阻断；rebuild 回灌规则根治来源 |
| 表格倾倒 | 无检测 | 警告级报告（ledger 册豁免——登记簿大表合法） |
| 骨架内嵌规范 | init 模板仅 3 卷有 _index.md，无文体指导 | 11 卷 _index.md 全带文体模板与微型范文 |
| 人类读者定位 | PRD 仅零星 3 处提及"可读" | §3 明确人类一等读者 + §9 可读性判据 |

---

## 二、问题点

1. **PRD 层缺人类可读性需求**：全文 grep `可读|人类|人读|双读者|叙述` 仅 3 处零星（F5 阅读指南、Q26"正文可读通道"、迁移文件名人读审计）；§3 目标用户未把"人"定义为一等读者；F4 质量抽查仅片段时效/截图时效/近似重复三项
2. **skill 层只管覆盖面不管写作**：`skills/doclib-build/SKILL.md`"各卷写作要点"每卷仅 1-2 句"写什么"、无"怎么写"；覆盖度自检 9 条全是"漏没漏"、0 条可读性；"面穷举""宁可多不可漏"直接激励表格倾倒；另有残缺——"反克隆铁律（续）"为空节
3. **质量体系无可读性维度**：`src/core/docquality.ts` 仅 broken-links + volume-index；倾倒式文档全绿通过
4. **验收导向单一**：唯一硬验收 = 90% 复原对账 → agent 全部质量压力导向信息密度/覆盖面，可读性无任何激励
5. **回灌机制污染正文**：基准实验的回灌建议（S2-05、D-18、"回灌补记（原仓库答卷 2026-10-21）"、"暂记复原口径"）以补丁形式直接贴回馆内正文，工作痕迹混入正式知识
6. **粒度无判定标准**：memos features 26 篇、umami 33 篇、fd 6 篇、csvkit 4 篇——卷内分篇粒度全凭会话自由发挥

---

## 三、研究结果（症状证据，全部文件实证）

### 3.1 文档形态样本

| 样本 | 行数 | 症状 |
| --- | --- | --- |
| `test/memos/doclib/20-modules/060-core.md` | 19 | skill 要求"职责边界、对外契约、内部关键流程"，实际一张 5 行职责表 + 1 行边界 |
| `test/memos/doclib/30-features/060-memo.md` | 20 | 核心功能仅 3 条行为规格 + 3 条 AC；无设计意图、无边界叙述、无关系上下文 |
| `test/umami/doclib/90-reference/api-analytics.md` | 118 | 62 端点倾倒一张表，单元格内粗体条件堆叠 + S2-05/D-18/回灌补记等过程注记 |
| 对照 `doclib/30-features/place.md`（本馆自产） | 91 | 有目的段、叙述、结构分层——差距一目了然 |

### 3.2 根因链（结构性因果）

唯一硬验收 = 复原对账 → agent 优化方向 = 信息密度；skill 只给覆盖面压力不给写作规范 → 输出表格/条目倾倒；verify/audit 无可读性维度 → 倾倒全绿通过；回灌贴补丁 → 馆内留工作痕迹。**"信息库 vs 图书馆"的差距不是执行偏差，是规范空白**——PRD §7 只写了"叙述层讲理解"的理念，从未转译为可操作的写作标准与验收标准。

---

## 四、代码实际情况

- `src/core/docquality.ts`（63 行）：`scanBrokenLinks()` + `checkVolumeIndexes()`，被 `src/commands/verify.ts:61,64` 消费；无文体/可读性概念
- `src/commands/check.ts`：findings 分级机制现成（默认 soft、`--strict` 退出码 1，Q19 先例），新检查类目可复用
- `src/core/frontmatter.ts`：现成 frontmatter 解析，`type` 字段读取无需新依赖
- `assets/templates/library/`：24 个模板文件，仅 20-modules/30-features/90-reference 三卷有 `_index.md`；init.ts 的模板落位机制（逐文件复制或清单枚举）**执行时先读确认**
- `skills/doclib-build/SKILL.md` 66 行：写作要点 8 行、自检 9 条覆盖面项、空节 1 处

---

## 五、设计方案：图书馆文体学（藏书类型学）

### 5.1 三类文体

| 文体 | 定位 | 内部结构规范 | 适用 |
| --- | --- | --- | --- |
| `narrative` 叙述书 | 讲理解，给人读 | **导读**（H1 后首个非空段落，无 H2）+ `## 为什么`（动机/设计决策/被否备选）+ `## 是什么`（概念/结构/职责）+ `## 怎么运转`（行为/流程/边界）——三段硬性；`## 怎么验收` / `## 参考` 可选；允许增补自定义段 | 10/20/30/40/50/70/80 卷主体 |
| `ledger` 登记簿册 | 供查询，给机器 | 册导读段（首段范围/图例说明）+ 五要素条目（Q26 框架不动） | 90-reference、60-config、80-design 之 routes/ui-assets 册 |
| `index` 索引页 | 导航 | 现有 INDEX/_index 规范不动 | 馆级/卷级索引 |

### 5.2 识别优先级与卷默认映射

frontmatter `type` 字段 > 卷默认映射（存量文档零迁移成本）：

| 卷 | 默认文体 | 说明 |
| --- | --- | --- |
| 00-overview | index（豁免结构检查） | feature-map/progress 是账本，project/glossary 短叙述——混合区 |
| 10-architecture / 20-modules / 30-features / 40-guides / 50-testing / 70-deploy / 80-design | narrative | 80-design 的 routes/ui-assets 册用 `type: ledger` 覆盖 |
| 60-config / 90-reference | ledger | 叙述型反例用 `type: narrative` 覆盖 |
| 95-lessons | 豁免结构检查 | 既有"现象/根因/解决/规避"规范不重复造轮子，仅查注记污染 |
| 99-archive 及根 README/INDEX | 豁免 | — |

### 5.3 门禁分级（复用 F13 soft/strict 机制）

| 检查 | 级别 | 规则 |
| --- | --- | --- |
| 结构完备性（narrative 缺导读/三段） | 违规（strict 阻断） | H2 固定措辞匹配 |
| 卡片化（narrative 正文有效行 <10） | 违规（strict 阻断） | — |
| 注记污染（`回灌补记\|S\d-\d+\|D-\d+\|复原口径\|实测补\|答卷`） | 违规（strict 阻断） | 全文体生效 |
| 表格/列表行占比 >70% | 警告（永不阻断） | ledger 与 00-overview 豁免 |

### 5.4 各层联动

- **PRD v0.31**：§7 增补"叙述层写作标准（文体学）"小节；§3 补人类一等读者；F1 补写作方法论引用；F3 补回灌沉淀规则（差异必须改写为正式章节，实验编号/日期/口径字样禁入正文）；F4 补可读性门禁维度；§9 补判据；术语表补"文体"
- **skills**：build（写作方法论章节 + 粒度启发式：一篇书一个主题 / <10 行正文回炉 / >300 行拆分 + 修复空节 + 自检补文体项）、update（新写段落须符合所在卷文体）、rebuild（回灌沉淀规则）、audit（可读性抽查：教科书三问裁决）
- **骨架**：11 卷 `_index.md` 内嵌本卷文体 + 微型模板 + 措辞 + 粒度提示
- **不改动**：doclib-accept（语义无涉）、assets/guides（引导预算 + 三层分流纪律）

---

## 六、备选方案（已裁决）

| 决策点 | 备选 A | 备选 B | 裁决 |
| --- | --- | --- | --- |
| 写作规范形态 | **文体类型学 + 每类型模板**（类型清晰、可教可查可门禁） | 必答题清单（形式自由但机器不可查）/ 全局统一最小骨架（僵化，架构总览与 lessons 不适用） | **A** |
| 门禁强度 | 全部 soft 观察后收紧 | 结构/卡片化/注记污染 strict 可阻断，倾倒仅 soft | **B**（前三是明确错误；倾倒有合法边缘案例） |
| 存量 5 个基准图书馆 | 本次一并整改重写 | 规范先行，存量下次 update 增量合规 | **B**（最小扰动；umami 注记污染清理由用户后续显式触发） |
| 段落措辞 | 固定措辞（门禁简单可靠） | 语义词表匹配（灵活但规则复杂、误报面大） | **A**（先固定，实测后放宽） |
| 文体识别 | 纯 frontmatter type（存量需补字段） | **卷默认映射 + type 覆盖**（存量零迁移） | **后者** |

---

## 七、实施清单

```
1. 落盘本规划文档；feature-map 登记 F17 planned；progress.md 补记
2. PRD v0.31：修订记录、术语表"文体"、§3 人类读者、§7 文体学小节（模型全表定稿）、F1/F3/F4 增补、§9 判据
3. decisions.md 补文体学 ADR（含被否备选）
4. skills/doclib-build/SKILL.md：新增"写作方法论（文体学）"章节 + 修复空节"反克隆铁律（续）" + 自检清单补文体项
5. skills/doclib-update/SKILL.md：新增文体合规约束
6. skills/doclib-rebuild/SKILL.md：新增回灌沉淀规则
7. skills/doclib-audit/SKILL.md：新增可读性抽查维度
8. src/core/docquality.ts：Genre 类型 / DEFAULT_GENRE 卷映射 / checkGenreCompliance()（结构完备性/卡片化/倾倒/注记污染四检查 + type 覆盖读取）+ 单测
9. src/commands/verify.ts 集成"文体合规"报告节 + 测试
10. src/commands/check.ts 集成"文体违规"findings 分类（复用 soft/strict）+ 测试
11. assets/templates/library/ 新建 8 卷 _index.md 文体模板 + 升级 3 卷既有 _index（先读 init.ts 确认落位机制）
12. npm run typecheck + npm test 全绿
13. 临时目录冒烟：init → 落一篇合规 narrative 与一篇违规文档 → verify/check 输出符合 AC-1~6
14. doclib sync 同步 skills 分发副本；feature-map F17 → implemented；progress 补记；snapshot 固化基线
```

---

## 八、验收标准

| # | Given / When / Then |
| --- | --- |
| AC-1 | Given narrative 文档缺"为什么"段 When `doclib verify` Then 文体合规节报告结构违规（含文档路径与缺失段名） |
| AC-2 | Given narrative 正文有效行 <10 When `doclib check --strict` Then 退出码 1，报告卡片化违规 |
| AC-3 | Given 正文含"回灌补记（原仓库答卷 …）" When `doclib verify` Then 注记污染检出 |
| AC-4 | Given 90-reference 分册为 62 端点大表格 When `doclib verify` Then 无倾倒报告（ledger 豁免） |
| AC-5 | Given narrative 表格/列表行占比 80% When `doclib verify`（默认，非 strict）Then 仅警告、退出码 0 |
| AC-6 | Given 30-features 下文档 frontmatter `type: ledger` When `doclib check` Then 按 ledger 规则检查（不查三段） |
| AC-7 | Given `doclib init` 新项目 Then 11 卷 `_index.md` 均落位且内嵌本卷文体模板 |
| AC-8 | Given `npm run typecheck && npm test` Then 全绿 |
| AC-9 | Given 临时目录冒烟流程 Then init → 落合规/违规样本 → verify/check 行为符合 AC-1~6 |
| AC-10 | Given `doclib sync` Then skills 分发副本更新，引导文件 managed 区行数 ≤150 预算不变 |
