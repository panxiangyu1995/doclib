# DocLib

[![npm version](https://img.shields.io/npm/v/@panxiangyu1995/doclib.svg)](https://www.npmjs.com/package/@panxiangyu1995/doclib)
[![license](https://img.shields.io/npm/l/@panxiangyu1995/doclib.svg)](LICENSE)
[![release](https://github.com/panxiangyu1995/doclib/actions/workflows/release.yml/badge.svg)](https://github.com/panxiangyu1995/doclib/actions/workflows/release.yml)

> **中文** | [English](README.en.md)

让项目文档从「写完就烂的说明」变成「随代码演化的可执行规格」——**任何 agent 或人只读这套文档，就能在别处从零重建该项目**（功能复原 ≥90%）。

- **是什么**：一套系统化的项目规格与验收系统。纯 Markdown 的「文档图书馆」是项目唯一事实源，agent 依据它开发、依据它验收。
- **不是什么**：不是克隆器（不搬运源码）、不替代 git（只管「代码 ↔ 文档」同步）、不绑定特定 agent 产品。

## 本文导读

[30 秒上手](#30-秒上手) · [为什么需要它](#为什么需要它) · [传统做法为什么不够](#传统做法为什么不够) · [工作原理](#工作原理) · [快速开始](#快速开始) · [日常开发循环](#日常开发循环) · [文档图书馆结构](#文档图书馆结构) · [命令参考](#命令参考) · [Skills 参考](#skills-参考) · [项目现状与实证](#项目现状与实证) · [参与贡献](#参与贡献) · [设计文档](#设计文档)

## 30 秒上手

在项目里初始化一次（`--agents` 按你用的 agent 选，`claude`/`opencode` 会落位 10 个 skills 与引导文件）：

```bash
npx @panxiangyu1995/doclib init --agents claude,opencode
```

| 你的处境 | 第一句话 | 然后做什么 |
| --- | --- | --- |
| 已有项目，想让文档「活」起来 | `doclib plan` | agent 加载 `doclib-build` 建馆 → `doclib verify` → `doclib snapshot` |
| 全新项目，想先有规格再写码 | `doclib plan --bootstrap` | agent 加载 `doclib-bootstrap` 对话挖掘需求填实馆 → 按馆开发 |
| 半成品项目要接手 | `doclib plan --resume` | agent 加载 `doclib-resume` 蒸馏已实现 + 登记规划 → 转入 `doclib-dev` |
| 日常开发，想让文档跟上代码 | `doclib status` | `doclib diff` → `doclib plan` → agent 加载 `doclib-update` → `verify` + `snapshot` |
| 只想要「凭文档复原」的能力 | `doclib plan --rebuild --to ../myproj-rebuild` | agent 加载 `doclib-rebuild`，只读 `doclib/` 在空目录从零开发 |

也可以 `npm i -g @panxiangyu1995/doclib` 后直接用 `doclib`（命令名一致）。

## 为什么需要它

文档腐化不是「写得不够多」，是**没有治理**。下面 6 个失效场景是真实项目里反复出现的，每一条都有对应的机制与实证：

| 场景 | 现象 | DocLib 的机制 | 实证 |
| --- | --- | --- | --- |
| 新人 / 新 agent 上手 | 靠通读源码拼全貌，几天也拼不全 | 12 卷叙述层 + 实体登记簿，先查馆再查码 | umami 建馆：API 登记簿 141 条、路由 60 页 |
| 文档随代码腐烂 | 代码改了文档没改，半年后没人敢信 | 三层保活 + `check` 双账本强制对账 | 本仓库 `doclib check` 治理 100/100 (A)、违规 0 |
| 文档资产失序 | README / docs / spec / 对话导出散落各处，迁移编号无权威 | 归位宪法 + `place` 四态处置闭环 | 43 仓实测：工具链类误报 2,052 条，修正后清零 |
| 过程知识干完即散 | 规划、踩坑、决策理由随对话蒸发 | `.plan` 双锚点 + `95-lessons` 实时入档 | 本仓库 `progress.md` 记录 30+ 次开发事件 |
| 「做完了」却证明不了 | 验收靠人肉点，没有可执行标准 | `30-features` 每功能一份 Given/When/Then | umami 71 条 AC 双跑：96.4% → 回归 100% |
| 新项目 / 半成品没有载体 | 规格只存在于聊天记录里 | bootstrap / resume 模式 + feature-map 状态事实源 | 本仓库功能总账逐项记录 planned → implemented → retired |

**DocLib 不承诺「帮你写文档」，它承诺「文档永远能用来开发」。**

## 传统做法为什么不够

| 常见做法 | 怎么失效 | DocLib 的差别 |
| --- | --- | --- |
| README + `docs/` 一次性文档 | 代码演进即腐烂，无人维护 | 实时同步 + `check` 双账本对账，腐烂可被机器发现 |
| SDD 工具（spec-kit / OpenSpec） | spec 完成即冻结，治理问题依旧 | 载体兼容：只回收知识、不接管你的工作流，知识按双锚点回流 |
| AI 一次性生成文档 / 代码图谱 | 生成即死，与代码再无关联 | 细粒度保活三角：实体级 covers + CLI 出候选（agent 撰写裁决）+ 实时同步 |
| 直接让 agent 读源码 | 能跑通，但拿不到意图与边界行为 | 非克隆：文档承载行为、契约、设计意图与验收标准 |

> 依据：PRD v0.17（spec 完成即冻结）、v0.18（细粒度保活三角）、v0.30（图输出仅候选，禁止直接入馆）。

## 工作原理

### 一张图看懂

```
┌──────────────────────────────────────────────────────────────┐
│  你的 repo                                                     │
│                                                               │
│    源代码 ─────┐                                              │
│    doclib/ ◀───┤ 图书馆：12 卷叙述层 + 实体登记簿（唯一事实源）   │
│    .doclib/ ◀──┤ 簿记：快照链 + 任务书（CLI 私有，不入馆）        │
│    CLAUDE.md ◀─┤ 引导：让 agent 自助会用这套体系                │
│    .claude/    ┤ agent 适配：10 个 skills 的落位目录             │
└────────────────┼──────────────────────────────────────────────┘
                 │  hash / diff / 映射 / 对账
          ┌──────┴──────┐
          │  doclib CLI │  机器活：状态与事实
          └──────┬──────┘
                 │  任务书（BUILD / UPDATE / REBUILD / BOOTSTRAP / RESUME）
          ┌──────┴──────┐
          │ agent+skills │  知识活：怎么分析、怎么写、怎么验收
          └─────────────┘
```

### 三条铁律

1. **非克隆** —— 文档承载的是行为、契约、设计意图与验收标准，不是字节（除 ≤10 行示意片段外不搬运源码）。
2. **先馆后码** —— 图书馆是唯一事实源。实体问题（某 API 的字段与响应结构、某图标用在哪）从登记簿直达而不是死命 grep；查码所得回填建账，**查询即飞轮**。
3. **馆随码走** —— 实时层（当场入馆）+ 流程层（规划双锚点）+ 兜底层（`diff` → `plan` → `check`）三层保活。图书馆是开发的**输入**，不是事后补账的产物。

### 为什么分两层

| 层 | 回答什么问题 | 形态 |
| --- | --- | --- |
| 叙述层（12 卷） | 为什么这样设计、怎么运转 | 行为、契约、设计意图、验收标准 |
| 实体层（登记簿族） | 这个实体到底长什么样 | 逐条目五要素：标识 / 实体级 covers / 契约细节 / 状态机 / 时间线 |
| 档案卷（`99-archive/`） | 以前是怎么做的、为什么被取代 | 墓碑注记（何时失效 / 为何 / 被何取代），默认不物理删除 |

两层冲突时**以登记簿为准**（它是事实的单点出处，叙述层引用它）。

每类文档另有文体标准：叙述层按**教科书五段**写（导读 → 为什么 → 是什么 → 怎么运转 → 怎么验收），登记簿按**条目五要素**写——`check` 的可读性门禁会检查结构缺失、卡片化与注记污染。人读得顺与 agent 查得准，同为一等质量维度。

## 快速开始

### 存量项目接管

```bash
npx @panxiangyu1995/doclib init --agents claude,opencode
doclib plan                  # 生成 BUILD-001.md 任务书（含自动采集的项目清单）
doclib verify                # 覆盖度报告
doclib snapshot --note "initial build"
```

然后让 agent 加载 `doclib-build`，按 `.doclib/tasks/BUILD-001.md` 三遍扫描（骨架 → 数据 → 行为）把馆填实。

### 新项目从零开始

```bash
npx @panxiangyu1995/doclib init --agents claude,opencode
doclib plan --bootstrap
```

agent 加载 `doclib-bootstrap` 与你对话把需求挖出来直接填进馆；此后按馆开发、按 `30-features` 的验收标准逐条交付。

### 半成品项目接手

```bash
npx @panxiangyu1995/doclib init --agents claude,opencode
doclib plan --resume
```

agent 加载 `doclib-resume`：已有代码蒸馏为 `implemented`，未来功能整理为 `planned`；此后转入 `doclib-dev` 日常循环。

### 只想要复原能力

```bash
doclib plan --rebuild --to ../myproj-rebuild
```

agent 加载 `doclib-rebuild`，**只读 `doclib/`**（禁止访问原仓库）在目标目录从零开发；复原产物自带图书馆副本，实践证实的细节回灌副本。

## 日常开发循环

| 层 | 触发时机 | 谁负责 |
| --- | --- | --- |
| 实时层（主） | 开发中凡触及任一卷知识 | agent 当场入馆（引导文件的实时同步规则约束它） |
| 流程层 | 规划文档完成后 / 该开发完成后 | 双锚点：登记 `planned` → 归档成果并推进 `implemented` |
| 兜底层 | 任何遗漏 | `diff` → `plan` → UPDATE 任务书 → `check` 强验证 |

治理执法三件套：`doclib check`（双账本对账 + 治理健康分，`--strict` 可作门禁）· `doclib place`（孤儿归位，写操作默认干跑，`--apply` 才执行）· `doclib hook`（pre-commit 门禁 / CI 模板）。

功能状态的事实源只有一个：`doclib/00-overview/feature-map.md`（`planned` / `in-progress` / `implemented` / `retired`）；`progress.md` 是时间线视图，不另立状态。

## 文档图书馆结构

```
doclib/
├── README.md               # 入口：怎么读、维护铁律
├── INDEX.md                # 总索引：全部文档 + 一句话摘要
├── 00-overview/            # 项目定位、术语表、功能总清单（状态事实源）、进度时间线
├── 10-architecture/        # 架构总览、数据模型、数据流、依赖选型、ADR、迁移账本
├── 20-modules/             # 每模块一卷：职责、边界、契约
├── 30-features/            # 每功能一份行为规格 + 可执行验收标准
├── 40-guides/              # 复原路线图、编码约定、开发工作流
├── 50-testing/             # 测试方案、测试矩阵、测试设置、运行方式
├── 60-config/              # 工程设置全集：lint/format、构建、CI/CD、环境变量
├── 70-deploy/              # 部署：环境矩阵、发布流程、运维与回滚
├── 80-design/              # UI/UX：设计系统、交互细节、资产说明
├── 90-reference/           # API / 接口 / 协议精确参考
├── 95-lessons/             # 经验教训：bug 与解决办法、踩坑记录
└── 99-archive/             # 档案卷：过时内容降级保史（墓碑注明何时 / 为何 / 被何取代）
```

- **卷可扩展**（编号顺延），不适用的卷必须显式声明「不适用」，不得静默省略。
- **登记簿**按「册 = 资产类型」组织，挂在语义最邻近的卷：`api` / `error-codes` / `events-def` / `integrations` → `90-reference`；`ui-assets` / `routes` → `80-design`；`config` / `flags` → `60-config`；`tasks` → `70-deploy`；`events` → `00-overview`。
- **归位宪法**：馆内是默认，馆外是例外，例外必须显式（工具链白名单或 `ack` 登记）。
- 每篇文档 frontmatter 的 `covers` 指向它描述的代码路径——这是增量更新的锚点。

## 命令参考

| 组 | 命令 | 职责 | 何时用 |
| --- | --- | --- | --- |
| 建馆 | `init` | 初始化 `doclib/` 骨架、`.doclib/` 簿记、skills 与引导文件 | 接入一个新 repo |
| 建馆 | `plan` | 生成任务书：BUILD / UPDATE / REBUILD / BOOTSTRAP / RESUME | 每次开工前 |
| 建馆 | `verify` | 覆盖度报告：未覆盖路径 / 失效文档 / INDEX 完整性 | 建馆后、每次增量更新后 |
| 建馆 | `snapshot` | 把当前代码状态记为新基线（图书馆版本 +1，revision +1） | 同步完成后 |
| 保活 | `diff` | 当前代码 vs 基线：漂移清单 + 受影响文档 | 开发中随时 |
| 保活 | `status` | 版本 / 基线 / 漂移 / 治理健康分 / 引导预算 / 待办概览 | 每个会话开始 |
| 治理 | `check` | 强验证：双账本对账（漏更 / 无归属 / 迁移违规 / 引导过期 / 孤儿文档）+ 治理健康分 | 提交前 |
| 治理 | `ack` | 路径豁免登记（`once` / `standing` / `--dir` 目录前缀） | 出现误报时 |
| 治理 | `place` | 孤儿归位：`list` / `collect` / `archive` / `ack` / `restore`（写操作默认干跑） | 馆外有文档时 |
| 治理 | `hook` | pre-commit 钩子安装 / 移除（`--ci github` 出 CI 模板） | 接入 CI 时 |
| 治理 | `reconcile` | 进度对账重建：疑似完成 / 进度不符 / 待推进 | 进度账与代码不一致时 |
| 增强 | `sync` | 引导文件规则区与 skills 同步再生（幂等，定制区保留） | 升级 CLI 后 |
| 增强 | `graph` | 代码知识图谱：`index` / `status` / `draft` / `explore <query>`（可选增强，需 Node ≥ 22.5） | 大仓库加速 |

会改变行为的常用选项：`--agents`（init 的 agent 目标）、`--planning`（init 的规划载体路径）、`--json`（机器可读输出）、`--strict`（check / hook 门禁）、`--apply`（place 实际执行写操作）、`--to`（rebuild 目标目录 / place 目标卷）。完整选项见 `doclib --help`。

> `graph` 是可选增强：需要 Node ≥ 22.5，缺失时优雅降级，**不阻塞任何核心流程**；图输出只是候选，须经 agent 核实后才能入馆。

## Skills 参考

skills 由 agent 按名称加载，各自绑定一个触发场景：

| Skill | 何时加载 | 关联命令 |
| --- | --- | --- |
| `doclib-build` | 存量项目蒸馏建馆 | `plan`（BUILD 任务书） |
| `doclib-update` | 代码变更后的增量更新 | `plan`（UPDATE 任务书） |
| `doclib-rebuild` | 只凭图书馆从零复原 | `plan --rebuild` |
| `doclib-dev` ★ | 任何日常开发会话 | `status` / `diff` / `snapshot` |
| `doclib-bootstrap` | 新项目对话式建馆 | `plan --bootstrap` |
| `doclib-resume` | 半成品项目接手 | `plan --resume` |
| `doclib-setup` | init 之后的安装与适配确认 | `init` / `sync` |
| `doclib-reconcile` | 进度账与代码对账 | `reconcile` |
| `doclib-audit` | 定期质量审计 | `verify` |
| `doclib-accept` | 逐条执行验收标准并留痕 | 功能完成时 / 复原验收 |

## 项目现状与实证

| 项 | 值 | 来源 |
| --- | --- | --- |
| npm 包 / 版本 | `@panxiangyu1995/doclib` / 0.5.0 | `package.json` |
| License / Node | MIT / `>=22.5 <25` | `package.json` |
| CLI 命令 / Skills | 13 / 10 | `src/commands/` · `skills/` |
| 图书馆骨架 | 12 卷 + 登记簿族（首批 5 册）+ `99-archive`，共 32 个骨架文件 | `assets/templates/library/` |
| 测试 | 32 个测试文件 / 252 用例 | `package.json` test 脚本 |
| 源码规模 | 非测试 4,691 行 / 测试 3,924 行 | `src/` |
| 本仓库自身治理 | 100/100 (A)，违规 0 | `doclib check` |
| 复原基准 | umami：建馆 97% 覆盖 → 同题共答 96.4%（53/55）→ 回归 100% | `doclib/50-testing/benchmark/` |
| 基准规模 | 复原产物 124 路由 / 26 模型 / 6.7 万行 | `doclib/40-guides/benchmark.md` |
| 治理实测 | 43 仓样本：工具链类误报 2,052（均值 ≈48/仓，AI 工具仓最高 171）→ 修正后清零 | `doclib/10-architecture/decisions.md` ADR #12 |
| 图谱实测 | 5 仓实测；memos 1,167 文件 / 22,637 符号 / 66,909 边 / 89 路由 / 2.7s | `doclib/50-testing/acceptance-graph-v0.5.0.md` |

> 本表数字随发版变化，贡献者在发版前需逐项核对（见 [CONTRIBUTING.md](CONTRIBUTING.md)）。

## 参与贡献

三类贡献都欢迎：**报问题与提需求**（GitHub Issues）· **补文档**（改 `doclib/` 对应卷，落位先走归位决策树）· **提代码**（见 [CONTRIBUTING.md](CONTRIBUTING.md)）。

三条必守纪律：

1. 新增测试文件必须加进 `package.json` 的**显式测试列表**（Node 24 的 `node --test <目录>` 会失败，见 ADR #5）。
2. 改动 `vendor/codegraph/` 内的源码必须登记 `FORK-NOTES.md`（否则未来 `git subtree pull` 无法审计）。
3. 改动触及任一卷知识，须**同会话实时入馆**——本仓库用 DocLib 管自己。

## 设计文档

- [PRD：需求唯一事实源](doclib/10-architecture/prd.md) · [架构设计](doclib/10-architecture/design.md)
- [全馆索引](doclib/INDEX.md) · [术语表](doclib/00-overview/glossary.md) · [功能进度总账](doclib/00-overview/feature-map.md)
- [复原基准测试方法论](doclib/40-guides/benchmark.md)

## License

[MIT](LICENSE)
