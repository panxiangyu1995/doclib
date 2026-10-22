# codegraph 克隆集成规划（F15 阶段 2 · 一步到位）

- 创建于：2026-10-22
- 载体：RIPER-5 会话（RESEARCH → INNOVATE → PLAN 三阶段完成）
- 上游基线：colbymchenry/codegraph v1.6.2（74.6k★，MIT，npm `@colbymchenry/codegraph`）
- 关联：PRD F15/Q40、feature-map #19、ADR #10（拟新增 ADR #12）
- 状态：规划完成，待用户批准 ENTER EXECUTE MODE

---

## 1. 目的与效果

### 1.1 战略目的

服务复原基准三阶段战略（benchmark.md 终态矩阵），为建馆与全程开发注入**语义代码知识图谱加速器**：

| 阶段 | 依托 codegraph 的增益 |
| --- | --- |
| P1 信息零遗漏 | 建馆"第一遍·骨架"扫描由图代劳（路由清单/导出面/依赖图/模块结构零遗漏枚举）；`verify` 面穷举对账的候选引擎 |
| P2 质量保证 | accept/S2 深挖时符号导航、调用链追溯省 token；影响面分析辅助 |
| P3 升华超越 | `getUnreferencedNodes` 死代码候选、影响面半径 → 升华提案清单的挖掘素材 |

### 1.2 预期效果

- `doclib init` 可选一步建图（`--graph`），agent 建馆时从 grep/read 循环转为图查询（上游基准：token -62%、工具调用 -88%、文件读取降为 0）
- 图谱自动产出**登记簿候选草稿**（routes/modules/dependencies/unused 四册），agent 逐条裁决回灌——"机器只出候选不代写"铁律的数据化落地
- 图书馆仍是唯一事实源与唯一产品；`.codegraph/` 定位为**可再生内部缓存**（与 `.doclib/` 簿记同级，删了可重建）

## 2. 问题点

1. **中间产物开销质疑（用户核心关切）**：codegraph 原生产出是知识图谱，而我们的目的是图书馆——图谱是否是额外开支？
   - 研究裁决：图是抽取+解析的**计算基底**（resolver 是 DB 支撑，`createResolver(projectRoot, queries)`），计算过程不可跳过；可裁决的是其**持久化形态**（瞬态 vs 持久）
2. **PRD 流程冲突**：Q40 原定"F14 三指标实测后裁决集成深度"，本次用户指示一步到位——需 ADR 记录裁决权行使，Q40 三指标转为事后验证
3. **硬约束**：
   - codegraph 库模式要求 Node ≥22.5（`node:sqlite`），本仓库 engines `>=18` 冲突
   - telemetry 默认开启且出网上报（`src/telemetry/index.ts:251`），与"100% 本地"宣传存在口径差
   - 本仓库"运行时仅依赖 ignore"纪律将被突破（+3 纯 JS 依赖），需 ADR 修订
   - `.codegraph/` 未入本仓库排除清单，会污染 snapshot/diff/orphan 三套账
   - 引导文件 managed 区 ≤150 行预算——指令必须写 skills 不写引导
4. **"直接使用现成包影响后期开发"（用户判断）**：npm 依赖形态下无法裁 telemetry、无法做馆-图对账等深度耦合、API 受制上游——克隆 fork 是三阶段战略的前提而非可选项

## 3. 研究结果

### 3.1 codegraph 本体架构（源码克隆分析 + context7 交叉验证）

| 维度 | 事实 |
| --- | --- |
| 分层 | TS 主层 287 文件（db/extraction/resolution/graph/context/search/sync）+ Rust 内核（可选，按语言路由）+ wasm 兜底（web-tree-sitter，逐文件回退，图逐字节一致） |
| 库 API | `CodeGraph.init/open/indexAll/sync/searchNodes/buildContext/getImpactRadius/watch/close` 全量公开；`getNodesByKind/getModuleAggregation/getFileDependencyPairs/getTopDependedOn/getUnreferencedNodes/getStats/getDetectedFrameworks` 等查询面直接可达 |
| 模块格式 | tsconfig 为 **CommonJS**（`module: commonjs`）；唯一 `import.meta` 用点在 `src/resolution/ambient-modules.ts` |
| wasm 文法 | in-tree 自带 29 个/64MB（`src/extraction/wasm/`）；缺失文法回退 `require.resolve('tree-sitter-wasms/out/…')`（`grammars.ts:453-458`） |
| telemetry | 默认 enabled，上报 `https://telemetry.getcodegraph.com/v1/events`；仅被 `bin/`、`mcp/`、`installer/` 引用 |
| 分发体量 | npm 主包 1.2MB 零依赖；平台包 293MB（内含 vendored Node 24）；tree-sitter-wasms 51.8MB |
| 数据模型 | 节点 kind：file/module/class/function/method/route/component…；边 kind：contains/calls/imports/exports/extends/implements/references…；route 节点经 references/calls 边绑 handler（17 框架感知） |

