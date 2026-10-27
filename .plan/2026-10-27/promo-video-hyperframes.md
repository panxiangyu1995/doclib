# DocLib 推广视频制作（promo-video-hyperframes）

- 日期：2026-10-27
- 状态：规划完成待执行（#41 in-progress；RESEARCH→INNOVATE→PLAN 三阶段已闭环，57 步实施清单已定；会话收尾五动作已执行，基线 snap-082 / revision 73；EXECUTE 待用户显式授权）
- 关联：feature-map #41（本轮登记）｜#26 README 门面重写（数字失真同族）｜#18 复原基准测试体系（视频硬证据来源）｜#17 治理全周期（治理分素材）｜#38 教训实时性一行制（本节即其上游素材位）｜PRD v0.41｜ADR #25
- 来源：用户指令「我刚才查了视频生成层使用 HyperFrames 效果好又省心，你帮我确认一下。还有帮我规划一下视频介绍流程，还有介绍的流程和内容。最好做出一个 demo，我看看效果」+ RIPER-5 协议指令 + planstore 纪律指令 + 七项拍板
- 规划载体：本对话（RIPER-5 RESEARCH → INNOVATE → PLAN → EXECUTE；planstore 纪律落盘）
- 关联产物（计划落位）｜知识层：`doclib/40-guides/video/{_index,storyboard,script,production,publishing}.md`｜工程源：`video/`（HyperFrames composition + 字体 + GSAP）｜渲染产物：`video/renders/*.mp4`（不入 git）｜发布链：`.github/workflows/release.yml` + `package.json` 版本 + npm 发版｜验收留痕：`doclib/50-testing/acceptance-promo-video-v0.8.0.md`

## 会话导出登记

- 导出文件名：`promo-video-hyperframes-20261027-01.md`（待用户执行 `/export` 后落位 `doclib/98-sessions/`；frontmatter 需补五要素 type: transcript / tool / session-id / date / plan-slug）
- 双向关联：本 .plan 文档 ↔ `doclib/98-sessions/promo-video-hyperframes-20261027-01.md`（slug 一致；同 plan 后续会话递增 NN，EXECUTE 阶段为 `-02`）
- 敏感信息自查：本会话全部内容为项目内研究/计划文本，无密钥、token、凭据；`npm view`/`npm pack` 均走公开 registry，未接触任何凭据——**无警示**
- 导出操作提示：OpenCode 输入 `/export` 后在编辑器另存；Claude Code / Codex 输入 `/export <文件>` 直写

## 会话收尾五动作执行记录（规划阶段会话边界）

| # | 动作 | 执行结果 |
| --- | --- | --- |
| 1 | 踩坑回填与教训入档核对 | 5 坑全部回填本文件第十一节（一行制）；其中 3 条蒸馏入 `doclib/95-lessons/lessons.md`（四段 + `来源:` 行指向本文件），另 2 条（zsh 无 `timeout`、npx 直呼包内 bin 404）为工具细节不构成可迁移经验——已在 progress.md「规划完成」条目的 `教训:` 处置位声明去向（check「教训账缺口」执法通过） |
| 2 | 刷新记忆快照 | `.doclib/guide-memory.md` 已刷新（`work-as-of: 2026-10-27`；当前焦点改 #41；新增「npm 0.4.0 未发布」「并发写入实例」两条活跃注意；协作者画像新增「先验判断要求确认 / 连续两次选推荐项」观察）→ `doclib sync` 注入 CLAUDE.md 与 AGENTS.md；`doclib/10-architecture/overview.md` 同步补记「memory 区生产者是 agent 会话收尾」 |
| 3 | 提醒用户执行工具原生导出 | **待用户操作**：OpenCode 输入 `/export` 后另存；Claude Code / Codex 输入 `/export <文件>` 直写；落位 `doclib/98-sessions/promo-video-hyperframes-20261027-01.md` 并补 frontmatter 五要素（type: transcript / tool / session-id / date / plan-slug） |
| 4 | .plan 头部登记导出文件名 | 已登记于本文件「会话导出登记」段（与 §98-sessions 反向登记构成双向关联） |
| 5 | 导出前敏感信息自查 | 已自查：全文本无密钥/token/凭据，公开 registry 访问无凭据——**无警示** |

## 跨会话前情（本会话依赖的更早会话结论）

