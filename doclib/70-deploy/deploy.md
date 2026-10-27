---
title: 部署
covers:
  - package.json
  - LICENSE
  - .github/workflows/release.yml
  - scripts/copy-assets.js
status: stable
---

# 部署

> DocLib 以 npm 包形态到达用户：tag 触发的 Actions 自动发版链 + provenance 供应链凭证——发布即验证（test 门禁内嵌流程），回滚走 dist-tag 指针（forward-only）。

## 为什么

选 npm 分发 + GitHub Actions tag 触发：npx 零安装即用是 agent 场景的第一体验；tag 触发保证"发布内容 = 已验证内容"（CI 内跑完整测试后才 publish）；provenance（OIDC）满足供应链审计。

## 是什么

交付物 = npm 包 `@panxiangyu1995/doclib`（bin: doclib，运行时依赖仅 ignore，assets 构建期内嵌）；发版通道 = tag 触发的 GitHub Actions；应急通道 = 本机 publish。形态细节见下节。

## 发布形态

- npm 包 **@panxiangyu1995/doclib**（bin=`doclib`，命令名不变）——任意 repo `npx @panxiangyu1995/doclib init` 一键进入
- **新包首发走 npm staging 审批**（上传成功后 0.0.0-stage，maintainer 网页/CLI 转正为正式版本）；已存在的包后续版本 direct 发布无需审批
- 运行时依赖四个：`ignore`（gitignore 语义）、`jsonc-parser`（引导/配置 JSONC 容错解析）、`picomatch`（glob 匹配）、`web-tree-sitter`（`graph` 的代码解析）；assets（templates/guides/skills）经 copy-assets 进入 `dist/assets`，发布包内相对 import.meta.url 解析
- npm 现况：仓库版本 **0.8.0**，npm `latest` 曾长期停在 **0.4.0**（v0.4.0 后 14 个 commit 未发布）——发版前须核对 `npm view @panxiangyu1995/doclib version` 与 `package.json` 一致

## 怎么运转

## 构建与门禁

- `npm run build`：**先清 dist**（node -e rmSync，防孤儿残留）→ tsc → copy-assets
- `prepublishOnly`：typecheck + 全量测试——发布前强制门禁

## 发布流程（GitHub Actions 自动发版）

1. 本地确认：`doclib check` 治理分 A、测试全绿
2. `npm version patch|minor|major`（package.json 与 git tag 同步）
3. `git push --tags` → push tag `v*` 触发 `.github/workflows/release.yml`：
   - npm ci → npm test → `npm publish --provenance`（id-token OIDC 供应链凭证）
   - 凭证：repo Secret `NPM_TOKEN`（granular token，仅 doclib 包读写）
4. npmjs.com/package/@panxiangyu1995/doclib 人工确认（版本/README/provenance 徽章）

## 用户前置操作（首次发布）

1. `npm login`（浏览器认证）+ Account Settings 开启 2FA
2. npmjs.com → Access Tokens → Granular Token（doclib 包读写）→ GitHub repo Settings → Secrets → `NPM_TOKEN`
3. 应急通道：本机登录态可用时 `npm publish --provenance`（正常走 tag 触发）

## 版本策略

- 0.x：快速迭代期（语义化 minor=功能/patch=修复）
- 1.0：结构版本与 API 稳定承诺（structureVersion 与 CLI 版本双轨追踪）
- tag `v*` 与 package.json 版本强一致（npm version 保证）

## 回滚

- npm：`npm dist-tag add @panxiangyu1995/doclib@<旧版> latest`（latest 指针回退；已发布版本不可撤回——forward-only 语义）
- 代码：revert 后按发布流程重发新版本
