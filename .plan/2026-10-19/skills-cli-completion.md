# CLI 地基与 Skills 补全：批次 A（F8/F9/F11）+ 批次 B（skills ×7）

- 日期：2026-10-19
- 状态：planned（待执行）
- 关联：PRD v0.24（F6/F7/F8/F9/F11）｜feature-map #6/#8/#9/#10
- 规划载体：本对话（RIPER-5 研究/计划）
- 前序：v0.24 强验证完成包已落地（#20 implemented，snap-010）

## 一、目的与效果

补齐工具体系主体，使 DocLib 达到"可日常自用 + 可分发"的完成度：

1. **F8 文档驱动开发闭环**：plan 新增 BOOTSTRAP（新项目对话式挖掘）/RESUME（半成品接手）任务书类型——三种开发模式（distill/bootstrap/resume）全部有任务书与 skill 支撑
2. **F9 载体适配落地**：载体可声明（默认 .plan/，支持多个自定义路径）、自定义载体不进快照/漂移、双锚点提醒（待登记/待归档）在 status/plan 持续可见
3. **F11 进度永不丢失**：reconcile 命令产出对账报告（疑似完成/进度不符/待推进），兜底层闭环
4. **F7 skills 体系 10/10 建齐**：doclib-dev（日常主力）/bootstrap/resume/setup/reconcile/audit/accept——agent 自助使用工具的知识载体完备

完成后：批次 C（npm 发布）与批次 E（F14 zod 基准实验）具备启动条件。

## 二、问题点

- F8 未实现：新项目/半成品项目两条开发模式无任务书类型，agent 无法按 DocLib 流程启动
- F9 未实现：载体只硬编码 .plan/（DEFAULT_IGNORES），用户自定义 spec 目录会被误判为漂移；双锚点提醒（v0.17 拍板的"提醒刚度"）无机器载体
- F11 未实现：进度账失真时无重建手段，"进度永不真正丢失"缺最后一环
- F7 缺 7 个 skill：agent 进入项目后对 bootstrap/resume/dev 等场景无操作手册——skills 是 agent 的一等用户界面

## 三、研究结果

- v0.23 差距矩阵确认：F8/F9/F11 全部为 ❌；skills 3/10
- 结构核实：plan.ts 的 runPlan 分发点清晰（opts.rebuild → rebuildTask；否则 BUILD/UPDATE 按 hasBaseline）——新增 bootstrap/resume 为同构扩展
- init.ts 已有交互问卷先例（isInteractive + askGuide）——planning 声明可复用该模式
- analyzeDrift 返回 {snapshotId, snapshotVersion, drift, rows}——reconcile 可直接复用
- SKILL.md 格式统一（frontmatter name/description + 使命/何时使用/工作流/纪律/收尾），7 个新 skill 有现成模板
- sync 机制已覆盖 skills/ 目录拷贝——新 skill 无需改同步代码

## 四、代码实际情况

- `src/commands/plan.ts`（173 行）：buildTask/updateTask/rebuildTask 三函数 + runPlan 分发；任务书头部已含 revision（v0.24）
- `src/commands/init.ts`：opts {force, agents, guide}；writeGuides 落位；state.agents 写入——planning 挂载点在 state 初始化处
- `src/commands/diff.ts`：analyzeDrift 复用点
- collectFiles(root, extraIgnores) 签名已支持额外忽略——五处调用点（snapshot/status/diff/plan/check）需接载体忽略
- `src/core/state.ts`：v0.24 已含 revision；planning 字段按同一归一化模式扩展
- feature-map 为 Markdown 表格，状态列可确定性解析（split "|"）
- DEFAULT_IGNORES 已含 .plan/——默认载体天然豁免；自定义载体需 planningIgnores 显式传入

## 五、设计的方案

### 批次 A：CLI 地基

**A1 载体声明（F9/Q24）**：state 增 `planning: string[]`（归一化 ?? [".plan/"]）；init 增 `--planning` 参数（逗号分隔多路径）+ 交互确认；新建 `src/core/planning.ts`：
- loadPlanningPaths / planningIgnores（转 "path/" 忽略形态）
- carrierDocs（枚举载体 .md + mtime）
- pendingRegistration（mtime > 最新 snapshot 的新规划 → 锚点一提醒）
- pendingArchive（解析 feature-map 表格：planned/in-progress 计数 → 锚点二提醒）
- planningReminderReport（组装提醒文本，空则不输出）
- 五处 collectFiles 调用接 planningIgnores（自定义载体不进快照/漂移）

**A2 任务书类型（F8）**：plan 增 `--bootstrap` / `--resume`（与 --rebuild 互斥，DoclibError 校验）：
- bootstrapTask：对话挖掘清单（定位/功能/边界/非目标/选型）→ 填馆顺序 → planned 登记 → 文档先行循环（规格→代码→验收）→ 收尾
- resumeTask：既有代码蒸馏 implemented → 用户规划→planned（agent 建议供筛选）→ 转 dev 循环
- 两任务书头部含 revision（延续 v0.24 语义）