| 前情 | 来源文件指针 | 本会话的依赖点 |
| --- | --- | --- |
| #17 治理全周期 + 双层图书馆（12 卷 + 登记簿族 + 归位宪法 + 三态更新） | `doclib/10-architecture/prd.md`（v0.23+）· `doclib/30-features/place.md` | 落位宪法与孤儿四态判定 → 决定视频工程不入馆 |
| #18 复原基准测试体系（F14，umami 基准） | `doclib/40-guides/benchmark.md` · `doclib/50-testing/benchmark/` | 幕 3/幕 4 的硬证据与数字来源 |
| #22 CLI 自动化验收套件（350 用例） | `doclib/50-testing/cli-acceptance-suite.md` · `doclib/50-testing/testing.md` | 视频内测试数字的实测口径 |
| #26 README 门面重写 | `doclib/00-overview/feature-map.md` #26 行 · `.plan/2026-10-22/readme-facade-rewrite.md` | 幕 1 痛点场景来源；现状表失真清单 |
| #27 门面文件多语言变体豁免 | `doclib/10-architecture/decisions.md` ADR #14 | README.en.md 同步口径 |
| #32 引导文件图书馆反哺（反哺区 + 走查账） | `doclib/30-features/guides.md` | 幕 5 素材（引导四区）；`.doclib/guide-project.md` 指纹纪律 |
| #35/#36/#38 归档闭环四不变量 + 教训实时性 | `doclib/30-features/check.md` · `doclib/95-lessons/lessons.md` | 本 plan 的双锚点登记与本节（第九节）纪律 |
| #39 规划直通车（F17，bootstrap v2 / implement 拆单 / AC 编号化） | `doclib/30-features/040-planning-express.md` · `doclib/40-guides/010-tool-adoption.md` | 「规划载体 + 验收标准」的表达范式 |
| #40 记忆快照与协作者画像反哺（F18，引导四区） | `doclib/30-features/guides.md` · `.doclib/guide-memory.md` | 幕 5 的四区结构；收尾动作 2 的快照刷新 |
| #12 ADR（43 仓治理实测） | `doclib/10-architecture/decisions.md` ADR #12 | 幕 6 的 2,052→0 数字来源 |
| 本仓自身即 dogfooding 样本 | `doclib/00-overview/progress.md`（30+ 次开发事件） | 幕 7 元自证的证据源 |

## 一、目的与效果

- 产出 1 支 16:9 / 1920×1080 / 30fps / 约 4 分钟的中文推广视频，用于 B 站投放，主题「只凭文档，从零重建你的项目」
- 视频全链路（分镜 / 文案 / composition 源 / 渲染 / 发布规格）**由 DocLib 自身管理**：知识层入馆、工程源靠 `covers` 锚定、进度与教训实时入账——视频本身即元自证（幕 7）
- 附带效果：把 README 现状表的 5 处数字失真（npm 版本 / 命令数 / skills 数 / 用例数 / 运行时依赖）纳入本次修正范围，馆内同步
- 附带效果：`70-deploy/deploy.md` 的运行时依赖口径失真、`40-guides/workflow.md` 悬空指针一并修正（见 §五-D 块）

## 二、问题点（研究实证）

| # | 问题 | 证据 |
| --- | --- | --- |
| P-1 | 视频推广的内容失真风险 | `README.md` 现状表：npm 包写 0.5.0（实为 **0.4.0**）、CLI 写 13（实为 **14**）、skills 写 10（实为 **11**）、用例写 283（实为 **350**）、`70-deploy/deploy.md` 写「运行时依赖仅 ignore」（实为 **4 个**） |
| P-2 | 观众 `npx` 拿到的是旧版 | npm latest = **0.4.0**（2026-10-19 发布），仓库 `package.json` = **0.8.0**；自 v0.4.0 起 14 个 commit、63 个 src 文件、35 处未提交改动从未发布 |
| P-3 | CI 与自身 engines 不自洽 | `.github/workflows/release.yml:17` 用 `node-version: 20`，而 `engines.node` 为 `>=22.5.0 <25`；`src/` 非测试代码无 Node 22+ 专有 API（`fs.glob`/`Object.groupBy`/`import.meta.dirname` 全无命中）故历史上能跑，属声明与执行环境不自洽 |
| P-4 | 无品牌资产可用 | 全仓零 logo / 零截图 / 零配色规范（`find` 仅命中 `test/` 夹具内的外物 PNG） |
| P-5 | 中文终端画面必然错位 | 本机 Menlo / SFNSMono 仅拉丁；CJK 字体 Hiragino Sans GB / STHeiti 是**比例**字体 → 无 CJK 等宽字体，终端框线必错位；fontsource 亦无 CJK 等宽包（`@fontsource/noto-sans-mono-cjk` / `sarasa-mono-sc` 均 404） |
| P-6 | 渲染硬前提缺失 | `npx hyperframes doctor` 实测：FFmpeg / FFprobe 均 `Not found`；Node v24.15.0 ✓、系统 Chrome ✓、Docker 运行中 ✓ |
| P-7 | 入馆落位与纯 Markdown 宪法冲突 | `src/core/fsutil.ts:14-52` `DEFAULT_IGNORES` 含 `doclib/`（第 18 行）与 `.doclib/`（第 17 行）→ 馆内**不在代码账**；非 md 资产入馆则 covers 锚点永不触发 = 治理盲区；`doclib/10-architecture/overview.md` 三原则之一为「纯 Markdown 产物」 |
| P-8 | 仓库存在并发写入实例 | 研究期间另一实例提交 `ee0023c`（#40 v0.8.0 落地，11:38），35 处未提交改动清零、基线 snap-079→snap-081、revision 70→72 |
| P-9 | 目录豁免不覆盖漂移面 | `doclib ack --dir <前缀>` 只作用于孤儿判定面（`src/core/check.ts:277-296`），**不豁免**漂移/无归属面（同文件 212-232）→ 视频工程若入代码账，迭代期每次改动都会触发「无归属」 |
| P-10 | 引导指针悬空 | `AGENTS.md` custom 区与 `.doclib/guide-project.md` 均引用 `40-guides/workflow.md`，该文件**不存在**（`doclib/40-guides/` 实为 `010-tool-adoption.md` / `benchmark.md` / `conventions.md` / `rebuild-plan.md` / `transcripts.md`） |

## 三、研究结果（外部 + 内部交叉验证）

