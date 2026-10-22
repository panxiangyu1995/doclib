---
title: umami 复原档案主册
covers:
  - test/umami
  - doclib/50-testing/benchmark/020-umami-answer-src.md
ids: BENCH-UMAMI
status: living
---

# umami 基准复原档案（010 · 主册）

> F14 复原档案：准入记录 / 基线锚点 / 得分 / 缺陷分类账 / 修复记录。答卷卷：[020-umami-answer-src.md](020-umami-answer-src.md)（原仓库侧）｜030（复原侧，待回传）｜040（REBUILD-LOG 副本，待回传）｜050（差异清单+回灌建议，待回传）。

## 准入记录

- 项目：umami-software/umami @ v3.4.0（39.5k★ MIT 全栈分析平台）
- 锚点 commit：`ec0ff50388c264ed8ce46f00967e92f7e71476ae`（2026-09-16）
- 体量：2030 文件（TS 1368/SQL 44）；Next.js 16 + Prisma 7 + React 19
- 准入判定：宽覆盖面（routes/ui-assets/API/迁移/config/deploy 全占）；切片定义见 BUILD-001.md（复原对象=应用功能面）
- 建馆执行者：本会话（doclib CLI 本地 dist 0.4.0 基础 + agent 撰写）；复原者：隔离环境（用户安排，身份见 040）

## 建馆基线

- 馆基线：snap-002（library version 2，initial build）
- 覆盖率：97%（1384/1431 代码文件；未覆盖=切片外 scripts/db-clickhouse/根配置）
- 治理：100/100 (A)（strict 通过；孤儿 0：2 收编 + 2 ack standing）
- 规模：12 卷 + 登记簿五册（events EVT×26 / api API×133 / config CFG×64 / routes ROUTE×35 / ui-assets ICON×10）+ 34 功能规格 71 AC

## 复原度得分（首轮 · 同题共答，2026-10-21）

- **得分 = 53/55 = 96.4%**（双侧实测一致率；复原侧自验 71/71 ok）
- 双侧实测一致 53 ｜ **分歧 2**（见 R 组）｜ 单侧（仅复原侧实测，全过）16
- 复原者身份：opencode / minimax-m3.1-flash-free（异模型+全新会话，零源访问——审计见 040）
- 复原规模：124 API 路由（168 操作）+ 21 页面 + 26 模型 + 26 迁移 + 161 locale + 325 源文件（6.7 万行）；门禁全绿（typecheck/lint/单测 31/check:env/check:messages/openapi:check/migrate diff 零差异）

### 分歧账（R 组，双侧实测行为不同）

| # | AC | 原仓库 | 复原仓库 | 根因 | 裁定 |
| --- | --- | --- | --- | --- | --- |
| R-01 | AC-20 GET /api/me | `{token,shareToken,authType}` 三件套 | 超集（含 username/role） | S1-5 馆内矛盾（API-022 vs platform/040 AC-20 未同步） | 以原仓库为准→馆已统一三件套（platform/040 已修） |
| R-02 | AC-70 重名 slug | **500** | 400 | S1-6 馆内矛盾（API-061 记 500 vs AC-70 记 400） | 以原仓库为准→馆已统一 500（growth/020 已修）；**回归轮 A10 对齐后实测 500 ✓（分歧消除）** |
| R-03 | AC-40 /api/dashboard | Board 实体端点（getBoard） | 聚合形态（切片外未对齐） | N-07：D-18 修正晚于首轮复原 | 已在馆内统一 Board 语义；复原侧下轮对齐项（不计本轮得分——切片外） |

> 两处分歧均由**馆内自相矛盾**引发（src 侧回灌不彻底），非复原者过错——同题共答机制如设计生效：矛盾在双跑中显形。

### S1/S2/S3 处置（复原侧回灌建议 060 卷）

