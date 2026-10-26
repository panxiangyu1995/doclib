---
title: 对话导出工作流
covers:
  - .opencode/commands/planstore.md
  - .claude/commands/planstore.md
status: living
---

# 对话导出工作流（transcripts）

> 把 agent 会话的原始对话导出落进馆内 `98-sessions/` 档案区，与 .plan 规划文档双向关联——蒸馏层之外的原始层保真机制。本卷属工作流指南；分区本身的规范见 [98-sessions/_index.md](../98-sessions/_index.md)。

## 为什么

agent 会话是开发决策的最原始记录：用户为什么改主意、方案为什么被否、哪些尝试失败了——这些在蒸馏成 .plan 规划文档时最容易丢失，而丢失之后无处可找。更严峻的是，主流 agent 工具对会话记录普遍有保留期限：Claude Code 的 transcript 默认 30 天自动清理（`cleanupPeriodDays`），Gemini CLI 同样默认 30 天（`sessionRetention.maxAge`）——不导出，原始记录就永久消失。因此需要一条稳定的工作流：会话收尾时把对话导出落进图书馆，与 .plan 文档互相指认，让「很久以后想找回某个决策的来龙去脉」永远有据可查。

## 是什么

一条「会话 ↔ 馆内档案」的双向关联机制，由三部分构成：

1. **馆内落位**：`doclib/98-sessions/` 档案区——图书馆对 F9 双轨边界的唯一白名案例外（ADR #19）。文件命名 `<slug>-<yyyymmdd>-<NN>.md`，frontmatter 五要素（`type: transcript`、`tool`、`session-id`、`date`、`plan-slug`）。
2. **蒸馏纪律**：planstore 指令（`.opencode/commands/` 与 `.claude/commands/` 双侧同文）规定规划文档的七栏目结构与反遗漏自检五项（用户纠正与拍板理由、被否方案及理由、失败尝试、验收口径变更、跨会话前情）；踩坑的入馆去向经 progress.md 条目末「教训:」处置位登记——check「教训账缺口」执法（v0.6.2，引用 `95-lessons[@<dir>] <date> · <标题>` 存在性核对）。
3. **收尾三动作**：导出提醒 → 落位补元数据 → .plan 文档头部「会话导出登记」段回写文件名。两层互为校验：.plan 写漏了回查原始记录；原始记录的结论由 .plan 蒸馏沉淀。

## 怎么运转

会话收尾时，按所用工具选择导出方式，将产物落位 `doclib/98-sessions/` 并补齐 frontmatter：

- **OpenCode**：会话内输入 `/export`（快捷键 ctrl+x x），产物为 Markdown 并在编辑器打开——另存到 `doclib/98-sessions/<slug>-<yyyymmdd>-<NN>.md` 后补 frontmatter。另有 CLI `opencode export <sessionID>` 输出 JSON（信息最全但需手工转写，适合补捞）。
- **Claude Code**：会话内输入 `/export <文件名>` 直写文件（v2.1.280+），落位后补 frontmatter。注意：官方明确警告 transcript JSONL 内部格式随版本变化，不要写脚本直接解析——导出走官方 `/export`。
- **Codex CLI**：会话内输入 `/export <文件名>` 直写 Markdown 文件，落位后补 frontmatter。
- **Aider**：原生即 Markdown——`--chat-history-file` 默认 `.aider.chat.history.md`（可用环境变量 `AIDER_CHAT_HISTORY_FILE` 指定路径），复制到本区并按会话段裁切补 frontmatter。
- **Gemini CLI**：当前无官方导出命令（会话存 `~/.gemini/tmp/<project_hash>/chats/` 且 30 天清理）——暂以复制粘贴会话要点替代，上游 PR 候选（见参考节）。
- **Cursor**：闭源无导出通道——仅能人工复制粘贴，或使用第三方只读工具；导出件须在 frontmatter 标注 `tool: cursor` 与「非原生导出」说明。

落位后三步收尾：frontmatter 五要素补齐（`session-id` 取工具原生会话 ID，OpenCode 可从 `opencode export` 输出或数据库获得）→ 对应 .plan 文档头部登记导出文件名 → 敏感信息自查（对话中出现过密钥/token/凭据时提醒用户，并在 .plan 导出登记处注明警示——原文不代改，保持档案原始性）。

## 怎么验收

- AC-TW1 Given 会话结束 When 执行收尾三动作 Then `98-sessions/` 新增导出件（命名与 frontmatter 五要素齐备）且对应 .plan 文档头部有导出登记
- AC-TW2 Given 导出件落位 When `doclib check` Then 不触发文体/污染违规（98-sessions 全豁免）
- AC-TW3 Given 双侧 planstore.md When 逐字节对比 Then 一致
- AC-TW4 Given `doclib init` 新馆 When 完成 Then `98-sessions/_index.md` 模板在馆（规范随骨架下发）

## 参考

- 分区规范与命名细节：[98-sessions/_index.md](../98-sessions/_index.md)
- 架构决策：[ADR #19](../10-architecture/decisions.md)（背景含 30 天清理实证与被否备选）
- 批量回捞（M2，feature-map #34）：`doclib transcript` 命令——OpenCode SQLite 渲染器起步（按 cwd 过滤、干跑默认 + `--apply`、未归档会话检测、`--redact` 可选）；Claude Code 宽容解析随格式探测降级。**生态路线**：Gemini CLI 为开源（Apache-2.0）上游 PR 候选（补 `/export` 或 CLI export）；Cursor 闭源无 PR 通道，长期仅人工轨。
