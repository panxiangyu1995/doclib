---
title: 会话档案索引
covers: []
status: living
type: index
---

# 会话档案区（98-sessions）

> agent 对话原始记录档案区——蒸馏层（规划载体）之外的原始层，供长期回查。

## 定位

本区存放 agent 会话的对话导出记录（transcript），是图书馆对 F9 双轨边界的**唯一白名案例外**（ADR #19）：

- 规划载体（.plan 等）是**蒸馏层**——按 planstore 指令沉淀目的、问题点、研究结果、方案与验收标准；
- 本区是**原始层**——完整保留对话中的人机往来与关键工具调用，蒸馏遗漏时可回查。

两者互为校验：.plan 写漏了可回查本区原始记录；本区文件只增不改（档案语义）。

## 命名与登记规范

- 文件名：`<slug>-<yyyymmdd>-<NN>.md`——slug 与对应 .plan 规划文档一致；同一 plan 跨多会话以 NN 序号区分。
- frontmatter 五要素：`type: transcript`、`tool`（opencode/claude-code/codex/aider/…）、`session-id`（工具原生会话 ID）、`date`（导出日期）、`plan-slug`（关联规划 slug）。
- 双向关联：对应 .plan 文档头部登记本区导出文件名；本区 frontmatter `plan-slug` 回指规划。

## 导入通道

- 人工轨：会话内使用工具原生导出，落位本区后补 frontmatter 五要素。逐工具操作细节见 [对话导出工作流](../40-guides/transcripts.md)。
- 批量轨（规划中，feature-map #34）：`doclib transcript` 命令自动回捞（OpenCode 起步）。

## 注意事项

- 本区豁免文体门禁与污染检查——对话原文不改写，保持原始性。
- 导出前自查敏感信息（密钥/token/凭据）——对话中可能出现过，落馆即入 git 历史。
- 会话记录在部分工具侧默认 30 天自动清理（Claude Code / Gemini CLI），导出落馆是唯一保久手段。

## 本区文档

| 文档 | 摘要 | 状态 |
| --- | --- | --- |
| [transcript-archive-20261026-01.md](transcript-archive-20261026-01.md) | 对话档案区立项与 M1 会话记录（session-id 待 /export 回填） | archived-session |
| [guide-memory-snapshot-20261027-01.md](guide-memory-snapshot-20261027-01.md) | 记忆快照与协作者画像反哺会话记录（RIPER-5 全模式 + 字符集根治 + REVIEW R-1..R-4 全修） | archived-session |
| [guide-constitution-20261026-02.md](guide-constitution-20261026-02.md) | 宪法反哺（#37）与教训实时性（#38）会话记录（ses_e88a…） | archived-session |
| [planning-express-20261027-01.md](planning-express-20261027-01.md) | 规划直通车（#39）会话记录：调研→拍板→落地→审查全程（ses_e850…） | archived-session |
