---
title: doclib place 归位处置规格
covers:
  - src/commands/place.ts
  - src/core/place.ts
  - src/core/orphan.ts
  - src/core/planning.ts
  - src/core/state.ts
  - src/core/frontmatter.ts
  - src/core/place.test.ts
  - src/commands/place.test.ts
status: living
---

# doclib place · 孤儿归位与处置规格

> 孤儿治理的执行面：check 负责发现与分类，place 负责执行与留痕——判定与执行分离、干跑与可逆护栏兜底。

## 为什么

把「馆外文档是孤儿文档，需要入棺」从**人工自觉**变为**机器判定 + 工具执行 + 留痕可逆**的闭环。`check` 负责发现与分类，`place` 负责执行与留痕——检测与处置分离，判定与执行分离。

归位宪法（PRD §7.5）在此落地：馆内是默认，馆外是例外，例外必须显式；孤儿三态处置由 CLI 承担确定性部分，agent 只做语义裁决。

## 是什么

`doclib place <list|collect|archive|ack|restore>` 五子命令族：列出待归位孤儿（含建议归宿）、收编入馆、入棺归档（墓碑+指针）、馆外豁免登记、归档还原；写操作默认干跑 `--apply` 执行。

## 怎么运转

`doclib place <子命令> [参数]`——五个子命令，写操作**默认干跑**，`--apply` 才落盘。

| 子命令 | 语义 | 必填参数 | 副作用 |
| --- | --- | --- | --- |
| `list` | 列待归位孤儿 + 决策树建议归宿 + 建议依据（按建议卷分组） | — | 无 |
| `collect <路径>` | 收编入馆：移动文件 + frontmatter 合并补 covers + 两级索引登记 + 归档账 | `--to <卷/分区>` | 有（`--apply`） |
| `archive <路径>` | 入棺归档：移动文件 + 墓碑五要素 + 原路径留指针 + 两级索引登记 + 归档账 | `--reason <失效原因>` | 有（`--apply`） |
| `ack <路径>` | 馆外合法登记（等价 `ack --standing`） | `--note <理由>` | 有 |
| `restore <arc-id>` | 归档账逆操作：文件回原位 + 删指针 + 撤索引 + 销账 | — | 有（`--apply`） |

### 建议归宿（确定性启发式，无 AI）

按 12 卷基线的路径/标题关键词匹配，输出 1–3 条建议（`high` 目录名精确命中 → `medium` 关键词命中 → `low` 无命中默认 `30-features` 并标注需人工裁决）。卷内文件名按 Q33 三位序号规范生成（取该卷下一可用序号 + kebab-case slug）。

### 载体形态识别【v0.6.1】

`list` 建议前先做载体形态判定（`core/planning.ts` `detectCarrierShape`，目录前缀级粗判）：`openspec/`→OpenSpec、`.specify/` 或 `specs/NNN-slug/`→spec-kit、`.kiro/specs/`→Kiro。命中即短路关键词启发式，首建议改为**声明为规划载体**（`init --planning` 声明后进入双轨提醒），并**不输出**「收编/入棺」行（spec 过程材料按 F9 双轨不进馆），保留「豁免」行兜底。已声明载体目录内的文件仍会出现在 list 中（scan 面不排除声明前缀——既有怪癖，check 孤儿面已豁免），声明指引对两者语义均成立。

### 干跑契约

所有写操作在缺少 `--apply` 时**只打印不落盘**，输出：源 → 目标、动作细节、墓碑预览、受影响文档清单、以及确认命令原文。干跑是默认行为而非可选模式——不可逆动作的唯一可靠护栏。

### 入棺三道护栏

1. **默认干跑**：无 `--apply` 零副作用
2. **covers 硬拦截**：文件被任一馆内文档的 `covers` 命中 → 拒绝执行并列出命中文档（移动会砸掉增量更新锚点）
3. **归档账可逆**：`state.archives` 记录每次归档（id `arc-00N`、原路径、馆内路径、原因、时间），`place restore <id>` 可完整还原（不依赖 git）

### 墓碑规范

入棺文件写入 `doclib/99-archive/<三位序号>-<slug>.md`：frontmatter 载 `status: archived` 与 `archived-from` / `archived-at` / `archive-reason` / `superseded-by`；正文首段为**墓碑五要素**——何时失效 / 为何失效 / 取代者指针 / 原路径 / 归档方式；其后**完整保留原正文**（不丢史）。

