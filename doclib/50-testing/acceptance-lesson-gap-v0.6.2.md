---
title: 教训账缺口不变量真实仓库验收（v0.6.2）
covers:
  - src/core/archival.ts
  - test/csvkit/doclib/00-overview/progress.md
  - test/memos/doclib/00-overview/progress.md
type: ledger
status: stable
---

# 教训账缺口不变量 · test/ 基准克隆仓验收（v0.6.2）

> 按真实仓库验收先例（acceptance-place / acceptance-graph / hook 真实仓库验收），在五基准仓验证 lesson-gap 不变量与既有行为的兼容性、噪声隔离性与退化形态解析。

## 验收矩阵与结论

| # | 场景 | 仓库 | 结果 |
| --- | --- | --- | --- |
| T1 | 旧库零破坏：无 lesson-epoch 标记 → 不变量不活跃 | 五仓全测 | ✓ 全部 0 教训账缺口、零崩溃（memos 101 项/umami 91 项/fd·aspnetcore 23 项/csvkit 2 项预存违规与既有记录吻合，互不干扰） |
| T2 | 执法链路：标记+无处置位条目 → strict exit 1 → 坏引用 → 引用无命中 → 修正+补条目 → 缺口清零（strict exit 1 仅因预存违规，正确隔离） | csvkit | ✓ 全链路 |
| T3 | 退化形态：两条目同行（`   - **date**` 连写）→ 各自独立检出（2 项非 1 项） | csvkit | ✓ 分段解析在真实退化数据上成立 |
| T4 | 噪声隔离：101 项既有违规环境下注入 1 条无处置位条目 → 总违规 101→102，教训账缺口恰好 (1) 且 path 精准指向注入项 | memos | ✓ 零误报零漏报 |
| T5 | 清理还原：进度/lessons 备份还原后缺口归零；git 变更均为既未提交的建馆产物（非本次污染） | csvkit/memos | ✓ |

## 发现与留档

- **F-1（基准馆格式漂移观察，非 doclib 缺陷）**：csvkit 馆 lessons.md 条目头为 `## L1/L2/L3 · 标题`（非 `## YYYY-MM-DD ·` 日期约定）——跨馆/本馆引用按日期+前缀核对时无法命中，解析器行为正确（宁缺勿错）；该馆教训格式若需可引用化，属基准馆整改提案（记录于此，不在本验收范围）。
- **F-2（验收脚本纪律）**：探针链 `base=$(… | grep -c …)` 零匹配时 grep 返回码 1 会静默断开 `&&` 链，导致后续追加未执行且 strict exit=1 被误读为预期——验收脚本链式调用须显式处理命令返回码（教训入档 95-lessons 2026-10-26）。
- hook 全链路（commit 阻断）未在本轮克隆仓复测：五仓均有预存 strict 违规（2~101 项），钩子恒阻断无法隔离 lesson-gap 效果；该链路由单元/e2e（cli.e2e 全生命周期）与本仓 dogfooding 覆盖。

## 覆盖说明

结构性判定（处置位缺失/引用存在性/epoch fail-fast/存量豁免）由 `core/archival.test.ts` 15 例锁定；本验收补真实仓库存量兼容（T1）、退化数据（T3）与高噪声环境（T4）三个单测不可覆盖的维度。
