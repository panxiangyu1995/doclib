# 质量符合性修复包（quality-conformance-pack）

- 日期：2026-10-20
- 状态：规划完成，待批准执行（EXECUTE 未启动）
- 范围：仅 A 修复包 + B 兑现包；C 契约扩展包四项全部缓行（用户拍板）
- 关联：PRD v0.26（F13 文档质量检测 / F4 两级索引 / Q22 治理分公式 / Q36 乐观锁）、feature-map #20

## 一、目的与效果

按 PRD 开发需求对现有代码（v0.4.0）做质量检查后，修复研究中确证的缺陷并兑现 PRD 已拍板未落全的语义。完成后达到：

1. CI 模板安装正确的 scoped 包名，且包名从单一事实源读取（再改名零代码改动）
2. `doclib status --json` 兑现 HELP 承诺，成为 CI/脚本消费治理状态的单一出口
3. 治理健康分"文档质量"分项由硬编码满分变为真实扣减（链接失效每项 −10%）
4. verify 完成 F4 两级索引双向核对（INDEX 级 + 卷级 `_index`）
5. state.json 损坏不再可能被空状态静默覆盖（快照链可追溯承诺闭环）
6. plan 命令 stdout 输出 revision，兑现 F13"check/plan/snapshot 均输出 revision"

## 二、问题点

| # | 级别 | 问题 | 证据 |
| --- | --- | --- | --- |
| D1 | 高 | CI 模板包名过期：生成 `npx --yes doclib@<ver>`，实际包名 `@panxiangyu1995/doclib`（v0.26 scoped 改名）；测试断言将错误固化 | src/commands/hook.ts:41、hook.test.ts:51 |
| D2 | 中 | `doclib status --json` 不输出 JSON：HELP 声称支持（cli.ts:84），但 cli.ts:119 status 分支不传 flags | 冒烟确证输出纯文本 |
| D3 | 中 | 健康分"文档质量"分项恒为 1（check.ts:31 硬编码）；链接失效检测存在于 verify.ts:59-71 但未接入 check；依赖版本对账未实现（缺 60-config 登记契约） | PRD Q22 规定该分项占 10% 权重 |
| D4 | 低频高危 | state.json 损坏时 loadState 静默返回 emptyState（state.ts:78-80），调用方 saveState 会以空状态覆盖——快照链丢失路径 | 与 PRD"误删可追回"承诺冲突 |
| G1 | 中 | verify 两级索引核对只做 INDEX 级双向 + 全馆链接失效；"各卷 _index.md 是否收录全卷文档"未核对（v0.26.1 D1 声称已落地） | verify.ts:46-71 |
| 小项 | 低 | feature-map #5"模板 22 文件"失真（实际 24）；plan stdout 无 revision 行 | — |

## 三、研究结果

### 验证方法（信息源交叉验证）

| 手段 | 结果 |
| --- | --- |
| `npm run typecheck` | 通过（strict + noUncheckedIndexedAccess 生效） |
| `npm test` | 52/52 全绿（238ms） |
| 临时目录全流程冒烟 | init → plan(BUILD) → snapshot → 改文件 → diff → plan(UPDATE) → status → check → ack → check → reconcile → hook --ci 全链路跑通 |
| 读码 | src/ 全量 38 文件 + assets/skills/package.json/tsconfig.json |

### PRD 符合性核对结论

符合项：F6 十一命令全落地；§8 状态模型；F5 引导文件（区域契约/版本戳/sync 幂等/150 行预算，冒烟实测 55/150）；F8 BOOTSTRAP/RESUME 互斥；F9 载体声明与双锚点提醒；F11 reconcile 三段；F12 迁移五类校验；F13 主体（八分类对账/ack/hook/revision/孤儿/健康分，soft 退出码 0、strict 才置 1）；F10 三 agent 适配基本符合。

不符合/缺口：见上表 D1–D4、G1；另有 F4 登记簿完备性、F1 冷启动盘点、F2 移除规程、F15 扫描器未实现——与 feature-map #17/#19 planned 状态一致（非本轮范围）。

### 工程纪律核对

ESM `.js` 后缀 ✓；源码零注释 ✓；错误统一 DoclibError ✓；运行时仅依赖 ignore ✓；strict + noUncheckedIndexedAccess ✓。