**A3 双锚点提醒（F9 提醒刚度）**：status 增"载体"行、plan 输出文本前缀——提醒非空才输出（不刷屏）

**A4 reconcile（F11）**：新建 core/reconcile.ts + commands/reconcile.ts + cli 注册：
- ReconcileReport = { driftRows（复用 analyzeDrift）, plannedInProgress（feature-map 解析）, staleProgress（implemented 条目对应文档存在性检查，"（待写）"跳过） }
- 报告三段：疑似完成（漂移→覆盖文档对）/ 进度不符 / 待推进清单 + 修复指引（确认后补录 feature-map/progress）

### 批次 B：skills ×7（依赖 A 的产出）

| skill | 核心内容 | 依赖 |
| --- | --- | --- |
| doclib-dev ★ | 会话开始 status（治理分/漂移/载体提醒）→ 实时同步映射表 → 双锚点 → 写前 revision/写后 check → 自检四问 | F9 提醒 |
| doclib-bootstrap | 对话挖掘清单 → 填馆顺序 → planned 登记 → 文档先行循环 | A2 |
| doclib-resume | 蒸馏 implemented → 用户规划→planned → 转 dev | A2 |
| doclib-setup | init --agents 落位确认（skills/引导/版本戳）→ custom 区补充 → sync 时机 | 既有 init |
| doclib-reconcile | reconcile 报告逐项确认 → 补录 feature-map/progress | A4 |
| doclib-audit | 类别完备性 12 卷判定 → 覆盖粒度 → 终极抽查（五问+实体）→ 示例/截图/重复抽查 | 独立 |
| doclib-accept | 30-features 验收标准逐条 Given/When/Then 执行留痕 → 全绿判定 | 独立 |

### 版本与同步

package.json 0.4.0；cli 帮助（plan 描述/reconcile 行）；PRD v0.25（F6/F7/F8/F9/F11 状态）；feature-map #6/#8/#9/#10 推进；progress/config/custom 区；snapshot 固化。

## 六、备选方案

| 决策点 | 采用 | 被否备选 | 理由 |
| --- | --- | --- | --- |
| 载体声明存储 | state.planning 字段 | 独立配置文件 | 与 agents/acks 同模式，归一化先例成熟 |
| 载体忽略实现 | 各 collectFiles 调用点显式传 | fsutil 内读 state | fsutil 保持纯函数不依赖 state |
| 提醒判定 | 确定性信号（mtime 对比/表格解析） | AI 判断"是否已登记" | 违背确定性原则（无 AI 可复现） |
| 任务书互斥 | DoclibError 校验 | 优先级静默裁决 | 显式报错优于猜测用户意图 |
| reconcile 输出 | 报告（agent 消费） | 任务书文件 | PRD F11 原文"agent 逐项确认后补录"——报告即工单 |
| skills 生成时机 | 批次 B 在 A 后 | 全部并行 | bootstrap/resume/reconcile skill 依赖 CLI 行为先落地，避免手册与实现脱节 |
| 版本号 | 0.4.0 | 0.3.1 | 新增功能多（命令/字段/skills），语义化要求 minor |

## 七、实施清单

1. src/core/state.ts：planning 字段 + 归一化
2. 新建 src/core/planning.ts（五函数）
3. 五处 collectFiles 接 planningIgnores（snapshot/status/diff/plan/check）
4. src/commands/init.ts：--planning 参数 + state 写入 + 输出行
5. src/commands/plan.ts：bootstrapTask/resumeTask + runPlan 分发 + 互斥校验
6. src/commands/status.ts + plan.ts：载体提醒输出
7. 新建 src/core/reconcile.ts + src/commands/reconcile.ts + src/cli.ts 注册
8. 新建 planning.test.ts / reconcile.test.ts / plan.test.ts
9. typecheck + test 全绿
10. 新建 skills/doclib-dev/SKILL.md
11. 新建 skills/doclib-bootstrap/SKILL.md
12. 新建 skills/doclib-resume/SKILL.md
13. 新建 skills/doclib-setup/SKILL.md
14. 新建 skills/doclib-reconcile/SKILL.md
15. 新建 skills/doclib-audit/SKILL.md
16. 新建 skills/doclib-accept/SKILL.md
17. package.json 0.4.0 + cli.ts 帮助（plan/reconcile）
18. PRD v0.25 修订记录 + F6/F7/F8/F9/F11 状态标注
19. feature-map #6/#8/#9/#10 状态推进 + progress.md 补记 + config.md 版本
20. AGENTS/CLAUDE custom skills 状态行
21. 冒烟（--planning/提醒/bootstrap/resume/reconcile）
22. build + sync + check/verify + snapshot 固化
