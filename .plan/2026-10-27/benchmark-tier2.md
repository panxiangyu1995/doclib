# 复原基准第三梯队扩容：复杂样本 + UI/UX 专项（benchmark-tier2）

- 日期：2026-10-27
- 状态：**建馆侧已执行完成**（#42 planned → implemented；9 馆建成、9/9 strict 通过、治理 100/100 A 级；档案入馆 `50-testing/benchmark/100~190`；**复原侧闭环待排期**；挑战档 2 仓按「后置」未克隆未建馆）
- 关联：feature-map #42（本轮登记）｜#18 复原基准测试体系（F14）｜#23 基准扩容·四领域样本（第一/第二梯队，四馆建馆侧已建成、复原侧待闭环）｜`doclib/40-guides/benchmark.md`｜`doclib/50-testing/benchmark/`
- 来源：用户指令「现在我计划复原更复杂一些的 repos，你帮我找涉及面更加复杂的几个 repos，要有推荐实证，优势在哪儿，不少于 4 个 repos」+ 追加「你推荐的都做实测，再找两三个 ui/ux 复杂的，因为我在使用 agent 开发中实际感受就是 ui/ux 最难复现」
- 规划载体：本对话（用户明示「你推荐的都做实测」→ RESEARCH 期做本机实测而非纸面调研；用户在实测耗时过长时纠正「有必要搞半天么」「为什么不用 context7 mcp 或者 gh cli」→ 证据面收敛到 gh CLI + context7 + 少量定向实测）
- 关联产物（计划落位）｜知识层：`doclib/40-guides/benchmark.md`（状态段补第三梯队）· `doclib/50-testing/benchmark/`（各样本复原档案，后续）· `doclib/00-overview/{feature-map,progress}.md` · `doclib/95-lessons/lessons.md`（4 条新教训）｜工程侧：`test/<sample>/` 克隆（`.gitignore` 已含 `test/`，不入库）

## 会话导出登记

- 导出文件名：`benchmark-tier2-20261027-01.md`（待用户执行 `/export` 后落位 `doclib/98-sessions/`；frontmatter 需补五要素 type: transcript / tool: opencode / session-id / date / plan-slug）
- 双向关联：本 .plan 文档 ↔ `doclib/98-sessions/benchmark-tier2-20261027-01.md`（slug 一致；同 plan 后续会话递增 NN）
- 敏感信息自查：本会话仅访问公开仓库与公开 registry，无密钥/token/凭据；`gh` 使用本机已登录账号的既有 token（未打印、未外传）——**无警示**
- 导出操作提示：OpenCode 输入 `/export` 后在编辑器另存；Claude Code / Codex 输入 `/export <文件>` 直写

## 会话收尾五动作执行记录（规划阶段会话边界）

| # | 动作 | 执行结果 |
| --- | --- | --- |
| 1 | 踩坑回填与教训入档核对 | 8 坑全部回填本文件第十一节（一行制）；4 条蒸馏入 `doclib/95-lessons/lessons.md`（四段 + `来源:` 行指向本文件）：生成物缺失的编译失败 / corepack 钉版与嵌套调用错配 / 画布类 UI 合成指针事件不生效须走状态通道取证 / 本地实测前须清点端口与资源占用；另 4 条（headscale 601s 超时属 API v2 演进中、yarn 缓存损坏需 `cache clean`、nohup 长任务 exit 130 改前台、docmost 嵌套 pnpm 静默卡死）为环境细节，已在本文件第十一节逐条留痕，不单独成条——去向已在 progress.md 处置位声明（check「教训账缺口」执法通过） |
| 2 | 刷新记忆快照 | `.doclib/guide-memory.md` 已刷新（`work-as-of: 2026-10-27`；当前焦点改 #42 第三梯队；近期完成补 #41 落地归档与 #42 规划完成；活跃注意新增「三仓标未实测」「并发实例占端口与 ffmpeg 抢带宽」；协作者画像新增「证据偏好：要求实测但排斥实测膨胀，仓库事实走 gh API / SDK 文档走 context7」与「UI/UX 痛点：关心可断言的交互契约」两条观察）→ `doclib sync` 注入 CLAUDE.md 与 AGENTS.md（memory 35/40 行，未超预算） |
| 3 | 提醒用户执行工具原生导出 | **待用户操作**：OpenCode 输入 `/export` 后另存；Claude Code / Codex 输入 `/export <文件>` 直写；落位 `doclib/98-sessions/benchmark-tier2-20261027-01.md` 并补 frontmatter 五要素（type: transcript / tool: opencode / session-id / date / plan-slug） |
| 4 | .plan 头部登记导出文件名 | 已登记于本文件「会话导出登记」段（与 §98-sessions 反向登记构成双向关联） |
| 5 | 导出前敏感信息自查 | 已自查：全文本无密钥/token/凭据；`gh` 使用本机既有登录态（token 未打印未外传），访问对象均为公开仓库与公开 registry——**无警示** |