### 3.2 本仓库集成点实际代码状况

| 位置 | 实际状况 |
| --- | --- |
| `src/core/fsutil.ts:14` | `DEFAULT_IGNORES` 30 项，**不含 `.codegraph/`** |
| `src/core/orphan.ts:5` | `TOOLCHAIN_DIRS` 26 项，**不含 `.codegraph/`** |
| `src/package.json` | engines `>=18`；dependencies 仅 `ignore@^5`；files 仅 dist+README |
| `tsconfig.json` | NodeNext ESM、strict+noUncheckedIndexedAccess、rootDir src |
| `src/cli.ts` | 11 命令 switch 接线；HELP 静态文本 |
| `src/commands/init.ts` | 模板→skills→guides→state 四段流程，无工具探测 |
| `src/commands/ack.ts` | `--dir` 目录豁免（state.dirExempts）**已存在可复用** |
| `src/core/prompts.ts` | readline 问卷三问形态（askAgents/askGuide/askPlanning） |
| `src/commands/testkit.ts` | tmpRoot/put/get/has/seedState 测试基建齐备 |
| `assets/guides/` | light/full 两档模板，managed 区 `%CLI_VERSION%` 占位再生 |

### 3.3 图谱能力 ↔ 图书馆需求映射（核心研究结论）

| 图书馆落点 | 图谱可自动产出（已核实方法） | 图谱不能产出（agent 独占） |
| --- | --- | --- |
| 80-design · routes 册 | 路由清单 {url, handler, handlerFile:line, routeFile:line}（`getRoutingManifest`/route 节点）——五要素的标识+covers 直接预填 | 路由行为语义（鉴权/边界/错误） |
| 90-reference · api 册 | HTTP 面同上；导出面 `getExportedNodesByFile` | 请求/响应字段、错误码、幂等性 |
| 10-architecture · dependencies | `getFileDependencyPairs`/`getTopDependedOn`（含置信计数） | 分层设计意图 |
| 20-modules | `getModuleAggregation`（declared/uncertain 计数） | 模块职责叙述 |
| 登记簿状态机 | `getUnreferencedNodes` → unused 候选 | deprecated 判定、时间线 |
| 30-features 行为规格+验收标准 | 仅导航辅助（callers/impact） | 触发/路径/边界/错误/并发——全部 |
| 40/95/60/70/00 卷 | 几乎为零 | 全部 |

**结论**：图谱产出结构，图书馆灵魂是语义；"直接产出图书馆"的可行形态 = **图谱自动产出骨架+登记簿候选，agent 补行为层**——与 PRD F1"机器只出候选"、非克隆铁律完全同构。

## 4. 设计方案（已裁决）

### 4.1 四项裁决（长远视角）

| # | 裁决点 | 裁决 |
| --- | --- | --- |
| D1 | 瞬态图 vs 持久图 | **持久图**，定位为可再生缓存（非产物）；图书馆仍是唯一事实源 |
| D2 | 集成载体 | **git subtree 克隆 `vendor/codegraph/` + 二次开发**（用户指令确认，否决 npm 依赖直调） |
| D3 | 守护进程 | **不做 daemon/watcher**，查询时 catch-up sync（复用上游连接时对账机制） |
| D4 | Node 版本门 | **engines 提为 `>=22.5.0`** + 运行时检测优雅降级（2026-10 时点 Node 20 已 EOL、22 为 LTS） |

### 4.2 架构

```
vendor/codegraph/          ← git subtree（--squash，保留上游结构以维 subtree pull 通道）
  编译面：仅 src/{db,extraction,resolution,graph,context,search,sync} + 根级
          {types,utils,errors,directory,project-config,index}.ts → dist/vendor/（CJS 岛）
  排除面：telemetry/mcp/installer/bin/upgrade/ui-server/ui 不进构建（telemetry 物理隔离）
FORK-NOTES.md              ← fork 差异账本（文件/原因/上游基线 commit）
src/core/codegraph/
  engine.ts                ← Node 门禁 + createRequire 单点桥 + 自有最小类型面
  draft.ts                 ← 图 → 登记簿候选草稿渲染器（纯函数）
src/commands/graph.ts      ← doclib graph index|status|draft|explore
```

