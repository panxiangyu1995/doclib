# 孤儿归位与处置闭环包（orphan-placement-pack）

- 日期：2026-10-22
- 状态：规划完成，待批准执行（EXECUTE 未启动）
- 关联：PRD F13（强验证·第七分类孤儿）｜§7.5 归位宪法｜Q20（工具链豁免边界）→ **Q41 新登记**｜ADR #12 新登记｜feature-map #24 新登记
- 规划载体：本对话（RIPER-5 RESEARCH → INNOVATE → PLAN 三段；证据含 context7 官方规范 + gh CLI 全网检索 + 43 仓库全量文件树）
- 关联产物：`doclib/30-features/place.md`（规格，实施时新建）、`doclib/50-testing/acceptance-place-v0.5.0.md`（验收留痕，实施时新建）

---

## 一、目的与效果

把「馆外文档是孤儿文档，需要入棺」这件事从**人工自觉**变成**机器判定 + 工具执行 + 留痕可逆**的闭环，同时消灭已证实的**误报面**（43 仓样本实测：工具链类误报 2,052，均值 ≈48/仓，AI 工具仓最高 171）。三条主线：

1. **判定层：从「是/不是孤儿」二分升级为「四态判定」**
   馆外文档被分为 ①馆内 ②非文档资产 ③工具链豁免 ④待归位孤儿。②不进代码账（本来就不该被文档体系看见），③进代码账但不判孤儿（工具链占位的技术资产仍需漂移感知），④才进入治理扣分与 strict 门禁。**豁免与跟踪解耦**是本次重构的根因修正。

2. **判定面：剔除列从 4 个目录扩到覆盖真实生态**
   当前豁免清单仅 `.github/ .claude/ .opencode/ .cursor/` 四项，而实证显示 agent 工具目录生态已 26+ 项（含 `.agents/` 这一跨厂商一级目录）。剔除列补全后，「馆外无文档」从口号变为可执法且不误伤。

3. **处置面：新增 `doclib place` 命令族（检测 → 裁决 → 执行 → 留痕全链）**
   孤儿三态处置（收编入馆 / ack 登记 / 入棺归档）由 CLI 承担确定性部分，agent 只做语义裁决；入棺走「默认干跑 + `covers` 硬拦截 + 归档账可 restore」三道护栏。

**预期效果（可度量）**

| 指标 | 现状 | 目标 |
| --- | --- | --- |
| 工具链类孤儿误报（43 仓样本合计） | 2,052（均值 ≈48/仓） | **0**（真知识目录判定 23,920 保持不变，不漏报） |
| 闭集滞后应对 | 无（静默误报） | 三层：内置闭集 + `ack --dir` 零代码扩展 + `check` 疑似新工具目录提示 |
| 孤儿处置路径 | agent 自觉（无 CLI 面） | `place list/collect/archive/ack/restore` 全族 + 归档账 + 墓碑 + 指针 |
| 入棺可逆性 | 不存在 | `place restore <arc-id>` 逆操作（不依赖 git） |
| 引导文件增量 | — | 仅 +1 行命令速查（96/63 行，预算 150） |

---

## 二、问题点

### 2.1 判定层

- **豁免清单严重滞后于生态**：代码仅 4 个目录前缀（`src/core/orphan.ts:11`），而 PRD Q20 已拍板「工具链目录全豁免」——**实现落后于 PRD 授权**，非政策缺失。
- **只豁免根级引导文件**：`src/core/orphan.ts:18` 的 `!f.includes("/")` 判定，使子目录 `AGENTS.md` 全部命中；AGENTS.md 官方规范明确支持嵌套（近端优先）。
- **未豁免的 agent 目录成建制误报**：`.agents/`（跨厂商一级目录）未在清单内，而其生态量级仅次于 `.claude/`。
- **第三方与夹具目录未被扫描面隔离**：`vendor/` `third_party/` `deps/` `.changeset/` 不在 `DEFAULT_IGNORES`（`src/core/fsutil.ts:14-40`），其 `.md` 全部被当作知识文档判定。
- **「排除」一刀切丢失跟踪语义**：当前不存在「不判孤儿但仍跟踪」与「完全不跟踪」的区分，②③两类被压在同一张平表里。

### 2.2 处置层

- **CLI 无处置能力**：11 个命令中无归位/归档面；PRD F13 规定孤儿三态处置，但机器只负责「报出来」，处置全靠 agent 自觉。
- **「入棺」未被 PRD 授权**：F13 现为「收编入馆 / ack 豁免 / 废弃清理」手动三态；自动归档属**新增行为**，需补授权与 ADR 留史，否则属越权实施。
- **不可逆动作无护栏**：一旦引入"移动源文件"式归档，无干跑、无 covers 拦截、无逆操作 → 误伤不可逆（`.doclib/state.json` 快照链仅 20 条）。

### 2.3 衍生缺陷（同一根因，本轮一并修）

- **漂移语义缺陷**：文件因新增忽略规则（`.doclibignore` 或本轮 L1 扩围）退出代码账时，被 `computeDrift` 判为 `removed` → 进而判「无归属」违规。用户扩一次忽略规则即触发假违规。
- **规格措辞漂移**：`doclib/30-features/check.md` 称「九分类」，而代码 finding 实际 6 类（另 3 类是非违规状态）——分类计数口径不一，易被后续实现误引。

---

## 三、研究结果

### 3.1 研究方法（双源交叉验证 + 实证普查）

| 手段 | 用途 | 关键参数 |
| --- | --- | --- |
| context7 `/anthropics/claude-code` | Claude Code 官方目录/指令文件布局 | `CLAUDE_NAMES = ['CLAUDE.md', '.claude/CLAUDE.md', 'CLAUDE.local.md']`；`.claude/commands/*.md`；插件 `commands/ agents/ skills/ hooks/ .mcp.json` |
| context7 `/github/awesome-copilot` | Copilot 官方配置布局 | `.github/copilot-instructions.md` + `.github/instructions/*.instructions.md` + `.github/skills/*/SKILL.md` + `.github/agents/*.agent.md` |
| context7 `/agentsmd/agents.md` | AGENTS.md 规范 | 嵌套 AGENTS.md 近端优先；aider 经 `.aider.conf.yml` 的 `read: AGENTS.md` 读取；gemini 经 `.gemini/settings.json` 的 `context.fileName` 读取 |
| gh CLI 官方文档原文 | `.agents/` 的官方地位 | `repos/anomalyco/opencode:packages/web/src/content/docs/skills.mdx` 原文：`- Project agent-compatible: .agents/skills/<name>/SKILL.md`、`- Global agent-compatible: ~/.agents/skills/<name>/SKILL.md`；同文件载明 `.opencode/`、`.claude/skills/`、`.agents/skills/` 三处项目级加载路径 |
| gh CLI 代码检索 | 全网路径前缀命中量 | `gh api -X GET search/code -f q='path:<dir>'`；对照实验 `path:.nonexistentxyz/foo` → 0（证伪能力成立）；限流 10 次/分，按 6–7 秒节流 |
| gh CLI 仓库全量树 | 发现**未预设**的目录 | 43 个主流仓库 `git/trees/HEAD?recursive=1` 全量拉取（anthropics/claude-code、openai/codex、google-gemini/gemini-cli、cline/cline、RooCodeInc/Roo-Code、continuedev/continue、block/goose、charmbracelet/crush、QwenLM/qwen-code、astral-sh/uv、anomalyco/opencode、coleam00/Archon、vercel/next.js、pytorch/pytorch、pnpm/pnpm、sveltejs/svelte、facebook/react、vuejs/core、django/django、fastapi/fastapi、golang/go、rust-lang/rust、apache/spark、spring-projects/spring-boot、nodejs/node、python/cpython、electron/electron、kubernetes/kubernetes、tensorflow/tensorflow、huggingface/transformers、langchain-ai/langchain、open-webui/open-webui、denoland/deno、sourcegraph/cody、microsoft/TypeScript、vitejs/vite、freeCodeCamp、TheAlgorithms、ollama/ollama、github/awesome-copilot、princeton-nlp/SWE-agent、All-Hands-AI/OpenHands、bunsh/bun） |
| 本地确定性复现 | 验证误报 | 临时目录构造四类文件跑 `detectOrphanDocs` |

