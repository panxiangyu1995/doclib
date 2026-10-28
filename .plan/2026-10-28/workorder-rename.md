---
type: plan
feature: 46
generated: 2026-10-28
---

# #46 工单改名（workorder）：「任务书」→「工单」+ 簿记目录更名

## 目的

消除概念歧义：五类 CLI 生成工单（BUILD/UPDATE/REBUILD/BOOTSTRAP/RESUME）原名「任务书」，与 .plan 规划文档（人写的方案）在用户认知中混淆——用户一度拍板「取消任务书并入 .plan」，澄清机制后确认为纯命名问题。机制零变更，只改概念名与簿记目录路径。

## 边界

- 机制不变：五工单类型、编号规则（BUILD-001 式）、revision 乐观锁、执法面、CLI/skills 衔接全部保持
- 簿记目录 `.doclib/tasks/` → `.doclib/workorders/`，一次性切换不读旧目录；status 增旧目录废弃提示行
- 历史档案不改（ADR #24 原文、95-lessons 历史条目、50-testing/acceptance-* 验收档案、98-sessions）
- 版本 0.10.0 → 0.11.0（CLI_VERSION 读 pkg.version）

## 引用锚点

- ADR #30（本变更决策依据）：`doclib/10-architecture/decisions.md`
- 命名歧义澄清对话（RESEARCH 轮）：本会话（RIPER-5 五模式完整走查）
- 并发取号：#45/ADR #29 已被 strict-contributions 占用（`40-guides/numbering.md` 先查账末后取号），本条目顺延 #46/ADR #30

## 方案设计

纯改名词面替换 + 目录路径常量更名 + status 废弃检测一行。详见 ADR #30 与实施记录。

## 实施清单

- [x] ADR #30 立账 → doclib/10-architecture/decisions.md
- [x] src/core/state.ts：TASKS_DIR → WORKORDERS_DIR（/workorders）
- [x] src/commands/plan.ts：五模板标题/正文自引用/stdout 文案/内部函数名/常量引用
- [x] src/commands/init.ts：mkdir 路径 + 2 处文案
- [x] src/commands/status.ts：读取路径 + 显示行「工单:」+ 旧目录废弃检测提示
- [x] src/commands/diff.ts：2 处文案
- [x] src/cli.ts：HELP 4 处
- [x] package.json → 0.11.0
- [x] 测试六件同步（plan/status/diff/init/snapshot/cli.e2e）+ status 旧目录提示用例
- [x] skills 六份 SKILL.md 更名与路径
- [x] assets/guides 引导源更名
- [x] README 中英双语更名
- [x] 馆内活文档联动（prd/design/data-flow + 30-features 三篇 + 50-testing 矩阵行）
- [x] AGENTS.md custom 区术语行
- [x] typecheck + test 全绿
- [x] 临时目录冒烟（init/plan/status/diff）
- [x] doclib sync 再生引导与 skills 分发
- [x] 馆内收尾（#46 implemented + progress 完工 + snapshot + check strict）
