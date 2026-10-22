# umami 复原基准实验规划（F14 首轮 · 本环境）

> 创建于 2026-10-21 ｜ 规划载体：.plan/（F9 双锚点·锚点一）
> 关联：doclib/10-architecture/prd.md F14 ｜ doclib/40-guides/benchmark.md ｜ feature-map #18（planned→in-progress）
> 注：zod 基准实验已由用户在另一台机器并行启动，本环境移除 zod，基准对象顺延为 umami。
> v2（2026-10-21）：新增 §9 功能覆盖声明（覆盖矩阵 + 范围边界）；清单修正——登记簿首批五册全建（补 events）、reconcile/ack/hook 固化实测、回灌升格为 update 全链实测、专项触发清单。

## 1. 目的与效果

**目的**：把复原基准测试体系（PRD F14）从纸面方法论变为实证闭环——给 umami 建馆 → 隔离复原 → 同题共答 → 缺陷四分类 → 对症下药 → 回归重跑，验证方法论本身，并产出驱动 doclib 产品演进的第一手数据。

**预期效果**：

1. 七步闭环跑通一次，方法论（档案/得分/分类账）得到实测校准
2. 复原度得分（同题共答一致率）与缺陷密度按卷分布两大数据产出
3. 缺陷四通道处置落地：内容回灌 / 结构演进 / 表述改进 / 验收模板改进
4. 收敛判据 R1–R4 达成（≥90% 且不回退 / 零新增结构表述缺陷 / 治理 A / 八问全通过）
5. umami 复原档案六件套落位 doclib 馆 50-testing/benchmark/（成为 doclib 产品的测试套件资产）

## 2. 问题点

| # | 问题 | 本方案的解法 |
| --- | --- | --- |
| P1 | 图书馆完备度无法自证——写的人不知道漏了什么（未知的未知），只有复原者能显形缺口 | 复原即基准测试（F14 核心原理） |
| P2 | 80-design / routes / ui-assets / F12 迁移账本等测试面只有全栈项目能测；zod（纯库）结构性测不到 | 选 umami（全栈应用，27 个 Prisma 迁移 + routes + UI 资产 + env config + docker 部署） |
| P3 | 同题共答需要**结构化可比**的答卷机制，当前 30-features 模板只有 Given/When/Then，无答卷字段 | 模板增补双跑答卷规范（条目号/输入/期望/实测/一致/证据/运行时声明），复原答卷与原仓库答卷同构，diff 即结果 |
| P4 | 复原者先验记忆污染会虚高校准（同 agent 先建馆再复原） | 交付物仅图书馆副本 + REBUILD 任务书（纯 Markdown，物理隔离）；REBUILD-LOG 记录复原者身份审计；复原者由用户在隔离会话/机器/模型安排 |
| P5 | zod 是 monorepo，umami 是 30MB 全栈——建馆范围失控风险 | 切片定义固化进 BUILD 任务书：复原对象=应用功能面；构建工程链只入叙述卷 |
| P6 | 本馆 9/12 卷缺 `_index.md`（Q33 存量不追溯范围） | 新增文档落位即登记两级索引；50-testing 卷随本次新增同步补建卷索引 |
| P7 | npx 发布包 0.4.0 模板不含答卷规范（本仓库新增未发版） | 建馆用本地 dist（保证最新模板/skills 进实验）；npx 发布包实战验收移至复原者侧 init 复原产物时承担 |

## 3. 研究结果

### 3.1 PRD 验收要求（F14/F3/§9 全集）

- 七步闭环：选项目 → 建馆 snapshot → 隔离复原 → 同题共答双跑 → 缺陷四分类 → 对症下药 → 回归重跑
- 复原验收 = 纯 agent 自检：逐条执行 30-features 验收标准，留痕 REBUILD-LOG.md；feature-map 全绿 = 90% 达成
- 同题共答分层：行为层（主，验收双跑逐条对比）/ 结构层（agent 评审）/ 字节层（不比）
- 缺陷四分类：内容（漏写→回灌）/ 结构（装不下→基线演进）/ 表述（歧义→改 skill）/ 验收（不可执行→改模板）
- 复原档案六件套：准入记录、BUILD 基线版本号、REBUILD-LOG（含复原者身份）、差异清单、缺陷分类账、修复记录
- 污染防护：建馆与复原不同会话/实例（理想异模型）；若受限，至少全新会话 + 不透露源码
- 回归触发：结构版本变更必跑全量；内容更新抽查跑；得分不回退
- 馆级质量门：check 治理健康分 A（≥90）+ verify 覆盖度/两级索引/登记簿五要素 + 终极抽查八问

