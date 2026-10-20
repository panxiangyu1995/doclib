---
title: 进度时间线
covers: []
status: living
---

# 进度时间线（progress.md）

> 时间线只叙述，不另立状态；状态事实源见 [feature-map.md](feature-map.md)。每条记录：日期、关联 .plan、完成条目、涉及卷。

- **2026-10-17**
  - 关联 .plan：无（PRD 需求澄清阶段，以对话为规划载体）
  - 完成条目：#3（PRD v0.13：Q1-Q17 全部拍板；北极星/实时同步原则；F1-F11）；DESIGN.md 架构 v2
  - 涉及卷：00-overview、10-architecture、40-guides
  - 完成条目：#4（本图书馆启用：12 卷结构补齐、引导文件落位、进度账建立）
  - 状态变化：#1 #2 保持 implemented；#5-#14 登记 planned
  - 规划：`.plan/2026-10-17/phase1-skeleton-v2.md`（阶段 1 骨架 v2：12 卷模板 assets 化 + 引导文件模板/版本戳 + state v2 + init 参数化）；#5 → in-progress
  - 完成条目：#5（阶段 1 骨架 v2 执行完毕：清单 3-26 与 32-36 完成；27-31 经用户决定跳过——本仓库图书馆保持手工结构）；#11 推进至 in-progress（模板与版本戳已落地，status/verify 检测已实现）
  - 状态变化：#5 in-progress → implemented；#11 planned → in-progress；版本 0.2.0
  - 涉及卷：00-overview、10-architecture（dependencies 新增 copy-assets 构建链）、95-lessons（新增脚手架保护教训）
  - 补账与强化（用户指出的缺口）：引导文件全面强化（AGENTS.md/CLAUDE.md 重写为完整工作流手册；assets/guides/light.md 补入 12 卷实时同步映射全表/会话纪律/.plan 双锚点/skills 速查）；图书馆补账——10-architecture 五卷（overview/data-model/data-flow/dependencies/decisions）、20-modules/_index（18 模块）、30-features（_index + init-v2.md 行为规格）、60-config（构建链/files）、70-deploy（npm 配置就绪）、INDEX 重整；清理重复的 40-guides/testing.md
  - 迁移治理（用户拍板：混合账本制 + forward-only）：模板新增 10-architecture/migrations.md（馆骨架 22→23 文件）；实体在代码区 migrations/（NNN_YYYYMMDD_slug），账本唯一取号、applied 不可变、登记即完成；实时同步映射表（AGENTS/CLAUDE/light/workflow 模板）加入迁移行；本仓库账本空置建账
  - **2026-10-19** · 引导文件区域化与 doclib sync（用户指示实现，规划见 `.plan/2026-10-19/guides-sync.md`）：引导分 managed 规则区（CLI 再生）/custom 定制区（agent 维护）；新命令 sync（幂等、legacy 提示、state.agents 持久化）；BUILD/UPDATE/REBUILD 任务书收尾加引导检查；身先士卒——本仓库 AGENTS/CLAUDE 改造为戳+区域格式由 sync 接管。状态变化：#11 → implemented；新增 #15 → implemented
  - **2026-10-19** · 强验证体系规划（INNOVATE+gh 调研 codument/maat 后方案获批，规划见 `.plan/2026-10-19/strong-validation.md`）：state v3 双账本（代码账+文档账）、`doclib check` 六分类对账、ack 豁免（once/standing）、--strict 门禁、pre-commit hook、迁移账本机器校验、引导新鲜度比对。锚点一登记：#16 → in-progress
  - **2026-10-19** · 强验证体系实现完成（锚点二）：清单 3-24 执行完毕——typecheck ✓、测试 36/36 ✓、冒烟九项全过（漏更/已对账/无归属/豁免/strict 退出码 1 与 0/hook 双形式 install-remove/迁移违规/降级警告）；冒烟抓到并修复 hook 子命令解析缺陷（`hook remove` 子命令形式未映射，实时入档 95-lessons）；PRD v0.16（F13+Q19）、DESIGN、图书馆六卷同步。状态变化：#16 in-progress → implemented
   - **2026-10-19** · REVIEW 全方位审查：25 项清单逐条核对 + 探针验证（once-ack 生命周期/无状态目录/钩子防护），标记偏差 4 项——①hook 子命令解析缺陷（执行中已修复）②docFirst 语义与规范不符 ③once-ack 测试缺口 ④CI 模板未固定版本；按用户批准修订②③④（docFirst 精确计算/补 once 单测/模板固化 doclib@版本），测试 38/38 ✓。四项偏差全部闭环
   - **2026-10-19** · 文档治理两轮立项（用户场景输入：治理全周期 → 双层图书馆与慎删制；INNOVATE 方案获批后 PRD 落笔）：PRD v0.17（治理全周期：冷启动盘点/init 即 snapshot/F9 规划载体适配——不输出工作流只回收知识/存量迁移收编/孤儿文档第七分类/治理健康分）→ PRD v0.18（双层图书馆：§2 先馆后码理念、§7 叙述层+实体登记簿层+99-archive、条目五要素、三态更新与默认不物理删除、实体级对账与抽查）；同步修正 README 双重漂移（7 卷旧结构图→12 卷双层、命令表补 sync/check/ack/hook）、引导模板源 full/light（登记簿映射行+先馆后码+三态更新）并 sync 再生、custom 区治理状态补记；ADR #6 登记。状态变化：规格层演进，无代码功能状态推进；Q20–Q30 待拍板
   - **2026-10-19** · 复原即基准测试立项（用户方法论陈述 + 五补强确认，规划载体：本对话）：PRD v0.19——F14 复原基准测试体系（多开源项目建馆→隔离复原→同题共答双跑→缺陷四分类→对症下药→回归重跑；基准库准入/复原档案/污染防护=不同会话实例模型+复原者身份审计/MVP 节奏）；§2 复刻意义扩为双重、F3 补同题共答与身份审计、§9 补复原度得分与缺陷密度、§10 基准 MVP 前置、Q31 登记；方法论操作沉淀 doclib/40-guides/benchmark.md（用户要求：防止遗忘，供后续 agent 查阅）；ADR #7。状态变化：#17（文档治理全周期+双层图书馆）#18（复原基准测试）登记 planned；清偿上轮 check 漏更与无归属（overview.md 补笔 + covers 挂引导/门面文件）；Q31 待拍板后启动 MVP
   - **2026-10-19** · 归位宪法与骨架编号规范立项（用户两点输入：所有文档有唯一归宿、万级文档可导航，规划载体：本对话）：PRD v0.20——§7.5 归位宪法（决策树七分支/馆外白名单封闭枚举/"馆内是默认，馆外是例外，例外必须显式"）、三级索引体系（INDEX→卷 _index→分册 _index，落位即登记）、卷内分区与三层硬上限、编号体系（条目 ID 永久退役）、命名规范；F13 孤儿条款升格归位执法；F1/F2/F4 联动；引导模板 full/light 加落位映射行并 sync 再生；README 补宪法句；ADR #8。状态变化：#17 描述扩充（v0.17–v0.20，Q20–Q34）；Q32–Q34 待拍板
   - **2026-10-19** · 盲区吸收三方向立项（研究模式枚举 75 项文档/资产问题全景 → INNOVATE 三方向方案获批，规划载体：本对话）：PRD v0.21——①登记簿五族升级**开放册制**（册即类型、准入三标准、扩展册候选两批、版本化条目、F14 实证排期，Q35）；②check 补**文档质量检测**（链接/路径引用存在性+依赖版本对账）与**入馆写协调** soft 约定（Q36）；③F5 补**无账不答纪律**（反幻觉）与引导三层分流（Q37）；§5 非目标补多环境真实漂移检测；引导模板 full/light 注入两纪律并 sync 再生；README 开放册制描述；ADR #9。状态变化：#17 扩充（v0.17–v0.21，Q20–Q37）；Q35–Q37 待拍板
   - **2026-10-19** · 移除规程与工具集成立项（用户三场景：移除不彻底残留/引导写入维护最佳实践/大 repo 效率；context7 调研 Claude Code 官方 CLAUDE.md 最佳实践 + gh 实测工具选型，规划载体：本对话）：PRD v0.22——F2 六步移除规程（影响面预查→残留扫描→执行移除→馆内联动 removed+墓碑→check 执法→留痕）；F5 四纪律（引导裁剪判据"删掉会犯错吗"/硬预算 Q38/**记忆以馆为准** Q39/单点强调——官方背书）；**F15 扫描器与工具集成**（阶段 0 纯 agent→1 ast-grep 16.3k★ 可选增强不进 npm 依赖→2 codegraph 74.4k★ MIT 实验外挂，F14 三指标实测裁决 Q40；三铁律：馆为事实源工具出候选/确定性语义分层/可选增强优雅降级）；引导模板加移除行与两纪律并 sync 再生；ADR #10。状态变化：#19 登记 planned；#17 指针扩充（v0.17–v0.22，Q20–Q40）；Q28 更新（ast-grep 主选已定）、Q38–Q40 待拍板
   - **2026-10-19** · Q20–Q39 批量拍板与结构归位（提问工具四批拍板 + Q31 候选两轮调研，规划载体：本对话）：PRD v0.23——21 项开放问题全部落定（含多项非推荐裁决：登记簿分散挂靠各卷 Q25/治理分精细分制 Q22/扫描器全主流语言 Q28/强制三位序号 Q33/写协调乐观锁一步到位 Q36/PRD·DESIGN 迁馆 Q32）；**首个基准项目 colinhacks/zod**（Q31，用户否定小型候选后中型档三选一）；实体操作：`doclib/50-reference`→`90-reference` 归位重编号、`docs/PRD.md`·`docs/DESIGN.md`→`doclib/10-architecture/prd.md`·`design.md` 迁入馆（docs/ 目录消失，馆外白名单自动满足）+ frontmatter 补建 + 全库当前指针更新（README/AGENTS·CLAUDE custom/overview/project/feature-map/benchmark covers/skills 源 90-reference 修正）；引导模板挂靠语义行更新；ADR #11。状态变化：Q20–Q39 全绿、Q40 留 F14 实测；F14 MVP 解锁（zod 建馆待启动）；docs/PRD.md → doclib/10-architecture/prd.md（本条即新路径首次留痕）
   - **2026-10-19** · 强验证完成包实现（锚点二，规划见 `.plan/2026-10-19/check-governance-pack.md`）：PRD v0.23 差距研究 → 第一梯队四项落地——①孤儿检测 `src/core/orphan.ts`（第七分类+Q20 豁免清单+工具链目录 .claude/.opencode/.cursor 修正）；②治理健康分（Q22 五分项加权 40/20/20/10/10 + 等级 ABCDF，check 末行与 status 治理行）；③乐观锁 revision（Q36：state 归一化新字段，snapshot 递增，check/status/plan 输出）；④引导硬预算（Q37/38：GUIDE_BUDGET_LINES=150，guideBudgetReport，status 只显示不阻断）；版本 0.3.0。状态变化：#20 planned → implemented；测试 42/42；冒烟五项全过（孤儿检出/ack 豁免/治理分公式/revision 递增/预算显示）
   - **2026-10-19** · CLI 地基与 Skills 补全（锚点二，规划见 `.plan/2026-10-19/skills-cli-completion.md`；用户纠正开发顺序：先补全工具后做 F14 基准实验）：PRD v0.25——F8（BOOTSTRAP/RESUME 任务书+互斥校验）、F9（state.planning 载体声明+init --planning+自定义载体不进快照六处 collectFiles+双锚点提醒 status/plan 输出）、F11（doclib reconcile 三段报告+implemented 进度不符判定：covers 漂移且文档未同步）；skills 10/10 建齐（dev/bootstrap/resume/setup/reconcile/audit/accept）；version 命令硬编码修复（→CLI_VERSION）；执行中偏差修复：已声明载体文件被孤儿误检——check.ts core 孤儿过滤加载体路径豁免（F9 双轨边界的机器面落实）；版本 0.4.0。状态变化：#6/#8/#9/#10 → implemented；测试 52/52
   - **2026-10-19** · npm 发布工程就绪（锚点二，规划见 `.plan/2026-10-19/npm-release.md`；五项拍板由用户授权按可持续视角代定）：PRD v0.26——发布通道=Actions tag 触发（release.yml：npm ci→test→publish --provenance，id-token OIDC）；license=MIT（LICENSE 落盘）；clean build（dist 先清，消灭 v0.1 孤儿残留 dist/templates/library.js）；包元数据（repository/homepage/bugs/keywords/prepublishOnly 门禁/files 移除 AGENTS.md）；F9 交互尾巴 askPlanning；**冷包验收通过**（npm pack→全新目录 tgz 安装→init/plan/snapshot/status 全流程，F10 验收达成）；发布流程入 70-deploy（tag 流程/用户前置 U1-U3/回滚 dist-tag forward-only）。状态变化：#7 planned → in-progress（npm 发布就绪、setup 独立命令未做）；发版动作待用户 npm login/2FA/NPM_TOKEN 后 git tag v0.4.0
   - **2026-10-19** · **npm 首发成功**（用户侧三轮凭证/环境配合）：@panxiangyu1995/doclib@0.4.0 上架（latest）。排障链：①provenance 要求 --access public；②EOTP（2FA 拦截）→用户放宽 2FA 策略；③E_STAGE_REQUIRED（stage-only token）→换 publish-and-stage token；④E422 provenance 要求 public repo→用户转 public；⑤**E403 名称相似度保护**（doc-lib 死占位包 2022 起）→scoped 改名 @panxiangyu1995/doclib（bin 命令名不变）；⑥新包首发强制 staging（0.0.0-stage）→maintainer 转正。验证：registry latest=0.4.0、冷装 0 vulnerabilities、npx doclib init 全流程 ✓。状态变化：#7 → **implemented**（F10 核心承诺达成）；待办：trusted publishing 切换（2027-01 direct 弃用前，零凭证形态）
