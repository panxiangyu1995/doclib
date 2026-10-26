# 教训账缺口不变量：处置位 + 引用存在性（lesson-gap-enforcement）

- 日期：2026-10-26
- 状态：规划完成，待用户批准 ENTER EXECUTE MODE
- 关联：feature-map #35（归档闭环三不变量，本项为同构第四不变量）· #33（planstore 踩坑小节=上游素材结构化）｜PRD F13/F5·实时同步原则｜ADR #21（待登记）｜95-lessons 卷
- 来源：用户研究指令「我是给图书馆项目设计了经验教训记录位置的，而且每次我都是开发好一个.plan或者spec规格之后就进行测试，然后解决发现的bug漏洞等问题的……但是怎么确保每次完成对应的内容就进馆？不会有遗漏呢？」
- 规划载体：本对话（RIPER-5 RESEARCH → INNOVATE → PLAN；planstore 纪律落盘）
- 关联产物：`src/core/archival.ts` · `src/core/ledger.ts` · `src/commands/check.ts` · `src/commands/init.ts` · `assets/templates/library/00-overview/progress.md` · `assets/guides/light.md` · `skills/{doclib-dev,doclib-audit}/SKILL.md` · `.opencode/commands/planstore.md`（双侧）· `doclib/95-lessons/lessons.md`（补录）

## 跨会话前情

| 前情 | 文件指针 | 依赖点 |
| --- | --- | --- |
| #35 归档闭环三不变量（本会话上半场实施） | `.plan/2026-10-26/archival-loop-enforcement.md` | 同构第四不变量；执法臂复用；archival.ts 扩展点 |
| planstore 三段纪律（踩坑小节=95-lessons 上游素材） | `.opencode/commands/planstore.md` + `doclib/40-guides/transcripts.md` | 上游已结构化是本方案可判定的前提 |
| Q23 分层拍板（mtime soft / 存在性 strict） | PRD v0.36 Q23 | 本项延续同一分层逻辑 |
| Q33 存量不追溯先例 | PRD v0.23 | epoch 机制的设计先例 |
| 本会话研究结论（lessons 零机器覆盖 + 4-5 实证缺口 + 跨馆歧义） | 本文件第三节（对话原始记录以本文件为唯一留痕） | 问题点全部实证 |

## 一、目的与效果

1. 把「修 bug/踩坑 → 95-lessons」从纯自觉升级为机器执法：**每条进度账条目必须显式处置教训去向**，处置引用必须真实存在。
2. 补齐归档闭环最后缺口：载体→进度账（#35 已有）之后，**进度账→教训账**（本项）——「开发→测试→修 bug→沉淀」循环每个产物都有入馆强制位。
3. 消除双向不可核对：处置引用→lessons 条目（存在性）+ 条目来源行→载体/缺陷记录（回溯）。
4. 诚实边界：结构面（处置位存在 + 引用可解析 + 来源可回溯）机器 100%；「该不该记/记得好不好」语义面 audit 兜底——与 #35 同一口径。

## 二、问题点（研究实证）

| # | 问题 | 证据 |
| --- | --- | --- |
| P1 | lessons.md `covers: []` 无锚点、无任何 check 分类/提醒/audit 项——完备性零机器覆盖 | 代码事实 |
| P2 | hook REVIEW D-01/D-02 两中危教训未入档（progress 连声明都无） | progress L70 vs lessons.md |
| P3 | #24 的 15 缺陷只产 2 课；card 度量缺陷（10-23）与 flag-surface 自指（10-23）无教训 | progress vs lessons.md 日期分布 |
| P4 | 本会话 .plan 踩坑（--force 探针陷阱）标注"95-lessons 候选"至今未入馆——上游→账本断链正在发生 | 本 .plan 文档 §八 |
| P5 | 跨馆声明歧义：「95-lessons +2」无馆别限定（实为 umami 馆），机器不可核对 | progress L41/L44 考证 |
| P6 | lessons 条目无来源回链，双向皆不可验证 | lessons.md 全文 |

## 三、研究结果

