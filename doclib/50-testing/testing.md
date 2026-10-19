---
title: 测试策略
covers:
  - package.json
  - src/core/
status: stable
---

# 测试策略

- 框架：node:test（零依赖）；运行 `npm test`（构建 + 显式列出 dist 下 *.test.js）
- 分层：core/ 纯逻辑逐模块单测（frontmatter/mapping/fsutil/state）；命令层暂以临时目录冒烟覆盖（init→plan→snapshot→diff→plan→verify→rebuild 闭环）
- 关键用例锚点：PRD F2 三层保活、F11 对账——实现时逐条补为可执行验收标准（30-features）
- 约定：测试文件与被测模块同目录 `*.test.ts`；新增命令须同步新增冒烟路径到 AGENTS.md 验证节