### 3.2 候选项目池（gh 实证核实 2026-10-21）

| 项目 | 领域 | 星数 | 语言 | 协议 | 活跃 | 测试面贡献 | 结论 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **umami-software/umami v3.4.0** | 全栈应用 | 39,494 | TS | MIT | 活跃 | **唯一宽覆盖面**：80-design+routes+ui-assets+API 登记+27 迁移（F12）+env config+docker 部署 | **本环境首选** |
| colinhacks/zod | TS 库 | 44,164 | TS | MIT | 活跃 | API 清单天然可枚举 | 已拍板 Q31，**外部机器进行中** |
| usememos/memos | Go 全栈 | 63,956 | Go | MIT | 活跃 | Go 面+前端卷 | 扩容期备选 |
| junegunn/fzf / sharkdp/fd | CLI | 83,705 / 44,815 | Go / Rust | MIT / Apache-2.0 | 活跃 | CLI 工作流+Go/Rust 面 | 扩容期备选 |
| wireservice/csvkit | 数据处理 | 6,415 | Python | MIT | 活跃 | 数据领域+Python 面 | 扩容期备选 |
| realworld-apps/aspnetcore-realworld | 后端服务 | 2,093 | C# | MIT | 活跃 | 后端+C#+CRUD API | 扩容期备选 |

**否决记录**：drawdb（AGPL 非宽松协议）、HTTPie（2024-12 停更）、node-express/nestjs realworld（无 LICENSE+停更）、Kap（停更）、pomotroid（已重写为 Rust，非前端 web 应用）。

### 3.3 测试要求 → 项目映射（缺口分析）

| 测试要求 | umami 是否覆盖 |
| --- | --- |
| API 登记簿（90-reference，API 先行） | 覆盖（REST API 面 + /api/send 追踪端点） |
| 80-design + routes + ui-assets 登记簿 | 覆盖（**umami 是当前候选池唯一活跃 MIT 全栈入口**） |
| F12 迁移账本 | 覆盖（27 个 Prisma 迁移，存量收编实测） |
| config 登记 + 70-deploy | 覆盖（env vars 多 + docker compose） |
| F15 扫描器语言面 | 部分（TS；Go/Rust/Python 由扩容期补） |
| 切片复原条款 | 覆盖（30MB 体量按功能面切片） |

## 4. 代码实际情况

### 4.1 doclib 本仓库（2026-10-21 status 实测）

- 版本 14，基线 snap-014，漂移 0，治理 **100/100 (A)**，revision 5；CLI 自动化套件 178/178 全绿（feature-map #22）
- CLI 0.4.0 已发 npm（npx @panxiangyu1995/doclib 可用）；本地 dist 为最新
- init 参数（src/commands/init.ts:15 已核实）：`--agents`（逗号分隔）、`--planning`（逗号分隔载体路径）、`--guide light|none`、`--force`
- 本馆 12 卷中 9 卷缺 `_index.md`（00-overview/10-architecture/40-guides/50-testing/60-config/70-deploy/80-design/95-lessons/99-archive）——Q33 存量不追溯，但**本次新增文档须落位即登记两级索引**

### 4.2 umami@v3.4.0 画像

- Next.js + Prisma（postgres/mysql），自带 docker compose；前端 React SPA（routes + 图标 + 国际化文案）
- 27 个 Prisma 迁移目录（prisma/migrations 实测）；MIT；30 MB；推送活跃（2026-10-20）
- 建馆素材面：README/wiki/docs 为 API 行为描述权威参照（素材源，非复原对象）

### 4.3 本仓库 30-features 模板现状（assets/templates/library/30-features/_index.md）

- 现仅有"每功能一份规格 + G/W/T"的指引，**无双跑答卷字段**——需按 D3-B 增补（本计划清单第 3 项）

## 5. 设计的方案

### 5.1 总体架构（三方角色与隔离边界）

隔离边界画在"复原者 vs 其余所有人"之间：

```
建馆侧（本环境）                              复原侧（隔离会话/机器，用户安排）
─────────────────────────────                ─────────────────────────────
test/umami/ clone @ v3.4.0                   全新空目录
 ├ init(本地 dist) → 建馆 → snapshot    ───▶   ├ 收到：doclib/ 副本 + REBUILD-001.md
 ├ check/verify/audit 自查门全绿              ├ 只读图书馆，从零复原（信息隔离铁律）
 ├ plan --rebuild → REBUILD-001.md            ├ 自检验收 → 复原答卷
 ├ docker compose 起 v3.4.0                   ├ REBUILD-LOG（含复原者身份）
 ├ 原仓库答卷首跑留痕 ←───────────────────────├ 差异清单 + 回灌建议 + 校准副本
 ├ 同题共答 diff → 得分 + 缺陷四分类  ◀──回传──┘
 └ 四通道处置 → doclib 版本推进 → 回归循环
```

