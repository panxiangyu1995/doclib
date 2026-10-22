# ALIGNMENT-LOG · umami 复原回归轮（受指导对齐 + 切片重跑）

> **性质声明**：本轮为**受指导对齐**——`test/umami-regression-pack/ALIGNMENT.md` 已明示 13 项源行为（A1–A13），
> 复原者据此把实现对齐到**更新后的图书馆**（随包 `doclib/` 已整体替换本项目 `doclib/`），
> 并重跑受影响 AC 切片。**属回归验证性质，不计入首轮校准得分**。
>
> - 复原者：opencode / minimax-m3.1-flash-free（同一实例续跑；本轮 13 项源行为已由工单明示，无新增污染面）
> - 依据唯一事实源：`test/umami-regression-pack/doclib/`（**已整体替换** `umami-rebuild/doclib/`，原校准版备份于 `/tmp/umami-doclib-calibrated-backup`）
> - 纪律：只读随包 `doclib/` 与本项目复原代码；未访问 umami 官方渠道；E 组 13 条取舍（react-zen / 云模式 / 页面路由数 / 契约铺满）本轮不动
> - 切片结果：`REGRESSION-RESULTS.json`（22 条，与首轮 `ACCEPTANCE-RESULTS.json` 同 schema：id/action/expected/actual/ok/evidence）——**22/22 一致**
> - 全量回归：同口径重跑 71 条 AC 亦为 **71/71 一致**（`ACCEPTANCE-RESULTS.json`）

---

## 0. 对齐总览

| # | 点 | 对齐后行为 | 涉及 AC | 状态 |
| --- | --- | --- | --- | --- |
| A1 | metrics 维度别名 | `type=url` → **400**（不收别名） | AC-43 | ✅ 已对齐 |
| A2 | bot 判定 | **纯 `isbot(ua)`**（移除爬虫语义标记叠加层） | AC-01/04 | ✅ 已对齐 |
| A3 | 内网过滤 | 仅 `IGNORE_IP` 黑名单生效（回环/私网/显式声明 IP 均接受） | AC-01 | ✅ 已对齐 |
| A4 | link/pixel 事件归属 | **sourceId 多态**：`website_event.website_id` = link/pixel 自身 UUID | AC-05/69/71 | ✅ 已对齐 |
| A5 | 热图写入 | 经 **`POST /api/record`** 分流承载（移除 send payload.heatmap） | AC-54 | ✅ 已对齐 |
| A6 | cache id | `payload.id` **仅接受 cache JWT**（CACHE_TOKEN_TYPE 校验） | AC-06/08 | ✅ 已对齐 |
| A7 | 收入采集 | Revenue 由 **saveEvent 从 `event.data` 派生**（`revenue>0 && currency`） | AC-50 | ✅ 已对齐 |
| A8 | funnel window | window = **步骤链间隔上限**（步与步之间） | AC-45/46 | ✅ 已对齐 |
| A9 | 留存 cohort | cohort 键 = **纯 session_id**（min(created_at) 为首访期） | AC-49 | ✅ 已对齐 |
| A10 | 重名 slug | links/pixels 重名 → **500**（唯一约束未友好处理，如实复刻） | AC-70 | ✅ 已对齐 |
| A11 | 凭证通道 | **仅 body token + `Authorization: Bearer`**（登录不下发 cookie；auth() 不读 cookie） | AC-11/13 | ✅ 已对齐 |
| A12 | GET /api/me | **`{token,shareToken,authType}` 三件套**（资料走 POST /api/auth/verify） | AC-20 | ✅ 已对齐 |
| A13 | sso 无云配置 | `POST /api/auth/sso` 无 CLOUD_URL → **401** | AC-18 | ✅ 已对齐 |

> 另按馆内实证顺带对齐（非 A 清单，但同源契约）：会话指纹/访问段派生（S2-09/S2-10）、`send` 成功响应体
> `{type,id,cache}`（S3-07）、热图聚合形状（S2-13）、attribution 渠道兜底组、必填参数表（S2-05）的可判定性处理。

---

## 1. 逐项对齐记录

