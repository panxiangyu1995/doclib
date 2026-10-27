---
name: doclib-implement
description: 拆单执行器：把馆内 planned 功能细化为可实施可验收的 .plan 实施文档。当 doclib implement 生成实施骨架（frontmatter type: plan-skeleton）后、或用户要求"细化某个 planned 功能为实施计划"时使用。骨架含 AC 锚点预填与 TODO(agent) 契约位，本 skill 对话填实施工顺序/方案/备选，每条清单引用馆内 AC 锚点。
---

# doclib-implement · 拆单与实施规划填实

## 使命

把 feature-map 的 planned 条目变成可开工的工单：馆内规格与 AC 锚点是唯一依据，施工顺序/方案/备选经对话拍板后落 .plan 实施文档——实施与验收同锚，杜绝自说自话。

## 何时使用

- 已运行 `doclib implement --feature <N>`（或无参列出候选后选定）生成了实施骨架
- 用户要求把 planned 功能细化为实施计划

## 工作流

1. **读依据**：骨架 frontmatter `anchors` 指向的馆内规格（30-features 行为规格 + AC 验收标准）逐篇读完；涉及架构决策时读对应 ADR。**馆内依据不齐备时回 readiness**——`doclib implement` 对对应文档列空的条目会拒绝生成骨架，先回馆补规格再拆单
2. **对话拍板**（Coaching 式，逐项确认）：
   - 施工顺序：哪些条目先行（脚手架/数据层先行）、哪些可并行、依赖关系
   - 技术方案：每条清单项怎么做；方案间有取舍时列备选与被否理由
   - 边界与风险：可能踩的坑、需要预研的点
3. **填实骨架**：
   - 方案设计节：拍板结论写成正式段落（决策 + 理由）
   - 实施清单节：每条 `- [ ] <动作> → <规格路径#AC-x>`——**每条必须引用馆内 AC 锚点**（check「验收锚点缺失」执法；引用的 AC 必须真实存在；无对应 AC 的动作先回规格补 AC 再上清单）
   - **保留 frontmatter 不动**（type/feature/generated/anchors 是执法面，删改即执法失效）
4. **登记**（F9 锚点一）：feature-map 该条目按需推进（开工置 in-progress 时「对应文档」列写本 .plan 路径——check「实施锚点缺失」执法）+ progress.md 补记
5. **转开发循环**：填实完成后按 doclib-dev 工作流施工，逐条 AC 自检；归档时长期价值（ADR/规格/参考）沉淀入馆，过程材料留 .plan

## 纪律

- 馆是唯一依据：规格缺失/歧义先回馆补写，不在 .plan 里另立事实源
- 每条清单必带 AC 锚点；施工自检与 accept 验收共用同一锚点（验收标准写一次全生命周期消费）
- 方案与备选写进 .plan（过程材料留载体）；不复制馆内规格正文（引用锚点即可）
- 干跑语义：CLI 生成默认干跑、`--apply` 才落盘——本 skill 不绕过
- 写前记 revision，写后 check 比对；无账不答，记忆与图书馆冲突以馆为准