1. 设计面：实时同步原则（PRD L189/L380）+ AGENTS 同步行 + doclib-dev 行 + planstore 反遗漏自检第 3 项——全部软约束；audit 无教训抽查项。
2. 机器面：lessons 豁免结构检查仅查注记污染（文件可见但不查完备性）；#35 不变量不含教训。
3. 数据面：本馆 10 条教训的入档与"会话当场记得"强相关；确认缺口 P2-P4；10-21 声明实为 umami 馆条目（test/umami/doclib/95-lessons/ 有 2026-10-21 条目）。
4. 结构面：progress.md 条目为 `**YYYY-MM-DD**` 标记的单段文本（存在多条目同行退化形态）；lessons.md 条目为 `## YYYY-MM-DD · 标题`；planstore 已使踩坑小节成为 .plan 必备段——上游结构化是可判定性的前提。
5. 边界事实：F9「不解析载体内部格式」是产品承诺——库内账本（progress/lessons）可格式检查，载体内容不可解析；这是方案空间的分水岭。

## 四、设计方案（INNOVATE 结论）

**组合 = 处置位+引用存在性不变量（主案）+ 条目来源回链（格式增强）+ audit 兜底项 + 存量补录。**

### 4.1 约定（库内账本，F9 边界干净）

- **epoch 标记**：progress.md 中一行 `<!-- doclib:lesson-epoch: YYYY-MM-DD -->`——日期 ≥ epoch 的条目强制处置位；**标记缺席 = 不变量不活跃**（存量库零破坏；采用由 skill/引导指引）；标记存在但日期非法 → DoclibError fail-fast（同 readGuideProject 先例）
- **处置位**：每条目**末字段** `教训:`（全半角冒号皆收），值为：
  - `无（<理由>）`
  - `95-lessons <date> · <标题>`（本馆引用，多条 `；` 分隔）
  - `95-lessons@<dir> <date> · <标题>`（他馆，`<dir>` 为仓库相对目录如 `test/umami`，解析 `<dir>/doclib/95-lessons/lessons.md`）
- **解析**：按 `-\s*\*\*\d{4}-\d{2}-\d{2}\*\*` 分段（兼容多条目同行退化形态）；取段内**最后一次**出现的 `教训[:：]` 为处置位（防正文早现误配）；模板占位 `YYYY-MM-DD` 非日期不匹配天然安全
- **存在性核对**：引用在目标 lessons.md 找 `## <date> · <title>` 行，**标题 startsWith 引用标题** 即命中；未命中 → 违规
- **lessons 条目格式增强**：条目可加 `来源: <plan路径或缺陷记录指针>` 行（可选，存量兼容）

### 4.2 不变量（check 第 11 分类 `lesson-gap` 教训账缺口）

- ①处置位缺失：≥epoch 条目段内无 `教训[:：]` → 违规（path=条目日期，detail 指引格式）
- ②引用不可解析：处置位引用在目标馆 lessons.md 无命中 → 违规（path=引用串）
- strict 计入门禁 + pre-commit hook 自动执法；**治理健康分公式不变**；mtime 型提醒无涉（Q23 分层延续）

### 4.3 配套

- init：模板拷贝后向 progress.md 幂等补写 epoch 标记（当日日期）→ 新馆默认在岗
- 模板骨架：progress.md 骨架条目增 `教训:` 行教学格式
- audit skill：增第 7 项「教训完备性抽查」（近段缺陷/踩坑 vs lessons 对照，语义兜底）
- 存量补录（本仓 Phase 0）：lessons 补 5 条 + progress 加标记 + ≥10-26 条目补处置位（诚实记账非 retroactive 造假）

## 五、有无备选方案

| 决策点 | 采纳 | 被否备选 | 否决理由 |
| --- | --- | --- | --- |
| 主案 | 方案 1 处置位+存在性（库内账本格式检查） | 方案 2 .plan 踩坑条目标记+载体解析 | 违 F9 不解析载体产品承诺；planstore 是单项目约定不可产品化假设 |
| 同上 | 同上 | 方案 5 commit-msg 关键词拦截 | 启发式误报漏报不可控，脆弱 |
| 同上 | 同上 | 方案 6 soft 提醒升级 | mtime/启发式对"记了一半"已实证无效（Q23） |
| epoch 机制 | progress.md 标记行（缺席=不活跃） | 硬编码常量（对其他 repo 语义错误）/state 字段（无写入口）/全量追溯（Q33 先例反例+ Retroactive 造假风险） | 标记显式、按馆 opt-in、存量库零破坏 |
| 处置位解析 | 条目末字段+段内最后出现 | 全段搜 95-lessons 字样 | 正文早现"95-lessons"散文提法（L41/L51 实证）会误配为引用 |
| 引用匹配 | 同日期 + 标题 startsWith | 全等匹配（缩写不可用）/模糊相似（误报） | 前缀匹配确定性且允许缩写 |
| 结构检查 lessons 四段 | 不做（audit 域） | check 查现象/根因/解决/规避齐备 | 内容格式 policing 超出结构面；audit 兜底 |
| 新条目日期口径 | 事件日期（如 10-23 缺陷的教训记 10-23） | 一律记录日 | 与既有 10 条惯例一致 |

