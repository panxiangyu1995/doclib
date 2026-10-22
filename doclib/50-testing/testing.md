---
title: 测试策略
covers:
  - package.json
  - src/core/
status: stable
---

# 测试策略

- 框架：node:test（零依赖）；运行 `npm test`（构建 + 显式列出 dist 下 *.test.js，**31 个测试文件 / 240 用例**【v0.30】）
- 分层：core/ 纯逻辑逐模块单测（frontmatter/mapping/fsutil/state/orphan/place/codegraph engine+draft）；命令层以临时目录冒烟覆盖（init→plan→snapshot→diff→plan→verify→rebuild 闭环）+ 自动化测试文件（commands/ 14 套件含 graph）
- graph 测试【v0.30】：engine 门禁边界（isNodeCompatible）+ draft 渲染器 fixture 断言（警示头/provenance/TODO）+ graph 命令 testkit 实建图（index/status/draft/explore/错误路径）+ e2e init --graph 全流程；**Node < 22.5 环境自动 skip 守卫**（engineReady 探测），保证低版本 CI 不假红
- 关键用例锚点：PRD F2 三层保活、F11 对账、F13 四态判定与处置闭环、F15 阶段 2 图谱三用途——实现时逐条补为可执行验收标准（30-features）
- 约定：测试文件与被测模块同目录 `*.test.ts`；新增命令须同步新增冒烟路径到 AGENTS.md 验证节；**不可逆动作类功能必须三段验收**（干跑零副作用 → `--apply` 后状态正确 → 还原路径可用）