- **S1 七项矛盾**：全部裁定并清扫完毕（307 统一/annotation 200/path/三件套/500/verify POST；17 处修改，grep 复查清净）——根因=src 回灌漏改 4 文件，教训入 95-lessons
- **S2 二十四项缺口**：**全部处置完毕（第二批回灌，源码深挖）**——bot 口径（isbot@5.2.2 全量，curl/裸 UA 拒）；内网默认不过滤；**必填参数总表集中化**（api-analytics）；**sourceId 多态归属**（link/pixel 事件 website_id=资产自身 UUID）；热图写入=/api/record 分流（≤1MB）；收入=saveEvent 派生（data.revenue>0&&currency）；**会话指纹公式 uuid(sourceId, ip, userAgent, salt, distinctId)——IP 入指纹（证据纠正复原者猜测）**；visitId 轮换=token.iat>1800s 且无 timestamp；cohort 键=session；漏斗 window=步骤链 SQL 分钟区间；2FA 限流 5 次/15 分钟（复原者猜测与源码一致）；挑战=partial token；replayId≡visitId（getReplayChunks 按 visit_id 查询）；share slug 缺省 16 位随机；share/id 需登录+canViewEntity；board parameters 透传；values 白名单=FILTER_COLUMNS；metrics 越权 401 如实登记；comparison/weekly/retention/heatmap 形状补全；filter+segment 并集（复原口径暂记）；AC-70 示例 slug 修正；**D-18：/api/dashboard 实为用户 Board 实体端点（非聚合）→ API-134 补登记 + analytics/010 修正**
- **S3 二十项建议**：待逐条裁决（低优先）
- **DIFFS D 组 32/E 组 13**：E 组为复原自洽偏离（react-zen 未用/云模式接口位/21/45 路由/契约未铺满），属复原实现范围取舍，不计图书馆缺陷；D 组待逐条复核后决定回灌

## 缺陷分类账（原仓库侧已显形 14 项，全部为 doclib 图书馆缺陷，非 umami 缺陷）

| # | 分类 | 缺陷 | 处置通道 | 状态 |
| --- | --- | --- | --- | --- |
| D-01 | 内容 | 30-features 写 201/302 等，实际 200/307 | 内容缺陷→umami 馆回灌 | **已修**（collection/010、growth/020、analytics/160 等回灌） |
| D-02 | 表述 | bot 软拒契约未记载 | 表述→回灌 | **已修**（api-collect + AC-04 回灌） |
| D-03 | 内容 | send 契约缺 cache token 响应语义 | 内容→回灌 | **已修**（send 载荷契约节） |
| D-04 | 验收 | 认证载体失真（cookie→响应体 token） | 验收+表述 | **已修**（010-auth 回灌 + 30-features 模板/accept skill 增"契约从响应实证"纪律，178/178 绿） |
| D-05 | 内容 | verify/sso 方法失真 | 内容→回灌 | **已修**（api-auth-identity + 010-auth） |
| D-06 | 内容 | /api/me 形状失真 | 内容→回灌 | **已修** |
| D-07 | 内容 | slug 约束缺**≥8 字符**（仅记"唯一"）；重名 slug 实测 **500**（非友好 4xx）——原仓库实况需如实记载 | 内容→回灌 | **已修**（api-management + growth/020 AC-70 统一 500） |
| D-08 | 内容 | 报表端点参数级契约大量缺失 | 内容+结构 | **已修**（api-analytics 逐端点回灌实测参数；结构演进观察项 D-12 继续） |
| D-09 | 内容 | share name 必填 + DELETE 405 | 内容→回灌 | **已修** |
| D-10 | 内容 | teams 创建返回列表 | 内容→回灌 | **已修** |
| D-11 | 验收 | AC 期望缺可观测断言 | 验收→模板改进 | **已修**（30-features 模板"断言可观测性纪律"+ accept skill；存量 71 AC 的期望值随回灌逐条校正） |
| D-12 | 结构 | 报表端点参数级契约（type 枚举/必填参数）在 api 册表格行承载不下——**登记簿条目正文承载参数表的形态需演进**（PRD Q26 落点复检） | 结构→PRD 演进候选 | 观察项 |
| D-13 | 内容 | utm/identify/attribution/segment/pivot/weekly 深度契约缺失 | 内容→回灌 | **已修**（深挖后全部实测闭环并回灌：utm 从 URL 查询串提取、session-data 仅统计有事件活动会话、attribution model/type/step、segment parameters.properties、weekly timezone） |
| D-14 | 表述 | REBUILD 任务书引用 `40-guides/rebuild-plan.md`（实际文件 roadmap.md）——CLI 模板与骨架模板不同步 | 表述→doclib 产品模板修复 | **已修**（plan.ts:134） |
| D-17 | 内容 | REBUILD 任务书文件体缺 revision 行（F14 要求"任务书与 stdout 均含"，stdout 有文件体无）——乐观锁在交付件上断链 | 内容→doclib 产品模板修复 | **已修**（plan.ts REBUILD 模板 + 交付件就地补嵌 revision 3） |

