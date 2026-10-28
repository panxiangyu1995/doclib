---
title: 功能规格索引
covers:
  - src/commands/
status: stable
---

# 功能规格索引

| 功能 | 规格文档 | covers | 状态 |
| --- | --- | --- | --- |
| init v2（骨架落位 + agents/skills/引导安装 + 门禁自动装 v0.5.1 + 载体检测建议 v0.6.1） | [init-v2.md](init-v2.md) | src/commands/init.ts 等 | implemented |
| plan（BUILD/UPDATE/REBUILD 工单） | 待写 | src/commands/plan.ts | implemented（规格欠账） |
| diff（漂移 + 受影响文档映射） | 待写 | src/commands/diff.ts | implemented（规格欠账） |
| snapshot（基线记录） | 待写 | src/commands/snapshot.ts | implemented（规格欠账） |
| status（概览） | 待写 | src/commands/status.ts | implemented（规格欠账） |
| verify（覆盖度/引导检查） | 待写 | src/commands/verify.ts | implemented（规格欠账） |
| 引导文件体系（三区契约 + 图书馆反哺 + 版本戳） | [guides.md](guides.md) | assets/guides/、src/core/guides.ts、src/commands/sync.ts | implemented（v0.6.0 三区 + 反哺；full 档退役） |
| doclib sync（引导/skills 可重入同步） | [guides.md](guides.md) | src/commands/sync.ts | implemented（v0.5.1 增门禁幂等补装；v0.6.0 反哺注入） |
| doclib check（强验证对账 + 归档闭环四不变量 v0.6.2） | [check.md](check.md) | src/commands/check.ts、src/core/check.ts、src/core/ledger.ts、src/core/archival.ts | implemented |
| doclib place（孤儿归位与处置闭环 + 载体形态识别建议 v0.6.1） | [place.md](place.md) | src/commands/place.ts、src/core/place.ts、src/core/orphan.ts | implemented |
| doclib graph（代码知识图谱加速器，F15 阶段 2） | [graph.md](graph.md) | src/commands/graph.ts、src/core/codegraph/、vendor/codegraph/ | implemented |
| doclib ack（路径豁免） | 待写 | src/commands/ack.ts | implemented（规格欠账；--dir 目录豁免登记时校验目录存在） |
| doclib hook（提交门禁） | [hook.md](hook.md) | src/commands/hook.ts、src/commands/status.ts | implemented（v0.5.1 补规格 + 健壮化 + init 自动装/sync 幂等补装） |
| BOOTSTRAP/RESUME 工单 | 待写 | — | planned |
| .plan 检测与双锚点提醒 | 待写 | — | planned |
| 进度对账与 reconcile | [reconcile.md](reconcile.md) | src/commands/reconcile.ts、src/core/reconcile.ts | implemented（v0.34 补规格欠账 + 判定修正） |
| 分支账与主分馆管理（F20，含 #13 git 感知基线收编） | [branch.md](branch.md) | src/commands/branch.ts、src/core/branch.ts、src/core/gitinfo.ts | implemented（v0.10.0） |
| F17 规划直通车（bootstrap v2 对话协议 + 工具兼容层 + implement 拆单 + 门禁三件套 + provenance 提醒） | [040-planning-express.md](040-planning-express.md) | src/commands/implement.ts、src/core/implement.ts、src/core/planning.ts、src/core/docquality.ts、src/core/archival.ts、skills/doclib-bootstrap/SKILL.md、skills/doclib-implement/SKILL.md | implemented（v0.7.0） |
| F19 长程开发闭环（test-chain 馆内声明 + hook 烘焙执法 + 清单状态失真三类判定 + doclib-dev 双情形六步回路 + sync 反哺链块） | [050-harness.md](050-harness.md) | src/core/harness.ts、src/commands/hook.ts、src/core/check.ts、src/commands/check.ts、src/core/guides.ts、assets/guides/light.md、skills/doclib-dev/SKILL.md、skills/doclib-rebuild/SKILL.md、.opencode/commands/intest.md | implemented（v0.9.0） |