- 原仓库答卷由建馆侧首跑（建馆者有源码权限，合法；顺带就地暴露验收缺陷，不浪费复原轮次）
- 对比/分类/优化由建馆侧承担（对比发生在复原完成后，不构成对复原者的污染）
- 交付物仅两样：`test/umami/doclib/` 副本 + `test/umami/.doclib/tasks/REBUILD-001.md`（含 revision），无打包目录（防孤儿）

### 5.2 关键决策（D1–D8）

| # | 决策 | 拍板 |
| --- | --- | --- |
| D1 | 首轮项目组合 | **umami 本环境先行**（zod 外部进行中）；memos 留扩容期 |
| D2 | 复原者环境 | 三级任选（用户定）：A 异产品异模型（首选）/ B 同环境异模型新会话 / C 同模型全新会话不透露源码 |
| D3 | 验收标准形态 | G/W/T 文字 + **可复现命令 + 期望结果表**（双跑答卷同构可 diff）；拒绝纯主观叙述与全自动脚本两极 |
| D4 | 档案落位 | doclib 本仓库 `doclib/50-testing/benchmark/`（复原档案是 doclib 产品的测试套件，归位宪法要求入馆） |
| D5 | 工具链 | 建馆用本地 dist（最新模板/skills）；npx 发布包实战验收由复原者侧 init 复原产物承担 |
| D6 | 建馆范围 | 切片：复原对象=umami 应用功能面；构建工程链/docs 入叙述卷不复原 |
| D7 | 优化闭环 | 缺陷四分类 → 四通道（回灌/演进/改 skill/改模板），全部走 doclib 本仓库 .plan 双锚点 dogfooding |
| D8 | 回归与收敛 | 结构变更=全量新隔离复原轮；内容更新=切片抽查轮；R1–R4 全满足才停 |

### 5.3 更改计划（按文件）

```java
[更改计划]
- 文件：.plan/2026-10-21/benchmark-umami.md（本文档）
- 理由：F9 锚点一——规划落盘

[更改计划]
- 文件：doclib/00-overview/feature-map.md
- 理由：#18 对应文档列追加本路径；planned → in-progress

[更改计划]
- 文件：assets/templates/library/30-features/_index.md + skills/doclib-accept/SKILL.md
- 理由：D3-B 答卷规范增补（模板与 skill 严格同步）；umami 馆 30-features 出生即带

[更改计划]
- 文件：/Users/pxy1995/code/myrepo/doclib/test/umami/（新目录）+ test/umami/doclib/ + test/umami/.doclib/
- 理由：基准项目隔离环境与建馆产物（12 卷 + 首批五册登记簿 api/routes/ui-assets/config/events + 迁移账本收编 27 迁移 + feature-map + 30-features 15–30 条）

[更改计划]
- 文件：doclib/50-testing/_index.md（新建）+ doclib/50-testing/benchmark/（新分区：_index.md + 010-umami.md 主册 + 020-umami-answer-src.md + 030-umami-answer-rebuild.md + 040-umami-rebuild-log.md + 050-umami-divergence.md）
- 理由：D4 档案六件套落位 + 三位序号/kebab-case/两级索引合规

[更改计划]
- 文件：doclib/INDEX.md + doclib/40-guides/benchmark.md + doclib/00-overview/progress.md
- 理由：馆级索引登记 + 指南状态段更新（zod 外部进行中注记 + umami 启动记录）+ 时间线补记
```

## 6. 备选方案（已权衡与否决记录）

| 决策点 | 备选 | 否决/顺位理由 |
| --- | --- | --- |
| 首轮组合 | 仅 zod 单项目 | 80-design/routes/ui-assets/F12 四测试面零覆盖（且 zod 已外部进行） |
| 首轮组合 | zod + umami 并行 | 双线作战，方法论未验证即重负载，失败归因困难 |
| 第二全栈候选 | memos（Go 全栈 64k★） | 测试面同宽但体量更大（47MB vs 30MB）；语言互补属 F15 扫描器变量，非复原实验必测——留扩容期 |
| 答卷形态 A | 纯自然语言 G/W/T 手工执行 | 双跑结果主观，逐条 diff 困难，同题共答退化 |
| 答卷形态 C | 验收全部自动化测试脚本 | 超出图书馆纯 Markdown 形态，维护成本高，非克隆铁律边缘 |
| 档案落位 | 馆外独立实验目录 | 违反归位宪法（馆外是例外，例外必须显式） |
| 工具链 | 全程 npx 0.4.0 | 发布包模板无答卷规范，实验核心机制缺失；npx 实战验收移至复原者侧 |
| 建馆范围 | monorepo 全量蒸馏 | 范围蔓延；发布工程链不复原符合切片条款 |
| 收敛节奏 | 每轮都全量回归 | 成本失控；采用结构变更全量/内容更新切片的分级触发 |

