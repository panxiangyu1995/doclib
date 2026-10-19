---
name: doclib-setup
description: DocLib 安装与适配确认。当刚在项目中运行 doclib init（--agents），需要确认 skills/引导文件/版本戳落位正确、补充项目定制内容、或更新安装（doclib sync）时使用。
---

# doclib-setup · 安装与适配确认

## 使命

确保 DocLib 在目标 repo 中正确落位：skills 到位、引导文件区域契约正确、版本戳新鲜、定制区承载项目专属内容。

## 何时使用

- `doclib init --agents ...` 之后首次进入项目
- 升级后（status 提示引导过期）需要重新同步时
- 新 agent 需要接入（适配表扩充）时

## 工作流

1. **落位确认**：
   - `doclib status` 读引导行（CLAUDE.md ✓ / AGENTS.md ✓）与引导预算
   - skills 已落位到各 agent 目录（.claude/skills/、.opencode/skills/ 等）——按 agent 的 skills 加载方式逐个确认可用
2. **定制区补充**（引导文件的 custom 区，两文件保持一致）：
   - 项目专属工作流、注意事项、术语别名
   - 本仓库治理状态（载体声明、遗留问题）
   - 新规则先自问"删掉会犯错吗"——不会则不进引导（入 skill/入馆）
3. **同步**：规则区由 `doclib sync` 再生（幂等，定制区保留）；无戳文件永远跳过（手工内容不受保护性跳过保护，需 agent 手工合并）
4. **版本戳检测**：status 提示过期 → 运行 `doclib sync`；任务书收尾固定检查引导版本

## 纪律

- 引导文件 managed 区由 CLI 全权管理——**agent 不得手改**（会被 sync 覆盖）
- 裁剪判据：删掉这条 agent 会犯错吗？不会则不入引导
- 关键规则单点强调（多处 IMPORTANT 全部失效）
