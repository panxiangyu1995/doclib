---
name: doclib-reconcile
description: 进度对账与重建。当 doclib reconcile 报告显示漂移未登记、进度与代码不符、或进度账疑似失真需要逐项确认补录时使用。即使 .plan/ 全部遗漏、进度账彻底失真，代码 hash 与 covers 映射本身就是底层账本。
---

# doclib-reconcile · 进度对账重建

## 使命

让进度永不真正丢失：把"代码漂移"与"进度账"对齐——逐项确认后补录 feature-map 与 progress.md，恢复"状态事实源"的可信度。

## 何时使用

- `doclib reconcile` 报告三段（疑似完成/进度不符/待推进）有内容时
- 载体提醒长期未清、或怀疑上次会话遗漏归档时
- 接手他人项目、进度账不可信时

## 工作流

1. 运行 `doclib reconcile` 读三段报告
2. **逐项确认疑似完成**（不要臆断）：
   - 对每个"漂移路径 → 覆盖文档"对：读代码与文档，判断该变更是否已完成开发
   - 已完成 → feature-map 补录/推进 implemented + progress.md 补记（关联漂移路径）
   - 未完成 → feature-map 登记 planned/in-progress（这是进行中的开发）
   - 非开发变更（格式化/生成物）→ `doclib ack` 登记
3. **进度不符项**：implemented 条目对应文档缺失或覆盖路径漂移且文档未同步 → 补文档或修正状态（该功能可能已被回退）
4. **待推进清单**：按优先级整理 planned/in-progress，作为下轮开发输入（转 doclib-dev）
5. **收尾**：`doclib check` 清零 → `doclib snapshot --note "reconcile: ledger rebuilt"`

## 纪律

- 逐项确认，禁止批量臆断状态（状态只认 feature-map，确认才写入）
- 补录时 progress.md 每条引用 feature-map 条目；时间线只叙述不另立状态
- 重建完成后跑 `doclib check` 确认对账干净
