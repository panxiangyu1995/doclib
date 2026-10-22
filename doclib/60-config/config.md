---
title: 工程设置全集
covers:
  - package.json
  - tsconfig.json
  - .gitignore
  - scripts/copy-assets.js
status: stable
---

# 工程设置全集

| 设置 | 取值 | 理由 |
| --- | --- | --- |
| 模块体系 | ESM（imports 带 .js 后缀） | Node 原生、agentic 生态亲和 |
| TypeScript | strict + noUncheckedIndexedAccess + NodeNext | 严格空安全；Node ESM 解析 |
| 运行时依赖 | ignore + web-tree-sitter/picomatch/jsonc-parser（vendored 图谱引擎解析运行时，皆纯 JS 零原生）【v0.30 修订】 | 依赖最小化 + 可选增强；零原生底线不变（ADR #13） |
| node 版本 | >=22.5.0【v0.30 起】 | node:sqlite（vendored 图谱引擎硬依赖）；2026-10 时点 Node 20 已 EOL、22 为 LTS；graph 可选增强优雅降级 |
| 构建清理 | build 前置 node -e rmSync dist | 跨平台零依赖；防 tsc 孤儿产物残留入发布包 |
| 注释 | 源码不写注释 | 知识一律入图书馆，代码内注释会腐烂 |
| 错误 | 一律抛 DoclibError，cli 统一捕获 | 统一错误面 |
| 归档账上限 | `MAX_ARCHIVES = 200` | 与快照链 20 条同构：档案文件永久保留（Q27），仅账本条目封顶 |
| 版本 | 0.5.0（structure v3） | v0.5.0：孤儿四态判定 + 三层防线 + `doclib place` 处置闭环 + 剔除列扩围（28 工具链目录 + 任意层级引导文件）+ `ack --dir` + 漂移语义修正 + `doclib graph` 知识图谱（F15 阶段 2）；版本与结构版本分离追踪 |

## 构建

- `npm run build` = `rmSync dist` → `tsc -p tsconfig.vendor.json`（vendored CJS 岛 → dist/vendor/）→ `tsc -p tsconfig.json`（主 ESM）→ `node scripts/copy-assets.js`
- copy-assets：assets/ 与 skills/ → dist/assets/；vendor `db/schema.sql` + Q28 口径 13 wasm 文法 → dist/vendor/{db,extraction/wasm}/；写入 `dist/vendor/package.json` `{"type":"commonjs"}`（防根 ESM 声明作用域污染 CJS 岛——Node 24 require(esm) shim 相对解析失准的实测修复）
- `files` 字段：dist、README.md（npm 包内容预置，发布在阶段 5）；dist/vendor 随包分发（约 30MB，主体为 wasm 文法）

## 忽略规则（.gitignore 与 CLI 内置忽略面）

| 路径 | 性质 | 理由 |
| --- | --- | --- |
| node_modules/ / dist/ / *.tsbuildinfo | 构建产物 | 常规 |
| .opencode/ | agent 安装产物 | 由 doclib sync 管理，不入 git |
| test/ | 临时测试区【2026-10-21】 | 基准实验工作区（umami 克隆与临时测试文件，.plan/2026-10-21/benchmark-umami.md 清单 5a）：不入 git、不入快照/漂移/孤儿扫描 |
| vendor/ vendors/ third_party/ third-party/ thirdparty/ 3rdparty/ deps/ extern/ external/ .changeset/ | 第三方与工具产物【2026-10-22】 | CLI 内置 L1 扫描面（非文档资产）：不进代码账、不判孤儿——他人写的代码与机器生成的产物不该被文档体系看见；本仓库 vendor/codegraph subtree 亦在此列（构建源，非知识） |
| .codegraph/ | 知识图谱索引【v0.30】 | vendored 引擎产物（SQLite/锁/wal）：L1 扫描面 + 工具链闭集双保险——可再生缓存，非文档资产，不入快照/漂移/孤儿三账 |
| .vscode/ .idea/ .zed/ | 编辑器本机配置【2026-10-22】 | 同属 L1 扫描面：编辑器项目配置与提示词文件不进文档视野（与 .opencode/ 的 agent 安装产物同类） |

## 豁免语义边界【2026-10-22】

| 机制 | 是否判孤儿 | 是否进代码账 | 适用 |
| --- | --- | --- | --- |
| 内置工具链闭集（`core/orphan.ts` 28 项目录 + 任意层级引导文件 + 归档指针） | 否 | **是** | agent 工具目录：占位的技术资产，仍需漂移感知 |
| `doclib ack --dir <前缀>` | 否 | **是** | 项目级新增工具目录（零代码扩展，check 提示疑似目录后立即可登记；登记时校验目录存在） |
| `doclib ack <路径> --standing` | 否 | 是 | 单文件馆外合法登记 |
| `.doclibignore` | 否 | **否** | 第三方与生成物：完全不 hash、不漂移检测 |
| 内置 L1 忽略面（见上表） | 否 | 否 | 第三方与工具产物 |
| 规划载体（`state.planning`） | 否 | 否 | 已声明的规划路径（F9 双轨边界） |

## 测试

- `npm test` = build + node --test 显式列出 dist/core/*.test.js 与 dist/commands/*.test.js（28 个文件；Node 24 目录语义问题，见 ADR-5）

变更本卷内容（新增依赖、改 tsconfig、动构建链）须实时更新此文档（实时同步原则）。
