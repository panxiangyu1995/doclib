---
title: doclib branch 分支账与主分馆管理规格
covers:
  - src/commands/branch.ts
  - src/core/branch.ts
  - src/core/gitinfo.ts
  - src/core/state.ts
  - src/commands/snapshot.ts
  - src/commands/status.ts
  - src/commands/diff.ts
  - src/core/check.ts
  - src/core/branch.test.ts
  - src/core/gitinfo.test.ts
  - src/commands/branch.test.ts
status: living
---

# doclib branch · 分支账与主分馆管理规格

> DocLib 仍不替代版本管理（git）——本功能为该边界条款的定向扩展：git 继续管代码版本历史，DocLib 新增「分支感知层」，让图书馆知道自己站在哪条分支上、分馆与主馆差在哪里。

## 为什么

图书馆的漂移比对是纯工作区 hash 对比，对 git 分支零感知。两种场景因此失真：馆入 git 的项目（主馆场景），分支各自演化图书馆后 merge，簿记机器文件（state.json 的 revision 与快照链）结构性冲突，且无「分馆引入了什么」的语义视图；馆入 gitignore 的项目（单馆场景），切分支后馆不动，基线 hash 与新分支代码全面失配，diff 产生全量假漂移，且无从判定基线来自哪条分支。收编 feature-map #13（git 感知基线）与 #14（多图书馆管理）的既有坑位。

## 是什么

三层构成。其一是馆内专篇分支账 `doclib/00-overview/branches.md`：每条 git 分支一行六列（分支/创建日期/目的/状态/差异摘要/关联），状态机 active → merged | abandoned，merged 条目永久保留（降级保史）；账本型文档，豁免文体卡片化执法。其二是 CLI 命令族 `doclib branch`：list（账实对照）、register（登记分馆）、diff（分馆对主馆的合并审计报告）。其三是基线归属感知：快照可选字段 `git {branch, commit}` 由 snapshot 在 git 仓库内自动填充，status/diff 显示归属并在当前分支与基线分支不一致时给软提示。check 新增两条软提示 notice：branch-unregistered（当前分支未登记）与 branch-ledger-incomplete（账内非法行或要素缺失）。

## 怎么运转

命令语义与验收标准如下。合并动作本身始终交给 git：branch diff 只输出结构化审计（馆内文件三类差异、revision 双值与接力提示、快照撞号清单），不做任何自动合并或改账。撞号指两侧快照同号不同内容（各自演化的 at 不同），处置建议是合并后重新 snapshot 固化，不由 CLI 自动重排。

## AC

- AC-1 Given git 仓库内有本地分支 feat-x，When `doclib branch register feat-x --note <目的>`，Then 分支账文件以骨架+表格行落盘、条目状态 active、输出确认与后续纪律提示。
- AC-2 Given feat-x 已登记 active，When 再次 register 同名，Then DoclibError 拒绝重复；register 未知分支名、缺 --note、分支名或目的含竖线/换行同样拒绝（分支账为 Markdown 表格，写入侧防列错位——95-lessons 2026-10-28 同源防线）。
- AC-3 Given 分支账文件不存在，When `doclib branch list`，Then 输出未建立提示与主分支登记指引。
- AC-4 Given 分支账已建，When list，Then 逐条列出账目并对照 git 本地分支：未登记分支、账内 active 但 git 已不存在的幽灵条目、非法状态行分别提示；全部一致时输出账实一致。
- AC-5 Given 当前在分馆且相对主分支有馆内改动，When `doclib branch diff [主分支]`，Then 输出相对 merge-base 的馆内增删改清单、revision 双值与接力提示、快照撞号清单；主分支缺省自动探测 main/master，无法探测时报错要求显式指定；显式 base 以 `-` 开头时 DoclibError 拒绝（防 git argument injection）。
- AC-6 Given 分馆与主馆无馆内差异且无撞号，When branch diff，Then 输出无图书馆冲突面与合并后 check 建议。
- AC-7 Given git 仓库，When `doclib snapshot`，Then 快照落库可选字段 git（branch 与完整 commit hash）。
- AC-8 Given 非 git 目录，When snapshot/status/branch list/branch register，Then 全链路优雅降级：快照无 git 字段、status 无归属显示、list 对照为空、register 跳过存在性校验仍可登记。
- AC-9 Given 基线含 git 字段，When `doclib status`，Then 基线行显示（来自分支 X @ 短hash）；当前分支与基线分支不一致时追加跨分支漂移警告与重基线建议。
- AC-10 Given 基线含 git 字段，When `doclib diff`，Then 基线行同 AC-9 语义显示归属与跨分支警告。
- AC-11 Given 当前在非主分支，When `doclib check`，Then 未建账或未登记时出 branch-unregistered notice、账内存在非法行或要素缺失时出 branch-ledger-incomplete notice；主分支与非 git 目录零分支 notice；两类 notice 均为软提示，不入 strict 门禁违规。
- AC-12 Given 分支账任意条目，When 合并回主馆后，Then 条目翻 merged 保留不删；progress 分馆条目带 `[branch:分支名]` 行内标注，无标注视为主分支（存量兼容）。
- AC-13 Given 临时夹具仓以 `git init` 创建，When 分支账测试夹具建仓，Then 初始分支名显式 `-b main` 钉死（环境默认值不可依赖——本机 init.defaultBranch 与 CI runner 默认可能不同；2026-10-28 CI 首跑实证，夹具修复 + 95-lessons 入档）。
