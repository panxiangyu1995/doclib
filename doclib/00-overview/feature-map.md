---
title: 功能进度总账
covers:
  - src/
  - skills/
  - docs/
status: living
---

# 功能进度总账（feature-map）

> 全馆之锚与进度事实源。状态只认本表：`planned / in-progress / implemented / retired`。时间线视图见 [progress.md](progress.md)。

| # | 功能 | 一句话描述 | 对应文档 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | CLI 基础命令集 | init/plan/diff/snapshot/status/verify 六命令与核心纯逻辑 | 20-modules/（骨架） | implemented |
| 2 | 三核心 skills | build/update/rebuild 操作手册 | skills/ | implemented |
| 3 | 需求与架构文档体系 | PRD v0.13 + DESIGN v2 | docs/ | implemented |
| 4 | 图书馆启用（dogfooding） | 本仓库 12 卷图书馆 + 引导文件 + 进度账 | doclib/ | implemented |
| 5 | 12 卷基线模板 | assets/templates/library 12 卷 + 99-archive 骨架 + copy-assets 构建链 | .plan/2026-10-17/phase1-skeleton-v2.md | implemented |
| 6 | 十 skill 体系 | +setup/bootstrap/resume/dev/reconcile/audit/accept | skills/ | implemented |
| 7 | npx 发布与 agent 适配 | **已发布 @panxiangyu1995/doclib@0.4.0**（scoped 改名：npm 名称相似度保护；public repo+provenance；staging 首发转正）+ init 交互问卷含载体；setup 独立命令未做（init/sync 已覆盖） | .plan/2026-10-19/npm-release.md + 70-deploy/deploy.md | implemented |
| 8 | BOOTSTRAP/RESUME 任务书 | plan --bootstrap/--resume 两种任务书类型（互斥校验） | .plan/2026-10-19/skills-cli-completion.md | implemented |
| 9 | 规划载体声明与双锚点提醒 | state.planning 声明（init --planning 多路径）+ 自定义载体不进快照 + 待登记/待归档提醒 | .plan/2026-10-19/skills-cli-completion.md | implemented |
| 10 | 进度对账与 reconcile | doclib reconcile 三段报告（疑似完成/进度不符/待推进）+ core/reconcile.ts | .plan/2026-10-19/skills-cli-completion.md | implemented |
| 11 | 引导文件模板与版本戳 | light/full 两档 + 区域契约（managed/custom）+ 版本戳检测 + 任务书收尾检查 | .plan/2026-10-19/guides-sync.md | implemented |
| 12 | 类别完备性检查 | verify 对照 12 卷基线报告缺失类别 | 30-features/（待写） | planned |
| 13 | git 感知基线 | 以 commit 为锚点的快照 | — | planned |
| 14 | watch 模式与多图书馆 | 文件监听自动提醒；多馆管理 | — | planned |
| 15 | doclib sync 引导同步命令 | 规则区再生/定制区保留/幂等/legacy 再生提示 | .plan/2026-10-19/guides-sync.md | implemented |
| 16 | 强验证体系 | doclib check 双账本对账（漏更/无归属/迁移/引导过期）+ ack 豁免 + strict 门禁 + pre-commit hook | .plan/2026-10-19/strong-validation.md | implemented |
| 17 | 文档治理全周期 + 双层图书馆 | 冷启动资产盘点/init 即 snapshot/规划载体适配（不输出工作流只回收知识）/存量迁移收编/孤儿文档检测/治理健康分/登记簿开放册制+99-archive 墓碑归档/归位宪法与三级索引编号体系/check 文档质量检测/无账不答与写协调纪律 | doclib/10-architecture/prd.md（v0.17–v0.23，Q20–Q40） | planned |
| 18 | 复原基准测试体系 | 基准库准入 + 同题共答双跑 + 缺陷四分类 + 复原档案 + 污染防护（不同模型/实例）+ 回归重跑 | doclib/10-architecture/prd.md（F14）+ 40-guides/benchmark.md | planned |
| 19 | 移除规程与扫描器集成 | 六步移除规程（影响面预查→残留扫描→馆内联动→check 执法→留痕）+ F15 分阶段工具集成（ast-grep 主选/codegraph 实验/三铁律）+ 引导四纪律（裁剪判据/硬预算/记忆以馆为准/单点强调） | doclib/10-architecture/prd.md（F2/F15）+ ADR #10 | planned |
| 20 | 强验证完成包 | 孤儿检测（第七分类+Q20 豁免清单）+ 治理健康分（Q22 五分项加权+等级）+ 乐观锁 revision（Q36）+ 引导硬预算（Q37/38 ≤150 行） | .plan/2026-10-19/check-governance-pack.md + 30-features/check.md | implemented |
| 21 | 质量符合性修复包 | CI 包名事实源（PACKAGE_NAME 读 package.json）/status --json 完整载荷/plan stdout 输出 revision/check 文档质量分类（馆内断链检出，quality 分项 0.1/项扣减）/verify 两级索引核对（卷 _index 双向+缺卷 soft）/state.json 损坏防护（.corrupt 备份+fail-fast） | .plan/2026-10-20/quality-conformance-pack.md + 30-features/check.md | implemented |
