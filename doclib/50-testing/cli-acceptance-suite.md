---
title: CLI 自动化验收测试套件
covers:
  - src/commands/testkit.ts
  - src/commands/init.test.ts
  - src/commands/plan.test.ts
  - src/commands/snapshot.test.ts
  - src/commands/diff.test.ts
  - src/commands/status.test.ts
  - src/commands/verify.test.ts
  - src/commands/check.test.ts
  - src/commands/ack.test.ts
  - src/commands/sync.test.ts
  - src/commands/reconcile.test.ts
  - src/commands/cli.e2e.test.ts
  - src/commands/stress.test.ts
  - package.json
status: stable
---

# CLI 自动化验收测试套件

> 用户需求"对 CLI 功能做极致的功能测试验收，所有测试落到测试文件以便复测"的落地物：把 2026-10-19 手工 44 探针验收（acceptance-cli-v0.4.0.md，点时留痕不改写）升级为**可持续复测的自动化测试**，并补齐边界/特殊/压力维度。122 个新增用例（全套 178/178 绿）。
>
> 2026-10-22 增量（#24 孤儿归位与处置闭环）：新增 `src/core/place.test.ts`（11）、`src/commands/place.test.ts`（8），扩写 `orphan.test.ts`（+6）、`commands/check.test.ts`（+1）、`commands/ack.test.ts`（+3）、`core/fsutil.test.ts`（+2）、`core/check.test.ts`（+4）——**全套 219/219 绿**；归位与处置的验收留痕见 [acceptance-place-v0.5.0.md](acceptance-place-v0.5.0.md)。
>
> 2026-10-22 增量（#25 codegraph 克隆集成）：新增 `src/core/codegraph/engine.test.ts`（9）、`src/core/codegraph/draft.test.ts`（6）、`src/commands/graph.test.ts`（4），扩写 `commands/cli.e2e.test.ts`（+1 全流程）、`core/fsutil.test.ts`（+1）、`core/orphan.test.ts`（+1）——**全套 240/240 绿**（31 测试文件）；graph 测试带 Node<22.5 自动 skip 守卫；验收标准 AC1–AC10 见 [30-features/graph.md](../30-features/graph.md)；真实仓库五仓实测见 [acceptance-graph-v0.5.0.md](acceptance-graph-v0.5.0.md)。

## 为什么

手工探针验收是一次性的（点时留痕、不可复测）——CLI 有 13 个命令 × 正常/边界/错误/压力四维的契约面，只有落成自动化测试文件才能让每次行为变更都过同一把尺子；8 条易回归行为契约（BUILD 覆盖式/UPDATE 编号/strict 退出码等）就此锁定。

## 是什么

14 个命令测试文件 + core 单测（32 文件/249 用例【v0.32】，全量 `npm test` 一键复测）：testkit 共享基建（临时目录/种子/spawn）+ 逐命令套件 + e2e 真实二进制闭环 + 压力探针。文件布局与用例数见下表，验收结论见第三节。

## 怎么运转（复测与扩展纪律）

复测 = `npm test`（先 build 后全量 32 文件）；单卷复测 = `npm run build && node --test dist/commands/<file>.test.js`。扩展纪律：新增命令必须同步新增套件并登记下表；行为契约一旦锁定，改行为必须先改测试并留痕（95-lessons 或 acceptance 增量段）。

## 一、文件布局与复测方式