### 3.2 agent 工具目录实证清单

**全网路径前缀命中量（gh code search，2026-10-22）**

| 目录 | 命中 | 目录 | 命中 | 目录 | 命中 |
| --- | --- | --- | --- | --- | --- |
| `.claude/skills` | 1,495,040 | `.github/instructions` | 83,840 | `.qwen/commands` | 1,648 |
| `.agents/skills` | **1,380,352** | `.trae` / `.trae/rules` | 80,000 / 4,136 | `.continue/rules` | 1,648 |
| `.github/skills` | 288,768 | `.gemini/skills` | 72,448 | `.continue/agents` | 591 |
| `.codex/skills` | 151,552 | `.github/prompts` | 61,056 | `.mcp` | 2,300 |
| `.kiro` / `.kiro/steering` | 267,264 / 27,040 | `.windsurf` / `.rules` / `.workflows` | 54,656 / 8,832 / 6,768 | `.codeium` | 250 |
| `.cursor/rules` | 212,480 | `.antigravity` | 36,160 | `.windsurfrules` | 34 |
| `.github/agents` | 154,624 | `.kilocode` / `.rules` | 31,680 / 2,632 | `.cursorrules` | 452 |
| `.changeset` | 151,424 | `.factory` | 31,040 | `.roorules` | 11 |
| `.vscode` / `.idea` | 2,629,632 / 5,308,416 | `.specstory` | 24,096 | `.clinerules` | 7,744 |
| `.devcontainer` | 412,672 | `.junie` | 17,984 | `.augment-guidelines` | 1 |
| `.zed` | 13,952 | `.crush` | 10,528 | `.cline/skills` | 13,248 |
| `.opencode/command` / `.agent` | 10,704 / 6,256 | `.codex/prompts` | 4,168 | `.gemini/agents` | 3,608 |

> 补充：全网代码字面引用 `".agents/skills"` **897,024** 处；opencode 仓库内 `.agents` 引用 **108** 处（13 语言版本 `skills.mdx`）；openai/codex 内 `.agents` 引用见 `codex-rs/ext/skills/src/host_roots.rs`、`codex-rs/core/tests/suite/skills.rs`（skills 发现与 host_roots 逻辑）。

**43 仓库全量树中含 `.md` 的顶层点目录**（直接对应孤儿命中量）

| 目录 | .md 数 | 目录 | .md 数 | 目录 | .md 数 |
| --- | --- | --- | --- | --- | --- |
| `.agents` | **176** | `.opencode` | 45 | `.cursor` | 4 |
| `.github` | 158 | `.continue` | 42 | `.codex` | 3 |
| `.claude` | 112 | `.idea`（已在 L1） | 33 | `.greptile` | 3 |
| `.qwen` | 79 | `.devcontainer` | 52 | `.conductor` | 3 |
| `.vscode`（已在 L1） | 67 | `.cline` | 9 | `.ai` | 3 |
| `.archon` | 58 | `.gemini` | 57 | `.zed` | 2 |
| `.roo` | 49 | | | | |

> `.agents/` 内部结构：297 条路径中 **297 条位于 `skills/` 下**（176 `.md` + 38 `.mjs` + 36 `.json` + 15 `.png`）→ 性质是「技能包」而非项目知识文档。

### 3.3 四类误报源量化（43 仓库样本）

| # | 误报源 | 样本量 | 当前行为 | 性质 |
| --- | --- | --- | --- | --- |
| 1 | 嵌套引导文件（子目录 `AGENTS.md` 48 / `CLAUDE.md` 11 / `GEMINI.md` 9） | **68** | 全部误报 | 技术约束类 → 豁免 |
| 2 | 第三方/vendor（`deps` 590 + `vendor` 263 + `third_party` 146） | **999** | 全部误报 | 非项目知识 → 不进扫描面 |
| 3 | 测试/夹具/示例（`test/tests/spec/fixtures/testdata/examples` 下） | **2801** | 全部误报 | 测试资产 → 交 L2/L3 逐份判定，**不整体豁免** |
| 4 | 变更集 `.changeset/*.md` | **631** | 全部误报 | 工具产物 → 不进扫描面 |
| 5 | 根级引导文件漏项（`GEMINI.md` 1；`AGENTS.md` 23 与 `CLAUDE.md` 12 已豁免） | 1+ | 误报 | 豁免清单补齐 |
| 6 | 未豁免的 A 类 agent 目录（`.agents` 176 + `.qwen` 79 + `.archon` 58 + `.gemini` 57 + `.roo` 49 + `.opencode` 45 + `.continue` 42 + `.cline` 9 + `.cursor` 4 + `.codex` 3） | **~522** | 全部误报 | 豁免清单补齐 |

### 3.4 本仓库自测事实

| 事实 | 数据 |
| --- | --- |
| 独立跑 `detectOrphanDocs` | **36 个命中**（`assets/` 26 + `skills/` 10） |
| 跑 `doclib check` | **0 孤儿**，治理 100/100 (A) —— 因 `assets/`、`skills/` 被馆内文档 `covers` 覆盖（`10-architecture/prd.md`、`design.md`、`overview.md`、`20-modules/_index.md`、`00-overview/feature-map.md`） |
| 本地复现误报 | `.agents/skills/demo/SKILL.md`、`packages/api/AGENTS.md`、`vendor/lib/README.md`、`test/fixtures/dump.md` **全部被判为孤儿**；`.claude/skills/x/SKILL.md` 正确豁免 |

> **最高危缺口**：本仓库目前「侥幸无孤儿」靠的是 covers 兜底，而非剔除列。任何一次 covers 锚点失效（如新增未被任何文档覆盖的 SKILL.md），孤儿立即出现 → 若执行「入棺」，**误删 skill 源**。

### 3.5 决定性结论

1. `.agents/` 必须入剔除列——opencode 官方文档明文称其为 "Project agent-compatible" 路径（与 `.claude/skills/` 同级），openai/codex 源码有对应发现逻辑，全网 138 万路径命中；证据强度与 `.claude/` 相当。
2. 剔除列现状（4 目录）远小于生态现实（26+ 目录）；43 仓样本实测工具链类误报合计 2,052（均值 ≈48/仓，AI 工具仓最高 171——如 cline/gemini-cli/codex 的工具目录文档几乎全被误判），归位卫生分（每孤儿扣 0.1）会被误报淹没，strict 门禁必然误触发。
3. PRD §7.5 白名单第 1 类「位置由工具链决定，不可迁移」+ Q20「工具链目录全豁免」**已授权**扩列 → 本次属**实现补齐**，非新增政策（仅「入棺自动化」需新授权 Q41）。
4. 误伤面按「入棺」语义放大：孤儿若走移动/删除路径，`vendor/` README、`test/fixtures` 快照、`skills/` 源文件会被移动或删除，其中 `skills/`、`assets/` 属本仓库资产源，删除不可逆。

