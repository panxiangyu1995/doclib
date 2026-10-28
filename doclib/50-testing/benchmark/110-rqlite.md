---
title: rqlite 建馆侧档案
covers:
  - test/rqlite
  - doclib/50-testing/benchmark/100-tier2-summary.md
ids: BENCH-T2-RQLITE
status: living
type: ledger
---

# rqlite 建馆侧档案（110）

> 第三梯队主推荐样本（第一梯队）。汇总见 [100-tier2-summary.md](100-tier2-summary.md)。**复原侧待排期**（本册只记建馆侧事实）。

## 册导读

- 样本标识 `BENCH-T2-RQLITE`｜准入层级：第一梯队（可完整复原）｜切片边界见下节。
- 本册内容：准入记录 / 建馆基线 / 面穷举对账 / 切片边界 / 已知缺口 / 复原侧占位。

## 准入记录

- 项目：rqlite/rqlite @ `a742e3f`（MIT · v10.6.5 · 17,872★）
- 体量：Go 12.3 万行 + Python 5.1k；19 个 Raft 引用文件 · 1445 个 Go 测试函数 · 26 个 HTTP 路径字面量 / 20 个 handler · 4 个 CLI（`rqlite` / `rqlited` / `rqbench` / `version`）
- 结构特征：`cluster/` + `db/` + `snapshot/` + `cdc/` 四份 DESIGN.md（上游自带设计文档，属上游真相源，非本馆自撰）
- 准入判定：代码量在主推荐 6 仓中最小，但**概念密度最高**（分布式共识 + SQL 存储 + HTTP + CLI 四层叠合）——信噪比最优，选为第一梯队
- 域别：分布式共识 / 嵌入式 SQL 数据库（现有基准全缺）

## 建馆基线

- 馆基线：`snap-005`（revision 5）｜馆内 73 篇 md（12 卷 + 登记簿 + 索引）
- 覆盖度：360/360 代码文件 = 100%｜失效文档 0｜索引完整性通过｜文体违规 0
- 治理：100/100（A 级）｜strict 门禁通过
- 登记簿 **391 条**：http-api 71（端点 22 / 参数 33 / 请求体 5 / 状态码 11）· cli-flags 127（rqlited 71 + rqlite 12 + rqbench 9 + 点命令 32 + 补全 3）· cluster-protocol 44 · config-items 57 · errors 55 · 80-design 资产 37
- 行为账：feature-map 65 条（切片外 5 条标 `planned`）｜30-features 17 篇规格共 **270 条 AC**（表格形态，含可执行探针命令与期望值）
- 另含 21 条 ADR 与本馆教训条目

## 面穷举对账（源码枚举 ↔ 登记簿，逐类差值 0）

| 面 | 源枚举 | 登记 | Δ |
| --- | --- | --- | --- |
| HTTP 端点 | 22 | 22 | 0 |
| HTTP 参数 | 33 | 33 | 0 |
| 请求体形态 | 5 | 5 | 0 |
| 状态码 | 11 | 11 | 0 |
| 集群命令 | 15（+1 UNKNOWN） | 16 | 0 |
| rqlited / rqlite / rqbench 旗标 | 71 / 12 / 9 | 71 / 12 / 9 | 0 |
| 点命令 | 32 | 32 | 0 |
| 权限 | 19 | 19 | 0 |
| 一致性级别 | 5 | 5 | 0 |
| 备份格式 | 4 | 4 | 0 |
| 投票权 / 存储类型 / 被禁 PRAGMA | 3 / 3 / 5 | 3 / 3 / 5 | 0 |
| Raft 命令类型 | 8 | 8 | 0 |
| 界面资产 | 37 | 37 | 0 |

旗标双向对账：**源有馆无 0**；馆有源无 7（5 项为 `mkideal`/cli 结构体标签注册的长名——源码无双横线字面量；2 项为示例命令里 curl 自身选项）——经逐条裁决**无虚构**。

## 切片边界

| 做 | 不做（登记为 `planned`，无 AC） |
| --- | --- |
| 3 节点集群 | CDC（变更数据捕获） |
| HTTP query / execute API | S3 / GCS 存储扩展 |
| backup / restore | OTLP 遥测桥 |
| 读写一致性级别（5 档） | — |
| CLI：rqlite / rqlited / rqbench / version | — |

## 已知缺口

1. **全部 AC 为读码推导**——本轮按纪律不编译不运行，断言未经运行验证（复原侧同题共答时逐条对照）
2. 7 个 OTLP 旗标声明存在但未注册，OTLP 当前不可达（切片外）
3. `rqlited.sh` bash 补全脚本过期（拼写错误 + 已删旗标）——登记为 `deprecated`
4. 切片外三项（CDC / S3-GCS / OTLP）仅有模块卷与登记簿条目，无规格与 AC
5. `version` 非独立可执行文件（`cmd` 包承载 linker 变量）——已按源码事实修正表述
6. 控制台交互语义全部落位（80-design + console.md 14 条 AC），**「交互语义无处安放」0 条**

## 复原侧

| 环节 | 状态 |
| --- | --- |
| 隔离复原 | 待排期（须不同会话/实例/模型，REBUILD-LOG 记身份） |
| 同题共答双跑 | 待排期 |
| 缺陷四分类 | 待排期 |
| 回灌 / 回归 | 待排期 |