### A1 · metrics 维度别名（`type=url` → 400）

- **改动点**
  - `src/lib/constants.ts`：`EVENT_COLUMNS` 移除 `url`（白名单回到 API-072 原文：path/fullPath/entry/exit/referrer/domain/title/query/event/tag/hostname…）。
  - `src/lib/filters.ts`：`FILTER_COLUMN_SQL` 移除 `url` 别名；新增独立的 `BREAKDOWN_FIELD_SQL`（含 `url`）仅供 breakdown 端点使用。
  - `src/app/api/websites/[websiteId]/metrics/route.ts`：type 先查越权名单（breakdown/utm/attribution → **401**），再查白名单——不在白名单 → **400**（`code: invalid-metric-type`）。
  - `src/queries/sql/breakdown/getBreakdown.ts` 改用 `BREAKDOWN_FIELD_SQL`；breakdown 路由同时支持馆内必填参数 `fields`（JSON 数组）与单维度 `type`。
- **馆内依据**：`90-reference/api-analytics.md` API-072（type 白名单 + 越权类型 401）；`30-features/analytics/020-basic-metrics.md`（白名单表述）；ALIGNMENT A1。
- **自验证据**：AC-43 —— `GET /metrics?type=url` → **HTTP 400** `{"message":"Invalid metric type: url","code":"invalid-metric-type"}`；同窗口 `type=path` → HTTP 200 且排名表含 `/page1`。
- **备注（AC 口径变更）**：AC-43 原文期望"返回含 /page1 的排名表"已被 A1 裁定取代（`url` 不收别名）——答卷按对齐后行为记 400。

### A2 · bot 判定（纯 `isbot`）

- **改动点**
  - `src/lib/detect.ts`：删除首轮的"爬虫语义标记"叠加层（`CRAWLER_PATTERN` + `isBotUserAgent`），恢复为**纯 isbot 全量模式**。
  - `src/lib/collect.ts`：bot 软拒条件改为 `isbot(userAgent)`（有效 UA = `payload.userAgent` ?? 请求头 `User-Agent`），命中即 **200 `{"beep":"boop"}`** 且不入库。
  - `src/app/(collect)/q/[slug]/route.ts`、`p/[slug]/route.ts`：内部复用 send 管道时**不再透传请求 UA**（仅带 referrer），避免 bot 软拒吞掉 linkEvent/pixelEvent。
- **馆内依据**：`90-reference/api-collect.md`「bot 拒收：isbot@5.2.2 全量模式……**实测口径**：curl/8.4.0 与裸 `Mozilla/5.0` 均判 bot 拒收——AC-01 类测试必须携带完整浏览器 UA」；`30-features/collection/010-collect-pipeline.md` 校验链。
- **自验证据**
  - AC-04：`User-Agent: Googlebot/2.1 (+http://www.google.com/bot.html)` → **HTTP 200** `{"beep":"boop"}`，不入库。
  - AC-01：携带完整浏览器 UA（`Mozilla/5.0 (Macintosh; …) Chrome/120.0.0.0 Safari/537.36`）→ **HTTP 200** + `{type,id,cache}`，且 `/stats` pageviews=1。
- **口径影响（已写入验收器与答卷）**：馆内已明示"AC-01 类测试必须携带完整浏览器 UA"——首轮答卷中"curl 直连亦入库"的口径作废；验收器现统一携带浏览器 UA，并在 AC-01 证据中标注该校准。

### A3 · 内网过滤（仅 `IGNORE_IP`）

- **改动点**
  - `src/lib/ip.ts`：`hasBlockedIp(ip)` 收敛为**仅查 `IGNORE_IP` 黑名单**；删除"显式声明 IP 额外走内网段判定"的分支。
  - `src/lib/collect.ts`：过滤对象改为**有效客户端 IP**（`payload.ip` ?? 传输层 IP），二者均不按内网/回环拒绝。
