---
title: plausible 建馆侧档案
covers:
  - test/plausible
  - doclib/50-testing/benchmark/100-tier2-summary.md
ids: BENCH-T2-PLAUSIBLE
status: living
type: ledger
---

# plausible 建馆侧档案（160）

> 第三梯队主推荐样本（第二梯队·Elixir/OTP + OLAP 双存储）。汇总见 [100-tier2-summary.md](100-tier2-summary.md)。**复原侧待排期**（本册只记建馆侧事实）。

## 册导读

- 样本标识 `BENCH-T2-PLAUSIBLE`｜准入层级：第二梯队｜切片边界见下节。
- 本册内容：准入记录 / 建馆基线 / 面穷举对账 / 切片边界 / 已知缺口 / 复原侧占位。

## 准入记录

- 项目：plausible/analytics @ `722a49a`（AGPL-3.0 · v3.2.1 · 29,676★）
- 体量：Elixir 21.8 万行 + 前端 3.4 万行；200 条路由声明 · 242 个 Ecto 迁移 · 5884 条测试声明 · 100 条依赖 · 71 个 ClickHouse 引用文件 · 36 个 Oban 引用文件
- 准入判定：**本批唯一 Elixir/OTP + PG/ClickHouse 双存储样本**——10-architecture 的「异步管道与双源一致性」缺口只能由它暴露
- 域别：隐私友好 Web 分析 / 事件采集管道 / 双存储 OLAP

## 建馆基线

- 馆基线：`snap-005`（revision 5）｜馆内 68 篇 md / 7797 行
- 覆盖度：1427/1427 代码文件 = 100%｜失效文档 0｜索引完整性通过｜文体违规 0 / 倾倒警告 0｜旗标对账 Δ0
- 治理：100/100（A 级）｜strict 门禁通过
- 登记簿 **538 条**：ROUTE 240 · API 71 · QRY 101 · TRK 59 · PAGE 27 · TASK 28 · CLI 12
- 行为账：feature-map 72 条（56 implemented + 16 切片外 `planned`）｜30-features 13 篇规格共 **152 条 AC**
- 代表性报表选定：**Top pages 族**（pages / pages-with-hostname / entry-pages / exit-pages）

## 面穷举对账（源 == 册，Δ 全 0）

| 面 | 源枚举 | 登记 | Δ |
| --- | --- | --- | --- |
| HTTP 路由 | 240 | 240 | 0 |
| `/api/` 端点 | 71 | 71 | 0 |
| SPA 路由（25 声明 + 23 报表 key） | 27 | 27 | 0 |
| Mix 任务 | 12 | 12 | 0 |
| PG 迁移 | 242 | 242 | 0 |
| ClickHouse 迁移 | 54 | 54 | 0 |
| Oban worker | 27（+1 企业版树） | 28 | 0 |
| 旗标字面量 | 6 | 6 | 0 |
| 指标 / 维度 / 操作符 / 时间范围 / include | 16 / 35 / 14 / 8 / 13 | 同 | 0 |
| 错误码 / 丢弃原因 | 7 / 15 | 同 | 0 |

## 切片边界

| 做 | 不做（登记为 `planned`，无 AC） |
| --- | --- |
| 事件采集 API（tracker 端点） | billing |
| 站点 / 仪表盘统计 | enterprise |
| 一个报表（Top pages 族） | 团队协作（另有 SSO / GA 导入 / 插件 API / MCP 等 16 条切片外） |
| 基础 auth | — |

## 已知缺口

1. **稀疏检出未落盘**：`extra/lib/`（117 文件，企业版专属树）、`tracker/`（96）、`rel/`、`e2e/`、`fixture/`、`.github/`——经 `git ls-files` / `git show` 读取但未逐文件通读，这些树只登记到路由/字段/接口边界，无模块书与行为规格
2. 追踪脚本**完整变体表**未逐条登记（只登记 11 个基础变体基数与幂集关系）；`imported_*` 十表未逐字段登记
3. 本轮未编译未跑测（**Elixir 工具链在本机不可用**——上游会话下载被同机并发实例的 ffmpeg 抢占带宽）→ 行为结论均来自读码；写缓冲延迟 / 会话折叠合并 / 采样 / CDN 失效 / 跨时区边界已显式列为「人工验证项」
4. 依赖面按 8 类归纳（178 项逐项在 `mix.exs` 与两个 `package.json`），非逐项登记簿面
5. `rel/docker-entrypoint.sh` 逻辑未验证，部署入口行为为推断
6. 交互语义落在 `80-design/dashboard-interactions.md`（10 组「元素×状态×手势×反馈」四元组）+ `spa-routes.md` + `design-tokens.md`——**「交互语义无处安放」0 条**（唯一边缘项：邮件模板 MJML 响应式细节只做技术选型登记，未展开交互语义——切片内无邮件 UI 验收需求，未达 ADR 阈值）

## **关键事实纠正**（与上游会话假设不同，已在馆内纠正）

v3.2.1 **不存在**「PG events 表 → 作业同步到 ClickHouse」的链路——2020-06 两条迁移已删除 PG 侧事件/会话表，事件经**进程内 RowBinary 写缓冲（默认 5 秒攒批）直插 ClickHouse**；故**无跨存储同步窗口**，可见性延迟上界 ≈ 5 秒 + 查询耗时；采集端点为「接收即确认」语义（写缓冲 flush 失败**静默丢批且不回传客户端**）。

> 此条是「读码结论推翻纸面假设」的实例——也是本样本作为双存储一致性基准的价值所在。

## 复原侧

| 环节 | 状态 |
| --- | --- |
| 隔离复原 | 待排期（须不同会话/实例/模型，REBUILD-LOG 记身份） |
| 同题共答双跑 | 待排期 |
| 缺陷四分类 | 待排期 |
| 回灌 / 回归 | 待排期 |