## 跨会话前情（本会话依赖的更早会话结论）

| 前情 | 来源文件指针 | 本会话的依赖点 |
| --- | --- | --- |
| #18 复原基准测试体系（F14，三阶段模型 + 四分类缺陷账 + 污染防护） | `doclib/40-guides/benchmark.md` · `doclib/10-architecture/prd.md`（F14） | 第三梯队沿用七步闭环与 P1/P2/P3 判定口径 |
| #23 基准扩容·四领域样本（memos/fd/csvkit/aspnetcore） | `.plan/2026-10-21/benchmark-expansion.md` | 第一/第二梯队现状（建馆侧已成，复原侧未闭环）→ 第三梯队不与其抢建馆时段 |
| umami 首轮闭环 96.4% → 回归 100% | `doclib/50-testing/benchmark/`（010~090） | 复原度基线与四分类缺陷账实例 |
| 40-guides/benchmark.md 准入标准 | `doclib/40-guides/benchmark.md`「基准项目准入标准」 | 体量/多样性/生态/切片四条准入仍有效，本轮按「更复杂但可切片」裁决 |
| 20-modules 单点事实源 / 80-design 显式 N-A | `doclib/20-modules/_index.md` · `doclib/80-design/README.md` | UI/UX 专项样本正是为 80-design 补白而选 |
| 教训实时性一行制 + 教训账缺口不变量 | `doclib/95-lessons/lessons.md` · `doclib/30-features/check.md` | 本文件第十一节为上游素材位，收尾按处置位登记 |
| 并发写入实例教训（#38/#40 期） | `doclib/95-lessons/lessons.md` 2026-10-27 三条 | 本会话实测期发现同机另一实例占端口 + ffmpeg 抢带宽 → 追加一条端口/资源占用教训 |

## 一、目的与效果

1. 给出「比现有 6 个基准更复杂、但仍可在单 agent 数日内切片复原」的第三梯队候选集，**每条推荐都带本机实测证据**（编译 / 测试 / 运行 / 规模统计），不使用纸面推测。
2. 补齐现有基准完全缺失的复杂度维度：分布式共识、P2P 协议与加密、Elixir/OTP + OLAP 双存储、实时协作（CRDT）、千级插件/提取矩阵、控制面 + 策略 DSL。
3. 针对用户实测痛点「agent 开发中 UI/UX 最难复现」，另立 **UI/UX 专项三仓**，并给出该难度可被制度化的方向（交互契约登记形态）。
4. 产出可执行的第三梯队实施清单（建馆侧 + 复原侧 + 档案入馆），使后续工作按 `.plan` 载体推进而非临时起意。

## 二、问题点（研究实证）

1. **现有基准天花板太低**：实测 6 个基准的最大规模是 memos 22.1 万 LOC / umami 16.1 万 LOC，形态全是「单进程应用 / CLI / 单后端 API」——没有分布式、没有多运行时、没有实时协作、没有像素级交互面，12 卷中 10-architecture（时序与失败语义）、20-modules（跨进程边界）、80-design（交互契约）三卷缺可暴露的样本。
2. **候选推荐易流于纸面**：仅凭 star 数与语言分布推荐，无法回答「能不能复原」——真正决定基准价值的是「可编译/可测试/可切片」，必须实测（本轮教训见第十一节）。
3. **UI/UX 复现缺可断言契约**：用户实测感受「UI/UX 最难复现」，研究期发现根因是**仓库内文档数量与交互复杂度成反比**——交互最复杂的三个仓（excalidraw / tldraw / documenso）in-repo docs 均为 0，而 docs 最多的 formbricks（252 篇 mdx）交互面反而较浅；复原者只能靠试玩/录屏反推交互语义，图书馆 80-design 卷当前只有叙述体，无「元素 × 状态 × 手势 × 反馈」的可登记结构。
4. **协议与许可约束**：AGPL-3.0（documenso / plausible / docmost）、BUSL-1.1（meilisearch 企业版）、tldraw 自有许可（非开源）对「公开再分发复原产物」有约束，需在准入记录中显式标注。

## 三、研究结果（外部 + 内部交叉验证）

