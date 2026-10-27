---
title: doclib hook 提交门禁规格
covers:
  - src/commands/hook.ts
  - src/commands/hook.test.ts
  - src/commands/status.ts
status: stable
---

# doclib hook · 提交门禁规格

> 门禁是把「先馆后码」从自觉变为机器执法的最后闸门：提交被 check 拦住的那一刻，漏更无处遁形。

## 为什么

`doclib check --strict` 已能判定治理违规，但它依赖人主动执行——不挂到 git 提交流程上，纪律就只能靠自觉。hook 命令把 check 固化为 pre-commit 门禁，并采用 fail-closed 语义：node 缺失、CLI 缺失等任何异常都宁可阻断提交并给出自助指引，绝不静默放行违规入库。门禁状态同时回显到 `doclib status`，在岗与否一目了然。

## 是什么

`doclib hook [--strict]` 安装 pre-commit 钩子（提交时运行 `doclib check [--strict]`）；`doclib hook remove` 移除；`doclib hook --ci github` 生成 GitHub Actions 门禁模板。钩子脚本带 `# doclib-hook` 标记，非 doclib 管理的既有钩子拒改。`doclib status` 以「提交门禁」行展示四态（未安装 / 已安装 / 已安装(--strict)），`--json` 载荷含 `hook` 字段；v0.6.1 起 status 另输出「载体建议」行（常见规划载体未声明软提示，`.specify/`、`openspec/`、`specs/`、`.kiro/specs/`）与 `--json` `planning.carrierSuggestions` 字段；v0.6.3 起「反哺」行输出走查覆盖度（`走查 N/12`｜`未留账 ⚠`｜`非法 ⚠`，N 按覆盖集去重——REVIEW R-3，规格见 [guides.md](guides.md)）；v0.8.0 起「记忆」行输出记忆快照双 as-of 与滞后提醒（`⚠ 工作记忆滞后`｜`⚠ 画像可刷新`，规格见 [guides.md](guides.md) AC-17）（check/init 相关规格见 [check.md](check.md) / [init-v2.md](init-v2.md)）。

**自动安装入口（v0.5.1）**：`doclib init` 默认即装 `--strict` 档门禁（根除"忘记安装"风险）——git 仓库自动落位、既有非 doclib 钩子警告跳过（init 不失败）、非 git 目录提示后置安装、`--no-hook` 显式退出；`doclib sync` 幂等补装缺失钩子（在岗不动、档位不越权变更）。显式 `doclib hook` 命令保留全部能力（foreign 抛错语义仅在此生效）。

## 怎么运转

| 形态 | 行为 |
| --- | --- |
| `hook [--strict]` | 钩子写入 `.git/hooks/pre-commit`（0o755）；`--strict` 传导给 check |
| `hook remove` | 仅移除带标记的钩子；无标记既有钩子抛 DoclibError 拒改 |
| `hook --ci github` | 生成 `.github/workflows/doclib-check.yml`，以 `npx 包名@固定版本` 运行 `check --strict`，版本安装时固化保证可复现 |

钩子脚本的关键机制：

- **锚定与自检**：脚本先 `git rev-parse --show-toplevel` 锚定仓库根；随后两道存在性自检——`command -v node` 与 CLI 文件本身，任一缺失则输出自助指引（构建项目或 `doclib hook remove`）至 stderr 后 exit 1（fail-closed + 可诊断）；脚本内变量引用统一 `${CLI}` 花括号形式——POSIX sh 双引号内 `$VAR` 紧邻全角字符会静默吞掉展开（95-lessons 2026-10-26 条），指引中的路径因此保证字节级完整；安装与重装均**无条件恢复可执行位 0o755**（`writeFile` 的 mode 仅新建生效，非可执行钩子会被 git 静默忽略）。
- **路径策略**：CLI 位于仓库内部（DocLib 自身仓库、本地 devDependency 场景）时写入相对路径并统一正斜杠，项目整体移动、重装不失效；CLI 位于仓库外（npx/全局安装场景）时退回绝对路径，与旧版行为兼容。
- **worktree 支持**：`.git` 为文件时解析 `gitdir:` 指针（相对路径按仓库根解析），钩子落位真实 GIT_DIR 的 `hooks/`；install、remove、status 共用同一解析函数，worktree 内 status 同样如实反映。
- **冲突保护**：安装前检测既有钩子，无 `# doclib-hook` 标记则抛 DoclibError，绝不覆盖他人钩子。

## 验收标准

- Given `hook install --strict` When 查看钩子 Then 可执行（0o755）、含标记、含 `--strict`、含 toplevel 锚定与 node/CLI 自检、路径无反斜杠
- Given CLI 位于仓库内部 When 安装 Then 钩子使用相对路径；Given CLI 位于仓库外 When 安装 Then 钩子使用绝对路径
- Given 无 snapshot 的 git 仓库 When `git commit` Then 提交被阻断（非零退出，输出含基线快照指引）；Given snapshot 后 When `git commit` Then 放行（退出码 0）
- Given node 或 CLI 文件缺失 When `git commit` Then 提交被阻断且 stderr 含自助指引
- Given git worktree When install/remove Then 钩子落位于 GIT_DIR/hooks 且 git 识别生效，remove 后消失
- Given 既有非 doclib 钩子 When install/remove Then 抛 DoclibError（无标记拒改）
- Given 非 git 目录 When `hook` Then 抛 DoclibError「当前目录不是 git 仓库」
- Given 三种钩子状态（未安装 / 已安装 / 已安装(--strict)）When `doclib status` Then 文本行与 json `hook` 字段如实反映
- Given `--ci gitlab` When `hook` Then 抛 DoclibError「--ci 仅支持 github」
- Given `--ci github` When 查看 workflow Then 含固化的 `npx 包名@版本 check --strict`
- Given git 仓库 When `doclib init` Then 门禁自动落位（--strict 档）且 init 输出门禁状态行；Given 既有 foreign 钩子 Then init 成功且原钩子保留
- Given 钩子缺失 When `doclib sync` Then 幂等补装(--strict)；Given 在岗 Then 无动作（档位不越权变更）；Given foreign Then 跳过不覆盖
