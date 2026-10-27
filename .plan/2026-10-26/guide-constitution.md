# 开发宪法反哺升格与 12 卷走查执法（guide-constitution）

- 日期：2026-10-26
- 状态：规划完成，用户已拍板四项 + 追加两预案，执行中
- 关联：feature-map #37（本轮登记）｜#32 引导图书馆反哺（v0.6.0 链路基座）｜#36 教训账缺口（同构执法先例）｜ADR #18/#10/#21｜30-features/guides.md·check.md｜PRD v0.37→v0.38
- 来源：用户指令「进入研究模式，我们刚更新了图书馆反哺claude.md和agents.md，我认为其中一些重要的架构规则还有ui/ux规则，还有sql等开发性的规则应该反哺进2份文件作为开发规则的宪法和铁律，这样就不容易产生如果切换agents或者ai开发模型或者换人接受项目之后产生的不同的编码习惯或者一个项目多个ui规则或者等等有分歧的事情存在。所以需要你帮我考虑好最佳开发规范的宪法和铁律涉及哪些内容？怎么反哺到2份文件中？怎么确保没有遗漏重要的特殊的规则信息？」
- 规划载体：本对话（RIPER-5 RESEARCH → INNOVATE → PLAN → EXECUTE；planstore 纪律落盘）
- 关联产物：`src/core/guides.ts` · `src/core/ledger.ts` · `src/core/check.ts` · `src/commands/{check,status}.ts` · `src/core/guides.test.ts` · `.doclib/guide-project.md` · `AGENTS.md`/`CLAUDE.md`（custom 区） · `skills/{doclib-build,doclib-accept,doclib-audit}/SKILL.md` · `doclib/30-features/{guides,check}.md` · `doclib/10-architecture/{decisions,prd}.md` · `doclib/INDEX.md` · `doclib/20-modules/_index.md` · `doclib/50-testing/testing.md` · `package.json`

## 会话导出登记

- 导出文件名：doclib/98-sessions/guide-constitution-20261026-01.md（已落位 2026-10-26，#37 收尾时点切片，session ses_e88a…）＋ **guide-constitution-20261026-02.md（本次会话终局切片，用户执行 /export 后按此落位，frontmatter 五要素同 01）**——同 plan 同 session 二次导出按 planstore 递增 NN
- 敏感信息自查：已自查——本会话无密钥/token/凭据（仅文件路径、代码与 CLI 输出）；无警示

## 跨会话前情

| 前情 | 文件指针 | 依赖点 |
| --- | --- | --- |
| 引导图书馆反哺三区契约（#32） | `.plan/2026-10-26/guide-feed.md` + `doclib/30-features/guides.md` + ADR #18 | 本轮全部改动复用其注入链路/簿记单源/双闸，不另起炉灶 |
| 教训账缺口不变量（#36） | `.plan/2026-10-26/lesson-gap-enforcement.md` + ADR #21 | γ 档执法与「存在性判定 + 存量缓释（缺席 soft）」设计同构 |
| 引导治理四纪律（#30） | ADR #10（Q37 三层分流/Q38 硬预算/裁剪判据） | 宪法条目判据「删掉会犯错吗」「冷启动每天都要知道吗」直接沿用 |
| 本仓基线 v0.6.2（snap-069） | `doclib status` · 反哺 snapshot 58 · 指纹 3f6fcdd8bf5f | 双闸当前全绿，本轮重蒸馏后指纹更新 |
| 外部最佳实践调研 | gh api repos/openai/agents.md（AGENTS.md 规范 + 其自身仓实例）· ADR #10 内 context7 Claude Code 官方调研印证 | 禁区/测试指令为规范必备项；「简洁+指针化」共识 |

## 一、目的与效果

