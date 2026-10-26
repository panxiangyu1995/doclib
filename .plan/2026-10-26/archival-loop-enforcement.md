# 归档闭环强验证与载体检测建议（archival-loop-enforcement）

- 日期：2026-10-26
- 状态：规划完成，待用户批准 ENTER EXECUTE MODE
- 关联：feature-map #31（reconcile 混合引用语义 = ledger-gap 判定基础）· #16（强验证体系，hook --strict 已启用 = 执法臂）· #32（guide-feed = 前置任务）｜PRD F9/F13｜ADR 编号执行时取 decisions.md 下一可用号（guide-feed 占 #18；98-sessions 白名单若已占 #19 则本项顺延）
- 来源：用户研究指令「我上次特地检查了，特别容易遗漏更新进馆，还是手动更新了一次，怎么设计才不会发生漏录入馆内的情况，达到100%进馆？是在claude.md和agents.md中强制写明还是接入hook？还是你有其他办法？」
- 规划载体：本对话（RIPER-5 RESEARCH → INNOVATE → PLAN；planstore 三段纪律落盘）
- 关联产物：`src/core/{featuremap,archival,planning,check,ledger}.ts` · `src/commands/{check,status,init,place}.ts` · `doclib/30-features/{check,place,init-v2}.md` · `assets/guides/light.md` · `skills/doclib-dev/SKILL.md`

## 跨会话前情（本方案依赖的更早结论与文件指针）

| 前情 | 文件指针 | 依赖点 |
| --- | --- | --- |
| feature-map「对应文档」列 = 混合引用语义（载体+库内+源码，存在性判定） | `.plan/2026-10-26/reconcile-path-resolution.md`（#31 修复） | ledger-gap 的引用判定直接沿用该语义 |
| guide-feed 在途账（漏更 2 / 治理 60(C) / #32 progress 无补记 / ADR #18 / v0.6.0） | `.plan/2026-10-26/guide-feed.md` | 本方案 Phase 0 清偿对象；版本与 ADR 编号次序的前提 |
| hook --strict 本仓已启用（执法臂就绪） | `.plan/2026-10-26/hook-hardening.md` + `init-auto-hook.md` | 新不变量零 hook 改动即自动执法的依据 |
| F9「不解析不约束只回收知识」、Q11/Q12 双轨拍板、F13 强验证体系 | `doclib/10-architecture/prd.md`（v0.34） | 方案与 F9 拍板的兼容性论证 |
| planstore 三段纪律 / 会话档案白名单 | `.opencode/commands/planstore.md`、`doclib/40-guides/transcripts.md` | 本文件落盘与收尾三动作的规则源 |
| 本会话研究结论（18 份载体对账 17 完整 + 1 半缺口；spec 兼容三遗漏） | 本文件第三、四节（对话原始记录以本文件为唯一留痕） | 问题点与不变量设计的全部实证 |

## 一、目的与效果

1. 把「载体→进度账→馆内沉淀」闭环中**可机器判定**的失效面从软提醒升级为 check strict 硬不变量——载体规划文档未登记、进度账记一半、implemented 无锚点三类漏录在提交时被 pre-commit hook 拦截（hook 已装，零改动获得执法力）。
2. 兑现 PRD F1 悬空承诺：常见规划载体（.specify/、openspec/、specs/、.kiro/specs/）检测后建议声明（声明权在用户，软提示）。
3. place list 识别 spec 载体形态（OpenSpec/spec-kit/Kiro），首建议从低置信度收编改为「声明为规划载体」。
4. 消除 `.kiro/specs/` 因 `.kiro/` 工具链豁免导致的「spec 文档永不触发任何提醒」盲区。
5. 达到：结构面（代码联动/载体登记/进度账一致）100% 强制入馆；语义沉淀机械子集（implemented 必有锚点）100%；全语义靠 audit skill 兜底。

## 二、问题点

