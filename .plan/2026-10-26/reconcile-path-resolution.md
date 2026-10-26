# 进度账对账修复包（reconcile-path-resolution）

- 日期：2026-10-26
- 状态：规划完成，随用户指令「全都做了」授权直接进入实施
- 关联：PRD F11（进度账与对账兜底）｜ADR #7（复原即基准测试）｜AGENTS.md 双锚点机制与实时同步规则｜feature-map #10（进度对账与 reconcile）· #17（文档治理全周期）· #19（移除规程与扫描器集成）· #23（基准扩容）
- 规划载体：本对话（RIPER-5 RESEARCH → INNOVATE → PLAN → EXECUTE → REVIEW；用户已裁决「全都做了」）
- 关联产物：`src/core/reconcile.ts`（判定修复）· `src/core/reconcile.test.ts`（新用例）· `doclib/30-features/reconcile.md`（**新建规格——补历史欠账**）· `doclib/30-features/_index.md` · `doclib/INDEX.md` · `doclib/00-overview/feature-map.md` · `doclib/00-overview/progress.md`

---

## 一、目的与效果

一次交付四件事，其中一件是**修 bug**，三件是**进度账裁决**：

1. **修 `doclib reconcile` 的判定缺陷**——「进度不符」段当前 100% 是误报（15 条 implemented 全数被报"对应文档不存在"，包括刚归档的 #26/#27），真正需要报警的失真被淹没。
2. **补 `doclib reconcile` 的库内规格**——该命令自 v0.25 落地起**至今无任何馆内文档 covers**（#10 只指向 `.plan/` 载体），是 `30-features/_index.md` 明列的规格欠账；本次改动暴露该欠账（改代码即触发「无归属」），顺势补齐。
3. **#17 归档**（文档治理全周期 + 双层图书馆）——九项子能力逐项取证已落地。
4. **#19 拆分**（移除规程与扫描器集成）——规程侧与 codegraph 阶段 2 已完成，**ast-grep 阶段 1 未做**；应拆为「已完成部分 → 新条目 implemented」+「ast-grep 阶段 1 保持 planned」，避免一个条目同时挂两种状态。

## 二、问题点

### 2.1 缺陷根因（`src/core/reconcile.ts:52-61`）

```
const docRef = r.docs.split(/[（(]/)[0].trim();        // 只取首个 token
const docPath = path.join(root, "doclib", docRef.replace(/^doclib\//, ""));
```

两处错误：

- **只取首 token**：单元格形如 `.plan/2026-10-22/orphan-placement-pack.md + doclib/30-features/place.md + doclib/50-testing/acceptance-place-v0.5.0.md`（本仓自 v0.17 起的惯例：首个 token 放规划载体路径，过程材料本就不入馆）——首 token 恒指向 `.plan/`，**恒被按 `doclib/` 前缀解析 → 恒判不存在**。
- **不遍历「 + 」多路径**：单元格内的多路径从未被考虑。
- **只查库内**：载体路径在磁盘上确实存在（`root/.plan/...`），但工具只查 `root/doclib/...`。

### 2.2 实测误报范围（本仓 15 条 implemented 全数命中）

`#5 #7 #8 #9 #10 #11 #15 #16 #20 #21 #24 #25 #26 #27 #28 #29`——其中 `#26`（本次刚归档）与 `#27` 亦被误报，说明该缺陷在归档动作发生的**当场**就会污染对账报告。

### 2.3 连带暴露的规格欠账

`src/core/reconcile.ts` 无任何馆内文档 covers → 本次改动必然触发「无归属」违规（双账本对账面）。**修法不是豁免，而是补规格**（与 `check.md` / `place.md` / `graph.md` 同级规格同构），让锚点真实存在。

### 2.4 进度账的三项待裁决（用户已裁决「全都做了」）

