---
title: 架构总览
covers:
  - src/
  - assets/
status: stable
---

# 架构总览

> 权威架构文档：[docs/DESIGN.md](../../docs/DESIGN.md)（v2）。本卷为图书馆内索引视图。

## 分层

```
cli.ts（参数解析/分发/HELP）
  → commands/（每命令一文件，返回 {text, json}）
    → core/（纯逻辑：fsutil/frontmatter/state/detect/mapping/version/assets/agents/prompts/guides）
    → assets/（templates/library 22 文件 + guides 两档；build 时拷入 dist/assets）
```

## 关键选型

| 选型 | 理由 |
| --- | --- |
| ESM + NodeNext + strict | Node 原生生态、严格空安全 |
| 运行时仅依赖 ignore | gitignore 语义正确性 |
| 模板 assets 化（ADR-1） | md 书写自然、可被 skills 引用 |
| 引导戳覆盖策略（ADR-2） | 用户内容零丢失 |