1. 图书馆内「架构铁律 / UI/UX / SQL 迁移 / 测试验收」等开发性规则经蒸馏反哺进 `CLAUDE.md`+`AGENTS.md`，成为**开发宪法与铁律**——切换 agent、切换 AI 模型、换人接手时编码习惯不漂移、UI 规则不分裂、SQL 纪律统一。
2. 反哺区「硬规则」段升格为「开发宪法」段（五段重组，段数不变）：宪法六篇 × 取材源 × 每条附馆内路径指针，细则在馆（真相单源不破坏）。
3. 防遗漏一步到位（用户拍板 γ）：簿记 frontmatter 增 12 卷走查账（`volumes-fed` + `volumes-na` 双列表），check strict 强校验——走查账存在则卷覆盖可确定性判定（12 卷闭集）。
4. 源项目实况混乱（如命名混用）与项目原有规则文档（CONTRIBUTING 等）两大边界情形有显式预案（实况-规范分离三原则 + 双向裁决链），防止反哺固化混乱或形成双宪法源。

## 二、问题点（研究实证）

| # | 问题 | 证据 |
| --- | --- | --- |
| P-1 | 五段蒸馏取材源缺口：「硬规则」段教学源仅 conventions+95-lessons，架构原则/迁移纪律/UI/测试/验收类卷无反哺通道 | `skills/doclib-build/SKILL.md:28`、`skills/doclib-accept/SKILL.md:36` 逐行核对 |
| P-2 | docs-hash 双闸只回答「馆变了没有」，不回答「蒸馏漏没漏卷」 | `src/core/check.ts:158-170`（仅指纹比对）+ `30-features/guides.md` 双闸定义 |
| P-3 | 注入为自由文本整体注入，五段结构机器不强制 | `src/core/guides.ts:48 applyProjectRegion` |
| P-4 | 预算 soft 不阻断：managed 150 / project 50 行 | `src/core/guides.ts:20,182`；本仓 56/150 + 24/50，project 余量约 26 行 |
| P-5 | 本仓 80-design 显式 not-applicable、migrations 账本空置——UI/SQL 类在「任意项目」语境才有实体，本仓走 N-A 显式声明 | `doclib/80-design/README.md:9`、`doclib/10-architecture/migrations.md:10` |
| P-6 | custom 区与 project 区双写：「约定」行（ESM/strict/注释/DoclibError）真相在馆（conventions.md）却写在 custom 区；「验证」行（冒烟链）真相在馆（testing.md）——违背归属判据与单点强调纪律（ADR #10） | `AGENTS.md:92-93` vs `doclib/40-guides/conventions.md`、`doclib/50-testing/testing.md` |
| P-7 | 本仓簿记缺第五段「模块地图」（五段只写了四段） | `.doclib/guide-project.md` 全文核对 |
| P-8 | frontmatter 解析器仅支持扁平 key + 内联列表，无嵌套 map | `src/core/frontmatter.ts:8-44` → 走查账设计为 `volumes-fed`/`volumes-na` 双列表 |
| P-9 | 纯自觉执法已两次实证失效（教训入档、progress 补记） | ADR #20 背景、ADR #21 背景——γ 档选择的直接依据 |

## 三、研究结果（代码与外部）

**代码锚点**：`src/core/guides.ts`（GuideProject 类型/readGuideProject 三态解析先例/applyProjectRegion 整体注入/writeGuides 合并保 custom）；`src/core/check.ts:156-170`（guide-stale + guide-feed-stale 判定段=走查校验插入点）；`src/core/ledger.ts:44-58`（CheckFindingKind union=违规类注册点）；`src/commands/check.ts`（kindLabel + kinds 数组）；`src/commands/status.ts:37-50`（反哺行）；`src/core/place.ts:9 LIBRARY_VOLUMES`（12 卷闭集=走查枚举权威；guides.ts 不引 place.ts 防反向耦合，校验逻辑放 check.ts）；notices=soft 通道（toolchain-suspect 先例）。

