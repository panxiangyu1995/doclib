---
snapshot: 58
docs-hash: 3f6fcdd8bf5fd59654969ff75bc0ef10d0190229b441562bbd9b4a3d74e25483
---

## 项目定位

- DocLib：把任意代码项目蒸馏成「可复原的文档图书馆」——任何 agent 或人只凭 `doclib/` 即可从零重建该项目（≥90% 功能复原）（`doclib/00-overview/project.md`）
- 本仓库 dogfooding：DocLib 以自身图书馆管理自身开发（`doclib/README.md`）

## 架构速览

- CLI 入口 `src/cli.ts`，十三命令于 `src/commands/`（init/plan/diff/snapshot/status/verify/sync/check/ack/place/hook/reconcile/graph）；纯逻辑于 `src/core/`（fsutil/frontmatter/state/mapping/check/orphan/place/ledger/docquality/surface/guides/assets/agents/prompts/version/codegraph 等）（`doclib/20-modules/_index.md`）
- 知识图谱引擎 vendored 于 `vendor/codegraph/`（git subtree；就地改动必须登记 FORK-NOTES.md，优先在 adapter 层 `src/core/codegraph/` 扩展）（`doclib/30-features/graph.md`）
- 需求唯一事实源 `doclib/10-architecture/prd.md`｜设计 `doclib/10-architecture/design.md`｜ADR 账本 `doclib/10-architecture/decisions.md`

## 硬规则

- ESM：导入带 `.js` 后缀；strict + noUncheckedIndexedAccess；源码不写注释；错误一律抛 DoclibError（`doclib/40-guides/conventions.md`）
- 文档写行为/契约/设计意图/验收标准；除 ≤10 行示意片段外禁止搬运源码（非克隆铁律）（`doclib/40-guides/conventions.md`）
- 引导三区：managed 区 sync 再生｜project 反哺区禁直改（改 `.doclib/guide-project.md` 后 sync）｜custom 区手写（`doclib/30-features/guides.md`）
- 馆为事实源：查实体先查登记簿，无账不答；入馆写前先 `doclib check` 对账（`doclib/40-guides/workflow.md`）

## 命令速查

- `npm run build`（tsc vendor 岛 + 主工程 + copy-assets）｜`npm run typecheck`｜`npm test`（`doclib/60-config/settings.md`）
- CLI 试运行：`node dist/cli.js <命令>`（`doclib/60-config/settings.md`）