## 交付记录

- **2026-10-21**：交接包固化 `test/umami-rebuild-handover/`（doclib/ 90 文件 + REBUILD-001.md[revision 3] + README 复原者须知）+ 同名 zip（117 KB）；隔离自检：交付件无答卷/实测结果泄漏；D2 三级方案由用户择一执行，复原者身份随 REBUILD-LOG 回传统计

## 修复记录（src 侧四通道，2026-10-21 执行）

- **内容缺陷回灌**（umami 馆）：api-collect/api-auth-identity/api-management/api-analytics 四册 + collection/identity/auth/2FA/user/websites/links/revenue/utm/attribution/funnels 等 15+ 篇规格逐条校正；data-model/data-flow reset 双语义修正；95-lessons 增 2 条（reset 双语义、执行顺序伪影）
- **表述/验收通道**（doclib 产品）：30-features 模板增"断言可观测性纪律"+ accept skill 同步（D-04/D-11）；REBUILD 任务书模板引用修复 rebuild-plan→roadmap（D-14，src/commands/plan.ts:134）；build+178/178 绿 + sync
- **结构通道（D-12）**：登记簿条目正文承载参数级契约的形态已实测可用（api-analytics 表列+补记节），PRD 演进待复原侧答卷佐证后裁决
- **新增缺陷 D-15/D-16**（修复中显形）：reset 双语义失真（已修）、password ≥8 策略缺失（已修）
- **得分影响**：答卷补测后 通过/通过-偏差 55 · 部分 9 · 未验 7（见 020 汇总）

## 第二批回灌（S2 全量 · 2026-10-21）

- D-18（新）：/api/dashboard 实为用户 Board 实体端点（非聚合）→ API-134 补登记 + analytics/010 规格修正
- S2 22 项全量源码深挖回灌（见上方处置清单）；复原者两项猜测一正（限流 5/15）一误（IP 不入指纹）——**证据裁决机制有效**
- 回归触发状态：本轮全部为**内容更新**（非结构变更）→ 按 benchmark.md 应做受影响切片抽查跑；AC-20/AC-70 两处分歧的回归判定 = 复原仓库对齐三件套/500 后重跑双侧

## D 组复核与 S3 裁决（2026-10-21 第三批）

### D 组 32 条复核（对照源码/实测逐条判定）

- **A 与源一致（12 条，无需动作）**：D-01（307）、D-02（200）、D-10（限流 5/15）、D-12（identify 复用+updateSession）、D-18（step=值匹配）、D-19（heatmap 聚合行）、D-20（越权 401）、D-21（有活动会话前提）、D-22（缺失 404）、D-26（verify POST+405）、D-28（teams 数组）、D-32（--explicit 语义近似）
- **B 偏差——回归对齐清单（13 条，复原实现与源不同；馆已按源回灌，回归轮需复原侧对齐）**：

| # | 点 | 源行为（馆已记载） | 复原行为 |
| --- | --- | --- | --- |
| D-03 | metrics 维度别名 | type=url → **400**（不收别名） | url≡path 别名皆收 |
| D-04 | bot 判定 | 纯 `isbot(ua)`（curl/裸 UA 均拒） | isbot+爬虫语义标记（curl 放行） |
| D-05 | 内网过滤 | 传输层与显式内网 IP **均接受** | 显式内网 IP 拒 |
| D-06 | link/pixel 事件归属 | **sourceId 多态：website_id=资产自身 UUID** | 归属者第一个网站 |
| D-07 | 热图写入 | `/api/record` 分流 | send payload.heatmap |
| D-11 | cache id | 仅接受 cache JWT | 兼容裸 sessionId |
| D-13 | 收入采集 | data 内 revenue>0&&currency 派生 | payload 顶层 revenue/currency |
| D-14 | funnel window | 步骤链间隔（SQL interval） | 访问段窗口上限 |
| D-15 | 留存 cohort | 纯 session_id | COALESCE(distinct_id, 指纹) |
| D-23 | 重名 slug | **500** | 400 |
| D-24 | 凭证通道 | 仅 body token+Bearer | token+cookie 双通道 |
| D-25 | /api/me | 三件套 | 超集 |
| D-27 | sso 无云配置 | POST → **401** | POST → 404 |

