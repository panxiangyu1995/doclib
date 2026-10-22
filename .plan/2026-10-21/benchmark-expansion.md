# 基准扩容规划（F14 第二梯队 · 四领域样本）

> 创建于 2026-10-21 ｜ 承接 .plan/2026-10-21/benchmark-umami.md（首轮闭环 96.4%→回归 100%）
> 依据：PRD F14 MVP 节奏（跑通 1–2 个后扩至 3–5 领域样本）；benchmark.md 首轮复盘六条修订全适用

## 目的与效果

以四个领域/语言各异的样本驱动**基线结构演进的实证裁决**（Q15/Q25/Q26 悬置 + D-12 参数级契约观察项 + Q40 codegraph 三指标），并验证 umami 模板的可复制性。预期产出：四份复原档案 + 多项目共性缺陷清单（结构演进的实证依据）+ 分语言登记簿实践。

## 样本与锚点（gh 实证 2026-10-21）

| 项目 | 领域 | 语言 | 协议 | commit 锚点 | 测试面 |
| --- | --- | --- | --- | --- | --- |
| usememos/memos | Go 全栈（笔记应用） | Go + React | MIT | 008dded (2026-10-22) | Go 面 + 前端卷 + API 登记簿 + 迁移 |
| sharkdp/fd | Rust CLI | Rust | Apache-2.0 | cfed17a (2026-10-21) | CLI 工作流 + 命令/配置登记簿 |
| wireservice/csvkit | Python 数据处理 CLI 套件 | Python | MIT | 6d19c62 (2026-09-21) | 数据领域 + 命令族登记簿 |
| realworld-apps/aspnetcore-realworld | C# 后端 API | C# | MIT | 8aa617a (2026-10-15) | 后端服务 + API/错误登记簿 |

## 每项目执行清单（umami 模板套用）

```text
N.1 隔离 clone（test/<name>）+ 记录 commit + npx 式本地 init（--agents claude,opencode --planning .plan）+ BUILD 任务书（切片定义固化）
N.2 doclib-build 建馆：12 卷 + 按领域裁定的登记簿册（memos: api/config/routes/ui-assets；fd: 命令/config；csvkit: 命令族/config；aspnetcore: api/error-codes/config）+ feature-map + 30-features（AC 条条带 G/W/T+命令+期望+答卷）
N.3 snapshot v1 → check 治理 A 门 + audit 抽查（放行门）
N.4 原仓库答卷首跑（运行时前置：memos=Go+Node；fd=cargo[缺]；csvkit=python3[3.9]；aspnetcore=dotnet[缺]）
N.5 plan --rebuild + 回归式工单打包（ALIGNMENT 机制视首轮缺陷而定；首轮项目直接交付）
N.6 复原者隔离执行（沿用 umami 复原者通道）→ 回传四件
N.7 同题共答 diff → 得分 → 缺陷四分类 → 回灌 → 回归循环（R1–R4 封卷）
```

## 多项目共性裁决目标（本轮特有）

1. **D-12 裁决**：参数级契约在四项目登记簿中的承载形态是否复现 umami 的"表列+总表"模式 → 是则 PRD 演进立项
2. **S2 类缺口共性**：采集/归属/派生类隐藏语义是否在每项目重现（umami 的 revenue 派生/热图 record 分流模式）→ 建馆 skill 增"隐藏语义深挖清单"
3. **Q40 codegraph 三指标**：建馆耗时/查询耗时/缺口发现率——本轮以纯 agent 模式为基线，codegraph 集成另立项

## 风险

| # | 风险 | 缓解 |
| --- | --- | --- |
| 1 | cargo/dotnet 缺失 → fd/aspnetcore 答卷首跑受阻 | 建馆不受阻；答卷首跑需用户安装（brew install rustup / dotnet-sdk）或标记单侧执行（同题共答降级为复原侧证据+源码比对） |
| 2 | 四项目串行周期长 | 建馆可并行推进（本会话逐项目做）；复原侧可并行排 |
| 3 | Python 3.9 偏旧（csvkit 可能要求更高） | 建馆不受影响；首跑用 venv 按项目要求处理 |
| 4 | memos 前端 React 面大 | 切片：复原对象=API/数据/核心功能面；前端卷叙述 |

## 实施清单（总）

```text
1. 本规划落盘 + feature-map 登记（#23 基准扩容 in-progress）
2. memos 建馆 → 放行门 → 答卷首跑 → 工单
3. fd 建馆 → 同上（cargo 依赖用户装）
4. csvkit 建馆 → 同上
5. aspnetcore 建馆 → 同上（dotnet 依赖用户装）
6. 四项目复原侧并行 → 回收 → 得分 → 缺陷账
7. 多项目共性裁决 → D-12/Q40 证据汇总 → PRD 演进提案（如触发）
```
