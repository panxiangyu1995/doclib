---
type: plan
feature: 47
generated: 2026-11-17
---

# #47 面穷举守卫扩展：Tauri 命令面对账 + check 两新判定 + 扫描面/排除面纪律

## 目的

cc-switch 复原基准（F14 方法论首个 Tauri 双端样本）复原侧闭环实证了 5 项守卫缺口（R1–R5），全部通过 verify/check 静默放行。本条目把缺口收敛为：①verify 增 Tauri 命令面对账（面穷举守卫第二面）②check 增两新 soft notice（账实对账/事件未入账）③扫描面与排除面纪律成文（skill 规则 + ADR + 教训 + 基准档案）。

## 实证背景（R1–R5，来源：cc-switch 复原基准 test/cc-switch + test/cc-switch-rebuild）

- **R1 命令面未穷举入账**：命令册子集登记（切片内 45 条 + 切片外名 23 个）无排除面声明；全仓 Tauri 命令面 396（裸 362 + 带参 34），切片面（covers 并集）68。P1 命令面 Δ 初判「6」被权威账「23 切片外名」推翻——初判依据是未穷举的抽样，而非全量枚举。
- **R2 对账纪律行无实跑**：建馆期「面穷举对账逐类差值 0」类声明行存在自述不实跑形态（cc-switch 馆 95-lessons L6 孪生：声明计数无实跑证据）——机器无法区分「实跑过」与「自述」。
- **R3 计数是派生值**：4 处「声明计数 ≠ 枚举」过门禁（exclusive env 声明 17/枚举 16、AppError 声明 16/枚举 17 变体、AppType 声明 17/枚举 16 变体、命令数册导读标 38/在册 37；floor 26 键 = 19 + 尾注 7 的读法歧义同族）——计数头随演进而未更新，无同节枚举支撑。
- **R4 存储契约必填栏沉默**：表复用方式（universal 伪值）、legacy 数据形状、备份文件命名、identifier 取值等必填栏馆内沉默 → 复原者被迫自行决策（E7/E8/E13/E18）。
- **R5 事件面未入账**：`listen`/`emit` 事件引用无登记簿执法，未入账静默通过（回灌后 18 事件册，其中 configLoadError、proxy-flags-changed 标存疑待源仓对账）。

根因：面穷举守卫只有旗标面一类（ADR #16 字面量范式），跨进程契约面（Tauri 命令/事件）不在执法范围；「声明计数」无同节枚举支撑判定；边界/子集登记与守卫扫描面耦合但无纪律约束。

## 三拍板（用户 2026-11-17）

1. **A 一步到位**：主库 8 项（守卫代码 + skill 修订 + ADR + 教训 + 基准档案 + 活文档联动）与 cc-switch 回灌同一轮收口。
2. **verify 命令面/旗标面 = Tauri 专用**：本轮守卫扩展仅 Tauri 命令面（`#[tauri::command]` 字面量扫描，沿用 ADR #16「语言无关字面量」前提）；扫描面沿用 `coveredCodeFiles`（全馆 covers 并集），**代码语义不变**，修法在馆侧。
3. **check 两新判定全 notice 先行**：`ledger-reconcile`/`event-unregistered` 均为 soft notice（不进治理分、不进 strict），先观察误报面再议升级（#44 branch notice 先行先例）。

**扫描面/排除面裁决（定案）**：边界/子集登记的 frontmatter `covers` 只挂切片内面；切片外 file:line 作边界登记文字保留但**不 covers**（否则把守卫扫描面拉出切片——实证：events.md covers 一度挂全发射方文件，verify 命令面源侧 68→128，23 个切片外命令全被刷成「源有馆无」噪音；缩回 2 个切片内文件后回 68↔68 Δ0）；切片外发射方变更由源仓 diff 对账驱动；正文须有「排除面声明」段（枚举切片外名 + 变更驱动声明）。

## 执行清单