- **C 工程适配（5 条）**：D-08/09/29/30/31（工具链与内容适配，无需对齐）；**D-16 升 B**（replay chunk 主键=src `uuid()` 随机——重复上报会产生重复行，复原用确定性 UUID 幂等，回归对齐点）；**D-17 落地**（paidAds 桶按平台名归类 Google Ads/Facebook Meta/Microsoft/TikTok/LinkedIn/Twitter X，值=去重会话数；referrer 桶按 channel 分组——getAttribution 实证）

### S3 裁决（8 条：7 落地 / 1 待核）

- 已落地：S3-01（comparison 同名 5 键）、S3-03（weekday/hour/count）、S3-04（date=cohort 首访期）、S3-05（attribution 桶=值→计数映射，实测 `{referrer:{direct:1}}`）、S3-06（utm type 必填无缺省——schema z.enum）、S3-07（send 响应 `{type,id,cache}`）、S3-08（heartbeat=`{ok:true}`，实测）
- 已落地（补）：S3-02（charts **ids 必填** + `{data:{<id>:{values,total}}}` 形状，实测）——S3 八项全闭环

### 回归对齐结论

首轮 B 类 13 条 + 分歧 2 项（R-01/R-02 含于 D-25/D-23）构成**回归切片工作清单**：复原侧对齐后重跑受影响 AC 切片（01/04/05/06/20/25/50/52/60/61/70/71 + 热图/收入/留存/归属链路）——预期对齐后双侧一致率趋 100%。

## 回归轮启动（2026-10-21）

- 回归工单包固化：`test/umami-regression-pack/`（更新版图书馆 90 文件 + ALIGNMENT.md[13 项对齐清单+20 条切片] + README）+ zip
- 工单性质：受指导对齐（13 项源行为明示）——回归验证图书馆修正后的驱动正确性，不计入首轮校准得分；REBUILD-LOG 须声明该性质
- 完成标准：切片 20 条双侧一致；回传 REGRESSION-RESULTS.json + ALIGNMENT-LOG.md

## 回归轮结果与封卷判定（2026-10-21）

- **切片 22/22 一致**（REGRESSION-RESULTS.json，[070 卷](070-umami-regression.md)）；全量 71 条复跑 **71/71**；**回归得分 100%**（R1 达成且不回退：96.4% → 100%）
- 对齐 13 项逐条落地（[080 卷](080-umami-alignment-log.md)）：源行为复刻实证——AC-70 真实 500、AC-50 Revenue 行、AC-05/69/71 website_id=资产 UUID、AC-11 无 cookie 下发
- **新发现 8 条（N 组）= 复原协同的回灌素材，本轮全部处置**：N-01 AC-08 双路径语义（已修）、N-02 AC 命令块 UA（已修）、N-02' **cookie 残留命令块全馆清扫**（16 文件——N 组筛查扩大发现）、N-03 AC 命令块补必填参数（已修）、N-04 API-121 值类型（已修）、N-05 session_link 无时间列说明（已修）、N-06 Session.websiteId 多态（已修）、N-07 AC-40 Board 语义（已修）、N-08 growth/020 400 残留（复核时点差异，馆内已是 500）
- **收敛判据**：R1 ✓（100% 且不回退）｜ R2 ✓（本轮零结构缺陷；8 条表述/验收缺陷即发现即修复）｜ R3 ✓（双馆治理 100/A）｜ R4 ✓（八问可答：部署/数据流/边界/错误面/配置全集/API 形状/图标位置/演进缘由均落于馆）
- **umami 基准档案封卷**。首轮得分 96.4% 与回归 100% 并存为档案数据（受指导对齐性质已声明）

## 实质差距对比（重建↔原仓库 · 2026-10-22，目的铁律生效）

- **API 面**：缺 12 端点（归因：recorder 漏登记 + 注记式承载 + 透视入口无契约）→ API-135~141 补登记 + 透视契约实测回灌
- **页面面**：60 vs 21（[locale] 层分歧 + 39 页缺失；routes.md 枚举漏 25）→ routes 重写 60 页全量 + 无前缀明文
- **结构形态**：i18n messages/ 子目录组织（馆原记载错误）→ 已修正
- **方法论修复**：doclib-build skill 增"面穷举清单"四类强制条目化 + 对账 checklist；目的铁律入 benchmark.md/PRD/95-lessons/AGENTS
- 完整分析见 [090-umami-gap-analysis.md](090-umami-gap-analysis.md)
