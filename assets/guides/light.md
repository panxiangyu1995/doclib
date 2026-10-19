<!-- doclib-guide cli=%CLI_VERSION% structure=%STRUCTURE_VERSION% -->
# DocLib 工作流（轻量引导）

本仓库已启用 DocLib。图书馆：`doclib/`（唯一事实源，12 卷基线）｜簿记：`.doclib/`｜进度：`doclib/00-overview/feature-map.md`（状态事实源）+ `progress.md`（时间线）。

## 实时同步规则（最高优先级，12 卷一视同仁）

开发中凡触及图书馆任一卷知识的改动，**必须当场更新入馆，不等 diff、不等会话结束**：

| 改动类型 | 必须同步的卷 |
| --- | --- |
| 修 bug / 踩坑 / 得出解决办法 | `95-lessons/`（现象/根因/解决/规避，实时入档） |
| 新功能 / 行为变更 / 新命令 | `30-features/`（行为规格 + 验收标准）+ feature-map 状态 |
| 模块增删 / 职责边界变化 | `20-modules/` |
| 架构 / 数据模型 / 数据流变化 | `10-architecture/` |
| 依赖增删换 | `10-architecture/dependencies.md` |
| 数据库迁移 / Schema 变更 | `10-architecture/migrations.md`（先取号、后登记账本）+ `data-model.md` |
| 新的设计决策 | `10-architecture/decisions.md`（ADR） |
| 测试方案 / 用例 / 矩阵变化 | `50-testing/` |
| 构建 / lint / CI / 环境变量变化 | `60-config/` |
| 部署 / 发布变化 | `70-deploy/` |
| 界面相关 | `80-design/`（不适用须显式声明，不得静默省略） |
| 接口 / 协议 / 配置参考 | `90-reference/` |
| 任何进度变化 | feature-map 状态推进 + `00-overview/progress.md` 补记 |

## 会话纪律（每个开发会话）

1. 开始：`doclib status`（看漂移、基线、引导版本）
2. 结束前自检三问：**改动归档了吗？feature-map 状态推进了吗？progress.md 补记了吗？**
3. 新功能开发走 `.plan/<日期>/` 双锚点：规划文档完成 → feature-map 登记 planned；开发完成 → 归档成果（长期价值沉淀 ADR/规格/参考卷）、状态 → implemented、progress 补记、`doclib snapshot` 固化基线

## 纪律底线

- 每篇文档 frontmatter 的 `covers` 指向真实代码路径——它是增量更新的锚点，必须随改动保持准确
- 文档写行为、契约、设计意图、验收标准；除 ≤10 行示意片段外禁止搬运源码（非克隆铁律）
- 忘了同步由兜底接住：`doclib diff` 揪漂移、`doclib reconcile` 对账重建——但兜底不是用来依赖的

## skills 与 CLI 速查

skills 按名称加载：`build`=蒸馏建馆｜`bootstrap`=新项目文档先行｜`resume`=半成品接手｜`dev`=日常开发★主力｜`update`=增量更新｜`rebuild`=从零复原｜`reconcile`=对账重建｜`audit`=质量审计｜`accept`=验收执行
CLI：`status`（概览）/`diff`（漂移）/`plan`（生成任务书至 `.doclib/tasks/`）/`snapshot`（固化基线）/`verify`（覆盖度）/`init`（骨架与落位）
