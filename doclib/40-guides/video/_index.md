---
title: 推广视频分区索引
covers: []
type: index
status: living
---

# 推广视频分区索引

> DocLib 首支对外推广视频的**知识层**。视频本体是 HyperFrames composition 工程（仓库顶层 `video/`，由本分区的
> `production.md` 以 `covers: [video]` 锚定），本分区只存**可复原的文字规格**：分镜、字幕、复现流程、发布规格。

## 分区文件

| 文件 | 内容 | 文体 |
| --- | --- | --- |
| [storyboard.md](storyboard.md) | 8 幕分镜表（时间轴 / 画面 / 素材出处 / 数字来源） | ledger |
| [script.md](script.md) | 全片字幕文案全文 + 字幕规范 | ledger |
| [production.md](production.md) | HyperFrames 工程复现指南（结构 / 字体 / 命令 / 坑） | narrative |
| [publishing.md](publishing.md) | B 站发布规格 + 数值核对表 + 发布 checklist | ledger |
| [../../50-testing/acceptance-promo-video-v0.8.0.md](../../50-testing/acceptance-promo-video-v0.8.0.md) | 成片验收报告（逐条留痕） | ledger |

## 生命周期

```
脚本(script) → 分镜(storyboard) → 制作(composition) → 渲染(render) → 发布(publishing) → 归档(99-archive)
```

- 每次改动**先改本分区的文字规格**，再改 `video/` 里的 composition —— 规格是源，composition 是产物
- `video/` 的任何文件变更若未同步 `production.md` / `storyboard.md`，`doclib check` 会判「无归属」违规（双账本对账面）
- 成片产物（`video/renders/*.mp4`）不进 git，随发布走 Release 附件

## 关联

- 规划载体：`.plan/2026-10-27/promo-video-hyperframes.md`（57 步实施清单）
- 进度总账：`doclib/00-overview/feature-map.md` #41
- 时间线：`doclib/00-overview/progress.md`
- 验收留痕：`doclib/50-testing/acceptance-promo-video-v0.8.0.md`