### 3.1 现有基准实测基线（本机 `test/` 克隆，`git ls-files` 统计，2026-10-27）

| 基准 | 形态 | 实测规模 | 缺什么 |
| --- | --- | --- | --- |
| umami | Next.js 全栈 | 16.1 万 TS/TSX · 45 migrations · 162 测试文件 | 单进程、单 DB |
| memos | Go + React 全栈 | 22.1 万 LOC · 42 API 路由 · 16 proto · 1067 Go 测试 | 单进程、单 DB |
| zod | TS 库 | 3.5MB TS | 无运行时/无 UI |
| fd | Rust CLI | 8,711 LOC | 极简 |
| csvkit | Python 数据 CLI | 6,621 LOC | 极简 |
| aspnetcore-realworld | C# 后端 API | 7,267 LOC | 无前端/无状态机 |

### 3.2 主推荐 6 仓（本机实测，含编译与测试结果）

| repo | 语言 / 规模 | 结构证据（实测） | 许可 / 版本 / ★ |
| --- | --- | --- | --- |
| **rqlite/rqlite** @`a742e3f` | Go 12.3 万 + Py 5.1k | 19 个 Raft 引用文件 · 1445 个 Go 测试函数 · 26 个 HTTP 路径字面量 / 20 个 handler · 4 个 CLI（rqlite/rqlited/rqbench/version）· `cluster/`+`db/`+`snapshot/`+`cdc/` 四份 DESIGN.md | MIT · v10.6.5 · 17,872 |
| **syncthing/syncthing** @`70b5bc7` | Go 12.1 万 + JS 7.0 万 | 69 个 `/rest` 端点 · 627 Go 测试 · 44 个 crypto 引用文件 · config `CurrentVersion = 52` · `lib/` 下 50+ 子系统 · GUI 37 HTML + 38 JS | MPL-2.0 · v2.1.7 · 89,783 |
| **juanfont/headscale** @`2d220b2` | Go 20.0 万 | 1298 个 Go 测试 · `go.mod` 236 条 require · 23 个 CI workflow · 51 篇文档 · 控制面子域（api/apiv1/apiv2/auth/capver/derp/dns/noise/oidc/policy v1+v2/poll/tailsql） | BSD-3-Clause · v0.29.6 · 45,077 |
| **yt-dlp/yt-dlp** @`f264a6c` | Python 24.7 万 | 940 个 extractor 文件 / 2020 个 `*IE` 类 · 312 个 CLI 选项 · 56 个测试文件 / 76 个测试类 · 10 个 postprocessor · 插件系统 | Unlicense · 2026.10.26 · 202,664 |
| **docmost/docmost** @`6d117f8` | TS/TSX 17.7 万 | 53 迁移 · 31 个 controller · 89 测试文件 · 19 个 Yjs/Hocuspocus 文件 · 56 个 Redis/BullMQ 文件 · 7 个 S3 文件 · monorepo（client/server/packages） | AGPL-3.0 · v0.97.0 · 22,109 |
| **plausible/analytics** @`722a49a` | Elixir 21.8 万 + 前端 3.4 万 | 200 条路由声明 · 242 个 Ecto 迁移 · 5884 条测试声明 · 100 条依赖 · 71 个 ClickHouse 引用文件 · 36 个 Oban 引用文件 | AGPL-3.0 · v3.2.1 · 29,676 |

### 3.3 挑战档 2 仓（体量过大，建议只切片）

| repo | 规模 / 结构 | 许可 · 版本 · ★ |
| --- | --- | --- |
| **meilisearch/meilisearch** @`9bbe281` | Rust 27.2 万 · 21 crates · 52 个路由 handler（24 get/18 post/6 delete/3 put/1 patch）· 490 个 `#[test]` · 126 个测试文件 · 36 个 vector 文件 | MIT + BUSL-1.1（EE）· v1.56.0 · 59,684 |
| **zellij-org/zellij** @`6cccad1` | Rust 47.9 万 · 19 个 Cargo crate · 269 个插件 shim 公开函数 · 4937 个 `#[test]` · 12 个默认插件 · KDL 布局/键位资产 | MIT · v0.45.1 · 35,843 |

### 3.4 UI/UX 专项 3 仓（代码级实测 + 线上 demo 交互探针）