### 3.1 HyperFrames 选型核实（context7 官方文档 + npm registry + GitHub + 本机 doctor 实跑）

| 项 | 事实 |
| --- | --- |
| 身份 | HeyGen 开源，Apache-2.0，**免费无渲染计费门槛**；GitHub 73.2k star / 6,256 commits；生产环境用于 HeyGen |
| npm | `hyperframes@0.8.206`（latest），`engines.node >=22`；CLI 45 命令 |
| 定位 | 「写 HTML → 渲染 MP4」；**agent-first**（CLI 默认非交互 + 7 个 skills：`/hyperframes` `/hyperframes-cli` `/hyperframes-registry`（~450 积木）`/media-use` + 按需 `/figma` `/slideshow` `/remotion-to-hyperframes`） |
| 能力面 | `init/add/capture/preview/render/lint/check/validate/snapshot/timeline/beats/tts/transcribe/compare/cloud/lambda/cloudrun/doctor` |
| 渲染 | 本地 / `--docker`（锁 Chromium+字体+FFmpeg，位级可复现）/ `cloud`（HeyGen）/ `lambda`（AWS 分布式） |
| 与 Remotion | Remotion 走 React + bundler，许可证为 source-available；HyperFrames 走纯 `index.html` 无构建步骤，Apache-2.0 |
| 声音 | `tts` 用本地 Kokoro-82M（支持 `zh` 普通话音色，无需 API key）；`transcribe` 出词级时间轴 |
| 资产约束 | 官方明示 **Asset paths are ROOT-relative**；字体须本地打包（CDN = 渲染期网络依赖） |
| 现成积木 | catalog 有 `terminal-simulator`（终端模拟组件）、`caption-*` 字幕族（含 safe-zone 惯例 1400 宽居中底 100） |
| 结论 | **选型成立且省心**：agent 写 HTML 与本仓 11 个 skill 的工作流同构；不进 DocLib 运行时依赖（不违反 ADR #13 零重依赖） |

### 3.2 落位机制核实（源码级）

| 机制 | 结论 | 依据 |
| --- | --- | --- |
| 12 卷闭集 | `LIBRARY_VOLUMES` 是硬闭集，改动影响所有用户的 init 骨架 | `src/core/place.ts:9-22` |
| 走查账联动 | 新增卷后 `.doclib/guide-project.md` 的 `volumes-fed/na` 必须补裁，否则 strict 报「未覆盖全部 12 卷」；反之写基线外卷名报「未知卷名」 | `src/core/check.ts:139-160` |
| 文体门禁 | `type: ledger` 免五段与卡片门禁；`narrative` 需「导读 + 为什么/是什么/怎么运转」且正文 ≥10 有效行且 ≥400 字符 | `src/core/docquality.ts:60-125` |
| 两级索引 | 馆内任一 .md 必须在 `doclib/INDEX.md` 链接；有 `_index.md` 的目录其文档须被该 `_index.md` 收录 | `src/commands/verify.ts:53-66`、`src/core/docquality.ts:209-238` |
| covers 匹配 | `normalizePath` 去尾斜杠 → `covers: [video]` 归一为 `video`；`docsForPath` 前缀匹配 `video/…` 命中 | `src/core/mapping.ts:8-46` |
| 孤儿面 | 只扫 `.md`（`src/core/orphan.ts:155`）→ `video/` 下的 html/css/js **安全**；`npx hyperframes init` 若生成 `README.md` 会判待归位 → 由 `production.md` 的 `covers: [video]` 前缀命中直接豁免（`check.ts:299`） | `src/core/orphan.ts:150-175`、`src/core/check.ts:297-312` |
| 目录豁免边界 | `ack --dir` 只作用孤儿面，不豁免漂移面 | `src/core/check.ts:212-232` vs `277-296` |
| 无锚点文档 | `verify` 的「无锚点文档」是**提示项**（非违规），导览/索引类属正常 | `src/commands/verify.ts:43-45,124` |
| 先例 | `98-sessions/` 不在 `LIBRARY_VOLUMES`（`place.ts` 0 命中）却是馆内合法目录；`50-testing/benchmark/` 馆内有、init 模板无 | 实测 `ls assets/templates/library/` |

### 3.3 素材盘点（真实可拍）

| 素材 | 来源 | 价值 |
| --- | --- | --- |
| 治理体检五分项 | `doclib check` / `status` 实跑（对账/迁移/归位/引导/质量 全 100） | 分数是真跑出来的 |
| **一次真实复原工程** | `test/umami-rebuild-handover/umami-rebuild/`：REBUILD-001.md 任务书、packages/、prisma 26 迁移、124 路径 / 168 操作、6.7 万行 | 杀手级素材：真从文档长出的 umami |
| 71 条 AC 双跑答卷 | `doclib/50-testing/benchmark/020-umami-answer-src.md` vs `030-umami-answer-rebuild.md` | 唯一不可反驳的硬证据（53/55 = 96.4% → 回归 100%） |
| 诚实差异账 | `doclib/50-testing/benchmark/050-umami-divergence.md`（D-01~D-14） | 差异化王牌：敢放自己的缺陷清单 |
| 43 仓治理实测 | `doclib/10-architecture/decisions.md` ADR #12（2,052 误报 → 修正后清零） | 证明不是自说自话 |
| 引导四区契约 | `assets/guides/light.md` + `.doclib/guide-memory.md` | 幕 5 素材：agent 冷启动 |

