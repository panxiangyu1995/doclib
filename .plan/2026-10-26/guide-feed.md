# 引导文件图书馆反哺机制（guide-feed）

- 日期：2026-10-26
- 状态：规划完成，待用户批准进入执行（清单第 1 步已落盘）
- 关联：feature-map #11/#15（引导模板与 sync 命令，implemented）｜ADR #18（待登记）｜AGENTS.md 实时同步规则（新功能 → 30-features + feature-map）｜CLI 速查「sync 引导/skills 同步」
- 规划载体：本对话（RIPER-5 RESEARCH → INNOVATE → PLAN；用户裁决聚焦「图书馆反哺」方向）
- 关联产物：`src/core/guides.ts` · `src/core/check.ts` · `src/commands/{sync,check,status}.ts` · `assets/guides/light.md` · `skills/doclib-{build,accept}/SKILL.md` · `doclib/30-features/guides.md`（待建）· `AGENTS.md`/`CLAUDE.md`（本仓 dogfooding）· `.doclib/guide-project.md`（待建）

---

## 一、目的与效果

**定位升级**：引导文件（CLAUDE.md / AGENTS.md）从「图书馆使用说明书」升级为 **agent 的第一入口**——既有 DocLib 工作流规则，又有本项目自身的知识反哺。

**要达到的效果**：

1. **图书馆反哺**：建馆完成后，repo 的关键信息（架构速览、重要规则、模块地图、命令速查）从图书馆蒸馏回流到引导文件，agent 会话冷启动不必进馆翻找。
2. **三区契约**：managed（doclib 规则，CLI 再生）+ project（图书馆反哺，sync 注入）+ custom（项目手写，sync 保留），真相源各自清晰。
3. **单源防漂移**：反哺内容真相在簿记 `.doclib/guide-project.md`，两份引导文件中的 project 区是注入渲染物——「仅再生，禁止直改」（与 graph 输出「仅候选禁止直接入馆」对偶）。
4. **双闸检测**：蒸馏过期（馆变了反哺没跟上）与注入漂移（有人直改 project 区）都纳入 `doclib check` 强验证。

**边界判据**（三区归属，agent 可执行）：真相在图书馆的进 project 区；真相只在引导文件里的进 custom 区（如本仓「assets/ 勿入棺」类工作约定）。

## 二、问题点（现状缺陷）

1. **引导文件只有工作流规则，没有项目知识**——light 模板 managed 区讲的全是「怎么用图书馆」，agent 每次会话要回答「这项目架构是什么/硬规则有哪些/命令怎么跑」都必须进馆翻找，冷启动成本高。
2. **建馆成果无法回流**——custom 区是唯一的项目内容区，但纯手写、与图书馆零联动；图书馆建成后的丰富知识（20-modules、decisions、conventions）对引导文件不可见。
3. **full.md 死资产**——`assets/guides/full.md`（97 行完整引导）从未接线（`runInit` 只认 `light|none`，`init.test.ts:105` 固化 `full` 抛错），且其 managed 区远超 150 行预算，与「引导要瘦」哲学直接冲突。

## 三、研究结果（代码实际情况）

**写入链路**：`init.ts:60` / `sync.ts:25` → `writeGuides(root, "light", targets)`（guides.ts:53）→ 逐文件三岔路：

| 现状 | 行为 |
| --- | --- |
| 文件不存在 | 直接写渲染模板 |
| 有戳但无 custom 标记（legacy） | 整体再生，报告提示查 git diff |
| 有戳且有 custom 标记 | `mergeGuide`：新模板整体 + 保留旧 custom 区（guides.ts:42） |
| 无版本戳 | 跳过不动（保护手写文件） |

**检测面（现状三层）**：
- 版本戳 `<!-- doclib-guide cli=x structure=n -->`（`parseGuideStamp`，guides.ts:36）——cli/structure 不符 → status/verify 报「过期 → doclib sync」
- `managedRegionFresh`（guides.ts:88）——managed 区内容与模板不符 → `check` 报 `guide-stale`（check.ts:153 → commands/check.ts:14 标签「引导过期」，strict 门禁可阻断）
- `GUIDE_BUDGET_LINES = 150`（guides.ts:117）——managed 区行数软预算，status 报 ⚠ 超限

