---
title: 总索引
covers: []
status: living
---

# 总索引

> 新增/更名/废弃文档必须同步本表；每条一句话摘要。

| 文档 | 摘要 | 状态 |
| --- | --- | --- |
| [00-overview/project.md](00-overview/project.md) | DocLib 定位与北极星 | stable |
| [00-overview/feature-map.md](00-overview/feature-map.md) | 功能进度总账（状态事实源） | living |
| [00-overview/progress.md](00-overview/progress.md) | 进度时间线 | living |
| [00-overview/glossary.md](00-overview/glossary.md) | 术语表 | draft |
| [10-architecture/overview.md](10-architecture/overview.md) | 架构总览（分层/选型，指向 DESIGN v2） | stable |
| [10-architecture/data-model.md](10-architecture/data-model.md) | state.json v2 与 frontmatter 字段语义 | stable |
| [10-architecture/data-flow.md](10-architecture/data-flow.md) | init 落位流、保活三层流、复原流 | stable |
| [10-architecture/dependencies.md](10-architecture/dependencies.md) | 依赖选型决策（ignore 等） | stable |
| [10-architecture/decisions.md](10-architecture/decisions.md) | ADR 十七则（assets 化/戳策略/双层图书馆/基准测试/归位宪法/开放册制/移除规程与工具集成/codegraph 集成/门面多语言变体豁免/文体学/旗标面对账/对应文档存在性判定等） | stable |
| [10-architecture/prd.md](10-architecture/prd.md) | DocLib PRD（v0.23，需求唯一事实源；v0.23 迁入馆） | living |
| [10-architecture/design.md](10-architecture/design.md) | 架构设计 v2（对齐 PRD；v0.23 迁入馆） | living |
| [10-architecture/migrations.md](10-architecture/migrations.md) | 数据库迁移账本（取号/状态/纪律，暂空置） | living |
| [20-modules/_index.md](20-modules/_index.md) | 模块索引（18 个模块，covers 齐全） | stable |
| [30-features/_index.md](30-features/_index.md) | 功能规格索引（含规格欠账清单） | stable |
| [30-features/init-v2.md](30-features/init-v2.md) | init v2 行为规格 + 验收标准 | stable |
| [30-features/check.md](30-features/check.md) | 强验证体系规格（check/ack/hook + 六类违规 + 四态判定与三层防线） | stable |
| [30-features/place.md](30-features/place.md) | 孤儿归位与处置规格（place 五子命令 + 干跑契约 + 入棺三护栏） | living |
| [30-features/graph.md](30-features/graph.md) | 代码知识图谱规格（graph 命令族 + 草稿候选管道 + vendor CJS 岛与降级） | living |
| [30-features/reconcile.md](30-features/reconcile.md) | 进度对账规格（reconcile 三段报告 + 对应文档混合引用判定 + 库内/载体证据分流） | stable |
| [40-guides/rebuild-plan.md](40-guides/rebuild-plan.md) | 复原路线图（更名 roadmap 待迁移） | draft |
| [40-guides/conventions.md](40-guides/conventions.md) | 编码约定 | draft |
| [40-guides/benchmark.md](40-guides/benchmark.md) | 复原基准测试指南（F14 方法论操作沉淀） | living |
| [50-testing/testing.md](50-testing/testing.md) | 测试策略（node:test + 冒烟闭环） | stable |
| [60-config/config.md](60-config/config.md) | 工程设置全集（含构建链/files 字段） | stable |
| [70-deploy/deploy.md](70-deploy/deploy.md) | 部署（npm 包配置已就绪，发布待阶段 5） | stable |
| [80-design/README.md](80-design/README.md) | UI/UX——显式不适用 | not-applicable |
| [90-reference/_index.md](90-reference/_index.md) | 参考索引（v0.23 已归位重编号） | draft |
| [95-lessons/lessons.md](95-lessons/lessons.md) | 经验教训（7 条：frontmatter 解析/落盘断言/模板保护/基准循环论证/豁免闭集滞后/排除语义丢失/闭集根治靠模式识别） | living |
| [99-archive/README.md](99-archive/README.md) | 档案卷入口（墓碑规范，只进不出） | living |
| [50-testing/acceptance-cli-v0.4.0.md](50-testing/acceptance-cli-v0.4.0.md) | CLI 全功能验收报告（44 探针/3 缺陷修复） | stable |
| [50-testing/cli-acceptance-suite.md](50-testing/cli-acceptance-suite.md) | CLI 自动化验收测试套件（219 用例落测试文件，219/219） | stable |
| [50-testing/acceptance-place-v0.5.0.md](50-testing/acceptance-place-v0.5.0.md) | 孤儿归位与处置闭环验收报告（v0.5.0：四态判定/place 五子命令/实施 5 缺陷 + 审查 10 项修复） | stable |
| [50-testing/acceptance-graph-v0.5.0.md](50-testing/acceptance-graph-v0.5.0.md) | doclib graph 真实仓库验收报告（五仓实测：四语言建图/路由绑定/agent 工作流/Q40 首轮数据） | living |
| [50-testing/benchmark/_index.md](50-testing/benchmark/_index.md) | benchmark 分区索引（复原基准档案） | living |
| [50-testing/benchmark/010-umami.md](50-testing/benchmark/010-umami.md) | umami 复原档案主册（准入/基线/缺陷分类账 D-01~D-14） | living |
| [50-testing/benchmark/020-umami-answer-src.md](50-testing/benchmark/020-umami-answer-src.md) | umami 基准答卷·原仓库卷（71 AC 实测留痕） | stable |
| [50-testing/benchmark/030-umami-answer-rebuild.md](50-testing/benchmark/030-umami-answer-rebuild.md) | umami 基准答卷·复原卷（71/71 ok） | stable |
| [50-testing/benchmark/040-umami-rebuild-log.md](50-testing/benchmark/040-umami-rebuild-log.md) | REBUILD-LOG 副本（身份审计） | stable |
| [50-testing/benchmark/050-umami-divergence.md](50-testing/benchmark/050-umami-divergence.md) | 差异清单（D32/E13） | stable |
| [50-testing/benchmark/060-umami-feedback.md](50-testing/benchmark/060-umami-feedback.md) | 回灌建议（S1×7/S2×24/S3×20） | stable |
| [50-testing/benchmark/070-umami-regression.md](50-testing/benchmark/070-umami-regression.md) | umami 回归轮切片答卷（22/22；全量 71/71） | stable |
| [50-testing/benchmark/080-umami-alignment-log.md](50-testing/benchmark/080-umami-alignment-log.md) | 回归对齐日志（含新发现 8 条处置） | stable |
| [50-testing/benchmark/090-umami-gap-analysis.md](50-testing/benchmark/090-umami-gap-analysis.md) | 实质差距分析（重建↔原仓库·API12/页面39/结构2） | stable |
