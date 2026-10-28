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

> init 是 DocLib 的入口：一条命令把「图书馆 + 引导 + skills + 簿记」在任意 repo 落位到位，治理起点即干净。

## 为什么

在任意 repo 中一键建立 DocLib 环境：12 卷图书馆骨架、簿记目录、skills 按 agent 适配落位、轻量引导文件落位、状态登记。

## 是什么

`doclib init` 一条命令完成：12 卷图书馆骨架落位、skills 按 agent 适配分发、引导文件写入（区域契约）、簿记初始化、规划载体声明（--planning）、可选知识图谱初始化（--graph）、**提交门禁自动安装**（v0.5.1，git 仓库默认装 `--strict` 档 pre-commit 钩子，根除"忘记安装"风险）。

## 输入

| 选项 | 语义 | 缺省 |
| --- | --- | --- |
| --force | 允许向已存在的 doclib/ 写入（同名模板覆盖，多余文件不动） | 目录已存在且无 force 则报错 |
| --agents | 逗号分隔：claude,opencode,cursor,generic；未知 id 报 DoclibError；去重 | TTY 问卷；非 TTY → generic |
| --guide | light \| none；非法值报 DoclibError | TTY 问卷；非 TTY → light |
| --planning | 逗号分隔多路径（默认 .plan/），尾斜杠归一 | TTY 问卷（askPlanning：回车=.plan/）；非 TTY → .plan/ |
| --graph | init 时同步初始化知识图谱 .codegraph/（v0.30，需 Node ∈ [22.5, 25)） | TTY 第 4 问（askGraph：回车=否）；引擎不可用/建图失败→告警行，**init 仍退出 0**；未启用输出 `doclib graph index` 提示行 |
| --no-hook | 跳过提交门禁自动安装（v0.5.1） | 默认自动安装：git 仓库装 `--strict` 档；既有非 doclib 钩子 → 警告跳过（init 不失败）；非 git → 提示后置安装 |

## 怎么运转

1. 模板：拷贝 assets/templates/library 全部模板文件到 doclib/（v3 骨架 33 文件；保留目录结构）；**拷贝后向 progress.md 幂等补写 `<!-- doclib:lesson-epoch: 当日 -->` 标记**（v0.6.2，教训账缺口不变量的 epoch 锚——新馆默认在岗；已含标记不重复写）；**v0.6.4 起同样向 lessons.md 幂等落位 `<!-- doclib:lesson-source-epoch: 当日 -->`**（模板携空日期标记，init 替换为当日——教训来源缺失不变量的 epoch 锚）
2. 簿记：建 .doclib/workorders/
3. skills：对 skillsDir 非空的目标（claude→.claude/skills、opencode→.opencode/skills）copyDir 覆盖式同步
4. 引导（--guide light 时）：writeGuides——**有戳更新、无戳跳过（用户内容保护）、缺失写入**；v0.8.0 起模板含四区（managed/project/memory/custom），memory 区占位随模板落位（AC-12，规格见 [guides.md](guides.md)）
5. 状态：loadState（兼容归一化）→ agents=目标 id 列表、structureVersion=STRUCTURE_VERSION（当前 3）→ saveState（既有快照链保留）
6. 门禁（--no-hook 未指定时）：resolveHooksDir 判 git → 非 git 提示行；readHookState=foreign → 警告跳过（用户钩子不动）；否则 runHook --strict 安装（幂等覆盖 doclib 自身钩子，无条件恢复可执行位）——复用 hook 命令全部健壮化能力（相对路径/fail-closed/worktree）；**门禁环节任何失败（含底层 fs 错误）降级为「跳过（原因）」行，init 不失败**（与 graph 初始化同构的全接语义）
7. 输出：模板数、agents、skills 落位、引导写入/跳过清单、门禁状态行、**载体建议行**（v0.6.1：检测 `.specify/`、`openspec/`、`specs/`、`.kiro/specs/` 存在且未声明且含 ≥1 .md → 提示 `--planning` 声明后进入双轨提醒；声明权在用户，纯软提示——兑现 PRD F1「常见规划载体检测后建议声明」）、下一步指引

> v0.4.0 后续（2026-10-20）：version.ts 增导出 `PACKAGE_NAME`（读 package.json name，回退 @panxiangyu1995/doclib）——CI 模板包名单一事实源（hook 消费）；init 仍只消费 STRUCTURE_VERSION 与引导渲染的 CLI_VERSION。

## 边界与错误

- doclib/ 已存在且无 --force → DoclibError
- 未知 agent / 非法 --guide → DoclibError
- 非 TTY 环境（管道/CI）自动降级，不挂起

## 已知预留（未落地）

- 图书馆模板"永不覆盖已存在文件"修正案（见 95-lessons 2026-10-17 条目；本版 --force 仍覆盖同名模板）

## 验收标准

- Given 空目录 When `init --agents claude,opencode` Then doclib/ 含 33 模板、.claude/skills 与 .opencode/skills 各含 10 skill 目录、CLAUDE.md/AGENTS.md 首行为 `<!-- doclib-guide cli=… structure=3 -->`、state.agents=[claude,opencode]
- Given 已有手写 CLAUDE.md（无戳）When `init --force` Then CLAUDE.md 内容原样保留且输出"跳过"
- Given 非 TTY When `init`（无参数）Then agents=generic、guide=light 自动落位
- Given --agents foo When init Then 报错并列出可选 id
- Given git 仓库 When init Then pre-commit 钩子自动落位（--strict 档）且输出「提交门禁: 已安装(--strict)」
- Given `init --no-hook` When init Then 不装钩子，输出「提交门禁: 未安装（--no-hook 跳过）」
- Given 既有非 doclib 钩子 When init Then init 成功、警告跳过、原钩子逐字节保留
- Given 非 git 目录 When init Then init 成功并提示 git init 后可手动 `doclib hook --strict`
- Given 仓库存在含 .md 的 openspec/ 且未声明 When init Then 输出「载体建议」行；Given 已声明该载体或目录为空 Then 不输出（零噪音）
