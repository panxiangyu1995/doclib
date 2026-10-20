---
title: doclib check 强验证规格
covers:
  - src/commands/check.ts
  - src/core/check.ts
  - src/core/ledger.ts
  - src/core/orphan.ts
  - src/core/docquality.ts
  - src/core/state.ts
  - src/commands/ack.ts
  - src/commands/hook.ts
status: stable
---

# doclib check · 强验证规格

## 目的

把"文档实时更新"与"馆外归位"变为机器可判定：快照 v3 双账本（代码账 files + 文档账 docs）确定性对账，违规项在提交前暴露；治理健康分使治理改善可感知；乐观锁 revision 使并发写馆的静默覆盖不可能。

## 行为

`doclib check [--strict] [--json]`——无 AI、无网络、可复现。九分类：

| 分类 | 判定 | 违规 |
| --- | --- | --- |
| 已对账 | 漂移路径 covers 命中文档 hash 已变 | 否 |
| 漏更 | 命中但全未变（列出覆盖文档） | 是 |
| 无归属 | 无 covers 命中 | 是 |
| 文档先行 | 只改文档 | 否 |
| 已豁免 | ack 命中（once 绑定基线 / standing 长期） | 否 |
| 迁移违规 | migrations/ 脚本未登记、编号重复、断号、账本指向不存在、命名不符 | 是 |
| 引导过期 | 引导 managed 区落后模板 | 提示 sync |
| 孤儿文档 | 馆外知识型 .md 未收编且未豁免（豁免：根 README/CHANGELOG/CONTRIBUTING + .github/.claude/.opencode/.cursor/ 工具链目录） | 是（strict 计入门禁；默认 soft 报告语义） |
| 文档质量 | 馆内相对 .md 链接失效（外链/锚点/根绝对路径跳过；INDEX.md 自身跳过，与 verify 同源扫描 `core/docquality.ts`） | 是（strict 计入门禁） |

- `--strict`：存在违规 → 退出码 1（可挂 pre-commit/CI）
- 旧基线无文档账：降级（仅无归属/迁移/引导检查）并提示重建基线
- once-ack 在下次 snapshot 自动清除；standing 用 `ack --remove` 移除
- 输出头含 `revision: N`——入馆写前记录、写后比对，已变即重新对账（乐观锁）

## 治理健康分

`check` 末行与 `status` 输出 `治理: NN/100 (X)`：

| 分项 | 计分 | 权重 |
| --- | --- | --- |
| 对账完整性 | 无漂移满分；否则 1−（漏更+无归属）/漂移总数 | 40% |
| 迁移纪律 | 每项违规扣 0.2 | 20% |
| 归位卫生 | 每个孤儿扣 0.1 | 20% |
| 引导新鲜度 | 每项过期扣 0.5 | 10% |
| 文档质量 | 馆内相对链接失效每项扣 0.1 | 10% |

- 等级：A ≥90 / B ≥75 / C ≥60 / D ≥40 / F <40；check 附分项明细百分比
- 权重可由 F14 基准实验数据校准（ADR #11）

## 乐观锁 revision

- state 增 `revision` 字段（旧 state 归一化 0）；每次 snapshot 递增
- `check`/`status`/`plan` 均输出 revision——agent 入馆写前记录，写后 check 比对，已变即重新对账；不做写队列/文件锁

## 引导硬预算

- `status` 输出"引导预算: CLAUDE.md N/150 行 · AGENTS.md N/150 行"（managed 区行数）
- ≤150 行（`GUIDE_BUDGET_LINES`）；超限提示瘦身（裁剪判据：删掉会犯错吗）——只显示不阻断

## 配套

- `doclib ack <路径> [--note] [--standing] [--remove]`
- `doclib hook install [--strict] / remove / --ci github`（钩子带 `# doclib-hook` 标记；非标记既有钩子拒改）

## 验收标准

- Given 改代码不改文档 When check Then 报漏更并列出覆盖文档；--strict 退出码 1
- Given 代码与覆盖文档同改 When check Then 已对账计数 +1，无违规
- Given 新增路径无 covers When check Then 无归属；standing ack 后转为已豁免
- Given migrations/ 有脚本未登记 When check Then 迁移违规含"未在账本登记"
- Given v1 旧快照（无 docs 字段）When check Then 降级警告且不崩
- Given hook install --strict When 查看钩子 Then 含标记与 --strict 且可执行；remove 后不存在
- Given 馆外散落 .md When check Then 孤儿文档检出；standing ack 后转为已豁免；根 README 与 .claude/ 等工具链路径不检出
- Given 馆内文档含失效相对链接 When check Then 文档质量检出（path=所在文档）且质量分项 0.9、总分下降；--strict 退出码 1
- Given 全绿基线 When check Then 治理 100/100 (A)；产生漏更后对账分项归零、总分下降、等级按阈值变化
- Given snapshot 执行 When 查看 revision Then 递增 1；check/status/plan 输出该值
- Given managed 区超 150 行 When status Then 引导预算显示实际行数与超限提示
