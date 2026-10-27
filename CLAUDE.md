<!-- doclib-guide cli=0.8.0 structure=3 -->
# DocLib 工作流

<!-- doclib:managed-begin -->

本仓库已启用 DocLib。图书馆：`doclib/`（唯一事实源，12 卷基线）｜簿记：`.doclib/`｜进度：`doclib/00-overview/feature-map.md`（状态事实源）+ `progress.md`（时间线）。

## 实时同步规则（最高优先级，12 卷一视同仁）

开发中凡触及图书馆任一卷知识的改动，**必须当场更新入馆，不等 diff、不等会话结束**：

| 改动类型 | 必须同步的卷 |
| --- | --- |
| 修 bug / 踩坑 / 得出解决办法 | `95-lessons/`（现象/根因/解决/规避，可加 `来源:` 行，实时入档）+ progress 条目末 `教训:` 处置位声明去向（check「教训账缺口」拦截） |
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
| 载体规划文档新增 | feature-map 登记 planned（check「载体未登记」拦截）+ progress.md 补记（check「进度账缺口」拦截） |
| 引导文件（本文件）的维护 | 四区分工：规则区（managed）由 `doclib sync` 再生；反哺区（project）由 agent 蒸馏写入 `.doclib/guide-project.md` 后经 sync 注入，**禁止直接编辑**；记忆区（memory）由 agent 会话收尾蒸馏写入 `.doclib/guide-memory.md` 后经 sync 注入（近期工作记忆+协作者画像，禁止直接编辑）；定制区（custom）实时维护——项目工作流/注意事项/教训产生的新 agent 规则，当场写入 custom 区 |

## 会话纪律（每个开发会话）

1. 开始：`doclib status`（看漂移、基线、引导版本）
2. 结束前自检五问：**改动归档了吗？feature-map 状态推进了吗？progress.md 补记了吗？引导文件（含记忆快照 `.doclib/guide-memory.md`）需要更新吗？踩坑都处置了吗？**
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

<!-- doclib:project-begin -->
## 项目定位

- DocLib：把任意代码项目蒸馏成「可复原的文档图书馆」——任何 agent 或人只凭 `doclib/` 即可从零重建该项目（≥90% 功能复原）（`doclib/00-overview/project.md`）
- 本仓库 dogfooding：DocLib 以自身图书馆管理自身开发（`doclib/README.md`）

## 架构速览

- CLI 入口 `src/cli.ts`，十四命令于 `src/commands/`（init/plan/diff/snapshot/status/verify/sync/check/ack/place/hook/reconcile/graph/implement）；纯逻辑于 `src/core/`（`doclib/20-modules/_index.md`）
- 规划直通车（F17）：对话规划 bootstrap 五阶段→工具收编（BMAD/spec-kit/OpenSpec/Kiro 快照式）→`doclib implement` 拆单（readiness+AC 锚点骨架）→门禁三件套（`doclib/30-features/040-planning-express.md`）
- 知识图谱引擎 vendored 于 `vendor/codegraph/`（git subtree；就地改动必须登记 FORK-NOTES.md，优先在 adapter 层 `src/core/codegraph/` 扩展）（`doclib/30-features/graph.md`）
- 需求唯一事实源 `doclib/10-architecture/prd.md`｜设计 `doclib/10-architecture/design.md`｜ADR 账本 `doclib/10-architecture/decisions.md`

## 模块地图

- `commands/` 参数解析与输出编排（返回 {text, json}）；`core/` 纯逻辑零副作用——两者边界不可反向，模块与职责清单以 `doclib/20-modules/_index.md` 为唯一事实源（数字易腐，此处不抄）
- 架构三原则：纯 Markdown 产物、确定性执法、零重依赖——一切设计裁决回溯这三条（`doclib/10-architecture/overview.md`）

## 开发宪法

