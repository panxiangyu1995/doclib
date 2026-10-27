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
| [10-architecture/decisions.md](10-architecture/decisions.md) | ADR 二十三则（…/开发宪法与走查账/教训实时性三层等） | stable |
| [10-architecture/prd.md](10-architecture/prd.md) | DocLib PRD（v0.23，需求唯一事实源；v0.23 迁入馆） | living |
| [10-architecture/design.md](10-architecture/design.md) | 架构设计 v2（对齐 PRD；v0.23 迁入馆） | living |
| [10-architecture/migrations.md](10-architecture/migrations.md) | 数据库迁移账本（取号/状态/纪律，暂空置） | living |
| [20-modules/_index.md](20-modules/_index.md) | 模块索引（core/commands 全模块职责与 covers，数量以本表为准） | stable |
| [30-features/_index.md](30-features/_index.md) | 功能规格索引（含规格欠账清单） | stable |
| [30-features/init-v2.md](30-features/init-v2.md) | init v2 行为规格 + 验收标准（门禁自动装 v0.5.1 + 常见载体检测建议 v0.6.1） | stable |
| [30-features/check.md](30-features/check.md) | 强验证体系规格（check/ack/hook + 十七类违规含归档闭环四不变量与教训来源缺失与验收锚点/假设残留/实施锚点三新类 + 四态判定与三层防线） | stable |
| [30-features/hook.md](30-features/hook.md) | 提交门禁规格（install/remove/ci + fail-closed 自检 + worktree + init 自动装/sync 幂等补装） | stable |
| [30-features/place.md](30-features/place.md) | 孤儿归位与处置规格（place 五子命令 + 干跑契约 + 入棺三护栏 + 载体形态识别建议） | living |
| [30-features/graph.md](30-features/graph.md) | 代码知识图谱规格（graph 命令族 + 草稿候选管道 + vendor CJS 岛与降级） | living |
| [30-features/reconcile.md](30-features/reconcile.md) | 进度对账规格（reconcile 三段报告 + 对应文档混合引用判定 + 库内/载体证据分流） | stable |
| [30-features/guides.md](30-features/guides.md) | 引导文件体系规格（四区契约 + 图书馆反哺注入 + 开发宪法六篇 + 12 卷走查账 + 记忆快照双层快照 + 双闸检测 + 三预算） | stable |
| [30-features/040-planning-express.md](30-features/040-planning-express.md) | F17 规划直通车规格（bootstrap v2 五阶段对话协议 + 工具兼容层快照式收编 + implement 拆单器 + 门禁三件套 + AC 编号规范） | stable |
| [30-features/050-harness.md](30-features/050-harness.md) | F19 长程开发闭环规格（test-chain 馆内声明 + hook 烘焙执法 + 清单状态失真三类判定 + doclib-dev 双情形六步回路 + sync 确定性反哺） | stable |
| [40-guides/010-tool-adoption.md](40-guides/010-tool-adoption.md) | 外部规划工具收编指南（BMAD/spec-kit/OpenSpec/Kiro 语义映射表 + 快照式收编纪律 + provenance 规范） | stable |
| [40-guides/harness.md](40-guides/harness.md) | 长程开发指南（测试链声明规范 + 分级模板 + 浏览器工具序 playwright-cli 首选 + 阻塞协议 + 执法点速查） | stable |
| [40-guides/rebuild-plan.md](40-guides/rebuild-plan.md) | 复原路线图（更名 roadmap 待迁移） | draft |
| [40-guides/conventions.md](40-guides/conventions.md) | 编码约定 | draft |
| [40-guides/benchmark.md](40-guides/benchmark.md) | 复原基准测试指南（F14 方法论操作沉淀） | living |
| [40-guides/transcripts.md](40-guides/transcripts.md) | 对话导出工作流（98-sessions 档案区 + 双向关联 + 收尾五动作） | living |
| [40-guides/video/_index.md](40-guides/video/_index.md) | 推广视频分区索引（分镜/字幕/复现/发布四件套 + 生命周期） | living |
| [40-guides/video/storyboard.md](40-guides/video/storyboard.md) | 推广视频分镜表（8 幕 240s 时间轴 + 画面 + 数字来源表） | living |
| [40-guides/video/script.md](40-guides/video/script.md) | 推广视频字幕文案（逐幕原文 + 字幕规范 + ASCII-only 终端约束） | living |
| [40-guides/video/production.md](40-guides/video/production.md) | 推广视频生产复现指南（HyperFrames 工程结构 + 三条硬约束 + 已知坑） | living |
| [40-guides/video/publishing.md](40-guides/video/publishing.md) | 推广视频发布规格（B 站规格 + 数值核对表 + 发布 checklist + 风险取舍） | draft |
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
| [50-testing/acceptance-lesson-gap-v0.6.2.md](50-testing/acceptance-lesson-gap-v0.6.2.md) | 教训账缺口不变量真实仓库验收（五仓：存量零破坏/退化形态/噪声隔离） | stable |
| [50-testing/acceptance-promo-video-v0.8.0.md](50-testing/acceptance-promo-video-v0.8.0.md) | 推广视频成片验收报告（HyperFrames 工程：lint/check/validate 三绿 + 12 条 AC + 5 项制作期缺陷闭环 + 5 个探针实验） | stable |
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
| [98-sessions/_index.md](98-sessions/_index.md) | 会话档案分区索引（对话原始记录规范：命名/frontmatter 五要素/双向关联） | living |
| [98-sessions/transcript-archive-20261026-01.md](98-sessions/transcript-archive-20261026-01.md) | 会话记录：对话档案区立项与 M1（session-id 待回填） | archived-session |
