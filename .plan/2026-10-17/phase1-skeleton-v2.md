# Phase 1 · 骨架 v2 实施规划

- 创建于：2026-10-17
- 流程位置：RIPER-5 PLAN 模式产物（创新模式方案已获批准）
- 关联：feature-map #5（12 卷基线模板）/ #11（引导文件模板与版本戳）；PRD §7 / F5 / F10；DESIGN v2 §3、§6
- 收尾归属：完成后按 F9 双锚点归档（状态推进 + progress.md 补记 + snapshot）

## 1. 想达到什么目的和效果

- 图书馆骨架模板从 v0.1 的 6 卷升级为 **12 卷基线**（PRD §7 定稿），使 `doclib init` 产出的骨架直接满足"广而全"要求
- 模板实体从 TS 模板字符串迁移为 **assets 真实 .md 文件**：书写自然、skills 可直接引用、消除反引号转义噪音
- 引导文件（CLAUDE.md/AGENTS.md）模板**两档化**（light/full）并带**版本戳**，且 init 落位时绝不破坏用户已有内容
- `init` 支持 `--agents`/`--guide` 参数与 TTY 交互问卷，非 TTY 自动降级——npx 与 CI 场景可用
- `state.json` 升级 v2（structureVersion/agents），兼容本仓库已有 snap-001 真实数据
- 阶段终态：本仓库 dogfooding 环境平滑迁移到新结构，CLI 版本 0.2.0

## 2. 问题点

| # | 问题 | 对策 |
| --- | --- | --- |
| P1 | 本仓库 CLAUDE.md/AGENTS.md 已有手工定制内容，`init --force` 会覆盖导致丢失 | 引导文件覆盖策略：有戳可更新 / 无戳不覆盖仅提示 / 不存在才写入（见 §5.3） |
| P2 | 旧 state.json（snap-001）无新字段，硬解析会炸 | loadState 归一化：缺 structureVersion→1、缺 agents→[] |
| P3 | tsc 不拷贝非 TS 资产，npx 场景 dist 缺文件即瘫痪 | build 链追加 copy-assets 脚本；测试断言 assetsRoot 存在；npm pack 预演留阶段 5 |
| P4 | Cursor 无官方 skills 目录约定 | 首版 cursor 适配仅引导文件（skillsDir=null），rules 适配后置 |
| P5 | 交互问卷在 CI/管道中会挂起 | process.stdout.isTTY 判定，非交互直接取默认值（generic + light） |
| P6 | 模板迁移后旧 `40-guides/testing.md`、`rebuild-plan.md` 成为孤儿文件 | 迁移步骤显式删除/更名（见 §7 清单 30-31） |

## 3. 研究结果

- PRD §7 十二卷基线已定稿，每卷入口文件清单可确定（共 23 个模板文件）
- PRD F5/Q2/Q4：引导文件 = CLI 模板 + agent 补充；版本戳三重机制的第一重（检测）在本阶段落地，实时规则与任务书收尾检查分别归 doclib-dev skill 与任务书模板（阶段 2+）
- PRD F10/Q13/Q14：首版适配 claude/opencode/cursor/generic；交互+参数双形态
- v0.1 代码中模板唯一消费方是 `init`（plan/diff/verify 不读模板），迁移影响面仅 init.ts 与 templates/library.ts
- 技术事实：ESM 下 `import.meta.url` 可稳定定位 dist 内资产路径；node:fs 递归拷贝即可跨平台，无需引入新依赖（维持"运行时仅 ignore"约束）

## 4. 代码实际情况（基线 snap-001，31 文件）