| # | 问题 | 证据强度 |
| --- | --- | --- |
| P1 | 载体规划文档未登记 feature-map 无硬防线（仅 status mtime 软提醒） | 代码事实 + 用户实证（上次手动补录） |
| P2 | 进度账记一半（feature-map 有/progress 无）零防线——本仓现症：#32 guide-feed | 本仓实测 |
| P3 | implemented 无对应文档锚点不可判定（沉淀缺失无信号） | 代码事实 |
| P4 | PRD F1「常见规划载体检测后建议声明」无实现：src/ 无代码、build skill 四态无此步、init 问卷无检测 | grep 实证 |
| P5 | place list 对 spec 文件建议弱：实测 `30-features/001-proposal.md（low · 无明确特征命中）` | 临时仓探针实测 |
| P6 | `.kiro/` 整目录工具链豁免 → `.kiro/specs/` spec 文档静默豁免、永不提醒 | orphan.ts:19 + 闭集滞后教训 |
| P7 | guide-feed 执行中途馆内未联动（漏更 2、治理 60/100 C） | check 实测 |

## 三、研究结果（含 spec 工具格式调研）

1. **spec 工具目录与格式**（context7 + gh CLI 交叉验证）：
   - OpenSpec（/fission-ai/openspec）：`openspec/changes/<change-id>/{proposal.md, design.md, tasks.md, specs/…/spec.md, .openspec.yaml}` + `openspec/specs/` + `changes/archive/`
   - spec-kit（github/spec-kit）：`.specify/`（memory/constitution + templates）+ `specs/NNN-slug/{spec,plan,tasks}.md`
   - Kiro：`.kiro/specs/<feature>/{requirements,design,tasks}.md`
2. **现有兼容面（F9 承诺范围已落地）**：声明制（init --planning 多路径→state.planning）、双轨排除（planningIgnores 六处 collectFiles）、孤儿豁免（check.ts planningDirs 过滤）、载体 mtime 待登记提醒（planning.ts pendingRegistration）、feature-map 计数待归档提醒（pendingArchive）、reconcile 混合引用语义（#31）。临时仓探针实测：声明后 strict 通过 100(A)、改 openspec/ 文件触发待登记提醒 ✓。
3. **失效面归类**（方案推演公理）：A 改码→covers 未联动（check 已硬拦）/ B 载体未登记（仅软提醒）/ C 进度账记一半（零防线）/ D 语义知识未沉淀（部分可判定）。
4. **数据事实**：本仓 18 份载体规划文档全量对账——17 份双锚点完整（feature-map + progress 均有），1 份半缺口（guide-feed：#32 已登记、progress 无补记）；17 个完整样本证明「progress.md 含载体路径子串」惯例 100% 成立 → 可作交叉引用不变量的经验基础。
5. **载体文件内部状态行陈旧**（"未确认/待批准执行"）是「过程材料留载体不动」设计使然（Q12 拍板），不算遗漏。

## 四、代码实际情况

- 新增 finding kind 自动进 strict 门禁（check.ts:89 `passed = findings.length === 0`）与 pre-commit hook——无需改 hook。
- feature-map 解析在 `src/core/reconcile.ts`（featureRows/docRefs/docExists），但 reconcile.ts:6 反向 import planning.ts（pendingArchive）→ planning 侧直接 import reconcile 会成环 → 需抽公共模块 `featuremap.ts`。
- 载体 .md 枚举已有 `carrierDocs`（planning.ts:15）；ack 豁免结构 `state.acks`（kind/path/note/baseline）。
- status.ts:67 reminder 块、json payload `planning` 节点（L98 `planning: { paths, reminder }`）；init.ts lines 数组 `- 规划载体:` 行（L124 附近）；place.ts `suggestPlacement`（L265，PLACEMENT_RULES 循环 + low 兜底 L297）、`runList` 渲染（L30-55）。
- check.ts genre 违规块后、healthScore 调用前为 invariant 插入点；healthScore 五分项公式（check.ts:52-70）。
- 本仓当前：check 漏更 2（assets/guides/{full,light}.md）、治理 60/100(C)、漂移 ~1/-1、待登记 1（guide-feed.md）。

## 五、设计方案（INNOVATE 结论，用户进入计划模式即默认接受推荐组合）

