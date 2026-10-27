---
name: doclib-dev
description: DocLib 开发会话工作流（★主力），双情形：A=常规开发（单任务会话：新功能/迭代/修 bug）；B=长程开发（批量 planned 功能连续推进/多小时循环施工/长工程复现——六步回路+测试链执法+阻塞协议）。覆盖：会话开始检查、实时同步规则执行、.plan/载体双锚点、写前写后 revision 比对、会话结束自检、长程回路。
---

# doclib-dev · 开发会话工作流

## 使命

让每一次开发会话都"从图书馆出发、以图书馆验收"——图书馆是开发的输入而非事后产物；开发中产生的任何知识当场入馆，图书馆与代码永远互相映证。

## 何时使用

- **情形 A（常规开发）**：任何已启用 DocLib 的项目中的单任务开发会话（新功能/迭代/修 bug/重构）。触发点：会话开始即加载本 skill；已有 bootstrap/resume 建馆后转入本循环
- **情形 B（长程开发）**：一批 planned 功能连续推进、多小时循环施工、或 rebuild 类长工程——共享骨架不变，另加载下文「情形 B：长程开发回路」节

## 会话开始

1. 运行 `doclib status`，读四件事：
   - **治理健康分**（NN/100 等级）：低于 A 先清账再开发（漏更/孤儿/迁移违规）
   - **漂移**：未同步的代码变更——确认是否他人/上次会话遗留
   - **载体提醒**（待登记/待归档）：先处理提醒再开发
   - **引导预算**：超限顺手瘦身
2. 运行 `doclib check` 确认违规为零；记录当前 **revision**（写后比对用）

## 符号查询纪律（可选加速器）

- 项目已建知识图谱（.codegraph/ 存在）时：定位符号/调用链/影响面优先 `doclib graph explore <query>`，省 grep/read 循环；**先馆后码顺序不变**——实体问题仍先查登记簿，图查询结果回馆验证/建账（查询即建账纪律照旧）
- 未建图或 Node < 22.5：不阻塞任何流程（可选增强，优雅降级）

## 开发中：实时同步规则（最高优先级）

开发中凡触及图书馆任一卷知识的改动，**必须当场更新入馆，不等 diff、不等会话结束**：

| 改动类型 | 必须同步的卷 |
| --- | --- |
| 修 bug / 踩坑 / 得出解决办法 | `95-lessons/`（现象/根因/解决/规避，可加 `来源:` 行）+ progress 条目末 `教训:` 处置位声明去向（check「教训账缺口」拦截） |
| 新功能 / 行为变更 / 新命令 | `30-features/`（规格+验收标准）+ feature-map 状态 |
| 模块增删 / 职责边界变化 | `20-modules/` |
| 架构 / 数据模型 / 数据流变化 | `10-architecture/` |
| 依赖增删换 | `10-architecture/dependencies.md` |
| 数据库迁移 / Schema 变更 | `10-architecture/migrations.md`（先取号、后登记） |
| API / 路由 / UI 资产实体增删改 | 登记簿实时入账（分散挂靠各卷，五要素，状态机显式） |
| 内容过时 | 三态更新：失真→修正；过时→状态机降级/99-archive 留墓碑；冗余→合并 |
| 新文档落位 | 归位决策树定位唯一归宿 + 两级索引同步（INDEX + 卷 _index） |
| 功能移除 | 六步移除规程（影响面预查→残留扫描→馆内联动→check 执法→留痕） |
| 任何进度变化 | feature-map 状态推进 + progress.md 补记 |

## 孤儿清账与归位

`doclib check` 报出的「孤儿文档」= 馆外知识文档未收编且未豁免（归位宪法违反记录）。清账四步，顺序不可颠倒：

1. **先判是不是误报**：工具链目录/第三方/夹具由 CLI 自动排除，仍报出的才是待归位文档。若确认是新 agent 工具目录 → `doclib ack --dir <前缀> --note "<理由>"`（不判孤儿但仍进代码账），**不要删文件**
2. **看建议归宿**：`doclib place list` 给出建议卷与依据（确定性启发式，最终归宿由你裁决）
3. **选处置**：
   - 收编入馆：`doclib place collect <路径> --to <卷> --apply`（移动 + frontmatter 补 covers + 两级索引登记）
   - 入棺归档：`doclib place archive <路径> --reason "<失效原因>" --apply`（移动 + 墓碑五要素 + 原路径留指针）
   - 馆外合法：`doclib place ack <路径> --note "<理由>"`（等价 `ack --standing`）
4. **还原兜底**：误归档了 → `doclib place restore <arc-id> --apply`（归档账在 `.doclib/state.json`，不依赖 git）

**入棺三红线**：

- 已被馆内文档 `covers` 命中的文件**禁止归位**（移动会砸掉增量更新锚点；CLI 已硬拦截）
- 所有写操作**默认干跑**，必须显式 `--apply` 才落盘
- 墓碑五要素必写（何时失效 / 为何失效 / 取代者指针 / 原路径 / 归档方式），不丢史

