<!-- doclib-guide cli=0.5.0 structure=3 -->
# DocLib 工作流

<!-- doclib:managed-begin -->

本仓库已启用 DocLib。图书馆：`doclib/`（唯一事实源，12 卷基线）｜簿记：`.doclib/`｜进度：`doclib/00-overview/feature-map.md`（状态事实源）+ `progress.md`（时间线）。

## 实时同步规则（最高优先级，12 卷一视同仁）

开发中凡触及图书馆任一卷知识的改动，**必须当场更新入馆，不等 diff、不等会话结束**：

| 改动类型 | 必须同步的卷 |
| --- | --- |
| 修 bug / 踩坑 / 得出解决办法 | `95-lessons/`（现象/根因/解决/规避，实时入档） |
| 新功能 / 行为变更 / 新命令 | `30-features/`（行为规格 + 验收标准）+ feature-map 状态 |
| 模块增删 / 职责边界变化 | `20-modules/` |
| 架构 / 数据模型 / 数据流变化 | `10-architecture/` |
| 依赖增删换 | `10-architecture/dependencies.md` |
| 数据库迁移 / Schema 变更 | `10-architecture/migrations.md`（先取号、后登记账本）+ `data-model.md` |
| 新的设计决策 | `10-architecture/decisions.md`（ADR） |
| 测试方案 / 用例 / 矩阵变化 | `50-testing/` |
| 构建 / lint / CI / 环境变量变化 | `60-config/` |
| 部署 / 发布变化 | `70-deploy/` |
| 界面相关 | `80-design/`（不适用须显式声明，不得静默省略） |
| 接口 / 协议 / 配置参考 | `90-reference/` |
| API / 路由 / UI 资产（图标等）实体增删改 | **登记簿实时入账**（分散挂靠各卷：api→90-reference、ui-assets/routes→80-design、config→60-config、tasks→70-deploy、events→00-overview；五要素，标识·covers·状态进 frontmatter；废弃与未使用显式标注） |
| 内容过时 | **三态更新**：失真→修正；过时→状态机降级或移 `99-archive/` 留墓碑，**默认不物理删除**；冗余→合并 |
| 新文档落位 | **归位决策树定位唯一归宿** + 同步登记两级索引（INDEX + 卷 _index）；馆外是例外，例外必须显式 |
| 功能移除 | **六步规程**：影响面预查→残留扫描→执行移除→馆内联动（retired/removed+墓碑）→`doclib check` 执法→留痕 |
| 任何进度变化 | feature-map 状态推进 + `00-overview/progress.md` 补记 |
| 引导文件（本文件）的维护 | 规则区由 `doclib sync` 再生；**项目定制区实时维护**——项目工作流/注意事项/教训产生的新 agent 规则，当场写入 custom 区 |

## 会话纪律（每个开发会话）

1. 开始：`doclib status`（看漂移、基线、引导版本）
2. 结束前自检四问：**改动归档了吗？feature-map 状态推进了吗？progress.md 补记了吗？引导文件（CLAUDE.md/AGENTS.md）需要更新吗？**
3. 新功能开发走 `.plan/<日期>/` 双锚点：规划文档完成 → feature-map 登记 planned；开发完成 → 归档成果（长期价值沉淀 ADR/规格/参考卷）、状态 → implemented、progress 补记、`doclib snapshot` 固化基线

## 纪律底线

- **引导文件与图书馆同为一体**：agent 必须知道的新规则/注意事项，先写进本文件 custom 区（实时）；确认长期普适的，沉淀进图书馆对应卷并提示用户运行 `doclib sync`
- 每篇文档 frontmatter 的 `covers` 指向真实代码路径——它是增量更新的锚点，必须随改动保持准确
- **先馆后码**：查实体（API 字段/图标位置/路由/配置）先查登记簿，无果或有疑才读代码；查码所得回填登记簿（查询即建账）
- 文档写行为、契约、设计意图、验收标准；除 ≤10 行示意片段外禁止搬运源码（非克隆铁律）
- 更新过时内容**默认降级保史**（登记簿状态机 / 墓碑 / `99-archive/`），物理删除仅限失真与用户显式指令
- **归位宪法**：馆内是默认，馆外是例外，例外必须显式；落文档先走决策树，落位即登记两级索引；命名 kebab-case，日期不进文件名
- **无账不答（反幻觉）**：查登记簿无果禁止凭空回答实体问题——读码验证并回填建账；不确定就声明不确定
- **入馆写协调**：入馆写前先跑 `doclib check` 对账；同一时间单会话入馆写
- 记忆与图书馆冲突时**以馆为准**；新增引导规则先自问"删掉会犯错吗"——不会则入 skill/入馆，不进引导
- 数据库迁移：实体在代码 `migrations/`（`NNN_YYYYMMDD_<slug>.sql`），取号登记在 `10-architecture/migrations.md` 账本；forward-only、applied 不可变
- 忘了同步由兜底接住：`doclib check` 强验证（漏更/无归属/迁移违规/引导过期/孤儿文档 + 治理健康分 + revision，可挂 pre-commit --strict 门禁）、`doclib diff` 揪漂移、`doclib reconcile` 对账重建——但兜底不是用来依赖的