**外部最佳实践**：agents.md 官方规范推荐结构=开发环境提示/测试指令/PR 指令；openai 自身仓 AGENTS.md 含编码约定+命令表+负向禁区（「勿在会话中跑 build」）；Anthropic CLAUDE.md 实践（ADR #10 已调研并沉淀裁剪判据）印证「简洁+命令+风格+测试+禁区」必备项。共性结论：缺口恰在「项目特有架构原则/UI/SQL 纪律」类——本轮补齐。

## 四、方案设计

### 4.1 五段重组与宪法六篇

「硬规则」升格「开发宪法」，六篇 × 取材源（每条一行 + 馆内路径指针）：

| 篇 | 取材源 | 本仓裁决 |
| --- | --- | --- |
| 架构铁律 | 10-architecture/overview + design + ADR + 20-modules | fed（三原则/commands-core 边界/vendored 纪律） |
| 编码铁律 | 40-guides/conventions + 95-lessons | fed（现硬规则段平移） |
| 数据与迁移铁律 | 10-architecture/migrations + data-model | N-A（账本空置，显式一行） |
| UI/UX 铁律 | 80-design + ui-assets 登记册 | N-A（显式一行） |
| 测试与验收铁律 | 50-testing + 30-features | fed（node:test/显式登记教训/冒烟链） |
| 禁区 | 各卷红线蒸馏 | fed（禁直改反哺区/禁改 vendored 源/禁重依赖/无账不答） |

外加「规则唯一事实源指针」一行（馆无规则→提案入 ADR/规格，禁止即兴发明——治「一个项目多个 UI 规则」的根）。预算验算：约 28-34 行 / 50 ✓。

### 4.2 走查账契约（γ 执法）

- 簿记 frontmatter：`volumes-fed: [卷名,...]`（已蒸馏）+ `volumes-na: [卷名,...]`（显式不适用；99-archive 恒 N-A）
- 三态：合法对象 / `"invalid"`（存在但非列表）/ `null`（缺席）
- 分层执法：缺席→soft notice（旧簿记零破坏，对齐 ADR #21 epoch 先例）；存在→strict 强校验（未知卷名 / fed∪na≠12 卷闭集 / 两集重叠 → 新违规类 `guide-feed-walk`）；invalid→check finding + status 降级 ⚠；sync 注入面对 invalid 不阻断（正文注入不受影响）
- 机器执法边界：「哪条算混用」是语义判断不做确定性检测（确定性语义分层铁律）——语义面归 skills 裁决三问 + audit 抽查

### 4.3 预案一：实况-规范分离（用户追加矛盾：「代码本身存在 2 种混用的命名方式，蒸馏出来也是的，反哺不就矛盾重重了么」）

1. **应然非实然**：宪法条目只写裁决后规范，实况（含混用现状）留馆内对应卷记载
2. **裁决必留痕**：发现多套并存→先裁决（选一套为准）→结构性裁决入 ADR，轻量裁决宪法条目行内标注「现状混用，以 X 为准，存量渐进收敛」；反哺蒸馏是宪法质量闸门，发现馆内缺陷按回灌飞轮先修馆再蒸馏（F14 同构）
3. **无法裁决须显式豁免**：vendored/第三方区域写「X 豁免于本规则」，显式豁免优于模糊规则

### 4.4 预案二：项目原有规则文档（用户追加矛盾：「项目本身就有规定宪法和架构等规则」）

1. **原有规则先入馆，馆是唯一宪法事实源**：门面惯例文件物理保留原位、馆内卷 covers 锚定+摘要（overview covers README 同构）；非门面规则文档收编入馆
2. **双向裁决原则**（F14 目的铁律同构）：描述性分歧（文档说 X 存量做 Y）→实况优先；规定性规则（新代码必须 X）→文档声称优先；裁决结果留痕（同预案一第 2 条）
3. **事实源指针句**收敛双宪法源为单源
4. **先馆后反哺**：外部规则未入馆→先入馆再蒸馏，禁止跳馆转写

## 五、备选方案与被否理由

