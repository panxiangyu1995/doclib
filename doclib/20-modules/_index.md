---
title: 模块索引
covers:
  - src/
  - assets/
  - skills/
  - .claude/skills/
status: stable
---

# 模块索引

| 模块 | 职责一句话 | 卷入口 | covers |
| --- | --- | --- | --- |
| cli | 参数解析、命令分发、HELP、统一错误出口 | 待成卷 | src/cli.ts |
| core/fsutil | 遍历/hash/树渲染/ignore 语义 | 待成卷 | src/core/fsutil.ts |
| core/frontmatter | Markdown frontmatter（covers）解析 | 待成卷 | src/core/frontmatter.ts |
| core/state | 状态模型 v2、快照链、漂移计算 | 待成卷 | src/core/state.ts |
| core/detect | 语言/框架/入口探测 | 待成卷 | src/core/detect.ts |
| core/mapping | covers 索引与路径→文档映射、覆盖报告 | 待成卷 | src/core/mapping.ts |
| core/version | CLI/结构版本常量（引导戳数据源） | 待成卷 | src/core/version.ts |
| core/assets | 资产定位/目录拷贝/模板渲染 | 待成卷 | src/core/assets.ts |
| core/agents | agent 适配表与解析 | 待成卷 | src/core/agents.ts |
| core/prompts | TTY 交互问卷（非 TTY 降级） | 待成卷 | src/core/prompts.ts |
| core/guides | 引导渲染/版本戳/覆盖策略 | 待成卷 | src/core/guides.ts |
| commands/init | 骨架落位 + agents/skills/引导安装 | 30-features/init-v2.md | src/commands/init.ts |
| commands/plan | 任务书生成（BUILD/UPDATE/REBUILD） | 待成卷 | src/commands/plan.ts |
| commands/diff | 漂移报告与受影响文档映射 | 待成卷 | src/commands/diff.ts |
| commands/snapshot | 基线记录（版本 +1） | 待成卷 | src/commands/snapshot.ts |
| commands/status | 版本/基线/漂移/引导概览 | 待成卷 | src/commands/status.ts |
| commands/verify | 覆盖度/失效文档/INDEX/引导检查 | 待成卷 | src/commands/verify.ts |
| commands/sync | 引导规则区与 skills 同步（幂等） | 30-features/（待写） | src/commands/sync.ts |
| commands/check | 强验证对账报告与 strict 门禁 | 30-features/check.md | src/commands/check.ts |
| commands/ack | 路径豁免登记（once/standing/remove） | 30-features/（待写） | src/commands/ack.ts |
| commands/hook | pre-commit 钩子安装/移除 + CI 模板 | 30-features/（待写） | src/commands/hook.ts |
| core/ledger | 文档账收集与迁移账本解析/校验 | 待成卷 | src/core/ledger.ts |
| core/orphan | 馆外文档四态判定（工具链闭集 28 项 + 任意层级引导文件 + 归档指针）+ 疑似新工具目录识别 | 30-features/check.md | src/core/orphan.ts |
| core/place | 归位决策与执行（建议归宿/收编/入棺/墓碑/两级索引/归档账还原） | 30-features/place.md | src/core/place.ts |
| commands/place | 孤儿归位处置命令族（list/collect/archive/ack/restore，干跑默认） | 30-features/place.md | src/commands/place.ts |
| core/check | 双账本对账引擎（6 类违规 + 馆外文档四态判定 + 豁免与提示 notices） | 30-features/check.md | src/core/check.ts |
| core/docquality | 馆内断链扫描与两级索引（卷 _index）核对 | 待成卷 | src/core/docquality.ts |
| core/codegraph | 知识图谱门禁与 CJS 桥（Node>=22.5 检测/降级语义/最小类型面）+ 草稿渲染器（routes/modules/dependencies/unused 四册候选） | 30-features/graph.md | src/core/codegraph/ |
| commands/graph | graph 命令族（index/status/draft/explore；可选增强，telemetry 物理隔离） | 30-features/graph.md | src/commands/graph.ts |
| scripts/copy-assets | 构建期资产拷贝（零依赖脚本） | 待成卷 | scripts/copy-assets.js |
