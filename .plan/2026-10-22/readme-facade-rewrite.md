# README 门面重写 + CONTRIBUTING 新建包（readme-facade-rewrite）

- 日期：2026-10-22
- 状态：规划完成，待批准执行（EXECUTE 未启动）
- 关联：Q21（README 保留独立摘要）｜Q20（根 README/CHANGELOG/LICENSE/CONTRIBUTING 豁免）｜PRD §5 非目标（不克隆）｜PRD §7 双层结构｜design.md §2 设计原则｜AGENTS.md 实时同步规则
- 规划载体：本对话（RIPER-5 RESEARCH → INNOVATE → PLAN 三段；研究含：源码实测 32 次命令核验、43 仓治理数据回源、`src/core/orphan.ts` 豁免逻辑逐行核对、临时目录真实运行 init/plan/place/graph）
- 关联产物：`README.md`（重写）、`CONTRIBUTING.md`（新建）、`doclib/10-architecture/overview.md`（必改 L31 + 可否决失真修正）、`doclib/00-overview/feature-map.md`（登记 planned）、`doclib/00-overview/progress.md`（补记）
- 前置状态：图书馆版本 36 / revision 27 / 基线 snap-036 / 治理 100/100 (A) / `doclib check` 违规 0

---

## 一、想达到什么目的和效果

### 1.1 目的

现 `README.md`（130 行）是一份**规格摘要**，不是一份**门面叙事**：读者读完知道 DocLib 有哪些命令，却不知道「我的痛是不是它的痛」「它凭什么比其他做法靠谱」「我该怎么参与」。本包要把 README 重写为**面向新用户的门面文档**，按五诉求组织：

1. **为什么做这个仓库** —— 把动机从馆内 PRD/ADR/实证里提炼到首屏，而不是让读者自己去 `doclib/` 挖
2. **现实的文档治理问题在哪里** —— 把抽象痛点翻译成可自我识别的失效场景，并配上真实数据（不是宣称，是实测）
3. **怎么快速使用** —— 决策表分流 + 可直接粘贴的命令路径，取代现在平铺的 5 条流程块
4. **项目原理说明** —— 三条可迁移铁律取代功能罗列，读者带走的是心智模型而非清单
5. **怎么参与贡献** —— 本仓库此前完全没有贡献路径（无 CONTRIBUTING.md、无模板、GitHub 描述为空）

### 1.2 预期效果（可验证）

| 编号 | 效果 | 判据 |
| --- | --- | --- |
| E-1 | 新用户在 30 秒内知道自己的处境该走哪条路 | 首屏决策表 4 行齐全，每行给出可直接粘贴的首条命令 |
| E-2 | README 自证价值而非自夸 | 「为什么需要它」6 场景每条带馆内实证数字，且数字表每行标注来源路径 |
| E-3 | 读者理解原理后可自行判断适用边界 | 三条铁律 + 双层结构说明 + 「不是什么」声明齐全 |
| E-4 | 命令文档零漂移 | README 每条命令在临时目录实测通过；命令表以 `src/cli.ts` HELP 为唯一对照 |
| E-5 | 贡献者零迷路即上手 | CONTRIBUTING.md 覆盖环境/地图/约定/测试/文档纪律/vendored 纪律/发版 7 件事 |
| E-6 | 门面改动不制造新的治理债 | `doclib check` 违规 0、治理分维持 100/100 (A)、无新增孤儿、馆内联动已同步 |

### 1.3 不在本次范围

- 不改 `src/**`、`skills/**`、`assets/**`、`package.json`、任何测试
- 不做 GitHub 侧门面资产（仓库 description、issue/PR 模板、CHANGELOG）——用户已裁决另开任务
- 不新增功能、不改 CLI 行为、不改版本号
- 不把 README 写成 PRD 副本：细节一律外链馆内对应卷（防同一事实两处维护）

---

## 二、问题点

### 2.1 现状逐段诊断（现 README 130 行）

| 行段 | 内容 | 诊断 |
| --- | --- | --- |
| L3-5 | 3 徽章 | ✅ 保留，URL 不动 |
| L7-13 | 一句话定位 + 非克隆 + 先查馆再查码 + 大 repo 友好 | ❌ 术语密度过高，首次访问者 30 秒内无法判断"这解决我的什么痛"；动机为零 |
| L15-21 | 「三件事」表 | ⚠️ 讲能力清单，不讲边界（不能做什么）与适用前提 |
| L23-29 | 5 条流程代码块 | ⚠️ 场景全，但无入口指引，读者不知从哪条开始 |
| L31-47 | 安装（npx / 本地构建） | ✅ 准确（已核对 `package.json` bin 名与 scripts） |
| L49-73 | 快速开始 / 保活循环 / 从零复原 | ⚠️ 三场景平铺、无优先级，新读者需自行判断"我是哪种情况" |
| L75-92 | 12 行命令表 + 通用选项长句 | ⚠️ 密度过高；`place` 的 5 个子动作被压成一行 |
| L94-122 | 12 卷目录树 + 5 条设计要点 | ⚠️ 树形与实际骨架一致（已核对 `assets/templates/library/` 24 文件），但"为什么分 12 卷、为什么双层"未解释 |
| L124-126 | 「设计」→ prd/design 外链 | ⚠️ 唯一外链，权重过低 |
| L128-130 | License | ✅ |

### 2.2 五诉求 × 现状差距矩阵