| 文件 | 用例数 | 职责 |
| --- | --- | --- |
| `src/commands/testkit.ts` | — | 共享测试基建：临时目录/文件种子/state 种子/snapshotRow/docMd/CLI spawn 助手（CI=1 非交互） |
| `init.test.ts` | 11 | init 全场景（骨架/agents/guide/planning/force/跳过/cursor） |
| `plan.test.ts` | 13 | 五类任务书 + 互斥 + 编号 + 漂移段 + 载体提醒 |
| `snapshot.test.ts` | 13 | 基线账本 + 快照链上限 + pad3 边界 + 忽略规则 + 损坏防护 |
| `diff.test.ts` | 10 | 三类漂移 + covers 精确/目录级优先 + 截断 + gitignore 语义 |
| `status.test.ts` | 10 | 概览文本/json 全载荷 + 双锚点提醒 + 引导戳/预算 |
| `verify.test.ts` | 12 | 覆盖度 + 失效/无锚点 + INDEX 双向 + 卷级索引 + 分组截断 |
| `check.test.ts` | 14 | 违规分类逐一构造 + strict 退出码 + 豁免联动 + 治理分组件 |
| `ack.test.ts` | 7 | once/standing/remove/note 缺值边界 |
| `sync.test.ts` | 10 | 幂等/定制区/managed 再生/legacy/无戳跳过/check 闭环 |
| `reconcile.test.ts` | 5 | 三段报告文本与 json + 进度不符判定 |
| `cli.e2e.test.ts` | 11 | spawn 真实二进制：help/version/退出码/错误前缀/全生命周期闭环 |
| `stress.test.ts` | 6 | 2000 文件/25 连续快照/40 层深嵌套/unicode/4MB 大文件/60 文件截断 |
| `src/core/place.test.ts` | 11 | 建议归宿/收编/入棺/墓碑五要素/指针/covers 硬拦截/还原为原件/索引撤销/占用拒绝【2026-10-22 新增】 |
| `src/commands/place.test.ts` | 8 | place 五子命令 + 干跑零副作用 + 缺参错误面 + standing 豁免【2026-10-22 新增】 |

复测：`npm test`（先 build 后全量）；单卷复测 `npm run build && node --test dist/commands/<file>.test.js`。测试与源码同目录放置，`package.json` test 脚本显式列出全部 dist 测试文件。

## 二、维度覆盖

- **正常路径**：11 命令 × 非 json/json 双形态；e2e 覆盖 init→plan→建馆→verify→snapshot→diff→UPDATE→check --strict 双向→snapshot→sync→reconcile→hook 全生命周期闭环（真实子进程 + 退出码断言）。
- **错误路径**：无基线/缺参/非法 flag/互斥组合/state.json 损坏（含空文件与 schema 非法三分支）/不可读文件/未知 agent——DoclibError 退出码 1 且 stderr 前缀「错误: 」；非 DoclibError（如 ENOTDIR）直抛不走前缀。
- **边界**：MAX_SNAPSHOTS=20 裁剪、pad3 超过 999（snap-1000）、diff 单段 50 截断（55/60 双探针）、verify 分组 15 截断、引导预算 150 行超限、once 豁免基线绑定与过期、`.gitignore` 事后排除计为删除、doclib 为普通文件 + --force 硬失败、flag 缺值（--note 尾随）不崩溃。
- **压力**：2000 文件全链路（snapshot/diff/check/status 各 <60s 断言）、25 连续快照链封顶、40 层深嵌套、unicode+空格路径、4MB 文件哈希。
- **行为锁定**（易被无意识回归破坏的契约，测试即规格）：
  - plan 无基线时重复生成 BUILD-001 为覆盖式；有基线无漂移拒绝生成任务书。
  - UPDATE 任务书编号 = 基线 version+1（首份即 UPDATE-002）。
  - verify 以基线文件清单为准（基线后删除文件不改变覆盖面）；非代码文件不进覆盖度分母（有基线时为 0）。
  - check 孤儿豁免（根级五文件/.github 等/covers 有主/规划载体）≠ 无归属豁免——豁免文件仍计入无归属。
  - sync `--agents ""` 回退 state.agents（与 init 空串降级 generic 语义不同）；managed 区与模板一致时纯定制区修改判「无变化」不落盘。
  - migrate 账本表格式 `| 编号 | 日期 | 文件 | 目的 |…`（cells[3] 为脚本列）；非 migrations/ 路径不校验存在性。
  - 迁移违规计数构成：命名不符 + 未登记 + 重复 + 断号（min..max 逐号）+ 指向不存在脚本。

## 三、验收结论

178/178 绿（typecheck 同绿）；未发现新缺陷——2026-10-19/20 两轮修复后行为与规格一致。发现并留档 2 处**规格语义澄清**（非缺陷）：sync 与 init 的空串 --agents 语义差异；孤儿豁免与无归属豁免是两套独立判定。
