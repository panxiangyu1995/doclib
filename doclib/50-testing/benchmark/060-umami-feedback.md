# 回灌建议 · umami 复原实践发现的文档缺陷与歧义

> 依交接包 README「交付四件」之四：把复原实践中暴露的**文档缺陷/歧义**列给实验主持方，供回灌源图书馆。
> 严重度：**S1** = 直接导致 AC 无法判定或必然矛盾；**S2** = 实现者须自行决策、影响面大；**S3** = 描述精度不足（措辞/形状/参数名）。

---

## S1 · 直接矛盾（须择一裁定并在全馆统一）

| # | 冲突点 | 出现位置（相互矛盾的表述） | 建议 |
| --- | --- | --- | --- |
| S1-01 | 短链跳转状态码 302 vs 307 | 302：`30-features/collection/010` AC-05、`10-architecture/data-flow`、`00-overview/glossary`、`95-lessons/lessons`；307：`90-reference/api-collect` API-009、`30-features/growth/020-links`（行为规格 + AC-69） | 统一为 **307**（`NextResponse.redirect` 默认；`api-collect` 标注为实证），并回改 collection/010 AC-05、data-flow、glossary、lessons 四处 |
| S1-02 | 标注创建状态码 201 vs 200 | 201：`30-features/analytics/160` 可复现命令注释；200：`90-reference/api-analytics` API-133"成功 200（非 201）" | 统一为 **200**，回改 analytics/160 命令注释（AC 正文本身不含状态码，无需改） |
| S1-03 | 维度名 `url` vs `path` | `analytics/020` AC-43 用 `type=url`；`api-analytics` API-072 白名单写 `path`（EVENT_COLUMNS） | 二选一并全馆统一；若确为同义，建议在 `api-contract-schema` 明写"url ≡ path 别名" |
| S1-04 | 登录凭证：body token vs httpOnly cookie | `platform/010` 同段既写"凭证走响应体 token（客户端以 Authorization: Bearer 携带），**非 httpOnly cookie**"，又写"会话：httpOnly cookie"；`api-auth-identity` API-015 记"会话校验" | 明确"双通道并存"或择一；建议写"登录同时返回 token 并下发 httpOnly cookie，`auth()` 两处皆读" |
| S1-05 | `GET /api/me` 是凭证端点还是资料端点 | API-022 "**{token,shareToken,authType}**（凭证三件套，**非资料页**）" vs `platform/040` "当前用户概览（含头像）" vs AC-20 "含 username/role" | 拆成两个端点或明确超集；当前无端点可同时满足三条 |
| S1-06 | 短链/像素重名 slug 的错误码 | API-061 "重名实测 **500**——唯一约束未友好处理" vs `growth/020` AC-70 "重复 slug → **400** 冲突" | 以 AC 为准（400），回改 API-061；或把 AC-70 改为 500（但 500 不是"友好冲突"，建议保留 400 并修原实现） |
| S1-07 | `GET /api/auth/verify` 与 `GET /api/auth/sso` 的方法 | `platform/010` 正文写"GET /api/auth/verify 校验"，API-015 写"POST；**GET 返回 405**"；AC-13 未指定方法 | 统一为 POST（API-015 精确），回改 platform/010 正文 |

---

## S2 · 实现者必须自行决策、影响面大（建议补写契约）

