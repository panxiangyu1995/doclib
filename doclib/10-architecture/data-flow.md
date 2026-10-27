---
title: 关键数据流
covers:
  - src/commands/init.ts
  - src/commands/diff.ts
  - src/commands/plan.ts
status: stable
---

# 关键数据流

> DocLib 的生命线是保活循环：init 落位定起点、三层保活维持新鲜、复原回路校准完备度——三条流覆盖从建馆到复原的全生命周期。

## 为什么

图书馆的失效模式是"生成即腐烂"：没有确定性的落位流，起点即失序；没有三层保活，文档先于代码腐烂；没有复原回路，完备度无法自证——三条流分别封死这三个失效口。

## 是什么

流 1 = init 落位（骨架 + 引导 + 声明一次到位）；流 2 = 保活三层（实时层/流程层/兜底层）；流 3 = 复原回路（REBUILD 任务书 → 隔离复原 → 副本校准）。

## 怎么运转

### 流 1 · init 落位（当前实现）

> v0.26：init 交互链新增 askPlanning（载体确认，回车=.plan/）；声明结果写入 state.planning，供快照忽略与载体提醒消费。

1. 解析选项：agents = `--agents` > TTY 问卷 > 非交互默认 generic；guide = `--guide` > TTY 问卷 > 默认 light
2. 写 22 个图书馆模板（doclib/）；建 .doclib/tasks/
3. 按 AGENT_TARGETS 复制 skills（copyDir，覆盖式）
4. writeGuides(light)：有戳→更新；无戳→跳过并提示；不存在→写入
5. loadState → 写入 agents/structureVersion → saveState（保留既有快照链）

### 流 2 · 保活三层

- 实时层：开发中按 `10-architecture/overview.md` 的实时同步映射表当场入馆（agent 行为，CLI 不参与）
- 流程层：.plan 双锚点（登记 planned / 归档 implemented）
- 兜底层：`check` 强验证（双账本对账，--strict 可挂 pre-commit/CI 门禁）→ `diff`（hashAll vs 最新快照 → drift → covers 映射受影响文档）→ `plan` 生成 UPDATE 任务书 → agent 执行 → `verify` → `snapshot`。任务书与 plan stdout 均含 revision（乐观锁比对锚，Q36）

### 流 3 · 复原（已规划，REBUILD 任务书已可生成）

plan --rebuild → agent 信息隔离复原 → 副本校准 + 引导落位（阶段 4/5 完善）