测试覆盖缺口：core 的 detect/prompts/version 无测试；commands 仅 plan/hook 有测试（其余 9 命令靠冒烟）。本轮按"改到哪测到哪"补关键用例，不全量补齐。

## 四、代码实际情况

- `src/core/version.ts`：`readVersion()` 读 package.json 的 version，失败回退 "0.0.0"；导出 `CLI_VERSION`、`STRUCTURE_VERSION = 3`
- `src/commands/hook.ts`：`CI_WORKFLOW` 为模块级模板字符串常量，安装行硬编码 `doclib@${CLI_VERSION}`
- `src/commands/status.ts`：`runStatus(root)` 无 opts；返回 `{ text, json: { state, detection } }`，json 分支未接
- `src/commands/plan.ts`：`runPlan` 互斥校验后按 rebuild/bootstrap/resume/default 四路分支；任务书内容含 revision，stdout 不含
- `src/commands/verify.ts`：链接失效检测内联在 59-71 行（跳过 INDEX.md、外链/锚点/绝对路径）；indexIssues 载荷字段已有
- `src/core/check.ts`：`healthScore` inputs 为 {driftTotal, unaccounted, uncovered, migration, orphan, guideStale}，`quality = 1` 硬编码；扣减率现状 migration 0.2/项、orphan 0.1/项、guides 0.5/项
- `src/core/ledger.ts`：`CheckFindingKind = "unaccounted" | "uncovered" | "migration" | "guide-stale" | "orphan-doc"`
- `src/core/state.ts`：`loadState` 用 `readFileOrNull` 吞掉一切错误 → emptyState
- 馆内文档：30-features/ 有 check.md、init-v2.md；20-modules/ 仅 _index.md；70-deploy/deploy.md:47 存在同款未 scoped 包名失真（`npm dist-tag add doclib@<旧版>`）；progress.md:26 为历史时间线记录（留史不改）

## 五、拍板记录（用户已裁决）

1. A1 采方案②：包名单一事实源（package.json 读取），非字面替换
2. B3 采①+备份叠加：fail-fast 抛错，抛错前先备份 .corrupt
3. C 契约扩展包四项（依赖版本对账/F12 legacy 收编标记/Cursor rules/登记簿完备性）全部缓行，只做 A+B
4. A2 采完整读数 schema（非最小载荷）

## 六、设计的方案

### A1 · 包名单一事实源

- `src/core/version.ts`：读取函数重构为同时返回 `{ name, version }`；新增导出 `PACKAGE_NAME: string`（取 package.json `name`，读取失败回退 `"@panxiangyu1995/doclib"`）；`CLI_VERSION` 行为不变
- `src/commands/hook.ts`：导入 `PACKAGE_NAME`；CI_WORKFLOW 安装行改为 `${PACKAGE_NAME}@${CLI_VERSION}`
- `src/commands/hook.test.ts`：导入两常量，断言改为由 `${PACKAGE_NAME}@${CLI_VERSION}` 插值构造，不再硬编码包名

### A2 · status --json 兑现

- `src/cli.ts`：`case "status"` 将 flags 传入 runStatus
- `src/commands/status.ts`：签名改 `runStatus(root: string, opts?: { json?: boolean })`；文本路径行为不变；`--json` 输出载荷 schema：

```
{
  library: { initialized, version, structureVersion, agents },
  revision: number,
  baseline: { id, at, note, snapshotCount } | null,
  drift: { added, modified, removed } | null,
  health: { score, grade } | null,
  planning: { paths, reminder },
  guides: { stamp, budget },
  detection: Detection,
  tasks: string[]
}
```

### A3 · 小项

- `src/commands/plan.ts`：`runPlan` 顶部 loadState 一次，五种任务书分支 stdout 均插入 `revision: <n>` 行；任务书生成器内部 loadState 不动（最小扰动，接受重复读取）
- `doclib/00-overview/feature-map.md`：#5 描述去数字化 → "12 卷 + 99-archive 骨架 + copy-assets 构建链"

### B1 · 链接检测核心化 + 质量分项接线

