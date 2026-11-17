---
title: cc-switch 复原侧档案
covers:
  - test/cc-switch
  - test/cc-switch-rebuild
  - doclib/50-testing/benchmark/100-tier2-summary.md
ids: BENCH-CCSWITCH
status: stable
type: ledger
---

# cc-switch 复原侧档案（200）

> F14 方法论**首个 Tauri 双端样本**的复原侧闭环档案（建馆 → 隔离复原 → 门禁 → AC 答卷 → 差异四分类 → 回灌 → 回归）。样本馆与复原产物在 `test/`（不入本仓 git）；本册记闭环事实与回灌去向。

## 册导读

- 样本标识 `BENCH-CCSWITCH`｜类型：Tauri 2 + Rust + React 18 桌面应用（provider 切换工具）｜切片：claude provider 切片（41 命令契约面；非 claude 应用显式 TODO 占位）。
- 本册内容：样本与基线 / 复原终态 / 门禁与 AC 总览 / 差异四分类（R1–R5）/ 回灌与回归 / 开放项。
- 与 100–190 的差异：那些是建馆侧档案（复原侧待排期），本册是**复原侧闭环**——F14 三阶段 P1 信息零遗漏在本样本首次全链路实证。

## 样本与基线

- 样本馆：`test/cc-switch/doclib/`（12 卷 + 登记簿族）；快照链 snap-001 → **snap-004**（回灌前基线 snap-003）。
- 复原产物：`test/cc-switch-rebuild/`（REBUILD-001 工单；唯一信息源=样本馆，隔离复原不访问源仓）。
- 切片边界：claude 数据层 / live 引擎与切换 / provider 前端面 / i18n 与设备设置 / 次要面；非 claude 切换·终端·导入=命令存在但占位错误返回（E17/E23）；切片外命令名 23 个作边界登记（排除面声明，不进 covers）。

## 复原终态（2026-11-17，REBUILD-progress 留痕）

- 七阶段全部完成：脚手架 / 数据层 / 命令层 / live 引擎与切换 / 前端 provider 面 / i18n 与设备设置 / 次要面与打磨。
- 41 命令契约面 **100% 验证**（逐条命令名 + 参数形态 + 事件名）。
- E 组范围取舍 **28 项**（E1–E28；含 E4 四处「声明计数≠枚举」、E5 floor 键表 19+7 尾注读法歧义——均按枚举实现，馆侧计数本轮对账修正）。
- 踩坑 16 条（现象/根因/解决，留痕于 REBUILD-progress；本册不搬运，选录两条跨样本可迁移的：jsdom HTML5 拖拽无 DataTransfer 需桩注入 / react-query act 内跨 50ms 宏任务落定）。

## 门禁与 AC 总览

| 门禁 | 命令 | 结果 |
| --- | --- | --- |
| Rust 格式 / lint | `cargo fmt --check` / `cargo clippy --all-targets -- -D warnings` | ✅ / ✅ |
| Rust 测试 | `CC_SWITCH_TEST_HOME=$(mktemp -d) cargo test` | ✅ 65 passed（单元 60 + 集成快照 3 + 设备隔离 2） |
| 前端类型 / 单测 / 格式 | `pnpm typecheck` / `pnpm test:unit` / `pnpm format` | ✅ strict / ✅ 44 passed · 8 文件 / ✅ |

- **AC 52 条：✅ 34 直接测试通过 / ◐ 7 单元级部分覆盖 / ⚠️ 11 无直接测试**。
- 11 条 ⚠️ 分布：命令已实现无测试（import-export ×4、endpoints ×2）/ 环境依赖（终端 spawn 无 claude 二进制）/ 故障注入未做（写失败/预设表单填充/错误显示路径）。

## 差异四分类（R1–R5 → F14 分类学 → 去向）

| # | 实证 | 分类 | 去向 |
| --- | --- | --- | --- |
| R1 | 命令册子集登记无排除面声明；命令面零执法（P1 Δ 初判 6 被权威账 23 切片外名推翻——初判依据未穷举抽样） | 结构 | #47：verify Tauri 命令面对账（ADR #31） |
| R2 | 「面穷举对账 Δ0」声明行自述不实跑（机器无法区分实跑与自述） | 表述 | #47：build skill 对账行实跑证据规则 + audit 抽查项 |
| R3 | 计数头 4 处「声明计数≠枚举」过门禁（exclusive 17/16、AppError 16/17、AppType 17/16、命令数 38/37） | 内容 | #47：check `ledger-reconcile` notice + 馆侧计数按枚举回填 |
| R4 | 存储契约必填栏沉默（表复用/标识取值/备份命名/legacy 形状）→ 复原者被迫决策（E7/E8/E13/E18） | 内容 | 样本馆 ADR-3 存储契约回灌 + build skill 必填栏条款 |
| R5 | `listen`/`emit` 事件面无登记执法，未入账静默通过 | 结构 | #47：check `event-unregistered` notice + 事件册 18 条回灌 |

## 回灌与回归

- **回灌 8 项全落样本馆**：命令册 45 条 + 23 切片外名（排除面声明）/ 事件册 18 条（configLoadError、proxy-flags-changed 标存疑）/ 错误码册 / 错误显示规格 / ADR-3 存储契约 / 热撤键表（floor 26 = 19+7，exclusive 12 + 不可热撤 4）/ 两级索引 / 95-lessons L6 + progress。
- **扫描面纪律实证**：events.md covers 曾挂全部发射方文件 → verify 命令面源侧 68→128 刷切片外噪音；缩至切片内 2 文件（lib.rs + commands/provider.rs）+ 排除面声明段 → **68↔68 Δ0**（covers 并集=守卫扫描面的纪律侧实证，入主库 95-lessons 2026-11-17）。
- **回归**：verify Δ0 · check strict 绿 · 治理 **100/100（A）** · 重拍 **snap-004** 固化回灌终态。
- **主库反哺（#47，ADR #31）**：面穷举守卫第二面（Tauri 命令面）+ check 两新 soft notice + build/audit skill 修订 + 95-lessons 三条——本样本的 R1–R5 全部转为主库方法论条款。

## 开放项（如实标注）

- 11 条 ⚠️ AC + 7 条 ◐ AC = doclib-accept 补测清单（后续验收轮）。
- 2 条存疑事件（configLoadError / proxy-flags-changed）待源仓对账裁决（存疑标记挂账中）。
- 样本馆基线 snap-004 固化；后续源仓演进走 UPDATE 工单 + 排除面声明的 diff 对账驱动。