- **ESM/CJS 边界**：唯一桥点 engine.ts 内 `createRequire(import.meta.url)` require `dist/vendor/index.js`；主 tsconfig 零改动，类型解耦（自有 interface）
- **fork 就地编辑仅三处**（全部记 FORK-NOTES）：index.ts 斩断 MCPServer re-export（隔离 mcp→telemetry 链）；ambient-modules.ts `import.meta` 改 CJS 等价；wasm 子集补齐 in-tree（免 51MB tree-sitter-wasms 依赖）
- **构建链**：`tsc -p tsconfig.vendor.json`（CJS）→ `tsc -p tsconfig.json`（主）→ copy-assets（schema.sql + wasm 子集进 `dist/vendor/{db,extraction/wasm}/`，布局契约：vendored 代码以 `__dirname` 相对定位）
- **依赖终态**：`ignore@^5`（保留，v5/v7 兼容性 EXECUTE 核验）+ 新增 `web-tree-sitter`/`picomatch`/`jsonc-parser`（皆纯 JS 零原生）
- **草稿管道**：`.doclib/drafts/{routes,modules,dependencies,unused}.md`（簿记区不入快照）；条目遵循 Q26/Q34——frontmatter 预填标识（ROUTE-NNN 临时号）/covers（file:line 零猜测）/status/provenance: codegraph-draft，正文留 `契约细节: TODO(agent)` + `时间线: TODO(agent)`，每文件头警示"机器候选禁止直接入馆"

### 4.3 命令族规格

| 命令 | 行为要点 |
| --- | --- |
| `doclib init --graph`（交互第 4 问，回车=否） | state 保存后建图；引擎不可用/失败→告警行，init 仍退出 0 |
| `doclib graph index [--force]` | 未初始化→init+indexAll（进度到 stderr）；已初始化→open+catch-up sync；输出计数摘要，`--json` 支持 |
| `doclib graph status [--json]` | 索引状态/计数/语言覆盖/路由数/框架/最后索引时间 |
| `doclib graph draft [--force]` | 产 4 份草稿；已有同名且无 --force 拒绝 |
| `doclib graph explore <query>` | buildContext markdown 直出 stdout（agent 消费面） |
| `doclib plan`（BUILD） | 检测 `.codegraph/` 存在 → 任务书尾附"知识图谱候选"指引段 |

## 5. 备选方案（已评估否决，留档）

| 备选 | 否决理由 |
| --- | --- |
| B1 npm 依赖 `@colbymchenry/codegraph` + 库 API 直调 | 不符用户指令；API/telemetry/版本受制上游；无法做馆-图对账等深度耦合；平台包链 293MB |
| B2 瞬态图（临时目录建图，导出后丢弃） | 每次建馆全量重索引，长期最贵；失去 build/update/rebuild/accept 全程查询加速能力（P1~P3 持续受益归零） |
| B3 外挂原版 CLI/MCP（`codegraph explore` 等 shell 调用） | 正是用户要消除的"命令输入开支"；黑盒不可仪器化（Q40 三指标无法埋点） |
| B4 ast-grep 确定性扫描替代 | 类别不同不可互替——ast-grep（确定性）服务 check 执法（Q28 已拍板为阶段 1 主选），codegraph（语义索引）服务查询加速；F15 铁律 2 确定性/语义性分层，两者并存 |
| B5 全集 wasm 随包分发（64MB） | dist 膨胀无必要；按 Q28 主流语言口径裁选（约 10-13 文法），余量留 vendor 源码按需补 |

## 6. 实施清单（Phase A+B，Phase C 留档 PRD 不在本轮）