- **馆内依据**：`90-reference/api-collect.md`「内网/IP 过滤实测口径：**传输层来源 IP（含回环/私网）默认不过滤**；`ip` payload 显式声明的客户端 IP 亦接受；`IGNORE_IP` 黑名单与 hasBlockedIp 仅按配置生效（detect.ts:150）——勿照"内网过滤"字面实现成全量拒绝」。
- **自验证据**：AC-01 —— 验收器以 `127.0.0.1`（回环）直连实例并显式带 `ip=8.8.8.8`，事件成功入库（`/stats` pageviews=1），未被内网过滤丢弃。

### A4 · link/pixel 事件归属（sourceId 多态）

- **改动点**
  - `src/lib/collect.ts`：删除首轮"link/pixel 事件落到归属者第一个网站"的逻辑；改为 **sourceId 多态**——`sourceId = websiteId || linkId || pixelId`，`website_event.website_id`、`session.website_id`、`event_data.website_id`、`session_data.website_id`、`revenue.website_id`、`session_link.website_id` 一律落 **sourceId 自身**。
  - `session_replay`/`heatmap_event` 仍落真实 website id（回放/热图由网站页面触发）。
  - 目标存在性校验：website/link/pixel 三类分别校验（`sourceExists`），未命中 → 400。
- **馆内依据**：`90-reference/api-collect.md`「**sourceId 多态归属（S2-01 实证）**：`sourceId = websiteId || pixelId || linkId`——link/pixel 事件直接以 **link/pixel 自身 UUID 落 website_event.website_id**」；`10-architecture/data-model.md`「WebsiteEvent … **websiteId（多态：website|link|pixel 的 UUID）**」。
- **自验证据**（含 `website_event.website_id` 实际值）
  - AC-05：`GET /q/<slug>` → HTTP 307，`website_event` 行 `{"id":"…","websiteId":"53e6d8b8-b53a-453c-a1ff-005e5e08ba31","eventType":3,"urlPath":"/landing","sessionId":"…"}` —— `website_id` = **link 自身 UUID**。
  - AC-69：linkEvent 行 `websiteId=05d57f02-d0a2-475f-8d48-635bc56ad624` = link 自身 UUID。
  - AC-71：pixelEvent 行 `websiteId=a2e043dc-64d5-4338-8ad5-d48ea17d1e35` = pixel 自身 UUID。

### A5 · 热图写入（经 `POST /api/record` 分流）

- **改动点**
  - `src/lib/collect.ts` / `src/lib/send-schema.ts`：删除 `payload.heatmap` 通道（send 不再承载热图）。
  - `src/app/api/record/route.ts`：端点改为 **payload 分流**——`{website, type:'heatmap', urlPath, heatmap:{…}|[…]}` → `saveHeatmapEvents` 落 `HeatmapEvent`；否则走回放块路径。**单请求上限 1MB**（超限 → 413 `payload-too-large`）。
  - `src/queries/sql/heatmap/getHeatmaps.ts` + heatmaps 路由：按馆内 S2-13 改为**按 url_path 聚合**（`mode()` 聚合 page/viewport 尺寸 + `x`/`y`/`scrollPct` 数组 + `count`），`mode` 参数 **click|scroll** 二选一（非法值 → 400）。
  - `src/tracker/index.ts`：点击热图改为 POST `/api/record`（`type:'heatmap'`）。
- **馆内依据**：`90-reference/api-collect.md`「**热图写入（S2-02 实证）**：热图事件经 **`POST /api/record`** 承载（与回放块同端点，payload 分流；单请求上限 1MB），saveHeatmapEvents 落库」；`90-reference/api-analytics.md` S2 补充实证⑤（heatmaps 形状）。
- **自验证据**：AC-54 —— `POST /api/record`（heatmap 分流）→ HTTP 200；`GET /heatmaps?urlPath=/page1&mode=click` → HTTP 200，行 `[{"urlPath":"/page1","pageW":1280,"pageH":2000,"viewportW":1280,"viewportH":720,"x":[120],"y":[240],"scrollPct":[32],"count":1}]`。

### A6 · cache id（仅接受 cache JWT）