- 架构铁律：commands/core 职责边界不可反向｜vendored 源禁直改（FORK-NOTES.md 登记账）｜图谱扩展走 adapter 层｜破坏约定先立 ADR 再动代码（`10-architecture/overview.md`·`decisions.md`·`40-guides/conventions.md`）
- 编码铁律：TypeScript ESM 导入带 `.js` 后缀｜strict + noUncheckedIndexedAccess（数组访问判空是常态）｜源码不写注释（设计解释进 ADR）｜用户可见错误一律抛 DoclibError｜文件 kebab-case/导出动宾/常量全大写（`40-guides/conventions.md`）
- 数据与迁移：N-A（无数据库；引入持久化时先在 `10-architecture/migrations.md` 账本取号，forward-only、applied 不可变）
- UI/UX：N-A（CLI 无图形界面，`80-design/README.md` 显式声明；CLI 文案体验归 30-features 行为规格）
- 测试与验收铁律：node:test + assert/strict 零依赖，测试与被测同目录 `*.test.ts`，新测试文件必须登记 package.json test script（漏登记=静默退出门禁）｜typecheck + 全量测试绿后，命令行为改动须临时目录冒烟（`50-testing/testing.md`）｜**时间比较类断言必须显式设定时间戳**（文件系统 mtime 精度跨环境不一致：本地 ns、CI overlayfs 整秒；依赖「刚写完就比基线晚」的断言是亚毫秒级竞态——本地靠 2ms 运气绿、CI 必红）
- 禁区：禁直改引导 project 区（改簿记后 sync）｜禁引入重运行时依赖（先过零重依赖审视，ADR #13）｜禁无账回答实体问题（先馆后码，查询即建账）｜馆与记忆冲突以馆为准（`10-architecture/overview.md`·`30-features/guides.md`）
- 规则唯一事实源指针：架构/编码/迁移/UI/测试规则一律以馆为准；馆无规则→提案入 ADR/规格，禁止即兴发明；外部规则文档以馆内收编版本为准（`10-architecture/overview.md`）

## 命令速查

- `npm run build`（tsc vendor 岛 + 主工程 + copy-assets）｜`npm run typecheck`｜`npm test`｜CLI 试运行 `node dist/cli.js <命令>`（`60-config/config.md`）
<!-- doclib:project-end -->

<!-- doclib:memory-begin -->
## 近期工作记忆（窗口 30 天）

- 当前焦点：#42 复原基准第三梯队扩容（复杂样本 + UI/UX 专项）规划完成待执行——载体 .plan/2026-10-27/benchmark-tier2.md（9 候选本机实测 + 切片边界 + UI/UX 根因实证），EXECUTE 待用户授权
- 近期完成：
  - 10-27 #42 规划完成：第三梯队 9 候选（rqlite/syncthing/headscale/yt-dlp/docmost/plausible + meilisearch/zellij + excalidraw/documenso/formbricks）本机实测并分层标注
  - 10-27 #41 推广视频落地归档：8.5MB 成片 7200 帧位级一致 + 质检三绿 + 知识层 5 篇入馆（另一实例执行）
  - 10-27 #41 规划完成：HyperFrames 选型四路实证成立；落位②定案；发布链修正清单就绪（npm 0.4.0→0.8.0）
  - 10-27 #40 记忆快照与协作者画像反哺 v0.8.0 落地（F18，commit ee0023c，基线 snap-081 / revision 72）
  - 10-27 #39 规划直通车 v0.7.0：doclib implement 拆单 + 门禁三件套 + bootstrap 五阶段（.plan/2026-10-27/planning-express.md）
  - 10-26 #32/#37 引导反哺三区契约与开发宪法六篇 + 12 卷走查账 v0.6.0-0.6.3（.plan/2026-10-26/guide-feed.md + .plan/2026-10-26/guide-constitution.md）
  - 10-26 #35/#36/#38 归档闭环三不变量 + 教训账缺口 + 教训实时性（一行制/来源行执法）v0.6.1-0.6.4
  - 10-26 #33 会话档案区 98-sessions 立项与 M1 落地（.plan/2026-10-26/transcript-archive.md）
  - 10-23 #28 文体学全链路与 #29 旗标面对账落地
  - 10-22 #26/#27 README 门面重写（中英双语）+ 门面多语言变体模式豁免
  - 10-23 #23 基准扩容：四基准馆建成（aspnetcore/fd/csvkit/memos 均 100 A，doclib/50-testing/benchmark/）