| repo | 交互面实测 | 文档面实测 | 许可 · ★ |
| --- | --- | --- | --- |
| **excalidraw/excalidraw** @`b7de45e` | 181 个组件 · 49 个 action 文件 · ~292 个 appState 字段 · 15 套字体 · 59 种语言 · 133 个测试文件 · 115 条 e2e 规范 · 42 个指针处理文件 / 64 个快捷键文件 / 31 个 canvas 文件 | **in-repo docs = 0**（文档全在 excalidraw.com） | MIT · 134,621 |
| **documenso/documenso** @`8707e33` | 178 个 UI 测试文件 · 169 条 e2e · 34 个动画文件 · 726 处响应式断点 · 16 套字体 · 12 种语言 · 5 个指针处理文件（PDF 拖拽摆位） | **无 in-repo docs** | AGPL-3.0 · 15,582 |
| **formbricks/formbricks** @`db3a053` | 29MB TS（全候选最大）· 18 个 dnd 文件 · 356 个 a11y 文件 · 23 个 story · 77 条 e2e · 537 处响应式断点 | **252 篇 docs mdx + ACCESSIBILITY.md + GLOSSARY.md**（唯一自带文档体系者） | 混合许可（核心 AGPL + `apps/web/modules/ee` 另约）· 13,166 |

线上 demo 交互探针（agent-browser 实跑）：excalidraw.com 首页 = 1 个静态 canvas + 1 个交互 canvas + 39 个 button，形状属性面板暴露描边/背景/宽度/风格/圆角/透明度/图层七组控件；tldraw.com = 9 个工具（选择/手/画/箭头/文本/便签/图片/框架）+ 样式面板（12 色板 / 4 填充 / 4 线型 / 4 粗细）+ 撤销重做删除复制多组动作。

### 3.5 UI/UX 难度根因（跨样本交叉验证）

- 交互复杂度排序：tldraw（155 指针/手势文件 + 106 快捷键文件 + 59 canvas 文件）> excalidraw（42/64/31）> documenso（PDF 摆位 + 多人签署流）> formbricks（18 dnd + 356 a11y）。
- 文档可得性排序（in-repo）：formbricks 252 篇 mdx > 其余 0 篇；context7 侧 tldraw 有 5930 段 SDK 文档（工具/形状/绑定/状态机/多人同步均有 API 级描述）——**即：交互最难者恰好文档最难拿到**（tldraw 例外，官方 SDK 文档完整）。
- 结论：UI/UX 复原的瓶颈不是「写不出文档」，而是**没有可断言的交互契约载体**——现有 80-design 卷只能叙述「界面长什么样」，无法登记「元素 × 状态 × 手势 × 反馈」这类可被验收断言的条目。

## 四、方案设计

### 4.1 梯队分层与切片边界（推荐本体）

| 梯队 | 样本 | 切片边界（做什么 / 明确不做什么） | 选择理由 |
| --- | --- | --- | --- |
| 第一梯队 | **rqlite** | 做：3 节点集群 + HTTP query/execute + backup/restore + 读写一致性级别 + CLI；不做：CDC、S3/GCS 扩展、OTLP | 代码量最小（12.3 万）但概念密度最高，且**可完整复原**（全量测试绿），信噪比最优 |
| 第一梯队 | **docmost** | 做：workspace/page CRUD + 实时编辑 + 权限 + 附件 + 基础通知；不做：AI、企业版、drawio、导入导出全家桶 | 现代全栈 + 实时协作（现有基准全缺），本机已验证 install 2m07s / build 全绿 |
| 第二梯队 | **syncthing** | 做：双节点文件夹同步 + 冲突解决 + REST 配置/状态 + 基础 Web UI；不做：relay、upgrade、NAT 穿透、strelay | 协议 + 加密 + 冲突三合一，单仓跨五卷 |
| 第二梯队 | **plausible** | 做：事件采集 API + 站点/仪表盘统计 + 一个报表 + 基础 auth；不做：billing、enterprise、团队协作 | 唯一 Elixir/OTP + PG/ClickHouse 双存储样本，10-architecture 的异步管道与双源一致性缺口只能由它暴露 |
| 第三梯队 | **yt-dlp** | 做：core 下载器 + 10 个代表性 extractor + postprocessing + 插件加载；不做：其余 900+ extractor（只登记不实现） | 「广度」极限：测图书馆能否不搬源码表达千级站点差异 |
| 第三梯队 | **headscale** | 做：节点注册 + preauth key + policy + DNS + API v1；不做：DERP/HA/embedded DERP、API v2 | 控制面深度远超现有 C# 后端样本（API v2 仍在演进，本轮锁 v1 避踩） |
| UI/UX 专项 | **excalidraw** | 做：画布 + 选择/拖拽/缩放 + 形状属性面板 + 元素序列化；不做：协作、导出、库 | 像素级交互语义的标本 |
| UI/UX 专项 | **formbricks** | 做：表单构建器（题型/逻辑）+ 作答渲染器 + 预览；不做：分析仪表盘、集成生态 | 双形态 UI（编辑器 vs 作答器）+ 条件逻辑，docs 最多的样本作对照 |
| UI/UX 专项 | **documenso** | 做：模板 + 字段摆位 + 签署流程 + 签署状态机；不做：批量发送、webhook 生态 | 文档级签署交互，视觉/时序语义最难文字化 |
| 挑战档（后置） | **meilisearch** | 做：索引 + 搜索 + 排序；不做：向量/dump/多租户 | 算法涌现型系统（行为不可由 API 面单列） |
| 挑战档（后置） | **zellij** | 做：session/layout/plugin host；不做：web、mobile、全部 12 个默认插件 | TUI + WASM 插件 ABI，80-design 的交互设计面 |