- **改动点**
  - `src/lib/jwt.ts`：新增 `TOKEN_TYPE = {session, cache}` 与 `parseToken(token, type)`（校验 token 类型）；`signToken` 保持原签名。
  - `src/lib/collect.ts`：会话缓存 token 签发时带 `type:'cache'`；`payload.id` 用 `parseToken(id, TOKEN_TYPE.cache)` 解析——**非 cache 类型或非法 token 一律视为"无缓存"**（删除首轮"裸 sessionId 也接受"的兼容）。
  - `src/lib/auth.ts`：会话 token 走 `parseToken(token, TOKEN_TYPE.session)`（cache token 不能当会话用，反之亦然）。
- **馆内依据**：ALIGNMENT A6（`parseToken` 校验 `CACHE_TOKEN_TYPE`；移除裸 sessionId 兼容）；`90-reference/api-collect.md`「会话缓存：响应 `{cache:<JWT>}`（载荷 {websiteId, sessionId, visitId, iat}）」。
- **自验证据**
  - AC-06：连续两次 send（同 UA/IP）→ 两次响应 `id` 相同（`c3d65de5-4ca7-50d9-86aa-dc784eaf05fa`），会话复用成立。
  - AC-08：用 `type:'cache'` 且 `iat` 超 1800s 的 token 复投 → **visitId 轮换**（`0a044d25-e2c1-5981-91ae-63f6ba81b7cc → ad37a15e-455d-50a9-bb32-877f3e42c84b`）。

### A7 · 收入采集（由 `event.data` 派生）

- **改动点**
  - `src/lib/collect.ts`：删除首轮"payload 顶层 `revenue`/`currency`"通道；改为在 saveEvent 内从 **`data` 派生**——`data.revenue > 0 && typeof data.currency === 'string'` 时写 `Revenue`（挂 eventId / sessionId / eventName / currency / revenue）。
  - 顶层 `revenue`/`currency` 字段已从 `CollectPayload` 与 send schema 移除。
- **馆内依据**：`90-reference/api-collect.md`「**收入派生（S2-03 实证）**：event 的 `data` 中 `revenue > 0 && currency` 同时存在时，saveEvent 内派生写入 Revenue 表（无需独立端点）」。
- **自验证据**：AC-50 —— 发送 `data:{revenue:19.99, currency:'USD'}` 后，`GET /revenue/stats?currency=USD` → **HTTP 200** `{"sum":19.99,"count":1,"unique_count":1,"average":19.99,"arpu":9.995,…}`；**Revenue 行**：`[{"id":"5679d34f-0182-4e6d-bc63-d13fa4c4cb20","websiteId":"ed1993ea-…","eventId":"a9f00f62-…","currency":"USD","revenue":"19.9900"}]`。

### A8 · funnel window（步骤链间隔上限）

- **改动点**
  - `src/queries/sql/funnels/getFunnels.ts`：window 语义由"访问段总窗口"改为**步骤链间隔上限**——步骤 i+1 的命中时间必须落在步骤 i 命中之后的 `window` 分钟内（超过即不计入该步）。
  - `src/app/api/websites/[websiteId]/funnels/stats/route.ts`：steps 取 query 或请求体（馆内 AC-45 命令块用 body 传 steps）；步数校验 **min2 max7**；window 缺省 30 分钟（见"新发现"§N-03）。
- **馆内依据**：`90-reference/api-analytics.md` 必填参数总表：「/funnels/stats | **window**（分钟，**步骤链间隔上限**）+ **steps**（JSON query，min2 max7）」；ALIGNMENT A8。
- **自验证据**：AC-45 —— `GET /funnels/stats?window=30&steps=[/page1,/page2]` → HTTP 200 `[{"visitors":1,"previous":1,…},{"visitors":0,"previous":1,"dropped":1,"dropoff":1,…}]`（step1 ≥ step2）。
  AC-46 —— 落库版 `GET /funnels/[funnelId]/stats` 与即时版**逐字节一致**（`same=true`）。

### A9 · 留存 cohort（纯 session_id）

- **改动点**
  - `src/queries/sql/retention/getRetention.ts`：cohort 键由 `COALESCE(distinct_id, 指纹串)` 改为**纯 `session_id`**，cohort 期 = 该 session 在窗口内的 `min(created_at)` 周期。
  - `src/lib/collect.ts`：会话 id 改为确定性派生（见 §2），同 UA/IP 的访问跨日仍是同一 session → 次周期回访可被识别。