| # | 原状态 | 裁决 | 取证 |
| --- | --- | --- | --- |
| 17 | planned | **implemented** | 九项子能力逐项在馆：登记簿 15 处 · 99-archive 17 处 · 治理健康分 · 写协调 revision 29 处 · 归位决策树 · 无账不答 · init 即 snapshot · 孤儿检测+place（#24）· 文档质量检测（`core/docquality.ts`）；唯一缺口「init 侧自动收编清单」由 `doclib-build` skill 以 `place list` 承担 |
| 19 | planned | **拆分**：收窄为「ast-grep 阶段 1 集成」保持 planned；已完成部分（六步规程 + 引导四纪律 + codegraph 阶段 2）→ 新条目 **#30 implemented** | 六步规程在 `doclib-dev` skill + 引导 full/light；四纪律：裁剪判据 ✓ / 以馆为准 ✓ / 单点强调（full）✓ / 硬预算（status 报告）✓；codegraph 阶段 2 = #25；**ast-grep 阶段 1 未做**——`src/`、`skills/` 无任何 ast-grep 引用，仅存在于 PRD 规划 |
| 23 | in-progress | **描述更新**（状态不变） | 四馆建馆侧已建成（snap-040/041 留痕：aspnetcore+fd complete、csvkit built + memos reconciled），但 `50-testing/benchmark/` 仍只有 umami 的 010~090，四样本档案未入馆，`benchmark.md` 状态段仍写「候选」；复原侧/同题共答/缺陷四分类/回归未完成 |

## 三、研究结果

1. **语义定案**：feature-map 的「对应文档」列本就是**混合引用**（载体路径 + 馆内路径 + 源码路径），工具的单一 `doclib/` 前缀假设与数据现实不符。正确判定是「**该列引用的任一路径真实存在**」。
2. **两种证据的区分**（决定漂移核对能否进行）：
   - **馆内文档**（`root/doclib/...`）→ 是 covers 锚点，可参与「覆盖路径漂移 + 文档未同步」核对；
   - **载体/源码路径**（`.plan/...`、`src/...`）→ 存在即算有据，但**不是 covers 锚点**，不参与漂移核对。
3. **`skills/` 例外保留**：原实现整行跳过以 `skills/` 开头的条目（目录非文档）——新实现应保留该语义，仅当**全部**候选路径都被排除时才跳过该行。
4. **上游不改**：判定逻辑在 `core/reconcile.ts` 内闭环，不涉及 `check` / `place` / `state` 的契约。

## 四、代码实际情况

- `src/core/reconcile.ts`（78 行）：`featureRows`（解析 feature-map 表行：cells[1]=编号、cells[2]=名称、cells[4]=对应文档、cells[5]=状态）→ `runReconcileCore`（三段报告：疑似完成 / 进度不符 / 待推进）
- `src/commands/reconcile.ts`：文本渲染层，`{text, json}` 输出
- `src/core/reconcile.test.ts`（54 行 / 2 用例）：种子库含 `#1 30-features/a.md`（已对账）、`#2 （待写）`（planned）、`#3 30-features/missing.md`（不存在）
- `src/core/ledger.ts` 提供 `hashDocs`（文档账 hash），与本判定无关
- 现状：`npm test` 252/252 全绿；`doclib check` 违规 0 · 治理 100/100 (A)

## 五、设计的方案

### 5.1 判定规则（新）

对每个 `implemented` 条目：

1. 拆引用：取「对应文档」列中括号前的部分 → 按 `+` 切分为候选路径 → 去除空值、`—`、以 `skills/` 开头者
2. 候选为空 → 跳过该行（保留原语义）
3. 逐候选判存在性：**库内解析**（`root/doclib/<ref>`，`doclib/` 前缀先剥离）**或** 仓库根解析（`root/<ref>`）——任一命中即「有据」
4. 全不命中 → 报「对应文档不存在」（列全部候选）
5. 有据但**无库内锚点** → 跳过漂移核对（载体证据无法映射 covers）
6. 有库内锚点 → 执行原漂移核对：被 covers 命中的代码路径全部漂移、且该库内文档未变更 → 报「覆盖路径有漂移且文档未同步——进度与代码不符」

