# F19 长程开发闭环（long-horizon-harness）

- 日期：2026-10-27
- 状态：已归档（#43 implemented，commit 104ee88 + 0bef399，基线 snap-090/revision 81，测试 372/372）
- 来源：用户灵感 panxiangyu1995/auto-coding-agent-demo（10 小时全自动编程实验，本人多项目实证过）+ 原话「我的目的不是为了本仓库的开发，而是引入将其作为我们仓库作为一个图书馆工具兼具开发辅助可以帮组开发者们做长程任务规划和开发，playwright mcp不必非是mcp 现在微软也发布了playwright cli（gh cli你自己获取信息）来用作为备选」+「rebuild skill，本质上就是agent的长程开发复现，但是没有明确完善长程开发链路，所以我认为可以少新增一个skill……开发实现的skill可以只做成一个dev skill,只不过skill分为常规开发和长程开发2中情形」+「测试标准，我认为不进再图书馆中落地，也该一样反哺到claude.md和agents.md中」
- 规划载体：本对话（RIPER-5 RESEARCH → INNOVATE → PLAN → EXECUTE；planstore 纪律落盘）
- 关联产物：`src/core/harness.ts` · `src/commands/hook.ts` · `src/core/check.ts` · `src/commands/check.ts` · `src/core/guides.ts` · `assets/guides/light.md` · `skills/doclib-dev/SKILL.md` · `skills/doclib-rebuild/SKILL.md` · `.opencode/commands/intest.md` · `doclib/{30-features,40-guides,10-architecture,00-overview,50-testing}` · `package.json`

## 会话导出登记

- 导出文件名：long-horizon-harness-20261027-01.md（提醒用户 /export 后落位 doclib/98-sessions/ 并补 frontmatter 五要素）
- 敏感信息自查：本会话无密钥/token/凭据（gh api 均匿名公共查询；npm view 公共）；并发实例文件未触碰

## 跨会话前情

| 前情 | 文件指针 | 依赖点 |
| --- | --- | --- |
| 规划直通车（F17 拆单器/骨架契约/门禁三件套） | `.plan/2026-10-27/planning-express.md` + ADR #24 | plan-skeleton checkbox 即任务级状态承载面；acceptanceAnchorFindings 扫描模式复用 |
| 引导反哺三区契约（#32） | `.plan/2026-10-26/guide-feed.md` + ADR #18 | sync 注入管线/预算体系/managedRegionFresh；TEST_CHAIN 注入同构 |
| 记忆快照第四区（#40） | `.plan/2026-10-27/guide-memory-snapshot.md` + ADR #25 | renderFullGuide 渲染链与预算报告扩展点 |
| pre-commit 门禁与 hook 命令 | `doclib/30-features/hook.md` + `src/commands/hook.ts` | hookScript 生成/指纹注释/CI 模板烘焙基础 |
| web 测试链纪律 | `.opencode/commands/intest.md` | 分级模板吸收来源（收编+薄指针） |
| 阻塞协议原型 | panxiangyu1995/auto-coding-agent-demo CLAUDE.md + `skills/doclib-rebuild/SKILL.md` 歧义处理节 | blocked 四动作成文依据 |

## 一、目的与效果

1. DocLib 从图书馆工具升维为「图书馆 + 开发辅助」：为任意目标项目供能的长程开发线束（harness factory），取代逐项目手写 CLAUDE.md+task.json 的 demo 模式。
2. 目标项目获得机械化的长程回路：选任务（feature-map planned ≙ passes:false）→ 拆单填实 → 开发 → 声明测试链执行 → AC 验收 → 翻状态 → 一任务一 commit → 下一任务；阻塞协议与永不删任务铁律随行。
3. 测试链三层贯通：馆内声明（事实源）→ sync 确定性反哺进 CLAUDE.md/AGENTS.md（agent 冷启动可见）→ pre-commit 烘焙执法（确定性拦截）。
4. 不新增 skill、不新增任务状态类命令、不加新事实源——全部复用既有机制扩展。

## 二、问题点（研究实证）