**组合 = 方案 A（三条确定性不变量进 check strict）+ 方案 C（引导/skill 一行事实同步）+ spec 兼容三遗漏收口。**

### A. 三条不变量（新建 src/core/archival.ts，archivalFindings(root, state)）

| 不变量 | 判定（全存在性/交叉引用，零语义猜测） | 拦截 | finding |
| --- | --- | --- | --- |
| 载体未登记 carrier-unregistered | carrierDocs 枚举每份 p：feature-map 任一行 docs 单元 `.includes(p)` = 已登记；`state.acks.some(a => a.path === p)` = 显式豁免；皆否 → 违规 | B | `{ path: p, detail: "载体规划文档未被 feature-map 登记 → 锚点一登记 planned，或 doclib ack <path> --standing（显式豁免）" }` |
| 进度账缺口 ledger-gap | 行 docs 单元中匹配已声明载体前缀的引用，任一不出现在 progress.md 原文 → 违规 | C | `{ path: ref, detail: "feature-map #<n> 引用载体路径但 progress.md 无补记 → 补记时间线条目" }` |
| 沉淀锚点缺失 anchor-missing | status=implemented 且 docs 单元去空格后为空或 "—" → 违规 | D 机械子集 | `{ path: "#<n>", detail: "implemented 条目无对应文档锚点 → 补规格/ADR/参考文档并修正对应文档列" }` |

- 解耦：迁 `FeatureRow/featureRows/docRefs/docExists/existsAt` 至新建 `src/core/featuremap.ts`，reconcile.ts 再导出保持兼容（避免 planning→reconcile 成环）。
- ledger.ts CheckFindingKind 增三 kinds；commands/check.ts kindLabel（载体未登记/进度账缺口/沉淀锚点缺失）+ kinds 数组 genre 后追加。
- **治理健康分公式不变**（新违规走 strict 执法，不计入五分项——规格中显式声明此边界）。
- 模块归属：archival.ts 仅 import featuremap/planning/state/ledger，不 import commands。

### B. 常见载体检测建议（软提示）

- planning.ts 增 `COMMON_CARRIER_DIRS = [".specify/", "openspec/", "specs/", ".kiro/specs/"]`、`suggestCarriers(root, state)`（目录存在 ∧ 未声明 ∧ 含 ≥1 .md → 命中）、`detectCarrierShape(rel)`（`^openspec/`→OpenSpec、`^\.specify/` 或 `^specs/\d+-[^/]+/`→spec-kit、`^\.kiro/specs/`→Kiro、否则 null）。
- status.ts reminder 块后加「载体建议」行 + json `planning.carrierSuggestions`；init.ts `- 规划载体:` 行后加建议行。

### C. place list 载体形态

- place.ts `PlacementSuggestion` 增 `carrier?: boolean`；suggestPlacement 开头 detectCarrierShape 命中即短路返回 carrier 建议；runList 对 carrier 建议输出声明指引、跳过「收编/入棺」行、保留「豁免」行；json 形状不变（新增可选字段）。

### D. 引导/skill/馆内联动

- light.md 实时同步规则表加一行（载体规划文档新增 → feature-map 登记 planned，check「载体未登记」拦截）→ `doclib sync` 再生；doclib-dev skill 双锚点节补 check 三不变量事实一行 → sync 分发。
- 30-features/{check,place,init-v2}.md 规格 + AC + covers；20-modules 登记 core/featuremap、core/archival；PRD v0.35 修订记录；ADR（执行时取下一可用号）；INDEX + 30-features/_index 摘要；feature-map #33 登记；progress 补记；版本 0.6.1；snapshot 固化。

## 六、有无备选方案

