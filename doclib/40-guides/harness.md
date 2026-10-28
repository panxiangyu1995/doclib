---
title: 长程开发指南
covers:
  - src/core/harness.ts
  - src/commands/hook.ts
  - skills/doclib-dev/SKILL.md
  - .opencode/commands/intest.md
status: stable
---

# 长程开发指南（harness）

> 目标项目如何启用长程开发闭环：声明测试链、装提交门禁、按六步回路推进。写给在 DocLib 项目里做长程 agent 开发的人。

## 为什么

长程 agent 开发（连续多任务、多小时循环）的失败模式高度一致：任务状态漂移（做完没记录/没做完当做了）、质量门禁缺位（没测试就提交）、阻塞后假装完成。手写 CLAUDE.md 线束能缓解但无法执法。DocLib 把线束变成图书馆的一部分：任务状态就是 feature-map 状态机，测试链就是 testing.md frontmatter，执法就是 pre-commit 钩子——「馆为准」从文档延伸到开发回路本身。

## 是什么

三个声明面：

1. **测试链**：`doclib/50-testing/testing.md` frontmatter 两个扁平键——`test-chain-fast`（提交门禁档，秒级~分钟级，如 typecheck）、`test-chain-full`（CI 与收尾档，全量测试/构建）。每档一条或多条 shell 命令；只声明一档时另一档回退同值。
2. **提交门禁**：`doclib hook install` 把 fast 档烘焙进 pre-commit（`doclib hook install --strict` 连文档治理一起拦）；链变更后重跑安装刷新。
3. **长程回路**：doclib-dev skill 情形 B——选任务（`doclib implement` 列 planned）→ 填单开工 → 开发 → 验证 → 收口（勾选+翻 implemented+一任务一 commit）→ 循环。

**分级模板**（按项目类型取用，写入 test-chain）：

- Web 全栈：fast=`构建+类型检查`；full=`全量测试+构建`；浏览器 E2E 属交互面验证（agent 用 playwright-cli 执行，不进链）
- 纯 CLI/库：fast=`typecheck`；full=`全量测试`；命令行为改动加临时目录冒烟
- 无可执行测试的文档期项目：不声明（特性不活跃，一切优雅降级）

## 怎么运转

**声明与启用**：编辑 testing.md frontmatter 写入 test-chain 两键 → `doclib sync`（链块注入 CLAUDE.md/AGENTS.md，agent 冷启动可见）→ `doclib hook install`（fast 档烘焙，提交即执法）→ 可选 `doclib hook --ci github`（full 档进 CI）。

**验证分级**（情形 B 第 4 步）：一切改动过 fast 档；交互面改动（UI/页面/CLI 交互输出）浏览器或冒烟测试必做——工具序 **playwright-cli**（`npm i -g @playwright/cli`，token 高效，`playwright-cli install --skills` 装技能或读 `--help` 自助）> agent-browser skill > playwright mcp；收口前 full 档全绿 + doclib-accept 逐条 AC 验收。

**阻塞处理**：环境缺失/外部依赖不可用/测试无法进行 → 禁止 commit、禁止翻 implemented；骨架 frontmatter 写 `blocked: <原因与所需人工动作>`；输出结构化阻塞信息（当前任务/已完成/原因/所需人工/解除后动作）；停止等待。

**执法点速查**：伪造完成（implemented+未勾选）→ check strict 拦截；阻塞未清 → blocked-residue 提醒；链漂移（改链未重装）→ chain-stale 提醒；引导滞后（改链未 sync）→ guide-stale 拦截。

## 怎么验收

- 声明链后 `doclib hook install`：输出注明烘焙条数；`git commit` 在链命令失败时被阻断、全部通过时放行
- `doclib check`：违规 0（伪造完成会现「清单状态失真」）；提示行见「测试链过期/阻塞标记/施工中未勾选」计数
- `doclib sync` 后引导文件出现「测试链（长程开发执法）」段：有链见 fast/full 列表，无链见显式 N-A 行
- 长程回路跑通一轮：planned → in-progress → implemented，一任务一 commit，progress.md 有补记

## 参考

- 行为规格与 AC：`30-features/050-harness.md`
- 长程回路全文：`skills/doclib-dev/SKILL.md` 情形 B
- 测试链声明事实源：`50-testing/testing.md` frontmatter
- ADR #26（架构裁决：状态承载/烘焙执法/确定性反哺）

> v0.10.0（#44）增量：情形 A/B 共享骨架「会话开始」增分支核对步（分馆期 progress 条目带 `[branch:分支名]` 标注）——六步回路本身不变，见 `30-features/branch.md`。
