# F20 分支账与主分馆管理（branch-management）

- 日期：2026-10-28
- 状态：已归档（#44 implemented；#13 收编 implemented、#14 注记收编；基线 snap-097/revision 88；测试 394/394；strict 通过/治理 100 A——含 REVIEW 轮漏洞加固 D-1~D-3）
- 来源：用户原话「我们的图书馆项目我就说差点东西，刚想起来，没有明确项目的分支管理，蒸馏的时候，我希望能够把分支不同点也标明。开发过程中，新建分支也能在新的分支上将分支目的，实现的功能，有什么差异等等信息也记录进图书馆，如果图书馆进入gitignore就不存在主馆和分馆的概念了，但是如果图书馆不在gitignore，那么就要做好主馆跟分馆的管理了」
- 规划载体：本对话（RIPER-5 RESEARCH → INNOVATE → PLAN → EXECUTE）
- 关联产物：`src/core/gitinfo.ts` · `src/core/branch.ts` · `src/commands/branch.ts` · `src/core/state.ts` · `src/commands/{snapshot,status,diff}.ts` · `src/core/check.ts` · `doclib/00-overview/branches.md` · `doclib/30-features/branch.md` · skills/{doclib-dev,doclib-build}

## 拍板记录

| 问题 | 拍板 |
| --- | --- |
| 蒸馏分支差异载体 | 馆内专篇（00-overview/branches.md 分支账） |
| 开发分支记录 | 复用 feature-map/progress（progress 行内 token `[branch:slug]`；feature-map 不加列防膨胀） |
| 主分馆合并 | CLI 辅助（branch diff 审计报告；合并动作留给 git） |
| 场景取舍 | 双场景都做（A 馆入 git=主分馆管理；B 馆入 gitignore=基线归属感知） |
| Q-A hook 强度 | soft notice（branch-unregistered/branch-ledger-incomplete，不入 strict） |
| Q-C 拆分 | branches.md 单文件起步，超三层硬上限再拆 |
| Q-D 撞号 | 报告+建议人工重 snapshot，不自动改账 |

## 研究结论（实证）

1. PRD 边界条款「不替代版本管理（git）」（prd.md 旧版 line 144）——本功能为定向扩展，非破约（ADR #28 留痕）。
2. src 全量无读取当前分支/commit 逻辑；Snapshot/State schema 无 git 维度；diff 纯工作区 hash 比对。
3. 本仓馆入 git（.gitignore 不含 doclib/.doclib/.plan/）——场景 A 活实例；state.json/progress/feature-map 为多分支合并结构性冲突面。
4. feature-map #13（git 感知基线 planned）/#14（watch+多图书馆 planned）为既有路线图坑位，本功能收编。
5. 场景 B 缺陷：切分支后馆不动→基线 hash 失配→diff 全量假漂移，且无从判定基线归属。

## 方案定稿

见 PLAN 清单 23 项：schema 加 `git?` 可选字段；新 core/branch + commands/branch（list/register/diff）；check 两新 notice；branches.md 分支账；规格/索引/PRD/ADR/skills/引导联动；版本 0.9.0→0.10.0。

## 反遗漏自检五项（收尾对照）

1. 改动归档：代码+馆内联动清单 12-20 执行；长期价值入 30-features/branch.md 规格 + ADR #28 + PRD F20
2. feature-map：#13 收编 implemented、#14 注记、#44 新建 implemented
3. progress.md：补记（含 80-design N-A 显式声明）
4. 引导更新：assets/guides/light.md CLI 速查 + sync 再生；skills dev/build 增补 + sync 分发
5. 踩坑处置：执行中缺陷实时入 95-lessons 或载体偏差节

## 任务进度

[2026-10-28 规划落盘] 载体创建，状态执行中。

[2026-10-28 执行完成]
- 已修改：src（新建 6：core/gitinfo.ts+test、core/branch.ts+test、commands/branch.ts+test；修改 7：state.ts/snapshot.ts/status.ts/diff.ts/cli.ts/check.ts/version→package.json 0.10.0）+ 馆内（branches.md/branch.md 新建；20-modules/feature-map/progress/INDEX/30-features/_index/PRD/decisions/check.md/graph.md/overview/dependencies/config/deploy/testing/cli-acceptance-suite/acceptance×2/050-harness/40-guides-harness/guides 联动）+ README 双语 + assets/light.md + skills dev/build + 簿记 guide-project 重蒸馏 + guide-memory 刷新 + 95-lessons 一课
- 更改：23 步清单全部完成；测试 372→392（+20）；strict 通过/治理 100 A/基线 snap-096
- 原因：用户指令执行 F20
- 阻碍因素：无
- 状态：成功

## 执行期偏差与踩坑（教训账）

1. **产品缺陷级发现**：feature-map #44 描述列裸竖线 `merged|abandoned` 被朴素 `line.split("|")` 错位切列 → 载体检测误报未登记（decisions/PRD 同病）——三处改 `merged/abandoned` 根治；「写入侧规避裸竖线」入 95-lessons（2026-10-28 · 表格单元格裸竖线）
2. 冒烟脚本首跑漏 git commit（unborn 分支下 `git branch --format` 输出空 + rev-parse HEAD 失败）——产品降级正确（readGitInfo null），冒烟脚本修正为先 commit
3. 测试 fixture 三处缺 `doclib/00-overview` 目录创建（ENOENT）；runInit 默认装 pre-commit 门禁拦截测试 commit（noHook 参数修正）
4. 收尾连锁：memory 簿记刷新 → sync 再生引导 → 引导漂移 2 项 → 再 snapshot 固化（95-lessons「先改内容→再固化基线→最后执法」顺序纪律的实践验证）
5. sync 读 dist/assets 构建产物——改 assets/guides 源后必须先 `npm run build` 再 sync（两轮 build 教训）

## REVIEW 轮漏洞加固（用户「修复」拍板，2026-10-28）

| # | 缺陷（实证） | 修复 | 测试 |
| --- | --- | --- | --- |
| D-1 | register 不消毒：分支名/目的含 `\|` → 账本行错位解析 0 条（与 95-lessons 2026-10-28 裸竖线教训同源——防线未做在写入面） | runBranch register 入口 DoclibError 拒绝 `\|`/换行（拒绝优于转义，对齐「写入侧规避」） | commands/branch.test +1 |
| D-2 | branch diff base 拼入 git 命令：`--output=` 前缀 argument injection → 任意路径写文件（实证 0 字节文件落 /tmp） | analyzeBranchDiff 入口校验 base 非 `-` 开头 → DoclibError | core/branch.test +1（断言注入文件未落盘） |
| D-3 | execFile 默认 maxBuffer 1MB：state.json 已 545KB 随快照链增长必越界 → git show 异常被吞为「无可读簿记」假降级 | EXEC_MAX_BUFFER 64MB 显式（对齐 testkit），diff/show/branch 三调用统一 | 无新增（行为不变） |

392→394（+2）；冒烟两攻击面全封（exit 1/无文件落盘）；AC-2/AC-5 增补；数字联动六处（feature-map/progress/testing/cli-acceptance-suite/README 双语/overview）；基线 snap-097。
