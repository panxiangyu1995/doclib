---
title: 数据模型
covers:
  - src/core/state.ts
  - src/core/frontmatter.ts
status: stable
---

# 数据模型

> DocLib 只有两个持久化结构：`.doclib/state.json`（簿记双账本：代码 hash + 文档 hash 的快照链）与馆内 frontmatter（文档 → 代码的锚点）——前者支撑漂移检测与乐观锁，后者支撑增量更新映射。

## 为什么

保活的对比基准必须是逐文件 hash（而非时间戳或 git 依赖）——快照链让"落后 N 个版本"一次吸收；covers 锚点让漂移精确映射到受影响文档，而不是全馆重写。

## 是什么

### .doclib/state.json（v2）

| 字段 | 类型 | 语义 |
| --- | --- | --- |
| version | number | 图书馆版本，snapshot 时 +1 |
| latest | string \| null | 最新快照 id（snap-NNN） |
| snapshots | Snapshot[] | 快照链，上限 20 条（MAX_SNAPSHOTS） |
| snapshots[].files | Record<path, sha256> | 全量文件 hash 表（doclib/ 与 .doclib/ 自身不入） |
| snapshots[].stats | object | files/primary/languages/frameworks 检测统计 |
| structureVersion | number | 图书馆结构版本（12 卷基线=2）；旧文件缺省归一化为 1 |
| agents | string[] | 已安装的 agent 适配目标；旧文件缺省 [] |
| acks | StateAck[] | 豁免登记 {path, note, at, kind: once\|standing, baseline?}；once 随 snapshot 清除；旧文件缺省 [] |
| snapshots[].docs | Record<path, sha256>（optional） | 文档账（v3 起）：doclib/**/*.md + CLAUDE.md + AGENTS.md；缺省 undefined 表示 v1 旧快照（check 降级） |

state.json 是 DocLib 唯一的机器状态载体——快照链是保活循环的对比基底，acks 是豁免的持久登记，agents 与 structureVersion 支撑多 agent 适配与结构演进；所有字段对旧版本文件做缺省归一（v1/v2 无感升级）。

### 文档 frontmatter（YAML 子集）

| 字段 | 语义 |
| --- | --- |
| covers | string[]，指向真实代码路径（文件或目录），精确匹配优先、目录前缀其次 |
| status | draft/stable/living/not-applicable/retired |
| title | 标题 |

frontmatter 是每篇馆内文档的机器锚点通道：covers 支撑漂移到文档的映射与实体级对账，status 承载状态机（draft→stable→living→retired）。

解析器支持 block 列表（`covers:` + `- item`）与内联数组（`covers: [a, b]`）；空值归一为可追加空数组；type 字段承载文体覆盖（PRD §7.6）。

## 怎么运转

快照链滚动：每次 `snapshot` 追加一条全量 hash 记录并 `version +1`，超过 20 条弹出最旧（MAX_SNAPSHOTS）；`revision` 随每次 snapshot 递增作乐观锁比对锚（Q36）。`diff` 将当前 hashAll 与最新快照求差得漂移，经 covers 映射出受影响文档——文档账（docs）同机制对馆内 .md 生效。数据库无（DocLib 不落库）；Schema 演进纪律为未来持久化预置——混合账本制：实体在代码区 `migrations/`（`NNN_YYYYMMDD_<slug>.sql`），取号与登记在 [migrations.md](migrations.md)（forward-only、applied 不可变）。
