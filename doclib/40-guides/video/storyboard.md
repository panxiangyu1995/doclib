---
title: 推广视频分镜表
covers:
  - video/compositions
type: ledger
status: living
---

# 推广视频分镜表

> 8 幕 · 合计 240s（4:00）· 1920×1080 / 30fps / 纯字幕动效（无旁白、无音轨）。
> 每幕对应 `video/compositions/scene-XX-*.html` 一个独立 composition，由根 `video/index.html` 以
> `data-composition-src` 嵌套编排（根只做时间轴编排，自身不注册 timeline）。

## 幕次总表

| 幕 | composition | 起止（全局） | 时长 | 标题 | 画面 | 素材出处 |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | `scene-00-checkup` | 0:00-0:15 | 15s | 你的项目文档健康度 | 5 个环形仪表从 0 滚到 100 + 「100/100 (A)」徽章 | `doclib check` 五分项实跑（对账/迁移/归位/引导/质量） |
| 1 | `scene-01-rotted` | 0:15-0:45 | 30s | 不是写得不够多，是没有治理 | 6 张症状卡快切（每张 5s）+ 右侧巨型序号 | README「为什么需要它」六类治理失效场景 |
| 2 | `scene-02-library` | 0:45-1:15 | 30s | 一座活的图书馆 | 左：12 卷 + `98-sessions` 目录树逐行生长；右：三条铁律 | 真实 `doclib/` 目录结构 + README 三条铁律 |
| 3 | `scene-03-twoanswers` | 1:15-2:05 | 50s | 同一个问题问两次 | 左 71 格 AC 全集 / 中 55 格同题共答 / 右 96.4%→100% | umami 基准：53/55 = 96.4%，回归 71/71 = 100% |
| 4 | `scene-04-growth` | 2:05-2:45 | 40s | 从空目录长出一个 umami | 左：真实复原工程文件树生长；右：124 路由 / 26 迁移 / 6.7 万行三计数器 | `test/umami-rebuild-handover/umami-rebuild/` 真实目录 + 基准规模 |
| 5 | `scene-05-coldstart` | 2:45-3:10 | 25s | agent 冷启动 | 左：终端逐行打出 AGENTS.md 四区标记；右：四区中文释义 | `assets/guides/light.md` 四区契约 + `.doclib/guide-memory.md` |
| 6 | `scene-06-defects` | 3:10-3:40 | 30s | 我们也报自己的缺陷 | 左：5 条真实差异账条目逐条滑入；右：43 仓 / 2,052 误报 / 修正后 0 | `50-testing/benchmark/050-umami-divergence.md` + ADR #12 |
| 7 | `scene-07-meta` | 3:40-4:00 | 20s | 这段视频自己就在图书馆里 | 4 张馆内证据卡 + 安装命令终端 + 仓库地址 | 本馆 40-guides/video/ 分区 + 50-testing 验收报告 |

## 逐幕细化

### 幕 0 · 治理体检（0:00-0:15）

| 项 | 内容 |
| --- | --- |
| 入口动作 | 标题「你的项目文档健康度」自下淡入（0.3s 起，0.8s） |
| 主体 | 5 个 SVG 环形仪表依次入场（1.1s 起，间隔 0.12s）；弧线从 0 转到满圈（1.9s 起，1.5s `power2.inOut`），环心数字同步滚动 |
| 收束 | 「100/100 (A) · 违规 0 · 门禁在岗」徽章 4.6s 弹入（`back.out(1.6)`） |
| 字幕 | 文档不是写完就完 —— 它得是活的（5.4s 淡入） |
| 数字来源 | `node dist/cli.js check`（对账 100/迁移 100/归位 100/引导 100/质量 100，治理 100/100 (A)） |

### 幕 1 · 六类失效（0:15-0:45）

| # | 症状卡 | 现象文案 |
| --- | --- | --- |
| 01 | 靠通读源码拼全貌 | 新人 / 新 agent 上手，几天也拼不全 |
| 02 | 代码改了，文档没改 | 半年之后，没人敢信那份文档 |
| 03 | 文档散落在各处 | README · docs · spec · 对话导出，迁移编号无权威 |
| 04 | 过程知识干完即散 | 规划、踩坑、决策理由随对话蒸发 |
| 05 | 「做完了」却证明不了 | 验收靠人肉点，没有可执行标准 |
| 06 | 规格只在聊天记录里 | 新项目 / 半成品项目，没有载体 |

节奏：每张 5s（淡入 0.55s / 停留 3.85s / 淡出 0.45s）；右侧巨型序号由**时间**驱动（`floor(t/5)+1`），保证任意 seek 位置序号与画面一致。