原路径留**指针文件**（含 `<!-- doclib:archived-pointer -->` 标记 + 指向馆内新位置的相对链接）——防读者扑空与断链；该标记同时是 L2 判定面的内容级豁免依据。

L2 判定面的**原生豁免**（无需 ack 登记）：根级门面文件 `README.md` / `CHANGELOG.md` / `CONTRIBUTING.md` 及其多语言变体（`README.<locale>.md` 等）——位置由生态惯例决定、不可迁移，故不判孤儿、也不需 `place` 处置；非 locale 后缀（`README.wip.md`）与嵌套门面文件不在此列。

### 两级索引登记

`collect` 与 `archive` 均登记两级索引：`doclib/INDEX.md`（| 文档 | 摘要 | 状态 |）+ 目标卷 `_index.md`。

- **表定位**：目标卷 `_index.md` 中若有多张表，取**首个完整表**（表头 + 分隔行）且表头含文档/功能/模块语义列者（文档索引表）；无则取首个完整表——避免图例表被误当索引表。
- **行填值按列语义**（不按列数截断）：`文档`/`规格文档`/`参考文档` → 文档链接；`摘要`/`内容`/`职责` → 摘要；`covers` → 覆盖路径；`状态` → 状态；`卷入口` → `待成卷`；`功能`/`模块` → 标题；其余 → `—`。**行格数恒等于表头列数**。
- **链接为卷内相对路径**：卷内文档 → `001-x.md`；分区文档（`--to 30-features/cli`）→ `cli/001-x.md`（不断链）。
- `restore` 撤销登记时按同一相对路径匹配行。

### 还原语义

- 归档件 = **原件 + 定界墓碑块**（`<!-- doclib:tombstone:begin/end -->`）+ 归档元数据 frontmatter（`status: archived` 与 `archived-from`/`archived-at`/`archive-reason`/`superseded-by`）；原 frontmatter 字段全部保留，其原值（`status`/`covers`）记入归档账（`originStatus`/`originCovers`）。
- `restore` = 剥离墓碑块 + 复原原 frontmatter 字段 → **原件逐字节复原**（非墓碑件）。
- 归档账 `state.archives` 封顶 **200 条**（`MAX_ARCHIVES`，与快照链 20 条同构）：**档案文件永久保留**（Q27），仅账本条目封顶——超出部分不可 `restore`。
- 原路径被**他人**占用时拒绝还原；归档自身留下的指针文件不算占用。

## 配套

- `doclib check`——发现与分类（见 [check.md](check.md)）
- `doclib ack <路径> --standing --note <理由>`——逐文件豁免；`doclib ack --dir <前缀> --note <理由>`——目录豁免（不判孤儿但仍进代码账；**登记时校验目录存在**，拼写错误直接拒绝；移除豁免不受存在性限制）

## 验收标准

- Given 孤儿文件 When place list Then 列出建议归宿与依据，且默认卷为 30-features 时标注需人工裁决
- Given openspec/changes/x/proposal.md When place list Then 首建议为声明规划载体（OpenSpec）、无收编/入棺行、保留豁免行；json suggestions[0].carrier=true
- Given place archive（无 --apply）When 执行 Then 源文件仍在原处、馆内无新文件、输出动作清单
- Given 文件被 covers 命中 When place archive --apply Then 拒绝执行并列出命中文档
- Given place archive --apply When 执行 Then 文件移入 99-archive/、墓碑五要素齐备、原路径留指针、归档账新增 arc-00N
- Given place restore arc-00N When 执行 Then 文件回到原路径（**逐字节复原为原件**）、指针文件删除、索引行移除、归档账条目移除
- Given place collect --to 30-features When 执行 Then 文件入馆、frontmatter 含 covers 与 title、两级索引各增一行、归档账记 collected 条目
- Given place collect --to 30-features/cli（分区）When 执行 Then 卷索引链接为 `cli/001-x.md`（卷内相对路径），check 无断链
- Given 卷 _index 为 4 列表（功能|规格文档|covers|状态）When 登记 Then 行格数 = 4 且状态列有值
- Given 卷 _index 含多张表 When 登记 Then 行追加到文档索引表（表头与行同表），不落进图例表
- Given place collect --to 未知卷 When 执行 Then 拒绝并列出 12 卷基线
- Given 目标目录被文件占用 When place restore When 执行 Then 拒绝并说明原路径已被占用
- Given place ack --note Then 生成 standing 豁免，check 不再报该文件为孤儿
- Given place 无子命令 When 执行 Then 等价 list（列出待归位清单）
