# npm 发布工程：发布通道、包元数据、交互补齐与 CI 自动发版

- 日期：2026-10-19
- 状态：planned（待执行；发布动作等用户侧 U1–U3 完成）
- 关联：PRD v0.25（F10）｜feature-map #7｜批次 C
- 规划载体：本对话（RIPER-5 研究/创新/计划）
- 拍板记录：五项决策由用户授权按"长远可持续发展"代为拍板（发布通道=Actions/版本起点=0.4.0/license=MIT/包内容=精简/账号 2FA=用户侧）

## 一、目的与效果

达成 PRD F10 的核心承诺——**任意 repo 中 `npx doclib init` 一键进入**：

1. 包名 `doclib` 占位 npm 生态（心智与包名先手）
2. 发布可重复可持续：tag 即发布（GitHub Actions 自动 test→publish→provenance），不绑定个人机器
3. 发布物干净：无孤儿构建残留、元数据完整（license/repository/keywords）、发布前门禁（prepublishOnly）
4. 冷包验收：tgz 全新目录安装后全流程可用（init/plan/snapshot）

## 二、问题点

1. **dist 孤儿残留**：`dist/templates/library.js` 为 v0.1 时代 TS 模板编译产物（src 源已删、零引用），tsc 不清理孤儿——会随发布带出死代码
2. 包元数据缺失：无 license（publish 警告+法律语义缺失）、无 repository/homepage（npm 页面无源）、无 keywords（搜索不可见）、无 prepublishOnly（发布前无门禁）
3. F9 交互尾巴：载体声明仅有 --planning 参数，交互问卷缺 askPlanning（Q14 拍板"交互+参数双形态"）
4. 发布通道未建：.github/workflows/ 为空（doclib-check.yml 从未落盘），无自动发版
5. 用户侧未就绪：npm 本机未登录（E401）、2FA 状态未知、CI token 未配

## 三、研究结果

- `npm view doclib` E404——**包名可用**（备选 doclib-cli 亦空）
- `npm pack --dry-run`：58.7kB / 194kB / 80 文件；`dist/assets/{templates,guides,skills}` 完整入包
- 路径解析验证：`assetsRoot()` 与 `version.ts` 均基于 import.meta.url 相对解析——发布包内路径正确（dist/core/assets.js→dist/assets；dist/core/version.js→包根 package.json）
- 依赖仅 ignore；engines node>=18；package-lock.json 已存在（npm ci 可用）
- `git remote` = github.com/panxiangyu1995/doclib（repository 字段可直接填；Actions 运行前提满足）
- `.github/workflows/` 空——release.yml 为新建（无可参照文件，按 npm provenance 官方模板设计）
- npm whoami E401——登录态缺失（用户侧）

## 四、代码实际情况

- `scripts/copy-assets.js`：assets→dist/assets + skills→dist/assets/skills（发布包结构与 assetsRoot 读取一致）
- `src/core/prompts.ts`：isInteractive（TTY+非 CI）/askAgents/askGuide 两问卷先例——askPlanning 照此模式
- `src/commands/init.ts`：opts {force, agents, guide}，交互区 `if (!x && isInteractive()) x = await askX()`——planning 接线点明确（state.planning 写入已存在，v0.25）
- package.json：files=["dist","README.md","AGENTS.md"]、scripts 无 clean/prepublishOnly、无 license/repository
- `doclib/70-deploy/deploy.md`：现状"npm 包配置已就绪（阶段 1）+待办 #7"——本轮重写为实际发布流程
- 测试 52/52；check 治理 100/100 (A)；工作区已在 aff328e 提交清零

## 五、设计的方案

### 1. 构建修复
- build script 前置 clean：`node -e "require('fs').rmSync('dist',{recursive:true,force:true})"`（跨平台零依赖）——孤儿残留消失于每次构建

### 2. 包元数据
- `license: "MIT"`（可持续拍板：工具类最大公约数，与 F10 一键进入意图一致）
- `repository`/`homepage`/`bugs` → github.com/panxiangyu1995/doclib
- `keywords`: documentation/agent/claude/knowledge-base/spec-driven
- `files`: ["dist", "README.md"]（移除 AGENTS.md——对安装者零价值）
- `prepublishOnly`: "npm run typecheck && npm test"（发布前门禁）
- 测试文件入包**接受**（排除需增构建复杂度，收益 ~20KB——去复杂化）

