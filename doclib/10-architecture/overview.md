---
title: 架构总览
covers:
  - src/
  - assets/
  - AGENTS.md
  - CLAUDE.md
  - README.md
  - README.en.md
  - CONTRIBUTING.md
status: stable
---

# 架构总览

> 权威架构文档：[design.md](design.md)（v2）与 [prd.md](prd.md)（v0.43，需求事实源）。本卷为图书馆内索引视图——一段话读懂形态：CLI 十五命令管状态与执法（v0.10.0 起 +branch），core 纯逻辑零副作用，assets 模板与引导源由构建拷贝分发，skills 承载 agent 方法论。

## 为什么

技术选型围绕"纯 Markdown + 确定性执法 + 零重依赖"展开——完整依赖台账见 [dependencies.md](dependencies.md)，关键选型及理由：

| 选型 | 理由 |
| --- | --- |
| ESM + NodeNext + strict | Node 原生生态、严格空安全 |
| 运行时仅依赖 ignore | gitignore 语义正确性 |
| 模板 assets 化（ADR-1） | md 书写自然、可被 skills 引用 |
| 引导戳覆盖策略（ADR-2） | 用户内容零丢失 |

## 是什么

四层调用结构——每层职责单一、可独立测试：

```
cli.ts（参数解析/分发/HELP）
  → commands/（每命令一文件，返回 {text, json}）
    → core/（纯逻辑：fsutil/frontmatter/state/detect/mapping/check/ledger/guides/assets/agents/prompts/version）
    → assets/（templates/library 33 文件 + guides 两档；build 时拷入 dist/assets）
```

## 怎么运转

系统以"引导约束 agent 实时入馆、CLI 兜底执法"双轮驱动：