- `src/templates/library.ts`：libraryFiles() 返回 16 个模板（6 卷），仅被 init.ts 消费
- `src/commands/init.ts`：runInit(root, {force}) → 写 16 模板 + .doclib/tasks + 空 state；无 agents/引导概念
- `src/core/state.ts`：State{version,latest,snapshots}；loadState 已做结构校验兜底；MAX_SNAPSHOTS=20
- `src/cli.ts`：parseArgs 支持 json/force/rebuild/note/to；六命令就绪
- `src/core/fsutil.ts`：DEFAULT_IGNORES 已含 `.plan/`（F9 前置已落地）
- 本仓库 doclib/：12 卷已手工补齐（80-design 显式不适用）；CLAUDE.md/AGENTS.md 为手工轻量引导（无版本戳）；.claude/skills 已装三核心 skills；feature-map 14 条目（#1-#4 implemented，#5-#14 planned）

## 5. 设计的方案

### 5.1 资产布局与构建链

```
assets/templates/library/   23 个 .md（新目录）
assets/guides/              light.md、full.md（首行版本戳占位）
skills/                     保持唯一源不动
        ↓ npm run build = tsc + scripts/copy-assets.js
dist/assets/…  dist/assets/skills/…
        ↓ 运行期 core/assets.ts::assetsRoot() 相对 dist/cli.js 定位
```

### 5.2 模板文件清单（23）

README、INDEX；00-overview/{project, glossary, feature-map, progress}；10-architecture/{overview, data-model, data-flow, dependencies, decisions}；20-modules/_index；30-features/_index；40-guides/{roadmap, conventions, workflow}；50-testing/testing；60-config/settings；70-deploy/deploy；80-design/README（status: not-applicable，示范"不适用须声明"）；90-reference/_index；95-lessons/lessons

变更要点：testing 从 40-guides 移至 50-testing；rebuild-plan.md 更名 roadmap.md（服务复原与新开发双场景）；新增 workflow.md（.plan 双锚点 + 实时同步规则的操作规范）与 progress.md（F11 时间线）

### 5.3 新建核心模块（签名级规范）

- `src/core/version.ts`：`CLI_VERSION`（运行期读包内 package.json）、`STRUCTURE_VERSION = 2`
- `src/core/assets.ts`：`assetsRoot(): string`；`copyDir(src, dest): Promise<void>`；`renderTemplate(rel, vars): Promise<string>`（%KEY% 占位替换）
- `src/core/agents.ts`：`type AgentTarget = { id; name; skillsDir: string | null; guideFiles: string[] }`；`AGENT_TARGETS`（claude→.claude/skills+CLAUDE.md；opencode→.opencode/skills+AGENTS.md；cursor→null+AGENTS.md；generic→null+AGENTS.md）；`resolveAgents(spec?: string): AgentTarget[]`（逗号分隔、未知 id 抛 DoclibError、缺省 ["generic"]）
- `src/core/prompts.ts`：`isInteractive(): boolean`；`askAgents(): Promise<string[]>`；`askGuide(): Promise<"light"|"none">`（readline 封装，非 TTY 返回默认）
- `src/core/guides.ts`：`renderGuide(tier, vars)`；`parseGuideStamp(content): {cli, structure} | null`；`writeGuides(root, tier, targets): Promise<{written, skipped}>`——覆盖策略：有戳→更新；无戳→跳过并提示；不存在→写入

### 5.4 既有模块修改

- `state.ts`：State + structureVersion/agents；loadState 归一化；emptyState 归零
- `init.ts`：`runInit(root, { force?, agents?, guide? })`——流程：模板 23 文件（force 覆盖同名、不删多余）→ .doclib/tasks → agents 解析（参数 > TTY 问卷 > 默认）→ skills 落位（copyDir 覆盖）→ writeGuides(light) → saveState(agents, structureVersion=2) → 输出写入/跳过报告
- `status.ts`：追加结构版本、已装 agents、引导戳状态（匹配/过期/缺失）
- `verify.ts`：报告头含结构版本；追加"引导文件"检查行
- `cli.ts`：--agents/--guide 透传 + HELP 更新
- `package.json`：build 追加 copy-assets；files=[dist, README.md, AGENTS.md]；version 0.2.0；test 清单追加 4 个新测试
- `AGENTS.md`/`README.md`：同步新选项与 assets 化说明（实时同步原则）

### 5.5 删除