## 六、用户拍板与纠正留痕

1. 原话「每次我都是开发好一个.plan或者spec规格之后就进行测试，然后解决发现的bug漏洞等问题的，而且大多数的.plan规划也基本都是为了解决问题而做的」——确立教训生成点在执行/归档时刻，是处置位挂在 progress 条目的依据。
2. 原话「怎么确保每次完成对应的内容就进馆？不会有遗漏呢？」——目标口径；INNOVATE 重申诚实分层（结构面 100% + 语义 audit 兜底），用户授权进入计划=接受。
3. 拍板序列：「进入研究模式」→「进入创新模式」→「进入计划模式」——RIPER-5 逐段授权；推荐组合未遭否决即进入计划=默认接受。
4. planstore 纪律延续（本会话第二份规划落盘）。

## 七、失败尝试与踩坑（95-lessons 上游素材）

1. **跨馆声明歧义考证**：初判 10-21 "+2"/"S1 教训"为本馆漏录，git 考证 lessons.md 全历史（--follow 全版本 0 条 10-21）后转向 test/ 基准馆才定位——教训：**声明类断言的核对必须先问"哪个馆"**（已转化为本方案 @dir 语法）。
2. progress.md 存在多条目同行退化形态（L67 一行三段）——分段解析必须兼容，否则解析面在真实数据上碎裂（未入 lessons，属实现注记）。

## 八、验收口径与变更过程

- 用户问「怎么确保…不会有遗漏」→ INNOVATE 修正口径：结构面机器 100%（处置位+存在性+回溯）、语义面 audit 兜底——与 #35 同一口径，用户默许。
- 验收三件套：typecheck+全量测试 → 临时目录冒烟 → 本仓自证（违规 0 · 治理 100(A) · strict 通过）。

## 九、实施清单

```
实施清单：
1. lessons.md 补录 5 条（D-01 init 全接降级 / D-02 幂等 chmod / card 双阈值 / 规范文档自指 / CLI 副作用断言落盘值；各含来源行）
2. progress.md 加 epoch 标记（2026-10-26）+ 全部 ≥10-26 条目补处置位（含 #35 条目自身）
3. archival.ts：epoch 解析（fail-fast）+ 条目分段 + lesson-gap 两级判定（处置位缺失/引用不可解析）
4. ledger.ts CheckFindingKind 增 lesson-gap
5. commands/check.ts kindLabel「教训账缺口」+ kinds 数组追加
6. init.ts 模板拷贝后幂等补写 epoch 标记（当日日期）
7. assets/templates/library/00-overview/progress.md 骨架增教训行
8. archival.test.ts +7（处置位缺失/引用缺失/引用命中/无理由/epoch 豁免/@repo 命中/@repo 缺失）
9. init.test.ts +1（init 后标记在场）
10. npm run typecheck + npm test 全绿（无标记 fixture 不活跃，预期零破坏；破坏按契约修正留痕）
11. 临时目录冒烟：init（标记在场）→ 无处置位条目 → lesson-gap → 补引用（lessons 无此条）→ lesson-gap → 建 lessons 条目 → 违规清零 strict 通过；旧库无标记不活跃
12. 馆内联动：check.md 第 11 分类+AC+口径 10→11 类
13. 馆内联动：PRD v0.37（F13 四不变量归档闭环段落扩充+修订记录）
14. 馆内联动：decisions.md ADR #21
15. 馆内联动：INDEX.md（ADR 二十一则+check 摘要）+ 30-features/_index.md
16. 引导：light.md「修 bug」行补处置位事实 → doclib sync 再生（预算 ≤150）
17. skills：doclib-dev 实时同步行+双锚点锚点二补处置位 → sync 分发
18. skills：doclib-audit 增第 7 项教训完备性抽查 → sync 分发
19. planstore 双侧（.opencode/commands/planstore.md + .claude/commands/planstore.md）反遗漏自检第 3 项补处置位句
20. testing.md 用例链校正 + cli-acceptance-suite 增量行
21. feature-map #36 登记 implemented + progress.md 补记（条目自带教训处置位——dogfooding）
22. version 0.6.2 + doclib snapshot + 终检（违规 0 · 治理 100(A) · strict 通过 · 测试全绿）
```

