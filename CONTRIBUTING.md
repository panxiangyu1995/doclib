# 贡献指南

> DocLib 用 DocLib 管自己——本仓库的每一条纪律都对应可执行的检查。
> 面向第一次参与的人；项目定位、用法与原理见 [README.md](README.md)。

## 1. 参与方式

| 类型 | 适合谁 | 入口 |
| --- | --- | --- |
| 报问题 / 提需求 | 遇到误报、缺陷，或想要某项能力 | GitHub Issues（走结构化表单） |
| 补文档 / 修错 | 熟悉某个模块，想把知识补进馆 | 直接提 PR，先读 §4-§7 |
| 提代码 | 要修缺陷或加功能 | **先开 issue 认领，再提 PR**，先读 §3-§6 |

**issue-first 分层**：代码 PR（修缺陷/加功能）必须关联既有 issue（PR 描述写 `Closes #编号`）——先对齐问题与方案，再动手写码；纯文档纠错、翻译、错别字类可免 issue 直提。

**处置权与黄金法则**：一条贡献对项目的价值，应当大于评审它所花的时间。未遵守本指南（尤其 §2 AI 使用政策）、无法解释自身改动、或低质冗长的 issue/PR，**可能被无警告关闭**。评审只看两件事：**问题是否可复现**、**判据是否可执行**。不承诺响应时限。

## 2. AI 使用政策

AI 辅助开发是被接受且被欢迎的——本仓库自身就由 AI agent 深度参与开发。政策针对的不是工具，而是未经消化的低质量产出。以下条款仅约束**外部贡献**；维护者豁免（其自身遵循 doclib-dev 纪律：实时入馆、REVIEW 轮、check 门禁）：

1. **强制披露**——PR 模板的 AI-Assistance 段必须如实勾选，说明工具与程度（如：Copilot 补全 / Claude Code 起草实现）。未披露且被合理怀疑的，PR 会被关闭。
2. **human-in-the-loop 全责**——你必须读过并能解释你提交的每一行改动，以及它们与系统的交互；评审会提问验证。用未经编辑的 LLM 粘贴回复维护者提问，PR 会被关闭。你就是作者，负全责。
3. **禁止无人监督的自主 agent**——不得以无人监督、自动循环运行的 agent（如 GitHub `@claude` 类）直接提交 issue/PR；每个动作背后必须有真实的人在审。
4. **AI 生成媒体不收**——仅文本与代码可接受 AI 生成内容；美术、图片、视频、音频不接受。
5. **good-first-issue 保护**——带 `good first issue` 标签的 issue 是给新人的学习机会，不得以实质性 AI 代写认领。
6. **小 diff 纪律**——修 bug，不是修文件：不要夹带顺手重构、改错字、重排版——AI 让夹带变容易，但每次夹带都在放大评审面。发现别的问题，单独开 PR。
7. **保持简短**——issue/PR 正文先用人话说清问题与改动；长日志、推理细节放 `<details>` 折叠，不要贴 AI 生成的冗长墙。
8. **合并不是终点**——改动合入后若引发回归或追问，期望你到场跟进；为刷贡献记录而提的 PR 不是我们想要的。
9. **披露位置**——披露写在 PR 描述/模板里；**不要**给 AI 工具加 `Co-Authored-By:` 提交签名。谁开 PR，谁对改动负全责，无论第一稿是谁写的。

## 3. 环境准备

需要 Node `>=22.5 <25`（`graph` 子命令要求 `>=22.5`，核心流程不依赖它）。

```bash
npm install
npm run build     # tsc vendor 岛 + tsc 主工程 + copy-assets
npm link          # 全局可用 doclib 命令
```

校验环境：

```bash
npm run typecheck   # 双 tsconfig（vendor 岛 + 主工程）类型检查
npm test            # 构建 + 全量测试（现状数字见 README「项目现状与实证」数字表）
node dist/cli.js --help
```

> 改过 `assets/` 下的模板或引导源后，必须**先 `npm run build` 再 `doclib sync`**——sync 消费的是 `dist/assets/` 里的构建产物，不 build 就没有变化。

## 4. 仓库地图

| 路径 | 职责 |
| --- | --- |
| `src/cli.ts` | 入口：参数解析、命令分发、HELP 文本 |
| `src/commands/` | 一命令一文件，统一返回 `{ text, json }` |
| `src/core/` | 纯逻辑（优先无 IO 副作用），可单测 |
| `src/core/codegraph/` | vendored 引擎的 adapter 层，扩展优先写这里 |
| `assets/templates/library/` | 12 卷图书馆骨架模板（24 个文件） |
| `assets/guides/` | 引导文件模板（`light` / `full` 两档） |
| `skills/` | 10 个 skill 源，`init` 时分发到各 agent 目录 |
| `vendor/codegraph/` | vendored 上游 fork，见 §8 |
| `.github/workflows/` | ci.yml 持续门禁（PR+main）与 release.yml 发版链 |
| `doclib/` | 本仓库自己的文档图书馆（12 卷叙述层 + 登记簿族） |
| `.plan/` | 规划载体：研究与规划材料，过程资料，不入馆 |
| `.doclib/` | CLI 私有簿记：快照链（`state.json` 入库）与任务书（`tasks/` 不入库） |