| # | 缺口 | 现状 | 建议补写 |
| --- | --- | --- | --- |
| S2-01 | Link/Pixel 与 Website 无关联，但 `WebsiteEvent.websiteId` 必填 | 文档只说 Link/Pixel 归属 user\|team；linkEvent/pixelEvent 却要求落 `website_event` | 在 `data-model` 明确：Link/Pixel 是否带 `websiteId`；若无，写明 link/pixel 事件的 website 归属规则（本复原取"归属者第一个网站"） |
| S2-02 | 热图事件的写入端点未定义 | `analytics/100` 只说"tracker 记录点击/滚动落 HeatmapEvent"，API 登记册无对应端点 | 在 `api-collect` 增补"热图经 `/api/send` 的 payload 承载"或登记独立端点 |
| S2-03 | 收入事件的采集字段未定义 | `analytics/070` "收入数据经收集事件写入 Revenue"；send 载荷契约无 revenue 字段 | 在 send 载荷契约补 `revenue`/`currency`（或明确独立写入端点） |
| S2-04 | 过滤参数的注入位置与 segment 合并语义 | `api-analytics` 只说"filter 对象（16 算子）… segmentId 可复用段" | 明确：filter 与 segmentId 同时出现时的合并规则（本复原：并集追加）、filter 值的编码形式（本复原：JSON 数组 query 参数） |
| S2-05 | 报表端点的必填参数表 | `api-analytics` 注记"回灌补记：报表端点的时间窗口参数为 startAt/endAt（毫秒）或 startDate/endDate（日期串）二选一；大数据窗口类（journeys/retention/attribution/heatmap）走日期串+额外参数"——"额外参数"未逐条列出 | 逐端点补必填参数表（funnels/stats 的 window+steps、goals/stats 的 type+value、attribution 的 model+type+step、revenue/stats 的 currency、utm/metrics 的 type、event-data 的 propertyName）——目前只能从散落描述中拼装 |
| S2-06 | 留存/归因的访客与归因点定义 | `analytics/060` "以 distinctId/session 指纹聚合访客"未定优先级；`analytics/080` 未定义 step 是"路径值"还是"序号" | 写明：访客键 = distinctId 优先、缺失时回落指纹；归因 step = 匹配值（type 决定 path/event），取会话内首个/末个命中事件 |
| S2-07 | `isbot` 版本语义 | `dependencies.md` 只列 "isbot"（未锁版本）；isbot v5 的全量模式会把 `curl/*`、裸 `Mozilla/5.0` 判为 bot | 锁版本并在 `30-features/collection/010` 写明判定口径（本复原用 isbot + 爬虫语义标记），否则"合法 event 入库"与"bot 软拒"两条 AC 互斥 |
| S2-08 | 内网过滤的作用域 | `data-flow` "内网/IP 过滤 → 丢弃"未说明作用对象；而 AC-01 要求在自托管/容器环境（回环或私网段）合法入库 | 写明：传输层 IP 与客户端显式声明 IP 的差别处理（本复原：前者只走 IGNORE_IP 黑名单，后者加内网段判定） |
| S2-09 | 访问段（visitId）轮换的判定源 | `collection/020` 同时写"同会话连续活动共享 visitId"与"cache.iat 超 1800s 轮换" | 明确优先级：带缓存 token 时以 token.iat 为准（超期即轮换），无 token 时以"会话最后活动距今 ≤30 分钟"为准 |
| S2-10 | 会话指纹字段集 | `collection/020` 写"UA（browser/os/device/screen）+ IP → GeoIP（country/region/city）+ language" | 明确 IP 本身是否入指纹（本复原：不入，只经 GeoIP 落地）、各字段是否全等匹配 |
| S2-11 | 漏斗 `window` 参数语义 | `analytics/030` "window 分钟必填"未说明作用对象 | 写明：window = 访问段窗口上限（与 30 分钟切断一致），落库漏斗的默认 window |
| S2-12 | `replays` 与 `saved` 的 id 语义 | `analytics/110` "/replays/[replayId] 详情"；数据模型的 (websiteId, visitId) 唯一约束 | 明确 replayId 即 visitId（本次按此实现），否则 `[replayId]` 与 `session_replay.id` 关系不明 |
| S2-13 | heatmaps 返回形状 | `analytics/100` "聚合坐标密度/滚动深度分布"无形状 | 给出 JSON 形状（本复原：按坐标元组聚合的数组，行含 eventType/x/y/pageX…/scrollPct/count） |
| S2-14 | `metrics` 越权类型的 401 | API-072 写"越权类型（breakdown/utm/attribution）→ **401**"，而 `api-contract-schema` 错误面说"401（未认证）" | 401 兼表"未认证"与"越权类型"易混淆，建议明确这是原文行为或改 400（并在错误面表登记） |
| S2-15 | 2FA 限流阈值与锁定时长 | `platform/020` 只说"失败限流（attempts/lockedUntil 锁定）" | 给出默认阈值（本复原：5 次 / 锁定 15 分钟）与重置条件 |
| S2-16 | 分享 `parameters` 的语义 | `platform/080` "parameters Json 承载分享视图配置（时间范围等）" | 列出参数键（当前实现不解析，按原样透传给前端） |
| S2-17 | `boards` 的 `type` 与 parameters 结构 | `growth/010` "type + parameters Json 布局"；`boardComponentCompatibility` 提到版本兼容 | 给出 parameters 的最小结构与版本兼容规则（本复原仅原样存储/克隆） |
| S2-18 | `/api/share/id/[shareId]` 的鉴权语义 | API-070 标"会话"；`platform/080` 说"会话语义" | 明确"需登录"还是"持 shareToken 即可"（当前实现：需登录） |
| S2-19 | `POST /api/2fa/verify` 的身份来源 | `platform/020` "登录挑战：verify 接受 OTP 或备份码"；挑战态的用户标识如何传递未写 | 写明：挑战 token（登录响应下发）或会话均可确定用户；本复原两者皆支持 |
| S2-20 | `/api/websites/[id]/values` 的 property 白名单 | API-078 "属性值枚举（property+search）" | 明确 property 取值范围（当前实现取 FILTER_COLUMNS） |
| S2-21 | `/api/dashboard` 的网站范围 | `analytics/010` "全站聚合视图（多网站可选）" | 明确：默认可访问全部网站（个人+团队），是否支持 websiteIds 过滤（本复原未支持过滤参数） |
| S2-22 | `funnels`/`goals` 的持久化载体 | `analytics/030` "Report type=funnel"；`api-analytics` API-111 记 Report 族 | 写明 Report.parameters 的 zod 形状来源（`api-contract-schema` 已有 funnelReportSchema/goalReportSchema，需注明落库时按此校验） |
| S2-23 | `share` 的 slug 生成规则 | `platform/080` "slug 唯一，可自定义" | 写明默认生成规则与长度/字符集（本复原：12 位小写字母数字） |
| S2-24 | `links`/`pixels` 的 slug 约束 | API-061/065 记 "slug ≥8 字符"；AC-70 用 `l1`（2 字符）作例子 | AC 示例与契约冲突（本复原按契约 400，AC-70 的命令示例需改用 ≥8 字符的 slug） |

