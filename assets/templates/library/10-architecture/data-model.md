---
title: 数据模型
covers: []
status: draft
---

# 数据模型

> 数据是系统的记忆：实体、关系、约束与存储策略在此定档。TODO 补一句导读。

## 为什么

存储介质选择与建模取舍的理由：TODO

## 是什么

实体与关系：

```mermaid
erDiagram
  TODO
```

字段级 Schema：

| 实体/表 | 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- | --- |

## 怎么运转

存储与迁移的运行策略（读写路径、缓存、迁移治理 → migrations.md 账本）：TODO
Schema 变更的纪律与三方言同步要求：TODO
