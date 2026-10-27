---
title: 推广视频成片验收报告（v0.8.0）
covers:
  - video
type: ledger
status: stable
---

# 推广视频成片验收报告（v0.8.0）

> 对象：DocLib 首支推广视频（HyperFrames 工程，仓库 `video/`）· 规划载体 `.plan/2026-10-27/promo-video-hyperframes.md`
> · 验收日期 2026-10-27 · 全部判据以**命令实跑 + 关键帧目视**留痕，不接受自述。

## AC 逐条判定

| # | 验收标准 | 判据 | 结果 |
| --- | --- | --- | --- |
| AC-1 | 结构合规 | `npx hyperframes lint` | ✅ 0 errors / 0 warnings（9 个文件） |
| AC-2 | 运行时 / 布局 / 动效 / 对比度 | `npx hyperframes check` | ✅ Check passed（exit 0）；唯一 warning = `film_silent`（无音轨是拍板决策） |
| AC-3 | 运行时无 JS 错误、对比度达标 | `npx hyperframes validate` | ✅ No console errors · 89 text elements pass WCAG AA |
| AC-4 | 成片规格 | `ffprobe renders/doclib-promo-16x9.mp4` | ✅ 1920×1080 / 30fps / 7200 帧 / 240.000s / h264 / 8,883,015 B / **音轨 0** |
| AC-5 | 中文字形正确 | `snapshot` 关键帧目视 | ✅ 无豆腐块；Noto Sans SC（OFL-1.1）本地 woff2 加载正确 |
| AC-6 | 终端画面不错位 | 关键帧目视 | ✅ 终端**只呈现 ASCII**（本机无 CJK 等宽字体，中文入框必错位） |
| AC-7 | 无重叠 / 无溢出 | `hyperframes check` 的 layout 面 | ✅ 0 `content_overlap` / 0 `canvas_overflow` |
| AC-8 | 8 幕全部到位 | 8 个关键帧目视 | ✅ 幕 0-7 逐幕核对（体检 / 六症状 / 12 卷 / 96.4% / 生长 / 冷启动 / 缺陷账 / 元自证） |
| AC-9 | 数字真实 | `publishing.md` 数值核对表 | ✅ 片中 10 组数字均指向馆内既有账（见下表） |
| AC-10 | 库内治理不破 | `doclib check --strict` | ✅ 违规 0；治理 100/100 (A) |
| AC-11 | covers 锚点真生效 | 改 `video/compositions/` → `check` → 同步 `storyboard.md` → 清零 | ✅ 见「锚点自证」节 |
| AC-12 | 渲染确定性 | 同机二次全片渲染 → 逐帧哈希比对 | ✅ **7200/7200 帧位级一致**（`ffmpeg -f framemd5` 两次渲染 md5 完全相同） |
| AC-13 | 环境无关性（docker 位级复现） | `hyperframes render --docker` | ⏳ **环境受限，结论待补**——CLI 自身 10 分钟镜像构建上限两次触发（apt 层装 chromium + fonts-noto-cjk 每次超时 → 层无法缓存，重跑仍超时；构建上下文每次被清理）。环境无关性另有结构保障：字体为**本地 woff2 + `@font-face`**，不依赖容器字体集，GSAP 亦本地 vendor |

## 数字溯源

| 片中数字 | 馆内出处 | 核对 |
| --- | --- | --- |
| 100/100 (A)、五分项全 100 | `doclib check` 实跑 | ✅ |
| 12 卷 + `98-sessions` | `doclib/` 13 个卷目录 | ✅ |
| 71 条 AC | `doclib/50-testing/benchmark/030-umami-answer-rebuild.md` | ✅ |
| 53/55 = 96.4% | `doclib/50-testing/benchmark/010-umami.md` | ✅ |
| 回归 71/71 = 100% | `doclib/50-testing/benchmark/070-umami-regression.md` | ✅ |
| 124 路由（168 操作）/ 26 迁移 / 26 模型 | `doclib/50-testing/benchmark/030-umami-answer-rebuild.md`、`010-umami.md` | ✅ |
| 6.7 万行（325 源文件） | `doclib/50-testing/benchmark/010-umami.md` | ✅ |
| 43 仓 / 2,052 误报 → 0 | `doclib/10-architecture/decisions.md` ADR #12 | ✅ |
| D-01 / D-04 / D-05 / D-08 / D-11 | `doclib/50-testing/benchmark/050-umami-divergence.md` | ✅ 逐字核对 |
| CLI 14 / skills 11 / 350 用例 | `package.json` · `src/commands/` · `skills/` · `npm test` | ✅ |

## 制作期发现并修复的缺陷（5 项）