| 备选 | 否决理由 |
| --- | --- |
| 机器自动蒸馏宪法（sync 扫馆生成） | ADR #18 已否机器蒸馏：「重要性」语义判断做不准；「何为铁律」恰是纯语义裁决 |
| 宪法细则全文入引导 | 预算爆炸 + 双真相源 + 违非克隆铁律精神 |
| 新命令独立管理宪法 | 反哺链路已就绪（#32 刚验收），纯冗余 |
| 宪法入 managed 模板 | managed=跨项目通用工作流；项目宪法属项目知识，归属判据（真相在馆→project 区）明确 |
| 六段制（保留硬规则+新增宪法） | 两段重叠、预算压力、教学面改动更大（Q-A 用户拍板五段重组） |
| 仅 α 纯教学走查 | P-9 两次实证纯自觉失效（用户拍板一步到位 γ） |
| β 走查账+soft 不 strict | 同上（用户明确选 γ） |
| N-A 零提及省行数 | 静默省略违背「不适用须显式声明」纪律（Q-D 用户拍板显式一行） |
| 缺走查账即 strict 违规 | 破坏存量簿记（违背 ADR #3/#21 存量零破坏先例）→ 缺席 soft、存在 strict |
| 走查校验放 guides.ts | 需引 place.ts LIBRARY_VOLUMES，底层模块反向耦合 → 放 check.ts（已具备导入面） |

## 六、用户拍板记录

- Q-A 宪法段形态：**五段重组**（提问工具应答原文：「五段重组（推荐）」）
- Q-B 执法强度：**一步到位 γ**（应答原文：「一步到位 γ」）
- Q-C custom 去重：**随本轮一并做**（应答原文：「随本轮一并做（推荐）」）
- Q-D N-A 呈现：**正文显式一行**（应答原文：「正文显式一行（推荐）」）
- 追加矛盾一（实况混乱）：「现在存在一个矛盾啊，大哥比方：如果代码本身就是存在着2中混用的命名方式，那么图书馆蒸馏出来也是的，这样再反倒2份文档中不就矛盾重重了么？这个我们要有预案处理方案，不是么？」→ 预案 4.3
- 追加矛盾二（原有规则文档）：「如果原本的项目本身就有规定宪法和架构等规则，我们的方案也要有处理办法。」→ 预案 4.4
- 执行授权：用户下发 planstore 三段纪律（规划落盘/反遗漏自检/收尾三动作）即开工信号

## 七、实施清单（23 步）

1. 创建规划载体（本文件）+ doclib check 对账
2. feature-map 登记 #37 planned + progress.md 开工补记（教训处置位）
3. src/core/guides.ts：GuideProject 增 volumesWalk 三态；readGuideProject 解析 volumes-fed/volumes-na；导出覆盖度辅助
4. src/core/ledger.ts：CheckFindingKind 增 "guide-feed-walk"
5. src/core/check.ts：走查校验（invalid→finding；未知卷/未全覆盖/重叠→finding；缺席→soft notice）+ notice kind 注册
6. src/commands/check.ts：kindLabel 增「走查账违规」+ kinds 数组插入
7. src/commands/status.ts：反哺行增走查覆盖度（走查 N/12｜未留账 ⚠｜非法 ⚠）
8. 测试：guides 解析三态 + check 四场景（未知卷/缺卷/重叠/缺席 notice）+ status 载荷断言
9. npm run typecheck + npm test 全绿（307 → 增量后全绿）
10. 临时目录冒烟：init → 带走查账簿记 → sync → check 绿 → 篡改走查账 → --strict exit 1 → 修复归零；人工核验 N-A 行与事实源指针句
11. 30-features/guides.md：五段重组描述 + 宪法六篇表 + 走查账契约 + AC-9~11 + 「宪法裁决纪律」小节
12. 30-features/check.md：违规分类表 +1（十二类）+ soft 通道说明 + AC
13. decisions.md ADR #22 + prd.md v0.38（F 条目顺延）
14. INDEX.md + 20-modules/_index.md + 50-testing/testing.md（计数/摘要/职责行/用例数）
15. 本仓簿记重蒸馏：五段重写（补模块地图 + 宪法六篇 + 两行 N-A + 事实源指针）+ frontmatter 四字段
16. AGENTS.md 与 CLAUDE.md custom 区删「约定/验证/命令」三重复行（两份一致）
17. skills 源改写：doclib-build/doclib-accept 蒸馏步骤（裁决三问前置 + 六篇取材 + 12 卷走查 + 走查账契约 + 外部规则文档处置）；doclib-audit 抽查项 +1
18. doclib sync：两份引导注入 + skills 分发 + hook 幂等补装
19. package.json 0.6.2 → 0.6.3（随后重跑 sync 再生版本戳）
20. doclib check 违规 0 + 治理 100/100 + strict 通过；status 走查 12/12
21. feature-map #37 → implemented + progress.md 归档补记
22. doclib snapshot 固化基线（顺带收口锚点一遗留 lesson-gap-enforcement.md）
23. 会话自检四问 + 教训处置位核对