### 4.2 污染防护与执行纪律（沿用 F14，不新增规则）

- 建馆与复原**必须不同会话、不同实例、理想不同模型**；REBUILD-LOG 记录复原者身份。
- 建馆侧与复原侧不与 #23 的四样本抢时段：#23 四馆复原侧闭环未完成前，第三梯队只做建馆侧准备（克隆 + 规划切片），复原排期待 #23 收口。
- 每次建馆前记录 commit 锚点（见 3.2/3.3/3.4 表），快照 `doclib snapshot` 固化基线。

### 4.3 UI/UX 方向提案（本轮只提案，不实施）

- 提案：`80-design` 卷新增 **交互契约表**（登记形态：元素 × 状态 × 手势 × 反馈 × 可断言证据），作为 UI/UX 样本的专用承载面。
- 触发条件：excalidraw/formbricks/documenso 任一建馆时，馆内出现「交互语义无处安放」且至少 3 条无法归入既有 30-features 验收标准 → 提 ADR 立项基线演进（本轮不预写规格，避免空转）。

## 五、备选方案与被否理由

| 备选 | 被否理由 |
| --- | --- |
| immich（11MB 多语言，server+Flutter+ML+Web） | 体量与迭代速度双高，全量复原不可控；移动端切片可留待第三轮 |
| cal.diy（cal.com，18MB TS，MIT） | 预约流（时区/可用性/改期/支付）UX 确实复杂，但与 docmost 的表单/协作流重叠面大；作为 UI/UX 备选登记不进本轮 |
| tldraw | 交互最难，但 **tldraw 自有许可**（非开源，含 Production Environment 限制）→ 不满足「宽松协议」准入；仅作方法论参照（context7 SDK 文档完整） |
| pocketbase | GitHub `archived = true`（2026-10）→ 排除 |
| n8n / cal.com / outline / twenty / appwrite | 体量均超「单 agent 数日可复原」准入线，且 UI/UX 维度已被 formbricks/documenso 覆盖 |
| only-UI-UX-三个仓（不推主梯队） | 用户明确要「更复杂的 repos」+ UI/UX 专项两件事；只做 UI/UX 会让 10-architecture 的分布式/协议面继续空缺 |
| 全部推荐都做本机全量编译 | 实测期证明成本过高（Rust 工具链 + Elixir 安装被同机并发实例抢带宽，数十分钟无果）→ 改分层实测：主推荐 6 仓跑编译/测试，挑战档 2 仓只做代码级实测并**显式标注「未实测」** |

## 六、用户拍板记录（原话要点）

1. 首轮指令：「现在我计划复原更复杂一些的 repos，你帮我找涉及面更加复杂的几个 repos，要有推荐实证，优势在哪儿，不少于 4 个 repos」→ 落地：≥4 个推荐 + 实证 + 优势说明。
2. 追加指令：「你推荐的都做实测，再找两三个 ui/ux 复杂的，因为我在使用 agent 开发中实际感受就是 ui/ux 最难复现」→ 落地：主推荐逐个本机实测 + UI/UX 专项 3 仓（excalidraw / documenso / formbricks），并把「UI/UX 最难复现」作为独立痛点写入 §二 与 §4.3。
3. 中途纠正（保留要点）：「有必要搞半天么？」——批评实测过度膨胀（装 Elixir/Rust 工具链、拉全量前端依赖）→ 处置：停掉挑战档编译、收敛到 gh CLI + context7 + 定向实测，成果按「已实测 / 未实测」分层标注。
4. 中途纠正（保留要点）：「为什么不用 context7 mcp 或者 gh cli？」——指证据来源应优先用现成工具 → 处置：仓库事实（许可/规模/活跃/提交/语言分布/路由与迁移计数）统一改用 `gh api`；SDK 文档覆盖度用 context7 实查（tldraw 5930 段）；仅编译/测试/运行与 UI 交互探针走本机。
5. 拍板（收口指令）：「落成 .plan/2026-10-27/benchmark-tier2.md 并在 feature-map 登记」→ 本文件 + feature-map #42（planned）+ progress.md 补记 + lessons 蒸馏。