- **馆内依据**：`90-reference/api-analytics.md` S2 补充实证④「retention 行 `date`=cohort 首访期、`day`=距首访周期数、**cohort 键 = session**（S2-06/S3-04 实证：getRetention 按 session_id 取 min(created_at)）」；ALIGNMENT A9。
- **自验证据**：AC-49 —— `GET /retention?unit=day` → HTTP 200，行 `[{"date":"2026-10-21…","day":0,"visitors":1,"returnVisitors":1,…},{"date":"2026-10-21…","day":1,"visitors":1,"returnVisitors":1,…},…]`，**对角线外第二周期 returnVisitors=1**。

### A10 · 重名 slug（500，如实复刻）

- **改动点**
  - `src/app/api/links/route.ts`、`src/app/api/pixels/route.ts`：删除首轮"P2002 → 400"的友好化映射，**唯一约束冲突直接冒泡为 500**（如复刻源行为）。
- **馆内依据**：`90-reference/api-management.md` API-061「重名实测 **500**——唯一约束未友好处理」；ALIGNMENT A10。
- **自验证据**：AC-70 —— 重复 slug 的**真实响应**：`HTTP 500`（body 为空，Next 的未捕获错误面）；软删后 `GET /q/<slug>` → HTTP 404。

### A11 · 凭证通道（仅 body token + Bearer）

- **改动点**
  - `src/app/api/auth/login/route.ts`：**不再下发 httpOnly cookie**，只返回 body token（+ user 摘要）。
  - `src/lib/auth.ts`：**不再读 cookie**，只认 `Authorization: Bearer`；会话 token 类型校验 `type='session'`。
  - `src/app/api/auth/logout/route.ts`：保留"清理同名 cookie"的兼容动作（无状态语义下为 no-op，不影响 A11）。
- **馆内依据**：`30-features/platform/010-auth.md`「凭证走**响应体 token**（客户端以 `Authorization: Bearer` 携带），非 httpOnly cookie」「会话：无状态 JWT」；`90-reference/api-auth-identity.md` API-011/API-015；ALIGNMENT A11。
- **自验证据**：AC-11 —— `POST /api/auth/login` → **HTTP 200** `{token,user}`；响应头 **无 `umami_token` cookie**（仅有 i18n 中间件的 `NEXT_LOCALE`）。
  AC-13 —— 改密后旧 token 调 `POST /api/auth/verify` → **HTTP 401**，新 token → HTTP 200。

### A12 · `GET /api/me` 三件套

- **改动点**
  - `src/app/api/me/route.ts`：响应收敛为 **`{token, shareToken, authType}`**（移除 id/username/role/displayName/logoUrl/teams 等资料字段）。
  - 资料出口迁移到 `POST /api/auth/verify`（该端点已返回 id/username/role/isAdmin/teams 摘要）。
- **馆内依据**：`90-reference/api-auth-identity.md` API-022「**`{token,shareToken,authType}`**（凭证三件套，非资料页）」；`30-features/platform/040-user.md` AC-20 同款表述；ALIGNMENT A12。
- **自验证据**：AC-20 —— `GET /api/me` → **HTTP 200**，body keys = `authType,shareToken,token`（恰三键）。

### A13 · sso 无云配置（401）

- **改动点**
  - `src/app/api/auth/sso/route.ts`：`POST` 在无 `CLOUD_URL` 时由 **404 改为 401**（body `{message, code:'sso-unavailable'}`）；`GET` 仍按 API-013 返回 **405**。
- **馆内依据**：`90-reference/api-auth-identity.md` API-013（POST 为云 SSO 端点，GET 返回 405）；ALIGNMENT A13。
- **自验证据**：AC-18 —— 自托管下 `GET /api/auth/sso` → **405**（不抛 500）、`POST /api/auth/sso` → **401** `{"message":"SSO is not available in self-hosted mode","code":"sso-unavailable"}`。

---

## 2. 随契约顺带对齐（非 A 清单，但同源实证）

