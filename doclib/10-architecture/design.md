---
title: DocLib 架构设计（v2）
covers:
  - src/
  - assets/
status: living
---

# DocLib 架构设计（v2，对齐 PRD v0.30）

> 本文档回答"DocLib 如何构成与如何运转"。需求以 [prd.md](prd.md) 为唯一事实源，本文不得与 PRD 冲突。
> v0.1 代码为参考原型；标注【已实现】的部分已存在，其余按路线图落地。

## 为什么

需求靠文档承载、agent 靠引导驱动——CLI 与 skills 的每一层设计都服务于"图书馆活、可用、利于开发"的北极星；架构决策的动机与被否备选同步记录于 [decisions.md](decisions.md)。

## 是什么

五层构成：任意 repo 的 doclib/ 图书馆与 .doclib/ 簿记、tsc 编译的 CLI（src/commands 十三命令 + src/core 纯逻辑）、assets 模板与引导源、skills 方法论手册、vendored 图谱引擎（可选增强）。系统总览与模块职责见 §1、§2。

## 怎么运转

CLI 管"状态与执法"（快照链/漂移/强验证/归位处置），skills 管"语义与方法论"（怎么建、怎么保、怎么复原），两者以任务书衔接；图谱引擎只出候选、agent 撰写裁决。数据流与关键时序见 §3–§5。

## 1. 系统总览

```
┌─────────────────────────────────────────────────────────────┐
│                        任意 repo（源项目）                      │
│                                                             │
│  doclib/ ←— 图书馆（12 卷基线，纯 Markdown，唯一事实源）         │
│  .doclib/ ←— 簿记（state.json 快照链 + tasks/ 任务书）          │
│  .plan/ ←— 用户自有的开发规划（过程资料，不入馆）                 │
│  CLAUDE.md / AGENTS.md ←— 引导文件（轻量工作流提醒）             │
│  .claude/skills/ .opencode/… ←— agent 适配目录（skills 落位）   │
│                                                             │
│  源代码 ──────────────┐                                       │
└──────────────────────┼──────────────────────────────────────┘
                       │ hash / diff / 映射 / 任务书
              ┌────────┴────────┐
              │   doclib CLI    │ ←—— 机器活：状态与事实
              └────────┬────────┘
                       │ 任务书（BUILD/BOOTSTRAP/RESUME/UPDATE/REBUILD）
              ┌────────┴────────┐
              │  agent + skills │ ←—— 知识活：十个 skill
              └─────────────────┘
```

## 2. 设计原则

1. **北极星**：图书馆必须是活的、可用的、利于项目开发的；让图书馆变死的方案一律否决
2. **非克隆**：文档承载行为、契约、意图与验收标准；除 ≤10 行示意片段外不搬运源码
3. **职责切分**：CLI 管状态与事实（hash/diff/映射/任务书/统计），skills 管知识与方法论（怎么分析、怎么写、怎么开发、怎么验收）；CLI 不懂写作，skills 不懂 hash
4. **双受众**：一切产物为纯 Markdown（frontmatter 为 Markdown 生态惯例），人与 agent 同读
5. **同步纪律**：skills 与 CLI 行为严格一致，改一方必须同步改另一方

## 3. 系统组成

### 3.1 CLI（机器活）

| 命令 | 职责 | 状态 |
| --- | --- | --- |
| `init` | 初始化图书馆骨架 + 簿记目录 + skills/引导落位（交互问卷 + `--agents` 参数） | 【已实现，待扩展 agents 适配】 |
| `plan` | 生成任务书：BUILD / BOOTSTRAP / RESUME / UPDATE / REBUILD | 【部分实现：BUILD/UPDATE/REBUILD】 |
| `diff` | 漂移报告 + 路径→文档映射 + 进度对账提示 | 【已实现，待加对账】 |
| `snapshot` | 记录基线（版本 +1，快照链上限 20） | 【已实现】 |
| `status` | 版本/基线/漂移概览 + `.plan` 待登记/待归档提醒 + 引导版本戳检测 | 【部分实现】 |
| `verify` | 覆盖度 + 失效文档 + INDEX 完整性 + 类别完备性 + 引导版本戳 | 【部分实现】 |
| `sync` | 引导文件规则区与 skills 同步到已装 agent（区域化契约：managed 再生/custom 保留，幂等） | 【已实现】 |
| `check` | 强验证：双账本对账（漏更/无归属/迁移违规/引导过期），--strict 门禁退出码 1 | 【已实现】 |
| `ack` | 路径豁免登记（once 绑定基线自动清除 / standing 长期 / --remove） | 【已实现】 |
| `hook` | pre-commit 钩子安装/移除（--strict；--ci github 发 CI 模板） | 【已实现】 |
| `reconcile` | 进度对账重建：疑似完成清单 → agent 确认补录 | 【规划】 |
| `setup` | skills/引导文件安装与更新（等价于 init 的可重入部分） | 【规划】 |

内部职责分层：参数解析（cli.ts）→ 命令（commands/）→ 纯逻辑（core/）→ 模板（templates/）。

### 3.2 Skills（知识活，十个）

见 PRD F7。三核心已实现（build/update/rebuild），七个新增：setup、bootstrap、resume、dev（日常主力）、reconcile、audit、accept。存放于仓库 `skills/`（源），由 `init/setup` 安装到目标 agent 目录（适配表见 §6）。

### 3.3 图书馆（12 卷基线分类法）

见 PRD §7。要点：卷可扩展（编号顺延）、不适用须显式声明；`00-overview/feature-map.md` 为状态事实源（planned/in-progress/implemented/retired），`00-overview/progress.md` 为时间线视图；每篇文档 frontmatter `covers` 为增量更新锚点。

