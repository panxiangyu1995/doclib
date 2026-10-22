---
name: doclib-update
description: 在源项目代码变更后，增量更新 DocLib 文档图书馆。当存在基于旧基线的 UPDATE 任务书（.doclib/tasks/UPDATE-*.md）需要执行时使用。核心原则：最小扰动——只改受影响章节，保持图书馆结构与编号跨版本稳定。
---

# doclib-update · 图书馆增量更新

## 使命

让图书馆始终反映源项目的现状：代码每前进一步，图书馆同步一步，永不重写全馆。无论图书馆落后一个版本还是落后十个版本，流程完全相同——CLI 的 diff 已把"落后多少"算清楚了。

## 何时使用

- 源项目代码发生变更后，`doclib plan` 生成了 UPDATE 任务书

## 工作流

1. **读任务书**：打开最新 UPDATE-*.md。它列出了三类变更：
   - 新增路径 → 需要新文档或并入既有文档
   - 修改路径 → 需要更新哪些既有文档（按 covers 映射）
   - 删除路径 → retire 候选
2. **逐项处理**：
   - 新增路径 → 判断粒度：新功能 → 新增 30-features 规格并在 feature-map 登记；新模块 → 新增 20-modules 卷；局部变化 → 并入既有文档并更新其 covers
   - 修改路径 → 只重写受影响的小节。先读原文档，保持其结构、术语、编号风格
   - 删除路径 → 对应章节标注 status: retired 并保留一句废弃原因；从 INDEX 与 feature-map 摘除或标注；**不要留下无主的正文**
   - 过时内容 → **降级保史，不物理删除**：登记簿条目走状态机（deprecated/removed）；叙述性文档移入 `doclib/99-archive/` 并写墓碑五要素（何时失效 / 为何失效 / 取代者指针 / 原路径 / 归档方式），原路径留指针防断链；馆外散落文档的归档用 `doclib place archive <路径> --reason "<为何过时>" --apply`（干跑预览 + `--apply` 执行 + `place restore` 可还原）
3. **联动更新**：feature-map、INDEX.md、10-architecture 的总览/数据模型/数据流、40-guides/rebuild-plan.md 若受影响必须同步——复原路线图变了，复原者就会走错路
4. **covers 纪律**：每次改动后核对 frontmatter covers 与实际代码路径一致；新文档必填 covers
5. **自检**：运行 `doclib verify`，确认无失效文档、新增代码均有归属
6. **收尾**：运行 `doclib snapshot --note "update: <本次主题>"` 固化新基线

## 原则

- **最小扰动**：未出现在任务书里的文档一律不动
- **结构稳定**：目录编号、命名风格、章节骨架跨版本保持一致——复原者依赖这种稳定性
- **版本意识**：任务书基于某个基线快照。若工作期间代码又变了，提示用户重新 `doclib plan`，不要凭印象混合多个状态的变更
- **历史可追**：重大改写在文档内用一句话标注变更背景（如 "v3: 认证从 session 改为 JWT"），不必写长篇 changelog
