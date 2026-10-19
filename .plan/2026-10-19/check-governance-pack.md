# check 核心兑现包：孤儿检测 + 治理健康分 + 乐观锁 revision + 引导硬预算

- 日期：2026-10-19
- 状态：planned（待执行）
- 关联：PRD v0.23（F13/F5/F6、Q20/Q22/Q36/Q37·38）｜feature-map #17（机器层）
- 规划载体：本对话（RIPER-5 研究模式差距矩阵 → PLAN 模式实施计划）

## 一、目的与效果

把 PRD v0.23 中拍板密度最高、规格最完备的四项 check 侧能力一次落地，使 `doclib check` 从"对账工具"升级为"治理仪表盘"，完成 F13 强验证体系的最后拼图：

1. **孤儿检测**：馆外知识文档被机器检出（第七分类），"馆外无文档"从宪法口号变为可执法
2. **治理健康分**：check/status 输出 NN/100 (X) 治理分（五分项加权+等级），腐烂趋势会话开始即暴露——"越用越顺心"的可感知载体
3. **乐观锁 revision**：多 agent 并发写馆的"静默覆盖"不可能发生（写前记/写后比对）
4. **引导硬预算**：CLAUDE.md/AGENTS.md managed 区行数可见，≤150 行软上限（只显示不阻断）

## 二、问题点

- PRD 拍板与代码实现的差距（v0.23 研究确认）：state/check/ledger 中 revision/orphan/planning 零命中
- 孤儿文档无检测：馆外散落文档（如曾经的 docs/）只有 agent 自觉，无机器执法
- 治理无度量：check 只报违规清单，无综合分数，治理改善不可感知
- 多会话并发：agent A 写馆期间 agent B 也写，后写覆盖先写无任何检测
- 引导文件膨胀风险：无行数可见性，Q37/38 拍板的 ≤150 行无检测形态

## 三、研究结果

- 差距矩阵（v0.23 研究模式产出）：F13 缺孤儿检测/治理分/文档质量检测/乐观锁四项；F5 缺硬预算检测；F6 缺治理分与 revision 输出
- 现有测试模式成熟：10 个 test 文件 507 行，临时目录 + fixture 模式可直接复用
- 集成点清晰：check.ts 的 kindLabel/kinds 数组、check.ts core 的 findings 流、guides.ts 的 managed 区解析（MANAGED_BEGIN/END 已有常量）

## 四、代码实际情况

- `src/core/state.ts`（98 行）：State = {version, latest, snapshots, structureVersion, agents, acks}——**无 revision**；loadState 已有归一化先例（structureVersion ?? 1）
- `src/core/check.ts`（92 行）：runCheckCore 流程 = drift → docsChanged → covers 映射 → ack 过滤 → findings（unaccounted/uncovered）→ validateMigrations → managedRegionFresh；**无孤儿扫描**
- `src/core/ledger.ts`：CheckFindingKind = "unaccounted"|"uncovered"|"migration"|"guide-stale"——**无 orphan-doc**
- `src/commands/check.ts`（47 行）：kindLabel switch + kinds 数组硬编码四类；strict 判定 `r.findings.length === 0`
- `src/core/guides.ts`：MANAGED_BEGIN/END 常量已有，guideStampReport 先例可仿
- `src/commands/status.ts`（48 行）：无治理行/预算行；`src/commands/snapshot.ts`：saveState 前可插 revision 递增；`src/commands/plan.ts`：输出头部可插 revision
- DEFAULT_IGNORES 已含 doclib/.doclib/.plan/dist/node_modules——孤儿检测天然不扫馆内与载体

## 五、设计的方案

### 1. 孤儿检测（F13 第七分类）
- 新建 `src/core/orphan.ts`：`detectOrphanDocs(root): Promise<string[]>`——复用 collectFiles，过滤 .md，豁免 Q20 清单（根 README/CHANGELOG/CONTRIBUTING/CLAUDE/AGENTS + .github/ 前缀）；ack 过滤在 check 层做（保持纯函数）
- ledger.ts：CheckFindingKind 加 "orphan-doc"；check.ts core：ack 过滤（standing 全豁免/once 限当前基线）后 push findings
- check 命令：kindLabel"孤儿文档"、kinds 数组追加、strict 计入退出码