---

## S3 · 描述精度不足（措辞/形状/命名）

| # | 位置 | 问题 | 建议 |
| --- | --- | --- | --- |
| S3-01 | `api-analytics` API-071 | stats 形状写 `{pageviews,visitors,visits,bounces,totaltime,comparison{...}}`，但 `comparison` 的键未列 | 补 `comparison` 的 5 键（pageviews/visitors/visits/bounces/totaltime） |
| S3-02 | `api-analytics` API-081 | "网站列表聚合序列图"未给形状 | 补形状（建议 `[{websiteId,name,views,visitors}]` 或按时间桶的 series） |
| S3-03 | `api-analytics` API-084 | "周流量矩阵（7×N 时段计数）"未给键名 | 补键（weekday/hour/count） |
| S3-04 | `api-analytics` API-120 | 留存行形状 `{date,day,visitors,returnVisitors,percentage}` 中 `date` 是 cohort 期还是回访期未定义 | 明确 date = cohort 首访期，day = 距首访的周期数 |
| S3-05 | `api-analytics` API-121 | 归因输出 7 个键的**值类型**未给（计数？分组对象？） | 明确每个桶是"计数"还是"值→计数"映射 |
| S3-06 | `api-analytics` API-123 | utm/metrics 形状 `[{utm,views}]` 清楚，但 `type` 缺省时的行为未写 | 写明缺省（本次实现缺省 utm_source） |
| S3-07 | `api-collect` API-001 | "成功 200 + {cache:<JWT>}"未说明是否还有其它字段 | 补完整响应字段（本次实现 `{type,id,cache}`） |
| S3-08 | `api-collect` API-005 | `/api/heartbeat` 的响应体未定义 | 补最小形状（本次 `{status:'ok'}`） |
| S3-09 | `api-collect` API-006 | realtime 的响应字段未定义 | 补字段（本次 `{activeVisitors,visitors,activity}`） |
| S3-10 | `api-collect` API-008/009 | 像素/短链是否记事件、记到哪个 website 未写 | 见 S2-01 |
| S3-11 | `platform/030` | SSO 与订阅的响应形状未定义 | 补 subscription 形状（本次 `{active,plan,limits,cloudMode}`） |
| S3-12 | `platform/040` | "头像 dicebear 语义"未给 URL 规则 | 补规则（本次未实现头像 URL，仅存 logoUrl 字段） |
| S3-13 | `platform/070` | "GET .../export：打包导出（jszip）"未给压缩包内文件清单 | 补清单（本次 website/website_event/session/event_data/session_data/revenue 六个 JSON） |
| S3-14 | `platform/100` | "161 个 locale 文件"与 `project.md` "160+ 语言包"表述不统一 | 统一为确切数量 161 并在 `60-config` 记录生成脚本（`build:languages`） |
| S3-15 | `95-lessons` | 教训条目"短链 302 端点"与 api-collect 的 307 冲突 | 见 S1-01，回改该条 |
| S3-16 | `80-design/routes.md` | 45 条页面路由与"报表子页 7 条"等聚合写法混排，落地时难以判定单页 vs 分组 | 补全每条路由的精确路径（本复原按分组实现 21 页） |
| S3-17 | `60-config/config-registry.md` | CFG 条目里 `DATABASE_TYPE`、`SALT_ROTATION`、`API_COVERAGE`、`LOG_QUERY` 等语义极简，无法判断"填什么" | 补取值示例与用途说明（至少 DATABASE_TYPE 的可选值） |
| S3-18 | `10-architecture/dependencies.md` | `isbot`/`otplib`/`is-localhost-ip` 等关键包未锁版本，而这些包的大版本会改变行为（见 S2-07） | 锁版本并记录破坏性变更点 |
| S3-19 | `50-testing/testing.md` | "tests/api 40 文件""tests/e2e 10 文件"未给文件清单与覆盖的 AC 映射 | 补 AC ↔ 用例映射表（本次以 `scripts/acceptance.mjs` 覆盖 71 条 AC） |
| S3-20 | `40-guides/roadmap.md` | 阶段 5 的 AC 区间写 "AC-40~AC-66"（27 条）但 analytics 分区实为 AC-40~AC-66 共 27 条 ✓，而总验收行写 "75 条 AC"（实为 71 条） | 回改总数为 71 |

---

## 复原实践中最"卡手"的三处（供主持方优先裁定）

1. **S1-01 短链 302/307** —— 唯一导致 AC 判定分歧的硬矛盾（AC-05 与 AC-69 互斥）。
2. **S2-04 + S2-05 报表参数契约** —— 端点虽多，但"必填参数"与"过滤注入位置"不明确时，实现者要为每个端点重新做一次猜测（本次以 `api-analytics` 的零散回灌补记拼装出统一基座）。
3. **S2-07 + S2-08 bot/内网过滤口径** —— 这两条决定了 AC-01/AC-04/AC-06 能否同时成立；文档当前表述会让"照字面实现"直接丢掉 AC-01。
