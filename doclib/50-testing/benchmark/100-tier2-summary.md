---
title: 第三梯队建馆侧汇总档案
covers:
  - doclib/50-testing/benchmark/110-rqlite.md
  - doclib/50-testing/benchmark/120-syncthing.md
  - doclib/50-testing/benchmark/130-headscale.md
  - doclib/50-testing/benchmark/140-yt-dlp.md
  - doclib/50-testing/benchmark/150-docmost.md
  - doclib/50-testing/benchmark/160-plausible.md
  - doclib/50-testing/benchmark/170-excalidraw.md
  - doclib/50-testing/benchmark/180-documenso.md
  - doclib/50-testing/benchmark/190-formbricks.md
ids: BENCH-T2
status: living
type: ledger
---

# 第三梯队建馆侧汇总档案（100）

> 复原基准第三梯队（复杂样本 + UI/UX 专项）的**建馆侧**总账。载体 `.plan/2026-10-27/benchmark-tier2.md`（feature-map #42）。
> 口径：本册只记**建馆侧**已闭环的事实（克隆锚点 / 馆规模 / 面穷举对账 / 切片边界 / 已知缺口）；**复原侧**（隔离复原 / 同题共答 / 缺陷四分类 / 回灌 / 回归）尚未排期，各样本册中「复原侧」小节一律标 `待排期`。

## 册导读

- **范围**：本轮纳入 9 个样本——主推荐 6 仓（rqlite / syncthing / headscale / yt-dlp / docmost / plausible）+ UI/UX 专项 3 仓（excalidraw / documenso / formbricks）。
- **挑战档 2 仓**（meilisearch / zellij）按载体 §4.1「后置」处理——本轮**未克隆、未建馆**，原因：Rust 双巨物（27.2 万 / 47.9 万 LOC）建馆耗时最长，且上游会话仅做过代码级实测、未编译。
- **图例**：`锚点` = 上游 commit（建馆时复现的事实基准）；`馆基线` = 样本馆自身的 `doclib snapshot` 版本号；`面穷举对账` = 源码枚举数 ↔ 登记簿条目数的逐类差值；`切片外` = 本轮明确不做、登记为 `planned` 且**不给验收标准**的功能。
- **状态**：`建馆侧完成` / `复原侧待排期` / `已知缺口` 三态并存——**建馆完成不等于复原可用**，中间隔着复原侧全链路。

## 样本总账

| # | 样本 | 锚点 | 许可 · 版本 | 语言 | 馆规模（md） | 登记簿条目 | feature-map | AC | 覆盖 | 馆基线 | 治理 | 复原侧 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 110 | rqlite | `a742e3f` | MIT · v10.6.5 | Go + Py | 73 | 391 | 65 | 270 | 360/360 100% | snap-005 | A | 待排期 |
| 120 | syncthing | `70b5bc7` | MPL-2.0 · v2.1.7 | Go + JS | 68 | 690 | 80 | 196 | 590/590 100% | snap-005 | A | 待排期 |
| 130 | headscale | `2d220b2` | BSD-3-Clause · v0.29.6 | Go | 70 | 410 | 130 | 140 | 439/439 100% | snap-005 | A | 待排期 |
| 140 | yt-dlp | `f264a6c` | Unlicense · 2026.10.26 | Python | 79 | 2805 | 60 | 235 | 1125/1125 100% | snap-006 | A | 待排期 |
| 150 | docmost | `6d117f8` | AGPL-3.0 · v0.97.0 | TS/TSX | 78 | 715 | 87 | 251 | 1611/1611 100% | snap-008 | A | 待排期 |
| 160 | plausible | `722a49a` | AGPL-3.0 · v3.2.1 | Elixir + 前端 | 68 | 538 | 72 | 152 | 1427/1427 100% | snap-005 | A | 待排期 |
| 170 | excalidraw | `b7de45e` | MIT | TS/TSX | 62 | 518 | 107 | 149 | 718/718 100% | snap-007 | A | 待排期 |
| 180 | documenso | `8707e33` | AGPL-3.0 | TS/TSX | 78 | 815 | 112 | 244 | 2432/2435 99.9% | snap-006 | A | 待排期 |
| 190 | formbricks | `db3a053` | 混合（核心 AGPL + EE 另约） | TS/TSX | 70 | 885 | 83 | 123 | 4158/4903 85% | snap-005 | A | 待排期 |

