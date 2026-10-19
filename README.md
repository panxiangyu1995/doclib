# DocLib

把任意项目蒸馏成**可复原的文档图书馆**：有索引、有层次、覆盖全。任何 agent 或人，只凭这套文档，就能在别处**从零重新开发**出功能 ≥90% 复原的项目。

这是文档驱动的重新开发，**不是克隆**——文档承载行为、契约、设计意图与验收标准，而不是字节。

## 三件事

| 能力 | 说明 |
| --- | --- |
| 蒸馏 build | agent 分析任意项目，产出纯 Markdown 文档图书馆（`doclib/`） |
| 复原 rebuild | 只凭图书馆，在空目录从零开发复原（`doclib plan --rebuild`） |
| 保活 update | 代码任何变更后增量更新文档，无论落后一个版本还是十个版本 |

```
init → plan(BUILD) → agent 构建 → verify → snapshot        （蒸馏）
改代码 → diff → plan(UPDATE) → agent 增量更新 → verify → snapshot （保活）
任意时刻: plan --rebuild → agent 只凭图书馆从零复原          （复原）
```

## 安装

```bash
npm install
npm run build
npm link          # 可选：全局可用 doclib 命令
```

安装 skills（给 agent 的操作手册）——`doclib init --agents claude,opencode` 会按适配表自动落位到各 agent 目录；也可手动把 `skills/` 下目录复制到你的 agent 的 skills 目录（如 Claude Code 的 `.claude/skills/`）：

- `doclib-build`：如何把项目蒸馏成图书馆
- `doclib-update`：如何增量更新图书馆
- `doclib-rebuild`：如何只凭图书馆从零复原

## 快速开始

```bash
doclib init --agents claude,opencode   # 图书馆骨架(12卷) + .doclib/ + skills 落位 + 轻量引导
doclib plan      # 生成 BUILD 任务书（含自动采集的项目清单）
# → 让 agent 加载 doclib-build，按任务书构建图书馆
doclib verify    # 覆盖度报告
doclib snapshot --note "initial build"
```

### 保活循环（日常开发中随时执行）

```bash
doclib diff      # 代码 vs 基线：漂移 + 受影响文档
doclib plan      # 生成 UPDATE 任务书
# → 让 agent 加载 doclib-update，按任务书增量更新
doclib verify && doclib snapshot --note "update: 主题"
```

### 从零复原

```bash
doclib plan --rebuild --to ../myproj-rebuild
# → 让 agent 加载 doclib-rebuild，只读 doclib/，在目标目录从零开发
```

## 命令

| 命令 | 职责 |
| --- | --- |
| `init` | 初始化 `doclib/` 图书馆骨架与 `.doclib/` 簿记目录 |
| `plan` | 生成任务书：BUILD（无基线）/ UPDATE（有漂移）/ REBUILD（`--rebuild`） |
| `diff` | 当前代码 vs 基线快照：漂移清单 + 每个变更路径影响的文档 |
| `snapshot` | 记录当前代码状态为新基线（图书馆版本 +1，快照链上限 20 条） |
| `status` | 版本、基线、漂移概览、任务书列表 |
| `verify` | 覆盖度报告：未覆盖路径 / 失效文档 / INDEX 完整性 |

通用选项：`--json`、`--note`、`--to`、`--force`、`--rebuild`；init 专用：`--agents`（claude/opencode/cursor/generic）、`--guide`（light/none）。

## 文档图书馆结构

```
doclib/
├── README.md               # 入口：怎么读、维护铁律
├── INDEX.md                # 总索引：全部文档 + 一句话摘要
├── 00-overview/            # 项目定位、术语表、功能总清单（全馆之锚）
├── 10-architecture/        # 架构总览、数据模型、数据流、依赖、ADR
├── 20-modules/             # 每模块一卷：职责、边界、契约
├── 30-features/            # 每功能一份行为规格 + 可执行验收标准
├── 40-guides/              # 复原路线图、编码约定、测试策略
└── 50-reference/           # API/接口/配置精确参考
```

- 纯 Markdown 层级：人能读，agent 能导航
- 每篇文档 frontmatter 的 `covers` 指向其描述的代码路径——增量更新的锚点
- `.doclib/state.json`（簿记，不属图书馆）：基线快照链，支撑任意版本间距的增量更新

## 设计

见 [docs/DESIGN.md](docs/DESIGN.md)。