| 诉求 | 现状 | 差距 | 本包对策 |
| --- | --- | --- | --- |
| 为什么做 | 无动机叙述 | PRD §1 的 5 条痛点、13 条 ADR、6 条实证教训**一条未进 README** | 3.2 痛点场景化 + 3.3 传统做法对照 |
| 治理问题在哪 | 无问题陈述 | 43 仓实测、孤儿误报、基准数据**全部缺席** | 3.2 场景表配实证列 + 3.10 数字表 |
| 快速使用 | 有但散 | 缺"我是哪种情况"的分流 | 3.1 决策表 + 3.5 快速开始 |
| 原理 | 散落 3 句 | 北极星/非克隆/先馆后码/三层保活/归位宪法均未成篇 | 3.4 三条铁律 + 双层结构 |
| 参与贡献 | **完全没有** | 无 CONTRIBUTING.md、无模板、GitHub 描述为空 | 新建 CONTRIBUTING.md + README 入口 |

### 2.3 缺失资产（仓库现状）

| 缺失项 | 实测 |
| --- | --- |
| `CONTRIBUTING.md` | 不存在 |
| issue / PR 模板 | `.github/` 下仅 `workflows/release.yml` |
| CHANGELOG | 不存在（发版记录散在 `progress.md` 与 git log） |
| 架构图 / 流程图 | README 仅 1 个 ASCII 流程块，无图片资源 |
| GitHub 仓库描述 | `gh repo view` 实测 `description: ""` |
| 可引用的编码约定 | `doclib/40-guides/conventions.md` 内容仍为 TODO 占位 → **不可作为引用源**，贡献细则改引 `AGENTS.md` custom 区 |

---

## 三、研究结果

### 3.1 馆内素材盘点（"为什么/痛点/原理/贡献"的原料已在仓库内）

