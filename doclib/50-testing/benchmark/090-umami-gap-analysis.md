---
title: umami 实质差距对比（重建 ↔ 原仓库）
covers:
  - test/umami
  - test/umami-rebuild-handover/umami-rebuild
ids: BENCH-UMAMI-GAP
status: stable
---

# umami 实质差距分析（090 · 2026-10-22）

> 目的铁律的执行记录：对比对象=**原仓库**（test/umami @ ec0ff503），非图书馆。每条差距归因三类：**馆缺陷**（漏写/写不清/注记未成条目→回灌）/ **复原取舍**（E 组合法）/ **复原偏差**（对齐）。

## API 面（枚举 diff）

- 原仓库 route.ts 全枚举 **135** ｜ 重建 **124** ｜ **缺失 12**（另 1 个多出：session-data-pivot/properties——子路由组织差异）
- 缺失端点：/links/[linkId]/shares、/pixels/[pixelId]/shares、/teams/[teamId]/{boards,links,pixels,websites}、/websites/[websiteId]/{event-data,event-data-pivot,session-data-pivot,recorder}、/replays/saved/[replayId]
- **归因：馆缺陷**——①/recorder 登记簿漏登记（建馆枚举遗漏）；②团队子列表/资产 shares 以"注记"带过未成条目（表述/结构缺陷）；③透视"入口"端点无契约（"入口"一词无 method/参数/形状）→ 全部已回灌（API-135~141 + 透视契约实测补全）

## 页面/路由面

- 原仓库 page.tsx **60** ｜ 重建 **21**（且路径形态不同：重建加了 src 没有的 **[locale] 前缀层**）
- 缺失 39 页：报表子页×10（attribution…utm）、boards 子页×3、console、admin 详情×3、settings 详情×2、teams/[id]、sessions/replays/segments/events/realtime/cohorts/compare 详情页、@modal×2
- **归因：馆缺陷**——routes.md 只登记 35 条（枚举遗漏 25）+ 无页面级 AC → 已回灌 60 页全量登记；AC 页面可达性断言待补（验收模板已增可观测纪律）
- [locale] 层分歧：馆未记载路由形态 → 已回灌"无前缀"明文

## 资产结构形态

- i18n：src=`public/intl/messages/<locale>.json`（+country/language 元数据目录）｜ 重建=平铺 `public/intl/<locale>.json` → **馆写错**（"public/intl/<locale>.json"）→ 已回灌正确形态
- tracker：重建已构建 script.js ✓（无差距）

## 行为语义

- 首轮 S2 深挖的 13 项语义分歧（bot/内网/收入派生/热图通道/指纹/窗口/cohort/限流/挑战 token/replayId/_slug500/凭证通道/me 形状）已在回归轮对齐 ✓
- 本轮 diff 新增行为面：透视入口参数（eventName/propertyName 缺省 400）——已实测回灌

## 非功能面

- E 组 13 条（react-zen/云模式/契约铺满/159 locale 填充）= 复原取舍，不计馆缺陷

## 结论

首轮 96.4%（馆自洽）掩盖了 **12 端点 + 39 页面 + 2 结构形态** 的实质差距——目的铁律（对比原仓库）生效后全部显影并回灌。skills 修复：doclib-build 增"面穷举清单"（API/页面/资产形态/隐藏语义四类强制成条目+对账 checklist）。
