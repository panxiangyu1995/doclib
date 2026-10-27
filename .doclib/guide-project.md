---
snapshot: 86
docs-hash: 2a4a59f33f0aecc3060c73e43cbe7cda2a470fb5abc515f86143f1c9d2230c98
volumes-fed: [00-overview, 10-architecture, 20-modules, 30-features, 40-guides, 50-testing, 60-config, 95-lessons]
volumes-na: [70-deploy, 80-design, 90-reference, 99-archive]
---

## 项目定位

- DocLib：把任意代码项目蒸馏成「可复原的文档图书馆」——任何 agent 或人只凭 `doclib/` 即可从零重建该项目（≥90% 功能复原）（`doclib/00-overview/project.md`）
- 本仓库 dogfooding：DocLib 以自身图书馆管理自身开发（`doclib/README.md`）

## 架构速览

- CLI 入口 `src/cli.ts`，十四命令于 `src/commands/`（init/plan/diff/snapshot/status/verify/sync/check/ack/place/hook/reconcile/graph/implement）；纯逻辑于 `src/core/`（`doclib/20-modules/_index.md`）
- 规划直通车（F17）：对话规划 bootstrap 五阶段→工具收编（BMAD/spec-kit/OpenSpec/Kiro 快照式）→`doclib implement` 拆单（readiness+AC 锚点骨架）→门禁三件套（`doclib/30-features/040-planning-express.md`）
- 知识图谱引擎 vendored 于 `vendor/codegraph/`（git subtree；就地改动必须登记 FORK-NOTES.md，优先在 adapter 层 `src/core/codegraph/` 扩展）（`doclib/30-features/graph.md`）
- 需求唯一事实源 `doclib/10-architecture/prd.md`｜设计 `doclib/10-architecture/design.md`｜ADR 账本 `doclib/10-architecture/decisions.md`

## 模块地图

- `commands/` 参数解析与输出编排（返回 {text, json}）；`core/` 纯逻辑零副作用——两者边界不可反向，模块与职责清单以 `doclib/20-modules/_index.md` 为唯一事实源（数字易腐，此处不抄）
- 架构三原则：纯 Markdown 产物、确定性执法、零重依赖——一切设计裁决回溯这三条（`doclib/10-architecture/overview.md`）

## 开发宪法

- 架构铁律：commands/core 职责边界不可反向｜vendored 源禁直改（FORK-NOTES.md 登记账）｜图谱扩展走 adapter 层｜破坏约定先立 ADR 再动代码（`10-architecture/overview.md`·`decisions.md`·`40-guides/conventions.md`）
- 编码铁律：TypeScript ESM 导入带 `.js` 后缀｜strict + noUncheckedIndexedAccess（数组访问判空是常态）｜源码不写注释（设计解释进 ADR）｜用户可见错误一律抛 DoclibError｜文件 kebab-case/导出动宾/常量全大写（`40-guides/conventions.md`）
- 数据与迁移：N-A（无数据库；引入持久化时先在 `10-architecture/migrations.md` 账本取号，forward-only、applied 不可变）
- UI/UX：N-A（CLI 无图形界面，`80-design/README.md` 显式声明；CLI 文案体验归 30-features 行为规格）
- 测试与验收铁律：node:test + assert/strict 零依赖，测试与被测同目录 `*.test.ts`，新测试文件必须登记 package.json test script（漏登记=静默退出门禁）｜typecheck + 全量测试绿后，命令行为改动须临时目录冒烟（`50-testing/testing.md`）｜**时间比较类断言必须显式设定时间戳**（文件系统 mtime 精度跨环境不一致：本地 ns、CI overlayfs 整秒；依赖「刚写完就比基线晚」的断言是亚毫秒级竞态——本地靠 2ms 运气绿、CI 必红）
- 禁区：禁直改引导 project 区（改簿记后 sync）｜禁引入重运行时依赖（先过零重依赖审视，ADR #13）｜禁无账回答实体问题（先馆后码，查询即建账）｜馆与记忆冲突以馆为准（`10-architecture/overview.md`·`30-features/guides.md`）
- 规则唯一事实源指针：架构/编码/迁移/UI/测试规则一律以馆为准；馆无规则→提案入 ADR/规格，禁止即兴发明；外部规则文档以馆内收编版本为准（`10-architecture/overview.md`）

## 命令速查

- `npm run build`（tsc vendor 岛 + 主工程 + copy-assets）｜`npm run typecheck`｜`npm test`｜CLI 试运行 `node dist/cli.js <命令>`（`60-config/config.md`）