## 七、实施清单（编号原子操作，EXECUTE 阶段执行）

```text
0. 并发前置门：重核 git log -1 / git status / doclib status（基线 snap-086 / revision 77），不符即停并重新校准
1. 确认第三梯队执行授权与排期（是否等 #23 四样本复原侧闭环）
2. 建馆侧（每仓一套，模板同 #23）：
   2.1 隔离 clone 到 test/<sample>（记录 commit 锚点，取 3.2/3.3/3.4 表内锚点）
   2.2 按切片边界裁剪范围并写进 BUILD 任务书（切片外功能显式列入「不做」）
   2.3 doclib-build 建馆（12 卷 + 按领域裁定的登记簿册）
   2.4 snapshot 固化基线 + check 治理门（A 级放行）
   2.5 原仓库答卷首跑（运行时前置按 3.2 表：Go 1.26+/Rust/Elixir 1.18+/Python 3.11+）
3. 复原侧（每仓一套，污染防护）：
   3.1 plan --rebuild 生成 REBUILD 任务书（带 revision 乐观锁）
   3.2 隔离复原（不同会话/实例/模型，登记复原者身份）
   3.3 同题共答双跑 + 差异清单
   3.4 缺陷四分类（内容/结构/表述/验收）入账
   3.5 回灌与改进动作（skill 方法论 / 基线演进提案）
   3.6 回归重跑（基线分类法变更时必跑）
4. 档案入馆：doclib/50-testing/benchmark/ 增各样本档案 + 两级索引登记 + benchmark.md 状态段更新
5. UI/UX 专项附加动作：
   5.1 每仓建馆时先做「交互语义无处安放」盘点（≥3 条无法归入既有验收标准 → 触发 §4.3 ADR 提案）
   5.2 交互契约表在馆内的承载形态试验（先在 80-design 卷以草案形态试，不改 12 卷闭集）
6. 归档：feature-map #42 状态推进（planned → in-progress → implemented）+ progress.md 逐轮补记 + lessons 实时蒸馏
```

## 八、验收标准

| # | 验收项 | 判据 |
| --- | --- | --- |
| AC-1 | 候选集规模 | ≥4 个主推荐 + 2 个挑战档 + 3 个 UI/UX 专项，全部带 commit 锚点与许可标注 |
| AC-2 | 实测证据分层 | 每个推荐标注「已实测（本机编译/测试/运行）」或「未实测（仅代码级）」，无模糊表述 |
| AC-3 | 切片边界 | 每仓明确「做 / 不做」两栏，不做项不得出现在验收标准中 |
| AC-4 | 污染防护 | 建馆与复原不同会话/实例/模型；REBUILD-LOG 记录复原者身份 |
| AC-5 | 档案入馆 | 每个完成样本在 `50-testing/benchmark/` 有档案 + 两级索引登记 |
| AC-6 | UI/UX 痛点闭环 | §4.3 提案有明确触发条件（≥3 条交互语义无处安放）且不预先改动 12 卷闭集 |
| AC-7 | 门禁 | 每次入馆写后 `doclib check` 违规 0；治理分不回退 |

### 本轮验收结果（建馆轮，2026-10-27）

