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
| skills（10 册手册） | agent 手册源 `skills/` 与分发副本 `.claude/skills/`、`.opencode/skills/`（sync 幂等分发）；doclib-accept 收尾含反哺蒸馏步骤（#32 联动）；doclib-dev 实时同步表/双锚点含教训处置位与归档四不变量事实（#35/#36）；doclib-audit 第 8 项教训完备性抽查（#36） | 30-features/guides.md | skills/ |
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
| core/guides | 引导三区渲染（managed 再生/project 反哺注入/custom 保留）/版本戳/双闸新鲜度与预算/馆内指纹/走查账解析（volumes-fed/volumes-na 三态） | 30-features/guides.md | src/core/guides.ts |
| commands/init | 骨架落位 + agents/skills/引导安装 | 30-features/init-v2.md | src/commands/init.ts |
| commands/plan | 任务书生成（BUILD/UPDATE/REBUILD） | 待成卷 | src/commands/plan.ts |
| commands/diff | 漂移报告与受影响文档映射 | 待成卷 | src/commands/diff.ts |
| commands/snapshot | 基线记录（版本 +1） | 待成卷 | src/commands/snapshot.ts |
| commands/status | 版本/基线/漂移/引导概览 | 待成卷 | src/commands/status.ts |
| commands/verify | 覆盖度/失效文档/INDEX/引导检查 | 待成卷 | src/commands/verify.ts |
| commands/sync | 引导规则区与 skills 同步（幂等）+ 门禁幂等补装（缺失补装 strict/在岗不越权/foreign 不覆盖） | 30-features/（待写） | src/commands/sync.ts |
| commands/check | 强验证对账报告与 strict 门禁 | 30-features/check.md | src/commands/check.ts |
| commands/ack | 路径豁免登记（once/standing/remove） | 30-features/（待写） | src/commands/ack.ts |
| commands/hook | pre-commit 钩子安装/移除（相对/绝对路径策略 + fail-closed 自检 + worktree gitdir 解析）+ CI 模板 + 门禁四态检测（readHookState 供 status 复用） | 30-features/hook.md | src/commands/hook.ts |
| core/ledger | 文档账收集与迁移账本解析/校验 | 待成卷 | src/core/ledger.ts |
| core/orphan | 馆外文档四态判定（工具链闭集 28 项 + 任意层级引导文件 + 归档指针 + 根级门面文件及其多语言变体模式识别）+ 疑似新工具目录识别 | 30-features/check.md | src/core/orphan.ts |
| core/place | 归位决策与执行（建议归宿/收编/入棺/墓碑/两级索引/归档账还原） | 30-features/place.md | src/core/place.ts |
| commands/place | 孤儿归位处置命令族（list/collect/archive/ack/restore，干跑默认） | 30-features/place.md | src/commands/place.ts |
| core/check | 双账本对账引擎（违规分类 + 馆外文档四态判定 + 豁免与提示 notices + 归档闭环三不变量 + 反哺走查账校验 guideWalkVerdict） | 30-features/check.md | src/core/check.ts |
| core/archival | 归档闭环三不变量 + 实施锚点缺失（in-progress 镜像）+ 教训账缺口/教训来源缺失不变量（处置位与来源行存在性 → check strict 执法） | 30-features/check.md | src/core/archival.ts |
| core/featuremap | feature-map 解析（行/状态/对应文档列切分 + 存在性判定） | 30-features/reconcile.md | src/core/featuremap.ts |
| core/planning | 规划载体域（声明路径/双轨排除/载体文档枚举/待登记待归档提醒/常见载体检测建议含 _bmad-output/载体形态识别/provenance 源 hash 对账提醒 sourceDrifts） | 待成卷 | src/core/planning.ts |
| core/reconcile | 进度对账三段报告（漂移行映射/进度不符存在性判定/待推进） | 30-features/reconcile.md | src/core/reconcile.ts |
| core/docquality | 馆内断链扫描 + 两级索引（卷 _index）核对 + 文体合规检查（Genre 三类/卷默认映射/type 覆盖/结构·卡片化·注记污染·倾倒四检查，PRD §7.6）+ ASSUMPTION 残留检查（narrative，draft 降级） | 待成卷 | src/core/docquality.ts |
| core/surface | 面穷举守卫（端点/proto/页面 vs 登记簿 Δ）+ 旗标字面量双向对账（benchmark 与 98-sessions 档案区豁免） | 待成卷（#29 规格欠账） | src/core/surface.ts |
| core/codegraph | 知识图谱门禁与 CJS 桥（Node>=22.5 检测/降级语义/最小类型面）+ 草稿渲染器（routes/modules/dependencies/unused 四册候选） | 30-features/graph.md | src/core/codegraph/ |
| commands/graph | graph 命令族（index/status/draft/explore；可选增强，telemetry 物理隔离） | 30-features/graph.md | src/commands/graph.ts |
| commands/implement | 拆单器命令（planned 候选清单/readiness 校验/骨架干跑与 --apply 落盘） | 30-features/040-planning-express.md | src/commands/implement.ts |
| core/implement | 拆单纯逻辑（候选解析/readinessVerdict/骨架渲染 slugify/验收锚点执法 acceptanceAnchorFindings——仅 type: plan-skeleton 生成物） | 30-features/040-planning-express.md | src/core/implement.ts |
| scripts/copy-assets | 构建期资产拷贝（零依赖脚本） | 待成卷 | scripts/copy-assets.js |
