---
title: 孤儿归位与处置闭环验收报告 v0.5.0
covers:
  - src/commands/place.ts
  - src/commands/place.test.ts
  - src/core/place.ts
  - src/core/place.test.ts
  - src/core/orphan.ts
  - src/core/orphan.test.ts
  - src/core/fsutil.ts
  - src/core/fsutil.test.ts
  - src/core/check.ts
  - src/core/check.test.ts
  - src/commands/check.ts
  - src/commands/ack.ts
  - src/commands/ack.test.ts
  - src/core/state.ts
  - src/core/frontmatter.ts
  - package.json
status: stable
type: ledger
---

# 孤儿归位与处置闭环验收报告（v0.5.0）

> 验收对象：#24 孤儿归位与处置闭环（规划 `.plan/2026-10-22/orphan-placement-pack.md`）
> 方法：单元/集成测试（`npm test`，213 用例全绿）+ 真实临时目录全链路冒烟 + 本仓库 `doclib check` 复核
> 时间：2026-10-22

## 一、判定层验收（四态 + 三层防线）

| # | 验收标准 | 结果 | 证据 |
| --- | --- | --- | --- |
| A1 | 顶层 `.agents/skills/x/SKILL.md` 不判孤儿，计入工具链豁免 | ✅ | `core/orphan.test.ts` 四态分类用例；冒烟「工具链豁免 1」 |
| A2 | 嵌套 `packages/api/AGENTS.md` 不判孤儿（任意层级引导文件） | ✅ | `core/check.test.ts` 引导文件豁免用例；冒烟「引导文件豁免 1」 |
| A3 | `vendor/lib/README.md` 不进入任何分类（不进代码账） | ✅ | `core/fsutil.test.ts` L1 忽略面用例；冒烟快照文件数=3（vendor 未入账） |
| A4 | `docs/stray.md` 判为孤儿（④），strict 退出码 1 | ✅ | 冒烟「孤儿文档 (1) … strict 门禁: 未通过」 |
| A5 | 归档指针文件不判孤儿 | ✅ | 冒烟「归档指针豁免 1」；`core/orphan.test.ts` pointer 用例 |
| A6 | 新工具目录 `.foo/` 含 SKILL.md → notices 提示，soft 不判违规 | ✅ | `core/check.test.ts` 疑似新工具目录用例 |
| A7 | `ack --dir .foo/` 后目录内 .md 不判孤儿且仍进代码账 | ✅ | `commands/ack.test.ts` 目录豁免用例；`core/check.test.ts` dirExempts 用例 |
| A8 | 新增忽略规则使文件退出代码账 → 不产生「无归属」违规 | ✅ | `core/check.test.ts` newly-ignored 用例（漂移 removed=0） |

## 二、处置层验收（place 五子命令 + 三道护栏）

| # | 验收标准 | 结果 | 证据 |
| --- | --- | --- | --- |
| B1 | `place list` 列出待归位与建议归宿（含依据） | ✅ | 冒烟「建议: 30-features/001-feature-x.md（high · 文件名/目录名命中 30-features 特征）」 |
| B2 | `place archive` 无 `--apply` → 零副作用（文件仍在原处、馆内无新件） | ✅ | 冒烟第 2 步（`ls docs/` 仍有 feature-x.md，99-archive 仅 README.md） |
| B3 | `covers` 命中 → 拒绝归位并列出命中文档 | ✅ | `core/place.test.ts` covers 硬拦截用例（archiveDoc + collectDoc 双拒） |
| B4 | `place archive --apply` → 移入 99-archive + 墓碑五要素 + 原路径指针 + 归档账 arc-001 | ✅ | 冒烟第 3 步 + 墓碑全文核对（何时失效/为何失效/取代者指针/原路径/归档方式） |
| B5 | `place restore arc-001` → 还原为**原件**（墓碑块剥离、原 status/covers 恢复、逐字节一致） | ✅ | 冒烟第 5 步（还原后文件与原文完全相同）+ `core/place.test.ts` 还原为原件用例 |
| B6 | `place collect --to 30-features` → 入馆 + frontmatter 齐备 + 两级索引登记 + 归档账 collected | ✅ | 冒烟第 7 步（INDEX.md 与 30-features/_index.md 各增一行） |
| B7 | 非法目标卷 / 非 .md / 路径逃逸 → 拒绝 | ✅ | `core/place.test.ts` 非法目标用例 |
| B8 | 原路径被他人占用 → 拒绝还原 | ✅ | `core/place.test.ts` 占用用例（自有指针文件不算占用） |
| B9 | `place ack --note` → standing 豁免，check 不再报孤儿 | ✅ | `commands/place.test.ts` ack 用例 |
| B10 | 归档件索引登记在还原时撤销（不留断链） | ✅ | `core/place.test.ts` 索引撤销用例（冒烟曾暴露断链，已修） |