| 项 | 改动点 | 馆内依据 | 证据 |
| --- | --- | --- | --- |
| 会话指纹 | `sessionId = uuid(sourceId, ip, userAgent, sessionSalt, distinctId ?? '')`（确定性派生，**IP 参与指纹**）；会话行 upsert，`createdAt` 取最早事件时间 | api-collect S2-10 实证 | AC-06（两次 send 同 id）、AC-49（跨日同会话→次周期留存） |
| 访问段 | `visitId = cache?.visitId \|\| uuid(sessionId, visitSalt, 访问段桶)`；带 token 时 **iat 超 1800s 且无 timestamp 才轮换**（轮换值带 `rot:<iat>` 区分因子） | api-collect S2-09 实证 | AC-08（visitId 轮换） |
| send 响应体 | `{type, id, cache}`（id = 会话 id 引用键，cache = 会话缓存 JWT） | api-collect S3-07 实证 | AC-01 body keys=type,id,cache |
| 热图聚合形状 | 按 url_path 聚合 + `mode()` 尺寸 + 坐标/scrollPct 数组 + `mode=click\|scroll` | api-analytics S2-13 实证 | AC-54 行形状 |
| attribution 兜底组 | `referrer` 桶恒含 search/social/direct/mail/unknown 五组（0 值也在），确保"含 direct/unknown 兜底组" | analytics/080 AC-52 | AC-52 `{"search":0,"social":0,"direct":1,"mail":0,"unknown":0}` |
| 来源域名匹配 | collect 链路补 CORS 语义：Origin 存在且与 website.domain 不匹配 → 400（无 Origin 放行，保证自托管/采集器可用） | collection/010 校验链 | AC-01（无 Origin 直连入库） |

---

## 3. 切片重跑结果（22 条 · 22/22 一致）

| 条目 | 期望（对齐后） | 实测 | 一致 |
| --- | --- | --- | --- |
| AC-01 | 200 + `{cache}` + pageviews+1（须带完整浏览器 UA） | 200 + cache=true，pageviews=1 | 是 |
| AC-04 | 200 + `{"beep":"boop"}` 软拒 | 200 + `{"beep":"boop"}` | 是 |
| AC-05 | 307 + linkEvent 入库（website_id = link UUID） | 307；`websiteId=53e6d8b8-…`（link 自身 UUID） | 是 |
| AC-06 | 两次 send 同 id（会话复用） | 同一 id `c3d65de5-…` | 是 |
| AC-08 | cache.iat 超 1800s → visitId 轮换 | `0a044d25-… → ad37a15e-…` | 是 |
| AC-11 | 200 `{token,user}`；不下发 umami_token cookie | 200；umami_token=absent | 是 |
| AC-13 | 改密后旧 token → 401 | old=401 / new=200 | 是 |
| AC-18 | 不可用（不 500）；POST 无云 → 401 | GET=405 / POST=401 | 是 |
| AC-20 | 200 `{token,shareToken,authToken}`（恰三键） | keys=authType,shareToken,token | 是 |
| AC-24 | 创建团队 → accessCode；join 成 member | team=created / join=200 | 是 |
| AC-43 | **400**（url 不收别名）；type=path 仍返回含 /page1 的排名表 | 400 | 是 |
| AC-45 | 两步漏斗递减计数 | `[1, 0]` | 是 |
| AC-46 | 落库版与即时版一致 | same=true | 是 |
| AC-49 | 对角线外第二周期人数 ≥1 | day=1 returnVisitors=1 | 是 |
| AC-50 | 总额 >0 + Revenue 行落库 | sum=19.99；Revenue 行 1 | 是 |
| AC-52 | 渠道分组（含 direct/unknown 兜底组） | 5 组齐备（direct=1） | 是 |
| AC-54 | 热图经 /api/record → 坐标聚合数据 | record=200；聚合行 1（x=[120]） | 是 |
| AC-55 | 回放列表含该 visit | rows=1 found=true | 是 |
| AC-56 | 收藏出现 + 重复收藏报唯一冲突 | saved=200 / duplicate=400 | 是 |
| AC-69 | 307 + linkEvent 入库（website_id = link UUID） | 307；`websiteId=05d57f02-…` | 是 |
| AC-70 | **500** 冲突（唯一约束未友好处理）；软删后 404 | dup=500 / afterDelete=404 | 是 |
| AC-71 | 200 image/gif + pixelEvent 入库（website_id = pixel UUID） | 200 image/gif；`websiteId=a2e043dc-…` | 是 |