## 四、方案设计

### 4.1 落位形态（采用「② 馆内子目录 + 工程源 covers 兜底」）

```
doclib/40-guides/video/          ← 知识层（入馆，Markdown）
  _index.md                      ← 分区索引
  storyboard.md                  ← 分镜表（type: ledger）
  script.md                      ← 字幕文案全文（type: ledger）
  production.md                  ← HyperFrames 工程复现指南（type: narrative，covers: [video]）
  publishing.md                  ← B 站发布规格 + 数值核对表（type: ledger）
video/                           ← 工程源（不入馆，covers 锚定）
  hyperframes.json + index.html + compositions/ + assets/ + vendor/ + renders/（renders 进 .gitignore）
```

- `production.md` 的 `covers: [video]` → 改视频源会触发 `check` 的漏更/无归属执法（与 `assets/`、`skills/` 同构先例）
- 不动 `LIBRARY_VOLUMES` → 不改 init 骨架 → 不改 `assets.test.ts:44` 断言 → 无需 ADR
- `40-guides/video/` 不写入 `.doclib/guide-project.md` 走查账（基线外卷名会被判「未知卷名」）
- 迭代区在仓外（scratch），终态一次性落库——因 P-9 + pre-commit `--strict`，中间稿无法提交

### 4.2 叙事结构（B+ 混合，8 幕，约 4 分钟）

| 幕 | 时间 | 标题 | 画面 | 绑定素材 |
| --- | --- | --- | --- | --- |
| 0 | 0:00-0:15 | 体检报告 | 五个环形仪表 + 心电图曲线；「你的项目文档健康度 73/100」 | `check` 五分项 |
| 1 | 0:15-0:45 | 文档为什么总会烂 | 6 个失效场景快切（新人拼不全 / 半年没人敢信 / 对话蒸发 / 验收靠人肉点…） | README 六场景表 |
| 2 | 0:45-1:15 | 一座活的图书馆 | 12 卷目录树生长 + 三条铁律 + 登记簿五要素 | 真实 `doclib/` 树 |
| 3 | 1:15-2:05 | 同一个问题，两次回答 | 双栏对照：读源码 vs 读图书馆，55 条 AC 逐条点亮 → 53/55 | 双跑答卷 |
| 4 | 2:05-2:45 | 从空目录长出 124 个路由 | 目录树生长 + 路由数 0→124 / 迁移 0→26 / 行数 0→6.7 万 | 真实复原工程 |
| 5 | 2:45-3:10 | agent 冷启动的 0.4 秒 | AGENTS.md 四区依次点亮 + 11 skills + hook 门禁 | 引导四区契约 |
| 6 | 3:10-3:40 | 我们也报自己的缺陷 | 差异账 D-01~D-14 + 43 仓 2,052 误报→清零 | 差异账 + ADR #12 |
| 7 | 3:40-4:00 | 这段视频自己就是产物 | 分镜/文案/验收/教训/进度全在馆里 + `npx` 一行接入 CTA | 本仓 + npm |

单幕 ≤3 句、每句 ≤18 字；纯字幕动效，全片零配音。

### 4.3 HyperFrames 技术路线

| 决策 | 取值 | 理由 |
| --- | --- | --- |
| 工程骨架 | `npx hyperframes init <scratch> --non-interactive` | 默认 centered Inter blank + 自动装 skills |
| 动画 | GSAP，**本地 vendor 不走 CDN** | catalog 默认 jsdelivr CDN = 渲染期网络依赖 |
| 字体 | 标题/字幕 `Noto Sans SC`（`@fontsource/noto-sans-sc@5.3.1`，OFL-1.1）本地 woff2 + `@font-face` + `font-display: block`；**终端画面只呈现 ASCII**（等宽西文 `ui-monospace, "SF Mono", Menlo, monospace`），中文解释一律移出终端框进字幕层 | P-5：无 CJK 等宽字体可用 → 入框必错位；CLI 真实输出本就是命令/路径/文件名（ASCII），中文移出框反而更真实 |
| 资产路径 | root-relative `assets/fonts/noto-sans-sc/…`、`vendor/gsap.min.js` | 官方约束「Asset paths are ROOT-relative」 |
| 积木 | 只取 `terminal-simulator` + 2 个自建组件（字幕层 / 环形仪表） | ~450 积木易模板化，损品牌感 |
| 渲染 | 本地 macOS 为主（PingFang SC 在位）；`--docker` 仅作发布前位级复现验证（镜像 CJK 字体**待实测**） | docker 启动开销大且字体面未知 |
| 多画幅 | 同一时间轴导出 16:9 + 9:16 + 1:1 封面帧 | `data-width/data-height` 支持，零额外工程量 |
| 质量档 | 迭代期 `draft`，终版 `looks`（默认 CRF 16） | 官方分级建议 |

### 4.4 发布链修正（先发 0.8.0 再拍视频）

1. `release.yml` `node-version: 20` → `24`（自洽 engines `>=22.5 <25`；本机 v24.15.0 已验证；`src/` 无 Node 22+ 专有 API 故历史可跑但属不自洽）
2. README 现状表 5 处 + 「源码规模」行按实测修正；`README.en.md` 逐条对齐（28 项关键数字两版同现是既有契约）；`70-deploy/deploy.md` 运行时依赖口径同步；`10-architecture/overview.md` 门面描述同步（其 covers 锚定 README → 同轮不更新即触发「无归属」）
3. `npm version 0.8.0 --allow-same-version` → 打 tag `v0.8.0` → tag 触发 Actions → npm publish（`prepublishOnly` 已含 typecheck + test）
4. 发版完成后视频中的版本号与命令才可写实