## 5. 代码约定

- ESM；相对导入带 `.js` 后缀（`import { x } from "./core/state.js"`）
- `strict` + `noUncheckedIndexedAccess`：索引访问可能为 `undefined`，必须显式处理
- **源码不写注释**——理由沉淀进 `doclib/95-lessons/`，代码只留行为
- 错误一律抛 `DoclibError`（`src/core/state.ts`），不要裸 `throw`
- 一命令一文件；能放进 `core/` 的纯逻辑不放进 `commands/`
- 术语以 [PRD §4 术语表](doclib/10-architecture/prd.md) 为准

## 6. 测试要求

- 测试文件与被测模块同目录，命名 `*.test.ts`（如 `src/core/check.test.ts`）
- **新增测试文件必须手动加进 `package.json` 的 test 脚本**——那里是显式文件列表，Node 24 的 `node --test <目录>` 会把目录当模块解析失败（ADR #5）
- 新增命令须同步补冒烟路径：临时目录跑真实二进制，断言退出码与 `错误: ` 前缀
- 不可逆动作（如 `place archive`、`ack --standing`）必须三段验收：干跑零副作用 → `--apply` 后状态正确 → 还原路径可用
- 现状数字（测试文件数/用例数）以 [README「项目现状与实证」](README.md#项目现状与实证) 数字表为准，`npm test` 需全绿

## 7. 文档同步纪律（本仓库用 DocLib 管自己）

改动触及任一卷知识时，**同会话实时入馆**，不等事后补账：

| 改动类型 | 同步到 |
| --- | --- |
| 修 bug / 踩坑 / 得出解决办法 | `doclib/95-lessons/` |
| 新功能 / 行为变更 | `doclib/30-features/` + `doclib/00-overview/feature-map.md` 状态推进 |
| 模块增删 / 职责边界变化 | `doclib/20-modules/` |
| 架构 / 数据模型 / 数据流变化 | `doclib/10-architecture/` |
| 依赖增删换 | `doclib/10-architecture/dependencies.md` |
| 数据库迁移 / Schema 变更 | `doclib/10-architecture/migrations.md`（先取号、后登记） |
| 界面相关 | `doclib/80-design/`（不适用须显式声明） |
| 接口 / 协议参考 | `doclib/90-reference/` |

另有两条约定：

- 规划材料写进 `.plan/<日期>/`——双锚点机制：规划完成登记 `planned`，该开发完成后归档成果并推进 `implemented`。
- 入馆写前后用 `doclib check` 输出的 **revision** 比对：值变了说明有人同时在改馆，先对账再写。

## 8. vendored 改动纪律

`vendor/codegraph/` 是以 `git subtree` 引入的上游 fork（v1.6.2，MIT）。

- 就地改动**必须**登记 [FORK-NOTES.md](FORK-NOTES.md)（文件 / 原因 / 日期），否则未来 `git subtree pull` 无法审计
- 优先在 adapter 层 `src/core/codegraph/` 包裹扩展，尽量不动 vendored 源码
- 同步上游：`git subtree pull --prefix vendor/codegraph --squash <repo> <ref>`，合并前逐条对照 FORK-NOTES 评估冲突

## 9. 发版与评审

- 流程：提 PR → CI 绿（typecheck / test / `doclib check --strict`）→ 评审 → 维护者打 `v*` tag → GitHub Actions 执行 `npm ci` → `npm test` → `npm publish --provenance --access public`（需 `NPM_TOKEN`，仅维护者持有）
- main 分支受 Ruleset 防护：PR 须过 `verify` 检查方可合并；维护者豁免（bypass）
- 回滚 = dist-tag（forward-only，不重发同一版本）
- **发版前核对 [README「项目现状与实证」](README.md#项目现状与实证) 的数字表**（版本、命令数、用例数、基准分等）
- 提交前建议跑一次 `doclib check --strict`：它会把漏更、无归属、迁移违规、引导过期、孤儿文档直接报出来

## 10. 提交前自查清单

- [ ] PR 标题符合 `类型: 描述` 格式（类型见 PR 模板闭集）
- [ ] PR 描述 AI-Assistance 段已如实勾选
- [ ] `npm run typecheck` 绿
- [ ] `npm test` 全绿（新增测试文件已加进 `package.json` 的显式列表）
- [ ] `doclib check --strict` 无违规，治理分为 A
- [ ] 本次改动触及的知识已实时入馆，`feature-map` 状态已推进
- [ ] `doclib/00-overview/progress.md` 已补记本次开发事件
- [ ] 改过 `vendor/codegraph/` 的部分已登记 `FORK-NOTES.md`
- [ ] 改过 `assets/` 的已 `npm run build`，且 `doclib sync` 已再生引导文件
- [ ] 改过 CLI 行为的，同步改了对应 skill——skill 与 CLI 行为必须始终一致
