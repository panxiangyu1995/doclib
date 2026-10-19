---
title: DocLib 自身的文档图书馆
covers: []
status: living
---

# DocLib 图书馆

本图书馆由 DocLib 管理.DocLib 项目自身——身先士卒的第一个真实用户。目标：DocLib 的全部开发（PRD 演进、命令实现、skill 编写）都通过本图书馆驱动与验收，检验"图书馆是否活的"。

## 怎么读

1. 总入口: [INDEX.md](INDEX.md)
2. 是什么 → `00-overview/`（含功能进度总账 feature-map 与进度时间线 progress.md）
3. 怎么设计的 → `10-architecture/` 与 [docs/DESIGN.md](../docs/DESIGN.md)
4. 需求事实源 → [docs/PRD.md](../docs/PRD.md)

## 目录结构（12 卷基线）

| 目录 | 内容 | 本项目状态 |
| --- | --- | --- |
| 00-overview/ | 定位、术语、功能总账、进度时间线 | 已启用 |
| 10-architecture/ | 架构、数据模型、依赖、ADR | 骨架（指向 docs/DESIGN.md） |
| 20-modules/ | 模块卷 | 骨架 |
| 30-features/ | 行为规格 + 验收标准 | 骨架 |
| 40-guides/ | 路线图、约定、工作流 | 骨架 |
| 50-testing/ | 测试方案、矩阵、设置 | 已启用 |
| 60-config/ | 工程设置全集 | 已启用 |
| 70-deploy/ | 部署 | planned（npx 发布后启用） |
| 80-design/ | UI/UX | **不适用**（CLI 无 UI，显式声明） |
| 90-reference/ | API 参考 | 骨架 |
| 95-lessons/ | 经验教训、bug 沉淀 | 已启用（空账） |

## 维护铁律

- **实时同步**：开发中凡触及任一卷知识的改动，实时更新入馆，不等 diff（bug 与解决办法→95-lessons；配置→60-config；功能→30-features……一视同仁）
- 会话开始跑 `node dist/cli.js status`；结束前自检：改动归档了吗？feature-map 状态推进了吗？progress.md 补记了吗？
- 每篇文档 frontmatter 的 `covers` 指向其描述的代码路径，必须保持真实
- 除 ≤10 行示意片段外禁止搬运源码