## 五、备选方案与被否理由

| 备选 | 被否理由 |
| --- | --- |
| 新建卷 `85-media/` | 改 `LIBRARY_VOLUMES` + `DEFAULT_GENRE` + 走查账 12→13 + init 模板 + `assets.test.ts:44` 深比较断言；影响所有用户骨架 → 须先立 ADR；收益（多一卷分类）远低于成本 |
| 视频工程整体入馆（html/css/mp4 放 `doclib/`） | 违背「纯 Markdown 产物」三原则；`doclib/` 不在代码账 → covers 锚点永不触发 = 治理盲区；MP4 入 git 仓库膨胀 |
| 纯仓库顶层 + `ack --dir video` | 知识不入馆 → 视频的分镜/文案无法被复原，「凭文档重建」反噬自身；且 `ack --dir` 不豁免漂移面（P-9），无锚点价值 |
| 视频工程留在仓库内 `video/` 逐稿提交 | 漂移面逐文件判「无归属」+ pre-commit `--strict` → 中间稿无法提交；改为仓外迭代 + 终态一次性落库 |
| 加旁白（Kokoro `zh` 音色） | 中文 TTS 质量与语速需试听才有结论；纯字幕是短视频平台更常见形态，且规避音色风险 |
| 6 分钟长版 | 纯字幕 4 分钟完播率最优；6 分钟信息密度与完播率双输 |
| Docker 渲染为主路径 | 启动开销大、镜像 CJK 字体面未知；本地已可用 |
| 幕 3 改为「agent 读源码 vs 读图书馆」口号式对比（无实测） | 无实测支撑的宣传性断言 = 反幻觉红线；改用已有的 71 条 AC 双跑答卷（真实同题共答 53/55） |

## 六、用户拍板记录（保留原话要点）

### 6.1 原始指令（原话要点）

> 「我刚才查了视频生成层使用 HyperFrames 效果好又省心，你帮我确认一下。还有帮我规划一下视频介绍流程，还有介绍的流程和内容。最好做出一个 demo，我看看效果。」

- 用户**先验判断**：「HyperFrames 效果好又省心」→ 本会话任务是**确认**而非采纳；研究结论：该判断成立（§3.1，事实层面全部证实：免费、Apache-2.0、agent-first、无构建步骤）
- 用户三诉求：①确认 HyperFrames ②规划视频介绍流程 + 内容 ③出 demo 看效果

### 6.2 模式切换指令（原话）

- 「进入研究模式」
- 「进入创新模式」
- 「进入计划模式」
- （EXECUTE 尚未给出）

### 6.3 七项拍板（原话 + 理由）

| # | 议题 | 用户原话 | 理由要点 |
| --- | --- | --- | --- |
| Q-1 | 投放平台 | 「B 站（横屏 16:9，3-6 分钟）」 | 面向开发者社区；横屏利于展示终端与目录树 |
| Q-2 | 声音方案 | 「纯字幕动效（无旁白）」 | 规避 Kokoro 中文 TTS 质量风险；短视频平台主流形态 |
| Q-3 | 工程落位 | 「仓库内并正式入馆（新建卷或子目录）」 | 拒绝仓外；细化采纳「② 馆内子目录 + covers 兜底」 |
| Q-4 | 发布阻塞 | 「先发 0.8.0 再拍视频（推荐）」 | 视频要写实；npx 装到 0.4.0 则是失真宣传 |
| Q-5 | 叙事主轴 | 「B+ 混合（推荐）」 | 钩子 + 硬证据 + 信任闭环三段兼具 |
| Q-6 | 成片时长 | 「约 4 分钟（推荐）」 | 纯字幕完播率最优区间 |
| Q-7 | ffmpeg 安装 | 「执行阶段再装（推荐）」 | 系统级变更不在研究/规划期动 |

### 6.4 用户的「中间纠正」记录

| 时点 | 事件 | 影响 |
| --- | --- | --- |
| RESEARCH 期 | 用户称 HyperFrames「效果好又省心」 | 触发「先证伪后采纳」的研究动作；结论成立，无需纠正用户 |
| RESEARCH 期 | 用户要求「确认一下」 | 研究阶段改为**实证优先**（context7 官方文档 + npm registry + GitHub + 本机 `doctor` 实跑四路交叉），不引用二手转述 |
| INNOVATE 期 | 用户在四项拍板中**两次选择「推荐」**（落位与 ffmpeg 时机） | 落位由「①新建卷」修正为「②馆内子目录 + covers 兜底」——**这是方案在用户确认下的一次实质修正**，原案（新建卷）成本高且要 ADR |
| PLAN 期 | 用户追加 planstore 纪律 | 规划文档须补齐：反遗漏自检 5 项 / 踩坑一行制 / 会话导出登记 / 跨会话前情 / 验收口径变更过程 |

## 七、实施清单（57 步，编号原子操作）

**阶段 0 · 门（2 步）**

1. 核对 `git log --oneline -1` + `git status --short` + `node dist/cli.js status`；基线与 `snap-081`/`revision 72` 不符则**停止并重新校准计划**
2. 记录当前 revision 与基线号，供步骤 57 比对

