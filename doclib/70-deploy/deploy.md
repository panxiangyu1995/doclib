---
title: 部署
covers:
  - package.json
status: stable
---

# 部署

- 当前：源码形态，`npm run build` 本地构建；`node dist/cli.js` 运行
- npm 包配置**已就绪**（阶段 1）：bin=dist/cli.js、files=[dist, README.md, AGENTS.md]、assets 经 copy-assets 进入 dist/assets
- 待办（feature-map #7，阶段 5）：`npm publish` 发布、`npx doclib init` 真机验证、npm pack 预演冒烟、版本策略（structureVersion 与 CLI 版本双轨）
