---
title: 测试策略
covers:
  - package.json
  - src/core/
status: stable
---

# 测试策略

> 测试是行为规格的可执行形态：DocLib 用零依赖测试链锁定 13 命令的确定性契约——任何行为变更都要先过测试再进馆。

## 为什么

选 node:test 而非 vitest/jest：测试框架本身必须服从"零重依赖"架构铁律（ADR #13 精神）；显式列出测试文件而非目录 glob（Node 24 目录解析缺陷，ADR #5）。

## 是什么

测试资产分三层：core/ 逐模块单测（纯逻辑直测）、commands/ 逐命令套件（临时目录冒烟）、cli.e2e（spawn 真实二进制锁契约）——三层与 src 结构同构，测试即活文档：

- 框架：node:test（零依赖）；运行 `npm test`（构建 + 显式列出 dist 下 *.test.js，**32 个测试文件 / 266 用例**【v0.5.1 校正】：v0.31 起 240→242（门面多语言变体模式识别 +2 例）→249（docquality 文体合规 +7 例：结构完备性/合规样例/卡片化/注记污染与编号不误报/ledger 豁免与 type 覆盖/倾倒警告/路径豁免）→252（旗标面对账 #29 增量，v0.32 文体系统收尾后复核实测值）→254（v0.34 reconcile 旗标面对账 +2 例，当时未及入档）→261（v0.5.1 hook 健壮化 +7：relativeCliPath 双分支/脚本自检/worktree 落位/e2e 阻断/e2e 放行 + status 门禁未安装/strict 两例）→**266**（init 自动装门禁 +5：init 四场景 git/非 git/foreign/--no-hook + hook 幂等覆盖），266/266 全绿）
- 分层：core/ 纯逻辑逐模块单测（frontmatter/mapping/fsutil/state/orphan/place/docquality/codegraph engine+draft）；命令层以临时目录冒烟覆盖（init→plan→snapshot→diff→plan→verify→rebuild 闭环）+ 自动化测试文件（commands/ 14 套件含 graph）
- graph 测试【v0.30】：engine 门禁边界（isNodeCompatible）+ draft 渲染器 fixture 断言（警示头/provenance/TODO）+ graph 命令 testkit 实建图（index/status/draft/explore/错误路径）+ e2e init --graph 全流程；**Node < 22.5 环境自动 skip 守卫**（engineReady 探测），保证低版本 CI 不假红
- 种子文档合规【v0.32】：testkit `docMd` 生成教科书结构种子（导读+三段），保证 check/verify 类测试在新文体门禁下语义不变

## 怎么运转

跑测入口唯一：`npm test`（typecheck 内嵌于 build）；CI 与 prepublishOnly 强制全量。运维纪律如下：

- 关键用例锚点：PRD F2 三层保活、F11 对账、F13 四态判定与处置闭环、F15 阶段 2 图谱三用途、F28 文体门禁四检查——实现时逐条补为可执行验收标准（30-features）
- 约定：测试文件与被测模块同目录 `*.test.ts`；新增命令须同步新增冒烟路径到 AGENTS.md 验证节；**不可逆动作类功能必须三段验收**（干跑零副作用 → `--apply` 后状态正确 → 还原路径可用）
- bug 修复后的回归用例回填本卷对应条目并链接 95-lessons 对应条目