1. demo 仓库 task.json 的任务级 `passes` 状态在 DocLib 无对应承载：feature-map 是功能级四态，plan-skeleton checkbox 是任务级但无任何机械联动执法（勾没勾、状态翻没翻互不校验）。
2. pre-commit 门禁只跑 `doclib check --strict`（文档治理），测试链（lint/build/test/浏览器）与提交完全脱钩——demo 核心价值「测试全过才提交」无对应物。
3. 测试链知识散落：intest.md（web 链，仓库本地未分发）+ testing.md 铁律（CLI 链），无每项目可声明的机器可读形态。
4. 长程循环零件齐全（implement 拆单/doclib-accept/hook/状态翻转）但未串成一条成文回路；阻塞协议（demo 的结构化阻塞输出+禁提交禁翻转）无对应条款。
5. 浏览器测试后端事实已变：microsoft/playwright-cli（v0.1.22，gh 实证）官方定位 coding agent 优先（token 高效），工具序需更新。

## 三、研究结果（代码与外部）

| 事实 | 位置 | 与本功能的接口 |
| --- | --- | --- |
| 骨架契约/anchors 双形态解析/AC 锚点执法 | `src/core/implement.ts:54-160` | checkbox 联动判定复用 carrierDocs+parseFrontmatter 同模式 |
| hookScript 生成/readHookState/CI 模板 | `src/commands/hook.ts:43-115` | 烘焙第三参与 ciWorkflow 函数化 |
| check findings/notices 双轨 | `src/core/check.ts` + `src/commands/check.ts` | skeleton-progress 走 findings（strict）、chain-stale/blocked-residue 走 notices |
| featureRows 解析 | `src/core/featuremap.ts` | skeleton-progress 按 feature N 查状态 |
| managed 区渲染/预算体系 | `src/core/guides.ts` + `assets/guides/light.md` | {{TEST_CHAIN}} 变量替换与 150 行预算 |
| version 常量 | `src/core/version.ts:19`（pkg.version=0.8.0） | 升版 0.9.0 |
| ADR 账本最新 #25 | `doclib/10-architecture/decisions.md` | 新增 #26 |
| check 违规 17 类清单 | `doclib/30-features/check.md:58` | 17→18 违规 + notices 2→4 |

**外部实证（gh cli + raw.githubusercontent）**：auto-coding-agent-demo CLAUDE.md 六步工作流 + task.json 结构 + 阻塞协议全文；microsoft/playwright-cli v0.1.22（14.6k★）——「Playwright CLI with SKILLS」，官方裁决 CLI 对 coding agent 更优（token 高效：不加载工具 schema 与可访问性树），`npm i -g @playwright/cli`，`install --skills`，会话持久化，`show` 监控面板；Node 18+。

## 四、方案设计

**五层贯通**（馆→sync→hook→check→skill）：

1. **test-chain 声明**（馆内 `50-testing/testing.md` frontmatter）：`test-chain.fast`（提交门禁档）/`test-chain.full`（CI 与长程收尾档），每档列表或标量双形态；缺席=特性不活跃（优雅降级）；存在但非法=fail-fast DoclibError（lesson-epoch 同构）。浏览器测试不入链（链=确定性 shell；浏览器=agent 语义层）。
2. **sync 确定性反哺**：managed 模板 `assets/guides/light.md` 增「测试链」段 + `{{TEST_CHAIN}}` 占位；guides.ts `renderManaged` 渲染（有链→fast/full 列表+事实源指针句；无链→单行显式 N-A）；预算检查作用于渲染后全文。
3. **hook 烘焙执法**：`hookScript` 增第三参 chain——check 行后追加 `# doclib-chain:<fp>` 指纹注释（fast+full 归一化串 sha256 前 12 hex）+ fast 档逐命令行（失败即断）；`ciWorkflow(chain)` full 档逐条独立 run 步骤；无链时产物与现状逐字节等价。
4. **check 三新判定**：`skeleton-progress`（违规/strict：in-progress/implemented 存在未勾选实施条目，TODO(agent) 占位除外，骨架缺失或 planned 不判）；`blocked-residue`（notice：骨架 frontmatter blocked 非空）；`chain-stale`（notice：钩子脚本指纹与馆失配或单侧缺失，foreign 跳过）。治理健康分公式不变，skeleton-progress 不入五分项。
5. **doclib-dev 双情形**：共享骨架九节不动；新增「情形 B：长程开发回路」——六步回路（选任务/开工/开发/验证分级/收口/循环）+ 验证分级（一切改动 fast 档全绿；交互面改动浏览器必做，工具序 playwright-cli > agent-browser skill > playwright mcp，CLI 项目浏览器档显式 N-A；收口前 full 档+doclib-accept AC 验收）+ 一任务一 commit + 阻塞协议四动作（禁 commit 禁翻 implemented/骨架 frontmatter blocked 标记/结构化阻塞输出/停止待人工）+ 永不删任务。rebuild 补两处指针；intest.md 薄指针化。

