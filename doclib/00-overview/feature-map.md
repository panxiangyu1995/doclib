---
title: 功能进度总账
covers:
  - src/
  - skills/
status: living
---

# 功能进度总账（feature-map）

> 全馆之锚与进度事实源。状态只认本表：`planned / in-progress / implemented / retired`。时间线视图见 [progress.md](progress.md)。

| # | 功能 | 一句话描述 | 对应文档 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | CLI 基础命令集 | init/plan/diff/snapshot/status/verify 六命令与核心纯逻辑 | 20-modules/（骨架） | implemented |
| 2 | 三核心 skills | build/update/rebuild 操作手册 | skills/ | implemented |
| 3 | 需求与架构文档体系 | PRD（需求唯一事实源）+ DESIGN v2 | doclib/10-architecture/ | implemented |
| 4 | 图书馆启用（dogfooding） | 本仓库 12 卷图书馆 + 引导文件 + 进度账 | doclib/ | implemented |
| 5 | 12 卷基线模板 | assets/templates/library 12 卷 + 99-archive 骨架 + copy-assets 构建链 | .plan/2026-10-17/phase1-skeleton-v2.md | implemented |
| 6 | 十 skill 体系 | +setup/bootstrap/resume/dev/reconcile/audit/accept | skills/ | implemented |
| 7 | npx 发布与 agent 适配 | **已发布 @panxiangyu1995/doclib@0.4.0**（scoped 改名：npm 名称相似度保护；public repo+provenance；staging 首发转正）+ init 交互问卷含载体；setup 独立命令未做（init/sync 已覆盖） | .plan/2026-10-19/npm-release.md + 70-deploy/deploy.md | implemented |
| 8 | BOOTSTRAP/RESUME 任务书 | plan --bootstrap/--resume 两种任务书类型（互斥校验） | .plan/2026-10-19/skills-cli-completion.md | implemented |
| 9 | 规划载体声明与双锚点提醒 | state.planning 声明（init --planning 多路径）+ 自定义载体不进快照 + 待登记/待归档提醒 | .plan/2026-10-19/skills-cli-completion.md | implemented |
| 10 | 进度对账与 reconcile | doclib reconcile 三段报告（疑似完成/进度不符/待推进）+ core/reconcile.ts；v0.34 补库内规格 + 对应文档混合引用判定修正（ADR #17） | doclib/30-features/reconcile.md | implemented |
| 11 | 引导文件模板与版本戳 | light/full 两档 + 区域契约（managed/custom）+ 版本戳检测 + 任务书收尾检查 | .plan/2026-10-19/guides-sync.md | implemented |
| 12 | 类别完备性检查 | verify 对照 12 卷基线报告缺失类别 | 30-features/（待写） | planned |
| 13 | git 感知基线 | 以 commit 为锚点的快照 | — | planned |
| 14 | watch 模式与多图书馆 | 文件监听自动提醒；多馆管理 | — | planned |
| 15 | doclib sync 引导同步命令 | 规则区再生/定制区保留/幂等/legacy 再生提示 | .plan/2026-10-19/guides-sync.md | implemented |
| 16 | 强验证体系 | doclib check 双账本对账（漏更/无归属/迁移/引导过期）+ ack 豁免 + strict 门禁 + pre-commit hook | .plan/2026-10-19/strong-validation.md | implemented |
| 17 | 文档治理全周期 + 双层图书馆 | 冷启动资产盘点/init 即 snapshot/规划载体适配（不输出工作流只回收知识）/存量迁移收编/孤儿文档检测/治理健康分/登记簿开放册制+99-archive 墓碑归档/归位宪法与三级索引编号体系/check 文档质量检测/无账不答与写协调纪律——**九项子能力已逐项取证落地**（登记簿族 · 99-archive 墓碑 · 治理健康分 · 写协调 revision · 归位决策树与三级索引 · 无账不答纪律 · init 即 snapshot · 孤儿检测+place 处置闭环= #24 · check 文档质量检测）；唯一缺口：init 侧自动产出馆外收编清单由 `doclib-build` skill 以 `place list` 承担（CLI 侧未做，不阻断本项） | doclib/10-architecture/prd.md（v0.17–v0.23，Q20–Q40） | implemented |
| 18 | 复原基准测试体系 | 基准库准入 + 同题共答双跑 + 缺陷四分类 + 复原档案 + 污染防护（不同模型/实例）+ 回归重跑 | doclib/10-architecture/prd.md（F14）+ 40-guides/benchmark.md + .plan/2026-10-21/benchmark-umami.md + 50-testing/benchmark/（umami 档案 010~080） | implemented |
| 19 | ast-grep 阶段 1 集成（扫描器确定性层） | **原「移除规程与扫描器集成」的剩余唯一未做项**（规程与引导四纪律已落地见 #30，codegraph 阶段 2 见 #25）：`doclib` 探测 ast-grep PATH 可用性 → 可用则实体扫描走内置规则集（Q28 全主流语言一次到位）；确定性/语义性分层不可互替（ast-grep 服务 check 执法、codegraph 服务查询加速）；三铁律不变（馆为事实源工具出候选 / 确定性语义性分层 / 可选增强优雅降级不进必需依赖） | doclib/10-architecture/prd.md（F15 阶段 1，Q28）+ ADR #10 | planned |
| 20 | 强验证完成包 | 孤儿检测（第七分类+Q20 豁免清单）+ 治理健康分（Q22 五分项加权+等级）+ 乐观锁 revision（Q36）+ 引导硬预算（Q37/38 ≤150 行） | .plan/2026-10-19/check-governance-pack.md + 30-features/check.md | implemented |
| 21 | 质量符合性修复包 | CI 包名事实源（PACKAGE_NAME 读 package.json）/status --json 完整载荷/plan stdout 输出 revision/check 文档质量分类（馆内断链检出，quality 分项 0.1/项扣减）/verify 两级索引核对（卷 _index 双向+缺卷 soft）/state.json 损坏防护（.corrupt 备份+fail-fast） | .plan/2026-10-20/quality-conformance-pack.md + 30-features/check.md | implemented |
| 23 | 基准扩容·四领域样本 | memos(Go 全栈)/fd(Rust CLI)/csvkit(Python 数据)/aspnetcore-realworld(C# 后端) 四项目：**建馆侧四馆已建成**（快照留痕：aspnetcore+fd complete → csvkit built + memos reconciled，期间完成 v0.32 文体整改 29 项）→ **待做：四样本复原侧闭环**（隔离复原 / 同题共答 / 缺陷四分类 / 回灌 / 回归）与**档案入馆**（`50-testing/benchmark/` 现仅 umami 010~090；`benchmark.md` 状态段仍记「候选」）；驱动基线演进实证（D-12/Q40） | .plan/2026-10-21/benchmark-expansion.md | in-progress |
| 22 | CLI 自动化验收测试套件 | 11 命令极致功能验收落测试文件（testkit 共享基建 + 12 测试文件 122 用例：正常/错误/边界/压力 + spawn e2e 全生命周期闭环 + 行为契约锁定），全套 178/178 复测入口 npm test | doclib/50-testing/cli-acceptance-suite.md | implemented |
| 24 | 孤儿归位与处置闭环 | 孤儿四态判定（馆内/非文档资产/工具链豁免/待归位）+ 剔除列扩围（27 工具链目录 + 任意层级引导文件 + 归档指针）+ `doclib place` 处置族（list/collect/archive/ack/restore，干跑默认 + covers 硬拦截 + 归档账可逆）+ `ack --dir` 零代码扩展 + 疑似新工具目录提示 + 漂移语义修正（真删除 vs 被新忽略）；测试 219/219 + 冒烟 7 段全链路（实施期 5 缺陷 + 审查轮 10 项已修） | .plan/2026-10-22/orphan-placement-pack.md + doclib/30-features/place.md + doclib/50-testing/acceptance-place-v0.5.0.md | implemented |
| 25 | codegraph 克隆集成（F15 阶段 2，`doclib graph`） | git subtree 克隆 vendor/codegraph v1.6.2（MIT，否决 npm 直调）+ CJS 岛编译（telemetry 物理隔离，fork 编辑 1 处 FORK-NOTES 账本）+ `doclib graph index/status/draft/explore` 命令族 + 草稿候选管道（.doclib/drafts/ 四册 provenance+TODO(agent)）+ `init --graph` + BUILD 候选段 + 无 daemon + Node>=22.5 门优雅降级 + `.codegraph/` 双排除；240/240 测试 + 冒烟 9 段 | .plan/2026-10-22/codegraph-integration.md + doclib/30-features/graph.md + FORK-NOTES.md | implemented |
| 26 | README 门面重写 + CONTRIBUTING 新建 + 英文版 | 五诉求重排（痛点场景化 6 场景 + 30 秒上手决策表 5 处境 + 传统做法对照 4 类 + 三条铁律 + 现状实证数字表 11 行带来源）+ 贡献细则独立成文 `CONTRIBUTING.md`（9 节）+ 英文版 `README.en.md`（与中文版逐条对齐：14 h2 / 7 h3 / 71 表格行 / 28 链接 / 28 关键数字同现，ASCII 框宽 64）+ 馆内联动（overview.md 门面描述 + covers 锚点 + PRD 版本 + 模板文件数 + INDEX 陈旧计数 + design.md 头部 + feature-map 失效 covers）；验收：行数 253/113/253、锚点 0 断链、19 命令实测 exit 0、242/242 测试绿、check 违规 0 治理 100/100(A) | .plan/2026-10-22/readme-facade-rewrite.md + README.md + README.en.md + CONTRIBUTING.md | implemented |
| 27 | 门面文件多语言变体豁免（Q42） | `isRootFacadeFile` 由精确闭集改为**模式识别**：基名 ∈ {README, CHANGELOG, CONTRIBUTING} + locale 标签 BCP-47 形状（`en`/`zh-CN`/`pt_BR`/`sr-Latn` 命中；`wip`/`2024`/`abc` 不命中）→ `README.<locale>.md` 等变体在孤儿判定面与基名同权，用户仓无需逐个 ack 登记；判定面边界：locale 变体与基名在「无归属」面一致（仍需 covers 锚点，不因语言宽严不一）；否决逐项列举（闭集必然滞后）；测试 8/8 + 全量 242/242 | .plan/2026-10-22/readme-facade-rewrite.md + doclib/10-architecture/prd.md（v0.31，Q42）+ doclib/30-features/check.md + doclib/10-architecture/decisions.md（ADR #14） | implemented |
| 28 | 图书馆文体学与可读性门禁 | 藏书文体三类（narrative 叙述书/ledger 登记簿册/index 索引页）+ 教科书五段定稿（导读/为什么/是什么/怎么运转/怎么验收/参考）+ 卷默认映射 + frontmatter type 覆盖 + verify/check 文体门禁（结构缺失/卡片化/注记污染 strict 可阻断，倾倒仅警告，ledger·00-overview·95-lessons·benchmark 档案区豁免）+ rebuild 回灌沉淀规则（过程短语禁入正文）+ init 骨架 11 卷 _index 内嵌文体模板 + narrative 卷模板教科书化；测试 249/249（docquality +10）+ 冒烟 AC-1~9 全过（strict exit 1/soft exit 0）+ init 新馆违规 0 | .plan/2026-10-23/genre-system.md + doclib/10-architecture/prd.md（v0.32，§7.6）+ doclib/10-architecture/decisions.md（ADR #15） | implemented |
| 29 | CLI 旗标面对账（flag-surface） | 面穷举守卫扩展——馆内旗标 token（全 md 长名，描述性指代不落词面值防自指）vs covers 源码引号包裹旗标字面量双向对账（源有馆无=遗漏候选/馆有源无=虚构候选，agent 裁决三铁律）；测试面文件（test/spec/tests 目录）默认排除（fixture 字面量）；COMMON_FLAGS 生态惯例闭集（--help/--version）；benchmark 档案区豁免；被否：语法树解析/语言注册表扫描；验证=本馆自证（候选=4 外部工具旗标 npm/git/pytest 引用，裁决留痕）+ csvkit 实战（复现 D1-D7：2 遗漏+2 虚构+共享面长名 8 项+谓词语义失真+通配伪候选 → 修复 → **Δ0** 馆 121↔源 121）；测试 252/252（surface 2 例） | .plan/2026-10-23/flag-surface.md + ADR #16 + 30-features/check.md | implemented |
| 30 | 移除规程与引导四纪律落地 | 六步移除规程（影响面预查→残留扫描→执行移除→馆内联动→check 执法→留痕）落 `doclib-dev` skill + 引导 full/light；引导四纪律齐备（裁剪判据「删掉会犯错吗」/ 硬预算 ≤150 行由 status 报告 / 记忆以馆为准 / 单点强调）；codegraph 阶段 2 另见 #25（ast-grep 阶段 1 剩余项见 #19） | doclib/10-architecture/prd.md（F2/F15）+ ADR #10 + skills/doclib-dev/SKILL.md + assets/guides/ | implemented |
| 31 | reconcile 判定修复 + 规格补欠账 | 「对应文档」列改按**存在性**判定（多候选「 + 」拆分 + 库内/仓库根双解析 + 库内锚点与载体证据分流）——修正旧实现「只取首 token 且一律按 `doclib/` 前缀解析」导致本仓 15 条 implemented 全数误报（含当场归档条目），真失真被淹没；补建库内规格 `30-features/reconcile.md`（v0.25 以来首份 reconcile 规格，此前无任何 covers 锚点）+ 两级索引登记；测试 4/4（新增 2 组）+ 全量 254/254 | .plan/2026-10-26/reconcile-path-resolution.md + doclib/30-features/reconcile.md + doclib/10-architecture/decisions.md（ADR #17） | implemented |