**豁免边界**：`ack --dir` = 不判孤儿但**仍进代码账**（可漂移感知）；`.doclibignore` = **完全不进代码账**（不 hash、不漂移检测）。前者用于工具目录，后者用于第三方与生成物。

## .plan/载体双锚点

- **锚点一（登记）**：规划文档完成 → feature-map 新增/更新 planned 条目 + progress.md 补记（check「载体未登记」「进度账缺口」strict 拦截，hook 阻断提交）。**细化 planned 功能开工**：`doclib implement --feature <N>` 生成 .plan 实施骨架（readiness 校验 + AC 锚点预填，干跑默认）→ doclib-implement skill 对话填实（每条清单引用 AC 锚点；开工置 in-progress 时「对应文档」列写 .plan 路径——check「实施锚点缺失」拦截）
- **锚点二（归档）**：开发完成 → 过程材料留载体不动；长期价值沉淀入馆（ADR/规格/参考卷/95-lessons）；更新 covers；feature-map → implemented（对应文档列不得为空——check「沉淀锚点缺失」拦截）；progress.md 补记（末字段 `教训:` 处置位——check「教训账缺口」拦截）

## 情形 B：长程开发回路（多任务连续推进）

一批 planned 功能连续施工、多小时无人值守循环、长工程复现（rebuild 同链路）时启用。共享骨架（会话开始/实时同步/双锚点/入馆写协调/踩坑一行制/五问）全程有效；本节是回路增量。

**六步回路**（每任务一轮，循环至 planned 清零或用户叫停）：

1. **选任务**：`doclib implement` 列 planned 候选——按依赖顺序与优先级选一个（一会话一任务；planned ≙ passes:false，implemented ≙ passes:true）
2. **开工**：`doclib implement --feature <N> --apply` 生成骨架 → doclib-implement skill 对话填实（每条引用 AC 锚点）→ feature-map 置 in-progress（对应文档列写 .plan 路径）
3. **开发**：按共享骨架全部纪律执行（实时同步/踩坑一行制/入馆写协调）
4. **验证（分级强制）**：
   - 一切改动：馆内 test-chain **fast 档全绿**（已烘焙 pre-commit，提交即执法；未装钩子先 `doclib hook install`）
   - 交互面改动（UI/页面/CLI 交互输出）：浏览器或冒烟测试**必做**——工具序 playwright-cli（`npm i -g @playwright/cli`，`playwright-cli install --skills` 或读 `--help` 自助）> agent-browser skill > playwright mcp；纯 CLI/库项目浏览器档显式 N-A
   - 收口前：test-chain **full 档全绿** + doclib-accept 逐条 AC 验收
5. **收口**：实施清单逐条勾选 → feature-map 翻 implemented（对应文档列齐，check「清单状态失真」拦截伪造完成）→ progress.md 补记（教训: 处置位）→ **一任务一 commit**（代码+骨架+馆内账同 commit，钩子门禁通过后提交）
6. **循环**：回到 1 选下一任务；全部完成跑 `doclib snapshot` 固化

**阻塞协议**（环境缺失/外部依赖不可用/测试无法进行时）：

- 禁止 commit、禁止翻 implemented、禁止假装完成
- 骨架 frontmatter 写 `blocked: <原因与所需人工动作>`（check blocked-residue 提醒）
- 输出结构化阻塞信息：当前任务/已完成工作/阻塞原因/所需人工步骤/解除后动作
- 停止等待人工介入

**铁律**：永不删任务（planned 只翻转不删除，废弃走 retired 状态机）；任务描述与 AC 不因施工不顺改写（改规格先走规格变更/ADR 流程）

## 入馆写协调

- 写前记录 `doclib status`/`check` 输出的 revision
- 写后跑 `doclib check`：revision 已变 = 他人动过馆 → 重新对账再继续
- 同一时间约定单会话入馆写

## 踩坑一行制（开发中实时）

每踩一个坑（报错/返工/预期失手/重踩旧坑），**当下**在当前 .plan 规划文档「失败尝试与踩坑」节追加一行（日期 + 现象一句话）——只记一行不打断主流程；lessons 四段蒸馏留会话收尾（防中断永久丢失上游素材，planstore 踩坑一行制）。

## 会话结束：自检五问

1. 改动归档了吗？（馆内文档同步）
2. feature-map 状态推进了吗？
3. progress.md 补记了吗？
4. 引导文件需要更新吗？（新规则入 custom 区；记忆快照 `.doclib/guide-memory.md` 刷新——`work-as-of` 落今日、画像有新观察则更新 `user-as-of`；确认普适的提示 `doclib sync`——planstore 收尾动作 2）
5. 踩坑都处置了吗？（.plan 第九节回填齐 + lessons 四段已入档且带真实路径 `来源:` 行 + progress 处置位声明——planstore 收尾核对动作）

## 纪律底线

- 无账不答：查登记簿无果禁止凭空回答实体问题——读码验证并回填建账
- 记忆与图书馆冲突时以馆为准
- 文档写行为/契约/意图/验收标准；除 ≤10 行示意片段外禁止搬运源码
- 新增引导规则先自问"删掉会犯错吗"——不会则入 skill/入馆，不进引导
- 兜底（check/diff/reconcile）不是用来依赖的
