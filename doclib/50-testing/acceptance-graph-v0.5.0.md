---
title: doclib graph 真实仓库验收报告（F15 阶段 2）
covers:
  - src/commands/graph.ts
  - src/core/codegraph/engine.ts
  - src/core/codegraph/draft.ts
  - vendor/codegraph/
  - test/
status: living
type: ledger
---

# doclib graph · 真实仓库验收报告（F15 阶段 2 / #25）

> 验收日期 2026-10-22。按用户指令在 `test/` 下真实仓库实测（非 fixture），覆盖四大基准语言样本 + 一个大样本压力仓；同步验证 agent 消费面（skills 分发/BUILD 任务书候选段/草稿裁决格式）。验收标准 AC1–AC10 见 [30-features/graph.md](../30-features/graph.md)（自动化部分 240/240 已绿，本档案记录真实仓实测维度）。

## 一、五仓实测矩阵（Q40 三指标实测采样）

| 仓库 | 语言/框架 | 源文件 | 符号 | 边 | 路由 | 建图耗时 | 草稿产出 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| fd | rust（cargo 识别） | 29 | 665 | 1,860 | 0 | **0.7s** | 依赖 56 对 / unused 100 |
| csvkit | python | 54 | 816 | 1,685 | 0 | **0.6s** | 依赖 66 对 / unused 100 |
| aspnetcore-realworld | csharp（**aspnet 识别**） | 109 | 1,280 | 1,923 | **19** | **0.7s** | routes 19 / 依赖 392 对 |
| memos | go+tsx+ts（**react/react-router/go**） | 1,167 | 22,637 | 66,909 | **89** | **2.7s** | routes 89 / 模块 38 链接 / 依赖 5,226 对 |
| umami（压力样本） | tsx+ts（**react/nextjs**） | 1,398 | 13,196 | 34,160 | **261** | 秒级 | routes 261 / 依赖 5,564 对 |

- 四语言文法（rust/python/csharp/go/ts/tsx）全部正常解析；路由感知覆盖 ASP.NET 特性与 Go echo/Next.js App Router
- CLI 工具仓（fd/csvkit）路由 0 条为**正确结果**（无 HTTP 面）——非漏报
- Q40 建馆耗时量级：千文件仓秒级（memos 2.7s），远优于阈值预期

## 二、路由绑定质量抽查（80-design routes 册候选）

- aspnetcore `PUT /articles/{slug}` → covers 双端：注册点 `ArticlesController.cs:50 → handler Edit.cs:17`（**跨文件绑定**）
- umami `POST /compat/api/reports/heatmap` → `src/app/(compat)/.../route.ts:7`（**App Router 分组 `(compat)` 正确归一**）——该 compat 路由族正是 umami 基准轮实质差距对比中漏登的端点族（benchmark 090 差距清单），图谱的**缺口发现能力获实证**
- memos `ANY /file/{uid}/{filename}` → 指向 httphandler_test.go:132（测试文件中的路由注册——合法抽取，交由 agent 裁决，印证"仅候选"纪律）

## 三、符号导航质量抽查（agent 消费面）

- fd `explore print_entry` → 返回 Rust 签名（泛型 W/Config）+ 跨文件 Related Symbols（output/walk/hyperlink/exit_codes）
- csvkit `explore csv2json` → CSVJSON 类 + cli/utilities/tests 三向关联
- aspnetcore `explore ArticlesController` → 控制器 + Get/Delete/Create/GetFeed 动作 + 域模型 + 集成测试关联
- memos `explore MemoService` → TS 服务对象 + proto type_alias 双入口
- 全部为 markdown 直出，符合 skill 指引的 agent 直接消费格式

## 四、agent 工作流验证

1. **skills 分发**：5 仓 `doclib sync` 全部成功——doclib-build（图谱加速+drafts 裁决）/doclib-dev（查询纪律）/doclib-rebuild（升华挖掘）/doclib-accept（证据定位）四份图指引就位
2. **BUILD 任务书候选段**：aspnetcore-realworld `doclib plan` 再生 BUILD-001，含"知识图谱候选"节（drafts 指引 + explore 用法 + 禁止直接入馆铁律）；memos 已建馆无漂移 → plan 正确拒绝生成（流程语义正确）
3. **草稿裁决格式**：四册均含 `provenance: codegraph-draft` 警示头 + `TODO(agent)` 契约位，五要素中标识/covers/status 机器预填（Q26 格式）
4. **无 daemon 干扰**：全部查询为 open+catch-up sync 模式，无后台进程残留

## 五、发现与处置

| # | 现象 | 判定 |
| --- | --- | --- |
| G-01 | `./dist/cli.js` 直执报 permission denied（tsc 不保 exec 位） | **非缺陷**——npm bin 链接在安装时设置执行位；本地用 `node dist/cli.js`（全部文档/skills 口径一致）。已记 95-lessons 提示候选 |
| G-02 | fd unused 候选 100 条（达 limit 截断）——Rust trait impl/#[inline] 大量无静态调用方 | 符合"仅线索非结论"设计；limit=100 防爆炸，agent 核实为主 |
| G-03 | memos 路由含测试文件注册项 | 合法候选，agent 裁决处置（非图谱缺陷） |

## 六、结论

五仓全绿：跨语言建图/路由感知/依赖聚合/死代码候选/符号导航全部符合规格；agent 消费面（skills/任务书/草稿格式）就位；Q40 三指标首轮实测数据落档（建馆耗时秒级、查询直出、缺口发现获 umami compat 实证）。
