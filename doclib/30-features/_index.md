---
title: 功能规格索引
covers:
  - src/commands/
status: stable
---

# 功能规格索引

| 功能 | 规格文档 | covers | 状态 |
| --- | --- | --- | --- |
| init v2（骨架落位 + agents/skills/引导安装） | [init-v2.md](init-v2.md) | src/commands/init.ts 等 | implemented |
| plan（BUILD/UPDATE/REBUILD 任务书） | 待写 | src/commands/plan.ts | implemented（规格欠账） |
| diff（漂移 + 受影响文档映射） | 待写 | src/commands/diff.ts | implemented（规格欠账） |
| snapshot（基线记录） | 待写 | src/commands/snapshot.ts | implemented（规格欠账） |
| status（概览） | 待写 | src/commands/status.ts | implemented（规格欠账） |
| verify（覆盖度/引导检查） | 待写 | src/commands/verify.ts | implemented（规格欠账） |
| 引导文件体系（light/full + 版本戳 + 区域契约） | 待写 | assets/guides/、src/core/guides.ts | implemented（规格欠账） |
| doclib sync（引导/skills 可重入同步） | 待写 | src/commands/sync.ts | implemented（规格欠账） |
| doclib check（强验证对账） | [check.md](check.md) | src/commands/check.ts、src/core/check.ts、src/core/ledger.ts | implemented |
| doclib place（孤儿归位与处置闭环） | [place.md](place.md) | src/commands/place.ts、src/core/place.ts、src/core/orphan.ts | implemented |
| doclib graph（代码知识图谱加速器，F15 阶段 2） | [graph.md](graph.md) | src/commands/graph.ts、src/core/codegraph/、vendor/codegraph/ | implemented |
| doclib ack（路径豁免） | 待写 | src/commands/ack.ts | implemented（规格欠账；--dir 目录豁免登记时校验目录存在） |
| doclib hook（提交门禁） | 待写 | src/commands/hook.ts | implemented（规格欠账） |
| BOOTSTRAP/RESUME 任务书 | 待写 | — | planned |
| .plan 检测与双锚点提醒 | 待写 | — | planned |
| 进度对账与 reconcile | [reconcile.md](reconcile.md) | src/commands/reconcile.ts、src/core/reconcile.ts | implemented（v0.34 补规格欠账 + 判定修正） |