- [x] R1–R5 实证固化：cc-switch 回灌 8 项全落盘（命令册 45+23 切片外名/事件册 18（2 存疑）/错误码/错误显示/存储契约 ADR-3/热撤键表/两级索引/L6 教训/progress）
- [x] verify Tauri 命令面对账：`src/core/surface.ts` `TAURI_CMD_ATTR`(L122) + `reconcileTauriCommandSurface`(L125)（复用 `coveredCodeFiles`(L31) covers 并集扫描面，切片感知；裸/`name = ...` 覆盖/camelCase 三形态；入账判据=反引号显式登记，短名裸词提及不算）+ `src/commands/verify.ts`(L153) 报告行「Tauri 命令面对账（F15 阶段 0）: 源 N ↔ 馆 M（源有馆无 K）」
- [x] check 两新判定：`src/core/ledger-reconcile.ts`（新）`ledgerReconcileNotices`(L56)=节区标题/行内计数声明 × 同节枚举不符（`INLINE_PREFIX_MAX=12`(L11) 前缀守卫防长前缀误报，rebuild-plan.md:40 误报实证修复）+ `eventRegistrationNotices`(L110)=`listen`/`emit` 事件引用（`EVENT_REF`(L10)）vs 00-overview 事件账；benchmark/98-sessions 档案区豁免；`src/core/check.ts`(L394/L397) 接线
- [x] check 显示层 kind 白名单修复：两新 kind 原未进显示层（聚合行+明细行丢失）→ `src/commands/check.ts`(L119–120 count、L147 kind 列表) 补齐 + 回归测试
- [x] 测试：395→**408**（+13：surface.test.ts +5 Tauri 形态/切片感知/非 Tauri 不适用/非 pub fn/短名反引号；ledger-reconcile.test.ts +7 声明×枚举/行内/句中不误报/无枚举不误报/档案区豁免/事件正反；check.test.ts +1 显示层）；package.json test script 登记 `dist/core/ledger-reconcile.test.js`（漏登记=静默退出门禁铁律）
- [x] 冒烟：主库 `node dist/cli.js verify`/`check`（非 Tauri repo 走不适用注记分支）+ cc-switch 馆实跑（verify 命令面 68↔68 Δ0、check strict 绿、治理 100/100 A、重拍 snap-004）
- [x] skill 修订：doclib-build（面穷举清单 Tauri 命令面自检 + 排除面声明 + 对账行实跑证据 + 存储契约必填栏 + 覆盖度清单三项）+ doclib-audit（账实对账/事件账完备/排除面声明三抽查项 + 编号修正）
- [x] ADR #31 → `doclib/10-architecture/decisions.md`
- [x] 95-lessons 三条（2026-11-17：跨进程契约面必入账/对账行实跑+计数派生值/covers 并集=守卫扫描面）
- [x] 基准档案：`doclib/50-testing/benchmark/200-cc-switch.md` + 两级索引（INDEX + benchmark/_index）
- [x] 活文档联动：feature-map #47 + progress 补记 + check.md（两新 kind 口径）+ 20-modules（verify/core 行 + ledger-reconcile 新行）+ cli-acceptance-suite 增量 + testing.md 测试数历史 + README 数字表

## 边界

- 不泛化：命令面守卫本轮 Tauri 专用；tRPC/gRPC/CLI 其他命令族留后续实测后评估（字面量形态不同，需独立扫描器）
- 不升级：两新判定 soft 先行，升级 strict/治理分需误报观察期后另立拍板
- 不动 cc-switch 源仓与复原产物（test/ 不入本仓 git）；cc-switch 馆基线 snap-004 已固化回灌终态
- 存量漂移 flag（不擅动，呈报用户）：feature-map 行 #45 状态仍 `planned` 但行内已注「执行完成（2026-10-28）」——#45 实例收尾残留，待其会话或用户拍板处置

## 漂移留痕

- 并发：本轮无并发实例（写前 revision 96 / 基线 snap-105 重核）
- 本仓改动面：package.json/lock + 6 src 修改 + 2 新文件（ledger-reconcile.ts/.test.ts），typecheck 绿 + 408/408 全绿
- 教训处置：95-lessons 2026-11-17 三条（来源: 本载体）