- `src/templates/library.ts`（init 重写后无消费者，全库 grep 校验）

## 6. 备选方案（已评估，放弃理由）

| 决策点 | 备选 | 放弃理由 |
| --- | --- | --- |
| 模板载体 | 继续 TS 模板字符串 | markdown 围栏转义噪音大，长文案维护差，skills 无法直接引用 |
| 模板载体 | 运行时读 src/ 外部目录 | 发布包不含 src，npx 必炸 |
| skills 源 | 移入 assets/ 单一源 | 仓库根 skills/ 可读性与现有引用（README/AGENTS/CLAUDE）破坏面大；build 拷贝已解决双源问题 |
| 引导覆盖 | 一律覆盖 | 本仓库定制内容丢失（P1），违背北极星"可用" |
| 引导覆盖 | 一律跳过 | 版本戳更新机制（Q4）失效 |
| 状态迁移 | 破坏式重置 state | 本仓库 snap-001 是真实基线，丢了漂移检测就断了 |
| 交互实现 | 引入 inquirer 类依赖 | 违反依赖最小化；两问的问卷 readline 足够 |

## 7. 具体的实施清单（原子操作，顺序执行）

**一、规划与登记**
1. 创建本规划文档（.plan/2026-10-17/phase1-skeleton-v2.md）
2. feature-map #5 → in-progress；progress.md 补记本次规划

**二、构建链与资产**
3. 新建 scripts/copy-assets.js（assets→dist/assets；skills→dist/assets/skills；node:fs 递归）
4. 新建 assets/templates/library/ 下 23 个模板文件（清单见 §5.2，全部含 frontmatter 与 TODO 引导）
5. 新建 assets/guides/light.md、full.md（首行 `<!-- doclib-guide cli=%CLI_VERSION% structure=%STRUCTURE_VERSION% -->`）
6. package.json：build 追加 copy-assets；files 字段；version→0.2.0；test 清单更新
7. 新建 src/core/version.ts（CLI_VERSION、STRUCTURE_VERSION=2）
8. 新建 src/core/assets.ts（assetsRoot/copyDir/renderTemplate）
9. 新建 src/core/agents.ts（AgentTarget/AGENT_TARGETS/resolveAgents）
10. 新建 src/core/prompts.ts（isInteractive/askAgents/askGuide，非 TTY 降级）
11. 新建 src/core/guides.ts（renderGuide/parseGuideStamp/writeGuides 含覆盖策略）

**三、状态与命令层**
12. state.ts：State + structureVersion/agents；loadState 归一化；emptyState 归零
13. 重写 init.ts（§5.4 流程与输出报告）
14. status.ts 追加结构版本/agents/引导戳展示
15. verify.ts 追加引导文件检查行
16. cli.ts：--agents/--guide 透传 + HELP 更新
17. 删除 src/templates/library.ts；grep 校验无残留引用

**四、测试**
18. 新建 src/core/agents.test.ts（解析/未知 id 报错/默认值）
19. 新建 src/core/guides.test.ts（stamp 往返、无戳不覆盖——临时目录）
20. 新建 src/core/assets.test.ts（23 文件清单、12 卷必需路径、assetsRoot 存在）
21. 新建 src/core/state.test.ts（旧 state 兼容归一化）

**五、验证**
22. npm run typecheck 全绿
23. npm test 全绿（11 旧 + 4 新测试文件）
24. 冒烟（临时目录）：init --agents claude,opencode → 断言 .claude/skills、.opencode/skills、AGENTS.md 带戳、doclib 23 文件
25. 冒烟：二次 init（无 --force）幂等不破坏；无戳引导文件不被覆盖；非 TTY 默认降级生效
26. 冒烟：status/verify 展示结构版本与引导状态

