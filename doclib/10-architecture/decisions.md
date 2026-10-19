---
title: 设计决策记录 (ADR)
covers:
  - src/core/assets.ts
  - src/core/guides.ts
  - src/core/state.ts
status: stable
---

# 设计决策记录 (ADR)

| # | 决策 | 背景 | 被否备选 | 后果 |
| --- | --- | --- | --- | --- |
| 1 | 图书馆模板 assets 化（真实 .md + copy-assets 拷贝） | TS 模板字符串的代码围栏转义噪音大、skills 无法引用模板 | 继续 TS 模板字符串（v0.1 方式） | 构建链多一步；模板成为一等资产 |
| 2 | 引导文件戳覆盖策略（有戳更新/无戳跳过/缺失写入） | 本仓库 CLAUDE.md/AGENTS.md 为手工定制内容，无保护会被 init 摧毁 | 一律覆盖 / 一律跳过 | 版本戳成为"doclib 管理权"标记；agent 合并交由任务书 |
| 3 | state v2 兼容归一化（structureVersion 缺省 1、agents 缺省 []） | 本仓库 snap-001 为旧格式真实数据 | 破坏式重置 state | 老仓库无感升级 |
| 4 | 跳过本仓库图书馆迁移（阶段 1 清单 27-31） | init --force 同名覆盖会摧毁 9 个手写文件 | 备份后强制迁移 / 采纳"模板永不覆盖"修正 | 本仓库图书馆保持手工结构；修正案待落地（见 95-lessons 对应条目） |
| 5 | 测试显式列出文件而非目录 | Node 24 `node --test <目录>` 会把目录当模块解析失败 | 目录 glob | test 清单需手动追加新测试文件 |