**agent 映射**（agents.ts:10）：claude→`CLAUDE.md`；opencode/cursor/generic→`AGENTS.md`；双 agent 时同名文件只写一份。

**可复用基建**：`hashDocs`（core/ledger.ts，snapshot.ts:18 在用）产出图书馆文档账 hash——可作蒸馏过期判据（馆文档变了 → hash 变 → 反哺过期），且 `.doclib/guide-project.md` 本身在馆外，无自指问题。

**测试布局**：`guides.test.ts`（区域/预算/新鲜度）+ `sync.test.ts`（11 用例固化两区契约，含「无变化」幂等判定）+ `check.test.ts`（引导过期检出）。清单 5 的 mergeGuide 扩展会改变「无变化」判定（project 注入参与），相关断言需同步演进——预期内契约升级。

**其他事实**：skills 源在根 `skills/`（构建时 copy-assets 进 `dist/assets/`）；feature-map 最新 #31；ADR 表格格式最新 #17；CLI 0.5.1 / structure v3；本仓引导文件是两区版本，sync 升级即 dogfooding 验证升级路径。

## 四、设计方案

### 4.1 三区结构

```
<!-- doclib-guide cli=%CLI_VERSION% structure=%STRUCTURE_VERSION% -->
# DocLib 工作流
<!-- doclib:managed-begin -->  工作流规则（CLI 模板再生，现状不变）
<!-- doclib:managed-end -->
<!-- doclib:project-begin -->  图书馆反哺区（真相在 .doclib/guide-project.md，sync 注入）
<!-- doclib:project-end -->
<!-- doclib:custom-begin -->   项目手写区（sync 保留，现状不变）
<!-- doclib:custom-end -->
```

### 4.2 反哺链路（MVP：agent 蒸馏）

```
doclib-build / doclib-accept 收尾（agent 读馆蒸馏，五段：项目定位/架构速览/模块地图/硬规则/命令速查）
  → 写 .doclib/guide-project.md（frontmatter: snapshot=蒸馏时基线版本, docs-hash=蒸馏时 hashDocs 结果）
  → doclib sync 读取并注入 CLAUDE.md 与 AGENTS.md 的 project 区（单源 → 两份天然一致）
```

- 无 `.doclib/guide-project.md`（新项目/未蒸馏）→ project 区为占位文案（「建馆完成后由 doclib-build/accept 蒸馏填充」），**不报违规**（空状态合法）。
- 每条反哺知识带馆内路径引用，形成「摘要 → 馆」跳转关系；反哺区不是图书馆缩印本，是「会话冷启动包」。

### 4.3 双闸检测

| 闸 | 判据 | 报告面 | 解除方式 |
| --- | --- | --- | --- |
| 蒸馏过期 | guide-project 的 `docs-hash` ≠ 当前 `hashDocs` | check 新违规类 `guide-feed-stale`（标签「反哺过期」，strict 可阻断） | agent 重新蒸馏更新 guide-project → sync |
| 注入漂移 | 引导文件 project 区 ≠ 簿记注入结果（并入 managedRegionFresh 检测面） | check 报引导过期（现有 kind） | doclib sync 修复 |

### 4.4 配套

- project 区预算 `PROJECT_BUDGET_LINES = 50`（`guideBudgetReport` 扩展，status 报告，软约束）
- full 档退役：删 `assets/guides/full.md`，`GuideTier` 收窄 `"light"`
- 版本 0.5.1 → 0.6.0；`.doclib/guide-project.md` 自承载蒸馏元数据，state.json 无新字段

## 五、备选方案（已评估否决）

