# Hook 提交门禁健壮化与启用（hook-hardening）

- 日期：2026-10-26
- 状态：规划完成，随本轮执行（RIPER-5：RESEARCH → INNOVATE → PLAN 已批）
- 关联：feature-map #16（强验证体系，hook 为其组成部分）；30-features 规格欠账（_index.md:24 hook 规格待写）
- 来源：用户研究指令「hook 在 git 提交时起效么？功能正常么？确定有效么？还有什么可以优化的地方？」

## 一、目的与效果

1. 让本仓库（DocLib 自身）的 git 提交真正受 `doclib check --strict` 门禁保护（身先士卒）。
2. 修复 hook 机制在研究/冒烟中暴露的健壮性缺口，使其在路径变化、worktree、Windows 等场景下可靠工作。
3. 提升门禁可见性：`doclib status` 显示钩子安装状态，用户不再无从感知门禁是否在岗。
4. 补齐测试欠账：hook 此前无端到端集成测试（git commit 真实触发路径未验证）。
5. 补齐图书馆规格欠账：新建 `30-features/hook.md`（v0.5.0 起标注"待写"）。

## 二、问题点（研究发现）

| # | 问题 | 证据强度 |
| --- | --- | --- |
| P1 | 本仓库 hook 未安装：`.git/hooks/` 仅 sample，`core.hooksPath` 未设，无 husky/prepare 机制 → 提交门禁完全不生效 | 已实测 |
| P2 | `doclib status` 无任何 hook 状态输出（grep hook/钩子 无结果） | 已实测 |
| P3 | 测试缺端到端：hook.test.ts 仅验证文件写入，未验证 git commit 真实触发 | 已实测 |
| P4 | 绝对路径固化：`cliAbsPath()`（hook.ts:10-12）安装时写死 dist/cli.js 绝对路径；项目移动 / fresh clone 未构建时提交被静默全阻断且无指引 | 代码事实 |
| P5 | git worktree 不兼容：`.git` 为文件时 `fs.access` 探测通过，`mkdir .git/hooks` 将 ENOTDIR 裸错误 | 代码事实，未实测 |
| P6 | Windows 兼容性：`/bin/sh` 脚本 + `path.resolve` 反斜杠路径 | 代码事实，未实测 |
| P7 | hook 规格欠账：30-features/_index.md 标注「待写/implemented（规格欠账）」 | 馆内事实 |

## 三、研究结果（代码实际情况）

- **机制本身端到端有效**（临时仓库实测）：`hook --strict` 安装 → 0o755 可执行、含 `# doclib-hook` 标记；无 snapshot 仓库 commit 被 hook 真实阻断（exit 1，fail-closed）；snapshot 后 check 通过则 commit 放行（exit 0，验证报告混入 commit 输出）。
- **单元测试 5/5 绿**（写入/strict 传导/foreign 冲突保护/remove/--ci 版本固化），但集成行为未覆盖。
- 关键约束（决定方案可行性）：
  - `npm test` = build 后跑 dist 产物 → 测试中 `cliAbsPath()`（import.meta.url 相对解析）正确指向 dist/cli.js → e2e 测试可行
  - `cli.ts:159` hook 分派 flags 注入 → 新增行为无需改 CLI 面签名
  - `status.ts` 为 lines.push + json payload 结构（69-86 行）→ 插行与加字段位置明确
- 基线状态：本仓库 `doclib check` 当前通过（治理 100/100，对账 100%）。

## 四、设计方案（INNOVATE 结论）

### 核心决策与理由

1. **路径策略（修 P4/P6）**：新增 `relativeCliPath(root, cliAbs)` 纯函数——cli 位于仓库内部（本仓库 dist/cli.js、本地 devDependency 场景）→ 写相对路径（hook 运行时 cwd 锚定仓库根 `git rev-parse --show-toplevel`），项目移动/重装不失效；cli 在仓库外（npx/全局）→ 退回绝对路径（现状语义）。所有写入脚本的路径统一正斜杠（兼容 Git for Windows）。**向后兼容**，覆盖两个最常见的静默阻断场景。
2. **fail-closed + 可自助诊断（修 P4 体验）**：脚本内两道自检——`command -v node` 与 CLI 文件存在性，缺失时输出明确指引（构建或 `doclib hook remove`）至 stderr 后 exit 1。**否决 fail-open**（放行+警告）：会形成"删掉 dist 即绕过门禁"通道，违背门禁语义。
3. **worktree 支持（修 P5）**：`resolveHooksDir(root)` 解析 `.git` 文件的 `gitdir:` 指针（相对路径按 root 解析），钩子写入真实 GIT_DIR/hooks；install/remove/status 共用该解析。git 对 worktree 的 pre-commit 查找路径即 GIT_DIR/hooks，语义正确。
4. **status 门禁可见性（修 P2）**：`readHookState(root)` 返回 `none/doclib/doclib-strict/foreign` 四态；status text 行「提交门禁:」+ json payload `hook` 字段。
5. **e2e 测试（修 P3）**：阻断（无 snapshot commit 非零退出+含 doclib 输出）/放行（snapshot 后 exit 0）两用例；另补 worktree 集成用例与 `relativeCliPath` 两分支单测。
6. **启用（修 P1）**：代码全绿后 `node dist/cli.js hook --strict`（优化后逻辑一次到位，不先装旧版）。