### 5.2 改动清单

| 文件 | 动作 |
| --- | --- |
| `src/core/reconcile.ts` | 抽出 `docRefs(cell)` 与 `docExists(root, ref)`（双解析）；改判定循环为「多候选 + 双解析 + 库内/载体分流」 |
| `src/core/reconcile.test.ts` | 新增 2 组用例：①「+」多路径且首 token 为载体 → 不误报且能做漂移核对；②全候选不存在 → 报「对应文档不存在」 |
| `doclib/30-features/reconcile.md` | **新建**（补规格欠账）：三段报告语义、判定规则、库内/载体证据分流、验收标准、covers 锚点 |
| `doclib/30-features/_index.md` | 「进度对账与 reconcile」行：待写 → `[reconcile.md](reconcile.md)`，状态 implemented |
| `doclib/INDEX.md` | 登记新规格文档 |
| `doclib/00-overview/feature-map.md` | #17 → implemented；#19 收窄 + #30 新建（implemented）；#23 描述更新；#10 描述补「规格入馆」 |
| `doclib/00-overview/progress.md` | 归档留痕（锚点二） |

## 六、备选方案与否决理由

| 备选 | 否决理由 |
| --- | --- |
| 只把「对应文档」列改成库内路径（不动代码） | 治标：下一次有人写 `.plan/` 引用即复发；且把过程材料与长期价值混为一谈（违 F9 双轨） |
| 放宽为「首 token 存在即算有据」（不区分库内/载体） | 会让载体路径进入漂移核对，`an.rows` 匹配不到 → 漂移核对静默失效 |
| 跳过 `+` 之前的全部内容（只取最后一段） | 对「A + B」型单元格语义不稳，且丢失首个候选 |
| 为 reconcile 补规格但不改判定 | 只补欠账不修 bug，误报依旧（本次两项都做） |
| 把 reconcile 的规格并入 `check.md` | 两者判定面不同（check = 双账本对账；reconcile = 进度账对账），合并会让 check.md 失去单一主题（违文体学「一篇一主题」） |

## 七、实施清单

1. 写 `.plan/2026-10-26/reconcile-path-resolution.md`（本文件）
2. `src/core/reconcile.ts`：实现 5.1 判定规则
3. `src/core/reconcile.test.ts`：新增 2 组用例
4. 新建 `doclib/30-features/reconcile.md`（规格 + 验收标准 + covers 锚点）
5. 两级索引登记：`doclib/INDEX.md` + `doclib/30-features/_index.md`
6. `doclib/00-overview/feature-map.md`：#10 / #17 / #19 / #23 更新 + #30 新建
7. `doclib/00-overview/progress.md`：归档留痕
8. 门禁：`npm run typecheck` · `npm test` · `doclib check` · `doclib snapshot`
9. 终检：`doclib reconcile` 复跑——「进度不符」段应从 15 条误报收敛为真实失真（若有）

## 八、验收标准

| 判据 | 期望 |
| --- | --- |
| 本仓 `doclib reconcile` | 「进度不符」段不再出现 `#26`/`#27` 等误报；剩余条目若为空或为真实失真均可接受 |
| 库内规格 | `doclib/30-features/reconcile.md` 存在且被 INDEX + 卷 _index 两级登记；`src/core/reconcile.ts` 有 covers 锚点 |
| 新用例 | 「+」多路径含载体首 token → 不误报；库内锚点仍参与漂移核对；全不存在 → 报「对应文档不存在」 |
| 回归 | `npm test` 全绿（用例数 +2）；`npm run typecheck` 绿 |
| 治理 | `doclib check` 违规 0 · 治理 100/100 (A) · strict 通过 |
| 进度账 | #17 implemented · #19 收窄为 ast-grep 阶段 1 · #30 implemented · #23 描述与证据一致 · #10 描述更新 |
| 索引 | 两级索引无断链（`doclib check` 文档质量分项满分） |
