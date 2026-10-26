---
title: doclib reconcile 进度对账规格
covers:
  - src/commands/reconcile.ts
  - src/commands/reconcile.test.ts
  - src/core/reconcile.ts
  - src/core/reconcile.test.ts
  - src/core/featuremap.ts
status: stable
---

# doclib reconcile · 进度对账规格

> 进度账的兜底核对者：即使规划载体全部遗漏、进度账彻底失真，也能基于快照链与 covers 映射把缺口显形，交由 agent 逐项确认补录。

## 为什么

F11 三层兜底的最后一层需要回答一个问题：**进度账与代码还对得上吗？** 规则层（引导文件的会话纪律）与对账层（`check` 的双账本）都管不了「条目状态本身是否失真」——一条标着 `implemented` 的条目，可能对应的文档已被删、可能它锚定的代码路径已整体漂移而文档没同步。`doclib reconcile` 就是为回答这个问题而存在：把进度账逐条摊开与代码、文档对撞，产出确定性报告而非人肉排查。

## 是什么

`doclib reconcile [--json]`——进度账对账命令：输出**三段报告**（疑似完成 / 进度不符 / 待推进），无 AI、无网络、可复现。数据源三件：快照链（`state.json`）、代码漂移（`diff` 的同一套 analyzeDrift）、进度账（`doclib/00-overview/feature-map.md` 的表格行）。

## 怎么运转

| 段 | 判定 | 用途 |
| --- | --- | --- |
| 一、疑似完成 | 漂移路径对应的 feature-map 条目状态为 implemented/retired，或存在未登记的漂移 | 逐项确认后补录进度账 |
| 二、进度不符 | implemented 条目的**对应文档不存在**，或**其 covers 命中的代码路径全部漂移且该文档未同步** | 定位「进度与代码不符」的历史条目 |
| 三、待推进 | 状态为 `planned` / `in-progress` 的条目清单 | 下一步做什么 |

> 实现注记【v0.6.1】：feature-map 解析（`featureRows`/`docRefs`/`docExists`）自 v0.6.1 迁至 `core/featuremap.ts`（归档闭环三不变量复用同一解析面，见 [check.md](check.md)），本模块再导出保持兼容——解析语义单点化，两命令永不漂移。

### 「对应文档」列的解析【v0.34 修正】

该列是**混合引用**：可同时含规划载体路径（`.plan/<日期>/<slug>.md`）、馆内路径（`30-features/x.md` / `doclib/30-features/x.md`）与源码路径（`src/...`），多项以 ` + ` 连接，且首个 token 惯常是载体路径——过程材料本就不入馆（F9 双轨边界）。

判定按**存在性**而非前缀：

1. 拆引用：取括号前部分 → 按 ` + ` 切分 → 去除空值、`—`、以 `skills/` 开头者（目录非文档）
2. 候选全空 → 跳过该条目
3. 逐候选解析：**库内**（`doclib/<ref>`，`doclib/` 前缀先剥离）**或** 仓库根（`<ref>`）——任一命中即「有据」
4. 全不命中 → 报「对应文档不存在」（列出全部候选）
5. 有据但**无库内锚点**（仅载体/源码路径）→ 跳过漂移核对：载体不是 covers 锚点，无法映射到代码路径
6. 有库内锚点 → 漂移核对：被该文档 covers 命中的代码路径**全部**漂移、且该文档本轮未变更 → 报「覆盖路径有漂移且文档未同步——进度与代码不符」

> v0.34 修正的原因：旧实现只取首个 token 且一律按 `doclib/` 前缀解析，而本仓自 v0.17 起的惯例是首个 token 放载体路径 → **本仓 15 条 implemented 条目全数被误报**（含刚归档的条目），真失真被淹没。ADR #17。

## 配套

- `doclib check`（双账本强验证 + 治理健康分）——见 [check.md](check.md)；`doclib place`（孤儿归位）——见 [place.md](place.md)
- 补录动作：按本卷 30-features 规格与 `doclib/00-overview/progress.md` 时间线补记，状态推进遵循 feature-map 状态机

## 验收标准

- Given feature-map 某 implemented 条目的对应文档列为「载体路径 + 馆内路径」 When reconcile Then 不报「对应文档不存在」
- Given 对应文档列全部候选均不存在 When reconcile Then 报「对应文档不存在」并列出全部候选
- Given 对应文档仅指向规划载体（无库内锚点）且代码漂移 When reconcile Then 不报「进度与代码不符」（载体非 covers 锚点）
- Given 库内锚点文档 covers 的代码路径全部漂移且文档未同步 When reconcile Then 报「进度与代码不符」并列出该文档
- Given 存在 planned / in-progress 条目 When reconcile Then 第三段完整列出其编号与名称
- Given 尚无基线快照 When reconcile Then 报「baseline null」且不崩