### 有无备选方案

| 决策点 | 采纳 | 被否备选 | 否决理由 |
| --- | --- | --- | --- |
| 安装时机 | 代码优化后再装 | 立即装旧逻辑 | 事后重装，两次操作 |
| CLI 缺失行为 | 阻断 + 指引（fail-closed） | 放行 + 警告（fail-open） | 绕过通道，违背门禁语义 |
| worktree | 完整解析 gitdir 指针 | 显式报错不支持 | 功能缺失，体验差 |
| 静默/超时选项 | 不做（YAGNI） | `--quiet`/timeout 包裹 | check 输出即报告须可见；macOS 无自带 timeout，成本高收益低 |
| hooksPath 机制 | 不做 | 迁移到 core.hooksPath | 与现有安装机制冲突，改动面大 |
| 修复打包 | 单包一次到位 | 拆分多轮 | 缺口互相关联（status/remove 均依赖 resolveHooksDir） |

## 五、实施清单

```
实施清单：
1. hook.ts：新增 resolveHooksDir + readHookState（导出），重构 install/remove 使用之
2. hook.ts：新增 relativeCliPath（导出）；hookScript 改签名 (root, strict)，
   实现 cd toplevel + node/cli 自检（fail-closed+指引）+ 相对/绝对路径策略 + 正斜杠化
3. hook.test.ts：relativeCliPath 两分支单测 + 脚本自检内容断言
4. hook.test.ts：worktree install/remove 集成测试
5. hook.test.ts：e2e 阻断/放行两用例（-c user.email/user.name，合并捕获输出）
6. status.ts：检测行后插「提交门禁:」行（四态映射）+ json payload hook 字段
7. status.test.ts：已安装(--strict) 与未安装两态断言
8. package.json version 0.5.0 → 0.5.1（核查 CLI_VERSION 来源：读 package.json 则自动生效，硬编码则同步改）
9. npm run typecheck + npm test 全绿
10. 冒烟：worktree install/remove / 非 git 报错 / status 三态显示 / 本仓库真实提交触发门禁
11. 新建 doclib/30-features/hook.md（补规格欠账：三形态行为规格+验收标准，covers=src/commands/hook.ts，格式随 check.md）
12. 30-features/_index.md:24 登记 hook.md；核查根 INDEX.md 是否逐文档登记并补行
13. 50-testing/testing.md 更新用例矩阵（若逐命令登记）
14. progress.md 补记全流程 + AGENTS.md custom 区版本号 → 0.5.1
15. doclib check 通过 → snapshot --note "v0.5.1 hook 健壮化" → 本仓库安装 hook --strict
16. REVIEW 逐项核对（偏差即回 PLAN）
```

## 六、验收标准

- AC-HH1 Given 本仓库 When `git commit` Then pre-commit 触发 `doclib check --strict`，违规时阻断（exit 1）、合规时放行（exit 0）
- AC-HH2 Given cli 位于仓库内部 When 安装 Then 钩子脚本使用相对路径且随项目整体移动不失效
- AC-HH3 Given cli 位于仓库外（npx/全局模拟）When 安装 Then 钩子脚本退回绝对路径，行为与 v0.5.0 兼容
- AC-HH4 Given node 缺失或 cli 文件缺失 When commit Then 提交被阻断且 stderr 含明确指引（构建/remove）
- AC-HH5 Given git worktree When install/remove Then 钩子正确落位于 GIT_DIR/hooks 且 git 识别生效
- AC-HH6 Given 三种钩子状态（未装/doclib/doclib-strict）When `doclib status` Then text 行与 json `hook` 字段如实反映
- AC-HH7 Given 既有非 doclib 钩子 When install/remove Then DoclibError 保护不回归
- AC-HH8 Given npm test Then 现有用例无回归且新增 e2e/worktree/单测全绿
- AC-HH9 Given 执行完成 When `doclib check` Then 治理不降分、hook.md 入馆登记无孤儿