- 活跃注意：
  - **npm latest 仍 0.4.0**（仓库 0.8.0 未发布）——推广视频发布与 npx 安装均受此阻塞；release.yml node 20 与 engines >=22.5<25 不自洽待改
  - **本仓存在并发写入实例**（实测：另一实例提交 ee0023c 改写基线；本会话又见其占 3000 端口与 ffmpeg 抢带宽）——执行前须重核基线/工作区/端口
  - #42 第三梯队待授权执行；plausible/meilisearch/zellij 三仓**标「未实测」**（Elixir/Rust 钉版工具链下载受阻），宁可缺证不虚报
  - #34 transcript 批量回捞 planned——素材升级依赖它（OpenCode DB 285 会话/2.5 万消息待接入）
  - #23 复原侧闭环待排程（四馆建馆侧已建成，隔离复原未启动）；#19 ast-grep 阶段 1 planned
  - 既有失真已处置：`40-guides/workflow.md` 悬空指针（AGENTS.md / .doclib/guide-project.md / 10-architecture/data-flow.md 三处）已改指真实承载点（`10-architecture/overview.md`·`30-features/guides.md`）
  - 产品级建议留档：SOURCE_PATH_TOKEN_RE 截断字符集已含反引号/星号（#40 根治），后续关注 lesson-source 与 memory-pointer 共享词面的同源缺陷
  - 反哺区当前状态：走查 12/12（.doclib/guide-project.md）——基线版本号等自引用易腐数字不入快照

## 协作者画像

- 决策风格：偏好「一步到位」全链路（#28 三拍板、#38「α+β+γ+δ 一步到位」原话）；习惯提问工具成批拍板（单轮 8-14 项）；偏离推荐必须给理由（Q44 矛盾澄清）；产品级缺陷要求根治而非兜底（Q42 模式识别取代闭集）
- 决策风格（新观察）：**先验判断会主动要求「确认」而非直接采纳**（原话「HyperFrames 效果好又省心，你帮我确认一下」）——研究阶段须实证优先、给结论而非附和；选项批量给出且**连续两次选推荐项**（落位/ffmpeg 时机）→ 推荐项的论证质量直接决定决策效率
- 沟通偏好：中文交流；以 RIPER-5 模式协议管控会话（研究→创新→计划→执行→审查，模式切换须显式指令）；研究阶段要求「确切的肯定的研究结果，不包含任何的猜测」——实证优先（context7/gh/实测交叉验证）；方案呈现给推荐+理由由其拍板
- 工作流习惯：新功能必走 .plan 载体双锚点（规划文档先行，按文档实施）；REVIEW 轮独立进行（「全方位漏洞审查」「严格代码审查查找漏洞」）；常要求真实仓库扩展验收（「在 test 目录下的克隆项目中测试」）；对「遗漏入馆」高度敏感（曾实证手动补录 → 拍板 hook 执法路线 #35）；会直接下发 planstore 纪律指令要求规划文档补齐反遗漏自检五项
- 证据偏好（新观察）：**要求「实测」但排斥实测膨胀**——原话「你推荐的都做实测」「有必要搞半天么」「为什么不用 context7 mcp 或者 gh cli」→ 仓库事实走 gh API、SDK 文档走 context7，本机只做编译/测试/运行与 UI 交互探针；报告须分层标注「已实测/未实测」，缺证即标缺证
- UI/UX 痛点（新观察）：原话「我在使用 agent 开发中实际感受就是 ui/ux 最难复现」→ 关心可断言的交互契约（元素 × 状态 × 手势 × 反馈），而不只是界面描述
<!-- doclib:memory-end -->