---

## 四、代码实际情况

| 文件 | 行数 | 事实（带行号） |
| --- | --- | --- |
| `src/core/orphan.ts` | 23 | `EXEMPT_ROOT_FILES`（3-9）= README/CHANGELOG/CONTRIBUTING/CLAUDE.md/AGENTS.md；`EXEMPT_PREFIXES`（11）= `.github/ .claude/ .opencode/ .cursor/` **仅 4 项**；`detectOrphanDocs`（13-22）复用 `collectFiles`；**根级判定 18**（`!f.includes("/")` → 子目录引导文件漏网）；**前缀判定 19**；无内容级判定、无疑似目录识别 |
| `src/core/fsutil.ts` | 160 | `DEFAULT_IGNORES`（14-40）含 node_modules/.git/.doclib/doclib/dist/build/out/coverage/__pycache__/.venv/venv/target/.next/.nuxt/.cache/.turbo/**.idea/.vscode**/.DS_Store/*.log/*.tmp/.env*/Thumbs.db/**.plan**——**不含** vendor/third_party/deps/.changeset/.devcontainer；`collectFiles`（50-87）读取 `.gitignore`（54）与 `.doclibignore`（55）→ **`.doclibignore` 逃生门已存在**；`walk`（66-84）目录/文件分别判 ignore |
| `src/core/check.ts` | 162 | `runCheckCore`（53）；漂移→docsChanged→covers→ack 过滤→findings 流程；**孤儿段 111-129**：`detectOrphanDocs` → 载体路径过滤（112）→ **covers 命中跳过 116** → standing/once ack 过滤（117-125）→ push `orphan-doc`（128）；`healthScore`（19-37）placement 每孤儿扣 0.1；`CheckResult`（39-51）**无 notices 字段**；`drift.removed`（84）**未区分真删除与被新忽略** |
| `src/commands/check.ts` | 58 | `kindLabel`（5-20）；`kinds` 数组（36）**硬编码 6 类**；strict 判定 `r.findings.length === 0`（50）+ 退出码 1（56）→ **任何 finding 都阻断**，故「疑似新工具目录」不能进 findings，须走独立 notices 通道 |
| `src/commands/ack.ts` | 30 | `runAck`（4-30）；`kind` 仅 `once`/`standing`（19）；`once` 绑定基线（25）；**无目录前缀模式** |
| `src/core/state.ts` | 127 | `State`（33-42）= version/latest/snapshots/structureVersion/agents/acks/revision/planning；**无 archives / dirExempts**；`loadState` 归一化先例（84-95，`structureVersion ?? 1`、`Array.isArray` 判定）；`emptyState`（48-59）；`pad3`（125） |
| `src/core/frontmatter.ts` | 51 | **仅解析侧**：`parseFrontmatter`（8-44）支持三形态（block list / 内联数组 / 空值）；`coversOf`（46-51）；**无写侧**（`renderFrontmatter` 缺失，收编/墓碑需自建） |
| `src/core/mapping.ts` | 63 | `buildCoverIndex`（16-36）；`docsForPath`（38-46）精确→目录前缀两级匹配 → **入棺 covers 硬拦截可直接复用**；`normalizePath`（8-14）；`groupByTopDir`（52） |
| `src/core/ledger.ts` | 104 | `CheckFindingKind`（45）= unaccounted/uncovered/migration/guide-stale/orphan-doc/doc-quality（**6 类**）；`validateMigrations`（54）；`hashDocs`（24） |
| `src/core/guides.ts` | 130 | `MANAGED_BEGIN/END`、`CUSTOM_BEGIN/END`（9-12）；`writeGuides`（53-86）有戳更新/无戳跳过/缺失写入；`mergeGuide`（42-50）保留 custom 区；`managedRegionFresh`（88-100）内容级过期检出；`GUIDE_BUDGET_LINES = 150`（117） |
| `src/cli.ts` | 156 | `Flags`（16-31）无 apply/dir/reason；`parseArgs`（33-64）布尔与带值旗标各一支；`HELP`（66-100）含命令表 + 选项 + 闭环段；dispatch（105-149）**11 命令** + version/help |
| `src/commands/sync.ts` | 42 | skills 分发（20）：`copyDir(assetsRoot()/skills → <root>/<target.skillsDir>)`；引导写入（24）走 `writeGuides(root, "light", targets)`；`state.agents` 更新（26） |
| `scripts/copy-assets.js` | 20 | 第 18 行复制 `assets/`；**第 19 行复制 `skills/` → `dist/assets/skills/`** → skills 分发链：`skills/`（git 源）→ build → `dist/assets/skills/` → `doclib sync` → `.claude/skills/` + `.opencode/skills/` |
| `src/commands/testkit.ts` | 79 | `tmpRoot`/`put`/`get`/`has`/`seedState`/`snapshotRow`/`docMd`/`cli`（spawn 真实二进制，`CI=1`）→ 新命令测试基建齐备 |
| `package.json` | — | `version 0.4.0`；`test` 脚本**显式列出 26 个测试文件**（ADR-5：Node 目录 glob 不可用）；既有 **178 用例**；运行时依赖仅 `ignore` |
| `src/core/version.ts` | 21 | `CLI_VERSION`/`PACKAGE_NAME` 读 package.json；`STRUCTURE_VERSION = 3` |
| `assets/guides/light.md` / `full.md` | 62 / 95 | managed 区再生源；含 CLI 命令速查表（light 56 行 / full 68 行）；**命令表必须登记新命令**；剔除列清单**不进引导**（生态漂移必失真 + 150 行预算 + 裁剪判据） |
| `skills/`（10 个） | — | 源在 `skills/`，经 build+sync 分发；`doclib-dev` 提及孤儿（会话开始治理分）与归位（实时同步表）；`doclib-reconcile` 提及 `ack`；**其余 7 个 skill 未提归位** |

---

## 五、设计的方案

### 5.1 拍板结论（D1–D7，用户授权「按长远考虑一步到位」代定）

| # | 决策 | 定案 | 长远理由 |
| --- | --- | --- | --- |
| D1 | 新增 `doclib place`（第 12 命令） | **是**，一次交付 list/collect/archive/ack/restore 全族 | 处置面缺失是体系性缺口；分两期交付 = 两套心智模型 + 两轮评审 |
| D2 | 入棺是否默认干跑 | **是**，写操作默认干跑，`--apply` 才执行 | 不可逆动作唯一可靠护栏 |
| D3 | 归档方式 | **移动 + 归档账（`state.archives`）+ `place restore` 逆操作** | 移动最干净；可逆性由归档账兜底，不依赖 git |
| D4 | IDE/CI 目录归类 | `.vscode/` `.idea/` → **L1 扫描面**；`.changeset/` → L1；`.devcontainer/` → **L2 豁免** | 前者是编辑器本机配置（不该进账）；后者含项目级说明（应跟踪、不判孤儿） |
| D5 | 是否新增第 11 个 skill | **否** | 守 PRD F7 十 skill 约束；归位属日常动作，挂 `doclib-dev` 等现有 skill |
| D6 | 是否分期 | **否，一次到位** | 分期 = 两次设计评审 + 两套文档债 |
| D7 | PRD 授权 | **需新授权**：Q41 登记 + ADR #12 | F13 现为手动三态，自动归档属新行为，必须留史 |

### 5.2 目标架构：四态判定 + 三层防线

**四态（对外语义）**

| 态 | 判定 | 处置 | 责任方 | 进代码账 | strict 门禁 | 治理扣分 |
| --- | --- | --- | --- | --- | --- | --- |
| ① 馆内 | 路径在 `doclib/` | 正常维护 | agent | 是 | — | — |
| ② 非文档资产 | L1 忽略面 | 不参与文档扫描 | CLI 自动 | 否 | 否 | 否 |
| ③ 工具链豁免 | L2 闭集（工具目录 26 + 引导文件任意层级 + 归档指针） | 豁免（计数可见） | CLI 自动 | 是 | 否 | 否 |
| ④ 待归位孤儿 | 真·馆外知识文档 | 收编 / 入棺 / ack | agent 裁决 + CLI 执行 | 是 | **是** | 是（0.1/项） |

**三层防线**

| 层 | 职责 | 载体 | 扩展路径 |
| --- | --- | --- | --- |
| L1 扫描面 | 哪些文件参与文档扫描与代码账 | `src/core/fsutil.ts` `DEFAULT_IGNORES` + 既有 `.doclibignore` | 改代码 / `.doclibignore` |
| L2 判定面 | 哪些文件不判孤儿 | `src/core/orphan.ts` 闭集 + `state.dirExempts` | 改代码 / `doclib ack --dir`（零代码） |
| L3 处置面 | 孤儿怎么处置 | `src/core/place.ts` + `src/commands/place.ts` | 新命令族 |

### 5.3 逐文件更改规范

#### `src/core/orphan.ts`（重构，替代现 23 行）

**新增导出**

| 符号 | 签名/形态 | 契约 |
| --- | --- | --- |
| `TOOLCHAIN_DIRS` | `readonly string[]`（27 项） | `.claude/ .agents/ .opencode/ .cursor/ .github/ .gemini/ .codex/ .cline/ .clinerules/ .roo/ .continue/ .qwen/ .windsurf/ .kiro/ .factory/ .trae/ .junie/ .kilocode/ .antigravity/ .specstory/ .crush/ .codeium/ .mcp/ .archon/ .conductor/ .greptile/ .ai/` —— **目录前缀**匹配（须带尾斜杠，防 `myproject.claude/` 巧合命中） |
| `TOOLCHAIN_FILES` | `readonly string[]` | `.windsurfrules/ .cursorrules/ .roorules/ .clinerules/ .augment-guidelines/ .codeium/config.json` —— **整文件名精确**匹配（不做包含匹配） |
| `GUIDE_FILE_NAMES` | `readonly string[]` | `AGENTS.md CLAUDE.md CLAUDE.local.md GEMINI.md CONVENTIONS.md` —— **任意层级**匹配 |
| `POINTER_MARKER` | `string` 常量 | `<!-- doclib:archived-pointer -->` —— 内容级豁免标记 |
| `isToolchainPath(rel)` | `(rel: string) => boolean` | 目录前缀或整文件名命中 → true |
| `isGuideFile(rel)` | `(rel: string) => boolean` | basename 命中 `GUIDE_FILE_NAMES` → true |
| `isPointerFile(rel, content)` | `(rel: string, content: string) => boolean` | 内容含 `POINTER_MARKER` → true |
| `classifyExternalDoc(rel, content?)` | `(rel: string, content?: string) => "toolchain" \| "guide" \| "pointer" \| "pending"` | 四态分类（纯函数，不读盘） |
| `scanExternalDocs(root)` | `(root: string) => Promise<ExternalScan>` | `ExternalScan = { pending: ExternalDoc[]; toolchain: ExternalDoc[]; guide: ExternalDoc[]; pointer: ExternalDoc[] }`；`ExternalDoc = { path: string; reason: string }`；扫描面复用 `collectFiles`（继承 `.gitignore`/`.doclibignore`/L1 忽略） |
| `detectSuspectedToolchainDirs(root)` | `(root: string) => Promise<SuspectDir[]>` | `SuspectDir = { dir: string; samples: string[]; reason: string }` —— 规则：顶层点目录（`.` 开头）**不在**闭集，且其内含 `SKILL.md` 或 `*.mdc` 或 `AGENTS.md`/`CLAUDE.md`/`GEMINI.md` 或 `rules/`/`commands/`/`agents/`/`instructions/` 子目录中的 `.md`；`samples` 取前 3 个命中路径 |
| `detectOrphanDocs(root)` | `(root: string) => Promise<string[]>` | **保留原签名**（兼容既有测试与调用方），语义收敛为「仅返回 ④ 待归位路径」 |

**行为约束**：仅 `.md` 扩展名（`.mdc`/`.prompt.md` 不纳入，已定）；先 `normalizePath` 归一化；分类优先级 `pointer` > `guide` > `toolchain` > `pending`（指针文件最优先，避免指向文档被二次判孤儿）。

#### `src/core/fsutil.ts`（L1 扫描面）

- `DEFAULT_IGNORES` **追加**（不改既有项）：`vendor/`、`vendors/`、`third_party/`、`third-party/`、`thirdparty/`、`3rdparty/`、`deps/`、`extern/`、`external/`、`.changeset/`
- **不**追加：`docs/`、`design/`、`test/`、`examples/`、`fixtures/`（PRD Q20：历史目录逐份判定，不整体豁免）
- 新增 `fileExists(root, rel): Promise<boolean>`（供漂移语义判定复用，避免 fs 调用散落）

#### `src/core/state.ts`（归档账 + 目录豁免）

- 新增 `ArchiveEntry = { id: string; kind: "archived" | "collected"; from: string; to: string; reason: string; at: string; pointer?: string }`
- `State` 新增 `archives?: ArchiveEntry[]`、`dirExempts?: string[]`
- `loadState` 归一化：`archives: Array.isArray(parsed.archives) ? parsed.archives : []`、`dirExempts: Array.isArray(parsed.dirExempts) ? parsed.dirExempts : []`；`emptyState` 同步初始化
- 新增 `nextArchiveId(state): string` → `arc-001`（三位递增，`pad3` 同源）

#### `src/core/frontmatter.ts`（补写侧）

- 新增 `renderFrontmatter(data: Record<string, string | string[]>): string` —— 数组按 block list 输出，空数组输出 `[]`（与既有解析器三形态兼容，见 95-lessons 2026-10-17 条目）

#### `src/core/place.ts`（新建，L3 处置核心）

| 符号 | 签名 | 契约 |
| --- | --- | --- |
| `PLACEMENT_RULES` | `readonly { volume: string; patterns: RegExp[]; keywords: string[] }[]` | 决策树表：`30-features`（feature/功能/行为/用例/acceptance）、`10-architecture`（architecture/架构/设计/决策/adr/schema/数据模型）、`20-modules`（module/模块/组件/接口边界）、`40-guides`（guide/workflow/流程/规范/convention/roadmap）、`50-testing`（test/测试/验收/qa/矩阵）、`60-config`（config/配置/环境变量/lint/build）、`70-deploy`（deploy/发布/release/ci/部署/运维）、`80-design`（design/ui/ux/界面/设计系统）、`90-reference`（api/endpoint/路由/route/协议/错误码/openapi）、`95-lessons`（lesson/bug/踩坑/经验/教训）、`00-overview`（overview/glossary/术语/进度/feature-map） |
| `suggestPlacement(root, rel)` | `(root: string, rel: string) => Promise<PlacementSuggestion[]>` | `PlacementSuggestion = { volume: string; dir: string; reason: string; confidence: "high" \| "medium" \| "low" }`；**确定性启发式**（无 AI）：目录名精确命中卷名→high；关键词命中→medium；无命中→low（默认建议 `30-features` 并标注「需人工裁决」）；`dir` = 该卷内下一可用三位序号文件名（`pad3` + kebab-case slug） |
| `buildTombstone(entry)` | `(entry: ArchiveEntry) => string` | 墓碑 frontmatter：`title`/`covers`（原路径）/`status: archived`/`archived-from`/`archived-at`/`archive-reason`/`superseded-by`；正文首段为墓碑五要素（何时失效·为何失效·取代者指针·原路径·归档方式），其后**完整保留原正文**（不丢史） |
| `collectDoc(root, rel, targetDir)` | `(root: string, rel: string, targetDir: string) => Promise<PlaceResult>` | 收编：移动至 `doclib/<targetDir>/`；**合并**原 frontmatter（不覆盖已有字段），缺 `covers` 时补原路径；补 `title`（原一级标题或文件名）/`status: draft`；两级索引登记；写归档账（`kind: "collected"`） |
| `archiveDoc(root, rel, reason)` | `(root: string, rel: string, reason: string) => Promise<PlaceResult>` | 入棺：移动至 `doclib/99-archive/<三位序号>-<slug>.md`；写墓碑；**原路径留指针文件**（含 `POINTER_MARKER` + 指向馆内新路径的相对链接）；写归档账（`kind: "archived"`） |
| `restoreDoc(root, archiveId)` | `(root: string, archiveId: string) => Promise<PlaceResult>` | 逆操作：`to` 移回 `from`、删指针文件、撤索引行、销归档账条目；`from` 已被占用时抛 `DoclibError` |
| `registerInIndexes(root, docRel, summary, status)` | `(root: string, docRel: string, summary: string, status: string) => Promise<void>` | `doclib/INDEX.md` 表（`| 文档 | 摘要 | 状态 |`）+ 目标卷 `_index.md` 表（按该卷既有表头列序追加；缺表头则按标准四列建表） |
| `unregisterFromIndexes(root, docRel)` | `(root: string, docRel: string) => Promise<void>` | restore 用：从两级索引移除对应行 |
| `PlaceResult` | `{ ok: boolean; action: string; from: string; to: string; detail: string; dryRun: boolean }` | 干跑与执行共用返回形态；`dryRun: true` 时零写操作 |

**硬拦截（`archiveDoc` / `collectDoc` 共同前置）**
1. `covers` 命中拦截：`docsForPath(coverIndex, rel)` 非空 → 拒绝（会砸掉增量更新锚点），抛 `DoclibError` 并列出命中文档
2. 非 `.md` 拒绝；路径逃逸（`..`）拒绝
3. 目标卷必须属于 12 卷基线白名单，否则拒绝

#### `src/core/check.ts`（判定接入 + 漂移语义修正）

- `CheckResult` 新增 `notices: CheckNotice[]`；`CheckNotice = { kind: "toolchain-exempt" | "guide-exempt" | "pointer-exempt" | "toolchain-suspect" | "newly-ignored"; path?: string; detail: string }`
- 孤儿判定改用 `scanExternalDocs(root)`：仅 `pending` 进入孤儿流程（沿用既有 covers 跳过 + ack 跳过）；`toolchain`/`guide`/`pointer` 计入 notices（**不扣治理分、不计 strict 门禁**，但计数可见）
- **漂移语义修正**：遍历 `drift.removed`，若 `fileExists(root, p)` 为真 → 该路径是被新忽略规则移出代码账，**不计入漂移与 findings**，改记一条 `newly-ignored` notice（汇总一条，避免刷屏）
- `state.dirExempts` 参与 L2 豁免判定（路径前缀匹配）
- 治理健康分口径不变（仅 ④ 类扣分）→ 误报消除后分数反映真实归位卫生

#### `src/commands/check.ts`（输出）

- 孤儿段标题保持「孤儿文档 (N)」
- 新增 notices 汇总行：「工具链豁免: N（.claude/ 12 · .agents/ 3 …）｜引导/指针豁免: M｜疑似新工具目录: K（.foo/ → 确认后 `doclib ack --dir .foo/`）｜新增忽略退出代码账: J」
- `notices` 全量进 `--json` 载荷

#### `src/commands/ack.ts`（目录豁免）

- 选项新增 `dir?: boolean`；`dir: true` 时 `path` 视为目录前缀，写入 `state.dirExempts`（去重 + 归一化补尾斜杠）；`--remove` 同样支持移除目录前缀
- 语义边界（写入 `doclib/60-config/config.md`）：`ack --dir` = **不判孤儿但仍进代码账**（可漂移感知）；`.doclibignore` = **完全不进代码账**（不 hash、不漂移检测）

#### `src/commands/place.ts`（新建命令）

- `runPlace(root, opts)`：`opts = { action: "list" | "collect" | "archive" | "ack" | "restore"; path?: string; to?: string; reason?: string; note?: string; apply?: boolean; json?: boolean }`
- `list`（默认动作）：列 ④ 待归位孤儿 + 建议归宿 + 依据，按建议卷分组
- `collect`：`--to <卷内目录>` 必填；默认干跑
- `archive`：`--reason <失效原因>` 必填；默认干跑
- `ack`：`--note <理由>` 必填 → 复用既有 ack 账本（等价 `ack --standing`）
- `restore`：`path` 为归档账 id（如 `arc-001`）；默认干跑
- **所有写操作**：`apply !== true` 时仅打印动作清单（源 → 目标、墓碑预览、索引登记预览、受影响文档清单），零落盘；`apply === true` 才执行
- 错误一律 `DoclibError`

#### `src/cli.ts`（命令面）

- `Flags` 增 `apply: boolean`、`dir: boolean`、`reason?: string`
- 参数解析：`--apply`、`--dir` 布尔；`--reason <text>`
- 分发新增 `case "place"` → `runPlace(root, { action: args[1] ?? "list", path: args[2], ...flags })`；`case "ack"` 透传 `dir`
- `HELP` 更新：新增 `place` 命令行 + `--apply`/`--dir`/`--reason` 选项行 + 「闭环」段补「孤儿清账」链路（`check` → `place list` → `place collect/archive` → `check`）

#### 版本

- `package.json` `version` 0.4.0 → **0.5.0**（新增命令 + 判定行为变更 → minor）
- `src/core/version.ts` `STRUCTURE_VERSION` 保持 **3**（12 卷结构未变）；`CLI_VERSION` 自动跟随 package.json
- 副作用：既有 `AGENTS.md`/`CLAUDE.md` 因 CLI 版本戳变化被判「引导过期」→ 执行 `doclib sync` 再生（预期行为，非缺陷）

#### 引导模板（managed 区再生源）

- `assets/guides/light.md`：**CLI 命令速查表增 1 行** `doclib place | 孤儿归位：列出/收编入馆/入棺归档/登记豁免（写操作默认干跑，--apply 执行）`
- `assets/guides/full.md`：同增 1 行
- **不**把剔除列清单写入引导（agent 无需知清单，CLI 已判定；清单随生态漂移，进引导必失真；触犯 150 行预算与「删掉会犯错吗」判据）
- 行数复核：`light.md` 62 → 63；`full.md` 95 → 96；均 < 150

#### Skills（源在 `skills/` → build → `dist/assets/skills/` → `doclib sync` → `.claude/skills/`、`.opencode/skills/`）

| 文件 | 改动 | 要点 |
| --- | --- | --- |
| `skills/doclib-dev/SKILL.md` | 新增「**孤儿清账与归位**」小节 | 四态判定顺序（先判 ②/③ → 再判 ④ → 再选处置）；`doclib place list` 用法；入棺三红线（`covers` 命中禁归档 / 必须干跑确认 / 墓碑必写）；`ack` 与 `ack --dir` 边界 |
| `skills/doclib-update/SKILL.md` | 「过时内容」分支 | 显式指向 `doclib place archive <path> --reason "..."`；墓碑五要素；原路径指针文件保留 |
| `skills/doclib-build/SKILL.md` | 冷启动盘点 | 三态（收编/豁免/废弃）→ 四态（补「非文档资产」识别，避免把 vendor/夹具当孤儿） |
| `skills/doclib-bootstrap/SKILL.md` | 同上 | 同上 |
| `skills/doclib-audit/SKILL.md` | 新增「误报排查」 | 孤儿命中先判是否误报（工具链目录/第三方/夹具/嵌套引导）；误报=缺陷，须回流为剔除列提案（`ack --dir` 或闭集扩项） |
| `skills/doclib-accept/SKILL.md` | 验收清单 | 纳入 `doclib place` 可执行验收标准 |

**不新增第 11 个 skill**（守 F7 十 skill 体系 + 引导裁剪判据）

#### 馆内文档同步（实时同步纪律，同批入馆）

| 文件 | 改动 |
| --- | --- |
| `doclib/10-architecture/prd.md` | 修订记录 v0.29；§7.5 馆外白名单第 1 类扩项（工具链闭集 + 任意层级引导文件 + 归档指针文件）；F13 升格为「四态判定 + 三层防线 + 处置闭环」；§11 新增 **Q41**（剔除列扩围 + place 处置闭环授权，已拍板） |
| `doclib/10-architecture/decisions.md` | 新增 **ADR #12**：四态判定 + 三层防线 + 归位处置闭环（背景 / 被否备选 / 后果） |
| `doclib/30-features/check.md` | 分类表更新（四态 + 豁免闭集 + notices 口径）；统一「N 分类」措辞（现称「九分类」而代码 finding 为 6 类 → 统一为「6 类违规 + 3 类状态 + notices」）；验收标准增补 |
| `doclib/30-features/place.md`（新建） | 行为规格（5 子命令 + 干跑契约 + 三道护栏）+ 墓碑规范 + 可执行验收标准（Given/When/Then） |
| `doclib/30-features/_index.md` | 登记 place 规格行 |
| `doclib/20-modules/_index.md` | 登记 `core/orphan`（四态重构）、`core/place`、`commands/place`、`core/frontmatter`（写侧） |
| `doclib/00-overview/feature-map.md` | 新增 **#24 孤儿归位与处置闭环**（planned → implemented） |
| `doclib/00-overview/progress.md` | 补记本轮时间线（拍板结论 / 实现要点 / 验收结果） |
| `doclib/95-lessons/lessons.md` | 新增 2 条：①闭集必然滞后于生态——豁免清单须配零代码扩展路径；②排除一刀切会连跟踪语义一起丢掉——扫描面与判定面必须分层 |
| `doclib/60-config/config.md` | 忽略规则表补 L1 新增项；新增「`.doclibignore` vs `ack --dir` 语义边界」；版本行改 0.5.0 |
| `doclib/INDEX.md` | 登记 `30-features/place.md` |
| `doclib/50-testing/` | 新增 `acceptance-place-v0.5.0.md`（验收留痕）；`testing.md` 补测试清单与新增用例数 |

---

## 六、备选方案

| # | 方案 | 内容 | 优点 | 缺点 | 判定 |
| --- | --- | --- | --- | --- | --- |
| A | 仅扩豁免清单 | L1+L2 补全，不加处置 | 改动最小、风险最低、立即消除误报 | 闭集必然滞后；「入棺」诉求未解；孤儿仍无闭环 | 必要但不足 |
| B | A + `doclib place` | A + list/collect/archive/ack/restore | 闭环；机器做确定性部分，agent 只裁决语义 | 新增第 12 命令 = 维护面扩大；入棺不可逆需护栏 | **采用（主体）** |
| C | B + 疑似新工具目录软提示 | B + check 报「疑似新工具目录」 | 根治闭集滞后 | 多一分类，需定义启发式（可能误报） | **采用（叠加）** |
| D | C + 豁免可配置化 | C + `ack --dir` 项目级目录豁免 | 新工具出现零代码应对 | 与 `.doclibignore` 双机制，语义需边界说明 | **采用（叠加）** |
| E | 复用现有命令做处置 | 不加命令，处置并入 `ack` / `plan` | CLI 面不膨胀 | 语义混杂（ack=豁免 vs 处置=移动）；`plan` 是任务书生成器 | 否决 |
| F | 目录级整体归档 | 把整个 `docs/` 一次性移入 99-archive | 一次性清空馆外 | 违反 Q20「逐份判定」；不可逆；丢失可归位知识 | 否决 |
| G | 仅靠 `.doclibignore` 解决 | 引导用户把工具目录写进 `.doclibignore` | 零代码 | 语义错位：工具目录应**被跟踪**（漂移感知）而非完全消失；且 `.doclibignore` 扩容会触发既有漂移缺陷（假「无归属」） | 否决（保留为用户侧逃生门） |
| H | 引导文件承载剔除列 | 把 27 项目录写进 managed 区 | agent 直接知道 | 清单随生态漂移必失真；触犯 150 行预算与裁剪判据；agent 本就无需知清单 | 否决 |

**被否备选的关键理由（ADR #12 素材）**：E 语义混杂（豁免与处置是两种相反语义，不应共命令）；F 违反既有拍板且不可逆；G 把「不判孤儿」错配为「不跟踪」，并放大既有漂移缺陷；H 用静态清单对抗动态生态。

---

## 七、实施清单

```java
实施清单：
1. 创建规划载体文档 .plan/2026-10-22/orphan-placement-pack.md（背景/范围/拍板 D1-D7/文件清单/验收）
2. doclib/00-overview/feature-map.md 登记 #24「孤儿归位与处置闭环」状态 planned（锚点一）
3. src/core/orphan.ts 重构：导出 TOOLCHAIN_DIRS(27)、TOOLCHAIN_FILES(6)、GUIDE_FILE_NAMES(5)、POINTER_MARKER
4. src/core/orphan.ts 新增 isToolchainPath / isGuideFile / isPointerFile / classifyExternalDoc（纯函数四态分类）
5. src/core/orphan.ts 新增 scanExternalDocs（返回 pending/toolchain/guide/pointer 四组）
6. src/core/orphan.ts 新增 detectSuspectedToolchainDirs（顶层点目录 + 工具特征启发式）
7. src/core/orphan.ts 改造 detectOrphanDocs 为兼容包装（仅返回 pending 路径）
8. src/core/fsutil.ts DEFAULT_IGNORES 增补 L1 十项（vendor 族 + .changeset）
9. src/core/fsutil.ts 新增 fileExists 导出
10. src/core/state.ts 新增 ArchiveEntry 类型与 State.archives / State.dirExempts 字段
11. src/core/state.ts loadState 归一化两个新字段 + emptyState 初始化 + nextArchiveId
12. src/core/frontmatter.ts 新增 renderFrontmatter（写侧，与解析三形态兼容）
13. src/core/place.ts 新建：PLACEMENT_RULES + suggestPlacement（确定性启发式建议归宿）
14. src/core/place.ts 新建：buildTombstone（墓碑五要素 + 保留原正文）
15. src/core/place.ts 新建：registerInIndexes / unregisterFromIndexes（两级索引登记/撤销）
16. src/core/place.ts 新建：collectDoc（收编：移动 + frontmatter 合并 + 两级索引 + 归档账）
17. src/core/place.ts 新建：archiveDoc（入棺：移动 + 墓碑 + 原路径指针 + covers 硬拦截）
18. src/core/place.ts 新建：restoreDoc（逆操作：还原 + 删指针 + 撤索引 + 销账）
19. src/core/check.ts 接入 scanExternalDocs，notices 字段落地
20. src/core/check.ts 实现漂移语义修正（真删除 vs 被新忽略：存在性判定 + newly-ignored notice）
21. src/core/check.ts 接入 state.dirExempts 到 L2 豁免判定
22. src/commands/check.ts 输出 notices 汇总行（豁免计数 / 疑似新工具目录 / 新增忽略）
23. src/commands/ack.ts 增 dir 模式（state.dirExempts 写入与移除）
24. src/commands/place.ts 新建：runPlace 五子命令（list/collect/archive/ack/restore）+ 干跑契约
25. src/cli.ts Flags 增 apply/dir/reason，参数解析与 case "place" 分发，ack 透传 dir
26. src/cli.ts HELP 更新（place 命令行 + 三个新选项 + 闭环段补孤儿清账链路）
27. package.json version 0.4.0 → 0.5.0
28. assets/guides/light.md CLI 命令速查表增 place 行
29. assets/guides/full.md CLI 命令速查表增 place 行
30. skills/doclib-dev/SKILL.md 新增「孤儿清账与归位」小节（四态顺序 + place 用法 + 入棺三红线）
31. skills/doclib-update/SKILL.md 过时内容分支指向 place archive 与墓碑写法
32. skills/doclib-build/SKILL.md 冷启动盘点三态对齐四态（补非文档资产识别）
33. skills/doclib-bootstrap/SKILL.md 同上
34. skills/doclib-audit/SKILL.md 新增「误报排查」小节
35. skills/doclib-accept/SKILL.md 纳入 place 验收标准
36. doclib/10-architecture/prd.md 修订记录 v0.29 + §7.5 白名单扩项 + F13 升级
37. doclib/10-architecture/prd.md §11 登记 Q41（已拍板结论）
38. doclib/10-architecture/decisions.md 新增 ADR #12（四态判定 + 三层防线 + 处置闭环）
39. doclib/30-features/check.md 分类口径与豁免清单更新 + 验收标准增补
40. doclib/30-features/place.md 新建（行为规格 + 干跑契约 + 三道护栏 + 验收标准）
41. doclib/30-features/_index.md 登记 place 规格行
42. doclib/20-modules/_index.md 登记 core/orphan 改造、core/place、commands/place、core/frontmatter
43. doclib/60-config/config.md 忽略规则表补 L1 + 新增 .doclibignore 与 ack --dir 语义边界 + 版本行
44. doclib/95-lessons/lessons.md 新增 2 条教训（闭集滞后 / 排除一刀切丢跟踪语义）
45. doclib/INDEX.md 登记 30-features/place.md
46. src/core/orphan.test.ts 扩写（四态分类 + 疑似目录 + 兼容包装语义）
47. src/core/place.test.ts 新建（建议归宿 / 收编 / 入棺 / 墓碑 / 指针 / covers 拦截 / restore）
48. src/commands/place.test.ts 新建（list/collect/archive/ack/restore + 干跑无副作用 + 错误面）
49. src/core/check.test.ts 扩写（notices + 漂移真删除 vs 被新忽略 + dirExempts 豁免）
50. src/commands/ack.test.ts 扩写（--dir 写入/移除/去重）
51. src/core/fsutil.test.ts 扩写（L1 新增忽略 + fileExists）
52. package.json test 脚本追加新测试文件（orphan/place/check/ack/fsutil）
53. npm run typecheck（须全绿）
54. npm test（既有 178 + 新增用例全绿）
55. 临时目录冒烟：init → 造四类文件 → check → place list → place archive 干跑 → place archive --apply → check 归零 → place restore → check 复现
56. npm run build + doclib sync（引导 managed 区再生为本仓库 AGENTS.md/CLAUDE.md）
57. doclib check 全绿复核（治理 100/100 A，无孤儿/无假违规）
58. doclib/00-overview/feature-map.md #24 状态推进 implemented
59. doclib/00-overview/progress.md 最终补记（含拍板、实现要点、验收数据）
60. doclib/50-testing/acceptance-place-v0.5.0.md 新增验收留痕（用例结果 + 冒烟数据）
61. git status/diff/log 自查（仅暂存本清单内文件；不 commit，等用户指令）
```

---

## 八、验收标准

### 8.1 判定层

- Given 顶层 `.agents/skills/x/SKILL.md` When `check` Then **不**检出为孤儿，且 notices 计数含「工具链豁免」
- Given 嵌套 `packages/api/AGENTS.md` When `check` Then **不**检出为孤儿
- Given `vendor/lib/README.md` When `check` Then **不**进入任何分类（不进代码账）
- Given `docs/stray.md` When `check` Then 检出为孤儿文档（④），strict 退出码 1
- Given 归档指针文件 When `check` Then **不**检出为孤儿

### 8.2 处置层

- Given 孤儿文件 When `place list` Then 列出建议归宿与依据
- Given `place archive`（无 `--apply`） When 执行 Then **无任何文件变动**，输出动作清单
- Given 文件被 `covers` 命中 When `place archive --apply` Then 拒绝并列出命中文档
- Given `place archive --apply` When 执行 Then 源文件移入 `99-archive/`、墓碑五要素齐备、原路径留指针、归档账新增 `arc-00N`
- Given `place restore arc-00N` When 执行 Then 文件回到原路径、指针删除、索引行移除、归档账条目移除
- Given `place collect --to 30-features` When 执行 Then 文件入馆、frontmatter 齐备、两级索引各增一行

### 8.3 扩展层

- Given 新工具目录 `.foo/` 含 `SKILL.md` When `check` Then notices 报「疑似新工具目录」，**不**判违规
- Given `doclib ack --dir .foo/ --note "..."` When 执行 Then `.foo/` 下 `.md` 不再被判孤儿，**且仍进代码账**
- Given 新增 `.doclibignore` 规则后 `check` Then 被移出代码账的文件**不**产生「无归属」违规

### 8.4 回归与整体

- `npm run typecheck` 绿
- `npm test` 全绿（既有 178 + 新增用例）
- 临时目录冒烟全链路通过（清单第 55 步）
- 本仓库 `doclib check` 全绿，治理 100/100 (A)，无孤儿、无假违规
- 引导 managed 区行数：light 63 / full 96，均 < 150

---

## 九、风险与红线

| 红线 | 约束 |
| --- | --- |
| 不可逆动作 | 任何移动/删除先干跑；`--apply` 显式；`covers` 命中硬拦截；归档账可 restore |
| 覆盖范围 | 只改本清单内文件；不顺手重构无关模块 |
| 代码风格 | ESM + `.js` 后缀导入；strict + noUncheckedIndexedAccess；源码不写注释；错误一律 `DoclibError` |
| 依赖 | 运行时仅 `ignore`；不引入新依赖 |
| 文档纪律 | 规格 / ADR / feature-map / progress / lessons 与代码同批入馆；`doclib check` 强制 |
| 引导预算 | managed 区 ≤150 行；剔除列清单不进引导 |
| 提交 | 未经用户明确指令不 commit |

| 风险 | 概率 | 规避 |
| --- | --- | --- |
| 入棺误伤源文件 | 中 | 干跑默认 + `--apply` 显式 + covers 硬拦截 + 归档账 restore + 快照链兜底 |
| 闭集滞后于生态 | **高（已发生）** | 三层：内置闭集 + `ack --dir` 零代码扩展 + check 疑似目录提示 |
| 剔除过宽掩盖真孤儿 | 低 | 只对「点目录 + 工具特征」豁免；`docs/` 类明确不豁免（Q20 既有） |
| 新增第 12 命令扩大维护面 | 中 | place 复用既有 core（orphan/ledger/frontmatter/mapping/state），零新依赖 |
| 引导文件超预算 | 低 | 只加 1 行；清单不进引导 |
| 规格与实现再脱节 | 中 | 同批改 spec+code+tests+feature-map，`check` 强制 |

---

## 十、兼容与迁移契约

| 事项 | 契约 |
| --- | --- |
| `state.json` | 仅增字段，缺失归一化为空；旧 state 加载不报错 |
| `detectOrphanDocs` | 签名与返回类型不变（`string[]`），语义收敛为「仅 ④ 类」；既有 `src/core/orphan.test.ts` 断言需按新语义更新（`.agents/`、嵌套 `AGENTS.md`、vendor 期望**不再**出现在结果中） |
| 既有用户仓库 | 新增 L1 忽略项会使历史快照中这些路径显示为「removed」→ 由「真删除 vs 被新忽略」判定吸收，不产生假违规 |
| 引导文件 | CLI 版本戳变化 → 既有引导判「过期」→ `doclib sync` 再生（预期） |
| 登记簿 / 卷结构 | 12 卷基线不变；`STRUCTURE_VERSION` 保持 3 |
| 运行时依赖 | 不新增依赖（仍仅 `ignore`） |

---

## 十一、研究留痕（可复现命令与来源）

```bash
# gh CLI 代码搜索（路径前缀命中量；限流 10 次/分，按 6–7 秒节流）
gh api -X GET search/code -f q='path:.agents/skills' --jq '.total_count'
gh api -X GET search/code -f q='path:.nonexistentxyz/foo' --jq '.total_count'   # 对照组 → 0
gh api -X GET search/code -f q='".agents/skills"' --jq '.total_count'            # 897024

# gh CLI 仓库全量树（发现未预设目录）
gh api "repos/anomalyco/opencode/git/trees/HEAD?recursive=1" --jq '.tree[] | select(.type=="blob") | .path'
gh api "repos/anomalyco/opencode/contents/packages/web/src/content/docs/skills.mdx" --jq '.content' | base64 -d | grep -n -A6 "\.agents"
gh api "repos/openai/codex/contents/codex-rs/ext/skills/src" --jq '.[].name'
```

- context7 库 ID：`/anthropics/claude-code`、`/github/awesome-copilot`、`/agentsmd/agents.md`
- 关键原文（opencode 官方 `skills.mdx`）：`- Project agent-compatible: .agents/skills/<name>/SKILL.md` / `- Global agent-compatible: ~/.agents/skills/<name>/SKILL.md`
- 关键原文（Claude Code）：`CLAUDE_NAMES = ['CLAUDE.md', '.claude/CLAUDE.md', 'CLAUDE.local.md']`
- 43 仓库树样本落盘位置（临时）：`/var/folders/yp/vbcrymh56px2svmbqmr13vqc0000gn/T/opencode/trees/`（非仓库内，不入 git）

---

## 附：审查轮复核结论（2026-10-22 REVIEW → EXECUTE 修复）

REVIEW 阶段对实施做了三方交叉验证（43 仓新旧判定对照度量 + 7 项边界构造复现 + 6 项安全探针），发现并已全部修复：

| # | 偏差 | 修复 |
| --- | --- | --- |
| R-01 | 计划未覆盖 README 门面命令表（实施后 README 仍列 11 命令，通用选项缺 `--apply/--dir/--reason`） | README 补 `place` 行 + 三个新选项；`check` 行补四态判定与豁免提示说明 |
| R-02 | 分区目标（`--to 30-features/cli`）时卷索引链接写成 basename → 断链 → `check` 判「文档质量」违规 | 链接改**卷内相对路径**（`cli/001-x.md`）；还原时按同一相对路径撤销登记 |
| R-03 | `buildVolumeRow` 按列数截断填值：4 列表（功能\|规格文档\|covers\|状态）只填 3 格 → 行列不齐 | 改为**按列语义映射**（link/summary/covers/status/volume-entry/title），格数恒等于表头列数 |
| R-04 | 5 处文档写「约 2000+ 误报/仓库」——per-repo 与 sample-total 混淆，量级高估约 40 倍 | 全部改为实测口径：工具链类 2,052（43 仓样本合计，均值 ≈48/仓，最高 171） |
| R-05 | 计划目标行「误报量 → ≈ 0」不可达成（残余含真知识目录） | 目标改为「工具链类误报清零，真知识目录判定保持不变」，并明示残余两类（夹具 2,344 按 Q20 不豁免 / 非点目录工具目录 1,856 无 soft 提示） |
| R-06 | `ack --dir` 不校验目录存在 → 拼写错误静默永久无效 | 登记时校验目录存在（移除豁免不受限）；补用例 |
| R-07 | 归档账无上限（快照链有 20 条上限） | `MAX_ARCHIVES = 200`（档案文件永久保留，仅账本条目封顶） |
| R-08 | 表头取第一张表、行追加到最后一张表 → 多表 `_index` 行列错位 | 定位改为「首个完整表（表头+分隔行）」，并在多表时选**文档索引表**（含文档/功能/模块列） |
| R-09 | `collect → restore`（collected 类型）无测试 | 补用例（回原位 + 索引撤销 + 销账 + frontmatter 语义） |
| R-10 | `check --json` notices 逐文件输出 → 大仓载荷偏大 | notices 按「类型 + 顶层目录」聚合（保留样例路径），文本与 JSON 同时收敛 |

复核后：typecheck 绿、**219/219 用例绿**（213 → 219）、冒烟复跑通过、本仓库 `check` 治理 100/100 (A) 违规为零。
