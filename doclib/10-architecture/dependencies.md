---
title: 依赖选型决策记录
covers:
  - package.json
status: stable
type: ledger
---

# 依赖选型决策记录
> 不只记"用了什么"，更记"为什么、考虑过什么、将来怎么换"。台账条目 = 运行时依赖逐项登记。

| 依赖 | 用途 | 选型理由 | 被否替代品 | 升级/替换策略 | 若不可用的影响 |
| --- | --- | --- | --- | --- | --- |
| ignore ^5.3.2 | gitignore 语义匹配（collectFiles） | 手写 glob/gitignore 子集易错且难测；ignore 是 eslint 等同款 | 自写匹配器（已在 v0.1 评估并否决） | 锁 ^5；替换需重跑全部 fsutil 测试 | 文件遍历降级为朴素匹配，ignore 语义失真 |
| web-tree-sitter ^0.25.3 | wasm tree-sitter 运行时（vendored 引擎解析层） | codegraph 图谱引擎的解析基底；纯 JS 零原生 | 自研解析（不可行）；tree-sitter native binding（违背零原生） | 随 vendor/codegraph subtree 同步升级 | graph 功能不可用（doclib 核心不受影响，可选增强优雅降级） |
| picomatch ^4.0.3 | glob 匹配（vendored resolution/frameworks） | 上游引擎依赖；纯 JS | minimatch（上游未用） | 同上 | 同上 |
| jsonc-parser ^3.3.1 | JSONC 解析（vendored project-config） | 上游引擎读 codegraph.json 配置；纯 JS | 自写（易错） | 同上 | 同上 |

**运行时依赖纪律修订【v0.30，ADR #13】**：原"仅依赖 ignore"条款修订为"ignore + vendored 图谱引擎解析运行时（web-tree-sitter/picomatch/jsonc-parser，皆纯 JS 零原生）"——`doclib graph` 为可选增强，整体可降级；运行时依赖零原生模块底线不变。

## vendored 引擎（vendor/codegraph，非 npm 依赖）

- 集成形态：git subtree 克隆 colbymchenry/codegraph v1.6.2（MIT）+ 二次开发（否决 npm 依赖直调：API/telemetry/深度耦合受制上游）
- 编译面：核心子集（db/extraction/resolution/graph/context/search/sync + mcp 两叶子）经 tsconfig.vendor.json → `dist/vendor/`（CJS 岛）；telemetry/installer/bin/upgrade/ui 不进构建（telemetry 物理隔离不触网）
- fork 差异账本：FORK-NOTES.md（subtree 合并审计锚点）；同步通道 `git subtree pull`
- 引擎运行时要求：Node >= 22.5（node:sqlite）；缺失时 graph 功能整体降级
- wasm 文法：Q28 口径 13 文法随 dist 分发（in-tree 齐备，无 tree-sitter-wasms 51MB 依赖）

## 构建期（非运行时依赖）

| 项 | 说明 |
| --- | --- |
| typescript ^5.6 | devDep，tsc 编译 |
| @types/node ^22 | devDep |
| @types/picomatch ^4.0.2 | devDep，vendored 引擎类型（上游同款） |
| scripts/copy-assets.js | node:fs 递归拷贝（零依赖脚本）：assets/ 与 skills/ → dist/assets/；vendor schema.sql + 13 wasm → dist/vendor/；写入 dist/vendor/package.json（type commonjs 作用域标记） |

> v0.10.0（#44）：运行时依赖零变化（git 探测用 Node 内置 `node:child_process`——`core/gitinfo.ts`，无新依赖引入）；仅 package.json 版本字段 0.9.0→0.10.0。