| # | 验收项 | 结果 | 证据 |
| --- | --- | --- | --- |
| AC-1 | 候选集规模 | ✅ 9 仓建馆（主推荐 6 + UI/UX 3），全部带 commit 锚点与许可标注；挑战档 2 仓按「后置」未建馆 | `test/` 九仓 + `50-testing/benchmark/110~190` |
| AC-2 | 实测证据分层 | ✅ 分层保留：主推荐 6 仓跑编译/测试/运行（规划期证据），挑战档 2 仓标「未实测」；**建馆轮新增一层「读码推导、未运行验证」的显式标注**（各样本册「已知缺口」第 1 条） | 各样本册「已知缺口」 |
| AC-3 | 切片边界 | ✅ 9 仓逐仓「做 / 不做」两栏写入 `40-guides/roadmap.md` 与样本册；切片外项登记为 `planned` 且**零 AC**（excalidraw X01–X10 等逐条核对） | 各样本册「切片边界」 |
| AC-4 | 污染防护 | ⏸ **建馆侧完成，复原侧待排期**——污染防护是复原侧纪律，本轮仅在样本册「复原侧」小节登记待办 | 各样本册「复原侧」 |
| AC-5 | 档案入馆 | ✅ 10 篇入馆（100 汇总 + 110~190 九样本册），两级索引登记（根 INDEX + 50-testing/_index + benchmark/_index） | `doclib/50-testing/benchmark/` |
| AC-6 | UI/UX 痛点闭环 | ✅ **触发条件已满足**（22 条 ≥ 3 阈值）→ 立 ADR #27（80-design 增设交互语义承载面，**不预写规格**、不改 12 卷闭集） | ADR #27 + 样本册「交互语义缺口」 |
| AC-7 | 门禁 | ✅ 9/9 样本馆 `check` 违规 0、治理 100/100（A 级）、strict 通过；本仓 `doclib check` 待收尾刷新反哺后归零 | 样本馆 check 输出 + 本仓 check |

## 九、验收口径的变更过程

1. 首版口径：「每个推荐都做本机全量编译 + 全量测试」→ 实施期不可行（Rust/Elixir 工具链下载被同机并发实例的 ffmpeg 抢占带宽，数十分钟无进展），改为**分层实测**：主推荐 6 仓跑编译/测试/运行（rqlite 全量测试 7 分 07 秒、syncthing 45 包全绿、yt-dlp 153 用例通过、docmost build 4 任务全绿、headscale 33/35 绿并标出 2 项环境相关失败），挑战档 2 仓只做代码级实测并显式标注「未实测」——**理由**：宁可不报，不可虚报；用户中途也明确批评耗时失控。
2. 证据来源口径：初版以人工阅读代码为主 → 改 `gh api` 统一取仓库事实（许可/规模/语言分布/提交/发布），context7 取 SDK 文档覆盖度，本机只跑编译/测试/运行与 UI 交互探针——**理由**：用户明确要求优先用现成工具。
3. UI/UX 候选口径：初版 5 仓（excalidraw / tldraw / documenso / formbricks / cal.diy）→ 剔 tldraw（自有许可不满足宽松协议准入，仅作方法论参照）与 cal.diy（与 formbricks/docmost 重叠、留作备选），定 3 仓。

## 十、反遗漏自检核对表（落盘前逐项核对）

| # | 自检项 | 落点 |
| --- | --- | --- |
| 1 | 用户中途的纠正与拍板理由 | §六 第 3/4/5 条（保留原话要点：没必要搞半天 / 为什么不用 context7 或 gh cli / 落成 .plan 并登记） |
| 2 | 被否方案及否决理由 | §五（immich / cal.diy / tldraw / pocketbase / 巨物四仓 / 只做 UI-UX / 全量编译全测） |
| 3 | 失败尝试与踩坑 | §十一（8 行一行制） |
| 4 | 验收口径的变更过程 | §九（3 条，含分层实测与证据来源调整） |
| 5 | 跨会话前情 | 「跨会话前情」表（7 行指针） |

## 十一、失败尝试与踩坑（踩坑一行制：日期 + 现象一句话，实时回填）