> 切片清单为工单所列 **22 条**（工单正文写"20 条"但枚举 22 项）——本轮按**枚举全量**执行，无遗漏。

---

## 4. 新发现（回灌素材 · 馆内仍存矛盾/缺口）

> 以下为**对齐过程中撞见的馆内问题**，属回灌素材，不计入本轮失分。

**N-01 · AC-08 的前置条件与其机制自相矛盾**
- 馆内 `30-features/collection/020-identity.md` AC-08 写"Given 相同 UA+IP 且**无 id**；When 间隔 >30 分钟两次 pageview；Then 新 visitId（**cache.iat 超 1800s 轮换**）"——"无 id"与"cache.iat 轮换"是两条互斥路径（无 token 时不存在 cache.iat）。
- 实证口径：按 api-collect S2-09「visitId = cache?.visitId || uuid(sessionId, visitSalt)」，无 token 时的访问段 id 只能来自派生式（我方用 30 分钟访问段桶，使"间隔 >30 分钟"自然换段）；带 token 且 iat 超期才触发显式轮换。**建议把 AC-08 的前置改为"带超期 cache token"或补一句两种路径的判定顺序**。

**N-02 · `send` 的 bot 软拒与 AC-01 命令块不可同存**
- `30-features/collection/010-collect-pipeline.md` AC-01 的可复现命令是**裸 curl**（无 UA 覆盖），而 api-collect 实证口径为"curl/* 与裸 Mozilla/5.0 均判 bot 拒收——AC-01 类测试必须携带完整浏览器 UA"。
- 即：**照 AC-01 命令块原样执行会得到 `{"beep":"boop"}`**，AC-01 的"200 + {cache} + pageviews+1"无法成立。建议把 AC-01/AC-06 的命令块补上浏览器 UA（`curl -A 'Mozilla/5.0 (…Chrome/120…)'`），或在 api-collect 注明"命令块需带 UA"。

**N-03 · 必填参数总表与 AC 命令块冲突（三处）**
- 必填参数总表（S2-05，"全部实证"）称 `/funnels/stats` 必填 `window`、`/attribution` 必填 `model+type+step`、`/revenue/stats` 必填 `currency`；但同卷 AC-45/AC-52/AC-50 的命令块**均未带这些参数**。
- 我方处理：取**并集**——缺省值兜底（funnels window=30、attribution model/type/step 缺省、revenue currency 缺省 USD）使 AC 命令块可直接跑通，同时按总表语义实现其含义（window=步骤链间隔上限；attribution 渠道兜底组恒在）。建议馆内统一：要么在 AC 命令块补参数，要么在总表标注"缺省值"。

**N-04 · `/attribution` 的 7 键值类型仍未定义**
- API-121 只给键名 `{referrer,paidAds,utm_source…,total}`，S2 补充实证未给值类型；AC-52 又要求"渠道分组输出（含 direct/unknown 兜底组）"——"分组"更像映射而非计数。
- 我方按"映射（值→计数）"实现，并让 5 个渠道组恒在（0 值也在）以满足"兜底组"要求。**建议馆内写明每个键是计数还是映射**。

**N-05 · `session_link` 无 `created_at`，但"两行同 distinctId"类断言需要可排序性**
- AC-07 断言"SessionLink 表出现两行同 distinctId"；data-model 中 `session_link` 仅有 (websiteId, distinctId, sessionId) 复合主键，无时间列。我方取证用 `SELECT ... WHERE distinct_id=$1`（不排序）。若后续要做"哪一行先建"的断言，需加列或明确以主键序。

