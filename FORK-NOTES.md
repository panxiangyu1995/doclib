# FORK-NOTES — vendor/codegraph 二次开发差异账本

> 本文件是 vendored codegraph fork 的**唯一差异登记处**。任何对 `vendor/codegraph/` 内源码的就地修改必须在此登记（文件/原因/日期），否则未来 `git subtree pull` 合并将无法审计。
> 纪律：优先在 `src/core/codegraph/`（adapter 层）包裹扩展，**能不动 vendored 源码就不动**；就地修改仅限结构性必要项。

## 基线

- 上游仓库：https://github.com/colbymchenry/codegraph
- 基线版本：tag `v1.6.2`
- 基线 commit：`6560052a6f856855d3f71eee838fd66ccfa4285d`
- 引入方式：`git subtree add --prefix vendor/codegraph --squash https://github.com/colbymchenry/codegraph.git v1.6.2`（引入于 2026-10-22）
- 上游同步通道：`git subtree pull --prefix vendor/codegraph --squash https://github.com/colbymchenry/codegraph.git <ref>`——合并前先对照本账本逐条评估冲突

## 编辑面总策略

- **编译面裁剪**（非源码改动）：`tsconfig.vendor.json` 仅编译核心子集；`src/{telemetry,mcp,installer,bin,upgrade,ui-server,ui}/` 与 `site/`、`telemetry-*` 不进构建——telemetry 因此物理隔离，不触网
- **adapter 优先**：与 vendored 引擎的全部交互经 `src/core/codegraph/engine.ts` 单点桥（createRequire → CJS 岛）

## 差异登记

| # | 文件 | 改动 | 原因 | 日期 |
| --- | --- | --- | --- | --- |
| F-1 | `src/index.ts` | 移除 `export { MCPServer } from './mcp'`（1 行，L99） | 斩断 mcp 服务器面导出；telemetry/mcp 主模块不进编译子集。注意：`./mcp/version` 与 `./mcp/dynamic-boundaries` 为无 telemetry 依赖的叶子模块，已纳入编译面（tsconfig.vendor.json include） | 2026-10-22 |
| F-2 | `src/resolution/ambient-modules.ts` | **无需编辑**——`import.meta` 用点在 main 分支后增代码中，v1.6.2 全树无 `import.meta` | 升级上游到含该文件的版本时必须重查此项 | 2026-10-22 |
| F-3 | `src/extraction/wasm/` | **无需补拷**——Q28 子集所需 13 文法（typescript/tsx/javascript/python/go/rust/java/kotlin/c_sharp/ruby/php/c/cpp）全部 in-tree 已备 | 保留记录：若未来引入 in-tree 缺失文法，从 `tree-sitter-wasms@0.1.11` 补拷 | 2026-10-22 |

## 未来候选（未实施）

- MCP 面重新暴露（`src/mcp/` 源码保留未编译）
- Rust 内核预编译平台包（视 Q40 三指标实测决定）