**版本 0.9.0**（新功能面：frontmatter 契约 + check 判定 + hook 产物变更）。

## 五、备选方案与被否理由

1. 新增 skill doclib-harness：rebuild 本质即长程复现（P2 门禁+阻塞点记录已隐含链路）、dev 即开发 skill——第三 skill 冗余（用户拍板合并为 dev 双情形）。
2. task.json 式新状态文件：与 feature-map/骨架三处状态，违单一事实源铁律。
3. feature-map 加列/子表：污染功能级账本可读性，任务级施工态不进知识账。
4. 纯 skill 自律执法：demo 原样，翻车无拦截，违确定性执法哲学。
5. 链声明落 .doclib/harness.json：知识与状态混放，违先馆后码。
6. 蒸馏管线扩段反哺（guide-project.md 增段）：agent 忘蒸/蒸错即漂移且挤占 50 行预算——sync 确定性注入胜出。
7. hook 调内部 verb 动态执行：新增命令面与范围裁决冲突；install 烘焙+check 链过期软提醒（版本戳检测同构）胜出。
8. CLI 任务状态命令族（task next/done）：状态翻转是语义决策，CLI 代写违「CLI 报告、agent 写馆」边界。
9. 浏览器测试进 test-chain：链须确定性可执行，浏览器交互是 agent 语义层，混入即烘焙失败。

## 六、用户拍板记录

INNOVATE 两轮共 12 项决策点，用户逐项拍板推荐项：

| # | 决策点 | 拍板 |
| --- | --- | --- |
| 1 | 任务级 passes 承载 | 复用 plan-skeleton checkbox + check 联动 |
| 2 | 测试链声明落点 | 馆内 testing.md frontmatter |
| 3 | 测试链执法点 | hook 分层执行 |
| 4 | 浏览器后端 | playwright-cli 首选 |
| 5 | 交付形态 | skill+check+hook+guide |
| 6 | 实施范围 | 一步到位 |
| 7 | blocked 表达 | 骨架 frontmatter blocked 标记 |
| 8 | intest.md 处置 | 吸收进 skill+留薄指针 |
| 9 | 命名 | F19 长程开发闭环 |
| 10 | skill 合并（用户主动修正） | 不新增 skill，doclib-dev 双情形 |
| 11 | 测试标准反哺（用户主动修正） | sync 确定性注入引导文件 |
| 12 | rebuild 联动 | 补指针轻联动；链执行器=install 烘焙+过期软提醒 |

## 七、实施清单（31 步）