| 备选 | 否决理由 |
| --- | --- |
| agent 直接编辑两份引导文件 project 区（双写） | 蒸馏产物写两遍易漂移，违背「仅再生禁止直改」；簿记单源天然一致且可被 check 审计 |
| 机器蒸馏（CLI 解析馆结构自动生成 project 区） | 「重要架构说明」的语义级重要性判断机器做不准；MVP 交 agent，机器骨架提取后置（不在本期） |
| snapshot 时直接写引导文件 | 馆变 ≠ 引导必须变；snapshot 是「馆变了」的事实时刻，sync 是「引导刷新」的执行时刻，职责分离 |
| 保留 full.md 作静态完整档 | 与 project 反哺区职责重叠（反哺 = full 档想做的事的正确打开方式：动态而非静态模板）；与 150 行预算哲学冲突 → 退役 |
| 前轮已否决项（双写治理三路线 / full 档接线 / agent 差异化 / 触发主动化） | 用户裁决：聚焦「图书馆反哺」，其余属无病呻吟 |

## 六、实施清单

```
实施清单：
1. 创建 .plan/2026-10-26/guide-feed.md 规划载体（本文件）
2. feature-map 登记 #32（planned）
3. 修改 assets/guides/light.md：插入 project 区标记与占位、更新维护行文案
4. 删除 assets/guides/full.md
5. 扩展 src/core/guides.ts：三区常量、project 读取/渲染/注入、mergeGuide 扩展、新鲜度与预算扩展、GuideTier 收窄
6. 扩展 src/core/check.ts：guide-feed-stale 蒸馏过期检测 + CheckFinding 类型扩展
7. 扩展 src/commands/check.ts：kindLabel "反哺过期"
8. 扩展 src/commands/status.ts：反哺区状态报告
9. 更新 src/core/version.ts 至 0.6.0
10. 扩展测试（guides.test.ts / sync.test.ts / check.test.ts）
11. 运行 npm run typecheck && npm test，全绿
12. 本仓 dogfooding：蒸馏创建 .doclib/guide-project.md → doclib sync → 两份引导文件三区落位
13. 临时目录冒烟：init --agents claude,opencode → sync → 变更 guide-project → sync → 篡改 project 区 → check 报违规 → sync 修复 → check 归零
14. 新建 doclib/30-features/guides.md 规格 + 两级索引登记
15. 登记 ADR #18 至 doclib/10-architecture/decisions.md
16. feature-map #32 → implemented + progress.md 补记
17. 更新 skills/doclib-build/SKILL.md 与 skills/doclib-accept/SKILL.md 收尾步骤
18. doclib snapshot 固化基线
```

## 七、验收标准（Given/When/Then）

| # | 验收标准 |
| --- | --- |
| AC-1 | Given 全新临时目录，When `doclib init --agents claude,opencode`，Then 两份引导文件含三区标记，project 区为占位文案 |
| AC-2 | Given 旧两区引导文件（有戳有 custom），When `doclib sync`，Then 升级为三区、custom 原样保留、project 区注入 |
| AC-3 | Given `.doclib/guide-project.md` 存在，When `doclib sync`，Then CLAUDE.md 与 AGENTS.md 的 project 区一致且等于簿记注入结果 |
| AC-4 | Given 手工篡改引导文件 project 区，When `doclib check`，Then 报引导过期；`doclib sync` 后 check 归零且 project 区恢复注入结果 |
| AC-5 | Given 馆文档变更（docs-hash 变化）且 guide-project 未更新，When `doclib check`，Then 报「反哺过期」；重新蒸馏更新 guide-project（含新 docs-hash）后 check 归零 |
| AC-6 | Given project 区超 50 行，When `doclib status`，Then 报 ⚠ 超限提示 |
| AC-7 | Given 无 `.doclib/guide-project.md`，When `doclib check`，Then 不报反哺过期（空状态合法，无误报） |
| AC-8 | When `npm run typecheck && npm test`，Then 全绿；`assets/guides/full.md` 已删除 |
| AC-9 | 本仓 dogfooding：`.doclib/guide-project.md` 蒸馏落位，本仓 `AGENTS.md`/`CLAUDE.md` 三区生效且 custom 区内容无损 |
