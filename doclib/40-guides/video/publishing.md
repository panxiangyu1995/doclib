---
title: 推广视频发布规格
covers: []
type: ledger
status: draft
---

# 推广视频发布规格

> 投放平台：B 站（横屏 16:9）· 成片：`renders/doclib-promo-16x9.mp4` · 定位：开发者社区推广片。
> **本篇的数字在每次发版前必须重跑核对**——并发开发期 README 现状表已出现过多次失真。

## 平台规格

| 项 | 值 | 依据 |
| --- | --- | --- |
| 画幅 | 16:9 / 1920×1080 | B 站横屏标准 |
| 帧率 / 时长 | 30fps / 240s（4:00） | 成片 `ffprobe` 实测 |
| 编码 | H.264（`hyperframes` 默认 `looks` 档，CRF 16） | 成片实测 |
| 体积 | 约 8.5 MB | 成片实测 |
| 音轨 | **无**（拍板：纯字幕动效） | `ffprobe` 实测音轨数 0 |
| 封面 | 16:9，建议 1146×717；从 `snapshot --at 8,95,232` 选帧 | B 站封面比例 |
| 标题 | ≤80 字 | B 站标题上限 |
| 简介 / 标签 | 见下 | — |

### 标题候选

1. `我把项目文档变成了可执行的规格——只凭文档，agent 从零重建了你的项目`
2. `文档别再写完就烂：DocLib 的 12 卷图书馆 + 96.4% 复原实测`
3. `一个 agent 冷启动 0.4 秒就知道你的项目长什么样（附 4 分钟实测）`

### 简介候选

```
项目文档写完就烂，新人 / 新 agent 上手只能通读源码，几天也拼不全。

DocLib 把项目蒸馏成一套「可复原的文档图书馆」：12 卷叙述层 + 实体登记簿，
先馆后码、馆随码走，agent 只读文档就能开发。

本片全部数字来自真实仓库实测：
· 治理体检 100/100 (A)，违规 0
· umami 基准：71 条验收标准，同题共答 53/55 = 96.4%，回归 71/71 = 100%
· 43 仓样本实测，工具链类误报 2,052 条，修正后清零
· 连我们的差异账也一并放出来（D-01 ~ D-14）

npx @panxiangyu1995/doclib init --agents claude,opencode
github.com/panxiangyu1995/doclib
```

### 标签

`#独立开发者` `#AI编程` `#软件工程` `#文档即代码` `#ClaudeCode` `#OpenCode` `#Agent` `#开源项目`

## 数值核对表（发版前逐行复跑）

| 片中数字 | 复跑命令 / 出处 | 期望值 | 核对 |
| --- | --- | --- | --- |
| npm 包版本 | `npm view @panxiangyu1995/doclib version` | 与 `package.json` 一致 | ☐ |
| CLI 命令数 | `ls src/commands/*.ts \| grep -v test \| wc -l` | 14 | ☐ |
| skills 数 | `ls -d skills/*/ \| wc -l` | 11 | ☐ |
| 测试用例数 | `npm test` | 350 | ☐ |
| 运行时依赖 | `package.json` `dependencies` | 4 个 | ☐ |
| 治理五分项 | `node dist/cli.js check` | 全 100，治理 100/100 (A)，违规 0 | ☐ |
| 12 卷 + 98-sessions | `ls doclib/` | 13 个卷目录 | ☐ |
| 71 条 AC / 53÷55 / 96.4% / 回归 100% | `doclib/50-testing/benchmark/010-umami.md`、`070-umami-regression.md` | 逐字一致 | ☐ |
| 124 路由（168 操作）/ 26 迁移 / 26 模型 / 6.7 万行 | `doclib/50-testing/benchmark/030-umami-answer-rebuild.md`、`010-umami.md` | 逐字一致 | ☐ |
| 43 仓 / 2,052 误报 | `doclib/10-architecture/decisions.md` ADR #12 | 逐字一致 | ☐ |
| D-01 / D-04 / D-05 / D-08 / D-11 | `doclib/50-testing/benchmark/050-umami-divergence.md` | 条目与裁决逐字核对 | ☐ |
| 成片规格 | `ffprobe renders/doclib-promo-16x9.mp4` | 1920×1080 / 30fps / 240.000s / 音轨 0 | ☐ |

## 发布 checklist

- ☐ 数值核对表逐行复跑并打勾（并发开发期数字漂移快）
- ☐ `npm view @panxiangyu1995/doclib version` 与片中声明一致（**不一致则不要发布**——视频会失真）
- ☐ 成片重新渲染终版（`--output renders/doclib-promo-16x9.mp4`），不沿用旧渲染
- ☐ 封面帧从最新 `snapshot` 选取
- ☐ 简介中的安装命令实跑一遍（`npx @panxiangyu1995/doclib init --agents claude,opencode`）
- ☐ 成片挂 GitHub Release 附件（不进 git 仓库，避免二进制膨胀）
- ☐ B 站上传后回填发布链接到本篇与 `doclib/00-overview/progress.md`

## 风险与取舍

| 风险 | 现状 | 处置 |
| --- | --- | --- |
| 无音轨 | 拍板决策（纯字幕动效）；工具的 `film_silent` warning 保留为已知项 | 若完播率不佳，下一版可加 BGM 床（本地 MusicGen 或授权音乐），并同步本篇与 `script.md` |
| 并发期数字漂移 | README 现状表已多次失真（0.5.0/13/10/283 等） | 数值核对表逐行复跑是发布前硬门 |
| 竖屏分发 | 本片仅 16:9；9:16 变体未做（各幕为 16:9 专用栅格布局，改竖版需重排，不是零成本） | 需要时单独立项重排竖版 composition，不做简单缩放充数 |
| 平台转码 | 平台会二次转码 | 不追 4K/60fps（官方分级建议：社交平台不值当） |

## 关联

- 分镜：[storyboard.md](storyboard.md)｜字幕：[script.md](script.md)｜复现：[production.md](production.md)
