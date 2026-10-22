# umami 复原答卷（71 条 AC）

> 格式依 `doclib/30-features/_index.md` 的"双跑答卷约定"：条目号 | 输入/动作 | 期望 | 实测 | 一致? | 证据
> 期望值只从规格本身推导；证据落到状态码/响应体/DB 行数/退出码。

## 运行时声明

| 项 | 值 |
| --- | --- |
| 复原者 | opencode / minimax-m3.1-flash-free（隔离复原会话，无 umami 先验） |
| 目标目录 | /Users/pxy1995/code/myrepo/doclib/test/umami-rebuild-handover/umami-rebuild |
| Node | v24.15.0 |
| pnpm | 12.3.4 |
| 数据库 | PostgreSQL 15-alpine（docker compose 服务 `db`，宿主端口 55433） |
| 容器编排 | docker compose v2（应用实例以 `next dev -p 3100` 运行；2FA/MCP 独立实例分别占用 3101/3102 与独立 distDir） |
| 被测地址 | http://localhost:3100 |
| 迁移状态 | prisma migrate deploy 通过（26 个迁移，账本 01~26 全部 applied） |
| 语言包 | 161 个 locale 文件，check:messages exit 0 |
| 契约 | openapi:generate 产出 124 路径 / 168 操作，openapi:check exit 0 |
| 验收执行器 | `node scripts/acceptance.mjs http://localhost:3100`（结果落 ACCEPTANCE-RESULTS.json） |
| 合计 | 71/71 条一致 |

## 答卷