- 新建 `src/core/docquality.ts`：
  - `scanBrokenLinks(root: string): Promise<string[]>`——扫描 `doclib/**.md` 内相对 `.md` 链接存在性（外链 http(s)/锚点/绝对路径跳过；INDEX.md 自身跳过，保留 verify 既有口径），返回 `${doc} → ${link}` 失效清单
  - `checkVolumeIndexes(libraryRoot: string): Promise<{ missingIndex: string[]; unlisted: Array<{ dir: string; docs: string[] }> }>`——通用规则：凡含 `_index.md` 的目录，`_index` 须收录其直接子级全部 `.md`；两位编号卷缺 `_index.md` 记入 missingIndex（soft，不判违规）
- `src/core/ledger.ts`：`CheckFindingKind` 增加 `"doc-quality"`
- `src/core/check.ts`：`runCheckCore` 调 `scanBrokenLinks`，每条失效推 finding（kind "doc-quality"、path=所在文档、detail=失效链接）；`healthScore` 输入增 `brokenLinks: number`，`quality = max(0, 1 − 0.1 × brokenLinks)`（扣减率与 orphan 对齐），移除硬编码；doc-quality 计入 strict 门禁（PRD F13"失效即报告"，与迁移/引导过期同列违规类）
- `src/commands/check.ts`：kinds 数组与 kindLabel 增 `doc-quality → "文档质量"`

### B2 · verify 两级索引核对补全

- `src/commands/verify.ts`：删除内联 brokenLinks 循环改调 `scanBrokenLinks`；调用 `checkVolumeIndexes`——unlisted 并入 indexIssues，missingIndex 以"卷缺 _index（soft 提示）"文案并入报告；报告行标签"INDEX 完整性"改为"索引完整性"；JSON 载荷沿用既有 `indexIssues` 字段（不破坏消费者）

### B3 · state 损坏防护

- `src/core/state.ts`：`loadState` 改为直接读文件——ENOENT/ENOTDIR（未初始化）→ emptyState()；JSON 解析失败、空文件、其他读错误 → 先复制原文件为 `.doclib/state.json.corrupt-<时间戳>`（冒号与点替换为连字符），再抛 `DoclibError`（消息指引从 .corrupt 备份或 git 恢复）

### 馆内同步（dogfooding 实时同步义务）

- `doclib/70-deploy/deploy.md`：第 47 行 dist-tag 回滚命令未 scoped 包名修正（失真态）
- `doclib/30-features/check.md`：补"文档质量分类（断链检出、quality 分项公式、strict 门禁语义）"条款
- `doclib/20-modules/_index.md`：登记 `core/docquality` 模块（职责/边界）
- `doclib/00-overview/feature-map.md`：新增行登记本轮功能（implemented）；#5 去数字修正
- `doclib/00-overview/progress.md`：补记本轮开发
- 收尾 `doclib snapshot` 固化基线

## 七、备选方案与取舍

| 项 | 被否方案 | 否决理由 | 采纳方案 |
| --- | --- | --- | --- |
| A1 | ① 字面替换 scoped 名；③ CI 模板 assets 化 | ① 根因（硬编码）仍在；③ 过度工程，仅一行变量 | ② 单一事实源 |
| A2 | ② HELP 删除 status | 倒退——治理分机器读数是 F13 判活标准入口，删除违背 PRD §9.5 | ① 接线 + 完整载荷 |
| B1 | ② 连依赖版本对账一并做；③ PRD 降级分项 | ② 60-config 无登记契约，是伪实现；③ 违背 Q22 拍板 | ① 仅接线链接存在性；依赖对账缓行 |
| B2 | ② 索引核对移入 check | 归属错位：PRD 将索引完整性定义在 F4 verify，违背"skill 与 CLI 语义同步"纪律 | ① verify 扩展，soft 语义 |
| B3 | ① 纯 fail-fast 不备份；② 备份后静默继续；③ 维持现状 | ① 丢备份便利；② version 归零后 snapshot 语义混乱；③ 快照链可被静默击穿 | ①+备份叠加 |
| 测试 | 全量补 9 命令测试 | 性价比低，冒烟已覆盖主链路 | 改到哪测到哪 |
| C 包 | 立即实施 | 范围蔓延；登记簿无实体条目机器检查无对象；本仓库无迁移 legacy 收编收益为零 | 全部缓行，随 feature-map 既有 planned 项立项 |