## 十、验收标准

1. `npm run typecheck` + `npm test` 全绿（291→约 299；无标记 fixture 零破坏）。
2. 临时目录冒烟三段：①init 新馆 progress.md 含当日 epoch 标记 ②无处置位条目 → check 报「教训账缺口」且 --strict exit 1 ③补 `教训: 95-lessons <date> · <标题>` 但 lessons 无条目 → 仍报；建条目后 → 违规清零 exit 0。
3. 本仓自证：check 违规 0 · 治理 100/100(A) · strict 通过；lessons.md +5 条且全部带来源行；progress ≥10-26 条目全部带处置位。
4. 反证：删除任一新 lessons 条目 → check 当场报引用不可解析（dogfooding 实证机器真的在岗）。

## 会话导出登记

- 导出件：（待会话收尾登记，格式 `lesson-gap-enforcement-20261026-02.md`，落 `doclib/98-sessions/`，frontmatter 五要素）
- 敏感信息自查：（会话收尾时执行——本会话至今未出现密钥/token/凭据）

## 任务进度

[2026-10-26 执行（清单 1-22）]
- 已修改：core/archival.ts（epoch fail-fast+分段+lesson-gap 两级判定）、ledger/check 接线、init.ts 标记补写+模板骨架、archival.test +7+init.test +1、lessons.md +7 课（计划 5+执行期新增 2）、progress.md 标记+9 处置位、check.md 十一分类+5AC、PRD v0.37、ADR #21、INDEX/_index、testing.md/suite（诚实修正 291 口径→307）、light.md+doclib-dev+audit+planstore 双侧（sync 分发）、20-modules、transcripts.md、guide-project 重蒸馏、package.json（0.6.2+test script 补登记）、feature-map #36、snap-064/066
- 更改：归档闭环第四不变量落地；教训从纯自觉升级为机器执法（处置位+存在性）
- 原因：实施已批清单
- 阻碍因素/偏差：①**执行期重大发现**——archival.test.js 自 #35 起漏登记 test script，8 例静默不进执法门（显式列表代价）→ 补登记+教训入档+清单 diff 自查纪律（已新增计划外第 6/7 课）②check 执法面抓出 3 个并发会话条目缺处置位（#32/REVIEW/#33-34）→ 补录 1 课（注入 fail-fast）+3 处置位 ③9 项漏更+反哺过期按 covers 联动真实清偿 ④sync 戳刷新后二次快照收口（snap-066）
- 状态：成功（check 违规 0 · 治理 100/100(A) · strict 通过 · 307/307 测试绿 · typecheck 绿 · snap-066 漂移归零 · revision 57）

[2026-10-26 验收轮（用户指令：test/ 克隆仓实测 bug 记录功能）]
- 已修改：doclib/50-testing/acceptance-lesson-gap-v0.6.2.md 新建（ledger 正名）+ 两级索引；95-lessons +1（验收脚本返回码）；progress 验收条目（含处置位）；feature-map #36 对应文档补验收锚点；snap-069
- 更改：五仓矩阵 T1-T5 全过——T1 旧库零破坏（五仓 0 缺口、预存违规基线吻合）/T2 csvkit 执法链路全通/T3 同行退化形态各自检出/T4 memos 101 项噪声精准隔离/T5 还原归零
- 原因：用户指令 + #36 验收维度补全（真实仓库存量/退化/噪声三维）
- 阻碍因素：①探针 grep -c 零匹配断链误读（教训入档 F-2）②验收档案漏 type: ledger 触发文体门禁（正名即清）③三次快照顺序失误（check 未清零先 snapshot）——流程纪律：check 清零是 snapshot 的前置
- 状态：成功（check 违规 0 · 治理 100/100(A) · snap-069 · revision 60）
