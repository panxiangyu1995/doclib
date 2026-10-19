---
name: doclib-resume
description: 半成品项目接手：既有代码蒸馏为 implemented + 未来规划整理为 planned，此后按图书馆继续开发（DocLib 文档驱动开发三模式之一）。当用户接手一个开发到一半的项目、希望用 DocLib 接管开发与验收时使用。触发：plan --resume 生成 RESUME 任务书后。
---

# doclib-resume · 半成品接手

## 使命

为开发到一半的项目建立图书馆：已有代码蒸馏为 implemented 条目，未来规划整理为 planned 条目——此后项目的全部开发与验收以图书馆为准。

## 何时使用

- 已运行 `doclib init` 且 `doclib plan --resume` 生成了 RESUME 任务书
- 项目已有部分实现（半成品），图书馆缺失或不可用

## 工作流

1. **三遍扫描既有代码**（同 doclib-build 方法论）：骨架（清单/入口/结构）→ 数据（模型/契约/配置）→ 行为（功能/边界/错误）
2. **蒸馏 implemented**：feature-map 逐条登记已实现功能（covers 指向真实代码路径）；30-features 为已实现功能补规格与验收标准（可执行）；模块/架构/配置等知识卷按 doclib-build 方法论补全
3. **规划整理**：
   - 用户提供为主：对话确认未来功能与优先级
   - agent 分析后可给建议供用户筛选（不要替用户决定）
   - 确认后的规划 → feature-map 登记 planned
4. **转日常开发**：馆就绪后加载 doclib-dev，按日常循环开发迭代
5. **收尾**：`doclib verify` → `doclib snapshot --note "resume: baseline established"` → `doclib status`

## 纪律

- 蒸馏时"行为规格 > 结构描述 > 架构总览"优先级取证；不确定处与用户确认
- 反克隆铁律同 build：文档承载行为/契约/意图/验收标准
- 写前记录 revision；写后 check 比对；无账不答；记忆与馆冲突以馆为准