| # | 缺陷 | 根因 | 处置 |
| --- | --- | --- | --- |
| D-1 | 终端面板行距暴涨 3 倍、溢出画布、压住字幕 | `white-space: pre` 挂在**容器**上 → HTML 源码缩进/换行被渲染成额外行盒 | `pre` 只挂行级元素 `.term-line`；容器回默认换行 |
| D-2 | 幕 1 巨型序号与卡片可能不同步 | `tl.call()` 在回退 seek 时不重放 | 改为时间函数驱动（proxy + `onUpdate` 读时间） |
| D-3 | 幕 3 回归拍点亮错矩阵（55 格却显示 71/71） | 回归应对应 71 条 AC 全集，误用了 55 格矩阵 | 回归拍改点亮左列 71 格，分母显式标注「71 / 71 回归」 |
| D-4 | 幕 6「工具链类误报 2,052」被动画归零，读不出「2,052 → 0」 | 把**历史实测值**当成了会变的当前值 | 2,052 保持不动；只有「修正后误报」在 16.4s 降为 0 |
| D-5 | 幕 2 目录树与字幕层重叠 | 13 行 × 行高 1.85 超出安全区 | 该幕行高改 1.5、`padding-top` 收至 96px |

## 探针实验（先实测再落地，避免猜测）

| 探针 | 结论 |
| --- | --- |
| P-1 CSS root-relative 在**独立 composition** 中是否加载 | ✅ 加载（绿色背景来自 `assets/styles/base.css`） |
| P-2 GSAP 本地 vendor + timeline 被 seek 驱动 | ✅ t=0 文字未显影（≈背景色）/ t=0.4 显影 → 时间轴生效 |
| P-3 中文 webfont（Noto Sans SC，本地 woff2） | ✅ 字形正确，无豆腐块 |
| P-4 嵌套 composition（`data-composition-src`）+ 各自 timeline | ✅ t=1 命中幕 A / t=3 命中幕 B，时间轴编排生效 |
| P-5 根不注册 timeline 的等待开销 | ✅ 加 `data-no-timeline` 后渲染 54.2s → **6.3s**（setup 49.5s → 2.2s） |

## 锚点自证

前提：`video/` 已进基线（否则新文件算「文档先行」，不会触发漏更）。完整序列：

1. `doclib snapshot` 固化含 `video/` 的基线
2. 改 `video/compositions/scene-03-twoanswers.html` 一个字 → `doclib check` 判**「漏更：覆盖文档未更新」**，列出三份候选覆盖文档
   （`40-guides/video/production.md`、`40-guides/video/storyboard.md`、`50-testing/acceptance-promo-video-v0.8.0.md`）
3. 同步 `doclib/40-guides/video/storyboard.md` → 该项**清零**（余下仅为反哺指纹的次生项：库变更 → `guide-project.md` docs-hash 失配 → 重蒸馏即消）
4. 还原两处 → 违规 0、漂移 0、治理 100/100 (A)

→ 证明「工程源靠 `covers` 兜底」不是装饰性登记：**改视频源不同步文档会被机器拦住**。

> 自证方法上的一个坑（已入 95-lessons）：首测用 `perl` 替换 `storyboard.md` 里的一句中文，但那句实际在 `script.md` —— 替换是**空操作**，文档哈希未变，于是 check 仍判漏更，一度被误读为「锚点没生效」。教训：**验证机制生效前，先断言被作用对象真的变了**（内容 diff / 哈希），再断言检查结果。


## 已知取舍

| 项 | 说明 |
| --- | --- |
| 无音轨 | 用户拍板「纯字幕动效（无旁白）」；`film_silent` warning 保留为已知项，非缺陷 |
| 9:16 竖版未做 | 各幕为 16:9 专用栅格布局，改竖版需重排而非缩放；本片定位 B 站横屏，竖版单独立项 |
| 字体子集化未做 | `chinese-simplified` 全量 woff2 约 1.1MB/档（400+700 共 2.2MB）；子集化需 pyftsubset（本机无 fonttools），列为后续优化 |
| `hyperframes validate` 已废弃 | 官方提示改用 `check`；本轮两处都跑过，结论一致 |
| docker 位级复现未取得 | CLI 自身 10 分钟镜像构建上限（见 AC-13）；已用同机二次渲染逐帧哈希等价证明确定性 |

## 确定性验证（AC-12 证据）

```
渲染 ①：npx hyperframes render --output renders/doclib-promo-16x9.mp4      → 240.000s / 8.5MB
渲染 ②：npx hyperframes render --output renders/determinism-run2.mp4       → 240.000s / 8.5MB
比对  ：ffmpeg -i A.mp4 -f framemd5 A.md5 ; ffmpeg -i B.mp4 -f framemd5 B.md5 ; diff A.md5 B.md5
结果  ：7201 行（含表头）完全一致 —— 7200/7200 帧位级一致
```

依据：全部动画由 **seek 驱动的 GSAP 时间轴**实现（无 rAF / 无 wall-clock 依赖），数字与文本亦由时间函数驱动
（`tl.call()` 已被替换——见「制作期缺陷 D-2」），故同输入必然同输出。


## 关联

- 复现流程：[doclib/40-guides/video/production.md](../40-guides/video/production.md)
- 分镜与字幕：[storyboard.md](../40-guides/video/storyboard.md) · [script.md](../40-guides/video/script.md)
- 发布规格与数值核对：[publishing.md](../40-guides/video/publishing.md)
- 规划载体：`.plan/2026-10-27/promo-video-hyperframes.md`
