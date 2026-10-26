# 贡献指南

> DocLib 用 DocLib 管自己——本仓库的每一条纪律都对应可执行的检查。
> 面向第一次参与的人；项目定位、用法与原理见 [README.md](README.md)。

## 1. 参与方式

| 类型 | 适合谁 | 入口 |
| --- | --- | --- |
| 报问题 / 提需求 | 遇到误报、缺陷，或想要某项能力 | GitHub Issues |
| 补文档 / 修错 | 熟悉某个模块，想把知识补进馆 | 直接提 PR，先读 §3-§6 |
| 提代码 | 要修缺陷或加功能 | 直接提 PR，先读 §2-§5 |

评审只看两件事：**问题是否可复现**、**判据是否可执行**。不承诺响应时限。

## 2. 环境准备

需要 Node `>=22.5 <25`（`graph` 子命令要求 `>=22.5`，核心流程不依赖它）。

```bash
npm install
npm run build     # tsc vendor 岛 + tsc 主工程 + copy-assets
npm link          # 全局可用 doclib 命令
```

校验环境：

```bash
npm run typecheck   # 双 tsconfig（vendor 岛 + 主工程）类型检查
npm test            # 构建 + 32 个测试文件 / 252 用例
node dist/cli.js --help
```

> 改过 `assets/` 下的模板或引导源后，必须**先 `npm run build` 再 `doclib sync`**——sync 消费的是 `dist/assets/` 里的构建产物，不 build 就没有变化。

## 3. 仓库地图

| 路径 | 职责 |
| --- | --- |
| `src/cli.ts` | 入口：参数解析、命令分发、HELP 文本 |
| `src/commands/` | 一命令一文件，统一返回 `{ text, json }` |
| `src/core/` | 纯逻辑（优先无 IO 副作用），可单测 |
| `src/core/codegraph/` | vendored 引擎的 adapter 层，扩展优先写这里 |
| `assets/templates/library/` | 12 卷图书馆骨架模板（24 个文件） |
| `assets/guides/` | 引导文件模板（`light` / `full` 两档） |
| `skills/` | 10 个 skill 源，`init` 时分发到各 agent 目录 |
| `vendor/codegraph/` | vendored 上游 fork，见 §7 |
| `doclib/` | 本仓库自己的文档图书馆（12 卷叙述层 + 登记簿族） |
| `.plan/` | 规划载体：研究与规划材料，过程资料，不入馆 |
| `.doclib/` | CLI 私有簿记：快照链（`state.json` 入库）与任务书（`tasks/` 不入库） |

## 4. 代码约定

- ESM；相对导入带 `.js` 后缀（`import { x } from "./core/state.js"`）
- `strict` + `noUncheckedIndexedAccess`：索引访问可能为 `undefined`，必须显式处理
- **源码不写注释**——理由沉淀进 `doclib/95-lessons/`，代码只留行为
- 错误一律抛 `DoclibError`（`src/core/state.ts`），不要裸 `throw`
- 一命令一文件；能放进 `core/` 的纯逻辑不放进 `commands/`
- 术语以 [PRD §4 术语表](doclib/10-architecture/prd.md) 为准

## 5. 测试要求

- 测试文件与被测模块同目录，命名 `*.test.ts`（如 `src/core/check.test.ts`）
- **新增测试文件必须手动加进 `package.json` 的 test 脚本**——那里是显式文件列表，Node 24 的 `node --test <目录>` 会把目录当模块解析失败（ADR #5）
- 新增命令须同步补冒烟路径：临时目录跑真实二进制，断言退出码与 `错误: ` 前缀
- 不可逆动作（如 `place archive`、`ack --standing`）必须三段验收：干跑零副作用 → `--apply` 后状态正确 → 还原路径可用
- 现状 32 个测试文件 / 252 用例，`npm test` 需全绿

## 6. 文档同步纪律（本仓库用 DocLib 管自己）

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

## 7. vendored 改动纪律

`vendor/codegraph/` 是以 `git subtree` 引入的上游 fork（v1.6.2，MIT）。

- 就地改动**必须**登记 [FORK-NOTES.md](FORK-NOTES.md)（文件 / 原因 / 日期），否则未来 `git subtree pull` 无法审计
- 优先在 adapter 层 `src/core/codegraph/` 包裹扩展，尽量不动 vendored 源码
- 同步上游：`git subtree pull --prefix vendor/codegraph --squash <repo> <ref>`，合并前逐条对照 FORK-NOTES 评估冲突

## 8. 发版与评审

- 流程：提 PR → 评审 → 维护者打 `v*` tag → GitHub Actions 执行 `npm ci` → `npm test` → `npm publish --provenance --access public`（需 `NPM_TOKEN`，仅维护者持有）
- 回滚 = dist-tag（forward-only，不重发同一版本）
- **发版前核对 [README「项目现状与实证」](README.md#项目现状与实证) 的数字表**（版本、命令数、用例数、基准分等）
- 提交前建议跑一次 `doclib check --strict`：它会把漏更、无归属、迁移违规、引导过期、孤儿文档直接报出来

## 9. 提交前自查清单

- [ ] `npm run typecheck` 绿
- [ ] `npm test` 全绿（新增测试文件已加进 `package.json` 的显式列表）
- [ ] `doclib check --strict` 无违规，治理分为 A
- [ ] 本次改动触及的知识已实时入馆，`feature-map` 状态已推进
- [ ] `doclib/00-overview/progress.md` 已补记本次开发事件
- [ ] 改过 `vendor/codegraph/` 的部分已登记 `FORK-NOTES.md`
- [ ] 改过 `assets/` 的已 `npm run build`，且 `doclib sync` 已再生引导文件
- [ ] 改过 CLI 行为的，同步改了对应 skill——skill 与 CLI 行为必须始终一致
