<!--
标题格式：`类型: 描述`（如 `feat: 新增 xxx`）。
类型闭集：feat / fix / docs / style / refactor / perf / test / build / ci / chore / revert。
完整约定见 CONTRIBUTING.md（§1 参与方式、§2 AI 使用政策）。
-->

#### 描述

<!-- 简要说明本次改动 -->

#### 动机与上下文

<!-- 代码 PR 必须关联既有 issue（`Closes #编号`）；纯文档纠错/翻译可注明「文档直提」 -->

Closes #

#### 本地验证

- [ ] `npm run typecheck` 通过
- [ ] `npm test` 全绿（新增测试文件已加进 package.json 显式清单）
- [ ] `doclib check --strict` 无违规

#### AI-Assistance

<!-- 按 CONTRIBUTING.md §2 AI 使用政策：所有 AI 使用必须在此如实披露；未披露的 PR 可能被无警告关闭 -->

- [ ] 是
- [ ] 否

若「是」，说明工具与程度（例：Claude Code 起草实现，人工逐行复核并测试）：

#### 自查清单

- [ ] 改动触及的知识已实时入馆（doclib/ 对应卷）
- [ ] 改动 vendor/codegraph/ 的已登记 FORK-NOTES.md
- [ ] 改动 assets/ 的已 `npm run build` 并 `doclib sync`
- [ ] CLI 行为改动已同步对应 skill
- [ ] 我已读并能解释我的每一行改动（评审会提问验证）
- [ ] 无夹带无关改动（发现的其他问题单独开 PR）
