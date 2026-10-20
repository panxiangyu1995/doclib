---
title: init v2 行为规格
covers:
  - src/commands/init.ts
  - src/core/agents.ts
  - src/core/prompts.ts
  - src/core/guides.ts
  - src/core/assets.ts
  - src/core/version.ts
status: stable
---

# init v2 · 骨架落位 + agents/skills/引导安装

## 目的

在任意 repo 中一键建立 DocLib 环境：12 卷图书馆骨架、簿记目录、skills 按 agent 适配落位、轻量引导文件落位、状态登记。

## 输入

| 选项 | 语义 | 缺省 |
| --- | --- | --- |
| --force | 允许向已存在的 doclib/ 写入（同名模板覆盖，多余文件不动） | 目录已存在且无 force 则报错 |
| --agents | 逗号分隔：claude,opencode,cursor,generic；未知 id 报 DoclibError；去重 | TTY 问卷；非 TTY → generic |
| --guide | light \| none；非法值报 DoclibError | TTY 问卷；非 TTY → light |
| --planning | 逗号分隔多路径（默认 .plan/），尾斜杠归一 | TTY 问卷（askPlanning：回车=.plan/）；非 TTY → .plan/ |

## 行为

1. 模板：拷贝 assets/templates/library 全部 22 文件到 doclib/（保留目录结构）
2. 簿记：建 .doclib/tasks/
3. skills：对 skillsDir 非空的目标（claude→.claude/skills、opencode→.opencode/skills）copyDir 覆盖式同步
4. 引导（--guide light 时）：writeGuides——**有戳更新、无戳跳过（用户内容保护）、缺失写入**
5. 状态：loadState（兼容归一化）→ agents=目标 id 列表、structureVersion=2 → saveState（既有快照链保留）
6. 输出：模板数、agents、skills 落位、引导写入/跳过清单、下一步指引

## 边界与错误

- doclib/ 已存在且无 --force → DoclibError
- 未知 agent / 非法 --guide → DoclibError
- 非 TTY 环境（管道/CI）自动降级，不挂起

## 已知预留（未落地）

- 图书馆模板"永不覆盖已存在文件"修正案（见 95-lessons 2026-10-17 条目；本版 --force 仍覆盖同名模板）

## 验收标准

- Given 空目录 When `init --agents claude,opencode` Then doclib/ 含 22 模板、.claude/skills 与 .opencode/skills 各含 3 skill、CLAUDE.md/AGENTS.md 首行为 `<!-- doclib-guide cli=… structure=2 -->`、state.agents=[claude,opencode]
- Given 已有手写 CLAUDE.md（无戳）When `init --force` Then CLAUDE.md 内容原样保留且输出"跳过"
- Given 非 TTY When `init`（无参数）Then agents=generic、guide=light 自动落位
- Given --agents foo When init Then 报错并列出可选 id