```
实施清单：
1.  git subtree add --prefix vendor/codegraph（v1.6.2 --squash）并核验目录
2.  创建 FORK-NOTES.md（账本骨架 + 上游基线 commit 记录）
3.  新建 tsconfig.vendor.json（CJS 岛编译配置，§4.2 规格）
4.  fork 编辑 vendor 三处（index.ts 去 MCPServer / ambient-modules.ts import.meta / wasm 子集补齐）并逐条记 FORK-NOTES
5.  package.json：deps+engines+build/typecheck/test 脚本
6.  scripts/copy-assets.js 扩展（schema.sql + wasm 子集）
7.  npm install 新依赖；npm run build 全链路打通（vendor CJS 岛编译零错误，含 ignore v5 兼容性核验）
8.  src/core/codegraph/engine.ts（门禁+桥）+ engine.test.ts 绿
9.  src/core/fsutil.ts + src/core/orphan.ts 排除扩展 + 对应测试绿
10. src/commands/graph.ts（index/status）+ cli.ts 接线 + HELP
11. src/core/codegraph/draft.ts（四渲染器）+ draft.test.ts 绿
12. graph draft/explore 命令补全 + graph.test.ts 绿
13. src/core/prompts.ts askGraph + init.ts --graph/交互第 4 问 + plan.ts BUILD 候选段
14. cli.e2e.test.ts 扩展用例
15. npm run typecheck && npm test 全绿（含既有 178 用例无回归）
16. 临时目录冒烟：init --agents claude,opencode --graph → graph index → status --json → draft → 检查 .doclib/drafts/ 四文件与 .codegraph/ 排除生效 → plan 验证任务书候选段
17. skills 四份注入（build/dev/rebuild/accept）+ assets/guides 两档 managed 区一行
18. 图书馆 12 卷同步（PRD v0.24/ADR #12/overview/dependencies/20-modules/30-features/graph.md 新建/50-testing/60-config/90-reference/80-design 显式不适用/feature-map #25/progress）+ ack --dir vendor
19. AGENTS.md/CLAUDE.md custom 区更新（vendor 纪律行）
20. doclib check 自检通过 → doclib snapshot --note "codegraph integration (F15-2)" 固化基线
```

## 7. 验收标准（AC，Given/When/Then）

| # | 验收标准 |
| --- | --- |
| AC1 构建链 | When `npm run build` → Then `dist/vendor/index.js`、`dist/vendor/db/schema.sql`、`dist/vendor/extraction/wasm/`（Q28 子集）在位，主 dist 产物与改造前等价 |
| AC2 门禁降级 | Given Node<22.5（或 isNodeCompatible 边界输入 22.4.9/22.5.0）When 任意 graph 命令 → Then 抛 DoclibError 且文案含"doclib 核心流程不受影响"；init 在同条件下退出 0 且输出告警行 |
| AC3 建图与状态 | Given testkit 临时目录迷你 TS 项目 When `graph index` → Then 输出文件/符号/边/路由计数均 >0 且 `graph status --json` 字段完整（state/languages/frameworks/lastIndexed） |
| AC4 草稿导出 | When `graph draft` → Then `.doclib/drafts/` 四文件生成，每文件含警示头与 provenance: codegraph-draft，条目 frontmatter 标识/covers/status 齐、正文含 TODO(agent) 标记；再次 draft 无 --force 被拒 |
| AC5 排除清单 | Given 存在 `.codegraph/` 的项目 When `doclib snapshot`/`diff`/`check` → Then `.codegraph/` 不出现在 files 账、漂移报告与孤儿报告 |
| AC6 init 集成 | Given 临时目录 When `doclib init --agents claude --graph` → Then 输出含 `- 知识图谱:` 行且 `.codegraph/` 建成；交互问卷含第 4 问 |
| AC7 plan 联动 | Given `.codegraph/` 存在 When `doclib plan` → Then BUILD 任务书含"知识图谱候选"段（drafts 指引）；不存在则不含 |
| AC8 telemetry 隔离 | When 全量检索 `dist/vendor/` → Then 无 telemetry 端点字符串、无出网调用代码路径；FORK-NOTES 记录斩断点 |
| AC9 回归安全 | When `npm run typecheck && npm test` → Then 全绿，既有 178 用例零回归，新增用例计入 |
| AC10 冒烟闭环 | When 清洁临时目录走清单 #16 全流程 → Then 每步符合预期且 `doclib graph explore "入口"` 返回 markdown 上下文 |
| AC11 治理同步 | When `doclib check` → Then 通过；feature-map #25 登记、progress.md 补记、ADR #12 在馆、`ack --dir vendor` 已登记 |
| AC12 skills 与引导 | Given doclib sync 再生 → Then 四 skill 含图查询指引、light/full 引导含 graph 速查行且 managed 区 ≤150 行 |

## 8. 遗留与后续（Phase C 留档）

- 馆-图对账指标化（缺口发现率 = 图实体全集 ↔ 登记簿 diff）→ Q40 三指标事后验证（下轮基准实验埋点）
- diff 影响面预警、unused→登记簿状态机候选直通
- 内核二进制（Rust）视 wasm 路径实测性能决定（optionalDependencies 平台包机制照搬上游）
- MCP 面暴露（vendored mcp/ 保留源码未编译，后续可重启）

---

> ⚠️ 双锚点纪律提醒：本规划文档完成即触发 feature-map 登记 planned（#25）——待用户批准后随 EXECUTE 清单 #18 一并入账。
