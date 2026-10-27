---
title: 推广视频生产复现指南
covers:
  - video
type: narrative
status: living
---

# 推广视频生产复现指南

> 本片用 **HyperFrames**（HeyGen 开源，Apache-2.0）作视频生成层：写 HTML → 渲 MP4，agent-first、无构建步骤。
> 本篇是**复现规格**：任何人只凭本篇 + `video/` 目录即可重建同一支片子。

## 为什么

选 HyperFrames 而不是「写视频代码的库」或「AI 生成视频」：本片的画面本质是**排版 + 终端 + 数字滚动**——
用 HTML/CSS 表达最直接，且写出来的 composition **既能被 agent 编辑，也能被浏览器预览**；Remotion 走 React + bundler，
对「agent 写文件」的心智模型更重，许可也不是 Apache-2.0。

更关键的是**知识与产物的分离**：本片不放进 `doclib/` 馆内。`doclib/` 在 `src/core/fsutil.ts` 的 `DEFAULT_IGNORES` 内
（第 17-18 行），整个目录**不在代码账**——把 composition 源放进去，任何 `covers` 锚点都不会触发，「改了视频源没人知道」
就是治理盲区；而馆内又明写「纯 Markdown 产物」三原则。所以：**文字规格入馆（40-guides/video/），工程源留在仓库顶层
`video/` 靠 `covers: [video]` 兜底**，与 `assets/`、`skills/` 的既有处理同构。

## 是什么

### 目录结构

```
video/
  index.html                    根 composition：8 幕时间轴编排（data-composition-src 嵌套）
  hyperframes.json              工程配置（blocks=compositions / components=compositions/components / assets=assets）
  package.json                  复现脚本（dev / check / render / publish）
  compositions/
    scene-00-checkup.html       幕 0 治理体检
    scene-01-rotted.html        幕 1 六类失效
    scene-02-library.html       幕 2 12 卷图书馆
    scene-03-twoanswers.html    幕 3 同一问题两次回答
    scene-04-growth.html        幕 4 从空目录生长
    scene-05-coldstart.html     幕 5 agent 冷启动
    scene-06-defects.html       幕 6 自曝缺陷
    scene-07-meta.html          幕 7 元自证 + CTA
  assets/
    styles/base.css             设计系统：色板 / 字号阶 / 共享组件类（字幕层 / 面板 / 环形仪表 / 目录树 / 卡片 / 格矩阵）
    styles/terminal.css         终端面板主题（纯 ASCII 内容）
    fonts/noto-sans-sc/         Noto Sans SC woff2（OFL-1.1，chinese-simplified + latin，400/700 两档）
  vendor/gsap.min.js            GSAP 3.15.0 本地副本
  renders/                      渲染产物（.gitignore，不进版本库）
```

### 三条硬约束（都是实测结论，不是偏好）

1. **终端画面只呈现 ASCII**——本机 Menlo / SFNSMono 仅拉丁，Hiragino Sans GB / STHeiti 是**比例**字体，
   且 fontsource 无 CJK 等宽包（`@fontsource/noto-sans-mono-cjk`、`@fontsource/sarasa-mono-sc` 均 404）；
   中文入框必错位。中文解释一律移到字幕层与右栏标签。
2. **资产路径以项目根为基准**（`assets/...`、`vendor/...`）——官方约束如此；已实测在**独立 composition**
   （`hyperframes render --composition compositions/xxx.html`）与**嵌套 composition** 两种形态下均正确加载。
3. **动画库本地 vendor，不用 CDN**——catalog 积木默认引 jsdelivr，那是渲染期网络依赖；本片把 GSAP 拷进
   `vendor/`，渲染完全离线可复现。

### 根 composition 的时间轴

| 幕 | start | duration | track |
| --- | --- | --- | --- |
| 0 | 0 | 15 | 0 |
| 1 | 15 | 30 | 0 |
| 2 | 45 | 30 | 0 |
| 3 | 75 | 50 | 0 |
| 4 | 125 | 40 | 0 |
| 5 | 165 | 25 | 0 |
| 6 | 190 | 30 | 0 |
| 7 | 220 | 20 | 0 |

根节点带 `data-no-timeline`（它只做编排、不注册 `window.__timelines`）。**这一行把渲染从 54s 降到 6.3s**——
没有它，渲染器会等满 45s 的「子时间轴就绪」超时（setup 阶段）。

## 怎么运转

### 搭建与渲染命令

