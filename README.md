# DocLib

[![npm version](https://img.shields.io/npm/v/@panxiangyu1995/doclib.svg)](https://www.npmjs.com/package/@panxiangyu1995/doclib)
[![license](https://img.shields.io/npm/l/@panxiangyu1995/doclib.svg)](LICENSE)
[![release](https://github.com/panxiangyu1995/doclib/actions/workflows/release.yml/badge.svg)](https://github.com/panxiangyu1995/doclib/actions/workflows/release.yml)

> **中文** | [English](README.en.md)

让项目文档从「写完就烂的说明」变成「随代码演化的可执行规格」——**任何 agent 或人只读这套文档，就能在别处从零重建该项目**（实测功能复原 ≥90%）。

- **是什么**：一套给「文档、开发、验收」做治理的系统。纯 Markdown 的「文档图书馆」放在你仓库里，是项目唯一事实源——agent 依据它开发、依据它验收，文档跟代码对不上账时提交会被拦下。
- **不是什么**：不是克隆器（不搬运源码）、不替代 git（只管「代码 ↔ 文档」同步）、不绑定特定 agent 产品、**不要求你改变现有开发习惯**。

## 初衷

这个项目诞生于我自己长期的文档治理之痛。我长期维护一个仓库，用过各种开发 spec 规范、装过各种 skill，最后发现治理上一团乱象：文档到处都是，散落各处；信息过没过时、还能不能删，没人说得清；不止开发文档，开发测试过程中产生的各种临时文档，也得我事后花时间精力去收拾。我意识到与其继续被文档追着跑，不如设计一个治理工具来终结这个乱象——于是有了 DocLib。做着做着发现，能纳入这套体系的不只是文档：开发 spec、agent memory、项目宪法、测试文档……都可以被系统化地治理和应用。

## 本文导读

[它是什么](#它是什么) · [能做到什么程度](#能做到什么程度) · [亮点对比](#亮点对比) · [两步上手](#两步上手) · [工作原理](#工作原理) · [开发模式与兼容](#开发模式与兼容) · [图书馆结构](#图书馆结构) · [命令参考](#命令参考) · [Skills 参考](#skills-参考) · [项目现状与实证](#项目现状与实证) · [这个仓库里有什么](#这个仓库里有什么) · [常见疑问](#常见疑问) · [参与贡献](#参与贡献) · [设计文档](#设计文档)

## 它是什么

一个比方：传统文档像**收房时的照片**——交付那天光鲜，之后代码天天变、文档原地不动，半年就成了没人敢信的「传说」。

DocLib 给项目配的是**管家 + 门禁**：

- **管家**：你日常用的 AI agent（Claude Code、opencode 等）装上 DocLib 的 11 个 skills 之后，会读馆、写馆、按馆验收——你照常开发，它顺手把「改了什么、为什么这么改、怎么验收」写进图书馆。
- **门禁**：`doclib` CLI + git 提交钩子。文档和代码对不上账？提交直接被拦；馆内声明的测试链（typecheck / test）不绿？同样拦。文档烂没烂，机器说了算，不靠自觉。

三个词先认识一下，后文会反复出现：

| 词 | 大白话解释 |
| --- | --- |
| 图书馆 `doclib/` | 你仓库里的一个文件夹，12 卷 Markdown 文档，项目的唯一事实源——任何问题先查它 |
| 簿记 `.doclib/` | CLI 的私有工作区（基线快照、任务书），机器维护，你不用碰 |
| agent / skills | 帮你干活的 AI 与教它干活的手册；装好即生效，不需要你写提示词 |

### 一分钟看懂它怎么运转

周一，你改了登录接口的返回结构，对 agent 说一句「改好了，入馆」——agent 把新契约写进图书馆的功能规格与 API 登记簿。

周三，另一个会话的 agent 要调这个接口，先查登记簿直接拿到字段与状态码，不用翻源码。

周五，你提交代码——pre-commit 门禁自动运行 `doclib check` 与馆内声明的测试链：文档与代码对上账、测试全绿，放行；对不上，拦下并告诉你哪篇文档漏更。

文档不再是「写完就烂」，因为它根本不是「写完」的——它是开发过程本身留下的轨迹。

## 能做到什么程度

文档腐化不是「写得不够多」，是**没有治理**。下面 6 件事几乎每个项目都在发生，DocLib 逐条给出机制和实测结果：

| 你大概率遇到过 | 放任下去会怎样 | 有了 DocLib | 实测证据 |
| --- | --- | --- | --- |
| 新同事 / 新 agent 进项目 | 通读源码几天也拼不出全貌 | 12 卷叙述层 + 实体登记簿，先查馆再读码 | umami 建馆：API 登记簿 141 条、路由 60 页 |
| 代码改了，文档没改 | 半年后没人敢信文档 | 三层保活 + 提交门禁双账本对账，腐烂被机器发现 | 本仓库 `doclib check` 治理 100/100 (A)、违规 0 |
| 文档到处都是 | README / docs / spec / 对话导出散落各处，谁也不敢删 | 归位宪法 + `place` 四态处置（收编 / 归档 / 豁免 / 还原） | 43 仓实测：工具链类误报 2,052 条，修正后清零 |
| 踩过的坑换个会话再踩一遍 | 经验随对话蒸发 | `.plan` 双锚点 + 教训实时入账（门禁强制） | 本仓库 `progress.md` 记录 30+ 次开发事件 |
| 「做完了」却证明不了 | 验收靠人肉点，标准全在脑子里 | 每个功能一份可执行验收标准（Given/When/Then） | umami 71 条 AC 双跑：96.4% → 回归 100% |
| 新项目 / 半成品的规格没处放 | 规格只活在聊天记录里 | bootstrap / resume 模式 + 功能状态总账 | 本仓库功能总账逐项记录 planned → implemented → retired |
| 长程开发全靠 agent 自觉 | 做完没验证就标记完成，任务状态悄悄漂移 | 功能状态机 + 馆内声明测试链烘焙进提交门禁 + 阻塞协议（受阻禁提交禁翻转） | 本仓库 F19 实测：测试链失败阻断提交；伪造完成被 check「清单状态失真」拦截 |

**DocLib 不承诺「帮你写文档」，它承诺「文档永远能用来开发」。**

## 亮点对比

| 常见做法 | 怎么失效 | DocLib 的差别 |
| --- | --- | --- |
| README + `docs/` 一次性文档 | 代码天天变、文档没人管，半年后没人敢信 | 实时同步 + 提交门禁对账——腐烂可被机器发现并拦下 |
| SDD 工具（spec-kit / OpenSpec / BMAD / Kiro） | spec 写完即冻结，治理问题原样留下 | 兼容共存：知识快照式收编进图书馆，你继续用原工具 |
| AI 一次性生成文档 / 代码图谱 | 生成即死，与代码再无关联 | 细粒度保活三角：实体级锚点 + CLI 出候选（agent 撰写裁决）+ 实时同步 |
| CLAUDE.md / AGENTS.md 这类引导文件 | 手写一次从此没人维护；换个会话、换个人、换个模型，规矩就走了样 | **图书馆反哺**：agent 建馆收尾自动把「项目定位 / 架构 / 开发宪法 / 命令速查」蒸馏进引导文件，近 30 天工作记忆与协作者画像常驻——新会话冷启动零动作即得；馆变了报「反哺过期」，手写区永远保留 |
| 直接让 agent 读源码 | 能跑通，但拿不到设计意图与边界行为 | 非克隆：图书馆承载行为、契约、设计意图与验收标准 |

## 两步上手

### 第一步：安装 CLI 与 skills

在项目根目录初始化一次（`--agents` 按你用的 agent 选，多个用逗号分隔；`claude`/`opencode` 会落位 11 个 skills 与引导文件）：

```bash
npx @panxiangyu1995/doclib init --agents claude,opencode
```

这一步落位三样东西：`doclib/` 图书馆骨架、`.doclib/` 簿记、agent 的 skills 与引导文件。也可以 `npm i -g @panxiangyu1995/doclib` 后直接用 `doclib`（命令名一致）。

### 第二步：从一句对话开始

装好后不用学命令，直接对 agent 说人话——它会自己加载对应的 skill、跑对应的命令：

| 你的处境 | 你对 agent 说 | agent 会做什么 |
| --- | --- | --- |
| 已有项目，想让文档「活」起来 | 「用 doclib 把这个项目的文档馆建起来」 | `doclib plan` 生成 BUILD 任务书 → 加载 `doclib-build` 三遍扫描填实馆 → `verify` → `snapshot` |
| 全新项目，想先有规格再写码 | 「我要做一个 XX，先用 doclib 把需求挖成规格」 | `doclib plan --bootstrap` → 加载 `doclib-bootstrap` 与你对话把需求填进馆，此后按馆开发 |
| 半成品项目要接手 | 「接手这个仓库，用 doclib 梳理已实现和没做的」 | `doclib plan --resume` → 加载 `doclib-resume` 蒸馏已实现 + 登记规划 → 转入 `doclib-dev` |
| 日常开发，想让文档跟上代码 | 「按图书馆继续开发」 | `doclib status` / `diff` → 加载 `doclib-dev`，边开发边实时入馆 |
| 只想要「凭文档复原」的能力 | 「只读 doclib/，在 ../myproj-rebuild 从零复原这个项目」 | `doclib plan --rebuild` → 加载 `doclib-rebuild`，禁止访问原仓库，在空目录从零开发 |

## 工作原理

### 一张图看懂

```
┌──────────────────────────────────────────────────────────────┐
│  你的 repo                                                     │
│                                                               │
│    源代码 ─────┐                                              │
│    doclib/ ◀───┤ 图书馆：12 卷叙述层 + 实体登记簿（唯一事实源）   │
│    .doclib/ ◀──┤ 簿记：快照链 + 任务书（CLI 私有，不入馆）        │
│    CLAUDE.md ◀─┤ 引导：让 agent 自助会用这套体系                │
│    .claude/    ┤ agent 适配：11 个 skills 的落位目录             │
└────────────────┼──────────────────────────────────────────────┘
                 │  hash / diff / 映射 / 对账
          ┌──────┴──────┐
          │  doclib CLI │  机器活：状态与事实
          └──────┬──────┘
                 │  任务书（BUILD / UPDATE / REBUILD / BOOTSTRAP / RESUME）
          ┌──────┴──────┐
          │ agent+skills │  知识活：怎么分析、怎么写、怎么验收
          └─────────────┘
```

### 三条铁律

1. **非克隆** —— 图书馆写的是「这个系统怎么运转、承诺什么、怎么验收」，不是代码复制（示意片段不超过 10 行）。
2. **先馆后码** —— 想知道某个接口长什么样？先查图书馆登记簿，直达答案；查不到才读代码，读完回填建账——越查越全，查询即飞轮。
3. **馆随码走** —— 实时层（当场入馆）+ 流程层（规划双锚点）+ 兜底层（`diff` → `check`）三层保活。图书馆是开发的**输入**，不是事后补账的产物。

### 为什么分两层

| 层 | 回答什么问题 | 形态 |
| --- | --- | --- |
| 叙述层（12 卷） | 为什么这样设计、怎么运转 | 行为、契约、设计意图、验收标准 |
| 实体层（登记簿族） | 这个实体到底长什么样 | 逐条目五要素：标识 / 实体级 covers / 契约细节 / 状态机 / 时间线 |
| 档案卷（`99-archive/`） | 以前是怎么做的、为什么被取代 | 墓碑注记（何时失效 / 为何 / 被何取代），默认不物理删除 |

两层冲突时**以登记簿为准**（它是事实的单点出处，叙述层引用它）。

每类文档另有文体标准：叙述层按**教科书五段**写（导读 → 为什么 → 是什么 → 怎么运转 → 怎么验收），登记簿按**条目五要素**写——`check` 的可读性门禁会检查结构缺失、卡片化与注记污染。人读得顺与 agent 查得准，同为一等质量维度。

### 装好之后，日常怎么转？

| 层 | 什么时候动 | 谁负责 |
| --- | --- | --- |
| 实时层（主） | 开发中凡改到有文档承载的知识 | agent 当场入馆（引导文件的实时同步规则约束它） |
| 流程层 | 规划文档完成后 / 该开发完成后 | 双锚点：登记 `planned` → 归档成果并推进 `implemented` |
| 兜底层 | 万一有遗漏 | `diff` → `plan` → UPDATE 任务书 → `check` 强验证 |

治理执法三件套：`doclib check`（双账本对账 + 治理健康分，`--strict` 可作门禁）· `doclib place`（孤儿归位，写操作默认干跑，`--apply` 才执行）· `doclib hook`（pre-commit 门禁 / CI 模板）。

功能状态的事实源只有一个：`doclib/00-overview/feature-map.md`（`planned` / `in-progress` / `implemented` / `retired`）；`progress.md` 是时间线视图，不另立状态。

## 开发模式与兼容

### 四种开工模式

装好后不用背命令——对 agent 说一句话（见[两步上手](#两步上手)），它会选对任务书开工：

- **已有项目**（BUILD）：三遍扫描把现状蒸馏成馆——先骨架、再数据、再行为，建完自动核对覆盖度。
- **全新项目**（BOOTSTRAP）：先和你对话把需求挖成规格（含功能验收标准），规格定了再写第一行代码。
- **半成品接手**（RESUME）：已实现的蒸馏成账，想做的登记成 planned，从此按馆继续开发。
- **只要复原能力**（REBUILD）：换一个目录、换一个 agent（`doclib plan --rebuild --to ../目标目录`），只读 `doclib/`、禁止访问原仓库，从零重建——这是「文档是真的活」的终极验收（复原每阶段收口跑馆内测试链、受阻即停，与日常长程开发共用 doclib-dev 情形 B 链路）。

### 已经在用 spec 工具？不用改习惯

DocLib 不接管你的工作流，只回收知识：

| 你的现状 | DocLib 怎么配合 |
| --- | --- |
| 用 BMAD / spec-kit / OpenSpec / Kiro 做过规划 | 快照式收编：规划知识自动映射进图书馆（带来源与哈希对账），planned 条目自动提取、你确认后生效；原工具原样保留 |
| 只有一个 README + `docs/` 的老项目 | init 即建基线；馆外散落文档由 `place` 统一收编或显式豁免，从此有序 |
| agent 产品不限 | 引导文件 + 纯 Markdown 图书馆不绑定产品；skills 落位目前支持 `claude` / `opencode`，其他 agent 读引导文件同样可用 |
| README.en.md 这类多语言门面 | 天然豁免，不用逐个登记（BCP-47 语言标签模式识别） |

> 依据：PRD v0.40（F17 规划直通车）；四工具语义映射表见 `doclib/40-guides/010-tool-adoption.md`。

## 图书馆结构

```
doclib/
├── README.md               # 入口：怎么读、维护铁律
├── INDEX.md                # 总索引：全部文档 + 一句话摘要
├── 00-overview/            # 项目定位、术语表、功能总清单（状态事实源）、进度时间线
├── 10-architecture/        # 架构总览、数据模型、数据流、依赖选型、ADR、迁移账本
├── 20-modules/             # 每模块一卷：职责、边界、契约
├── 30-features/            # 每功能一份行为规格 + 可执行验收标准
├── 40-guides/              # 复原路线图、编码约定、开发工作流
├── 50-testing/             # 测试方案、测试矩阵、测试设置、运行方式
├── 60-config/              # 工程设置全集：lint/format、构建、CI/CD、环境变量
├── 70-deploy/              # 部署：环境矩阵、发布流程、运维与回滚
├── 80-design/              # UI/UX：设计系统、交互细节、资产说明
├── 90-reference/           # API / 接口 / 协议精确参考
├── 95-lessons/             # 经验教训：bug 与解决办法、踩坑记录
└── 99-archive/             # 档案卷：过时内容降级保史（墓碑注明何时 / 为何 / 被何取代）
```

- **卷可扩展**（编号顺延），不适用的卷必须显式声明「不适用」，不得静默省略。
- **登记簿**按「册 = 资产类型」组织，挂在语义最邻近的卷：`api` / `error-codes` / `events-def` / `integrations` → `90-reference`；`ui-assets` / `routes` → `80-design`；`config` / `flags` → `60-config`；`tasks` → `70-deploy`；`events` → `00-overview`。
- **归位宪法**：馆内是默认，馆外是例外，例外必须显式（工具链白名单或 `ack` 登记）。
- 每篇文档 frontmatter 的 `covers` 指向它描述的代码路径——这是增量更新的锚点。

### 翻开来长什么样？

不是流水账，是能直接执行的标准。下面是本仓库图书馆里一页真实规格的片段（`doclib/30-features/check.md` 验收标准节，原文照录）：

> - Given 改代码不改文档 When check Then 报漏更并列出覆盖文档；--strict 退出码 1
> - Given 代码与覆盖文档同改 When check Then 已对账计数 +1，无违规
> - Given 馆外散落 .md When check Then 孤儿文档检出；standing ack 后转为已豁免

每条都是可执行的断言——「做没做完」机器判定，不由嘴判定。

## 命令参考

这一节是查表用的——日常你只需要对 agent 说话，命令是 agent 在跑。

| 组 | 命令 | 职责 | 何时用 |
| --- | --- | --- | --- |
| 建馆 | `init` | 初始化 `doclib/` 骨架、`.doclib/` 簿记、skills 与引导文件（自动装提交门禁） | 接入一个新 repo |
| 建馆 | `plan` | 生成任务书：BUILD / UPDATE / REBUILD / BOOTSTRAP / RESUME | 每次开工前 |
| 建馆 | `implement` | 拆单器：planned 候选清单 → readiness 校验 → `.plan` 实施骨架（AC 锚点预填，干跑默认、`--apply` 落盘） | 馆内功能开工前 |
| 建馆 | `verify` | 覆盖度报告：未覆盖路径 / 失效文档 / INDEX 完整性 | 建馆后、每次增量更新后 |
| 建馆 | `snapshot` | 把当前代码状态记为新基线（图书馆版本 +1，revision +1） | 同步完成后 |
| 保活 | `diff` | 当前代码 vs 基线：漂移清单 + 受影响文档 | 开发中随时 |
| 保活 | `status` | 版本 / 基线 / 漂移 / 治理健康分 / 引导预算 / 待办概览 | 每个会话开始 |
| 治理 | `check` | 强验证：双账本对账（漏更 / 无归属 / 迁移违规 / 引导过期 / 孤儿文档）+ 治理健康分 | 提交前 |
| 治理 | `ack` | 路径豁免登记（`once` / `standing` / `--dir` 目录前缀） | 出现误报时 |
| 治理 | `place` | 孤儿归位：`list` / `collect` / `archive` / `ack` / `restore`（写操作默认干跑） | 馆外有文档时 |
| 治理 | `hook` | pre-commit 钩子安装 / 移除（馆内 `test-chain` 声明自动烘焙测试链；`--ci github` 出含 full 档的 CI 模板） | 接入 CI 时 / 声明测试链后 |
| 治理 | `reconcile` | 进度对账重建：疑似完成 / 进度不符 / 待推进 | 进度账与代码不一致时 |
| 治理 | `branch` | 分支账：`list`（账实对照）/ `register`（登记分馆）/ `diff`（分馆 vs 主馆合并审计） | 新建分支 / 分支合并回主馆前 |
| 增强 | `sync` | 引导文件规则区与 skills 同步再生（幂等，定制区保留） | 升级 CLI 后 |
| 增强 | `graph` | 代码知识图谱：`index` / `status` / `draft` / `explore <query>`（可选增强，需 Node ≥ 22.5） | 大仓库加速 |

会改变行为的常用选项：`--agents`（init 的 agent 目标）、`--planning`（init 的规划载体路径）、`--json`（机器可读输出）、`--strict`（check / hook 门禁）、`--apply`（place 实际执行写操作 / implement 骨架落盘）、`--feature`（implement 的功能号）、`--to`（rebuild 目标目录 / place 目标卷）。完整选项见 `doclib --help`。

> `graph` 是可选增强：需要 Node ≥ 22.5，缺失时优雅降级，**不阻塞任何核心流程**；图输出只是候选，须经 agent 核实后才能入馆。

## Skills 参考

skills 由 agent 按名称加载，各自绑定一个触发场景：

| Skill | 何时加载 | 关联命令 |
| --- | --- | --- |
| `doclib-build` | 存量项目蒸馏建馆 | `plan`（BUILD 任务书） |
| `doclib-update` | 代码变更后的增量更新 | `plan`（UPDATE 任务书） |
| `doclib-rebuild` | 只凭图书馆从零复原 | `plan --rebuild` |
| `doclib-dev` ★ | 开发会话双情形：A 常规开发；B 长程六步回路（选任务 → 填单开发 → 测试链 → AC 验收 → 一任务一 commit） | `status` / `diff` / `snapshot` / `implement` |
| `doclib-bootstrap` | 新项目对话式建馆 | `plan --bootstrap` |
| `doclib-implement` | planned 功能细化为实施工单（AC 锚点填实） | `implement` 生成骨架后 |
| `doclib-resume` | 半成品项目接手 | `plan --resume` |
| `doclib-setup` | init 之后的安装与适配确认 | `init` / `sync` |
| `doclib-reconcile` | 进度账与代码对账 | `reconcile` |
| `doclib-audit` | 定期质量审计 | `verify` |
| `doclib-accept` | 逐条执行验收标准并留痕 | 功能完成时 / 复原验收 |

## 项目现状与实证

| 项 | 值 | 来源 |
| --- | --- | --- |
| npm 包 / 版本 | `@panxiangyu1995/doclib` / 0.10.0（npm latest 0.8.0，发版随下一窗口） | `package.json` |
| License / Node | MIT / `>=22.5 <25` | `package.json` |
| 运行时依赖 | 4 个：`ignore` / `jsonc-parser` / `picomatch` / `web-tree-sitter` | `package.json` `dependencies` |
| CLI 命令 / Skills | 15 / 11 | `src/commands/` · `skills/` |
| 图书馆骨架 | 12 卷 + 登记簿族（首批 5 册）+ `99-archive` + `98-sessions`，共 33 个骨架文件 | `assets/templates/library/` |
| 测试 | 39 个测试文件 / 394 用例 | `package.json` test 脚本 |
| 源码规模 | 非测试 5,998 行 / 测试 5,760 行 | `src/` |
| 本仓库自身治理 | 100/100 (A)，违规 0 | `doclib check` |
| 复原基准 | umami：建馆 97% 覆盖 → 同题共答 96.4%（53/55）→ 回归 100% | `doclib/50-testing/benchmark/` |
| 基准规模 | 复原产物 124 路由 / 26 模型 / 6.7 万行 | `doclib/40-guides/benchmark.md` |
| 治理实测 | 43 仓样本：工具链类误报 2,052（均值 ≈48/仓，AI 工具仓最高 171）→ 修正后清零 | `doclib/10-architecture/decisions.md` ADR #12 |
| 图谱实测 | 5 仓实测；memos 1,167 文件 / 22,637 符号 / 66,909 边 / 89 路由 / 2.7s | `doclib/50-testing/acceptance-graph-v0.5.0.md` |

> 本表数字随发版变化，贡献者在发版前需逐项核对（见 [CONTRIBUTING.md](CONTRIBUTING.md)）。

## 这个仓库里有什么

打开仓库先看这张地图：

| 目录 | 是什么 | 谁会看 |
| --- | --- | --- |
| `src/` | doclib CLI 源码（TypeScript，14 个命令） | 想改工具的人 |
| `doclib/` | **本项目自己的文档图书馆**（12 卷 + 登记簿 + 档案）——DocLib 用 DocLib 管自己，馆即活证据 | 所有人，强烈建议逛逛 |
| `skills/` | 11 个 agent skills 的源头 | 想改 agent 行为的人 |
| `assets/` | 图书馆骨架模板与引导文件再生源 | 想定制骨架的人 |
| `vendor/codegraph/` | vendored 知识图谱引擎（git subtree，MIT） | 图谱增强 |
| `test/` | 复原基准仓（umami / fd / csvkit / memos / aspnetcore 等克隆） | 复原与基准实验 |
| `video/` | 推广视频工程源（HyperFrames） | 好奇成片怎么做的 |
| `scripts/` | 构建辅助脚本 | 构建 / 发版 |
| `.doclib/` | CLI 私有簿记（基线快照、任务书、引导反哺源） | 机器维护，不用碰 |
| `.plan/` | 每次开发的规划载体（双锚点之一） | 过程档案 |
| `.claude/` `.opencode/` | skills 分发副本与命令（`doclib sync` 生成） | agent 读取 |

## 常见疑问

**我需要先会写文档吗？**
不需要。馆主要由 agent 蒸馏生成、你负责说「对不对」；你写得越多馆越准，但零起点也能开馆。

**和我现在的 git 流程冲突吗？**
不冲突。DocLib 只往仓库里加两个目录和一个提交钩子；不接管分支、不改历史、不需要任何服务器，全部本地运行。

**agent 不在时文档会烂吗？**
门禁一直在。`check` 是纯本地 CLI，不用 agent 也能跑——文档漂了它第一时间报出来，不需要任何人自觉。

**我在用别的 spec 工具 / 别的 agent？**
见[开发模式与兼容](#开发模式与兼容)：spec 工具快照式收编不用迁移；agent 只要求能读 Markdown 文件。

**多大的项目适合？**
从单个 CLI 小工具到 22 万行的全栈应用都有实测（基准库覆盖 fd / csvkit / memos / umami / aspnetcore-realworld）。

**文档全让 AI 写，靠谱吗？**
AI 写、机器验：登记簿逐条挂代码锚点（`covers`），`check` 逐条对账，验收标准逐条可执行——AI 的自由发挥进不了馆。

## 参与贡献

三类贡献都欢迎：**报问题与提需求**（GitHub Issues）· **补文档**（改 `doclib/` 对应卷，落位先走归位决策树）· **提代码**（见 [CONTRIBUTING.md](CONTRIBUTING.md)）。

三条必守纪律：

1. 新增测试文件必须加进 `package.json` 的**显式测试列表**（Node 24 的 `node --test <目录>` 会失败，见 ADR #5）。
2. 改动 `vendor/codegraph/` 内的源码必须登记 `FORK-NOTES.md`（否则未来 `git subtree pull` 无法审计）。
3. 改动触及任一卷知识，须**同会话实时入馆**——本仓库用 DocLib 管自己。

## 设计文档

- [PRD：需求唯一事实源](doclib/10-architecture/prd.md) · [架构设计](doclib/10-architecture/design.md)
- [全馆索引](doclib/INDEX.md) · [术语表](doclib/00-overview/glossary.md) · [功能进度总账](doclib/00-overview/feature-map.md)
- [复原基准测试方法论](doclib/40-guides/benchmark.md)

## License

[MIT](LICENSE)