### 2. 治理健康分（Q22 精细分制定稿）
- check.ts core 新增 `HealthReport = {score, grade, parts{accounting,migration,placement,guides,quality}}` 与 `healthScore()`：
  - accounting = driftTotal===0 ? 1 : max(0, 1−(unaccounted+uncovered)/driftTotal)
  - migration = max(0, 1−0.2×count)；placement = max(0, 1−0.1×orphanCount)
  - guides = max(0, 1−0.5×staleCount)；quality = 1（文档质量检测未实现，预留满分）
  - score = round(40a+20m+20p+10g+10q)；grade：A≥90/B≥75/C≥60/D≥40/F
- check 末行 `治理: NN/100 (X)`；status 增治理行（latest 存在时调 runCheckCore）；json 含 health

### 3. 乐观锁 revision（Q36）
- state.ts：State 增 `revision: number`，emptyState 0，loadState 归一化 `?? 0`
- snapshot：saveState 前 revision += 1（输出行含 revision）；check/status/plan 输出 revision——agent 写前记、写后 check 比对，变更即重对账

### 4. 引导硬预算（Q37/38）
- guides.ts：`GUIDE_BUDGET_LINES = 150` + `guideBudgetReport(root)`——CLAUDE.md/AGENTS.md managed 区行数统计，返回 `CLAUDE.md 84/150 · AGENTS.md 84/150`，超限附瘦身提示
- status 输出"引导预算"行；**只显示不阻断**（不进 check findings）

### 5. 版本与同步
- package.json 0.3.0；cli.ts 帮助更新；引导模板 full/light 速查行更新 → sync 再生；doclib 同步（30-features/check.md 规格、feature-map #20、progress、PRD v0.24、README 命令表、custom 区指针）

## 六、备选方案

| 决策点 | 采用 | 被否备选 | 理由 |
| --- | --- | --- | --- |
| 孤儿 ack 过滤位置 | check 层过滤 | orphan.ts 内依赖 state | 保持纯函数可测性 |
| 治理分分项斜率 | 迁移 0.2/项、孤儿 0.1/项、引导 0.5/项 | 全部线性 1/N | 严重项快速降分，与 PRD"漏更扣最重"语义一致；权重可由 F14 实证校准 |
| quality 分项 | 预留满分 | 本轮顺带实现链接检测 | 范围控制——第二梯队再做，避免本轮过大 |
| revision 递增时机 | 仅 snapshot | check/plan 也递增 | PRD 语义"每次 snapshot 递增"；读命令不推进状态 |
| 引导预算计入 check | 只显示（Q38 拍板） | strict 计入违规 | 拍板原文"只显示不阻断" |
| 预算统计口径 | managed 区行数 | 全文件行数 | Q37 原文"managed 区 ≤150 行"；custom 区是项目自留不受限 |

## 七、实施清单

1. 新建 src/core/orphan.ts（detectOrphanDocs + Q20 豁免清单）
2. src/core/ledger.ts：CheckFindingKind 加 "orphan-doc"
3. src/core/state.ts：State 增 revision（emptyState/loadState 归一化）
4. src/core/check.ts：孤儿集成（ack 过滤）+ healthScore + CheckResult.health
5. src/core/guides.ts：GUIDE_BUDGET_LINES + guideBudgetReport
6. src/commands/check.ts：孤儿段/治理行/revision 输出
7. src/commands/status.ts：治理行 + 引导预算行 + revision
8. src/commands/plan.ts：revision 输出
9. src/commands/snapshot.ts：revision 递增 + 输出
10. src/cli.ts：帮助文本更新
11. package.json 0.3.0
12. 新建 orphan.test.ts；扩展 check.test.ts/guides.test.ts/state.test.ts
13. npm run typecheck + npm test 全绿
14. 临时目录冒烟验证（孤儿/ack/治理分/revision/预算五项）
15. doclib/30-features/check.md 规格补充
16. doclib/00-overview/feature-map.md #20 登记 implemented
17. doclib/00-overview/progress.md 补记
18. PRD 修订记录 v0.24 + 状态标注
19. 引导模板 full/light 速查行 + build + sync + custom 区版本指针 + README 命令表
20. doclib check/verify 复跑 + doclib snapshot 固化基线