| 决策点 | 采纳 | 被否备选 | 否决理由 |
| --- | --- | --- | --- |
| 防漏主案 | A：三不变量进 check strict（hook 自动执法） | B：独立对账命令（doclib audit --archival） | 非强制即遗忘，与 check 职责重叠，只在用户记得跑时生效——与问题本源正面冲突 |
| 同上 | 同上 | C 纯引导强化为主案 | 引导是*建议*，已实证失效两次（guide-feed progress 缺口、用户手动补录）；保留为辅（一行事实陈述） |
| 同上 | 同上 | D：pendingRegistration（mtime）升级硬门禁 | mtime 语义错位——touch 即触发、基线对比噪音大，度量「晚于基线」而非「未登记」；存在性覆盖严格强于它且零误报 |
| 「引导 vs hook」二选一 | 两者各归其位：hook=执法臂、引导=工作流指挥 | 把保证职责压给引导/CLAUDE.md 写死规则 | hook 本身无判断力，杠杆点是把判定装进 check；引导承担不了「保证」 |
| 载体引用判定 | 原始 docs 单元 `.includes(p)` | 复用 docRefs() 切分 | docRefs 按括号/加号切分会丢注解内路径、多一层边界；原始子串对「载体路径」判定足够且更稳 |
| anchor-missing 范围 | 仅 docs 空或 "—" | 全量追溯（含仅引用 skills/ 的既有行） | 会误伤 #2/#6 等既有行、逼出范围外补规格工程；收窄后零误报，语义由 audit 兜底 |
| 治理健康分 | 公式不变 | 新增分项/并入既有分项 | 公式扰动牵连测试与规格；strict 执法已足够，分数是诊断不是门禁 |
| 实现位置 | 新建 archival.ts + featuremap.ts | 把 invariant 写进 reconcile.ts / planning.ts | reconcile 反向依赖 planning 会成环；check→reconcile 会引入 core→commands 边（已有恶例不扩散） |

## 七、用户拍板与纠正留痕（保留原话要点）

1. 「我上次特地检查了，特别容易遗漏更新进馆，还是手动更新了一次」——确立问题真实性（非假设），直接驱动「必须机器执法、不能靠自觉」方向。
2. 「怎么设计才不会发生漏录入馆内的情况，达到100%进馆？是在claude.md和agents.md中强制写明还是接入hook？还是你有其他办法？」——给出三候选（引导/hook/其他），方案必须回应此三分法；结论：hook=执法臂、引导=指挥、其他=把判定装进 check。
3. 「我原本不仅仅规划了.plan目录的，还规划了要兼容各类spec项目文档的入馆，这些spec工具目录所在和格式你可以使用context7 mcp和gh cli获取相关内容」——指定调研工具与调研范围（spec 兼容审计成为研究必答题）。
4. 拍板序列：「进入创新模式」→「进入计划模式」——RIPER-5 逐段授权；INNOVATE 推荐组合（A+C+spec 收口）未遭否决即进入计划 = 默认接受。
5. planstore 三段纪律注入（规划落盘/反遗漏自检/收尾三动作）——本文件即其产物；收尾三动作待会话结束执行。

## 八、失败尝试与踩坑（95-lessons 上游素材，即使绕过也记）

1. **探针陷阱（值得入 95-lessons）**：临时仓第二次 `init --planning ".plan/,openspec/"` 未加 `--force` → 报「doclib/ 已存在」且输出被 `>/dev/null` 吞掉 → state.planning 未更新 → 待登记提醒未触发 → 差点误判「声明后提醒失灵」。修正：重跑加 `--force` + 用 python3 直读 `.doclib/state.json` 断言 planning 实际值。教训：**验证 CLI 副作用必须断言状态落盘值，不能只看命令退出码/输出**；CLI 二次调用有覆盖语义须显式 --force。
2. context7 解析歧义：resolve "OpenSpec" 返回 4+ 同名候选库，按 snippet 数与官方仓归属人工甄别 `/fission-ai/openspec`（Medium 评分但覆盖最全）。
3. decisions.md 标题 grep（`^## |^### `）零命中——ADR 文件标题层级与假设不符，未深究（不影响研究结论）；执行 ADR 登记时**先读文件实际格式**再落笔。

## 九、验收口径与变更过程