## 八、实施清单

```
实施清单：
1. version.ts：readPkg 重构 + 导出 PACKAGE_NAME（回退 @panxiangyu1995/doclib）
2. hook.ts：CI_WORKFLOW 安装行改用 ${PACKAGE_NAME}@${CLI_VERSION}
3. hook.test.ts：断言改为由 PACKAGE_NAME/CLI_VERSION 插值构造
4. cli.ts：status 分支传入 flags
5. status.ts：runStatus 增加 opts.json 分支与完整读数载荷（文本路径不变）
6. plan.ts：runPlan 顶部 loadState，五种任务书 stdout 均含 revision 行
7. 新建 core/docquality.ts：scanBrokenLinks + checkVolumeIndexes
8. ledger.ts：CheckFindingKind 增加 "doc-quality"
9. core/check.ts：runCheckCore 接断链 findings；healthScore 增 brokenLinks 输入，quality 公式化
10. commands/check.ts：kinds/kindLabel 增"文档质量"
11. verify.ts：改调 scanBrokenLinks + 接入 checkVolumeIndexes（两级索引 + soft 卷提示 + 标签改"索引完整性"）
12. state.ts：loadState 区分 ENOENT 与损坏；损坏先备份 .corrupt 再抛 DoclibError
13. 新建 docquality.test.ts；check.test.ts 适配+新增用例；state.test.ts 新增三用例
14. npm run typecheck && npm test 全绿
15. 临时目录冒烟六断言（见下节）
16. 馆内同步：70-deploy/deploy.md 失真修正；30-features/check.md 补条款；20-modules/_index.md 登记 docquality
17. feature-map：#5 去数字 + 新增行登记本轮功能（implemented）；progress.md 补记
18. doclib snapshot 固化基线
```

## 九、验收断言（冒烟六断言）

1. `init --agents claude` → 引导/skills 正常落位
2. `status --json` 输出可 JSON.parse 且含 health/drift 字段
3. `plan` stdout 含 revision 行
4. 在 doclib/ 内制造断链 → check 出现"文档质量"分类且治理分下降；verify 报失效链接与卷级索引
5. 写坏 .doclib/state.json → 任意命令报 DoclibError 且生成 .corrupt 备份
6. `hook --ci github` 生成的 yml 含 `@panxiangyu1995/doclib@<version>`

## 任务进度

- 2026-10-20 EXECUTE（清单 1-18）
  - 已修改：src/core/version.ts（readPkg+PACKAGE_NAME）、src/commands/hook.ts（CI 模板事实源化）、src/commands/hook.test.ts（插值断言）、src/cli.ts（status 接线 flags）、src/commands/status.ts（opts.json+完整载荷）、src/commands/plan.ts（五分支 revision 行）、src/core/docquality.ts（新建：scanBrokenLinks/checkVolumeIndexes）、src/core/ledger.ts（doc-quality）、src/core/check.ts（断链 findings+quality 公式）、src/commands/check.ts（展示）、src/commands/verify.ts（同源扫描+两级索引+标签）、src/core/state.ts（损坏防护）、src/core/docquality.test.ts（新建 3 用例）、src/core/check.test.ts（+1 用例/签名适配）、src/core/state.test.ts（+3 用例）、package.json（测试清单补 docquality.test.js）
  - 更改：A1/A2/A3/B1/B2/B3 全部按计划落地
  - 原因：见本文件"问题点"与"拍板记录"
  - 偏差留痕：①deploy.md 第 31 行 `npmjs.com/package/doclib` 为执行中新发现、与第 47 行同类失真，按清单第 16 步"失真修正"语义一并修正；②check.md"七分类"计数与 8 行表格自相矛盾（存量失真），随本次新增第九行修正为九分类；③20-modules core/check 行"六分类"因本次变为九分类同步去数字；④docquality.test.js 补入 package.json 测试清单（否则新用例不运行）
  - 阻碍因素：无
  - 状态：成功（typecheck ✓；测试 59/59 ✓；冒烟六断言+strict 探针全过）