## 八、验收标准

| # | Given | When | Then |
| --- | --- | --- | --- |
| AC-1 | 簿记带合法走查账（12 卷全覆盖） | doclib check | 无走查违规；status 反哺行显示「走查 12/12」 |
| AC-2 | 走查账缺一卷 | doclib check --strict | 报「走查账违规」exit 1，detail 列缺失卷名 |
| AC-3 | 走查账含未知卷名 | doclib check | 报「走查账违规」，detail 标注未知卷 |
| AC-4 | fed 与 na 含同一卷 | doclib check | 报「走查账违规」（重复裁决） |
| AC-5 | 旧簿记无走查账字段 | doclib check | 仅 soft notice（不进违规/不阻断 strict）+ status「未留账 ⚠」 |
| AC-6 | 走查字段为非列表字符串 | doclib check / status | check 报违规；status 降级「非法 ⚠」不炸 |
| AC-7 | 无簿记（空状态） | doclib check | 无误报（沿 #32 AC-7 语义） |
| AC-8 | 本仓重蒸馏后 | doclib sync + check | 两份引导 project 区一致含宪法段；custom 区重复行已删；check 违规 0 + 治理 100/100 + strict 通过 |
| AC-9 | 宪法正文（人工核验） | — | 六篇齐备、N-A 显式两行、事实源指针句在位、每条附馆内路径 |
| AC-10 | 测试与冒烟 | npm test + 第 10 步 | 全绿；篡改走查账 strict 链路闭环 |

## 九、失败尝试与踩坑（上游素材）

- 无（规划阶段零实施；执行轮踩坑实时补记本节，入馆去向经 progress.md「教训:」处置位登记）
- [回填 2026-10-26 执行轮，β 一行制违约修复] 冒烟脚本 zsh `CLI="node /path..." $CLI init` 把整串当一个命令名 → no such file——重写为全路径 `node /path/cli.js`（同坑已在 95-lessons POSIX sh 条另有面；本轮属变量展开语义，非 CJK 吞字节）
- [回填] 测试单边字段预期修正：parseVolumesWalk 单边（只 volumes-na）初版测试预期 {fed:[],na:[...]}——实现按「双列表齐备契约」判 invalid（防笔误语义更优），测试改预期而非实现
- [回填] R-3 回归用例覆盖基数算术失手：原 fed 10 卷本就全覆盖，加重复不改变覆盖基数——断言 11/12 必然失败；教训=断言前先手算覆盖集合基数（construction 先于 assertion）

## 十、验收口径变更过程

- 初始口径（INNOVATE 推荐 α+β）→ 用户拍板升级 γ（一步到位）→ 计划补充「缺席 soft 缓释」以对齐存量零破坏先例——执法强度不变，仅存量兼容形态明确化
- 初始计划无预案 → 用户追加两矛盾（实况混乱/原有规则文档）→ 增补 4.3/4.4 裁决纪律，机器执法面刻意不扩（语义裁决不入确定性检测），audit 抽查兜底
