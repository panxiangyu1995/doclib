# 强验证体系（doclib check / ack / hook）实施规划

- 创建于：2026-10-19
- 流程位置：RIPER-5 INNOVATE（已批准）→ PLAN（已产出规范）；本文档为规划归档（锚点一）
- 关联：feature-map #16；PRD v0.16（F13/Q19）；DESIGN §3.1/§4/§5

## 1. 想达到什么目的和效果

- 把"文档实时更新"从**规则约束**（依赖 agent 自觉）升级为**机器可判定的强验证**：任何代码漂移都能被确定性地归类为"已对账 / 漏更 / 无归属 / 已豁免"
- `doclib check` 成为强验证统一入口（无 AI、无网络、可复现）；`--strict` 退出码门禁；`doclib hook install` 挂 pre-commit；迁移账本"登记即完成"获得机器校验；引导规则区新鲜度可比对
- 终态：agent 忘记更新文档时，机器在提交前就能揪出来——三层保活长出牙齿

## 2. 问题点

| # | 问题 | 对策 |
| --- | --- | --- |
| P1 | `doclib/` 不进代码快照 → "文档是否跟上"从未被度量 | 快照 v3 增文档账（doclib/**/*.md + CLAUDE/AGENTS 逐文件 hash） |
| P2 | 旧快照无文档账，直接对账会崩 | hasDocLedger 降级：无账时仅跑无归属/迁移/引导检查 + 提示重建基线 |
| P3 | 强制门禁会误报扰民（生成物/锁文件路径永远不需要文档） | ack 豁免机制：once（绑定基线，snapshot 自动清除）/ standing（长期豁免，--remove 可删） |
| P4 | 用户仓库可能已有自己的 pre-commit 钩子 | hook install 只重写含 `# doclib-hook` 标记的文件；无标记既有钩子报错并提示手动合并 |
| P5 | 迁移账本是自由 Markdown 表格，解析可能被 agent 编辑破坏 | 容错解析（非 `\d{3}` 行忽略），违规只报告不静默改写 |
| P6 | npx 场景 hook 里 CLI 路径不确定 | hook 写入安装时的绝对调用路径（dist/cli.js），npx 分发后由 init 安装时写正确路径 |

## 3. 研究结果（gh 调研：codument / maat / hook 生态）

- **codument**（48★）：`docs/.registry.json` 源↔文档归属登记（与我们 covers+state 同构，方向被验证）；`doctor/review/watch` 确定性检查原则——**"无 AI、无网络、可复现"**；`hooks install` pre-commit 门禁模式；**ack 豁免机制**（显式确认清除发现项）；逐符号粒度（tree-sitter）远超 v1 需要 → 采纳原则与 ack，粒度取整文件
- **maat**（4★）：`init/sync/check` 三命令心智与我们一致；**生成物漂移是 check 项**（印证引导 managed 区新鲜度比对）；init 发放 CI workflow 模板 → 采纳为 `hook --ci github`
- husky/pre-commit/lefthook：hook 是行业标配，但零依赖哲学下自生成钩子脚本即可，不引框架
- adr-tools/madr：顺序编号 + 不可变惯例，佐证 F12 迁移账本

## 4. 代码实际情况（基线 snap-006/007）

- `state.ts`：State{version,latest,snapshots,structureVersion,agents}；Snapshot.files 为代码账；loadState 已有归一化先例（structureVersion/agents）
- `commands/snapshot.ts`：collectFiles（已排除 doclib/.doclib/.plan）+ hashAll + detectProject；无 docs 概念
- `commands/diff.ts`：analyzeDrift 已有 drift×covers 映射（rows: ImpactedRow），但不知道文档是否变更
- `core/guides.ts`：MANAGED/CUSTOM 标记常量、renderGuide、writeGuides 区域合并均已就绪；只缺"managed 区 vs 模板"比对
- `core/mapping.ts`：buildCoverIndex/docsForPath 可直接复用
- `core/version.ts`、`core/assets.ts`：稳定；测试 22/22；无 check/ack/hook 命令

## 5. 设计的方案

### 5.1 state v3

- `Snapshot.docs?: Record<string, string>`（optional 以区分 v1/v3 快照；hashDocs 产出）
- `State.acks: Array<{path, note, at, kind: "once"|"standing", baseline?}>`；loadState 归一化（docs 缺省不注入——用 `!== undefined` 判 hasDocLedger；acks 缺省 []）
- snapshot 时：写入 docs 账；once-acks 全部清除（standing 保留）

### 5.2 check 引擎（core/check.ts + core/ledger.ts）

`runCheckCore(root)` 六分类：

