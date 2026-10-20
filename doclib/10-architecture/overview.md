---
title: 架构总览
covers:
  - src/
  - assets/
  - AGENTS.md
  - CLAUDE.md
  - README.md
status: stable
---

# 架构总览

> 权威架构文档：[design.md](design.md)（v2）与 [prd.md](prd.md)（v0.23，需求事实源）。本卷为图书馆内索引视图。

## 分层

```
cli.ts（参数解析/分发/HELP）
  → commands/（每命令一文件，返回 {text, json}）
    → core/（纯逻辑：fsutil/frontmatter/state/detect/mapping/check/ledger/guides/assets/agents/prompts/version）
    → assets/（templates/library 23 文件 + guides 两档；build 时拷入 dist/assets）
```

## 引导与验证系统

- **引导文件区域契约**：AGENTS.md/CLAUDE.md 分 managed 规则区（由 `assets/guides/` full/light 两档模板经 `doclib sync` 再生，改规则须改模板源）与 custom 定制区（项目 agent/用户维护，sync 保留）
- **实时同步映射表**（引导规则区核心）：含登记簿实时入账（实体五要素）、内容过时三态更新（默认不物理删除）、**新文档落位归位决策树 + 两级索引同步**（归位宪法 §7.5/PRD）、先馆后码查询约定——模板演进同步 full/light 两档
- **强验证链**：`check`（双账本对账七分类 + 文档质量检测：链接/引用存在性 + 依赖版本对账 + 治理健康分）← `ack`（once/standing 豁免）← `hook`（pre-commit --strict 门禁 / CI 模板）；入馆写协调 soft 约定（写前 check 对账）
- **扫描器分阶段（F15）**：阶段 0 纯 agent 扫描（现）→ 阶段 1 ast-grep 可选增强（PATH 探测，不进 npm 依赖）→ 阶段 2 codegraph 实验外挂（F14 三指标裁决）；三铁律：馆为事实源工具出候选 / 确定性语义性分层 / 可选增强优雅降级
- 门面文档 README.md 为项目入口叙事（徽章 + 三件事 + 五模式闭环 + npx 一键进入 + 双层结构 + 11 命令表 + skills 全家福），与 PRD/引导同步维护

## 关键选型

| 选型 | 理由 |
| --- | --- |
| ESM + NodeNext + strict | Node 原生生态、严格空安全 |
| 运行时仅依赖 ignore | gitignore 语义正确性 |
| 模板 assets 化（ADR-1） | md 书写自然、可被 skills 引用 |
| 引导戳覆盖策略（ADR-2） | 用户内容零丢失 |