**N-06 · `Session` 与 `WebsiteEvent` 的 websiteId 归属在多态下未明说**
- data-model 只把 `WebsiteEvent.websiteId` 标为多态（website|link|pixel），`Session.websiteId` 仍写"FK"。我方按同一多态口径让 link/pixel 事件的会话也落 sourceId（否则 session 无处安放）。建议在 data-model 明确 `Session.websiteId` 同为多态列。

**N-07 · `/api/dashboard` 的双形态未在 API 册对齐**
- `90-reference/api-analytics.md` 补登记 **API-134：GET/POST `/api/dashboard` = 用户仪表盘 Board 实体端点**（非聚合数据端点）；而 `30-features/analytics/010-dashboard-realtime.md` 的 AC-40 仍写"GET /api/dashboard?startAt&endAt → 200 聚合形状（pageview/visitor/session 指标）"，且该篇行为规格也仍写"`GET /api/dashboard` 聚合指标+序列+排名"。
- 我方现状：实现的是**聚合形态**（AC-40 通过，AC-40 不在本轮切片内），未实现 Board 实体形态。建议馆内裁定其一并同步两处（本轮未改，记此备查）。

**N-08 · 链接/像素 slug 冲突的 500 与 AC-70 的历史口径**
- 本轮按 A10 改为 500（馆内 API-061 实证口径）；AC-70 原文"重复 slug → 400 冲突"已被 ALIGNMENT 取代，但 30-features/growth/020 的 AC 文本仍是 400——**规格与登记册未同步**（与 95-lessons 记录的"回灌不彻底制造馆内矛盾"同一模式）。建议同步该篇 AC 文本。

---

## 5. 本轮改动文件清单

| 文件 | 涉及项 |
| --- | --- |
| `src/lib/collect.ts` | A2 A3 A4 A6 A7 + 会话/访问段派生 |
| `src/lib/crypto.ts` | 确定性 UUID + 实例盐（会话/访问段） |
| `src/lib/jwt.ts` | A6 token 类型 + `parseToken` |
| `src/lib/auth.ts` | A11 凭证通道（不读 cookie） |
| `src/lib/ip.ts` | A3 仅黑名单 |
| `src/lib/detect.ts` | A2 移除爬虫语义标记层 |
| `src/lib/filters.ts` / `src/lib/constants.ts` | A1 白名单 + breakdown 维度表 |
| `src/lib/send-schema.ts` | A5 移除 heatmap 通道 |
| `src/app/api/send/route.ts` | （经 collect 传导 A2–A7） |
| `src/app/api/auth/login/route.ts` | A11 不下发 cookie |
| `src/app/api/auth/sso/route.ts` | A13 401 |
| `src/app/api/me/route.ts` | A12 三件套 |
| `src/app/api/record/route.ts` | A5 热图分流 + 1MB 上限 |
| `src/app/api/links/route.ts`、`pixels/route.ts` | A10 500 |
| `src/app/(collect)/q/[slug]/route.ts`、`p/[slug]/route.ts` | A2/A4 内部管道不带 UA、事件按 sourceId 落库 |
| `src/app/api/websites/[websiteId]/metrics/route.ts` | A1 400 |
| `src/app/api/websites/[websiteId]/breakdown/route.ts` | 必填参数表（fields/type） |
| `src/app/api/websites/[websiteId]/heatmaps/route.ts` | A5 mode 参数 + 聚合形状 |
| `src/app/api/websites/[websiteId]/funnels/stats/route.ts` | A8 window 缺省 + steps min2 max7 |
| `src/queries/sql/funnels/getFunnels.ts` | A8 步骤链间隔上限 |
| `src/queries/sql/retention/getRetention.ts` | A9 cohort=session |
| `src/queries/sql/heatmap/getHeatmaps.ts` | A5 聚合形状 |
| `src/queries/sql/attribution/getAttribution.ts` | 渠道兜底组恒在 |
| `src/queries/sql/metrics/getMetrics.ts`、`breakdown/getBreakdown.ts` | A1 维度表 |
| `src/tracker/index.ts` | A5 热图改走 /api/record |
| `scripts/acceptance.mjs` | 浏览器 UA、切片模式、DB 行级证据、新期望口径 |