1. 并发前置门：重核 git status 与 doclib status 基线
2. 创建本规划载体
3. feature-map 登记 #43（planned）+ progress.md 补记
4. package.json version 0.8.0→0.9.0
5. 新建 src/core/harness.ts
6. 新建 src/core/harness.test.ts + test script 登记
7. 扩展 src/commands/hook.ts（烘焙+指纹+ciWorkflow）
8. 扩展 src/commands/hook.test.ts
9. 扩展 src/core/check.ts（三类判定）
10. 扩展 src/commands/check.ts（钩子脚本文本传入）
11. 扩展 check 两级测试
12. 扩展 src/core/guides.ts（renderManaged 三态）
13. 扩展 assets/guides/light.md（测试链段+占位）
14. 扩展 src/core/guides.test.ts
15. 改造 skills/doclib-dev/SKILL.md 双情形
16. skills/doclib-rebuild/SKILL.md 补指针
17. .opencode/commands/intest.md 薄指针化
18. 新建 doclib/30-features/050-harness.md
19. 新建 doclib/40-guides/harness.md
20. 更新 doclib/30-features/check.md
21. 更新 assets/templates/library/50-testing/testing.md
22. 两级索引登记
23. PRD v0.42（F19+Q54-56）
24. ADR #26
25. typecheck + test 全绿
26. 临时目录冒烟（AC-11 全链路）
27. 本仓 dogfooding：testing.md 声明 test-chain
28. doclib sync 再生引导 + 预算核对
29. hook install 重烘焙 + check 违规 0/治理分核对
30. feature-map #43→implemented + progress 补记 + snapshot
31. 会话收尾五动作

## 八、验收标准

规范锚点：`doclib/30-features/050-harness.md` AC-1..12。

- AC-1 Given testing.md 声明 test-chain When doclib hook install Then pre-commit 烘焙 fast 档（逐命令失败即断）+ 指纹注释
- AC-2 Given 未声明 test-chain When hook install Then 产物与现状逐字节等价
- AC-3 Given 链变更未重装 When doclib check Then chain-stale notice；重装后清零
- AC-4 Given --ci Then 模板烘焙 full 档独立步骤
- AC-5 skeleton-progress 五态：planned 未勾选不判/in-progress 未勾选违规/implemented 未勾选违规/全勾选不判/骨架缺失不判
- AC-6 Given 骨架 blocked 非空 When check Then blocked-residue notice
- AC-7 sync 注入三态：有链链块/无链 N-A 行/幂等重跑不变 + 预算不破
- AC-8 dev skill 含双情形六步回路+阻塞协议+工具序+一任务一 commit
- AC-9 rebuild skill 含两处指针
- AC-10 intest.md 薄指针 ≤3 行
- AC-11 临时目录全链路冒烟
- AC-12 typecheck+test 全绿且新测试文件已登记

## 失败尝试与踩坑（踩坑一行制：日期 + 现象一句话，实时回填）

- （空——开发中实时回填）
- 2026-10-27 · 执行轮计划偏差（用户拍板修正）：批准稿 skeleton-progress 判「in-progress/implemented 未勾选均 strict 违规」——推演发现 in-progress=开工（开工即全未勾）→ 施工中 check 恒红，破坏长程回路自身；修正为 implemented 违规 + in-progress 新增 soft notice「skeleton-open」（demo passes 语义的正确映射：只有伪造完成才拦截）
- 2026-10-27 · assert.match 第二参须 RegExp，字符串字面量 TS2345（typecheck 拦截）
- 2026-10-27 · 测试夹具极简 testing.md 触发文体违规（card/structure）——hook 中 check 先于链行执行，e2e 夹具必须合文体，否则链阻断语义被文体违规抢先掩盖
- 2026-10-27 · blocked-residue 与功能状态无关（frontmatter 独立刻度），测试按状态清除断言属预期错误——notice 生命周期=标记存在性
- 2026-10-27 · python repr 引号替换单字符替换破坏 JS 字符串闭合（TS1002 Unterminated）——生成测试夹具字符串用编辑工具直写更稳
- 2026-10-27 · 蒸馏 lessons 标题时缩短了措辞 → progress 处置引用「同日期+标题前缀」匹配失败（lesson-gap 命中）——教训条目标题必须与处置引用逐字一致
- 2026-10-27 · 重演 #40 归档时序坑：snapshot 后才刷新记忆快照/反哺 hash → 引导漂移被迫补第二轮 snapshot+commit——归档正确顺序=check 违规 0 → 记忆/反哺刷新 → snapshot → commit
- 2026-10-27 · 冒烟脚本自身时序三连坑（双重 init/implement 先于 feature-map/sentinel 命名混淆）——冒烟失败先查夹具与脚本时序再怀疑产品；单测 e2e 与受控复验双层兜底生效
