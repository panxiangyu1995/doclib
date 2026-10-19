---
title: 数据模型
covers:
  - src/core/state.ts
  - src/core/frontmatter.ts
status: stable
---

# 数据模型

## .doclib/state.json（v2）

| 字段 | 类型 | 语义 |
| --- | --- | --- |
| version | number | 图书馆版本，snapshot 时 +1 |
| latest | string \| null | 最新快照 id（snap-NNN） |
| snapshots | Snapshot[] | 快照链，上限 20 条（MAX_SNAPSHOTS） |
| snapshots[].files | Record<path, sha256> | 全量文件 hash 表（doclib/ 与 .doclib/ 自身不入） |
| snapshots[].stats | object | files/primary/languages/frameworks 检测统计 |
| structureVersion | number | 图书馆结构版本（12 卷基线=2）；旧文件缺省归一化为 1 |
| agents | string[] | 已安装的 agent 适配目标；旧文件缺省 [] |

## 文档 frontmatter（YAML 子集）

| 字段 | 语义 |
| --- | --- |
| covers | string[]，指向真实代码路径（文件或目录），精确匹配优先、目录前缀其次 |
| status | draft/stable/living/not-applicable/retired |
| title | 标题 |

解析器支持 block 列表（`covers:` + `- item`）与内联数组（`covers: [a, b]`）；空值归一为可追加空数组。

## 数据库 Schema 演进

混合账本制：实体在代码区 `migrations/`（`NNN_YYYYMMDD_<slug>.sql`），取号与登记在 [migrations.md](migrations.md)（forward-only、applied 不可变）。
