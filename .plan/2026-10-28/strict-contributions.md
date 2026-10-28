# 严格贡献流程（strict-contributions）

- 日期：2026-10-28
- 状态：执行中（feature-map #45；ADR #29）
- 来源：用户原话「项目的参与贡献有些随意，因为现在 ai 时代，pr 提交的代码质量可能会有很大的问题，所以我们的参与贡献的方式设置严格一些，具体的你 context7 mcp 或者 gh cli 找找最佳实践做做参考」；执行期两次全局审视——「这个方案会不会过于严格了啊？」→ γ-lite 修正拍板；「编号推进的太快了，我怕后期没有编号用，在图书馆中制定一个编号推进的规则供 agent 考量，而不是随便推进，同时蒸馏进 claude.md 和 agents.md 中」→ 新增范围 Q10
- 规划载体：本对话（RIPER-5 RESEARCH → INNOVATE → PLAN → EXECUTE）
- 会话导出登记：`doclib/98-sessions/strict-contributions-20261028-01.md`（opencode 原生 /export，session-id ses_e7fda242dffeWRmzRWKWi4zM0r；敏感信息自查：会话内无密钥/token/凭据明文——gh CLI 调用均走本机凭据，未在对话中出现）

## 拍板记录

| 问题 | 拍板 |
| --- | --- |
| Q1 强度档位 | γ-lite（拆除唯一新增机器硬拦截：PR 标题从 CI 校验降为模板引导；issue 表单减负；AI 政策九条款全保留） |
| Q2 AI 政策载体 | CONTRIBUTING 内嵌 §2（否独立 AI_POLICY.md：新根级文件触发馆内无归属违规、馆内联动成本翻倍） |
| Q3 AI 披露位置 | PR 模板勾选段 + 禁止给 AI 工具加 Co-Authored-By trailer（compose 立场） |
| Q4 issue-first | 分层：代码 PR 必须关联 issue；纯文档纠错/翻译豁免直提（Ghostty 翻译豁免先例） |
| Q5 PR 标题 | conventional 闭集模板引导（γ-lite：CI 不机器拦截） |
| Q6 main 防护 | Ruleset main-protection：必过 verify + bypass 仓库管理员（维护者保留直推工作流）+ 禁 force-push/删除 |
| Q7 good-first-issue | 条款先行，标签后建 |
| Q8 CODEOWNERS | 单行 `* @panxiangyu1995` |
| Q9 CONTRIBUTING 双语 | 后置（本次不做） |
| Q10 编号推进规则（执行期新增） | 馆内 `40-guides/numbering.md` + 两级索引登记 + 蒸馏进 guide-project 开发宪法段 → sync 双引导 |

## 研究结论（实证，gh CLI + webfetch 一手原文）

1. 业界谱系：Ghostty（vouch 系统 + denouncement + AI 政策先驱）→ LLVM（human-in-the-loop 全责 + extractive 黄金法则 + @claude 类自主 agent 禁令 + good-first-issue 保护 + 标准拒绝回复模板）→ compose（Moby/Docker 共享政策：披露/禁 AI trailer/修 bug 非修文件/合并非终点）与 starship（模板勾选段 + 自主 agent 禁令）跟进；`AI_POLICY.md` 模式全网 10+ 项目（gh search code 实证：docker/compose、starship、polars、zeek、lichess、delve 等）。
2. 五公约数条款 5/5 一致：强制披露 / human-in-the-loop 全责 / 低质无警告关闭权 / 小 diff 纪律 / good-first-issue 保护；唯一显著分歧在披露位置（PR 描述/模板为主流，LLVM 用 commit trailer）。
3. 本仓缺口 8 项实证：直接提 PR 无门槛 / 无 AI 政策 / 无 PR 模板 / 无 Issue 模板 / 无 PR CI（release.yml 仅 tag 触发）/ 无 CODEOWNERS / 无 commit 约定 / 自查清单自我声明制。
4. 本仓贡献体量基准（γ-lite 校准依据）：0 issues / 0 PRs / 0 stars / npm 月下载 25 / 仓库公开 9 天。

## 方案定稿

γ-lite 五层：L1 政策文本（CONTRIBUTING v2 十节，§2 AI 政策九条款）→ L2 模板（.github/ PR 模板六段 + Issue 表单 ×3 减负）→ L3 机器门禁（ci.yml verify 单 job：npm ci → typecheck → test → doclib check --strict，馆-码对账进 CI 的 dogfooding 展示位）→ L4 流程纪律（issue-first 文字规则 + 标题 conventional 模板引导）→ L5 仓库防护（Ruleset + CODEOWNERS）。另：README 双语参与贡献节 + 数字表实测修正；编号推进规则入馆（Q10）。

并发处置（方案 A）：feature #44/ADR #28 撞号实证 → 先代提交并发 #44 v0.10.0 成果（commit 9f7dcc9，测试 394/394 绿），再顺延取号 #45/ADR #29（先查账末后取号）。

## 反遗漏自检五项（收尾对照）

1. 改动归档：CONTRIBUTING v2 + .github 四资产 + README 双语 + 馆内联动（ADR #29/config.md CI 节/overview 门面描述/INDEX 计数/numbering.md 新建）+ 编号规则蒸馏
2. feature-map：#45 planned → implemented
3. progress.md：规划行 + 归档条目（条目末 `教训:` 处置位；撞号事故实时入 95-lessons）
4. 引导更新：guide-project 开发宪法段增编号规则指针 → `doclib sync`；guide-memory 收尾刷新（41/40 超限瘦身）
5. 踩坑处置：执行中缺陷实时入 95-lessons 或载体偏差节

## 任务进度

[2026-10-28 规划落盘 + 并发处置] 载体创建；#44 代提交（9f7dcc9）；取号 #45/ADR #29（先查账末：feature-map 44 / decisions 28）。状态：执行中。

[2026-10-28 执行完成]
- 已修改：CONTRIBUTING.md v2 十节 + .github 六资产（PR 模板/ISSUE_TEMPLATE×3/ci.yml/CODEOWNERS）+ README.md/README.en.md 参与贡献节 + doclib（decisions ADR #29/config CI 节+covers/overview 门面描述/INDEX 计数+numbering 登记/numbering.md 新建/feature-map #45/progress×2/branch.md AC-13/cli-acceptance-suite 增量/95-lessons ×2）+ 簿记 guide-project（编号纪律行+docs-hash×5 刷新）+ guide-memory 重蒸馏瘦身（45→约 35 行）+ 测试修复 ×2（branch.test 夹具 -b main/status.test utimes 后移）
- 更改：25 步清单全部完成（γ-lite：title 机器校验按拍板拆除）；CI 三跑收敛绿（首跑 394/395→branch 夹具修复；二跑 394/395→status.test 竞态修复——两例均为「本地绿≠CI 绿」环境依赖族，同族排查 planning/plan 两用例已确定性安全）；Ruleset main-protection 落位（id 26020271，bypass 管理员）
- 原因：用户指令「按你推荐的来」+ 新增范围 Q10（编号推进规则立法）
- 阻碍因素：并发两次（#44 撞号→代提交 9f7dcc9；#46 在飞→写协调等待收敛 20+ 分钟）——均已按编号纪律处置
- 状态：成功（待用户确认）