### 幕 2 · 12 卷图书馆（0:45-1:15）

- 目录树 13 行（`00-overview` … `99-archive`）逐行滑入，间隔 0.18s（1.1s 起）
- 右侧三条铁律依次滑入（3.6s 起，间隔 0.9s）：非克隆 / 先馆后码 / 馆随码走
- 行高 1.5、字号 30px —— 13 行整体收在字幕安全区之上（`caption-safe` 顶边约 916px）

### 幕 3 · 同一问题两次回答（1:15-2:05）

| 拍 | 时间 | 动作 |
| --- | --- | --- |
| 一 | 1.4s | 左列 71 格 AC 全集入场（间隔 0.045s），保持灰 |
| 二 | 10.5s | 中列 55 格同题共答入场（间隔 0.05s） |
| 三 | 13s | 中列逐格转绿（间隔 0.05s），右侧数字同步 0→53，分母 55 → **96.4%**，副标「53 / 55 同题共答」 |
| 四 | 18.4s | 第 54、55 格转琥珀色（2 项分歧，已裁定统一） |
| 五 | 24s | 「回归 71/71」芯片淡入；25.5s 左列 71 格整体转绿，右侧数字切到 71/71 → **100%**，副标改「71 / 71 回归」 |

### 幕 4 · 生长（2:05-2:45）

- 左侧文件树 8 行逐行滑入（1.4s 起，间隔 0.22s）：`REBUILD-001.md` / `packages/` / `prisma/` / `public/` / `ACCEPTANCE-ANSWER.md` / `REGRESSION-RESULTS.json` / `DIFFS.md` / `ALIGNMENT-LOG.md`
- 右侧三计数器依次滚动：124（API 路由，168 操作）/ 26（数据库迁移，26 模型）/ 6.7 万（源码行数）

### 幕 5 · 冷启动（2:45-3:10）

- 终端（**纯 ASCII**）逐行打出 11 行：命令 + 四区标记 `doclib:managed-begin` / `doclib:project-begin` / `doclib:memory-begin` / `doclib:custom-begin` + 末行 `> session ready in 0.4s ▮`
- 右侧四行中文释义逐条滑入（3.6s 起，间隔 0.8s）

### 幕 6 · 自曝缺陷（3:10-3:40）

- 左侧 5 条差异账逐条滑入（1.5s 起，间隔 0.62s）：D-01 / D-04 / D-05 / D-08 / D-11
- 右侧：43（仓库样本）→ 2,052（工具链类误报，琥珀）→ 0（修正后误报，绿，16.4s 起降为 0）

### 幕 7 · 元自证（3:40-4:00）

- 4 张卡：`storyboard.md` 分镜表 / `script.md` 字幕文案 / `acceptance-*.md` 验收报告 / `95-lessons` 教训档案
- 终端给出安装命令两条 + 一行注释；末行仓库地址
- 整块内容上移 210px（`padding-bottom`），给字幕让出安全区

## 数字来源表（发版前逐行复跑）

| 片中数字 | 复跑命令 | 期望值 |
| --- | --- | --- |
| 100/100 (A) · 五分项全 100 | `node dist/cli.js check` | 违规 0；治理 100/100 (A) |
| 12 卷 + 98-sessions | `ls doclib/` | 13 个卷目录（12 卷基线 + `98-sessions`） |
| 71 条验收标准 | `doclib/50-testing/benchmark/030-umami-answer-rebuild.md` | 71/71 一致 |
| 53/55 = 96.4% | `doclib/50-testing/benchmark/010-umami.md` | 得分 = 53/55 = 96.4% |
| 回归 100% | `doclib/50-testing/benchmark/070-umami-regression.md` | 71/71 复跑，回归 100% |
| 124 路由（168 操作） | `doclib/50-testing/benchmark/030-umami-answer-rebuild.md` | 124 路径 / 168 操作 |
| 26 迁移 / 26 模型 | 同上 | 26 迁移、26 模型 |
| 6.7 万行 | `doclib/50-testing/benchmark/010-umami.md` | 325 源文件（6.7 万行） |
| 43 仓 / 2,052 误报 | `doclib/10-architecture/decisions.md` ADR #12 | 43 仓样本，工具链类误报 2,052 |
| D-01/D-04/D-05/D-08/D-11 | `doclib/50-testing/benchmark/050-umami-divergence.md` | 条目与裁决逐字核对 |

## 关联

- 字幕全文：[script.md](script.md)｜复现流程：[production.md](production.md)｜发布规格：[publishing.md](publishing.md)