<!-- doclib:custom-begin -->
## 本项目定制（DocLib 仓库）

- 定位：把任意项目蒸馏成可复原的文档图书馆；本仓库已启用 DocLib 自身（身先士卒）
- 结构：`src/cli.ts` 入口；`src/commands/` 十三命令（init/plan/diff/snapshot/status/verify/sync/check/ack/place/hook/reconcile/graph）；`src/core/` 纯逻辑模块（清单与职责以 `doclib/20-modules/_index.md` 为准，不在此枚举防漂移）；`assets/` 模板与引导源（guides=managed 区再生源，改引导规则须改此处再 sync）；`skills/` 手册源（`doclib sync` 分发至 `.claude/skills/` `.opencode/skills/`）；PRD+DESIGN 已入馆 `doclib/10-architecture/`
- skills 状态：10/10 全部实现（build/update/rebuild + dev/bootstrap/resume/setup/reconcile/audit/accept，feature-map #6）
- 进度指针：`doclib/10-architecture/prd.md`（v0.38）｜`doclib/10-architecture/design.md`（v2）｜`doclib/00-overview/feature-map.md`｜`doclib/00-overview/progress.md`
- 术语：图书馆=doclib/、簿记=.doclib/、任务书=.doclib/tasks/、基线=snapshot、漂移=drift、锚点=covers
- 会话档案：agent 对话原始记录导出落 `doclib/98-sessions/`（F9 唯一白名案例外，ADR #19）——会话收尾三动作（导出提醒→落位补 frontmatter 五要素→.plan 头部登记）见 `.opencode/commands/planstore.md`（双侧同文）与 `doclib/40-guides/transcripts.md`；文件名 `<slug>-<yyyymmdd>-<NN>.md`
- 基准铁律：复原对比对象=**原仓库**（非图书馆）——重建↔原仓库实质差距=建馆缺陷显影器（benchmark.md 目的铁律）（三阶段：P1 信息零遗漏→P2 质量保证→P3 升华超越原仓库）
- 治理状态：规划载体 `.plan/<日期>/` 已声明（F9 默认实例）；登记簿落点已拍板——**分散挂靠各卷**（Q25，挂靠表见 PRD §7）；复原基准测试体系已立项（F14，首个基准项目 **colinhacks/zod**【Q31】，操作指南 `40-guides/benchmark.md`；**复原须与建馆不同会话/实例/模型，防先验污染**）；历史遗留已清零（v0.23）：50-reference 已归位 90-reference、PRD/DESIGN 已迁入 `doclib/10-architecture/`；写协调乐观锁 revision 已立项（Q36）
- 孤儿治理（v0.5.0）：馆外文档四态判定（馆内/非文档资产/工具链豁免/待归位）+ 三层防线（扫描面/判定面/处置面）；处置走 `doclib place`（list/collect/archive/ack/restore，写操作默认干跑 `--apply` 执行，归档账可 restore）；**本仓库 `assets/` `skills/` 是源目录（靠 covers 兜底，勿入棺）**，`.claude/skills/` 分发副本由 `20-modules/_index.md` 覆盖
- 知识图谱（v0.5.0，F15 阶段 2）：vendored codegraph 在 `vendor/codegraph/`（git subtree，同步 `git subtree pull`；**就地改动必须登记 FORK-NOTES.md**，优先在 adapter 层 `src/core/codegraph/` 扩展、勿改 vendored 源）；`.codegraph/`=可再生缓存（非产物），graph 输出仅候选禁止直接入馆；telemetry 已物理隔离（构建面排除）；Node∈[22.5,25) 门（graph 可选增强，失败不阻塞核心）；规格 `30-features/graph.md`
<!-- doclib:custom-end -->
