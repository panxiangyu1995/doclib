---
name: doclib-accept
description: 验收执行器。当功能完成、REBUILD 复原收尾、或需要按图书馆验收基准逐条验证时使用：逐条执行 30-features 的可执行验收标准（Given/When/Then），过程与结果留痕，功能总清单全绿判定。
---

# doclib-accept · 验收执行

## 使命

让验收可复现、可留痕：30-features 的验收标准是唯一验收依据——逐条执行、逐条留痕，全绿才算完成。

## 何时使用

- 某功能开发完成时（feature-map in-progress → implemented 前）
- REBUILD 复原收尾（F3 纯 agent 自检验收：90% 达成判定）
- 日常迭代的里程碑验收

## 工作流

1. **圈定范围**：从 feature-map 取目标条目（或全部 in-progress 条目），读对应 30-features 规格
2. **逐条执行验收标准**：
   - 每条 Given/When/Then：构造前置（Given）→ 执行动作（When）→ 断言结果（Then）
   - 留痕：功能名 / 验收条目 / 执行时间 / 结果（通过|失败+证据）/ 复现方式
3. **失败处置**：实现 bug → 转修复（doclib-dev）；规格歧义 → 回写规格（表述缺陷）；规格缺失 → 补规格再验收
4. **留痕文件**：验收结果写入 `doclib/50-testing/`（或 40-guides 指定位置）；REBUILD 场景写 REBUILD-LOG.md
5. **全绿判定**：目标条目全部验收通过 → feature-map 推 implemented；REBUILD 场景 = 90% 复原达成
6. **收尾**：`doclib check` → `doclib snapshot --note "accept: <范围>"`

## 纪律

- 验收标准是唯一依据：不达标就是失败，没有"差不多"
- 每条留痕可复现（他人能按复现方式重跑）
- 复原场景信息隔离不变：只凭图书馆验收，禁止回看源项目