### 3.4 簿记（.doclib/）

```
.doclib/
├── state.json      # 版本号 + 快照链（每条含逐文件 sha256 表 + 检测统计）
│                   # v2 扩展：agents 安装记录、引导文件版本戳
└── tasks/          # 任务书（BUILD-001.md / UPDATE-002.md / REBUILD-001.md …）
```

## 4. 三条工作流与三层保活

### 4.1 工作流

```
蒸馏:   init → plan(BUILD) → doclib-build 构馆 → audit → snapshot
开发:   doclib-dev（.plan 双锚点 + 实时同步）→ snapshot          ←日常主力
兜底:   diff → plan(UPDATE) → doclib-update → verify → snapshot
复原:   plan(--rebuild) → doclib-rebuild（信息隔离）→ 副本校准 + 引导落位
新项目: plan(BOOTSTRAP) → doclib-bootstrap（对话挖掘 → 文档先行开发）
半成品: plan(RESUME) → doclib-resume（蒸馏已实现 + 登记 planned）
```

### 4.2 三层保活（新鲜度保障）

1. **实时层（主）**：引导文件中的实时同步规则约束 agent——开发中凡触及 12 卷任一卷的改动即时入馆
2. **流程层**：`.plan/` 双锚点（规划完成登记 planned；开发完成归档成果并推进状态）
3. **兜底层**：`diff` → UPDATE 任务书；`check` 强验证（state v3 双账本：代码账 + 文档账，确定性对账，--strict 可挂 pre-commit/CI 门禁）；CLI 对账报告；`reconcile` 终极重建——进度永不真正丢失（代码 hash + covers 映射即底层账本）

## 5. 状态模型（state.json v2）

```jsonc
{
  "version": 3,                       // 图书馆版本，snapshot 时 +1
  "latest": "snap-003",
  "structureVersion": 2,              // 图书馆结构版本（12 卷基线=2），引导版本戳检测用
  "agents": ["claude", "opencode"],   // 已安装的 agent 适配目标
  "acks": [],                         // 豁免登记 {path,note,at,kind:"once"|"standing",baseline?}；once 随 snapshot 清除
  "snapshots": [                      // 上限 20 条
    { "id": "snap-003", "version": 3, "at": "ISO", "note": "…",
      "stats": { "files": 420, "primary": "TypeScript", "…": "…" },
      "files": { "src/a.ts": "<sha256>" },        // 代码账
      "docs": { "doclib/README.md": "<sha256>" }  // 文档账（v3 起）：doclib/**/*.md + CLAUDE.md + AGENTS.md
    }
  ]
}
```

映射规则：covers 精确路径优先，其次目录前缀；新增无覆盖 → 需落文档；covers 全失效 → 失效文档。

## 6. Agent 适配表【规划】

| agent | skills 目录 | 引导文件 |
| --- | --- | --- |
| Claude Code | `.claude/skills/<name>/SKILL.md` | `CLAUDE.md`（与 AGENTS.md 内容同步） |
| opencode | `.opencode/skills/<name>/SKILL.md`（以实际约定为准，适配表可校正） | `AGENTS.md` |
| Cursor | `.cursor/rules/` | `AGENTS.md` |
| 通用 | — | `AGENTS.md`（agents.md 通用约定） |

适配表为 CLI 内置映射（core/agents.ts），可持续扩充；state.agents 记录已装目标，setup 更新时同步到正确位置。

## 7. 模块划分（src/）

```
src/
├── cli.ts                 # 入口 + 参数解析 + HELP
├── commands/              # 每命令一文件，返回 { text, json }
│   ├── init.ts plan.ts diff.ts snapshot.ts status.ts verify.ts
│   ├── reconcile.ts【规划】 setup.ts【规划】
├── core/                  # 纯逻辑，可单测
│   ├── fsutil.ts          # 遍历/hash/树渲染/ignore（默认 + .gitignore + .doclibignore）
│   ├── frontmatter.ts     # covers 解析
│   ├── state.ts           # 快照链/漂移/常量（v2: agents + structureVersion）
│   ├── detect.ts          # 语言/框架/入口探测
│   ├── mapping.ts         # covers 索引与路径→文档映射
│   ├── ledger.ts【规划】  # 进度账解析与对账（feature-map/progress.md）
│   └── agents.ts【规划】  # agent 适配表
└── templates/
    ├── library.ts         # 12 卷基线模板【待从 6 卷升级】
    └── guides.ts【规划】  # 引导文件模板（轻量/完整两档 + 版本戳）
```

## 8. 关键取舍记录

- **任务书是 Markdown 工单**：agent 是执行主体，自然语言最稳；事实部分（路径/计数/映射）由 CLI 机器生成保证可信
- **快照存全量 hash 表**：简单可靠，大仓库成本后续换链式 delta
- **`doclib/` 自身不入快照**：图书馆是产物不是源码；`.plan/` 同理（过程资料）
- **不提供 .plan 模板**：尊重用户既有规划习惯，CLI 只做时间感知提醒
- **引导文件版本戳**：把"文档会过时"变成机器可检测的事实，而非依赖人的记忆

## 9. 身先士卒（dogfooding）

本仓库自身启用 DocLib 作为第一个真实用户：图书馆管理 doclib 自己的开发（PRD/DESIGN 的演进、命令实现、skill 编写全部走图书馆流程）。这是检验"图书馆是否活的"最直接方式；所有对 PRD 的偏离都应暴露为图书馆缺陷而非口头共识。
