---
work-as-of: 2026-10-27
user-as-of: 2026-10-27
window: 30
---

## 近期工作记忆（窗口 30 天）

- 当前焦点：#42 复原基准第三梯队扩容（复杂样本 + UI/UX 专项）规划完成待执行——载体 .plan/2026-10-27/benchmark-tier2.md（9 候选本机实测 + 切片边界 + UI/UX 根因实证），EXECUTE 待用户授权
- 近期完成：
  - 10-27 #42 规划完成：第三梯队 9 候选（rqlite/syncthing/headscale/yt-dlp/docmost/plausible + meilisearch/zellij + excalidraw/documenso/formbricks）本机实测并分层标注
  - 10-27 #41 推广视频落地归档：8.5MB 成片 7200 帧位级一致 + 质检三绿 + 知识层 5 篇入馆（另一实例执行）
  - 10-27 #41 规划完成：HyperFrames 选型四路实证成立；落位②定案；发布链修正清单就绪（npm 0.4.0→0.8.0）
  - 10-27 #40 记忆快照与协作者画像反哺 v0.8.0 落地（F18，commit ee0023c，基线 snap-081 / revision 72）
  - 10-27 #39 规划直通车 v0.7.0：doclib implement 拆单 + 门禁三件套 + bootstrap 五阶段（.plan/2026-10-27/planning-express.md）
  - 10-26 #32/#37 引导反哺三区契约与开发宪法六篇 + 12 卷走查账 v0.6.0-0.6.3（.plan/2026-10-26/guide-feed.md + .plan/2026-10-26/guide-constitution.md）
  - 10-26 #35/#36/#38 归档闭环三不变量 + 教训账缺口 + 教训实时性（一行制/来源行执法）v0.6.1-0.6.4
  - 10-26 #33 会话档案区 98-sessions 立项与 M1 落地（.plan/2026-10-26/transcript-archive.md）
  - 10-23 #28 文体学全链路与 #29 旗标面对账落地
  - 10-22 #26/#27 README 门面重写（中英双语）+ 门面多语言变体模式豁免
  - 10-23 #23 基准扩容：四基准馆建成（aspnetcore/fd/csvkit/memos 均 100 A，doclib/50-testing/benchmark/）
- 活跃注意：
  - **npm 0.8.0 已发布**（2026-10-27，latest 已指向，SLSA provenance 齐备）——release.yml node 已改 24 自洽 engines；推广视频 CTA 的 npx 安装版本与片中声明一致
  - **本仓存在并发写入实例**（实测：另一实例提交 ee0023c 改写基线；本会话又见其占 3000 端口与 ffmpeg 抢带宽）——执行前须重核基线/工作区/端口
  - #42 第三梯队待授权执行；plausible/meilisearch/zellij 三仓**标「未实测」**（Elixir/Rust 钉版工具链下载受阻），宁可缺证不虚报
  - #34 transcript 批量回捞 planned——素材升级依赖它（OpenCode DB 285 会话/2.5 万消息待接入）
  - #23 复原侧闭环待排程（四馆建馆侧已建成，隔离复原未启动）；#19 ast-grep 阶段 1 planned
  - 既有失真已处置：`40-guides/workflow.md` 悬空指针（AGENTS.md / .doclib/guide-project.md / 10-architecture/data-flow.md 三处）已改指真实承载点（`10-architecture/overview.md`·`30-features/guides.md`）
  - 产品级建议留档：SOURCE_PATH_TOKEN_RE 截断字符集已含反引号/星号（#40 根治），后续关注 lesson-source 与 memory-pointer 共享词面的同源缺陷
  - 反哺区当前状态：走查 12/12（.doclib/guide-project.md）——基线版本号等自引用易腐数字不入快照

## 协作者画像

- 决策风格：偏好「一步到位」全链路（#28 三拍板、#38「α+β+γ+δ 一步到位」原话）；习惯提问工具成批拍板（单轮 8-14 项）；偏离推荐必须给理由（Q44 矛盾澄清）；产品级缺陷要求根治而非兜底（Q42 模式识别取代闭集）
- 决策风格（新观察）：**先验判断会主动要求「确认」而非直接采纳**（原话「HyperFrames 效果好又省心，你帮我确认一下」）——研究阶段须实证优先、给结论而非附和；选项批量给出且**连续两次选推荐项**（落位/ffmpeg 时机）→ 推荐项的论证质量直接决定决策效率
- 沟通偏好：中文交流；以 RIPER-5 模式协议管控会话（研究→创新→计划→执行→审查，模式切换须显式指令）；研究阶段要求「确切的肯定的研究结果，不包含任何的猜测」——实证优先（context7/gh/实测交叉验证）；方案呈现给推荐+理由由其拍板
- 工作流习惯：新功能必走 .plan 载体双锚点（规划文档先行，按文档实施）；REVIEW 轮独立进行（「全方位漏洞审查」「严格代码审查查找漏洞」）；常要求真实仓库扩展验收（「在 test 目录下的克隆项目中测试」）；对「遗漏入馆」高度敏感（曾实证手动补录 → 拍板 hook 执法路线 #35）；会直接下发 planstore 纪律指令要求规划文档补齐反遗漏自检五项
- 证据偏好（新观察）：**要求「实测」但排斥实测膨胀**——原话「你推荐的都做实测」「有必要搞半天么」「为什么不用 context7 mcp 或者 gh cli」→ 仓库事实走 gh API、SDK 文档走 context7，本机只做编译/测试/运行与 UI 交互探针；报告须分层标注「已实测/未实测」，缺证即标缺证
- UI/UX 痛点（新观察）：原话「我在使用 agent 开发中实际感受就是 ui/ux 最难复现」→ 关心可断言的交互契约（元素 × 状态 × 手势 × 反馈），而不只是界面描述