## 7. 具体的实施清单

```java
实施清单：
1. 创建 .plan/2026-10-21/benchmark-umami.md（规划文档落盘，锚点一）【本文档】
2. feature-map #18 追加 .plan 路径并推 in-progress
3. 30-features 模板增补双跑答卷规范 + skills/doclib-accept 同步答卷格式
4. npm run build + npm test 全绿 → node dist/cli.js sync（skills 同步本仓库 agent 目录）
5. doclib check → snapshot --note（doclib 本仓库锚点一固化）
5a. test/ 隔离防护：.gitignore 增补 test/（临时测试区约定——克隆项目置于馆内 test/ 的前提防护：不入 git、不入快照/漂移/孤儿扫描）
6. git clone umami@v3.4.0 → /Users/pxy1995/code/myrepo/doclib/test/umami，记录 commit hash
7. 本地 dist init（--agents claude,opencode --planning .plan）→ 确认骨架/skills 落位
8. plan 生成 BUILD 任务书（切片定义固化入任务书）
9. doclib-build 建馆：12 卷 + 首批五册登记簿（api/routes/ui-assets/config/events，PRD §7 首批全建）+ 迁移账本收编 27 迁移 + feature-map + 30-features（15–30 条，条条带 G/W/T+可复现命令+期望结果）
10. snapshot（test/umami 馆 v1）→ check/verify 治理 A 门 + audit 抽查（放行门）
10a. 建馆多会话期间（第 9 项中途）：doclib reconcile 对真实漂移实测三段报告（疑似完成/进度不符/待推进）
10b. doclib ack 实测：对 test/umami 馆外自然存在的文档做一次豁免登记（once 语义验证随 snapshot 清除）；无自然对象则构造一次性场景
10c. doclib hook 实测：test/umami 装 pre-commit → 故意漏更提交 → 验证门禁拦截 → 修正后通过
11. plan --rebuild 生成 REBUILD-001.md
12. docker compose 起 umami@v3.4.0 → 原仓库答卷逐条首跑留痕
13. 档案落位 doclib 馆：50-testing/_index.md 新建 + benchmark/ 分区（010 主册含准入记录+commit hash+基线 snap id + 020 答卷 + 分区 _index）+ INDEX.md 登记 + benchmark.md 状态段更新
14. progress.md 补记 + doclib check → snapshot --note（doclib 本仓库）
15. 交付用户：test/umami/doclib/ + REBUILD-001.md + 复原者隔离须知（D2 方案由用户选定执行）
—— 以下依赖复原者回传（外部依赖，非建馆会话执行项）——
16. 回收入库：030-umami-answer-rebuild.md + 040-umami-rebuild-log.md + 050-umami-divergence.md 落位登记
16a. 【升格】内容缺陷回灌 = update 全链一等公民实测：diff → UPDATE 任务书 → doclib-update 增量更新 → verify → snapshot（不再只是顺带触发）
17. 同题共答 diff → 复原度得分 → 010-umami.md 缺陷四分类账初版
18. 四通道处置（按实际缺陷清单逐项）
19. 回归轮（结构变更全量/内容更新切片）→ 得分曲线对比
20. 收敛判定 R1–R4 → 全满足封卷 umami 档案 + feature-map #18 推进 + progress 补记 + snapshot
—— 后续独立规划（不在本轮强制范围）——
21. zod 外部结果回收登记（用户带回后触发）
21a. 专项触发清单（benchmark 天然测不到的功能，见 §9）：bootstrap/resume（候选：本机其他 repo 场景）/ 移除规程（下次真实移除时按 F2 六步走并留痕）/ 多版本条目 `API-001@v2`（并入 zod 外部实验观察项，zod 有 v1→v4 演进史）
22. 扩容期项目逐个立项（memos、fd/fzf、csvkit、aspnetcore-realworld）
```

## 8. 风险与约束

