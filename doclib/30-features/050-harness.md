---
title: F19 长程开发闭环规格
covers:
  - src/core/harness.ts
  - src/commands/hook.ts
  - src/core/check.ts
  - src/commands/check.ts
  - src/core/guides.ts
  - assets/guides/light.md
  - skills/doclib-dev/SKILL.md
  - skills/doclib-rebuild/SKILL.md
  - .opencode/commands/intest.md
status: stable
---

# F19 长程开发闭环 · 行为规格

> 导读：DocLib 从图书馆工具升维「图书馆 + 开发辅助」——为目标项目供能的长程开发线束。测试链馆内声明（事实源）→ sync 确定性反哺引导 → pre-commit 烘焙执法 → check 三新判定 → doclib-dev 情形 B 六步回路。灵感 auto-coding-agent-demo（task.json passes/测试链/阻塞协议）取长弃短：不新增 skill、不加任务状态事实源、不退回纯自律执法。

## 为什么

demo 模式（手写 CLAUDE.md + task.json）在多个项目验证了长程 agent 开发可行，但它是逐项目手作线束：任务状态、测试链、阻塞协议全靠模型服从，无机械执法；浏览器后端选型已过时（microsoft/playwright-cli v0.1.22 官方裁决 CLI 对 coding agent 优于 MCP——token 高效）。DocLib 已有全部零件（implement 拆单/plan-skeleton checkbox/doclib-accept/hook 门禁/feature-map 状态机），缺的是把零件串成强制回路的三件事：任务级 pass 状态执法、测试链接入提交门禁、长程循环与阻塞协议成文。

## 是什么

四个组件（行为归属）：

1. **test-chain 声明**（馆内契约）：目标项目 `doclib/50-testing/testing.md` frontmatter 扁平键 `test-chain-fast` / `test-chain-full`（各为命令列表或标量；单档声明回退另一档；双档缺=特性不活跃；嵌套写法 fail-fast DoclibError）。浏览器测试不入链（链=确定性 shell；浏览器=agent 语义层）。
2. **hook 烘焙执法**（CLI 行为）：`doclib hook install` 读取声明，fast 档逐命令烘焙进 pre-commit（失败即断）+ 指纹注释行（fast+full 归一化 sha256 前 12 hex）；`doclib hook --ci github` 烘焙 full 档独立 run 步骤；未声明时产物与无链形态逐字节等价。
3. **check 三新判定**（check 行为）：`skeleton-progress` 违规（strict 拦截）——implemented 功能存在未勾选实施条目（TODO(agent) 占位除外；骨架缺失或 planned/in-progress 不判）；`skeleton-open` notice——in-progress 施工中未勾选进度提示；`blocked-residue` notice——plan-skeleton frontmatter `blocked` 非空；`chain-stale` notice——doclib 管理钩子与馆内链指纹失配或单侧缺失（foreign 钩子跳过、未传脚本体不判）。治理健康分公式不变，skeleton-progress 不入五分项。
4. **doclib-dev 双情形**（skill 行为）：情形 A 常规开发（既有骨架）；情形 B 长程开发回路——六步（implement 选任务→填单开工 in-progress→开发→验证分级：fast 档全绿/交互面浏览器必做/收口 full 档+doclib-accept→收口勾选翻 implemented+一任务一 commit→循环）+ 阻塞协议四动作 + 永不删任务铁律。浏览器工具序：playwright-cli > agent-browser skill > playwright mcp。
5. **sync 确定性反哺**（guides 行为）：managed 模板「测试链」段 `%TEST_CHAIN%` 占位——有链渲染 fast/full 列表+事实源指针句，无链渲染显式 N-A 行；managedRegionFresh 把链块纳入漂移检测（链变更未 sync → guide-stale）。

## 怎么运转

install 期：`loadTestChain(root)` 读 testing.md frontmatter → `hookScript` 生成脚本（check 行后追加 `# doclib-chain:<fp>` + `bakeChainLines` fast 档）→ 链变更后重装刷新，check `chain-stale` 软提醒失配。check 期：`skeletonProgressFindings` 扫 plan-skeleton 载体 × feature-map 状态联动；`commands/check.ts` 读 pre-commit 脚本文本传入 `runCheckCore`。收口期：agent 按 doclib-dev 情形 B 验证分级执行，`blocked` 标记期间禁提交禁翻转。目标项目冷启动：sync 注入链块进 CLAUDE.md/AGENTS.md，任何 agent 零加载可见。

## 怎么验收

**AC-1**：Given testing.md 声明 test-chain When `doclib hook install` Then pre-commit 含指纹注释与 fast 档逐命令行（失败即断），输出注明烘焙条数。
**AC-2**：Given 未声明 test-chain When `doclib hook install` Then 钩子产物与无链形态逐字节等价。
**AC-3**：Given 链变更未重装 When `doclib check` Then `测试链过期` notice 含失配细节；重装后清零。
**AC-4**：Given `doclib hook --ci github` 且链声明 Then workflow 含 full 档独立 run 步骤（含序号）。
**AC-5**：skeleton-progress 五态——planned 未勾选不判 / implemented 未勾选违规 / 全勾选不判 / 骨架缺失不判 / feature 不存在不判；in-progress 未勾选仅 skeleton-open notice。
**AC-6**：Given 骨架 frontmatter `blocked` 非空 When check Then blocked-residue notice（清除标记后消失）。
**AC-7**：sync 注入三态——有链链块（fast/full/指针句）/ 无链 N-A 行 / 幂等重跑不变；链变更未 sync → guide-stale 检出；引导预算不破。
**AC-8**：Given doclib-dev skill 文本 When 审阅 Then 含双情形结构/六步回路/验证分级/阻塞协议/工具序（playwright-cli 首选）/一任务一 commit/永不删任务。
**AC-9**：Given doclib-rebuild skill 文本 When 审阅 Then 工作流与 P2 门禁两处指针指向 dev 情形 B。
**AC-10**：Given intest.md When 审阅 Then 为薄指针（≤3 行，无链细节，声明收编与工具序）。
**AC-11**：Given 临时目录全链路（init→声明→install 烘焙→链失败阻断提交→解除放行→check 三类正反例→sync 注入→拆单→勾选→翻转）When 执行 Then AC-1..8 逐条验证留痕。
**AC-12**：Given `npm run typecheck` + `npm test` When 执行 Then 全绿；`src/core/harness.test.ts` 已登记 package.json test script。

## 参考

- 目标项目声明指南与分级模板：`40-guides/harness.md`
- 判定细节：`30-features/check.md`（三新类）
- PRD：`10-architecture/prd.md` F19；ADR #26
- 长程回路全文：`skills/doclib-dev/SKILL.md` 情形 B
