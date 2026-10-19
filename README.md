# DocLib

把任意项目蒸馏成**可复原的文档图书馆**：有索引、有层次、覆盖全。任何 agent 或人，只凭这套文档，就能在别处**从零重新开发**出功能 ≥90% 复原的项目。

这是文档驱动的重新开发，**不是克隆**——文档承载行为、契约、设计意图与验收标准，而不是字节。

**先查图书馆，再查代码**：图书馆是 agent 查阅项目信息的首选渠道——实体问题（某 API 的字段与响应结构、某图标用在哪）从登记簿直达，代码用于验证；查码所得回填建账，越查越准。图书馆即 Markdown 形式、实时更新的**代码库知识图谱**（叙述层讲理解 + 实体登记簿供查询）。

**大 repo 友好**：可选集成代码分析工具（ast-grep 确定性扫描 / codegraph 知识图谱）作为图书馆的**加速器**——馆为事实源，工具出候选，agent 裁决；工具缺失优雅降级，不阻塞任何核心流程（见 PRD F15）。

## 三件事

| 能力 | 说明 |
| --- | --- |
| 蒸馏 build | agent 分析任意项目，产出纯 Markdown 文档图书馆（`doclib/`） |
| 复原 rebuild | 只凭图书馆，在空目录从零开发复原（`doclib plan --rebuild`）；**复原即基准测试**——对比原仓库与复原仓库的行为差异，即为图书馆缺陷显影，对症下药后回归验证（见 40-guides/benchmark.md） |
| 保活 update | 代码任何变更后增量更新文档，无论落后一个版本还是十个版本；功能移除走**六步全链规程**（影响面预查→残留扫描→馆内联动→check 执法→留痕） |

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
| `status` | 版本、基线、漂移、治理健康分、引导预算概览、任务书列表 |
| `verify` | 覆盖度报告：未覆盖路径 / 失效文档 / INDEX 完整性 |
| `sync` | 引导文件规则区与 skills 同步再生（幂等，定制区保留） |
| `check` | 强验证：代码账+文档账双账本对账（漏更/无归属/迁移违规/引导过期/孤儿文档），`--strict` 门禁 |
| `ack` | 路径豁免登记（once 绑定基线自动清除 / standing 长期） |
| `hook` | pre-commit 钩子安装/移除（`--strict`；`--ci github` 出 CI 模板） |

通用选项：`--json`、`--note`、`--to`、`--force`、`--rebuild`；init 专用：`--agents`（claude/opencode/cursor/generic）、`--guide`（light/none）。

## 文档图书馆结构

双层结构——叙述层（12 卷基线）讲理解，实体层（登记簿族）供查询：

```
doclib/
├── README.md               # 入口：怎么读、维护铁律
├── INDEX.md                # 总索引：全部文档 + 一句话摘要
├── 00-overview/            # 项目定位、术语表、功能总清单（全馆之锚）
├── 10-architecture/        # 架构总览、数据模型、数据流、依赖、ADR、迁移账本
├── 20-modules/             # 每模块一卷：职责、边界、契约
├── 30-features/            # 每功能一份行为规格 + 可执行验收标准
├── 40-guides/              # 复原路线图、编码约定、开发工作流
├── 50-testing/             # 测试方案、测试矩阵、测试设置
├── 60-config/              # 工程设置全集：lint/format、构建、CI/CD、环境变量
├── 70-deploy/              # 部署：环境矩阵、发布流程、运维与回滚
├── 80-design/              # UI/UX：设计系统、交互细节、资产说明
├── 90-reference/           # API/接口/协议精确参考
├── 95-lessons/             # 经验教训：bug 与解决办法、踩坑记录
├── [登记簿（开放册制）]     # 实体层：首批 api / ui-assets / routes / config / events；
│                           # 新资产类型 = 新册（框架通用：条目五要素/状态机/ID）
└── 99-archive/             # 档案卷：过时内容降级保史（墓碑注明何时/为何/被何取代）
```

- 纯 Markdown 层级：人能读，agent 能导航；目录编号即层次，INDEX 即索引
- **归位宪法**：所有文档在图书馆中都有正确的地方可去——馆内是默认，馆外是例外，例外必须显式（工具链白名单或 ack 登记）；落文档先走归位决策树，落位即登记两级索引（INDEX + 卷 _index），万级文档 agent 也能瞬间定位
- 每篇文档 frontmatter 的 `covers` 指向其描述的代码路径——增量更新的锚点；登记簿条目细到实体级（API 字段、图标位置）
- 更新过时内容默认降级保史（状态机/墓碑/档案卷），物理删除仅限失真与显式指令
- `.doclib/state.json`（簿记，不属图书馆）：基线快照链，支撑任意版本间距的增量更新

## 设计

见 [doclib/10-architecture/design.md](doclib/10-architecture/design.md) 与 [doclib/10-architecture/prd.md](doclib/10-architecture/prd.md)。