| 分类 | 判定 | 违规？ |
| --- | --- | --- |
| 已对账 | 漂移路径 covers 命中文档中任一 hash 相对文档账已变 | 否 |
| 漏更 unaccounted | covers 命中但全部未变（附文档清单） | 是 |
| 无归属 uncovered | 无 covers 命中 | 是 |
| 文档先行 docFirst | 文档变更而对应代码未动 | 否 |
| 已豁免 exempted | standing ack 或绑定当前基线的 once ack | 否 |
| 迁移违规 migration | validateMigrations：未登记/编号重复/断号/账本指向不存在文件/命名不符 | 是 |
| 引导过期 guide-stale | managedRegionFresh：managed 区文本 vs 模板 managed 区（剥版本戳）不一致 | 提示 sync |

strict：findings > 0 → process.exitCode = 1。

### 5.3 命令

- `doclib check [--strict] [--json]`
- `doclib ack <path> [--note] [--standing] [--remove]`
- `doclib hook install [--strict] / remove / --ci github`（.git/hooks/pre-commit，`# doclib-hook` 标记）

## 6. 备选方案（已评估，放弃理由）

| 备选 | 放弃理由 |
| --- | --- |
| 纯规则加强（更多提醒） | 没有牙齿，正是用户指出的失效模式 |
| 逐符号粒度对账（codument 式 tree-sitter） | v1 整文件粒度足够；多语言适配器是远期工程 |
| 依赖 husky/pre-commit 框架 | 违反零依赖哲学；自生成钩子脚本即可 |
| watch 实时监听 | 环境依赖重、收益边际，维持路线图后置 |
| ack 存 .doclib/ 独立文件 | 并入 state.json 一处管理，少一个文件类型 |
| 断号检测记为 warning 不入 findings | 断号即编号管理失控信号，应计入违规（soft 模式也不静默） |

## 7. 具体的实施清单（25 项，见 RIPER-5 PLAN 产出，摘要）

1-2 规划归档与登记（本文档 + feature-map #16 in-progress）
3-11 核心：ledger.ts → state v3 → guides.managedRegionFresh → check.ts → commands check/ack/hook → snapshot 双账 → cli 接线
12-18 测试与验证：ledger/check/hook 三测试文件 + guides/state 追加断言 + package.json + typecheck + test
19 冒烟九项（漏更→已对账→豁免→strict 退出码→hook→迁移违规→降级警告）
20-23 实时同步：PRD v0.16（F13+Q19）、DESIGN、图书馆六卷、light/full 模板 → build → sync
24-25 snapshot 固化 + 汇报请求 REVIEW

## 8. 验收标准

- typecheck + 测试全绿（22 旧 + 3 新文件）
- 冒烟九项全过；strict 退出码行为正确
- 旧 state.json 不崩、check 降级警告正确
- 引导模板经 build+sync 后本仓库 AGENTS/CLAUDE 含 check 规则
- 图书馆与 PRD/DESIGN 无同步欠账

## 任务进度

**[2026-10-19 · EXECUTE 全量]**
- 已修改：新增 `src/core/{ledger,check}.ts`、`src/commands/{check,ack,hook}.ts`、三个测试文件；修改 state v3（docs/acks）、guides（managedRegionFresh）、snapshot（双账+once 清理）、cli（三命令+六旗标+子命令映射）、package.json；同步 PRD v0.16、DESIGN、图书馆六卷（20-modules/30-features+check.md/data-model/data-flow/feature-map/progress/95-lessons）、light/full 模板 → build → sync
- 更改：清单 1-24 全部完成；typecheck ✓、测试 36/36 ✓、冒烟九项全过；本仓库 snapshot v8 建立文档账（26 文档）且自身 check strict 通过
- 偏差处置：冒烟发现 `hook remove` 子命令形式未映射（落入 install 分支）——当场修复（cli 子命令映射）并入档 95-lessons；属计划内命令语义的实现解析缺陷，非方案偏离
- 阻碍因素：无
- 状态：未确认

**[2026-10-19 · REVIEW 修订批次（偏差 2/3/4 处置）]**
- 已修改：`src/core/check.ts`（docFirst 精确计算——triggeredDocs 集合排除被代码漂移触发的文档）、`src/core/check.test.ts`（once-ack 生命周期单测 + docFirst 语义单测）、`src/commands/hook.ts`（CI 模板版本固化 doclib@CLI_VERSION）、`src/commands/hook.test.ts`（断言适配）
- 更改：偏差 2/3/4 全部闭环——typecheck ✓、测试 38/38 ✓、探针复验 docFirst 两态
- 原因：REVIEW 模式标记的四项偏差中三项按用户批准的推荐路径修订
- 阻碍因素：无
- 状态：未确认