1. 用户诉求原话为「达到100%进馆」→ INNOVATE 阶段显式修正口径：**结构面（A/B/C 类）机器 100%；语义沉淀（D）仅机械子集（implemented 必有锚点）强制，全语义靠 doclib-audit 定期体检兜底**；并声明「宣称任何知识 100% 自动入馆在工程上不诚实，宣称结构面 100% 强制 + 语义面审计兜底可达」。用户未异议并授权进入计划模式 = 接受修正口径。
2. 验收标准由「测试绿」逐步细化为三件套：typecheck + 全量测试绿 → 临时目录五段冒烟 → 本仓自证（check 违规 0 · 治理 100/100(A) · strict 通过 · 269+ 测试）。

## 十、实施清单

```
实施清单：
1. 执行 guide-feed 剩余清单并归档（specs/covers 联动/#32/progress/snapshot/ADR #18）→ check 治理 100(A)
2. 新建 src/core/featuremap.ts（迁入 featureRows/docRefs/docExists/existsAt/FeatureRow）
3. reconcile.ts 改导入 + 再导出，reconcile 相关测试回归通过
4. 新建 src/core/archival.ts（archivalFindings 三不变量）
5. ledger.ts CheckFindingKind 增 carrier-unregistered/ledger-gap/anchor-missing
6. check.ts 接入 archivalFindings（genre 后、healthScore 前）
7. commands/check.ts kindLabel 三案 + kinds 数组追加
8. planning.ts 增 COMMON_CARRIER_DIRS/suggestCarriers/detectCarrierShape
9. status.ts 载体建议行 + json planning.carrierSuggestions
10. init.ts 载体建议输出行
11. place.ts PlacementSuggestion.carrier + suggestPlacement 短路 + runList 渲染分支
12. 新建 src/core/archival.test.ts（8 用例）
13. planning.test.ts 增 suggestCarriers/detectCarrierShape 用例
14. check.test.ts 集成用例（新 kind 出现 + 无载体零误报）
15. place/status/init 测试断言补齐
16. npm run typecheck + npm test 全绿（破坏断言按契约修正并留痕）
17. 临时目录冒烟五段（载体建议/未登记拦截/进度账缺口/清零通过/place 形态建议）
18. 馆内联动：30-features/check.md 三分类+AC+covers
19. 馆内联动：30-features/place.md 载体形态节+AC
20. 馆内联动：30-features/init-v2.md 检测建议
21. 馆内联动：20-modules/_index.md 登记 featuremap/archival
22. 馆内联动：PRD v0.35 修订记录
23. 馆内联动：decisions.md ADR（下一可用号）
24. 馆内联动：INDEX.md + 30-features/_index.md 摘要同步
25. 引导：assets/guides/light.md 规则表加行 → doclib sync 再生（预算 ≤150）
26. skills：doclib-dev 双锚点节补一行 → sync 分发
27. feature-map #33 登记 → implemented + progress 补记 + package.json 0.6.1
28. doclib snapshot 固化 + 终检（违规 0 · 治理 100(A) · strict 通过 · 测试全绿）
```

## 十一、验收标准

1. `npm run typecheck` 绿；`npm test` 全绿（269+ 新增后全过，破坏断言按行为契约修正并留痕）。
2. 临时目录冒烟五段全过：
   - ① init → 建 `openspec/changes/x/proposal.md`（未声明）→ status 出「载体建议」行
   - ② `--planning ".plan/,openspec/"` 声明 → snapshot → 新增 `.plan/a.md` 未登记 → check 报「载体未登记」且 `--strict` exit 1
   - ③ feature-map 登记该载体但 progress.md 无补记 → check 报「进度账缺口」
   - ④ progress 补记后 → 违规清零 strict 通过
   - ⑤ place list 对 openspec 形态文件 → 仅声明建议+豁免行，无收编/入棺行
3. 本仓自证（Phase 0 清偿后）：`doclib check` 违规 0 · 治理 100/100(A) · strict 通过 · status 待登记清零（待归档提醒因 #23 in-progress 等合法存续属预期）。
4. 本仓自证反证：#32 型半缺口（feature-map 有/progress 无）在清偿前会被 ledger-gap 当场抓出（dogfooding 实证）。

## 会话导出登记

