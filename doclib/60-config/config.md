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
| 运行时依赖 | 仅 `ignore` | 依赖最小化 |
| node 版本 | >=18 | test runner / fs promises |
| 构建清理 | build 前置 node -e rmSync dist | 跨平台零依赖；防 tsc 孤儿产物残留入发布包 |
| 注释 | 源码不写注释 | 知识一律入图书馆，代码内注释会腐烂 |
| 错误 | 一律抛 DoclibError，cli 统一捕获 | 统一错误面 |
| 版本 | 0.4.0（structure v2） | v0.4.0：CLI 地基（BOOTSTRAP/RESUME 任务书/载体声明与提醒/reconcile）+ skills 10/10；版本与结构版本分离追踪 |

## 构建

- `npm run build` = `tsc -p tsconfig.json && node scripts/copy-assets.js`（assets/ 与 skills/ → dist/assets/）
- `files` 字段：dist、README.md、AGENTS.md（npm 包内容预置，发布在阶段 5）

## 测试

- `npm test` = build + node --test 显式列出 dist/core/*.test.js（7 个文件；Node 24 目录语义问题，见 ADR-5）

变更本卷内容（新增依赖、改 tsconfig、动构建链）须实时更新此文档（实时同步原则）。
