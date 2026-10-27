---
title: 测试策略
covers:
  - package.json
  - src/core/
status: stable
test-chain-fast: npm run typecheck
test-chain-full: npm test
---

# 测试策略

> 测试是行为规格的可执行形态：DocLib 用零依赖测试链锁定 14 命令的确定性契约——任何行为变更都要先过测试再进馆。

## 为什么

选 node:test 而非 vitest/jest：测试框架本身必须服从"零重依赖"架构铁律（ADR #13 精神）；显式列出测试文件而非目录 glob（Node 24 目录解析缺陷，ADR #5）。

## 是什么

测试资产分三层：core/ 逐模块单测（纯逻辑直测）、commands/ 逐命令套件（临时目录冒烟）、cli.e2e（spawn 真实二进制锁契约）——三层与 src 结构同构，测试即活文档：

- 框架：node:test（零依赖）；运行 `npm test`（构建 + 显式列出 dist 下 *.test.js，**33 个测试文件 / 307 用例**【v0.6.2 校正】：v0.31 起 240→242（门面多语言变体模式识别 +2 例）→249（docquality 文体合规 +7 例：结构完备性/合规样例/卡片化/注记污染与编号不误报/ledger 豁免与 type 覆盖/倾倒警告/路径豁免）→252（旗标面对账 #29 增量，v0.32 文体系统收尾后复核实测值）→254（v0.34 reconcile 旗标面对账 +2 例，当时未及入档）→261（v0.5.1 hook 健壮化 +7：relativeCliPath 双分支/脚本自检/worktree 落位/e2e 阻断/e2e 放行 + status 门禁未安装/strict 两例）→266（init 自动装门禁 +5：init 四场景 git/非 git/foreign/--no-hook + hook 幂等覆盖）→269（hook REVIEW 回归 +3：重装恢复 0o755/损坏指针 init 不失败/foreign 四态）→279（v0.6.0 引导反哺 +10：guides 层 6 例三区与注入/预算/指纹 + sync 2 例注入幂等与簿记变更传播 + check 2 例蒸馏过期闭环与 project 直改闭环）→282（REVIEW 轮 D-1 修复 +3：readGuideProject 区域标记校验 fail-fast/status 观测面降级提示/check 执法面拒绝）→283（对话档案区 98-sessions 全豁免 +1：文体/污染/卡片化三检全跳过实证）→284（surface 旗标面豁免 98-sessions 档案区 +1：原文不改写不进对账实证；上轮链记录与实测存在 -8 漂移，本轮实测校正）→**291**（v0.6.1 归档闭环三不变量与载体检测 +15：core/archival.test 新建 8 例/planning suggestCarriers+detectCarrierShape 2 例/check 集成 2 例（载体未登记检出+无载体零误报）/place 载体形态 1 例/status 载体建议 1 例/init 载体建议 1 例；「自定义规划载体目录不判孤儿」fixture 按新契约修正不增减）；v0.6.1 实测 291——**事后发现 archival.test.js 未登记 test script，8 例静默未进门禁**（显式列表代价，教训入档 95-lessons 并立清单 diff 自查纪律））→ **307**（v0.6.2：lesson-gap +1 init 用例 + archival.test.js 补登记 15 例首次进门禁；test script 清单 33 文件与 dist 全集 diff 校验为零遗漏），307/307 全绿）→ **311**（v0.6.3 开发宪法走查账 +4：parseVolumesWalk 三态 1 例/guideWalkVerdict 四场景 1 例/runCheck 走查违规闭环与缺席 notice 1 例/status 反哺行走查覆盖度三态 1 例），311/311 全绿；REVIEW 轮（R-1~R-4/R-8 修复）用例数不变——既有用例内扩 fed 重复/overlap 去重/status 11-12 去重/docquality 98-sessions 链接豁免断言）→ **314**（v0.6.4 教训来源缺失 +3：无标记不活跃与存量豁免 1 例/标记非法 fail-fast 与缺来源违规 1 例/路径 token 失效与真实路径与描述性来源合法 1 例）→ **332**（v0.7.0 规划直通车 +18：core/implement.test 新建 7 例（候选/readiness 四态/slugify/骨架契约/验收锚点正反例与 F9 自由格式豁免）+ commands/implement.test 新建 5 例（候选清单/readiness 拒绝不落盘/干跑/apply 落盘 frontmatter 齐备/未知功能号）+ archival 实施锚点镜像 2 例 + docquality 假设残留三态 1 例 + planning provenance 对账 1 例 + 既有 plan.test BOOTSTRAP 模板断言随新五阶段指引更新 2 例），332/332 全绿）→ **334**（v0.7.0 REVIEW 轮 +2：archival ASCII "-" 同判 1/implement 标量 anchors 校验 1），334/334 全绿）→ **348**（v0.8.0 记忆快照 #40 +14：core/guides.test 7 例（applyMemoryRegion 注入/readGuideMemory 三态与解析/日期非法 fail-fast 与 window 降级/区域标记防注入/renderFullGuide+writeGuides 四区注入两份一致/managedRegionFresh memory 直改检出/预算超限）+ commands/check.test 4 例（指针失效 soft notice 不进 findings/指针全命中/无簿记零输出/标记污染执法面 fail-fast）+ commands/status.test 2 例（记忆行三态含滞后与画像可刷新后缀/污染与日期非法降级 ⚠）+ commands/sync.test 1 例（guide-memory 注入两份一致幂等）），348/348 全绿）→ **349**（v0.8.0 字符集根治 +1：commands/check.test 反引号/星号包裹路径界定符不进 token 1 例；core/archival.test 既有 token 用例内扩 2 场景块——反引号+星号包裹真实路径零误报/反引号内失效路径 token 干净），349/349 全绿）→ **350**（v0.8.0 REVIEW 轮 R-1..R-4 修复 +1：commands/check.test 相对穿越 token → memory-pointer notice 1 例；既有用例内扩：guides 2026-13-45 语义校验回归（R-1）/archival 引号与直角引号包裹零误报 + 穿越 token 判违规（R-2/R-3）/check 界定符用例补引号与「」形态），350/350 全绿）
- 分层：core/ 纯逻辑逐模块单测（frontmatter/mapping/fsutil/state/orphan/place/docquality/codegraph engine+draft）；命令层以临时目录冒烟覆盖（init→plan→snapshot→diff→plan→verify→rebuild 闭环）+ 自动化测试文件（commands/ 14 套件含 graph）
- graph 测试【v0.30】：engine 门禁边界（isNodeCompatible）+ draft 渲染器 fixture 断言（警示头/provenance/TODO）+ graph 命令 testkit 实建图（index/status/draft/explore/错误路径）+ e2e init --graph 全流程；**Node < 22.5 环境自动 skip 守卫**（engineReady 探测），保证低版本 CI 不假红
- 种子文档合规【v0.32】：testkit `docMd` 生成教科书结构种子（导读+三段），保证 check/verify 类测试在新文体门禁下语义不变

## 怎么运转

跑测入口唯一：`npm test`（typecheck 内嵌于 build）；CI 与 prepublishOnly 强制全量。运维纪律如下：

- 关键用例锚点：PRD F2 三层保活、F11 对账、F13 四态判定与处置闭环、F15 阶段 2 图谱三用途、F28 文体门禁四检查——实现时逐条补为可执行验收标准（30-features）
- 约定：测试文件与被测模块同目录 `*.test.ts`；新增命令须同步新增冒烟路径到 AGENTS.md 验证节；**不可逆动作类功能必须三段验收**（干跑零副作用 → `--apply` 后状态正确 → 还原路径可用）
- bug 修复后的回归用例回填本卷对应条目并链接 95-lessons 对应条目