| 需要的内容 | 素材位置 | 可引用的实证 |
| --- | --- | --- |
| 痛点（治理问题） | `doclib/10-architecture/prd.md` §1（5 条）、v0.17/v0.18 增补 | 第 5 条「文档资产失序」：知识散落、无单一事实源、序号型资产编号无权威、过程知识干完即散；「即使采用了 SDD 类工具，spec 完成即冻结，治理问题依旧」 |
| 为什么（动机） | PRD §2 北极星原则 / §2 查询顺序理念 / §5 非目标 | 「复刻不是目的，是完备度校准标尺」「活/可用/利于开发」 |
| 原理 | PRD F1-F16 + `design.md` §2（5 条设计原则） | 职责切分：CLI 管状态与事实、skills 管知识与方法论 |
| 痛点实证 | `doclib/95-lessons/lessons.md`（6 条） | ①同题共答 96.4% 但实缺 12 端点/39 页（循环论证）②43 仓工具链误报 2,052 ③豁免闭集必然滞后 ④"排除"一刀切丢跟踪语义 ⑤frontmatter 空值解析陷阱 ⑥忘记调用落盘函数 |
| 方法论可信度 | `doclib/40-guides/benchmark.md` | 目的铁律、三阶段模型 P1/P2/P3、七步闭环、缺陷四分类、污染防护 |
| 实证数据 | `doclib/50-testing/benchmark/010~090` | umami：建馆 97% 覆盖、治理 A、复原 124 路由/26 模型/6.7 万行、双跑 96.4%（53/55）→ 回归 100% |
| 图谱实测 | `doclib/50-testing/acceptance-graph-v0.5.0.md` | 5 仓实测；memos 1,167 文件/22,637 符号/66,909 边/89 路由/2.7s；umami 1,398 文件/**261 路由** |
| 决策取舍 | `doclib/10-architecture/decisions.md`（ADR #1-#13） | 每条含「背景 / 被否备选 / 后果」——天然的设计理由素材 |
| 贡献规范 | `AGENTS.md` custom 区 + `50-testing/testing.md` + `FORK-NOTES.md` + ADR #5 | 见 §4.5 |

### 3.2 仓库事实基线（全部实测，可直接写入 README）

- 发布物 `@panxiangyu1995/doclib@0.5.0`，MIT，bin 名 `doclib`，engines `node >=22.5.0 <25`
- CLI **13 命令**：`init plan diff snapshot status verify sync check ack place hook reconcile graph`（`src/commands/` 14 文件，含 testkit）
- Skills **10 个**：build/update/rebuild 三核心 + dev★/bootstrap/resume/setup/reconcile/audit/accept
- 图书馆骨架 **24 文件**：12 卷叙述层 + `INDEX.md` + `README.md` + 登记簿族（首批 5 册：api/ui-assets/routes/config/events，分散挂靠各卷）+ `99-archive/`
- 测试 **32 文件 / 240 用例**（实测 `find src -name '*.test.ts' | wc -l` = 32；`50-testing/testing.md` 记「31 个测试文件」→ 存在 1 处陈旧）
- 源码规模：非测试 **4,378 行** / 测试 **3,719 行**
- 本仓库自治理：图书馆版本 36、revision 27、基线 snap-036、治理 **100/100 (A)**、`check` 违规 0
- 治理实测：43 仓样本判孤儿 36,086（含工具链类误报 **2,052**，均值 ≈48/仓、AI 工具仓最高 171）→ 修正后 34,034，工具链类误报清零、真知识目录 23,920 不变
- 图谱实测：5 仓；umami 1,398 文件 261 路由（compat 端点族正是 umami 基准轮漏登项 → 缺口发现能力实证）
- 发布链：`.github/workflows/release.yml` 仅 `git tag v*` 触发 → `npm ci → npm test → npm publish --provenance --access public`（需 `NPM_TOKEN`）；**无 PR/issue 触发式 CI**
- 运行时依赖：4 个纯 JS（ignore / jsonc-parser / picomatch / web-tree-sitter）+ vendored codegraph（git subtree v1.6.2 MIT，CJS 岛编译，telemetry 物理隔离）

### 3.3 兼容性验证结论（实测，非推断）

| 验证项 | 方法 | 结论 |
| --- | --- | --- |
| 新建 `CONTRIBUTING.md` 是否触发孤儿违规 | 读 `src/core/orphan.ts:53` `EXEMPT_ROOT_FILES = ["README.md","CHANGELOG.md","CONTRIBUTING.md"]` + `classifyExternalDoc` + `scanExternalDocs` | ✅ 根级门面文件归「项目门面文件（生态惯例）」→ 判 toolchain，**不判孤儿、无需 ack** |
| README 重写是否影响治理分 | `doclib check` 现为 100/100(A)、违规 0 | ✅ 门面文件本就豁免，判定不变；但**文档账会变 → 须重跑 check + snapshot**（revision +1） |
| 命令表与 CLI 一致性 | 比对 `src/cli.ts` HELP 与 `src/commands/` 13 文件 | ✅ 需执行期逐条核对；现 README 已知缺陷：`place` 5 个子动作被压成一行 |
| 馆内引用是否需联动 | grep `doclib/**` 中 README 相关描述 | ⚠️ **`doclib/10-architecture/overview.md` L31 逐项描述 README 现有结构，且该文件 `covers: README.md`** → README 重写必然触发该文件的实时同步义务（锚点义务，非额外发挥） |
| 馆内是否存在需要新建的登记 | grep `CONTRIBUTING` 于 `doclib/` | ✅ PRD §7.5 / Q20 已明确根 CONTRIBUTING.md 为豁免门面文件，无缺失登记 |
| 路径引用有效性 | 核对 `doclib/10-architecture/{prd,design}.md`、`doclib/INDEX.md`、`doclib/50-testing/benchmark/` | ✅ 均存在；`doclib/40-guides/conventions.md` 为 TODO 占位，**不得引用为编码约定源** |
| Node 约束 | `package.json` engines + PRD v0.30 | ✅ README 须注明 graph 需 Node ≥22.5，缺失优雅降级不阻塞核心 |

### 3.4 关键发现（三条）

**发现一：README 必须自己遵守本项目的治理哲学。** 现 README 把命令表与速查写全、细节不外链，导致同一事实（命令语义）在 README 与 `src/cli.ts` 两处维护 → 必然互相腐化（已发生：`place` 描述过密、命令数与 `overview.md` L31 写的「12 命令表」不符——实际 13）。对策：**README 只写"读者需要的抽象 + 指路"，命令语义单点留在 CLI**；所有数字集中成表并标注来源路径。

**发现二：门面文件是"孤儿检测豁免"里的既定生态惯例，新建 CONTRIBUTING.md 零治理成本。** 这降低了"新建文件触发违规"的顾虑——但反过来说，**豁免不等于免维护**：README 与 CONTRIBUTING.md 的内容准确性靠"发版前核对数字表"的纪律兜底（写入 CONTRIBUTING.md §8）。

**发现三：本次改动的连带面比预想的小。** 真正必须联动的只有 1 个文件 1 行（`overview.md` L31）；其余发现的陈旧数字（INDEX.md 的「14 条目/十则/3 条」、design.md 头部「对齐 PRD v0.13」、feature-map 的失效 `covers: docs/`）与本次主题无关，作为**可否决的失真修正批次**单列，避免范围蔓延。

---

## 四、代码实际情况

### 4.1 CLI 实际行为（临时目录实测，非文档转述）

`/tmp/dl-demo` 实跑 `init`/`plan` 的真实输出文案：

```
已初始化 DocLib (structure v3):
- 图书馆模板: doclib/ (24 个文件)
- agents: generic
- skills 落位: 无
- 规划载体: .plan/
- 引导文件: 写入 AGENTS.md
- 簿记: .doclib/
- 知识图谱: 未启用（doclib graph index 可随时启用）

下一步:
1. doclib plan                 # 生成 BUILD 构建任务书（含项目清单）
2. 让 agent 加载 doclib-build skill，按任务书构建图书馆
3. doclib verify && doclib snapshot --note "initial build"
```

`doclib plan` 输出：`已生成任务书: BUILD-001.md` + 位置 + `revision: 0` + 待归档提醒；任务书实际落盘于 `.doclib/tasks/BUILD-001.md`，内含「项目清单（CLI 自动采集）+ 顶层结构 + 执行要求」。
`doclib place list` 输出：`待归位文档: 0（馆外无待处置文档）`；`doclib graph status` 输出：`知识图谱: 未初始化（运行 doclib graph index 建图）`。
→ **README 的命令块不得写出与以上不一致的提示语。**

### 4.2 Skills 现状

`skills/` 源目录 10 个 SKILL.md；`init` 时按 `src/core/agents.ts` 的 `AGENT_TARGETS` 分发：

| agent id | skillsDir | guideFiles |
| --- | --- | --- |
| claude | `.claude/skills` | `CLAUDE.md` |
| opencode | `.opencode/skills` | `AGENTS.md` |
| cursor | null（仅引导） | `AGENTS.md` |
| generic | null | `AGENTS.md` |

→ README 写「`--agents claude,opencode` 落位 10 个 skills」准确；cursor/generic 只落引导文件，须在 CONTRIBUTING 里说清。

### 4.3 馆内联动点

| 文件 | 行 | 触发原因 | 动作 |
| --- | --- | --- | --- |
| `doclib/10-architecture/overview.md` | L31 | 该文件 `covers: README.md`，L31 逐项描述 README 现有结构 | **必改**：改为新 README 结构描述 + 补 `CONTRIBUTING.md` 为门面文件 |
| 同上 | L14 / L22 / L29 | 失真：PRD 版本 v0.23→v0.30、模板 23→24 文件、check「6 类违规」→9 类 | 可否决 |
| `doclib/00-overview/feature-map.md` | — | 双锚点锚点一：登记本次规划为 planned | 必做（新增一行 planned 条目） |
| `doclib/00-overview/progress.md` | 末尾 | 进度账补记 | 必做（追加一条事件） |

### 4.4 孤儿检测与豁免

- 判定面：`src/core/orphan.ts` → 四态（馆内 / 非文档资产 / 工具链豁免 / 待归位）；根级 `README.md`/`CHANGELOG.md`/`CONTRIBUTING.md` 归「项目门面文件（生态惯例）」→ 不判孤儿
- 本次新增 `CONTRIBUTING.md` 落在豁免清单内 → `doclib check` 不新增违规（已核实 `src/core/orphan.ts:53` 与 `classifyExternalDoc` 分支）
- 规划载体 `.plan/` 已在 `state.planning` 声明 → 载体文件不进快照、不进图书馆、不判孤儿（PRD F9 双轨边界）

### 4.5 约定与纪律来源（贡献细则的事实源）

| 纪律 | 来源 |
| --- | --- |
| ESM（相对导入带 `.js` 后缀）、strict + `noUncheckedIndexedAccess`、源码不写注释、错误一律抛 `DoclibError` | `AGENTS.md` custom 区 + `tsconfig.json` |
| 测试文件与被测模块同目录 `*.test.ts`；**测试入口显式列出文件**（Node 24 `node --test <目录>` 会失败） | ADR #5 + `package.json` |
| 新增命令须同步新增冒烟路径 | `50-testing/testing.md` |
| 不可逆动作类功能必须三段验收（干跑零副作用 → `--apply` 后状态正确 → 还原路径可用） | `50-testing/testing.md` |
| 改 `assets/` 后必须先 build 再 `doclib sync` | `95-lessons`（2026-10-19 条） |
| `vendor/codegraph/` 就地改动必须登记 `FORK-NOTES.md` | `FORK-NOTES.md` |
| 改动触及任一卷知识 → 同会话实时入馆；`.plan/<日期>/` 双锚点；入馆写前后比对 revision | `AGENTS.md` managed 区 |
| 术语以 `prd.md` §4 为准 | `AGENTS.md` custom 区 |

---

## 五、设计的方案

### 5.1 方案裁决过程

| 阶段 | 产出 | 裁决 |
| --- | --- | --- |
| RESEARCH | 现状逐段诊断 + 素材盘点 + 事实基线 + 缺口 + 风险 | 五诉求与素材全部对齐，进入 INNOVATE |
| 用户拍板（提问工具） | 首屏受众=新用户优先｜篇幅 200-300｜贡献指引新建独立文件｜数字进表集中呈现｜GitHub 资产另开任务 | 锁定 5 项取向 |
| INNOVATE | 三套信息架构：A 叙事驱动 / B 门面分层 / C 证据驱动 | **裁决：A 为主干 + B 决策表 + C 证据表格化** |
| PLAN | 逐节规格 + 行数预算 + 实施清单 + 验收判据 | 待批准 |

### 5.2 README 章节蓝图（行数预算 260-300，硬上限 300）

| # | 章节 | 行数 | 内容要点 | 素材来源 |
| --- | --- | --- | --- | --- |
| 0 | 头部 + 一句话定位 + 「不是什么」+ TOC | 16+16 | 3 徽章（URL 沿用）· 定位句改写 · TOC 12 条（锚点安全） | PRD §5 |
| 1 | `30 秒上手` | 14 | 决策表 4 行：处境 × 首句命令 × 后续动作 | PRD F1/F3/F8 |
| 2 | `为什么需要它` | 34 | 6 失效场景表：场景 × 现象 × 机制 × 实证 | PRD §1 + lessons |
| 3 | `传统做法为什么不够` | 16 | 4 行对照表：做法 × 失效点 × 差别 | PRD v0.17/v0.18/v0.30 |
| 4 | `工作原理` | 40 | ASCII 系统图 14 + 三条铁律 18 + 双层结构 8 | design.md §1/§2 + PRD §2/§7 |
| 5 | `快速开始` | 34 | 4 条路径（存量接管/新项目/半成品/只复原） | CLI 实测 |
| 6 | `日常开发循环` | 16 | 三层保活表 + 治理执法一行 + 状态事实源提示 | PRD F2/F13 |
| 7 | `文档图书馆结构` | 28 | 12 卷树 + 登记簿挂靠表 + 归位宪法一句 | 骨架实测 + PRD Q25 |
| 8 | `命令参考` | 30 | 13 命令分组表 + 6 关键选项；`place` 展开 5 子动作 | `src/cli.ts` HELP |
| 9 | `Skills 参考` | 16 | 10 skill 表：何时加载 × 关联命令 | `skills/` + PRD F7 |
| 10 | `项目现状与实证` | 18 | 11 行数字表（每行标来源）+ 表下纪律行 | §3.2 实测 |
| 11 | `参与贡献` | 14 | 3 类入口 + 3 条必守纪律 + CONTRIBUTING.md 外链 | §4.5 |
| 12 | `设计文档` + `License` | 10 | 5 份馆内文档外链 + MIT | 现有 |

### 5.3 关键文案定稿（需在执行期原样落地）

**定位句**（替换现 L7）：
> 让项目文档从「写完就烂的说明」变成「随代码演化的可执行规格」——任何 agent 或人只读这套文档，就能在别处从零重建该项目（功能复原 ≥90%）。

**痛点场景表 6 行**（场景 / 现象 / 机制 / 实证）：

| # | 场景 | 现象 | 机制 | 实证 |
| --- | --- | --- | --- | --- |
| 1 | 新人/新 agent 上手 | 靠通读源码拼全貌，几天也拼不全 | 12 卷叙述层 + 实体登记簿，先查馆再查码 | umami 建馆：API 登记簿 141 条、路由 60 页 |
| 2 | 文档随代码腐烂 | 代码改了文档没改，半年后没人敢信 | 三层保活 + `check` 双账本强制对账 | 本仓库 `check` 治理 100/100 (A)、违规 0 |
| 3 | 文档资产失序 | README/docs/spec/对话导出散落，迁移编号无权威 | 归位宪法 + `place` 四态处置闭环 | 43 仓实测：工具链类误报 2,052 条，修正后清零 |
| 4 | 过程知识干完即散 | 规划、踩坑、决策理由随对话蒸发 | `.plan` 双锚点 + `95-lessons` 实时入档 | 本仓库 progress.md 记录 30+ 次开发事件 |
| 5 | "做完了"却证明不了 | 验收靠人肉点，没有可执行标准 | `30-features` 每功能一份 Given/When/Then | umami 71 条 AC 双跑：96.4% → 回归 100% |
| 6 | 新项目/半成品没载体 | 规格只存在于聊天记录 | bootstrap/resume 模式 + feature-map 状态事实源 | 本仓库 feature-map 25 条功能项状态可追溯 |

**传统做法对照表 4 行**：

| 常见做法 | 怎么失效 | DocLib 的差别 |
| --- | --- | --- |
| README + `docs/` 一次性文档 | 代码演进即腐烂，无人维护 | 实时同步 + `check` 双账本对账，腐烂可被机器发现 |
| SDD 工具（spec-kit / OpenSpec） | spec 完成即冻结，治理问题依旧 | 载体兼容：只回收知识不接管工作流，知识按双锚点回流 |
| AI 一次性生成文档 / 图谱 | 生成即死，与代码再无关联 | 细粒度保活三角：实体级 covers + CLI 出候选（agent 撰写裁决）+ 实时同步 |
| 直接让 agent 读源码 | 能跑通，但拿不到意图与边界行为 | 非克隆：文档承载行为、契约、设计意图与验收标准 |

**三条铁律**：
1. **非克隆** —— 文档承载行为、契约、设计意图与验收标准，不是字节（≤10 行示意片段除外）→ PRD §5 非目标
2. **先馆后码** —— 图书馆是唯一事实源；实体问题（某 API 字段、某图标用在哪）从登记簿直达，查码所得回填建账（查询即飞轮）→ PRD §2
3. **馆随码走** —— 实时层（当场入馆）+ 流程层（双锚点）+ 兜底层（diff→plan→check）三层保活；图书馆是开发的输入，不是事后产物 → PRD F2

**数字表 11 行**：包/版本 · License/Node · 命令数/Skills 数 · 骨架 · 测试 · 源码规模 · 本仓库治理 · 基准成绩 · 基准规模 · 治理实测 · 图谱实测（每行标来源路径）。

### 5.4 CONTRIBUTING.md 规格（目标 120-170 行）

| # | 章节 | 必含内容 | 事实源 |
| --- | --- | --- | --- |
| 0 | 头部 | 一句话定位 + 指向 README 的链接 | — |
| 1 | 参与方式 | 三类贡献（问题 / 文档 / 代码）+ 入口 + 响应预期（不承诺时限，评审看可复现与判据清晰） | — |
| 2 | 环境准备 | Node `>=22.5 <25`（graph 需 ≥22.5，核心不依赖）→ `npm install` → `npm run build` → `npm link` → 校验 `npm run typecheck` / `npm test` / `node dist/cli.js --help` | `package.json` |
| 3 | 仓库地图 | 目录→职责表：`src/cli.ts`（入口/参数/HELP）· `src/commands/`（一命令一文件，返回 `{text,json}`）· `src/core/`（纯逻辑可单测）· `assets/`（模板与引导源，**改这里须先 build**）· `skills/`（10 skill 源）· `vendor/codegraph/`（vendored，见 §7）· `doclib/`（本仓库自己的图书馆）· `.plan/`（规划载体，过程资料不入馆） | 实测 + design.md §7 |
| 4 | 代码约定 | ESM（`.js` 后缀）· strict + noUncheckedIndexedAccess · 源码不写注释 · 错误抛 `DoclibError` · 一命令一文件、纯逻辑入 core · 术语以 `prd.md` §4 为准 | AGENTS.md + tsconfig |
| 5 | 测试要求 | 同目录 `*.test.ts` · **新增测试文件必须加入 `package.json` 显式列表**（ADR #5）· 新命令加冒烟路径 · 不可逆动作三段验收 · 现状 32 文件/240 用例 | testing.md + ADR #5 |
| 6 | 文档同步纪律 | 本仓库以 DocLib 管自己：改动触及任一卷知识 → 同会话实时入馆 · `.plan/<日期>/` 双锚点 · 入馆写前后比对 revision · 会话结束自检四问 | AGENTS.md managed 区 |
| 7 | vendored 改动纪律 | subtree fork（v1.6.2, MIT）· 就地改动必须登记 `FORK-NOTES.md` · 优先 adapter 层 `src/core/codegraph/` 扩展 | FORK-NOTES.md |
| 8 | 发版与评审 | PR → 评审 → 维护者打 `v*` tag → Actions `npm ci → npm test → npm publish --provenance --access public`（需 `NPM_TOKEN`）· 发版前核对 README 数字表 · 回滚 = dist-tag（forward-only） | release.yml + deploy.md |

### 5.5 馆内联动方案

| 文件 | 动作 | 可否决 |
| --- | --- | --- |
| `doclib/10-architecture/overview.md` L31 | 改为描述新 README 结构（价值主张 + 决策表 + 痛点 + 对照 + 铁律 + 快速开始 + 结构 + 参考 + 实证表 + 贡献入口），并补 `CONTRIBUTING.md` | 否（必做） |
| 同上 L14/L22/L29 | 失真修正：PRD v0.23→v0.30、模板 23→24、check 六类→九类 | 是 |
| `doclib/00-overview/feature-map.md` | 新增 planned 条目「README 门面重写 + CONTRIBUTING 新建」，对应文档列 `.plan/2026-10-22/readme-facade-rewrite.md` | 否 |
| `doclib/00-overview/progress.md` | 追加本次事件（日期、关联文件、完成内容、涉及卷、状态变化说明） | 否 |
| `doclib/INDEX.md` | 陈旧计数修正（feature-map 14→25、ADR 十则→十三则、lessons 3→6） | 是（整批） |
| `doclib/10-architecture/design.md` | 头部「对齐 PRD v0.13」→ v0.30 | 是（整批） |
| `doclib/00-overview/feature-map.md` | `covers: docs/` 失效路径（v0.23 已迁走） | 是（整批） |

### 5.6 范围纪律

- 改动仅限：2 个门面文件 + 1 个必联动文件 + 2 个进度账文件
- 不碰 `src/`、`skills/`、`assets/`、`package.json`、测试、GitHub 侧资产
- 失真修正分两批，**可否决**，避免范围蔓延
- 「README 数字表随发版核对」以纪律形式写入 CONTRIBUTING.md §8，而非再加一个自动化门禁（本次不引入新代码）

---

## 六、有无备选方案

### 6.1 信息架构备选（三套，已裁决）

| 备选 | 结构 | 优势 | 劣势 | 裁决 |
| --- | --- | --- | --- | --- |
| A 叙事驱动型 | 痛点→为什么→解法→怎么用→参考 | 新用户读完即懂 | 命令表靠后 | ✅ **采纳为主干** |
| B 门面分层型 | 一句话→决策表→痛点摘要→快速开始→参考 | 扫描效率最高 | 痛点被压成 3 句，说服力弱 | ⚠️ 采纳其决策表，不采纳其薄痛点 |
| C 证据驱动型 | 以 umami 基准故事线开篇 | 可信度最强 | 叙事重，对新项目用户不直接相关 | ⚠️ 采纳其证据，压缩为数字表 |

### 6.2 具体做法的否决与理由

| 备选做法 | 否决理由 |
| --- | --- |
| README 内联完整贡献细则（不建 CONTRIBUTING.md） | 违反「引导裁剪」纪律（删掉会犯错吗→细则该进 skill/馆而非门面）；单文件超载 |
| 用 ASCII 画完整架构图替代文字说明 | 图占 40+ 行且不可检索；原理需可被 agent 引用为文本 |
| 把 12 卷目录树搬进 README 完整版 | 树会随骨架变动漂移；README 只给"每卷一句话"，完整树外链 `doclib/INDEX.md` |
| 引用 `doclib/40-guides/conventions.md` 作为编码约定源 | 该文件内容仍是 TODO 占位，引用即失真 |
| 在 README 内复述 13 条 ADR | 同一事实两处维护必然腐化；只保留"三条铁律"作为可迁移心智模型，细节外链 |
| 把 GitHub 仓库描述/issue 模板一并补 | 用户已裁决另开任务 |
| 引入 README 数字自动校验脚本 | 超出"不改代码"范围；改为发版前人工核对纪律 + 来源路径标注 |
| 保留现「三件事」表作为核心 | 它是能力清单不是心智模型；已被"三条铁律 + 决策表"取代 |

### 6.3 开放问题与默认裁决（未回复即按默认执行）

| 问题 | 默认裁决 |
| --- | --- |
| README 是否保留现有「三件事」表 | 否（已被铁律 + 决策表取代） |
| README 是否保留现有命令表全部选项细项 | 否（只留 6 个改变行为的选项，全量选项外链 `doclib/90-reference/`） |
| CONTRIBUTING.md 是否含中英双语 | 否（仓库语言为中文） |
| 是否为本次改动新增 feature-map 条目 | 是（双锚点锚点一，规划文档完成即登记 planned） |
| 失真修正批次是否执行 | 待批准时由用户勾选，默认保留在清单中但标记为可否决 |

---

## 七、具体的实施清单

> 32 项原子操作，编号即执行顺序。每项完成后在会话内标记。

**阶段一 · 基线记录**
1. 记录执行前基线：`git status` 确认工作区干净、`doclib status` 记录 revision/治理分、备份现 README 内容到临时目录备查

**阶段二 · README 主体**
2. 起草头部：标题 + 3 徽章（URL 沿用）+ 新定位句 + 「不是什么」一行 + 12 条 TOC（锚点安全）
3. 写 `## 30 秒上手` 决策表（4 行）
4. 写 `## 为什么需要它`（6 场景表，数字回源）
5. 写 `## 传统做法为什么不够`（4 行对照表 + 来源小字）
6. 写 `## 工作原理` 之 ASCII 系统图（按 design.md §1 语义重绘）
7. 写 `## 工作原理` 之三条铁律 + 外链
8. 写 `## 工作原理` 之双层结构说明
9. 写 `## 快速开始` 4 条路径命令块
10. 临时目录逐条实测第 9 步命令，修正文案至与真实输出一致
11. 写 `## 日常开发循环`（三层保活表 + 治理执法 + 状态事实源提示）
12. 写 `## 文档图书馆结构`（12 卷一句话表 + 登记簿挂靠 + 归位宪法）
13. 写 `## 命令参考`（13 命令分组表 + 6 关键选项；`place` 展开 5 子动作）
14. 写 `## Skills 参考`（10 skill 表）
15. 写 `## 项目现状与实证`（11 行数字表 + 来源 + 纪律行）
16. 写 `## 参与贡献`（3 类入口 + 3 条纪律 + 外链）
17. 写 `## 设计文档` 与 `## License`

**阶段三 · README 自检**
18. 行数校验与压缩：`wc -l README.md` ∈ [200,300]，超出优先压缩命令参考与快速开始
19. TOC 锚点校验：12 条逐条核对（标题避开 `/`、`` ` ``、括号等被 GitHub 清洗的字符）
20. 事实校验：数字表 11 行逐项回源核对（`package.json` / `src/` / `doclib/`）
21. 命令校验：README 全部命令在临时目录再跑一遍，确认无失效命令与错误提示语

**阶段四 · CONTRIBUTING.md**
22. 新建第 1-4 节（参与方式 / 环境准备 / 仓库地图 / 代码约定）
23. 新建第 5-8 节（测试要求 / 文档同步纪律 / vendored 改动纪律 / 发版与评审）
24. 校验：行数 ∈ [100,180]；所有路径存在；所有命令与 `package.json` scripts 一致

**阶段五 · 馆内联动**
25. 更新 `doclib/10-architecture/overview.md` L31（必做）
26. （可否决）同文件 L14/L22/L29 失真修正
27. （可整体否决）`doclib/INDEX.md` 陈旧计数 + `design.md` 头部 PRD 版本 + `feature-map.md` 失效 `covers: docs/`
28. `doclib/00-overview/feature-map.md` 登记 planned 条目

**阶段六 · 治理与收尾**
29. `doclib check`：违规 0、治理 100/100 (A)、无新增孤儿
30. `doclib snapshot --note "docs: README 重写 + CONTRIBUTING 新建"`，确认 revision +1
31. `npm run typecheck` 与 `npm test`（未改代码，应保持 240/240 绿）
32. `doclib/00-overview/progress.md` 补记 + 输出 REVIEW 报告（逐条对照清单、标记偏差、给出「实施与计划完全匹配 / 偏离计划」结论）

---

## 八、验收标准

### 8.1 硬性判据（逐条可测）

| 类别 | 判据 | 方法 |
| --- | --- | --- |
| 行数 | README ∈ [200, 300]；CONTRIBUTING ∈ [100, 180] | `wc -l` |
| 锚点 | TOC 12 条锚点逐条可跳转 | 标题文本逐条比对 GitHub 锚点规则 |
| 事实 | 数字表 11 行逐项与来源路径一致 | 回查 `package.json` / `src/` / `doclib/` |
| 命令 | README 出现的每条命令在临时目录实测通过，提示语与真实输出一致 | `/tmp/dl-demo` 逐条跑 |
| 链接 | README 与 CONTRIBUTING 的全部相对路径与外链可达 | `test -f` + URL 核对 |
| 孤儿 | `doclib check` 无新增违规；`CONTRIBUTING.md` 未被判孤儿 | `doclib check` |
| 治理 | 治理健康分保持 100/100 (A) | `doclib check` |
| 构建测试 | `npm run typecheck` 绿；`npm test` 240/240 | 执行 |
| 馆内联动 | `overview.md` L31 已描述新 README 结构 | 人工核对 |
| 进度账 | feature-map 登记 planned；progress.md 补记本次事件 | 人工 |
| 基线 | snapshot 后 revision +1 | `doclib status` |

### 8.2 逐节验收判据（内容层）

| 节 | 通过条件 |
| --- | --- |
| 头部 | 含定位句 + 「不是什么」+ TOC；徽章 URL 与现 README 一致 |
| 30 秒上手 | 4 行决策表；每行首条命令可直接粘贴；说明 `npm i -g` 后的 bin 名一致 |
| 为什么需要它 | 6 个场景齐全；每行有机制与实证；末句收口"承诺文档永远能用来开发" |
| 传统做法不够 | 4 类做法齐全；每行有"DocLib 的差别"；附来源小字 |
| 工作原理 | ASCII 图语义与 design.md §1 一致；3 条铁律表述与 §5.3 定稿一致；双层结构含登记簿五要素与档案卷墓碑 |
| 快速开始 | 4 条路径各自含命令块 + agent 动作说明；命令实测通过 |
| 日常循环 | 三层保活三层职责 + 治理执法三命令 + 状态事实源提示 |
| 图书馆结构 | 12 卷每卷一句话；登记簿挂靠 5 册归位正确；归位宪法一句 |
| 命令参考 | 13 命令齐全、职责与 CLI 实际一致；`place` 5 子动作展开；6 关键选项正确 |
| Skills 参考 | 10 skill 齐全；标注何时加载与关联命令 |
| 现状与实证 | 11 行数字 + 每行来源路径 + 表下纪律行 |
| 参与贡献 | 3 类入口 + 3 条纪律 + CONTRIBUTING.md 链接有效 |
| CONTRIBUTING | 8 节齐全；环境/命令/路径全部真实可用 |

### 8.3 回归门禁（本次不改代码，仍须全绿）

- `npm run typecheck`（双 tsconfig）绿
- `npm test` 240/240 绿
- `doclib check` 违规 0、治理 100/100 (A)、strict 通过
- `doclib status` 无异常（引导预算、漂移、载体提醒正常）

---

## 九、风险登记与对策

| # | 风险 | 影响 | 对策 |
| --- | --- | --- | --- |
| R-1 | 数字随发版漂移 | README 数字表失真 | 数字表每行标来源路径 + CONTRIBUTING §8 发版核对纪律；本次不引入自动校验（超范围） |
| R-2 | 篇幅超 300 行 | 违反用户裁决 | 行数预算表已分配；超限先压缩命令参考与快速开始 |
| R-3 | 中文锚点不可跳 | TOC 失效 | 标题避开特殊字符，写完逐条验证 |
| R-4 | 引用 TODO 占位文档 | 贡献细则失真 | 改引 `AGENTS.md` custom 区（已在规格中锁定） |
| R-5 | 范围蔓延（顺手改代码/加功能） | 违反协议 | 清单锁定 4 类文件；任何越界需求回 PLAN 模式请示 |
| R-6 | 馆内描述与新 README 不一致 | 制造新漂移 | L31 必改列入清单第 25 项，验收纳入 §8.2 |
| R-7 | `.plan/` 载体文件被误判孤儿 | 治理分下降 | 载体已在 `state.planning` 声明，check 阶段核验 |
| R-8 | 执行中发现的失真顺手全改 | 范围失控 | 失真修正集中在第 26/27 项，可否决 |

---

## 十、执行期偏差处理约定

1. 执行中若发现本规划与实际不符（文件结构、命令行为、事实数字变化）→ **立即停止**，回到 PLAN 模式记录偏差并请示
2. 遇到需要新增文件/改动 `src/` 的需求 → **不擅自执行**，先请示
3. 每完成一个阶段，在会话内按清单编号标记进度
4. 全部完成后进入 REVIEW 模式：逐条对照清单 → 标记任何偏差（无论大小）→ 输出「实施与计划完全匹配 / 实施偏离计划」结论
5. 若用户确认成功且要求归档 → 执行锚点二（成果沉淀进馆 + feature-map 状态推进至 implemented + progress.md 补记 + `doclib snapshot` 固化基线）

---

## 十一、执行增补记录（2026-10-22，用户追加指令后）

> 本节记录规划定稿后由用户追加指令产生的范围增补与偏差，过程材料留于规划载体，成果沉淀已入馆（ADR #14 / PRD v0.31 / 30-features/check.md / 95-lessons）。

### 11.1 增补一 · 英文版 README

- 指令：用户要求「添加一下英文版的 readme.md」
- 产物：`README.en.md`（253 行），与中文版逐条对齐——14 个 h2 / 7 个 h3 / 71 行表格 / 28 处链接 / 28 项关键数字两版同现，ASCII 系统图框宽统一 64 列；中文版补语言切换入口
- 治理：`README.en.md` 落在根级门面豁免闭集之外 → 同时触发「无归属」与「孤儿文档」两类违规（**研究结论"孤儿豁免即免违规"不成立**：豁免属四态判定面，无归属属双账本对账面），零代码处置 = `doclib ack --standing` 显式登记 + `overview.md` covers 增锚点
- **研究盲区已回填**：§3.3 兼容性验证表「新建 CONTRIBUTING.md 是否触发孤儿违规」一行的结论只覆盖了孤儿判定面，未覆盖双账本对账面——已在执行期发现并修正

### 11.2 增补二 · 门面多语言变体豁免（产品级，Q42 / ADR #14）

- 指令：用户要求「继续完成你说的这个产品级建议」
- 根因：§11.1 的零代码处置是**兜底**（每仓登记），不是根治；根级门面文件豁免是精确闭集，而生态惯例是可推导的**族**（基名 × locale）——闭集必然滞后（同 95-lessons「豁免清单是闭集」条）
- 方案：`isRootFacadeFile`（`core/orphan.ts`）改为**基名集合 + locale 标签形状**双判（BCP-47 形状 `^[a-z]{2}([-_][A-Za-z0-9]{2,8}){0,2}$`）；**否决逐项列举**（闭集必然滞后）
- 判定面边界（重要）：locale 变体与基名在**孤儿判定面**同权；**「无归属」面不变**（门面文件仍需 covers 锚点，与 `README.md` 完全对等，不因语言宽严不一）——`30-features/check.md` 原规格即把门面豁免限定在孤儿面，故不扩大
- 验收：测试 8/8（新增 2 组）→ 全量 **242/242**（240→242）；用户仓端到端实测（`README.en.md`/`README.zh-CN.md`/`CHANGELOG.en.md` 计入「工具链豁免」，`README.wip.md` 仍判孤儿）；本仓库 standing 豁免已移除（原生豁免生效）
- 数字表同步：README / README.en.md / CONTRIBUTING.md / `50-testing/testing.md` 的用例数 240 → 242

### 11.3 与原清单的偏差汇总

| # | 原清单 | 实际 | 处置 |
| --- | --- | --- | --- |
| D-1 | §3.3 结论：新建门面文件不判违规 | 触发「无归属」违规（孤儿豁免不覆盖对账面） | 按机制补 covers 锚点，并回填研究盲区（§11.1） |
| D-2 | 清单 26：L29「六类→九类」失真修正 | 经 `30-features/check.md` L37 复核不成立 | 撤销该编辑 |
| D-3 | 清单 30 snapshot 在 32 之前 | 移至全部文件改动之后 | 避免遗留 1 文件文档漂移 |
| D-4 | 决策表 4 行 | 5 行 | 补「只想要复原能力」行 |
| D-5 | 痛点表行 6「feature-map 25 条」 | 改为无数字表述 | 数字必腐化 |
| D-6 | CONTRIBUTING 8 节 | 9 节 | 增「提交前自查清单」 |
| D-7 | INDEX「feature-map 14 条目 → 25」 | 去掉易腐数字 | 同 README 数字表原则 |
| D-8 | 原范围仅 2 个门面文件 | 增补英文版 + 1 处 `src/` 行为变更（§11.2） | 用户显式指令授权；已按双锚点登记（feature-map #27） |

### 11.4 当前状态

- 已完成：README 重写（253 行）· CONTRIBUTING 新建（113 行）· README.en.md 新建（253 行）· 门面多语言变体模式豁免（`src/core/orphan.ts` + 2 组测试）
- 门禁：`npm run typecheck` 绿 · `npm test` 242/242 · `doclib check` 违规 0 · 治理 100/100 (A) · strict 通过
- 待用户确认后执行锚点二：feature-map #26/#27 推进 `implemented` + 归档补记 + 最终 snapshot
