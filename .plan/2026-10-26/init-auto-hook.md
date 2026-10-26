# init 即装提交门禁（init-auto-hook）

- 日期：2026-10-26
- 状态：规划完成，方案 A 已拍板，待执行（RIPER-5：EXECUTE 收尾后新需求 → PLAN）
- 关联：feature-map #16（强验证体系）；30-features/hook.md（v0.5.1 健壮化）；95-lessons 2026-10-26 P8 条
- 来源：用户疑问「现在是通过 cli 命令单独安装的 hook，我希望 doclib 在一个仓库初始化的那一刻就能直接安装好 hook，这样就不会有忘记安装的风险」

## 一、目的与效果

1. 把门禁安装从「记得手动执行 `doclib hook`」变为「init 默认发生」——根除遗忘风险。
2. 对应缓解本次验收确认的问题点 P1：连 DocLib 本仓自己都忘了装（机制在、门禁不在岗）。
3. 新项目从第一天起提交即受 `check --strict` 执法，配合 init 即 snapshot 的骨架馆干净基线，无冷启动噪音。
4. 幂等与退出通道齐备：`--no-hook` 显式跳过、`doclib hook remove` 随时撤、foreign 钩子绝不破坏。

## 二、问题点

| # | 问题 | 证据 |
| --- | --- | --- |
| Q1 | hook 依赖手动安装，遗忘风险真实发生（本仓 v0.5.0 期间未装，提交门禁空转） | 本轮 RESEARCH 实测 |
| Q2 | init 现无任何 git/hook 感知（init.ts 无 git 相关逻辑，且 init 允许在非 git 目录落骨架） | 本轮代码研究 |
| Q3 | 自动装可能与用户既有钩子（husky/lefthook）冲突——现有 foreign 保护是抛错语义，不能让 init 失败 | hook.ts:88 语义 |
| Q4 | 非 git 目录 init 是合法场景 → 自动装必须有降级路径而非报错 | init 现状 |

## 三、研究结果（代码实际情况）

- `runInit(root, flags)` 接收 flags 注入（cli.ts:126-128），新增 `no-hook` 解析无接口障碍。
- `runHook` 已具备健壮化四能力（v0.5.1）：resolveHooksDir（worktree）、readHookState 四态、相对/绝对路径策略、fail-closed 自检——init 集成即复用，无新轮子。
- init 即 snapshot 已是治理全周期子能力（#17），init 后骨架馆 check 干净（冒烟实测「init 新馆违规 0」）→ strict 档位无冷启动噪音。
- 真实仓库验收（csvkit/memos）已实证 install/阻断/放行/foreign/移除全链路 → 集成点行为可信。

## 四、设计方案（方案 A，已拍板）

**init 默认自动安装 pre-commit 门禁（--strict 档），配套四项拍板：**

| 决策点 | 拍板结果 |
| --- | --- |
| 档位 | `--strict`（骨架馆基线干净，第一天即执法） |
| 既有钩子冲突 | foreign → **警告跳过**，init 不失败，指引手动 `doclib hook`（抛错语义仅保留在显式 `doclib hook` 命令） |
| 非 git 目录 | init 照常成功，输出提示「git 初始化后运行 `doclib hook --strict`」 |
| 退出通道 | `init --no-hook` 显式跳过 + `doclib hook remove` 随时撤 |

**配套设计：**
- `doclib sync` 幂等补装/修复钩子（同降级语义，双保险）
- 范围：仅 init 主入口；`plan --bootstrap/--resume` 不动（均要求先有 init）
- init 成功文案新增「提交门禁」行，与 status 四态文案一致（可见性统一）
- 本仓身先士卒：已装钩子用新 CLI 重跑验证幂等覆盖

## 五、有无备选方案

| 备选 | 否决理由 |
| --- | --- |
| B：init 仅输出提醒不安装 | 遗忘风险依旧，不解决诉求 |
| C：package.json prepare 钩子自动装 | 仅覆盖 npm 安装场景、侵入用户 package.json、与 husky 等强冲突 |
| init 装 but 普通档（非 strict） | 门禁语义打折——违规提交照常入库，违背「根除遗忘风险」初衷 |
| foreign 冲突时报错中止 init | 初始化不应被可选增强阻断（Q3） |
| plan --bootstrap/--resume 也装 | 二者均要求先有 init，重复覆盖无增益（YAGNI） |

## 六、实施清单

```
实施清单：
1. init.ts：新增 --no-hook 解析；init 收尾集成 runHook
   （.git 存在 + 非 foreign → 装 --strict；foreign → 警告跳过；非 git → 提示；--no-hook → 跳过）
2. init.ts：成功输出新增「提交门禁」行（四态文案与 status 一致）
3. sync.ts：幂等补装逻辑（同降级语义，不失败）
4. init.test.ts：+4 用例（git 目录默认装 --strict / --no-hook 跳过 / foreign 跳过不失败 / 非 git 提示）
5. hook.test.ts：+1 幂等覆盖用例（重复安装覆盖自身 doclib 钩子不报错）
6. npm run typecheck + npm test 全绿
7. 冒烟：临时目录 init 四场景（git/非 git/foreign/--no-hook）
8. 图书馆同步：30-features/hook.md + init-v2.md 规格更新、_index/INDEX 登记、
   feature-map、progress.md 补记、AGENTS.md custom 区（如涉及）
9. doclib check → snapshot → 本仓重装验证幂等
10. REVIEW 逐项核对
```

## 七、验收标准

- AC-AH1 Given git 仓库 When `doclib init` Then pre-commit 钩子（--strict 档）自动落位且 init 输出「提交门禁: 已安装(--strict)」
- AC-AH2 Given `doclib init --no-hook` When init Then 不安装钩子，输出「提交门禁: 未安装（--no-hook 跳过）」
- AC-AH3 Given 已存在非 doclib 钩子 When init Then init 成功、警告跳过、用户钩子原样保留
- AC-AH4 Given 非 git 目录 When init Then init 成功并提示 git 初始化后手动安装
- AC-AH5 Given 已装 doclib 钩子 When 重复 init / doclib hook Then 幂等覆盖自身、不报错
- AC-AH6 Given `doclib sync` When 钩子缺失 Then 幂等补装；钩子在岗则无动作
- AC-AH7 Given 自动装好的钩子 When 新增无归属文件并 commit Then 提交被阻断（exit 1，fail-closed 传导）
- AC-AH8 Given 全部改动 When npm test Then 现有用例无回归 + 新增 5 用例全绿
- AC-AH9 Given 执行完成 When `doclib check` Then 违规 0、治理不降分，规格文档两级索引齐备
