---
title: 依赖选型决策记录
covers:
  - package.json
status: stable
---

# 依赖选型决策记录

| 依赖 | 用途 | 选型理由 | 被否替代品 | 升级/替换策略 | 若不可用的影响 |
| --- | --- | --- | --- | --- | --- |
| ignore ^5.3.2 | gitignore 语义匹配（collectFiles） | 手写 glob/gitignore 子集易错且难测；ignore 是 eslint 等同款 | 自写匹配器（已在 v0.1 评估并否决） | 锁 ^5；替换需重跑全部 fsutil 测试 | 文件遍历降级为朴素匹配，ignore 语义失真 |

## 构建期（非运行时依赖）

| 项 | 说明 |
| --- | --- |
| typescript ^5.6 | devDep，tsc 编译 |
| @types/node ^22 | devDep |
| scripts/copy-assets.js | node:fs 递归拷贝（零依赖脚本），把 assets/ 与 skills/ 拷入 dist/assets/ |
