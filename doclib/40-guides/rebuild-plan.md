---
title: 复原路线图
covers:
  - src/
  - doclib/
status: draft
---

# 复原路线图

> 从零重建 DocLib 自身的施工顺序（F14 基准实验视角：本仓库既是 DocLib 也是首个自举基准）。按依赖关系分阶段；每阶段指明依据文档与完成标准。**本馆复原实验未启动——阶段内容为骨架，实验排程时实例化。** 复原者严格按此推进，每阶段完成即自检并记录。

## 为什么

复原顺序由依赖方向决定：CLI 地基先于命令、核心逻辑先于命令编排、模板资产先于 init 行为——逆序施工会在没有验收基准的情况下写空壳。

## 是什么

五个阶段：环境与脚手架 → 核心逻辑层（core/）→ 命令编排层（commands/）→ 馆与门面（doclib/ + README）→ 验收闭环。总验收 = 逐条执行 30-features/ 验收标准 + feature-map 全绿。

## 怎么运转

执行纪律：严格按阶段推进，每阶段完成即对照依据文档自检并记录 REBUILD-LOG；信息隔离铁律见 doclib-rebuild skill。

## 阶段 0 · 环境与脚手架

- 依据：10-architecture/overview.md, dependencies.md, 60-config/settings.md（如缺：package.json 构建链）
- 内容：TODO（工具链、目录骨架、tsconfig 双工程）
- 完成标准：TODO

## 阶段 1 · 数据层

- 依据：10-architecture/data-model.md, 20-modules/ 各卷
- 内容：TODO（state 快照链/frontmatter 解析/mapping 映射）
- 完成标准：TODO

## 阶段 2 · 核心域

- 依据：20-modules/ 各卷
- 内容：TODO（check 对账/orphan 四态/place 处置/codegraph 岛）
- 完成标准：TODO

## 阶段 3 · 接口/交互层

- 依据：30-features/ 各规格
- 内容：TODO（十三命令逐一落位）
- 完成标准：TODO

## 阶段 4 · 馆与门面 + 打磨

- 依据：doclib/ 全馆、README.md、CONTRIBUTING.md
- 内容：TODO（图书馆本体重建 + 门面叙事）
- 完成标准：TODO

## 总验收

- 逐条执行 30-features/ 的验收标准；feature-map 全部功能有实现且验收通过
- 门禁全绿以馆内 `50-testing/testing.md` frontmatter `test-chain` 声明为准；每阶段收口与阻塞纪律遵循 doclib-dev skill 情形 B（F19 长程开发闭环，复原即长程开发复现）