| # | 风险 | 缓解 |
| --- | --- | --- |
| 1 | 建馆质量先天不足（缺陷实为 build skill 所致） | 放行门硬自查（清单 10）；表述/验收缺陷分类本就吸收此风险 |
| 2 | 复原者条件受限（无第二模型/实例） | D2 三级降级路径，最低线已获 benchmark.md 明文许可 |
| 3 | 建馆范围蔓延 | D6 切片固化入 BUILD 任务书；wiki/docs 定性素材源 |
| 4 | 验收条目爆炸 | 功能簇粒度 15–30 条；API 细目由登记簿承载、实体抽查 |
| 5 | 双跑环境差异污染对比 | 答卷模板含运行时环境声明；docker compose 锁版本 |
| 6 | 建馆侧记忆污染复原者 | 交付物仅纯 Markdown，物理隔离；REBUILD-LOG 身份审计 |
| 7 | 复原周期不可控 | REBUILD 任务书自带分阶段施工顺序；用户随时抽查不阻塞 |
| 8 | 本地 dist 与 npx 0.4.0 漂移 | 漂移本身记为发布工程待办；复原者侧 npx 实战验收兜底 |

## 9. 功能覆盖声明（v2 增补）

> 范围声明：**基准实验通过 ≠ doclib 全部功能已实地验证**。本节固定记录覆盖边界，防止未来误判。
> 覆盖分三档：✅ 直接实测（实验链路必然经过）/ ⚠️ 顺带或机会性（已固化进清单或视情节触发）/ ❌ 天然不可测（需替代渠道）。

### 9.1 覆盖矩阵（对照 feature-map 22 条 + PRD F1–F15）

| 功能 | 档 | 实测方式 |
| --- | --- | --- |
| #1 CLI 六基础命令（init/plan/diff/snapshot/status/verify） | ✅ | 建馆全程实跑 |
| #2/#6 build/rebuild/accept/audit skills | ✅ | 实验主体 |
| #5 12 卷模板（80-design/50-testing 等卷首次真实验证） | ✅ | umami 宽覆盖面建馆 |
| #7 npx 发布与 agent 适配 | ✅ | 复原者侧 init 复原产物实战 |
| #9 规划载体声明与双锚点 | ✅ | init --planning + 锚点一/二全程 |
| #11 引导文件模板与版本戳 / #15 sync | ✅ | 清单 4/7 |
| #16 check / #20 强验证完成包 / #21 质量符合性修复包 | ✅ | 治理 A 门放行 |
| #22 CLI 自动化验收套件 | ✅ | 已有 178 用例锁死机器行为维度 |
| #18 基准体系本身 | ✅ | 本实验 |
| #2/#6 update skill | ⚠️→✅ | 清单 16a 升格为全链实测 |
| #10 reconcile | ⚠️→✅ | 清单 10a 固化（真实漂移数据） |
| #16 ack / hook | ⚠️→✅ | 清单 10b/10c 固化 |
| #17 治理全周期（墓碑/99-archive/三态更新） | ⚠️ | 机会性：回灌触发生过时内容时自然实测 |
| #6 dev skill（日常主力） | ⚠️ | 本仓库 dogfooding 持续实测；馆侧由建馆多会话覆盖 |
| #12 类别完备性检查（planned 未全实现） | ⚠️ | verify 报告观察 |
| #8 BOOTSTRAP/RESUME 任务书 | ❌ | 需新项目/半成品场景——专项触发（21a） |
| #19 移除规程 + F15 扫描器（planned） | ❌ | 无自然移除场景/ast-grep 未集成——专项触发（21a） |
| #13 git 感知基线 / #14 watch/多图书馆（planned 未实现） | ❌ | 未实现，无测对象 |
| 多版本登记簿条目 `API-001@v2` | ❌ | umami 无 API 版本演进——并入 zod 外部实验观察（zod v1→v4） |
| events 登记簿册 | ✅（v2 修正） | 原清单漏列，已并入清单 9 首批五册 |

### 9.2 替代覆盖渠道

| 未覆盖项 | 替代渠道 |
| --- | --- |
| bootstrap/resume | 专项：用本机其他 repo（如 OpenVista 等候选）按 BOOTSTRAP/RESUME 任务书实测 |
| 移除规程六步 | 专项：doclib 本仓库下次真实功能移除时按规程执行并留痕（dogfooding） |
| 多版本 API 条目 | zod 外部实验观察项（v1→v4 演进史天然素材） |
| F15 ast-grep/codegraph | 独立立项实测（三指标：建馆耗时/查询耗时/缺口发现率，Q40） |
| CLI 机器行为边界 | 已由 178 用例自动化套件覆盖（与基准实验互补，不重复） |