```bash
# 依赖（本机已具备：Node 22+ / Chrome / FFmpeg；`npx hyperframes doctor` 可自检）
brew install ffmpeg

# 质检三件套（渲染前必跑）
npx hyperframes lint      # 结构：0 errors 0 warnings
npx hyperframes check     # 运行时 / 布局 / 动效 / 媒体 / 对比度

# 迭代渲染（draft 档，CRF 低、快）
npx hyperframes render --quality draft --output renders/draft.mp4

# 单幕试渲（独立 composition 也能渲，路径已实测）
npx hyperframes render --composition compositions/scene-03-twoanswers.html --quality draft --output renders/scene-03.mp4

# 终版（默认 looks 档，CRF 16，1920×1080 / 30fps）
npx hyperframes render --output renders/doclib-promo-16x9.mp4

# 位级可复现验证（锁 Chromium + 字体 + FFmpeg）
npx hyperframes render --docker --output renders/docker-verify.mp4

# 关键帧目视（选封面用）
npx hyperframes snapshot --at 8,95,232 --output renders/cover
```

### 复现前提

| 依赖 | 版本 | 缺失后果 |
| --- | --- | --- |
| Node.js | ≥22（本片实测 v24.15.0） | 低于 22 渲染器不工作 |
| FFmpeg / FFprobe | 任意近期版（本片 9.0.2） | 缺则无法编码，`doctor` 直接报 `FFmpeg is required` |
| Chrome | 系统安装即可（本片用系统 Chrome） | 缺则渲染器自动下载 Chromium |
| GSAP | 3.15.0，已 vendored | 不需联网 |

### 修改本片的正确顺序

1. 改 `doclib/40-guides/video/script.md`（文案）与 `storyboard.md`（分镜/时间轴）
2. 改 `video/compositions/scene-XX-*.html`（画面与时间轴）
3. 跑 `lint` → `check` → draft 渲染 → `snapshot` 目视
4. 同步 `production.md`（若结构/命令/约束变了）与 `publishing.md`（若数字变了）
5. `doclib check --strict` → 违规必须为 0（`video/` 被 `production.md` 与 `storyboard.md` 的 `covers` 锚定，
   改了 composition 不同步文档会判「无归属」）

### 已知坑（实测踩过）

| 坑 | 现象 | 规避 |
| --- | --- | --- |
| `white-space: pre` 挂在**容器**上 | 容器内 div 之间的 HTML 源码缩进/换行被渲染成额外行盒 → 终端行距暴涨、面板溢出画布、压住字幕 | `pre` 只挂在**行级**元素（`.term-line`）上，容器用默认换行 |
| `tl.call()` 驱动文本 | 回退 seek 时回调不重放 → 序号与画面错位 | 用**时间函数**驱动（proxy 对象 + `onUpdate` 读 `tl.time()`） |
| `tl.fromTo` 目标选择器重复 | GSAP 在 authoring 期就套用 from 值（immediateRender）→ seek 到首帧前状态被污染 | 先 `gsap.set` 建立基线，fromTo 带 `immediateRender: false` |
| 子 composition 根用 class 造型 | 渲染时每条子 composition 规则被 scope 到 `[data-composition-id]`，根自身的 class 选择器匹配不到 | 根用 `id="root"` + `#root { }` 造型（scoper 特殊处理该形状） |
| 根不注册 timeline 却等就绪 | 每次渲染多等 45s 超时 | 根加 `data-no-timeline` |
| 字号低于 28px | `check` 报 `text_below_floor`（手机可读下限） | 阅读型文本 ≥28px；纯装饰文字加 `data-layout-ignore` |
| `--docker` 的 CJK 字体 | 本片字体是**本地 woff2 + `@font-face`**，与容器字体集无关 | 故位级复现不受环境影响（成片自证） |

## 怎么验收

| # | 标准 | 判据 |
| --- | --- | --- |
| 1 | 结构 | `npx hyperframes lint` → 0 errors 0 warnings |
| 2 | 运行时 | `npx hyperframes check` → Check passed（唯一 warning 是 `film_silent`，无音轨是拍板决策） |
| 3 | 规格 | `ffprobe` → 1920×1080 / 30fps / 7200 帧 / 240.000s / 音轨 0 |
| 4 | 中文字形 | `snapshot` 关键帧目视无豆腐块；终端画面框线不错位 |
| 5 | 布局 | `check` 无 `content_overlap` / `canvas_overflow` |
| 6 | 可复现 | `--docker` 版与本地版逐帧一致 |
| 7 | 治理 | `doclib check --strict` → 违规 0；治理 100/100 (A) |
| 8 | 锚点 | 改 `video/compositions/` 任一文件 → `check` 报「无归属」→ 同步 `storyboard.md` → 清零 |

## 参考

- 分镜与数字来源：[storyboard.md](storyboard.md)｜字幕全文：[script.md](script.md)｜发布规格：[publishing.md](publishing.md)
- 验收留痕：`doclib/50-testing/acceptance-promo-video-v0.8.0.md`
- 规划载体：`.plan/2026-10-27/promo-video-hyperframes.md`
- HyperFrames 文档：https://hyperframes.heygen.com/quickstart