**六、本仓库迁移与归档**
27. 本仓库运行 init --force --agents claude,opencode（观察 P1 策略保护 CLAUDE.md/AGENTS.md）
28. 删除 doclib/40-guides/testing.md（由 50-testing/testing.md 承接）
29. doclib/40-guides/rebuild-plan.md 更名 roadmap.md（保留内容）
30. 新增 doclib/40-guides/workflow.md（内容取自 AGENTS.md 工作流段，正式入馆）
31. INDEX.md 同步增删条目；verify 复查
32. AGENTS.md/README.md/CLAUDE.md 按实时同步原则更新（assets 化、新选项、版本 0.2.0）
33. feature-map：#5 → implemented；#11 → in-progress（模板与戳已落地，检测展示部分完成）
34. progress.md 补记阶段 1 完成
35. node dist/cli.js snapshot --note "phase1: skeleton v2"
36. 汇报并请求进入 REVIEW 模式

## 8. 验收标准

- typecheck + 全部测试通过
- 临时目录冒烟三项全过（24-26）
- 本仓库：12 卷由模板生成而非手工维持；CLAUDE.md/AGENTS.md 定制内容完好；状态展示含 structureVersion=2 与 agents
- 图书馆同步：feature-map/progress.md/INDEX/lessons 与实际一致（实时同步原则的第一次完整演练）

## 任务进度

**[2026-10-17 · EXECUTE 批次 1]**
- 已修改：`scripts/copy-assets.js`（新增）；`assets/templates/library/`（22 个模板）；`assets/guides/{light,full}.md`；`package.json`（v0.2.0 / build 链 / files / test 清单）；`src/core/{version,assets,agents,prompts,guides}.ts`（新增）；`src/core/state.ts`（v2 字段 + 旧格式兼容）；`src/commands/init.ts`（重写）；`src/commands/{status,verify}.ts` + `src/cli.ts`（结构版本/引导展示 + 新选项）；`src/templates/library.ts`（删除）；4 个新测试文件
- 更改：清单 3-26 完成。typecheck ✓；测试 22/22 ✓；冒烟 ✓（--agents 落位、无戳引导保护、非 TTY 降级 generic、status/verify 新展示）
- 原因：执行已批准计划
- 阻碍因素：**清单 27 中断**——计划语义"--force 覆盖同名模板"会摧毁本仓库 doclib/ 真实内容（feature-map、progress、lessons、README、INDEX 等 9 个同名文件为手写数据而非脚手架）；另模板实际 22 个（规划误计 23，testing 迁移非新增）
- 状态：未确认

**[2026-10-17 · EXECUTE 批次 3（用户指出的补账与引导强化）]**
- 已修改：`assets/guides/light.md`（补入 12 卷实时同步映射全表/会话纪律/.plan 双锚点/skills 与 CLI 速查）、`assets/guides/full.md`（补 .plan 双锚点）、`AGENTS.md` 与 `CLAUDE.md`（重写为完整工作流手册）、`doclib/10-architecture/` 五卷、`doclib/20-modules/_index.md`、`doclib/30-features/`（_index + init-v2.md）、`doclib/60-config/config.md`、`doclib/70-deploy/deploy.md`、`doclib/INDEX.md`；删除重复的 `doclib/40-guides/testing.md`
- 更改：审计发现的 7 项文档欠账全部补齐；引导文件达到用户要求的"其他 repo 的 agent 也会执行实时更新"的信息密度
- 原因：用户指出文档未按规划更新、引导文件过简
- 阻碍因素：无
- 状态：未确认

**[2026-10-17 · EXECUTE 批次 2（中断处置 + 收尾）]**
- 已修改：`AGENTS.md`（core 模块清单 + assets 结构）、`README.md`（init 选项/skills 自动落位）、`doclib/00-overview/feature-map.md`（#5→implemented、#11→in-progress）、`doclib/00-overview/progress.md`、`doclib/95-lessons/lessons.md`（新增"模板资产 vs 用户内容"教训）
- 更改：用户裁决**跳过清单 27-31**（本仓库图书馆保持手工结构，不迁移）；执行 32-34；35（snapshot）随后执行
- 原因：执行中断决策与实时同步归档
- 阻碍因素：无
- 状态：未确认