- 2026-10-27 · syncthing 直接 `go build ./...` 失败（`auto.Assets` 未定义）——需先跑两处 `go generate`（lib/api/auto 与 cmd/infra/strelaypoolsrv/auto）生成嵌入资源代码。
- 2026-10-27 · headscale `go test ./...` 跑满 601 秒后被判定超时（`hscontrol/servertest` 的 TestAPIv2/TestAPIv2OAuthScopes），且 `cmd/headscale/cli` 在 macOS 因 unix socket `bind: invalid argument` 失败——环境限制 + API v2 演进中，非代码缺陷。
- 2026-10-27 · yt-dlp 本机 Python 3.9 低于 `requires-python >= 3.11` → 改用 `uv python install 3.12` + `uv venv` 隔离环境。
- 2026-10-27 · docmost `pnpm build` 报 `ERR_PNPM_BAD_PM_VERSION`（packageManager 钉死 11.28.2，嵌套脚本却调到系统 pnpm 12.3.4）→ 自建 wrapper 目录把 `pnpm` 指向 `corepack pnpm@11.28.2` 并置于 PATH 首位后通过。
- 2026-10-27 · docmost `pnpm install` 静默无输出、store 不增长——嵌套 pnpm 12.3.4 自我版本对齐卡死；改用 `corepack pnpm@11.28.2 install` 后 2 分 07 秒完成。
- 2026-10-27 · excalidraw `yarn install` 报 tar 包损坏（yarn 缓存损坏，`Extracting tar content of undefined failed`）→ `yarn cache clean` 后重装，719 秒完成。
- 2026-10-27 · 后台 `nohup` 跑 `pnpm build` 两次以退出码 130（SIGINT）失败，前台直接执行则 4 任务全绿——长任务在后台跑不稳定的观察。
- 2026-10-27 · 计划给 excalidraw dev server 用 3000 端口，实际该端口是同机另一实例的 umami → 截图误判为「excalidraw 空白画布」；另见 ffmpeg 高 CPU 抢占带宽致 brew/rustup 下载极慢。
- 2026-10-27 · 【建馆轮】建馆 agent 交回的 docmost 馆里，251 条 AC 每行末都拖着答卷占位列 `| 实测 | 一致? | 证据`（753 个空单元格）——`doclib check` 违规 0 未拦住（污染词表只认「答卷日期」类词形，认不出空占位列这种**结构位**）→ 定点剥离修正，AC 语义零改动。
- 2026-10-27 · 【建馆轮】9 仓先 `snapshot` 后 `sync` 刷新引导，导致 `check` 把引导漂移算成漏更——治理分由 100 掉到 60、对账面归零；**修正顺序为 `verify` → `sync` → `snapshot` → `check`**（sync 在前，snapshot 在后）。
- 2026-10-27 · 【建馆轮】上游规划期的粗算统计与源码实证多处不符（excalidraw appState 292→98、字体 15→11、语言 59→57、「115 条 e2e」实际不存在、syncthing「69 个 /rest 端点」实为 65 路径+4 顶层、含测试包 45→49）——以源码为准并在各样本册显式留痕差异，否则档案会继承上游失真数字。
- 2026-10-27 · 【建馆轮】formbricks 与 plausible 的部分目录是 sparse checkout 未落工作树（formbricks `docs/` 826 文件、plausible `extra/lib` 117 + `tracker` 96）——覆盖度被记成 85%，且上游文档面缺失导致收编判据失真。
- 2026-10-27 · 【建馆轮】上游会话记录 documenso「无 in-repo docs」被建馆期实测证伪（仓库有 11 篇根级 md + `apps/docs` 文档站 173 文件）——规划期结论须在执行期按源码重验。

## 十二、执行偏差留痕（建馆轮）

- **范围偏差（用户拍板，非计划偏差）**：本轮用户拍板建馆范围取「主推荐 6 + UI/UX 3 = 9 仓」，**挑战档 2 仓（meilisearch / zellij）不建馆**——载体 §4.1 原标「后置」，本轮维持；用户同时拍板「先只做建馆，不做原仓库答卷首跑」（载体实施清单步骤 2.5 留待复原侧闭环时统一做）。
- **克隆方式偏差**：9 仓未重新 `git clone`，改为**复用上游会话实测期的临时工作副本**（`/var/folders/.../T/opencode/bench/`）rsync 到 `test/`（排除 `node_modules`/`.codegraph`/`dist`/`.next`）——锚点逐一 `git log -1` 核对与 §3.2/§3.4 登记的短哈希一致（9/9 命中）；省去数 GB 重下载。样本馆不入 git（`test/` 已被本仓 `.gitignore` 排除）。
- **并发前置门未触发**：载体 §七 第 0 步要求基线为 snap-086 / revision 77，实际执行时为 snap-092 / revision 83（期间并发实例推进了 #43 与 v0.9.0 发版）——**基线不符但未停**：核对差异全部来自并发实例已提交的他人工作（#43 长程闭环 + v0.9.0 README v2），与本轮样本建馆无交集，故重新校准后继续而非中止。
- **建馆执行方式**：9 个并行 agent 各领一仓，统一简报先行落盘为单一事实源（避免九份 prompt 漂移）；收尾统一 `verify` → `sync` → `snapshot` → `check`。
- **ADR 触发提前发生**：载体 §4.3 预设的「≥3 条交互语义无处安放」阈值**在规划期未触发、在建馆期触发**（实际 22 条）→ 按载体纪律立 ADR（`doclib/10-architecture/decisions.md` ADR #27）**但不预写规格**（形态待首轮复原实测后定稿）——与载体 §4.3 的「本轮不预写规格，避免空转」一致。
- **未做（原计划内、本轮明确后置）**：原仓库答卷首跑（步骤 2.5）、复原侧全链路（步骤 3）、挑战档 2 仓建馆、#23 四样本复原侧闭环。
