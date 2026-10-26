---
title: 架构总览
covers:
  - src/
  - assets/
  - AGENTS.md
  - CLAUDE.md
  - README.md
  - README.en.md
  - CONTRIBUTING.md
status: stable
---

# 架构总览

> 权威架构文档：[design.md](design.md)（v2）与 [prd.md](prd.md)（v0.30，需求事实源）。本卷为图书馆内索引视图——一段话读懂形态：CLI 十三命令管状态与执法，core 纯逻辑零副作用，assets 模板与引导源由构建拷贝分发，skills 承载 agent 方法论。

## 为什么

技术选型围绕"纯 Markdown + 确定性执法 + 零重依赖"展开——完整依赖台账见 [dependencies.md](dependencies.md)，关键选型及理由：

| 选型 | 理由 |
| --- | --- |
| ESM + NodeNext + strict | Node 原生生态、严格空安全 |
| 运行时仅依赖 ignore | gitignore 语义正确性 |
| 模板 assets 化（ADR-1） | md 书写自然、可被 skills 引用 |
| 引导戳覆盖策略（ADR-2） | 用户内容零丢失 |

## 是什么

四层调用结构——每层职责单一、可独立测试：

```
cli.ts（参数解析/分发/HELP）
  → commands/（每命令一文件，返回 {text, json}）
    → core/（纯逻辑：fsutil/frontmatter/state/detect/mapping/check/ledger/guides/assets/agents/prompts/version）
    → assets/（templates/library 24 文件 + guides 两档；build 时拷入 dist/assets）
```

## 怎么运转

系统以"引导约束 agent 实时入馆、CLI 兜底执法"双轮驱动：

- **引导文件区域契约**：AGENTS.md/CLAUDE.md 分 managed 规则区（由 `assets/guides/` full/light 两档模板经 `doclib sync` 再生，改规则须改模板源）与 custom 定制区（项目 agent/用户维护，sync 保留）
- **实时同步映射表**（引导规则区核心）：含登记簿实时入账（实体五要素）、内容过时三态更新（默认不物理删除）、**新文档落位归位决策树 + 两级索引同步**（归位宪法 §7.5/PRD）、先馆后码查询约定——模板演进同步 full/light 两档
- **强验证链**：`check`（双账本对账：6 类违规 + 馆外文档四态判定（工具链豁免可见）+ 文档质量检测（链接/引用存在性 + 依赖版本对账）+ 治理健康分）← `ack`（once/standing + `--dir` 目录豁免）← `place`（孤儿归位：collect/archive/restore，干跑默认 + 归档账可逆）← `hook`（pre-commit --strict 门禁 / CI 模板；fail-closed 自检 + 相对路径策略 + worktree 支持 + status 门禁四态；init 自动装 + sync 幂等补装）；入馆写协调 soft 约定（写前 check 对账）
- **扫描器分阶段（F15）**：阶段 0 纯 agent 扫描 → 阶段 1 ast-grep 可选增强（PATH 探测，不进 npm 依赖）→ **阶段 2 已落地（v0.30）**：codegraph 克隆集成（subtree vendor/codegraph + CJS 岛 + `doclib graph` 命令族 + 草稿候选管道；`.codegraph/` 为可再生缓存，图书馆仍是唯一事实源；telemetry 物理隔离；Node∈[22.5,25) 优雅降级）；三铁律：馆为事实源工具出候选 / 确定性语义性分层 / 可选增强优雅降级
- 门面文档 README.md 为项目入口叙事（定位与「不是什么」→ 30 秒上手决策表 → 6 类治理失效场景 + 传统做法对照 → 三条铁律与双层结构（含叙述层文体标准：教科书五段 / 登记簿条目五要素）→ 快速开始 4 路径 → 日常循环 → 12 卷结构 → 13 命令表 + 10 skills → 现状实证数字表 → 贡献入口），与 PRD/引导同步维护——README 的数字型事实集中成表并标注来源路径（防漂移，单点出处），命令语义以 `src/cli.ts` HELP 为唯一事实源；贡献细则独立成文 `CONTRIBUTING.md`（同为根级门面文件，Q20 豁免）；英文版 `README.en.md` 与中文版逐条对齐（结构/事实/数字一致），其门面豁免由**模式识别**原生生效（`core/orphan.ts` `isRootFacadeFile`：基名 + locale 标签形状，Q42/ADR #14），无需 `ack` 登记