**阶段 1 · A 块 发布链与数值（10 步）**

3. `.github/workflows/release.yml` 第 17 行 `node-version: 20` → `24`
4. 实测 `src/` 非测试/测试行数，得出 README「源码规模」行新值
5. `README.md`「项目现状与实证」表 6 处修正（npm 版本 / CLI 命令数 / skills 数 / 测试用例数 / 新增运行时依赖行 / 源码规模行）
6. `README.en.md` 对应表逐条对齐，复测「28 项关键数字两版同现」
7. `doclib/70-deploy/deploy.md`「发布形态」段：运行时依赖改四依赖并列 + 补 npm 现况
8. `doclib/10-architecture/overview.md` 门面描述段随步骤 5/6 同步
9. `npm run typecheck` + `npm test`（应 350/350）
10. `node dist/cli.js check --strict` → 违规 0；`doclib status` → 治理 100/100 (A)
11. **用户确认后**：`npm version 0.8.0 --allow-same-version` → `git push --tags` → 等 Actions → 确认 `npm view @panxiangyu1995/doclib version` = 0.8.0
12. 提交 A 块（提交前过 pre-commit 门禁）

**阶段 2 · B 块 视频工程（27 步，仓外迭代）**

13. `brew install ffmpeg` → `npx hyperframes doctor` 复验 FFmpeg/FFprobe 转 ✓
14. 仓外 scratch 建工程：`npx hyperframes init <scratch> --non-interactive`
15. 取 GSAP：`npm pack gsap@3.15.0` → 解包 `dist/gsap.min.js` → 置 `vendor/gsap.min.js`
16. 取字体：`npm pack @fontsource/noto-sans-sc@5.3.1` → 取 woff2 分片与 @font-face CSS → 置 `assets/fonts/noto-sans-sc/`，CSS 相对路径重写
17. 建 `assets/styles/base.css`（色板/字号阶/间距/safe-zone 变量）与 `assets/styles/terminal.css`（等宽西文 + CJK 回退）
18. `npx hyperframes add terminal-simulator` → 落 `compositions/components/terminal-simulator.html`
19. 建 `compositions/components/caption-cjk.html`（字幕层，safe-zone 1400 居中底 100）
20. 建 `compositions/components/gauge-ring.html`（环形仪表）
21. 建根 `index.html`：8 幕编排 + 240s 时间轴 + 字幕轨(1) + 叠加轨(2)
22. 建幕 0 `scene-00-checkup`（5 环仪表 0→100）
23. 建幕 1 `scene-01-rotted`（6 场景快切）
24. 建幕 2 `scene-02-library`（12 卷树生长 + 三条铁律）
25. 建幕 3 `scene-03-twoanswers`（双栏 AC 逐条点亮 → 53/55）
26. 建幕 4 `scene-04-growth`（树生长 + 计数 0→124/26/6.7 万）
27. 建幕 5 `scene-05-coldstart`（四区点亮）
28. 建幕 6 `scene-06-defects`（D-01~D-14 + 2,052→0）
29. 建幕 7 `scene-07-meta`（馆内四证 + CTA）
30. `npx hyperframes lint` → 零失败
31. `npx hyperframes check` → 零失败（修到全绿）
32. `npx hyperframes validate` → 零失败
33. draft 渲染全片 → `npx hyperframes snapshot` 关键帧目视（查豆腐块/错位/越界）
34. 逐幕修 → 复渲 draft → 复检（循环至全绿）
35. 终版渲染 `renders/doclib-promo-16x9.mp4`
36. 竖版变体 → `renders/doclib-promo-9x16.mp4`
37. 封面帧选取（1146×717）
38. `--docker` 复现验证 → 与本地版比对
39. `ffprobe` 校验：1920×1080 / 30fps / 225–255s / 无音轨

**阶段 3 · C 块 落库与入馆（9 步）**

40. 仓外工程 → 仓库 `video/`（含 `vendor/`、`assets/`、`compositions/`、`index.html`、`hyperframes.json`）；`.gitignore` 增 `video/renders/`
41. 建 `doclib/40-guides/video/_index.md`（链接同目录 4 篇）
42. 建 `doclib/40-guides/video/storyboard.md`（type: ledger，covers: `video/compositions`）
43. 建 `doclib/40-guides/video/script.md`（type: ledger）
44. 建 `doclib/40-guides/video/production.md`（type: narrative，covers: `video`，五段齐备）
45. 建 `doclib/40-guides/video/publishing.md`（type: ledger）
46. `doclib/INDEX.md` 增 6 行（_index + 4 篇 + 验收报告）
47. 建 `doclib/50-testing/acceptance-promo-video-v0.8.0.md`（type: ledger，covers: `video`）
48. `node dist/cli.js verify` → 无索引类问题；`check --strict` → 违规 0

**阶段 4 · D 块 既有失真修正（3 步）**

49. 查证「禁区」七条与「规则唯一事实源指针」条的馆内实际承载点
50. 改 `AGENTS.md` custom 区 + `.doclib/guide-project.md` 开发宪法同两条指针 → 指向真实文档；若确无单一归属则新建 `doclib/40-guides/workflow.md` 并两级索引登记
51. `doclib sync` 再生引导 → `check --strict` → 违规 0

**阶段 5 · 验收与归档（6 步）**

