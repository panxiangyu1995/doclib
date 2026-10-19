<!-- doclib-guide cli=%CLI_VERSION% structure=%STRUCTURE_VERSION% -->
# DocLib 使用指南（完整引导）

本项目的文档图书馆位于 `doclib/`，是项目的**唯一事实源**：规格、蓝图、验收基准。目标是任何人或 agent 只凭图书馆即可从零重建本项目（≥90% 功能复原）。

## 图书馆阅读指南

1. `doclib/README.md` → `doclib/INDEX.md`（总索引）
2. 是什么 → `00-overview/`；进度 → `00-overview/feature-map.md`（状态事实源）与 `progress.md`（时间线）
3. 怎么设计的 → `10-architecture/`；各部分怎么工作 → `20-modules/`、`30-features/`
4. 怎么从零重建/继续开发 → `40-guides/roadmap.md`；日常工作流 → `40-guides/workflow.md`
5. 术语 → `00-overview/glossary.md`；经验教训 → `95-lessons/`

## 本项目 skills 清单

skills 已安装至本仓库的 agent 适配目录（如 `.claude/skills/`、`.opencode/skills/`），按名称加载：

| Skill | 触发场景 |
| --- | --- |
| doclib-build | 存量项目蒸馏建馆（BUILD 任务书） |
| doclib-bootstrap | 新项目文档先行开发（BOOTSTRAP 任务书） |
| doclib-resume | 半成品接手（RESUME 任务书） |
| doclib-dev | 日常开发会话（.plan 双锚点 + 实时同步）★主力 |
| doclib-update | 增量更新（UPDATE 任务书） |
| doclib-rebuild | 从零复原（REBUILD 任务书） |
| doclib-reconcile | 进度对账与重建 |
| doclib-audit | 图书馆质量审计（覆盖粒度/类别完备性/抽查） |
| doclib-accept | 按 30-features 验收标准执行验收并留痕 |

## CLI 命令速查

| 命令 | 职责 |
| --- | --- |
| doclib init | 初始化图书馆骨架与簿记（--agents 适配 agent） |
| doclib plan | 生成任务书：BUILD/BOOTSTRAP/RESUME/UPDATE/REBUILD(--rebuild) |
| doclib diff | 漂移报告 + 路径→文档映射 |
| doclib snapshot | 记录新基线（版本 +1） |
| doclib status | 版本/基线/漂移概览 |
| doclib verify | 覆盖度 + 类别完备性 + 引导版本检查 |
| doclib reconcile | 进度对账重建 |

## 注意事项

- 实时同步规则（12 卷一视同仁）与会话纪律见 `40-guides/workflow.md`，必须遵守
- **开发流程走 `.plan/<日期>/` 双锚点**：规划文档完成 → feature-map 登记 planned；开发完成 → 归档成果（长期价值沉淀 ADR/规格/参考卷）、状态 → implemented、progress.md 补记、`doclib snapshot`
- 每篇文档 frontmatter 的 `covers` 是增量更新锚点，保持真实
- **数据库迁移走混合账本制**：实体在代码区 `migrations/`（命名 `NNN_YYYYMMDD_<slug>.sql`），取号与登记在 `10-architecture/migrations.md` 账本；forward-only、applied 不可变、登记才算完成
- 文档写行为/契约/意图/验收标准；除 ≤10 行示意片段外禁止搬运源码
- 复原场景（doclib-rebuild）信息隔离：只读图书馆，不访问源项目
