---
title: 引导文件体系规格（三区契约与图书馆反哺）
covers:
  - src/core/guides.ts
  - src/commands/sync.ts
  - src/commands/init.ts
  - assets/guides/light.md
status: stable
---

# 引导文件体系 · 三区契约与图书馆反哺规格

> 引导文件（`CLAUDE.md` / `AGENTS.md`）是 agent 的第一入口：既有 DocLib 工作流规则，又有图书馆反哺的项目知识，还有项目手写定制——三区各司其职，真相源各自清晰。

## 为什么

引导文件若只有「怎么用图书馆」的工作流规则，agent 每次会话回答「这项目是什么/架构怎样/硬规则有哪些」都必须进馆翻找，冷启动成本高；若把项目知识直接写进引导文件，又与图书馆形成双真相源。三区契约 + 图书馆反哺解决这对矛盾：**馆内知识蒸馏成「会话冷启动包」回流引导文件，真相仍单点在馆**——与 graph 输出「仅候选禁止直接入馆」对偶，反哺区「仅再生禁止直改」。

## 是什么

引导文件由首行版本戳（`<!-- doclib-guide cli=x structure=n -->`）与三区构成：

| 区 | 内容 | 真相源 | 再生方式 |
| --- | --- | --- | --- |
| managed | DocLib 工作流规则 | doclib 包内模板 `assets/guides/light.md` | `doclib sync` 机械再生 |

managed 区核心为**实时同步映射表**（改动类型→必须同步的卷），v0.6.1 新增「载体规划文档新增」行：feature-map 登记 planned + progress.md 补记——由 check「载体未登记」「进度账缺口」两不变量 strict 执法（见 [check.md](check.md)）；v0.6.2「修 bug」行增教训处置位事实：95-lessons 入档 + progress 条目末 `教训:` 声明去向（check「教训账缺口」执法）。
| project | 图书馆反哺的项目知识摘要（五段：项目定位/架构速览/模块地图/硬规则/命令速查） | 簿记 `.doclib/guide-project.md`（单源） | agent 蒸馏写入簿记 → `doclib sync` 注入 |
| custom | 项目手写事项 | 引导文件自身 | 手写，sync 保留 |

归属判据：真相在图书馆的进 project 区；真相只在引导文件里的进 custom 区。agent 映射：claude→`CLAUDE.md`，opencode/cursor/generic→`AGENTS.md`；多 agent 同名文件只写一份、内容一致。full 档已退役（v0.6.0，职责由 project 反哺取代）。

## 怎么运转

**写入三岔路**（`writeGuides`）：文件不存在 → 写渲染模板；有版本戳 → `mergeGuide`（新模板整体 + 保留旧 custom 区；无 custom 标记的 legacy 旧版整体再生并提示）；无版本戳 → 跳过不动（保护手写文件，合并交由 agent）。

**反哺链路**：agent 读馆蒸馏五段 → 写 `.doclib/guide-project.md`（frontmatter 携 `snapshot` 蒸馏时基线版本与 `docs-hash` 蒸馏时馆内文档指纹 `libraryFingerprint`，即 doclib/ 下 .md 的稳定 hash，不含引导文件自身）→ `doclib sync` 读取并注入两份引导文件 project 区。无簿记文件或正文为空 → project 区保持模板占位（空状态合法，不判违规）。**正文禁含区域保留标记**（`doclib:managed/project/custom` 任一 begin/end 字符串）：含则注入面（init/sync）fail-fast 报 DoclibError 拒绝注入，观测面（status/verify）降级为 ⚠ 提示行，执法面（check）fail-fast——防注入破坏三区契约与 custom 保留语义（REVIEW 轮 D-1）。

**双闸检测**（`doclib check` 强验证，strict 门禁可阻断）：

| 闸 | 判据 | 违规类 | 解除 |
| --- | --- | --- | --- |
| 蒸馏过期 | 簿记 `docs-hash` ≠ 当前馆内指纹（馆变了反哺没跟上） | `guide-feed-stale`（反哺过期） | 重新蒸馏更新簿记（含新 docs-hash）→ sync |
| 注入漂移 | 引导文件 project/managed 区 ≠ 模板或簿记注入结果（直改或落后） | `guide-stale`（引导过期） | `doclib sync` 修复 |

**预算**：managed 区 ≤150 行、project 区 ≤50 行（`doclib status` 报告行数，超限 ⚠ 提示；managed 裁剪判据「删掉会犯错吗」，project 判据「会话冷启动真的每天都要知道吗」）。

**版本戳报告**（status/verify）：cli/structure 与当前不符 → 「过期 → doclib sync」。

## 怎么验收

| # | Given | When | Then |
| --- | --- | --- | --- |
| AC-1 | 全新目录 | `doclib init --agents claude,opencode` | 两份引导含三区标记，project 区为占位 |
| AC-2 | 旧两区引导（有戳有 custom） | `doclib sync` | 升级三区，custom 原样保留，project 注入 |
| AC-3 | 簿记 guide-project 存在 | `doclib sync` | 两份 project 区一致且等于注入结果 |
| AC-4 | 手工篡改引导 project 区 | `doclib check` → `doclib sync` | 报引导过期 → 修复归零 |
| AC-5 | 馆文档变更且簿记未更新 | `doclib check` | 报反哺过期；更新 docs-hash 后归零 |
| AC-6 | project 区超 50 行 | `doclib status` | ⚠ 超限提示 |
| AC-7 | 无 guide-project | `doclib check` | 不报反哺过期（无误报） |
| AC-8 | guide-project 正文含区域保留标记 | `doclib sync` / `doclib status` | sync exit 1 拒注且引导文件不被污染；status 降级 ⚠ 提示行；修正后恢复 |

## 参考

- CLI 命令：`doclib sync`（引导/skills 同步）· `doclib init`（骨架落位，见 [init-v2.md](init-v2.md)）· `doclib check`（强验证，见 [check.md](check.md)）
- 蒸馏执行者：`doclib-build` / `doclib-accept` skill 收尾步骤；本仓实例 `.doclib/guide-project.md`