52. 复验 V-1..V-9 全部（typecheck / test / check / verify / status / ffprobe / lint+check+validate / 数值复跑）
53. 锚点自证：改 `video/compositions/` 任一文件 → `check` 报「无归属」→ 改 `storyboard.md` → 清零 → 还原
54. feature-map #41 → `implemented`（描述补全实际产物与验收数据）
55. progress.md 归档条目（含 `教训:` 处置位；若执行期有踩坑，同步入 `95-lessons/lessons.md` 并带 `来源:` 行）
56. `node dist/cli.js snapshot` 固化基线
57. **用户确认后**提交；提交前过 pre-commit `--strict` 门禁

## 八、验收标准

| # | 标准 | 命令 / 判据 |
| --- | --- | --- |
| V-1 | 类型与测试 | `npm run typecheck` 绿；`npm test` → 350/350 |
| V-2 | 治理 | `node dist/cli.js check --strict` → 违规 0、exit 0；`status` → 治理 100/100 (A) |
| V-3 | 索引 | `node dist/cli.js verify` → 无「未被索引收录」/「卷级索引未收录」/「链接失效」 |
| V-4 | 锚点生效 | 改 `video/compositions/` 任一文件 → `check` 报「无归属」→ 改 `storyboard.md` 后清零（证明 covers 真生效） |
| V-5 | 视频规格 | `ffprobe` 读出：1920×1080 / 30fps / 时长 225–255s / 音轨数 0 |
| V-6 | 中文字形 | 关键帧目视无豆腐块；终端画面框线不错位 |
| V-7 | HyperFrames 质检 | `lint` / `check` / `validate` 三者零失败 |
| V-8 | 可复现 | `--docker` 版与本地版同输入同帧（逐帧哈希一致） |
| V-9 | 数值真实 | `publishing.md` 数值核对表每行可现场复跑得出 |
| V-10 | 入馆闭环 | feature-map #41 → `implemented`；progress 归档条目含 `教训:` 处置位；`doclib snapshot` 固化基线 |

## 九、验收口径的变更过程

| 时点 | 口径变更 | 变更原因 |
| --- | --- | --- |
| RESEARCH 期 | 「HyperFrames 是否好用」→ 改为**四路交叉实证**（context7 官方文档 / npm registry / GitHub / 本机 `doctor`） | 用户要求「确认一下」；协作偏好为实证优先、拒绝二手转述与猜测 |
| RESEARCH 期 | 落位方案从 3 案并列 → 收敛为「② 馆内子目录 + covers 兜底」 | 发现 `doclib/` 在 `DEFAULT_IGNORES` 内（治理盲区）+「纯 Markdown 产物」原则 → 整体入馆被否 |
| RESEARCH 期 | 时长「3-6 分钟」→ 收敛为「约 4 分钟」 | 纯字幕形态下 6 分钟完播率风险高 |
| RESEARCH 期 | 「加旁白」选项 → 降级为「可选增强」 | Kokoro 中文音色质量需试听才有结论，不宜在无实证时写进基线 |
| INNOVATE 期 | 落位：用户初答「新建卷或子目录」→ 拍板细化为「② 馆内子目录」 | 新建卷要改 12 卷闭集 + 走查账 + init 骨架 + 测试断言并立 ADR，收益低于成本 |
| INNOVATE 期 | 叙事：从 3 主轴并列 → 收敛 B+ 混合 8 幕 | 用户拍板「B+ 混合」；兼顾前 3 秒钩子、中段硬证据、末段信任闭环 |
| INNOVATE 期 | 幕 3 证据从「口号式对比」改为「71 条 AC 双跑答卷」 | 反幻觉纪律：只演可复跑的实测证据 |
| PLAN 期 | 「用 CJK 等宽字体渲染终端」→ 改为「终端只呈现 ASCII，中文移出终端框」 | 实测 fontsource 无 CJK 等宽包 + 本机无 CJK 等宽字体 → 原口径不可行；改口径而非绕过（且 CLI 真实输出本就是 ASCII） |
| PLAN 期 | 「视频工程留在仓库内逐稿提交」→ 改为「仓外迭代 + 终态一次性落库」 | 发现 `ack --dir` 不豁免漂移面 + pre-commit `--strict` → 中间稿无法提交 |
| PLAN 期 | 数值口径：「现状表 5 处」→ 增为「5 处 + 源码规模行实测重算」 | 源码行数随并发工作漂移，非实测不可写 |

## 十、反遗漏自检核对表（落盘前逐项核对）

| # | 自检项 | 状态 | 落位 |
| --- | --- | --- | --- |
| 1 | 用户中途的纠正与拍板理由（保留原话要点） | ✅ | §6.1 原始指令 / §6.2 模式指令 / §6.3 七项拍板原话 / §6.4 四条「中间纠正」记录（含落位由「新建卷」修正为「馆内子目录」这一实质修正） |
| 2 | 被否方案及否决理由（每个备选为什么不行） | ✅ | §5 八条备选逐条列理由（新建卷 / 整体入馆 / ack-only / 仓内逐稿提交 / 加旁白 / 6 分钟 / docker 主路径 / 口号式对比） |
| 3 | 失败尝试与踩坑（95-lessons 上游素材） | ✅ | §11 五条一行制记录；入馆去向由 progress.md 归档条目末 `教训:` 处置位声明（check「教训账缺口」执法） |
| 4 | 验收口径的变更过程（中途改了什么标准、为什么改） | ✅ | §9 八条口径变更逐条列原口径 / 新口径 / 变更原因 |
| 5 | 跨会话前情（依赖哪些更早会话结论 + 文件指针） | ✅ | 「跨会话前情」表 11 行，每行给文件指针 |