## 三、回归

| 项 | 结果 |
| --- | --- |
| `npm run typecheck` | ✅ 绿（strict + noUncheckedIndexedAccess） |
| `npm test` | ✅ **213/213 绿**（v0.4.0 为 178 → 新增 35：orphan 6、place 11、commands/place 8、check 4、ack 3、fsutil 2、check 1） |
| 临时目录冒烟 | ✅ 7 段全链路通过（init → 造四类文件 → check → place list → 干跑 → apply → check 归零 → restore → check 复现 → collect） |
| 本仓库 `doclib check` | ✅ 治理 100/100 (A)，无孤儿、无假违规 |
| 引导 managed 区 | ✅ 55 行（预算 150）；custom 区保留不变；命令速查新增 `place` 一行 |
| 运行时依赖 | ✅ 仍仅 `ignore`（零新依赖） |

## 四、冒烟暴露并修复的实现缺陷（留痕）

| # | 缺陷 | 根因 | 修复 |
| --- | --- | --- | --- |
| D-01 | 入棺后写指针文件 ENOENT | 源目录在写指针前被 `removeDirIfEmpty` 删除 | 调整顺序：先写指针再清空目录；指针写入前 mkdir |
| D-02 | 两级索引登记写到 `doclib/doclib/_index.md` | `docRel` 含 `doclib/` 前缀，卷名解析重复 | 新增 `libraryRelative()` 归一；INDEX 链接改馆内相对路径 |
| D-03 | 还原得到的是**墓碑件**而非原件 | 归档时以墓碑内容覆盖原文件，原文不可逆 | 墓碑块改用定界标记（`doclib:tombstone:begin/end`）嵌入正文；原 frontmatter 全量留痕（`originStatus`/`originCovers` 入归档账）；还原时剥离墓碑块并复原原字段 → 逐字节一致 |
| D-04 | 归档件索引行未撤销 → 断链告警 | `applyRestore` 只对 collected 类型撤销索引 | 还原统一撤销两级索引登记 |
| D-05 | 疑似工具目录内文件仍判孤儿 → strict 误阻断 | 疑似目录只做提示未参与候选过滤 | 疑似目录内文档 soft 提示不判违规（提示 `ack --dir`），与「闭集滞后兜底」目标一致 |

## 五、审查轮复核（REVIEW → EXECUTE，2026-10-22）

实施完成后做全方位 REVIEW：三方交叉验证（43 仓新旧判定**对照度量** + 7 项边界构造复现 + 6 项安全探针），发现 10 项问题并全部修复：