- **引导文件区域契约**：AGENTS.md/CLAUDE.md 四区（v0.8.0 三区→四区）——managed 规则区（由 `assets/guides/light.md` 模板经 `doclib sync` 再生，改规则须改模板源；full 档已退役 v0.6.0；v0.9.0 起含「测试链」段——`%TEST_CHAIN%` 占位从 `50-testing/testing.md` frontmatter 确定性渲染，有链 fast/full 列表+事实源指针句、无链显式 N-A 行，与 hook 烘焙同源共用 loadTestChain，F19 反哺）+ project 反哺区（图书馆蒸馏注入，真相单源 `.doclib/guide-project.md`，禁直改，check 双闸执法；v0.6.3 起「硬规则」升格**开发宪法六篇**——每条附馆内路径指针、不适用显式 N-A 行、规则唯一事实源指针句，簿记 frontmatter 携 **12 卷走查账** `volumes-fed`/`volumes-na` 经 check `guide-feed-walk` strict 强校验）+ memory 记忆快照区（v0.8.0 F18：近期工作记忆+协作者画像双层快照，真相单源 `.doclib/guide-memory.md`，双 as-of 新鲜度 soft 提醒、指针存在性 `memory-pointer` soft 执法；**生产者是 agent 会话收尾**——收尾动作按 planstore 纪律刷新快照并 `doclib sync` 注入，`work-as-of` 落后 progress 最新条目日期时 status 提示「工作记忆滞后」；快照的「活跃注意」承载**易变事实**（如 npm 已发布版本、并发实例与门禁放行先例、待归档项），这类事实一变即导致引导文件变更 → 按 covers 契约须同轮同步本卷（v0.9.0 快照态：#43 长程闭环已归档、软著 WIP 并发在飞经「最小登记放行」处置））与 custom 定制区（项目 agent/用户维护，sync 保留；v0.6.3 同轮去重去易腐枚举——单点强调）
- **实时同步映射表**（引导规则区核心）：含登记簿实时入账（实体五要素）、内容过时三态更新（默认不物理删除）、**新文档落位归位决策树 + 两级索引同步**（归位宪法 §7.5/PRD）、**载体规划文档新增双拦截**（feature-map 登记 planned + progress.md 补记——check「载体未登记」「进度账缺口」strict 执法 v0.6.1）、**教训处置位与来源行**（修 bug 行：95-lessons 入档 + progress 条目末 `教训:` 处置位——check「教训账缺口」执法 v0.6.2；v0.6.4 起踩坑一行制 + 收尾核对 + lessons 来源行存在性执法「教训来源缺失」——教训实时性三层）、先馆后码查询约定——模板演进经 `doclib sync` 再生
- **强验证链**：`check`（双账本对账：6 类违规 + 馆外文档四态判定（工具链豁免可见）+ 文档质量检测（链接/引用存在性 + 依赖版本对账）+ 治理健康分）← `ack`（once/standing + `--dir` 目录豁免）← `place`（孤儿归位：collect/archive/restore，干跑默认 + 归档账可逆）← `hook`（pre-commit --strict 门禁 / CI 模板；fail-closed 自检 + 相对路径策略 + worktree 支持 + status 门禁四态；init 自动装 + sync 幂等补装）；入馆写协调 soft 约定（写前 check 对账）
- **测试面跨环境纪律**（v0.8.0 发版实战）：node:test 零依赖 + 显式 test script 清单的既有纪律之外，另有一条**时间断言纪律**——「刚写完就比基线晚」这类断言是亚毫秒级竞态（本地实测基线与文件 mtime 仅差 1.96ms，文件系统精度本地 ns、CI overlayfs 整秒），靠 2ms 运气的本地绿在 CI 必红（v0.8.0 首次发版 CI 即 349/350）；**时间比较类断言必须显式设定时间戳**（测试内 `fs.utimes` 显式后移或注入固定时钟），且测试数量门禁只认显式清单——两者共同构成「本地绿 ≠ CI 绿」的防线
- **扫描器分阶段（F15）**：阶段 0 纯 agent 扫描 → 阶段 1 ast-grep 可选增强（PATH 探测，不进 npm 依赖）→ **阶段 2 已落地（v0.30）**：codegraph 克隆集成（subtree vendor/codegraph + CJS 岛 + `doclib graph` 命令族 + 草稿候选管道；`.codegraph/` 为可再生缓存，图书馆仍是唯一事实源；telemetry 物理隔离；Node∈[22.5,25) 优雅降级）；三铁律：馆为事实源工具出候选 / 确定性语义性分层 / 可选增强优雅降级
- 门面文档 README.md 为项目入口叙事（v2 重写 2026-10-27：定位与「不是什么」→ 初衷 → 一分钟运转叙事 → 6 类治理失效场景表 + 亮点对比 → 两步上手 → 工作原理（一张图 + 三条铁律 + 双层结构含叙述层文体标准：教科书五段 / 登记簿条目五要素 + 治理三件套）→ 开发模式与兼容（四开工模式含 REBUILD 长程链路 + spec 工具收编）→ 12 卷结构 → 15 命令表（hook 含 test-chain 烘焙；v0.10.0 +branch 分支账）+ 11 skills 表（doclib-dev 双情形 A/B）→ 现状实证数字表（含运行时依赖 4 项 + npm 版本 0.10.0/39 测试文件 394 用例，按发版逐项核对；F19 长程开发闭环能力入场景表）→ 仓库地图 → 常见疑问 → 贡献入口），与 PRD/引导同步维护——README 的数字型事实集中成表并标注来源路径（防漂移，单点出处），命令语义以 `src/cli.ts` HELP 为唯一事实源；贡献细则独立成文 `CONTRIBUTING.md`（同为根级门面文件，Q20 豁免）；英文版 `README.en.md` 与中文版逐条对齐（结构/事实/数字一致），其门面豁免由**模式识别**原生生效（`core/orphan.ts` `isRootFacadeFile`：基名 + locale 标签形状，Q42/ADR #14），无需 `ack` 登记