## 十一、失败尝试与踩坑（踩坑一行制：日期 + 现象一句话，实时回填）

- 2026-10-27 · `node dist/cli.js status` 读数虚假（100/100 A、漂移 0）——`dist/` 是 #40 之前的陈旧构建，漂移面与引导面检测缺失，真实为 91/100 且 strict FAIL 5 项；跑 `npm test`（内含 rebuild）才暴露真实状态
- 2026-10-27 · `node dist/cli.js ack --help` 未返回帮助，而是把 `--help` 当路径登记进 `.doclib/state.json` 豁免账——`src/cli.ts:82,184` 仅顶层有 `case "--help"`，子命令无 `--help` 解析；研究期误触，幸被并发实例的 state.json 提交覆盖，未留残留
- 2026-10-27 · 研究期基线被并发实例中途改写（snap-079→snap-081、revision 70→72、35 处未提交改动被他人提交）——期间基于旧基线的结论一度失真（「check strict FAIL 5 项」已被他人解除），故计划必须设第 0 步并发前置门
- 2026-10-27 · zsh 无 `timeout` 命令（GNU coreutils 未装）——`timeout 300 npx ...` 报 command not found，改用工具自带 timeout 参数
- 2026-10-27 · `npx hyperframes-localize-fonts@0.8.206` 报 404——该 bin 属 `hyperframes` 包内（`bin/hyperframes-localize-fonts.mjs`），不是独立包，npx 直呼需 `-p hyperframes` 形式
- 2026-10-27 · 终端面板行距暴涨 3 倍、溢出画布并压住字幕——`white-space: pre` 挂在**容器**上，HTML 源码缩进/换行被渲染成额外行盒；`pre` 只挂行级元素
- 2026-10-27 · `tl.call()` 驱动的文本在回退 seek 时不重放（巨型序号可能与画面错位）——改时间函数驱动（proxy + onUpdate 读时间）
- 2026-10-27 · 根 composition 未注册 timeline 又缺 `data-no-timeline` → 每次渲染多等 45s 超时（54.2s → 6.3s，setup 49.5s → 2.2s）
- 2026-10-27 · 研究期只查了 AGENTS.md 与 `.doclib/guide-project.md` 的悬空指针，**漏扫** `10-architecture/data-flow.md` 第三处——悬空指针必须全库扫
- 2026-10-27 · 锚点自证首测写成空操作（storyboard.md 里并无待改那句，那句在 script.md）→ 验证「覆盖文档生效」必须先确认被测文件真的变了
- 2026-10-27 · `hyperframes render --docker` 镜像构建触发 CLI 自身 10 分钟上限（层已缓存，重跑即续建）
- 2026-10-27 · v0.8.0 首次发版 CI 349/350（本地 350/350 全绿）——`plan.test.ts` 用「刚写完就比基线晚」构造前提，实测仅差 1.96ms；CI 的 overlayfs mtime 精度为整秒 → 比较必然翻转
- 2026-10-27 · 发版提交撞上并发实例在飞状态（另一实例正写 feature-map #42 与 40-guides/benchmark.md）——部分提交必使「已提交态 / 工作区」其一 check 不干净（引导 docs-hash 与库变更强耦合），经用户拍板改为全部提交后发版

## 十二、执行偏差留痕（偏离计划之处 + 理由）

| # | 计划 | 实际 | 理由 |
| --- | --- | --- | --- |
| P-1 | 组件为 paste-in 片段文件（`compositions/components/caption-cjk.html`、`gauge-ring.html`） | 改为**共享 CSS 类 + 每幕独立 composition**，无片段文件 | 避免 8 份 CSS 重复；探针已证 root-relative `<link>` 在 standalone 与 nested 两种形态均生效；片段文件在嵌套时语义未验证 |
| P-2 | 采用 catalog 积木 `terminal-simulator` | **评估后被否**，自建终端主题 | 该积木为 760px 固定宽、自带 Inter/Menlo 配色、装饰性占位内容（index.html/style.css/timeline.js）、无内容注入口——与「终端呈现真实命令输出」的诉求不符 |
| P-3 | 「多画幅零额外工程量：同一 composition 导出 16:9 + 9:16」 | **9:16 未做** | 计划判断有误：各幕为 16:9 专用栅格布局（固定列宽/绝对定位），改竖版需重排而非改参数；不做缩放充数，单独立项 |
| P-4 | 步骤 11（发版）在步骤 12（提交）之前 | **改为先提交再发版** | tag 触发发版要求被标记的提交已在远端；原顺序会让 Actions checkout 到不存在的 commit。发版仍为不可逆闸口，需用户确认 |
| P-5 | 幕 5 终端 13 行 / 行高 1.75 | 压至 11 行 / 行高 1.55 | 原布局溢出画布并压住字幕层（check 判 `content_overlap` + `canvas_overflow`） |
| P-6 | 字体子集化 | 未做（chinese-simplified 全量 1.1MB/档，共 2.2MB） | 本机无 fonttools，子集化需额外装 Python 依赖；全量子集确定性强、无豆腐块风险，子集化列为后续优化 |