合计：**馆 646 篇**｜**登记簿 6967 条**｜**行为条目 794 条**｜**验收标准 1760 条**｜9/9 治理 A 级、strict 通过。

## 本轮共同结论

### 1. 复杂度维度按计划补齐

| 计划目标维度 | 承载样本 | 馆内落点 |
| --- | --- | --- |
| 分布式共识 | rqlite | 10-architecture + cluster 模块卷（Raft 角色/选举/任期/日志复制/提交/心跳/成员变更/快照安装） |
| P2P 协议 + 加密 + 冲突 | syncthing | 协议/加密/冲突三合一，跨 5 卷 |
| 控制面 + 策略 DSL | headscale | ACL 策略引擎（HuJSON 策略 → 规则编译） |
| 千级插件/提取矩阵 | yt-dlp | 2040 个提取器类登记 + 452 个 CLI 长名 + 51 条输出模板语法 |
| 实时协作（CRDT） | docmost | Yjs/Hocuspocus + BullMQ 异步 + S3 双存储 |
| Elixir/OTP + OLAP 双存储 | plausible | PG/ClickHouse 双存储职责边界 + Oban 作业语义 |
| UI/UX 交互契约 | excalidraw / documenso / formbricks | 80-design 交互契约册（106 / 73 / 54 条） |

### 2. 交互契约提案的 ADR 触发条件**已满足**（载体 §4.3 判据）

三个 UI/UX 样本合计报出 **22 条「交互语义无处安放」**条目（excalidraw 6 + documenso 8 + formbricks 8），**远超 ≥3 条阈值**——即：交互语义在现有卷结构（叙述书 + 登记簿册）里确有系统性承载缺口，不是个别遗漏。已按载体 §4.3 提 ADR 立项基线演进（`doclib/10-architecture/decisions.md` ADR #27），**本轮不预写规格**（避免空转），规格随首轮复原侧闭环时按实测缺口再定形态。

### 3. 机器门禁漏检的一类缺陷（注记污染）

建馆后自检发现：docmost 样本的 30-features 规格里，每条验收标准行末都拖着**答卷占位列** `| 实测 | 一致? | 证据`（17 篇规格 251 条 AC、共 753 个空单元格）。`doclib check` 的注记污染检测**未拦住**（违规 0、治理 100/100 A 级照常通过）——说明当前污染词表认的是「答卷日期」等具体词形，认不出「答卷表格的空占位列」这一形态。已定点修正（占位列剥离，AC 语义零改动），**该形态的检测缺口留作下一轮基线演进候选**。

## 复用了什么（本轮工程事实）

- 9 个仓的浅克隆**直接复用上游会话实测期的临时工作副本**（`/var/folders/.../T/opencode/bench/`），而非重新 `git clone`——锚点逐一核对一致（`git log -1` 与载体登记的短哈希逐仓比对），省去数 GB 重下载；`node_modules` 不随迁（复原侧需要时重装），`test/` 已被本仓 `.gitignore` 排除，样本馆不入 git。
- 建馆由 9 个并行 agent 各领一仓执行，统一简报（硬红线 / 文体规范 / 登记簿五要素 / 十二卷交付物 / 覆盖度清单 / 校验命令）先行落盘为单一事实源，避免九份 prompt 漂移。
- 收尾统一走 `doclib verify` → `doclib sync`（引导反哺刷新）→ `doclib snapshot` → `doclib check`：**sync 必须排在 snapshot 之前**，否则引导刷新造成的漂移会让 `check` 的对账面归零（治理分 95→60），需再 snapshot 才能归位。

## 下一步（复原侧，待排期）

1. 逐仓 `doclib plan --rebuild` 生成 REBUILD 任务书（带 revision 乐观锁），**复原者须为不同会话 / 不同实例 / 理想不同模型**（F14 污染防护铁律），REBUILD-LOG 记录复原者身份；
2. 同题共答双跑 + 差异清单 → 缺陷四分类（内容 / 结构 / 表述 / 验收）入账；
3. 回灌（项目级补账）+ 基线演进提案（结构缺陷）——**结构缺陷是本轮 ADR #27 的实测依据来源**；
4. 回归重跑（基线分类法变更时必跑）；
5. 档案入馆扩充（各样本册的「复原侧」小节 + 答卷卷 + 差异卷 + 回灌卷）。