| # | 发现 | 严重度 | 修复 | 回归 |
| --- | --- | --- | --- | --- |
| R-01 | README 门面命令表仍列 11 命令、通用选项缺 `--apply/--dir/--reason`（计划缺口） | 中 | README 补 `place` 行 + 三选项；`check` 行补四态判定与豁免提示 | 人工核对 |
| R-02 | 分区目标（`--to 30-features/cli`）卷索引链接写成 basename → 断链 → `check` 判「文档质量」违规 | 中 | 链接改卷内相对路径（`cli/001-x.md`），还原按同一相对路径撤销 | 新增用例 |
| R-03 | `buildVolumeRow` 按列数截断：4 列表（功能\|规格文档\|covers\|状态）只填 3 格 → 行列不齐 | 中 | 改按**列语义**映射（link/summary/covers/status/volume-entry/title），格数恒等表头 | 新增用例 |
| R-04 | 5 处文档「约 2000+ 误报/仓库」——per-repo 与 sample-total 混淆（高估约 40 倍） | 中 | 全部改实测口径：工具链类 2,052（43 仓样本合计，均值 ≈48/仓，AI 工具仓最高 171） | 人工核对 + 度量脚本 |
| R-05 | 目标「误报量 → ≈ 0」不可达成（残余含真知识目录） | 低 | 目标改「工具链类清零 + 真知识目录判定不变（23,920，差额 3 为嵌套引导文件）」，明示残余两类（夹具 2,344 按 Q20 不豁免、非点目录工具目录 1,856 无 soft 提示） | 度量脚本 |
| R-06 | `ack --dir` 不校验目录存在 → 拼写错误静默永久无效 | 低 | 登记时校验存在（移除豁免不受限） | 新增 2 用例 |
| R-07 | 归档账 `state.archives` 无上限（快照链有 20 条上限） | 低 | `MAX_ARCHIVES = 200`（档案文件永久保留，仅账本条目封顶） | 随 saveState 生效 |
| R-08 | 表头取第一张表、行追加到最后一张表 → 多表 `_index` 行列错位 | 低（潜伏） | 定位改为「首个完整表（表头+分隔行）」，多表时选**文档索引表** | 新增用例 |
| R-09 | `collect → restore`（collected 类型）无测试 | 中 | 补用例（回原位 + 索引撤销 + 销账 + frontmatter 语义） | 新增用例 |
| R-10 | `check --json` notices 逐文件输出 → 大仓载荷偏大 | 低 | notices 按「类型 + 顶层目录」聚合（保留样例路径），文本与 JSON 同时收敛 | 随 check 复核 |

**安全面探针结果**：路径逃逸（`../../etc/passwd`）、绝对路径（`/etc/passwd`）、越权归档馆内文件、非法目标卷（`../../etc`）、非 `.md` 文件——**全部正确拒绝**（`DoclibError` 统一错误面）。

**43 仓对照度量（新旧判定各自前置条件）**：

| 指标 | 旧实现 | 新实现 |
| --- | --- | --- |
| 孤儿判定总数（43 仓合计） | 36,086 | 34,034 |
| 工具链类误报 | 2,052（工具目录 422 + 嵌套引导 68 + 第三方 889 + 变更集 631） | **0** |
| 真知识目录判定（应保留） | 23,923 | 23,920（差额 3 为嵌套引导文件，正确豁免） |

**复核后终态**：typecheck 绿｜**219/219 用例绿**（213 → 219）｜冒烟复跑通过（分区目标链接正确、无断链）｜本仓库 `check` 治理 100/100 (A)、违规为零。

## 六、结论

功能实现与规格一致，四态判定、三层防线、处置闭环与三道护栏全部达标；冒烟暴露的 5 项实现缺陷（D-01~D-05）与审查轮的 10 项发现（R-01~R-10）已全部修复并补入回归测试（用例数 178 → 219）。本仓库 `check` 全绿，治理 100/100 (A)。

> v0.30 增量（#25 codegraph 集成）：本档案覆盖的 `src/core/fsutil.test.ts`、`src/core/orphan.test.ts` 各扩 1 例（`.codegraph/` 入 L1 扫描面与工具链闭集），全套 240/240 绿——增量验收标准见 [30-features/graph.md](../30-features/graph.md)。
