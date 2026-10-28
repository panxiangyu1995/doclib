---
title: headscale 建馆侧档案
covers:
  - test/headscale
  - doclib/50-testing/benchmark/100-tier2-summary.md
ids: BENCH-T2-HEADSCALE
status: living
type: ledger
---

# headscale 建馆侧档案（130）

> 第三梯队主推荐样本（第三梯队·控制面）。汇总见 [100-tier2-summary.md](100-tier2-summary.md)。**复原侧待排期**（本册只记建馆侧事实）。

## 册导读

- 样本标识 `BENCH-T2-HEADSCALE`｜准入层级：第三梯队（控制面深度）｜切片边界见下节。
- 本册内容：准入记录 / 建馆基线 / 面穷举对账 / 切片边界 / 已知缺口 / 复原侧占位。

## 准入记录

- 项目：juanfont/headscale @ `2d220b2`（BSD-3-Clause · v0.29.6 · 45,077★）
- 体量：Go 20.0 万行；1298 个 Go 测试 · `go.mod` 236 条 require · 23 个 CI workflow · 51 篇文档
- 控制面子域（上游实测）：`api` / `apiv1` / `apiv2` / `auth` / `capver` / `derp` / `dns` / `noise` / `oidc` / `policy`（v1+v2）/ `poll` / `tailsql`
- 准入判定：控制面深度远超现有 C# 后端样本（memos/aspnetcore 只有单后端 API 面）；本轮**锁 API v1** 避开 v2 演进中
- 域别：控制面 / 策略 DSL / 身份集成（现有基准全缺）

## 建馆基线

- 馆基线：`snap-005`（revision 5）｜馆内 70 篇 md
- 覆盖度：439/439 代码文件 = 100%｜失效文档 0｜索引完整性通过｜文体违规 0｜倾倒警告 0｜旗标面 Δ0
- 治理：100/100（A 级）｜strict 门禁通过
- 登记簿 **410 条**（8 册）：API 端点 29 · CLI 命令 47 · CLI 旗标 27 · 鉴权矩阵 30 · 静态资产 26 · 配置 104（+弃用 24 + 环境变量 24）· 工具/CI 旗标 35 · 夹具旗标 64
- 行为账：feature-map 130 条（123 implemented + 7 切片外 `planned`）｜30-features 9 篇规格共 **140 条 AC**

## 面穷举对账（Go 源码逐条枚举，差异全 0）

| 面 | 源枚举 | 登记 | Δ |
| --- | --- | --- | --- |
| API v1 端点 | 29 | 29 | 0 |
| CLI 命令 | 47 | 47 | 0 |
| CLI 旗标名（声明语句 53 处） | 27 | 27 | 0 |
| 配置键（viper 96 + TLS 8） | 104 | 104 | 0 |
| 弃用配置 / 环境变量 | 24 / 24 | 24 / 24 | 0 |
| 夹具旗标（表一 32 + 表二 32） | 64 | 64 | 0 |
| 工具 / CI 旗标 | 27 + 8 = 35 | 35 | 0 |

工具自带扫描器为 TypeScript 形态（`.route.ts` / `.tsx` / `.proto`），在 Go 仓内端点与页面计数恒 0——其报出的「API Δ29」是**口径差**而非遗漏，已在册导读写明。

## 切片边界

| 做 | 不做（登记为 `planned`，无 AC） |
| --- | --- |
| 节点注册（m-node / 节点加入） | DERP / HA / embedded DERP |
| preauth key（预授权密钥） | API v2 |
| policy（ACL 策略 v1 + v2 语义） | Tailscale SSH 下发面 |
| DNS（MagicDNS） | — |
| API v1 | — |

## 已知缺口

1. 切片外四项（DERP / embedded DERP / HA / API v2 / SSH 下发）按切片外登记，无 AC
2. 上游 `docs/` 43 篇用户文档以 covers 锚点收编，**未逐句翻译**（上游真相源在原处，馆内不重复承载）
3. 1298 个测试函数与 31 个 servertest 文件**未逐条登记用例映射**
4. 策略校验错误以**语义**而非逐字文案落库（反克隆权衡）
5. 本轮未编译未跑测——上游实测已知 `cmd/headscale/cli` 在 macOS 因 unix socket `bind: invalid argument` 失败（**环境限制，非代码缺陷**），已按源码事实描述，未误判为设计缺陷
6. 80-design 显式声明 N-A（CLI + HTTP 服务，无图形界面）；OIDC 四个网页的构造机制落在 `20-modules/templates.md`
7. **「交互语义无处安放」0 条**

## 复原侧

| 环节 | 状态 |
| --- | --- |
| 隔离复原 | 待排期（须不同会话/实例/模型，REBUILD-LOG 记身份） |
| 同题共答双跑 | 待排期 |
| 缺陷四分类 | 待排期 |
| 回灌 / 回归 | 待排期 |
