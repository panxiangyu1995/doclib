---
title: 文档图书馆
covers: []
status: living
---

# 文档图书馆

本图书馆由 DocLib 从源项目蒸馏而来。目标：任何 agent 或人**只凭本图书馆**即可在别处从零重建该项目（功能复原度 ≥90%），并作为日常开发与验收的唯一事实源。这是文档驱动的重新开发，不是克隆。

## 怎么读

1. 总入口：[INDEX.md](INDEX.md) — 全部文档与一句话摘要
2. 是什么 → `00-overview/`（进度看 feature-map 与 progress.md）
3. 怎么设计的 → `10-architecture/`；各部分怎么工作 → `20-modules/` 与 `30-features/`
4. 怎么从零重建/继续开发 → `40-guides/roadmap.md` 与 `workflow.md`
5. 测试 → `50-testing/`；工程设置 → `60-config/`；部署 → `70-deploy/`；界面 → `80-design/`；接口细节 → `90-reference/`；经验教训 → `95-lessons/`

## 目录结构（12 卷基线）

| 目录 | 内容 |
| --- | --- |
| 00-overview/ | 定位、术语、功能进度总账、进度时间线 |
| 10-architecture/ | 架构、数据模型、数据流、依赖选型、ADR |
| 20-modules/ | 每模块一卷：职责、边界、契约 |
| 30-features/ | 每功能一份行为规格 + 可执行验收标准 |
| 40-guides/ | 复原/开发路线图、编码约定、开发工作流 |
| 50-testing/ | 测试方案、矩阵、设置与运行 |
| 60-config/ | 工程设置全集：lint/构建/CI/环境变量 |
| 70-deploy/ | 部署：环境、发布、运维与回滚 |
| 80-design/ | UI/UX（无界面项目须显式声明不适用） |
| 90-reference/ | API/接口/协议精确参考 |
| 95-lessons/ | 经验教训：bug 与解决办法、代码审查、踩坑 |

## 维护铁律

- **实时同步**：开发中凡触及任一卷知识的改动，实时更新入馆，不等 diff（一视同仁：bug→95-lessons、配置→60-config、部署→70-deploy、功能→30-features……）
- **会话纪律**：开始运行 `doclib status`；结束前自检——改动归档了吗？feature-map 状态推进了吗？progress.md 补记了吗？
- 每篇文档 frontmatter 的 `covers` 指向其描述的代码路径，必须保持真实
- 文档写行为、契约、意图与验收标准；除 ≤10 行示意片段外禁止搬运源码