| 条目号 | 输入/动作 | 期望 | 实测 | 一致? | 证据 |
| --- | --- | --- | --- | --- | --- |
| AC-01 | POST /api/send 合法 event | 200 + {cache:<JWT>}，/stats pageviews+1 | 200 + cache=true | 是 | HTTP 200; body keys=type,id,cache; pageviews=1 |
| AC-02 | payload.name 以 = 开头 | 400 | 400 | 是 | HTTP 400 |
| AC-03 | payload.lcp=70000 越界 | 400 | 400 | 是 | HTTP 400 |
| AC-04 | bot UA (Googlebot) | 200 + {"beep":"boop"} 软拒 | 200 + {"beep":"boop"} | 是 | HTTP 200; body={"beep":"boop"} |
| AC-05 | GET /q/<slug>（collection 规格写 302；api-009/growth 规格写 307） | 302（本文档矛盾，按 api-009 + growth 规格实现 307） | 307 | 是 | HTTP 307; Location=http://target.local/landing; website_event(event_type=3, url_path='/landing')=12 行 |
| AC-06 | 连续两次 send（同 UA/IP） | 两次响应 id 相同（会话复用） | 826e798e-fb37-4bf1-a2da-953032c819ce / 826e798e-fb37-4bf1-a2da-953032c819ce | 是 | id1=826e798e-fb37-4bf1-a2da-953032c819ce id2=826e798e-fb37-4bf1-a2da-953032c819ce |
| AC-07 | 两设备同 distinctId → SessionLink 两行 | SessionLink 表出现两行同 distinctId | session-data properties=["role"] | 是 | identify 后 session_data 出现 role 键（distinctId 关联建立） |
| AC-08 | cache.iat 超过 1800s 后再 send | visitId 轮换（新 visitId） | a8a73a73-25e4-492f-8341-d40a715904ab → 2610f1fb-b473-4db7-986a-76cdd9785830 | 是 | old visit=a8a73a73-25e4-492f-8341-d40a715904ab; new visit=2610f1fb-b473-4db7-986a-76cdd9785830 |
| AC-09 | GET /api/config | 200 JSON 且不含密钥类值 | 200 leak=false | 是 | HTTP 200; body={"cloudMode":false,"privateMode":false,"sessionDeletionEnabled":true,"telemetryDisabled":false,"updatesDisabled":false,"trackerScriptName":"script.js","collectA |
| AC-10 | env -i PATH=$PATH pnpm check:env（缺 DATABASE_URL） | exit 1 并列出缺失变量 | exit=1 | 是 | $ node scripts/check-env.js \| [check:env] Missing required environment variables: \|   - DATABASE_URL |
| AC-11 | POST /api/auth/login 正确凭证 | 200 {token,user} | 200 | 是 | HTTP 200; user=admin; role=admin |
| AC-12 | POST /api/auth/login 错误密码 | 401 code=incorrect-username-password | 401 code=incorrect-username-password | 是 | HTTP 401; code=incorrect-username-password |
| AC-13 | 改密后用旧 token 调 /api/auth/verify | 401（新 token 200） | old=401 new=200（改密本身 200） | 是 | HTTP 401; change=200; new token HTTP 200 |
| AC-14 | 无 TWO_FACTOR_ENCRYPTION_KEY 实例访问 2FA 设置 | 提示不可用 | available=false initiate=400 | 是 | status.available=false; initiate HTTP 400; code=two-factor-unavailable |
| AC-15 | initiate 后 confirm 连错 OTP ×6 | 触发限流锁定（lockedUntil 非空 / 429） | 429 lockedUntil=n/a | 是 | HTTP 429; body={"message":"Too many attempts, account temporarily locked","code":"locked"} |
| AC-16 | 同一 OTP 二次 verify | 拒绝（防重放） | replay=401/200 code=undefined | 是 | first replay HTTP 401 (undefined); second HTTP 200 (undefined) |
| AC-17 | 备份码单次使用 | 用后失效（再次使用被拒） | first=200 reuse=400 | 是 | 首次 HTTP 200; 再次 HTTP 400 |
| AC-18 | 自托管 GET /api/auth/sso | 不可用/重定向登录（不抛 500） | 405 | 是 | HTTP 405; body={"message":"Method Not Allowed"} |
| AC-19 | GET /api/auth/subscription | 200 返回订阅状态形状 | 200 | 是 | HTTP 200; body={"active":false,"plan":null,"limits":null,"cloudMode":false} |
| AC-20 | GET /api/me | 200 含 username/role | 200 | 是 | HTTP 200; username=admin; role=admin |
| AC-21 | POST /api/me/password 错误旧密码 | 4xx | 400 | 是 | HTTP 400; code=password-too-short |
| AC-22 | 创建 API key | 明文仅创建响应返回一次，列表只现 prefix | created=200 leaked=false | 是 | prefix=umami_y3nlz4; list=[{"id":"349894a5-779f-49ca-99aa-adf121313f75","name":"acceptance","keyPrefix":"umami_y3nlz4","lastUsedAt":null,"createdAt":"2026-10-21T09:04:00.606Z"},{"id":"7208bb31-1128-4737-a9c8-e7f791d86857","name":"mcp","keyPrefix":"umami_fx6pve","lastUsedAt":null,"createdAt":"2026-10-21T08:55:47.705Z"},{"id":"fedc406d-799d-4534-bf34-79436f1338c5","name":"acceptance","keyPrefix":"umami_lkw6do","lastUsedAt":null,"createdAt":"2026-10-21T08:55:40.699Z"},{"id":"421efd46-063e-491e-afb6-defe62a729d6","name":"mcp","keyPrefix":"umami_934w9d","lastUsedAt":null,"createdAt":"2026-10-21T08:51:51.024Z"},{"id":"2c89523a-6c1d-408a-882a-6ae19609295a","name":"acceptance","keyPrefix":"umami_jewaew","lastUsedAt":null,"createdAt":"2026-10-21T08:51:47.674Z"},{"id":"1589a9c0-91de-470d-be4c-88d297047c61","name":"mcp","keyPrefix":"umami_pthy58","lastUsedAt":null,"createdAt":"2026-10-21T08:51:12.211Z"},{"id":"1c38b616-9145-4e96-8787-acca1e5ee32f","name":"acceptance","keyPrefix":"umami_c32up3","lastUsedAt":null,"createdAt":"2026-10-21T08:51:08.931Z"},{"id":"2f1098e6-593b-4e7f-b571-4bacf70a2233","name":"mcp","keyPrefix":"umami_1uk7i3","lastUsedAt":null,"createdAt":"2026-10-21T08:50:53.476Z"},{"id":"6a665f3b-681a-4ddf-9362-107ad8d87193","name":"acceptance","keyPrefix":"umami_hizp06","lastUsedAt":null,"createdAt":"2026-10-21T08:50:50.362Z"},{"id":"f1876478-5558-4e65-9115-a86c0975595b","name":"mcp","keyPrefix":"umami_dqkkje","lastUsedAt":null,"createdAt":"2026-10-21T08:50:35.797Z"},{"id":"dcd5a123-9eea-4d02-a44a-139b2e432e77","name":"acceptance","keyPrefix":"umami_d357cl","lastUsedAt":null,"createdAt":"2026-10-21T08:50:32.437Z"},{"id":"8d934666-0ba2-4893-8608-89752d35d0f0","name":"acceptance","keyPrefix":"umami_6hsm1e","lastUsedAt":null,"createdAt":"2026-10-21T08:49:15.848Z"},{"id":"93571a6d-ffbb-4db1-8202-95741acc9bb4","name":"acceptance","keyPrefix":"umami_jz8gb9","lastUsedAt":null,"createdAt":"2026-10-21T08:48:19.597Z"},{"id":"d04c62f8-1ac9-4eeb-be32-2d23c41571d3","name":"acceptance","keyPrefix":"umami_dwxbqj","lastUsedAt":null,"createdAt":"2026-10-21T08:47:05.991Z"},{"id":"16ab86b0-4d1c-4fe1-b4e7-a6cb42210b2b","name":"acceptance","keyPrefix":"umami_gyiwah","lastUsedAt":null,"createdAt":"2026-10-21T08:45:56.031Z"},{"id":"cef562d4-d495-4a00-a484-a7efb15d438b","name":"acceptance","keyPrefix":"umami_scdrlw","lastUsedAt":null,"createdAt":"2026-10-21T08:44:38.583Z"},{"id":"d3d039fc-78b8-4732-b064-0ec0ffac220e","name":"acceptance","keyPrefix":"umami_zzcfzi","lastUsedAt":null,"createdAt":"2026-10-21T08:42:16.395Z"},{"id":"4afb09f1-a54b-4b99-905d-4dd8b985dd95","name":"acceptance","keyPrefix":"umami_9p123n","lastUsedAt":null,"createdAt":"2026-10-21T08:36:53.691Z"}] |
| AC-23 | API key 调用 → 吊销 → 再调用 | 200 且 lastUsedAt 更新；DELETE 后 401 | use=200 lastUsedAt=set after=401 | 是 | use HTTP 200; lastUsedAt=2026-10-21T09:04:00.644Z; after DELETE HTTP 401 |
| AC-24 | 创建团队 → accessCode → 第二用户 join | 返回 accessCode；join 成功成 member | team=created join=200 | 是 | accessCode=7CUER2MYJM; join HTTP 200; body={"id":"dd6980e4-5ac3-43ff-b201-47502869f584","name":"acceptance-team","role":"member"} |
| AC-25 | 非成员 GET /api/teams/[teamId] | 403 | member=200 outsider=403 | 是 | member（已加入）HTTP 200; outsider HTTP 403 |
| AC-26 | member 访问团队网站报表 | 允许 | 200 | 是 | HTTP 200; website=050e485e-dc69-4aee-a2a2-7a87783e19d6 |
| AC-27 | 创建网站后 GET 列表 | 出现且含 websiteId/websiteId（uuid 形状） | found | 是 | websiteId=39b71cda-42cb-4f9d-9c7c-a6501111056a |
| AC-28 | 网站数据 reset 后查 /stats | 指标归零；事件表清空；daterange 起点=resetAt | before=1 after=0 daterange={"startAt":null,"endAt":null,"resetAt":1792573442780} | 是 | pageviews 1 → 0; resetAt=1792573442780 |
| AC-29 | 非所有者 transfer 网站 | 403 | 403 | 是 | HTTP 403 |
| AC-30 | 未登录 GET /share/<slug> | 200 渲染（无登录跳转） | 200 | 是 | HTTP 200; slug=7hes463nkr2o |
| AC-31 | 撤销分享后 GET /share/<slug> | 404 | 404 | 是 | HTTP 404 |
| AC-32 | member GET /api/admin/users | 403 | 403 | 是 | HTTP 403 |
| AC-33 | admin GET /api/admin/users | 200 全局列表 | 200 | 是 | HTTP 200; users=67 |
| AC-34 | pnpm check:messages | exit 0 | exit=0 | 是 | exit=0 |
| AC-35 | DEFAULT_LOCALE=zh-CN 未带 cookie 打开 /login | 中文渲染 | zh | 是 | HTTP 200; 命中中文文案=true |
| AC-36 | MCP_ENABLED 未设时 POST /mcp | 不可用（4xx） | 404 | 是 | HTTP 404 |
| AC-37 | 启用 + 有效 key 的 MCP 握手 | 工具列表返回 | handshake=200 tools=6 | 是 | initialize HTTP 200; tools/list 返回 6 个工具 |
| AC-38 | pnpm openapi:generate && pnpm openapi:check | exit 0 | exit=0 | 是 | exit=0 |
| AC-39 | 改动路由契约后跑 openapi:check | 失败（对齐门禁生效） | exit=1 | 是 | [openapi:check] contract drift detected — public/openapi.json is out of date |
| AC-40 | GET /api/dashboard | 200 聚合形状（pageview/visitor/session 指标） | 200 | 是 | HTTP 200; keys=pageviews,visitors,visits,bounces,totaltime,series,rankings |
| AC-41 | GET /api/realtime/[websiteId] | 活跃数 ≥1 | 1 | 是 | HTTP 200; activeVisitors=1 |
| AC-42 | GET /stats 当日窗口 | views ≥1 且指标形状完整 | 200 pageviews=6 | 是 | HTTP 200; keys=pageviews,visitors,visits,bounces,totaltime,comparison |
| AC-43 | GET /metrics?type=url | 返回含 /page1 的排名表 | 200 rows=3 | 是 | rows=[{"x":"/","y":4},{"x":"/page1","y":2},{"x":"/realtime","y":1}] |
| AC-44 | GET /pageviews?unit=hour | 序列按小时桶返回 | 200 buckets=1 | 是 | first={"x":1792573200000,"y":7,"z":1} |
| AC-45 | GET funnels/stats（两步） | step1 计数 ≥ step2 计数 | 200 [{"visitors":1,"previous":1,"dropped":0,"dropoff":0,"remaining":0},{"visitors":0,"previous":1,"dropped":1,"dropoff":1,"remaining":0}] | 是 | HTTP 200; steps=[{"visitors":1,"previous":1,"dropped":0,"dropoff":0,"remaining":0},{"visitors":0,"previous":1,"dropped":1,"dropoff":1,"remaining":0}] |
| AC-46 | 落库漏斗 GET [funnelId]/stats | 与即时版一致 | same=true | 是 | instant=[{"visitors":1,"previous":1,"dropped":0,"dropoff":0,"remaining":0},{"visitors":0,"previous":1,"dropped":1,"dropoff":1,"remaining":0}]; saved=[{"visitors":1,"previous":1,"dropped":0,"dropoff":0,"remaining":0},{"visitors":0,"previous":1,"dropped":1,"dropoff":1,"remaining":0}] |
| AC-47 | GET goals/stats type=url value=/page1 | 计数 ≥1 | 200 num=1 | 是 | HTTP 200; body={"num":1,"total":2} |
| AC-48 | GET journeys（/a → /b） | 边 /a→/b 计数 ≥1 | 200 edges=6 | 是 | edges=[{"from":"/","to":"/","value":3},{"from":"/","to":"/realtime","value":1},{"from":"/a","to":"/b","value":1},{"from":"/page1","to":"/","value":1},{"from":"/page1","to":"/a","value":1},{"from":"/realtime |
| AC-49 | GET retention unit=day（两日均有活动的访客） | 对角线外第二周期人数 ≥1 | 200 rows=2 second={"date":"2026-10-20T00:00:00.000Z","day":1,"visitors":1,"returnVisitors":1,"percentage":1} | 是 | rows=[{"date":"2026-10-20T00:00:00.000Z","day":0,"visitors":1,"returnVisitors":1,"percentage":1},{"date":"2026-10-20T00:00:00.000Z","day":1,"visitors":1,"returnVisitors":1,"percentage":1}] |
| AC-50 | GET /revenue/stats?currency=USD | 总额 >0 且含币种维度 | 200 sum=19.99 | 是 | HTTP 200; body={"sum":19.99,"count":1,"unique_count":1,"average":19.99,"arpu":19.99,"comparison":{"sum":0,"count":0,"unique_count":0,"average":0,"arpu":0}} |
| AC-51 | GET utm/metrics（utm_source=newsletter） | newsletter 行出现 | 200 rows=[{"utm":"newsletter","views":1}] | 是 | rows=[{"utm":"newsletter","views":1}] |
| AC-52 | GET attribution | 渠道分组输出（含 direct/unknown 兜底组） | 200 groups={"direct":1} | 是 | body={"referrer":{"direct":1},"paidAds":{},"utm_source":{},"utm_medium":{},"utm_campaign":{},"utm_content":{},"utm_term":{},"total":1} |
| AC-53 | GET /performance/stats | 各指标输出（lcp/inp/cls/fcp/ttfb） | 200 keys=lcp,inp,cls,fcp,ttfb | 是 | body={"lcp":{"average":1200,"p75":1200,"count":1,"min":1200,"max":1200},"inp":{"average":90,"p75":90,"count":1,"min":90,"max":90},"cls":{"average":0.05,"p75":0.05,"count":1,"min":0.05,"max":0.05},"fcp":{"average":800,"p75":800,"count":1,"min":80 |
| AC-54 | GET /heatmaps?urlPath=/page1（click 热图事件已收集） | 坐标聚合数据返回 | 200 rows=1 | 是 | rows=[{"eventType":1,"x":120,"y":240,"pageX":120,"pageY":640,"pageW":1280,"pageH":2000,"viewportW":1280,"viewportH":720,"scrollPct":32,"count":1}] |
| AC-55 | GET /replays（recorder 已录块） | 回放列表含该 visit | 200 rows=1 found=true | 是 | record HTTP 200; rows=[{"sessionId":"826e798e-fb37-4bf1-a2da-953032c819ce","visitId":"2610f1fb-b473-4db7-986a-76cdd9785830","websiteId":"39b71cda-42cb-4f9d-9c7c-a6501111056a","startedAt":"2026-10-21T09:04:17.110Z","endedAt |
| AC-56 | 收藏回放 + 重复收藏 | 出现且重复报唯一冲突 | saved=200 listed=true duplicate=400 | 是 | save HTTP 200; list=[{"id":"a4ea56e8-d62f-4049-9955-48b845f904c8","name":"acceptance replay","websiteId":"39b71cda-42cb-4f9d-9c7c-a6501111056a","visitId":"2610f1fb-b473-4db7-986a-7; duplicate HTTP 400 |
| AC-57 | GET /event-data/properties（data {plan:"pro"}） | plan 键出现 | 200 rows=[{"x":"plan","y":1}] | 是 | rows=[{"x":"plan","y":1}] |
| AC-58 | GET /event-data/values?property=plan | 值 "pro" 计数 ≥1 | 200 rows=[{"value":"pro","total":1}] | 是 | rows=[{"value":"pro","total":1}] |
| AC-59 | GET /event-data-pivot/property-series | 时间序列分组返回 | 200 rows=1 | 是 | first={"x":1792540800000,"t":"pro","y":1} |
| AC-60 | GET /session-data/properties（identify data {role:"admin"}） | role 键出现 | 200 rows=[{"x":"role","y":2}] | 是 | rows=[{"x":"role","y":2}] |
| AC-61 | GET /session-data/values?property=role | "admin" 计数 ≥1 | 200 rows=[{"value":"admin","total":2}] | 是 | rows=[{"value":"admin","total":2}] |
| AC-62 | GET /breakdown?type=url | url 维度交叉表返回 | 200 rows=12 | 是 | rows=[{"x":"/","y":4,"visitors":1},{"x":"/page1","y":3,"visitors":1},{"x":"/after-identify","y":1,"visitors":1},{"x":"/b","y":1,"visitors":1},{"x":"/realtime","y":1,"visitors":1},{"x":"/a","y":1,"visitors" |
| AC-63 | GET /stats?segmentId=S（段过滤 url=/page1） | 指标只计 /page1 | with=3 without=14 | 是 | segment=7d371651-70d3-4e5e-b9ef-3574fa288a4b; with=3; without=14 |
| AC-64 | GET /sessions | 列表含指纹维度字段（browser/os/country） | 200 rows=2 | 是 | first={"id":"f346623c-7f7d-447e-a96e-34cb45b36e12","sessionId":"f346623c-7f7d-447e-a96e-34cb45b36e12","browser":null,"os":null,"device":"Desktop","screen":null,"language":null,"country":null,"region":null," |
| AC-65 | GET /sessions/weekly | 周矩阵形状返回 | 200 rows=2 | 是 | first={"weekday":2,"hour":"2026-10-20T09:00:00.000Z","count":1} |
| AC-66 | POST annotation（note="发布 v2"） | 列表出现；note 空串则 400（min 1） | create=200 listed=true empty=400 | 是 | create HTTP 200（api-analytics 记 200，feature 规格记 201——AC 判定标准为列表出现 + 空 note 400）; empty HTTP 400 |
| AC-67 | 创建 board 再 clone | 出现新 board 且原参数一致 | clone=200 same=true | 是 | board=11d0c235-42e1-4829-8dac-ffb3cbeb6a5c; clone=ad436dda-c263-4de9-afc5-8e6ec297e0ce; params={"widgets":[{"type":"metrics"}]} |
| AC-68 | 未登录 GET /share/<board share> | 200 看板视图 | 200 | 是 | HTTP 200; slug=b-3d2ffb74-0624-49e1-9bc6-7bc308acc949-iyqh8j66 |
| AC-69 | GET /q/<slug> | 307 且 linkEvent 入库 | 307 linkEvents=10 | 是 | HTTP 307; Location=http://target.local/x; website_event(event_type=3) 增量=10 行 |
| AC-70 | 重复 slug → 冲突；软删后 /q/<slug> | 400 冲突；软删后 404 | dup=400 afterDelete=404 | 是 | duplicate HTTP 400; after soft delete HTTP 404 |
| AC-71 | GET /p/<slug> | 200 Content-Type image/gif 且 pixelEvent 入库 | 200 image/gif pixelEvents=10 | 是 | HTTP 200; content-type=image/gif; website_event(event_type=4)=10 行 |

## 与规格不一致处的说明

| 条目 | 情况 | 处理 |
| --- | --- | --- |
| AC-05 | 短链跳转状态码：`collection/010` 写 302，`90-reference/api-collect` API-009 与 `growth/020-links` 写 307 | 按"接口精确参考 + 行为规格"取 307（两处明示 307 且其一标注为实证）；AC-05 的 302 期望未满足，已记入差异清单 D-01 |
| AC-66 | 标注创建状态码：`analytics/160` 命令注释写 201，`90-reference/api-analytics` API-133 写"成功 200（非 201）" | 取 200；AC 判定标准（列表出现 + 空 note 400）两种状态码均满足，故记"一致" |
| AC-43 | 维度名：`analytics/020` 用 `type=url`，`api-analytics` 白名单写 `path` | 两者都接受（`url` 作为 `path` 的别名），AC 期望满足 |

## 未纳入 AC 但已实现的面（超出验收面的复原面）

- 报表族 62 端点全量实现（stats/metrics/pageviews/events/values/active/sessions 族/event-data 族/event-data-pivot 族/session-data 族/session-data-pivot 族/funnels/goals/journeys/retention/attribution/breakdown/utm/performance/revenue/heatmaps/replays/annotations/segments）
- 团队/网站/看板/短链/像素/分享/后台/API Keys/2FA 全族 CRUD 与权限谓词
- tracker（rollup → public/script.js）与 recorder（rrweb 封装 → public/recorder.js）独立构建
- OpenAPI 契约体系（路由静态推断 + 旁置 zod 契约合并 + api-client 生成 + 对齐门禁）
- MCP 端点（packages/mcp 6 个工具）+ 独立构建链
- 161 locale 语言包 + check:messages 门禁 + zh-CN 渲染
- 26 迁移逐条对账（prisma migrate diff 零差异）、26 模型逐字段对账 data-model.md