## skills 与 CLI 速查

skills 按名称加载：`build`=蒸馏建馆｜`bootstrap`=新项目文档先行｜`resume`=半成品接手｜`dev`=日常开发★主力｜`update`=增量更新｜`rebuild`=从零复原｜`reconcile`=对账重建｜`audit`=质量审计｜`accept`=验收执行
CLI：`status` 概览｜`diff` 漂移｜`plan` 任务书｜`snapshot` 基线｜`verify` 覆盖度｜`init` 骨架落位｜`sync` 引导/skills 同步｜`check` 强验证+治理分｜`ack` 路径豁免｜`place` 孤儿归位（列出/收编入馆/入棺归档/还原；写操作默认干跑，`--apply` 执行）｜`hook` 提交门禁｜`graph` 知识图谱（index/status/draft/explore，可选增强）

<!-- doclib:managed-end -->

<!-- doclib:custom-begin -->
## 本项目定制（DocLib 仓库）

> 本文件与 AGENTS.md 由 doclib sync 同步管理规则区；定制区内容两文件保持一致。

- 定位：把任意项目蒸馏成可复原的文档图书馆；本仓库已启用 DocLib 自身（身先士卒）
- 基准铁律：复原对比对象=**原仓库**（非图书馆）——重建↔原仓库实质差距=建馆缺陷显影器（benchmark.md 目的铁律）（三阶段：P1 信息零遗漏→P2 质量保证→P3 升华超越原仓库）
- 命令：`npm run build`（tsc vendor 岛 + tsc 主工程 + copy-assets）｜`npm run typecheck`｜`npm test`｜CLI 试运行 `node dist/cli.js <命令>`｜`doclib graph`（index/status/draft/explore，知识图谱命令族）；版本 0.5.0（structure v3）
- 结构：`src/cli.ts` 入口；`src/commands/` 十三命令（init/plan/diff/snapshot/status/verify/sync/check/ack/place/hook/reconcile/graph）；`src/core/` 纯逻辑（fsutil/frontmatter/state/detect/mapping/check/orphan/place/ledger/docquality/surface/guides/assets/agents/prompts/version/codegraph）；`assets/` 模板与引导源（guides=managed 区再生源，改引导规则须改此处再 sync）；`skills/` 手册源（`doclib sync` 分发至 `.claude/skills/` `.opencode/skills/`）；PRD+DESIGN 已入馆 `doclib/10-architecture/`
- 约定：ESM（导入带 .js 后缀）；strict + noUncheckedIndexedAccess；运行时依赖 ignore + 图谱引擎解析运行时（web-tree-sitter/picomatch/jsonc-parser，皆纯 JS，ADR #13）；源码不写注释；错误一律抛 DoclibError；术语见 doclib/10-architecture/prd.md §4
- 验证：typecheck + test 全绿后，命令行为改动须临时目录冒烟（init --agents claude,opencode → plan → snapshot → 改文件 → diff → plan → verify）
- skills 状态：10/10 全部实现（build/update/rebuild + dev/bootstrap/resume/setup/reconcile/audit/accept，feature-map #6）
- 进度指针：`doclib/10-architecture/prd.md`（v0.30）｜`doclib/10-architecture/design.md`（v2）｜`doclib/00-overview/feature-map.md`｜`doclib/00-overview/progress.md`
- 术语：图书馆=doclib/、簿记=.doclib/、任务书=.doclib/tasks/、基线=snapshot、漂移=drift、锚点=covers
- 治理状态：规划载体 `.plan/<日期>/` 已声明（F9 默认实例）；登记簿落点已拍板——**分散挂靠各卷**（Q25，挂靠表见 PRD §7）；复原基准测试体系已立项（F14，首个基准项目 **colinhacks/zod**【Q31】，操作指南 `40-guides/benchmark.md`；**复原须与建馆不同会话/实例/模型，防先验污染**）；历史遗留已清零（v0.23）：50-reference 已归位 90-reference、PRD/DESIGN 已迁入 `doclib/10-architecture/`；写协调乐观锁 revision 已立项（Q36）
- 孤儿治理（v0.5.0）：馆外文档四态判定（馆内/非文档资产/工具链豁免/待归位）+ 三层防线（扫描面/判定面/处置面）；处置走 `doclib place`（list/collect/archive/ack/restore，写操作默认干跑 `--apply` 执行，归档账可 restore）；**本仓库 `assets/` `skills/` 是源目录（靠 covers 兜底，勿入棺）**，`.claude/skills/` 分发副本由 `20-modules/_index.md` 覆盖
- 知识图谱（v0.5.0，F15 阶段 2）：vendored codegraph 在 `vendor/codegraph/`（git subtree，同步 `git subtree pull`；**就地改动必须登记 FORK-NOTES.md**，优先在 adapter 层 `src/core/codegraph/` 扩展、勿改 vendored 源）；`.codegraph/`=可再生缓存（非产物），graph 输出仅候选禁止直接入馆；telemetry 已物理隔离（构建面排除）；Node>=22.5 门（graph 可选增强，失败不阻塞核心）；规格 `30-features/graph.md`
<!-- doclib:custom-end -->
