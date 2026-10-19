<!-- doclib-guide cli=%CLI_VERSION% structure=%STRUCTURE_VERSION% -->
# DocLib 使用指南（完整引导）

<!-- doclib:managed-begin -->

本项目的文档图书馆位于 `doclib/`，是项目的**唯一事实源**：规格、蓝图、验收基准。目标是任何人或 agent 只凭图书馆即可从零重建本项目（≥90% 功能复原）。

## 图书馆阅读指南

1. `doclib/README.md` → `doclib/INDEX.md`（总索引）
2. 是什么 → `00-overview/`；进度 → `00-overview/feature-map.md`（状态事实源）与 `progress.md`（时间线）
3. 怎么设计的 → `10-architecture/`；各部分怎么工作 → `20-modules/`、`30-features/`
4. 怎么从零重建/继续开发 → `40-guides/roadmap.md`；日常工作流 → `40-guides/workflow.md`
5. 术语 → `00-overview/glossary.md`；经验教训 → `95-lessons/`
6. **查实体（API 字段/图标位置/路由/配置）→ 先查登记簿，无果或有疑才读代码；查码所得回填登记簿**（先馆后码——图书馆是首选信息渠道，代码是验证与兜底；查询即建账）

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
| API / 路由 / UI 资产（图标等）实体增删改 | **实体登记簿实时入账**（分散挂靠各卷：api/error-codes→`90-reference/`、ui-assets/routes→`80-design/`、config/flags→`60-config/`、tasks→`70-deploy/`、events→`00-overview/`）：条目五要素（标识/实体级 covers/契约细节/状态机/时间线，标识·covers·状态进 frontmatter）；废弃 deprecated、未使用 unused **显式标注，绝不静默** |
| 内容过时 | **三态更新**：失真→修正；过时→登记簿状态机降级或移 `99-archive/` 留墓碑（何时/为何/被何取代），**默认不物理删除**；冗余→合并留交叉引用 |
| 新文档落位 | **归位决策树定位唯一归宿**（知识→12 卷｜实体→登记簿｜过时→档案｜过程→规划载体）+ **同步登记两级索引**（INDEX + 所在卷 _index）；馆外是例外，例外必须显式（白名单或 ack） |
| 功能移除 | **六步移除规程**：①影响面预查（登记簿反向引用）②残留扫描 ③执行移除 ④馆内联动（feature-map retired / 登记簿 removed+时间线 / 叙述墓碑）⑤`doclib check` 执法（可疑引用=残留未清）⑥progress.md 留痕 |
| 任何进度变化 | feature-map 状态推进 + `00-overview/progress.md` 补记 |
| 引导文件（本文件）的维护 | 规则区由 `doclib sync` 再生；**项目定制区实时维护**——项目工作流/注意事项/教训产生的新 agent 规则，当场写入 custom 区 |

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
| doclib status | 版本/基线/漂移/治理健康分/引导预算概览 |
| doclib verify | 覆盖度 + 类别完备性 + 引导版本检查 |
| doclib sync | 引导规则区与 skills 同步（幂等，定制区保留） |
| doclib check | 强验证：双账本对账（漏更/无归属/迁移/引导过期/孤儿文档）+ 治理健康分 + revision，--strict 门禁 |
| doclib ack | 路径豁免登记（once/standing/remove） |
| doclib hook | pre-commit 钩子安装/移除（--strict；--ci github） |
| doclib reconcile | 进度对账重建 |

## 注意事项

- **引导文件与图书馆同为一体**：agent 必须知道的新规则/注意事项，先写进本文件 custom 区（实时）；确认长期普适的，沉淀进图书馆对应卷并提示用户运行 `doclib sync`
- 会话纪律：开始 `doclib status`；结束前自检四问——改动归档了吗？feature-map 状态推进了吗？progress.md 补记了吗？引导文件需要更新吗？
- **提交前跑 `doclib check`**；安装 `doclib hook install --strict` 后每次提交自动强验证（漏更/无归属/迁移违规会阻断）；确属无需文档的路径用 `doclib ack` 豁免
- **开发流程走 `.plan/<日期>/` 双锚点**：规划文档完成 → feature-map 登记 planned；开发完成 → 归档成果、状态 → implemented、progress.md 补记、`doclib snapshot`
- 每篇文档 frontmatter 的 `covers` 是增量更新锚点，保持真实
- **数据库迁移走混合账本制**：实体在代码区 `migrations/`（命名 `NNN_YYYYMMDD_<slug>.sql`），取号与登记在 `10-architecture/migrations.md` 账本；forward-only、applied 不可变、登记才算完成
- **登记簿条目五要素俱全方为合格**：标识 / 实体级 covers（源码精确位置）/ 契约细节（字段/响应/错误码）/ 状态机（active/deprecated/unused/removed）/ 时间线（何时引入·变更·为何·影响面）；更新过时内容默认降级保史（墓碑/档案卷），物理删除仅限失真与显式指令
- **归位宪法**：所有文档在图书馆中都有正确的地方可去——馆内是默认，馆外是例外，例外必须显式（工具链白名单或 ack 登记）；文档落位前先走归位决策树；命名 kebab-case，日期不进文件名；retired 条目 ID 永久退役不复用
- **无账不答（反幻觉铁律）**：查登记簿**无果时禁止凭空回答实体问题**（API 字段/图标位置/配置等）——必须读码验证并**回填登记簿建账**；不确定就声明不确定，绝不编造
- **入馆写协调**：入馆写之前先跑 `doclib check`——文档账有变 = 他人动过馆，先对账再写；同一时间约定单会话执行入馆写
- **记忆冲突以馆为准**：agent 自动记忆或历史习惯与图书馆冲突时，以图书馆为准（馆是唯一事实源）
- **引导裁剪判据**：新增引导规则前自问"删掉这条 agent 会犯错吗"——不会则入 skill / 入馆，不进引导；关键规则单点强调，禁止多处 IMPORTANT
- 文档写行为/契约/意图/验收标准；除 ≤10 行示意片段外禁止搬运源码
- 复原场景（doclib-rebuild）信息隔离：只读图书馆，不访问源项目

<!-- doclib:managed-end -->

<!-- doclib:custom-begin -->
<!-- 本区由本项目 agent/用户维护：项目定制说明与注意事项。doclib sync 更新时保留本区内容 -->
<!-- doclib:custom-end -->
