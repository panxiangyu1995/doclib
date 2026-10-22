---
title: umami 回归轮切片答卷
covers:
  - test/umami-rebuild-handover/umami-rebuild
ids: BENCH-UMAMI-REGRESSION
status: stable
---

# umami 回归轮切片答卷（070）

> 回归工单（ALIGNMENT.md 13 项对齐）执行结果：**切片 22/22 一致**；全量 71 条复跑 **71/71**。复原者：opencode / minimax-m3.1-flash-free（续首轮实例，受指导对齐性质已在 REBUILD-LOG §6 声明）。
> 运行时：localhost:3100（同首轮环境）；对齐日志全文见 [080-umami-alignment-log.md](080-umami-alignment-log.md)。

| 条目 | 动作 | 期望 | 实测 | 一致? | 证据 |
| --- | --- | --- | --- | --- | --- |
| AC-01 | POST /api/send 合法 event | 200 + {cache:<JWT>}，/stats pageviews+1 | 200 + cache=true | 一致 | HTTP 200; body keys=type,id,cache; pageviews=1; UA=完整浏览器 UA（馆内 api-collect 校准：is |
| AC-04 | bot UA (Googlebot) | 200 + {"beep":"boop"} 软拒 | 200 + {"beep":"boop"} | 一致 | HTTP 200; body={"beep":"boop"} |
| AC-05 | GET /q/<slug>（回归包馆内已裁定 307） | 307 至目标 url 且 linkEvent 入库 | 307 | 一致 | HTTP 307; Location=http://target.local/landing; website_event 行=[{"id":"fb40184e |
| AC-06 | 连续两次 send（同 UA/IP） | 两次响应 id 相同（会话复用） | 969b079a-9fa2-5d2b-b959-b5943419cc9b / 969b079a-9fa2-5d2b-b959-b5943419cc9b | 一致 | id1=969b079a-9fa2-5d2b-b959-b5943419cc9b id2=969b079a-9fa2-5d2b-b959-b5943419cc9 |
| AC-08 | cache.iat 超过 1800s 后再 send | visitId 轮换（新 visitId） | d0866e0b-9259-572c-b5f3-4ab7aae90839 → 4584d6b4-194a-5d48-b4b0-8b8a7b1ce0c6 | 一致 | old visit=d0866e0b-9259-572c-b5f3-4ab7aae90839; new visit=4584d6b4-194a-5d48-b4b |
| AC-11 | POST /api/auth/login 正确凭证 | 200 {token,user}；不下发 umami_token cookie（A11：仅 body token + Bearer） | 200 umami_token=absent | 一致 | HTTP 200; user=admin; role=admin; Set-Cookie=[]（NEXT_LOCALE 属 i18n 中间件，非会话 cooki |
| AC-13 | 改密后用旧 token 调 /api/auth/verify | 401（新 token 200） | old=401 new=200（改密本身 200） | 一致 | HTTP 401; change=200; new token HTTP 200 |
| AC-18 | 自托管 GET/POST /api/auth/sso | 不可用/重定向登录（不抛 500）；POST 无 CLOUD_URL → 401（A13） | GET=405 POST=401 | 一致 | GET HTTP 405（API-013：GET 返回 405）; POST HTTP 401 body={"message":"SSO is not avai |
| AC-20 | GET /api/me | 200 {token,shareToken,authType} 三件套（资料走 POST /api/auth/verify） | 200 keys=authType,shareToken,token | 一致 | HTTP 200; body keys=authType,shareToken,token |
| AC-24 | 创建团队 → accessCode → 第二用户 join | 返回 accessCode；join 成功成 member | team=created join=200 | 一致 | accessCode=7CUER2MYJM; join HTTP 200; body={"id":"dd6980e4-5ac3-43ff-b201-475028 |
| AC-43 | GET /metrics?type=url（A1 裁定：不收别名 → 400） | 400（type=url 不在白名单；白名单维度 type=path 正常返回含 /page1 的排名表） | 400 | 一致 | type=url → HTTP 400（body={"message":"Invalid metric type: url","code":"invalid-m |
| AC-45 | GET funnels/stats（两步） | step1 计数 ≥ step2 计数 | 200 [{"visitors":1,"previous":1,"dropped":0,"dropoff":0,"remaining":0},{"visitors":0,"previous":1,"dropped":1,"dropoff":1,"remaining":0}] | 一致 | HTTP 200; steps=[{"visitors":1,"previous":1,"dropped":0,"dropoff":0,"remaining": |
| AC-46 | 落库漏斗 GET [funnelId]/stats | 与即时版一致 | same=true | 一致 | instant=[{"visitors":1,"previous":1,"dropped":0,"dropoff":0,"remaining":0},{"vis |
| AC-49 | GET retention unit=day（两日均有活动的访客） | 对角线外第二周期人数 ≥1 | 200 rows=3 second={"date":"2026-10-21T00:00:00.000Z","day":1,"visitors":1,"returnVisitors":1,"percentage":1} | 一致 | rows=[{"date":"2026-10-21T00:00:00.000Z","day":0,"visitors":1,"returnVisitors":1 |
| AC-50 | event.data {revenue>0, currency} → GET /revenue/stats?currency=USD | 总额 >0 且含币种维度；Revenue 行已落库 | 200 sum=19.99 revenueRows=1 | 一致 | HTTP 200; body={"sum":19.99,"count":1,"unique_count":1,"average":19.99,"arpu":9. |
| AC-52 | GET attribution | 渠道分组输出（含 direct/unknown 兜底组） | 200 groups={"search":0,"social":0,"direct":1,"mail":0,"unknown":0} | 一致 | body={"referrer":{"search":0,"social":0,"direct":1,"mail":0,"unknown":0},"paidAd |
| AC-54 | POST /api/record（heatmap 分流）→ GET /heatmaps?urlPath=/page1&mode=click | 坐标聚合数据返回（按 url_path 聚合，mode=click/scroll） | 200 rows=1 record=200 | 一致 | record HTTP 200; rows=[{"urlPath":"/page1","pageW":1280,"pageH":2000,"viewportW" |
| AC-55 | GET /replays（recorder 已录块） | 回放列表含该 visit | 200 rows=1 found=true | 一致 | record HTTP 200; rows=[{"sessionId":"c59d2e1b-9a6f-58b9-b67f-9ddc8dfc0f52","visi |
| AC-56 | 收藏回放 + 重复收藏 | 出现且重复报唯一冲突 | saved=200 listed=true duplicate=400 | 一致 | save HTTP 200; list=[{"id":"e6e4a309-e853-4f28-932a-5ff2fac19794","name":"accept |
| AC-69 | GET /q/<slug> | 307 且 linkEvent 入库 | 307 linkEvent 行数=3 | 一致 | HTTP 307; Location=http://target.local/x; website_event 行=[{"id":"6e45f455-ef1c- |
| AC-70 | 重复 slug → 冲突；软删后 /q/<slug> | 500 冲突（唯一约束未友好处理——A10 裁定，如实复刻）；软删后 404 | dup=500 afterDelete=404 | 一致 | 重复 slug 真实响应：HTTP 500 body=null；软删后 GET /q/dup1792631921983ln → HTTP 404 |
| AC-71 | GET /p/<slug> | 200 Content-Type image/gif 且 pixelEvent 入库 | 200 image/gif pixelEvent 行数=3 | 一致 | HTTP 200; content-type=image/gif; website_event 行=[{"id":"6a25d7f1-0d55-46f9-bbe |