- 导出件：（待会话收尾登记，格式 `archival-loop-enforcement-20261026-01.md`，落 `doclib/98-sessions/`，frontmatter 五要素：type: transcript / tool / session-id / date / plan-slug）
- 敏感信息自查：（会话收尾时执行——本会话至今未出现密钥/token/凭据）

## 任务进度

[2026-10-26 执行段 1（清单 1-17）]
- 已修改：src/core/featuremap.ts（新建，迁入 featureRows/docRefs/docExists/existsAt/FeatureRow）；src/core/reconcile.ts（改导入+再导出）；src/core/archival.ts（新建，三不变量）；src/core/ledger.ts（CheckFindingKind +3）；src/core/check.ts（archivalFindings 接入 genre 后）；src/core/planning.ts（COMMON_CARRIER_DIRS/suggestCarriers/detectCarrierShape）；src/commands/{check,status,init,place}.ts（标签/载体建议行/json 字段/carrier 形态短路+渲染分支）；测试 ×6（archival.test 新建 8 例、planning/check/place/status/init 增补）
- 更改：三不变量进 check strict（载体未登记/进度账缺口/沉淀锚点缺失）；常见载体检测建议（status/init）；place list 载体形态建议
- 原因：实施已批计划清单 1-17
- 阻碍因素：①并发会话在本会话研究→规划期间完成 guide-feed 全部归档与 transcript-archive 实施（revision 44→53、基线 snap-053→snap-062）——清单第 1 项实测已由其完成，直接确认跳过；feature-map #33/#34 被占用 → 本方案登记号改 #35（PLAN 假设偏差，行为语义不变）②tsx 直跑 src 测试遇 assets 路径解析限制（既有环境约束）→ 改用规范入口 npm test ③既有用例「自定义规划载体目录不判孤儿」因新不变量的预期行为变更连锁失败 → 按契约修 fixture（登记 feature-map 行 + progress 补记），测试意图（不判孤儿）保持
- 状态：成功（typecheck 绿 · 291/291 测试绿 · 临时目录五段冒烟全过）

[2026-10-26 执行段 2（清单 18-28）]
- 已修改：doclib/30-features/{check,place,init-v2,reconcile,guides,hook}.md（规格+AC+covers）；doclib/20-modules/_index.md（archival/featuremap 新登记 + reconcile/planning 补欠账 + check 行去数字化）；doclib/10-architecture/prd.md（v0.36：F13 三不变量+Q23 分层细化+载体检测建议落地）；doclib/10-architecture/decisions.md（ADR #20）；doclib/INDEX.md + 30-features/_index.md（摘要/计数）；doclib/50-testing/{testing,cli-acceptance-suite,acceptance-place-v0.5.0}.md（291 用例链校正+增量行）；doclib/00-overview/{feature-map,progress}.md（#16 登记两载体 + #35 登记 implemented + 补记）；assets/guides/light.md（载体行）→ sync 再生；skills/doclib-dev（双锚点节）→ sync 分发；AGENTS/CLAUDE custom 区版本 0.6.1；.doclib/guide-project.md（docs-hash 重蒸馏）；package.json 0.6.1；snapshot snap-063
- 更改：馆内全联动清偿 check 执法面 13 项（漏更 10+载体未登记 2+反哺过期 1）——全部为真实内容更新非 touch
- 原因：实施已批计划清单 18-28 + check 对账发现的必清偿项
- 阻碍因素：①PRD v0.35 与 feature-map #33/#34 已被并发会话的 transcript-archive 占用 → 版本号顺延 v0.36、登记号 #35（计划假设偏差，语义不变）②check 执法面暴露的清偿项超出计划清单字面（hook.md/reconcile.md/guides.md/overview.md/testing.md/acceptance-place 因 covers 联动必改；#16 需补登记两载体路径）——均为实时同步规则的应有之义，逐项真实更新 ③上轮测试链记录 284 与实测 276 存在 -8 漂移——本轮实测校正并留痕
- 状态：成功（check 违规 0 · 治理 100/100(A) · strict 通过 · 291/291 测试绿 · typecheck 绿 · 漂移归零 snap-063 · revision 54）