### 3. F9 交互尾巴
- prompts.ts 新增 `askPlanning()`（"规划载体路径（逗号分隔，回车=.plan/）"）
- init.ts：`!planningSpec && isInteractive()` → askPlanning

### 4. CI 自动发版
- 新建 `.github/workflows/release.yml`：push tag `v*` → npm ci → npm test → npm publish --provenance
- permissions: { contents: read, id-token: write }（provenance OIDC）；NODE_AUTH_TOKEN: secrets.NPM_TOKEN

### 5. 冷包验收（F10 核心体验）
- npm pack → 全新临时目录 `npm install <tgz>` → `npx doclib init --planning .plan` → `plan --bootstrap` → `snapshot` → `status`——全流程通过才算发布就绪

### 6. 发布日流程（固化）
```
代码合入 → check 治理分 A → npm version patch/minor → git push --tags
  → Actions 自动 test+publish（provenance）→ npm 包页人工确认
```

## 六、备选方案

| 决策点 | 采用 | 被否备选 | 理由 |
| --- | --- | --- | --- |
| 发布通道 | Actions tag 触发 | 本地 npm publish | 可重复+provenance+不绑个人机器；本地保留为应急通道（U1 登录后可用） |
| 版本起点 | 0.4.0 直接发 | 等批次 D 尾巴 | 早发布早反馈；生态位占位宜早；0.x 语义允许快迭代；F14 用发布版工具跑更真实 |
| license | MIT | ISC/Apache-2.0/闭源 | 工具类最大采用率；闭源直接违背产品意图 |
| 测试文件 | 接受入包 | 构建脚本排除 | 排除收益 ~20KB vs 复杂度增加——去复杂化 |
| clean 实现 | node -e 内联 | rimraf 依赖/仅 Unix rm | 零依赖+跨平台 |
| 发布动作 | tag 触发 | 手动 workflow_dispatch | tag 即语义（v0.4.0↔包版本强一致）；dispatch 可作为 workflow 手动兜底（后续可加） |
| AGENTS.md | 移除出包 | 保留 | 安装者价值为零；repo 内保留不受影响 |

## 七、实施清单

1. package.json：build 加 clean + license/repository/homepage/bugs/keywords/files/prepublishOnly
2. 新建 LICENSE（MIT，Copyright (c) 2026 panxiangyu1995）
3. prompts.ts 新增 askPlanning；init.ts 交互接线
4. 新建 .github/workflows/release.yml（tag 触发 + provenance）
5. rm -rf dist && npm run build：确认 dist/templates 孤儿消失 + assets 完整
6. typecheck + test 全绿
7. npm pack 冷装冒烟（新目录 tgz 安装 → init/plan/snapshot/status 全流程）
8. doclib/70-deploy/deploy.md 发布流程重写（含用户前置操作）
9. PRD v0.26 修订记录 + F10 状态标注
10. feature-map #7 → in-progress；progress.md 补记；config.md build 链更新
11. git commit（发布工程就绪）
12. 输出用户操作卡（U1–U3 命令级）与首发指令（git tag v0.4.0 && push origin v0.4.0）

## 八、用户侧操作卡（工程侧完成后的发布前提）

| # | 操作 | 精确步骤 |
| --- | --- | --- |
| U1 | npm 登录 | 终端 `npm login`（浏览器完成认证）；验证 `npm whoami` |
| U2 | 开启 2FA | npmjs.com → Account Settings → Two-Factor Authentication → 启用 |
| U3 | CI 凭证 | npmjs.com → Access Tokens → Generate New Token（Granular，勾选 doclib 包读写）→ 复制 → GitHub repo → Settings → Secrets and variables → Actions → New repository secret：名称 `NPM_TOKEN` |
| U5 | 署名确认 | LICENSE 文件 Copyright 行（当前 panxiangyu1995，可改） |
| 首发 | 打 tag 发版 | `git tag v0.4.0 && git push origin v0.4.0` → Actions 自动 test+publish → npmjs.com/package/doclib 人工确认 |
