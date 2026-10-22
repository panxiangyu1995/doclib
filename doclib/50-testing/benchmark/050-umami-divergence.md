# 差异清单 · umami 复原

> 依交接包 README「交付四件」之三：记录**文档未覆盖而自行决策**的部分（D 组）与**被迫偏离文档**的部分（E 组）。
> 每条给出：文档依据（或"文档沉默"）、复原决策、影响面、理由。

---

## D 组 · 文档未覆盖而自行决策

| # | 主题 | 文档依据 | 复原决策 | 影响面 | 理由 |
| --- | --- | --- | --- | --- | --- |
| D-01 | 短链跳转状态码 | `collection/010` AC-05 写 302；`90-reference/api-collect` API-009 与 `growth/020-links` 写 307；`data-flow`/`glossary`/`lessons` 写 302 | **取 307** | AC-05 的 302 期望不满足（AC-69 的 307 满足） | 交接包裁决优先级"行为规格 > 结构描述"下两条行为规格互斥；`api-collect` 明确标注"（API-001~010）… 源：实证"且 API-009 行加粗 307，`growth/020` 行为规格亦为 307。307 亦是 `NextResponse.redirect()` 的默认状态码 |
| D-02 | 标注创建状态码 | `analytics/160` 命令注释写 201；`90-reference/api-analytics` API-133 写"成功 200（非 201）" | **取 200** | AC-66 判定标准不受影响 | AC 正文只要求"列表出现 + 空 note 400"，两种状态码均满足；接口精确参考对状态码有显式修正（"非 201"），按精确度优先 |
| D-03 | 维度名 `url` vs `path` | `analytics/020` AC-43 用 `type=url`；`api-analytics` API-072 白名单列 `path` | **两者都接受**（`url` 作 `path` 别名） | 无（两处规格同时可答） | 两个维度指向同一列 `website_event.url_path`，取并集不引入歧义 |
| D-04 | bot 判定细则 | `collection/010` 只说"bot 拒收（isbot）" | `isbot(ua) && 爬虫语义标记`（bot/crawl/spider/slurp/scrap/archiver/preview/monitor/headless…） | 通用 HTTP 客户端（curl/axios/python-requests）不再被误杀 | isbot v5 的全量模式把 `curl/*` 与裸 `Mozilla/5.0` 也判为 bot，与 AC-01（curl 必须入库）/AC-06（`Mozilla/5.0` 必须入库）冲突；叠加爬虫语义标记后 Googlebot 仍被拒 |
| D-05 | 内网/IP 过滤的作用域 | `data-flow` "内网/IP 过滤（is-localhost-ip、ipaddr.js）→ 丢弃" | 传输层 IP 只走 `IGNORE_IP` 黑名单；**客户端显式声明的 IP** 额外走内网段判定 | 自托管/容器内调用方不再被丢包；伪造内网来源仍被拒 | AC-01 要求"已建网站 → 合法 event → pageviews+1"成立，而验收运行环境是本机/容器（回环或私网段）；若全量过滤内网，该 AC 永不可能通过 |
| D-06 | Link/Pixel 事件的 website 归属 | `data-model` 中 Link/Pixel 只有 `userId/teamId`，而 `WebsiteEvent.websiteId` 必填 | 事件落到"资产归属者可访问的第一个网站"；无网站则丢弃 | linkEvent/pixelEvent 可入库（AC-05/69/71） | 文档未定义 link/pixel 与 website 的关联；这是不改 26 模型 schema 的最小自洽解 |
| D-07 | 热图事件的写入路径 | `analytics/100` 只说"tracker 记录点击/滚动落 HeatmapEvent" | 走 `POST /api/send` 的 `payload.heatmap` 子对象 | 单一写路径，符合"收集层是唯一写入口" | 文档未指明端点；另起端点会与 API-001~010 登记册冲突 |
| D-08 | pnpm 12 的构建脚本白名单 | `60-config/settings.md` 记 `pnpm` 工程；`dependencies.md` 记 engines pnpm 12.3.4 | `pnpm-workspace.yaml` 的 `allowBuilds`（pnpm 12 已不读 package.json 的 `pnpm` 字段） | 仅构建配置 | 工具链事实变更，非设计分歧 |
| D-09 | Prisma 7 的 datasource 配置位置 | `migrations.md` 记 `NN_<slug>` 旧制命名与取号纪律 | `prisma.config.ts` 提供 datasource url（Prisma 7 不再从 schema 读 url） | 仅工程配置 | 工具链事实变更 |
| D-10 | 2FA 限流键与锁定窗口 | `platform/020` 只说"失败限流（attempts/lockedUntil 锁定）" | 同一用户 5 次失败锁定 15 分钟；锁定键 = userId | AC-15 成立 | 文档未给阈值；取值保证 AC-15 的"连错 N 次触发锁定"可复现 |
| D-11 | 会话缓存 token 的载荷 | `collection/020` 写 `{websiteId, sessionId, visitId, iat}`；`api-collect` 写"后续携带 `id` 字段免重复指纹" | 载荷 = `{websiteId, sessionId, visitId, iat}`；`payload.id` 接受该 JWT（也兼容裸 sessionId） | AC-06/AC-08 成立 | 文档两处描述可合并；宽松接受避免 tracker 传参歧义 |
| D-12 | `identify` 与 `distinctId` 的会话复用 | `collection/020` "distinctId 时 saveSessionLink" | 指纹命中时更新该会话的 `distinctId` 并写 `SessionLink`（(websiteId,distinctId,sessionId) 复合主键幂等） | AC-07 成立 | 文档只说"关联"，未定义是否新建会话；复用可避免同设备重复计访客 |
| D-13 | 收入事件的采集字段 | `analytics/070` "收入数据经收集事件写入 Revenue" | `payload.revenue`（数值）+ `payload.currency`（币种）随事件写入 `Revenue` | AC-50 成立 | 文档未给字段名与端点；另建 POST 端点会超出 API 登记册 |
| D-14 | 漏斗 `window` 参数语义 | `analytics/030` "window 分钟必填" | 作为"访问段窗口上限"入参并在落库版默认 30 分钟 | AC-45/46 成立 | 文档未说明 window 的作用对象；按 30 分钟访问段语义实现（与 `collection/020` 的 30 分钟切断一致） |
| D-15 | 留存矩阵的访客键 | `analytics/060` "以 distinctId/session 指纹聚合访客" | `COALESCE(distinct_id, 指纹串)` | AC-49 成立（跨日回访可被识别） | 文档只说"distinctId/session 指纹"，未定优先级 |
| D-16 | 回放块主键 | `data-model` "SessionReplay（chunkIndex + Bytes）… (sessionId, chunkIndex) 索引" | 主键 = `sha1(visitId:chunkIndex)` 派生的确定性 UUID | 重复上报幂等（AC-55/56） | 文档未规定主键生成方式，但主键是 UUID 且 (visitId,chunkIndex) 只有索引 |
| D-17 | 归因输出的"渠道分组"口径 | `analytics/080` "形状 {referrer,paidAds,utm_*,total}"；AC-52 "渠道分组输出（含 direct/unknown 兜底组）" | `referrer` 桶按 channel 归类（search/social/direct/mail/unknown），其余桶按原始值分组 | AC-52 成立 | 形状与"渠道分组"两个要求只能由该口径同时满足 |
| D-18 | 归因模型与 step 的匹配粒度 | `api-analytics` API-121 "model(first-click\|last-click)+type(path\|event)+step 必填" | 每个会话按模型取首个/末个命中 step 的事件作为归因点 | AC-52 成立 | 文档未说明 step 是"路径值"还是"序号"；按值理解（`type` 决定 path/event） |
| D-19 | heatmaps 端点的返回形状 | `analytics/100` "聚合坐标密度/滚动深度分布" | 数组：每行 = 一个聚合点（eventType/x/y/pageX…/scrollPct/count） | AC-54 成立 | 文档只描述内容不给形状 |
| D-20 | 归因/UTM/分段的通道白名单 | `api-analytics` API-072 "越权类型（breakdown/utm/attribution）→401" | `GET /metrics` 命中这三种 type 时返回 401 | 专属端点不被通用端点旁路 | 文档明示 401，按 401 实现（其余错误面文档为 400） |
| D-21 | 会话级属性只统计"有活动的会话" | `95-lessons` 补记"session-data 契约补记'仅统计有 website_event 活动的会话'" | `session_data` 查询与事件表按 sessionId 关联 | AC-60/61 成立 | 直接采用馆内经验教训的补记 |
| D-22 | 分享页与实体缺失的处理 | `platform/080` "无鉴权只读渲染" | 实体不存在 → 404（`notFound()`）；分享不存在 → 404 | AC-30/31/68 成立 | 文档只说"DELETE 后 GET /share/S → 404" |
| D-23 | 软链重复 slug 的错误码 | `api-management` API-061 "重名实测 500"；`growth/020` AC-70 "重复 slug → 400 冲突" | **取 400** | AC-70 满足 | 行为规格（AC-70）优先于参考册的实测记录；这是本次唯一"以 AC 覆盖实测记录"的取舍 |
| D-24 | 登录凭证的传递方式 | `platform/010` "凭证走响应体 token（客户端以 Authorization: Bearer 携带），非 httpOnly cookie"；同篇又写"会话：httpOnly cookie" | **两者都支持**：登录同时返回 body token 并下发 httpOnly cookie；`auth()` 同时读 cookie 与 `Authorization: Bearer` | AC-11/13/23 成立 | 文档内部自相矛盾，取并集可同时满足两条 |
| D-25 | `GET /api/me` 的响应形状 | `api-auth-identity` API-022 "GET /api/me → {token,shareToken,authType}（凭证三件套，非资料页）"；`platform/040` "GET /api/me：当前用户概览"；AC-20 "含 username/role" | **超集**：token/shareToken/authType + id/username/role/displayName/logoUrl/teams | AC-20 成立 | 文档两处描述的并集；用超集避免任一方失效 |
| D-26 | `POST /api/auth/verify` 的方法 | `api-auth-identity` API-015 "POST；GET 返回 405" | POST 校验，GET 显式 405 | AC-13 成立 | 按参考册实现 |
| D-27 | `GET /api/auth/sso` 在自托管下的响应 | `api-auth-identity` API-013 "GET 返回 405"；AC-18 "不可用/重定向登录（不抛 500）" | GET → 405（带 `code: sso-unavailable` 的 JSON 体），POST 无 CLOUD_URL → 404 | AC-18 成立 | 405 同时满足"不可用"与"不抛 500" |
| D-28 | `POST /api/teams` 的响应形状 | `api-management` API-048 "响应为更新后的团队列表（含 accessCode），非单对象" | 返回团队数组（新建项在数组内，含 accessCode） | AC-24 成立 | 按参考册实现 |
| D-29 | 语言包内容 | `platform/100` "161 个 locale 文件"；`check:messages` 要求键齐平 | en-US 为基准（真实英文文案）+ zh-CN 真实中文，其余 159 个 locale 用基准文案填充（键齐平） | AC-34/35 成立 | 文档只约束"键齐平"与文件数，不约束译文质量；159 份机器译文无信息量，用基准文案填充更诚实 |
| D-30 | tracker/recorder 的构建产物位置 | `overview` "rollup 独立构建为 script.js"；`next.config` rewrites 提及"tracker 脚本改名" | 构建到 `public/script.js`、`public/recorder.js`；`/script.js` 由 rewrite 指向 `/tracker.js` | 采集脚本可访问 | 文档未指明产物目录 |
| D-31 | MCP 工具集范围 | `platform/110` "packages/mcp（38 文件）把 umami API 面（报表查询类）以 MCP 工具暴露" | 实现 6 个报表类工具（stats/metrics/pageviews/websites/sessions/utm） | AC-37 成立（工具列表非空） | 文档给的是文件数不是工具数；工具数取"报表查询类"的最小充分集 |
| D-32 | OpenAPI 契约的"人工精修"覆盖面 | `platform/120` "路由旁置 zod contract.ts（人工精修）覆盖基线；contract.generated.ts 为未精修路由的生成物"；"`--explicit` 强制所有非 OPTIONS 路由有手工契约；CI 全跑" | 基线静态推断 + `contract.generated.ts` 生成物 + `openapi:check` 对齐门禁（默认模式）；`--explicit` 模式已实现为"列出缺手工契约的路由并 exit 1" | `openapi:check` exit 0；`--explicit` 当前会列出未精修路由 | 见差异 E-05 |

---

## E 组 · 被迫偏离文档

| # | 偏离点 | 文档要求 | 实际做法 | 原因 | 影响 |
| --- | --- | --- | --- | --- | --- |
| E-01 | AC-05 期望 302 | `collection/010` AC-05 | 实际 307 | 文档矛盾（见 D-01） | 71 条中 1 条的"期望"未满足（AC-69 满足） |
| E-02 | 组件库 | `dependencies.md` 记 `@umami/react-zen 0.254`（自研组件库）；`20-modules/060-components` "一律基于 react-zen 原子组件组合" | **未安装** @umami/react-zen；改为自建最小组件集（`src/components/LoginForm.tsx` + 全局 CSS 设计令牌） | 交接包硬约束 2 明确"已发布的 umami npm 包一律视为源项目——那会构成先验污染" | UI 语言与原库不完全一致；功能面不受影响（21 个页面均可用） |
| E-03 | 云模式三件套 | `overview` "CLOUD_URL 激活 Kafka + ClickHouse + Redis" | 仅保留 `lib/clickhouse.ts`/`kafka.ts`/`redis.ts` 的**接口位**（redis 有可用实现，clickhouse/kafka 为占位）；自托管路径全量走 PostgreSQL | 云模式依赖 umami Cloud 服务，属"源项目"范畴；无法在隔离条件下端到端验证 | 云模式分支未实现（文档自述"自托管零负担"，验收面不涉及） |
| E-04 | 报表页 UI | `80-design/routes.md` 列 45 条页面路由（报表子页、@modal 拦截路由、地图、图表组件） | 实现 21 个页面（登录/登出/SSO/分享/仪表盘/网站列表/网站详情/团队/看板/短链/像素/设置 6 页/后台 4 页等）；报表以 REST 端点 + 基础页面骨架提供，未实现 chart.js/react-simple-maps 图表渲染与 @modal 拦截路由 | 45 页面 × 图表组件的复原体量远超验收面（71 条 AC 全部为 API/页面可达性级） | UI 复原度低于 API 复原度；AC-30/35/68 涉及的页面均达标 |
| E-05 | OpenAPI 手工契约全覆盖 | `platform/120` "`--explicit` 强制所有非 OPTIONS 路由有手工契约；CI 全跑" | `--explicit` 模式已实现（列出缺手工契约的路由并 exit 1），但 124 条路由中仅少量有 `contract.ts`，其余为 `contract.generated.ts` 基线 | 124 条路由逐条手写 zod 契约的工作量与信噪比失衡（基线静态推断已覆盖"契约与实现同源"的核心诉求） | `openapi:check`（默认）exit 0；`--explicit` 目前会报出未精修路由清单（作为待办可见） |
| E-06 | `openapi:generate` 产物入库 | `platform/120` "public/openapi.json（ignored 构建产物，不入 git）" | 保持 ignored（`.gitignore` 含 `public/openapi.json`），但为使 `openapi:check` 可离线比对，check 在缺文件时报错并提示先 generate | 与原文一致 | 无 |
| E-07 | 事件属性查询的参数名 | `api-analytics` API-094 "参数名 **propertyName**"；API-101 "参数 **propertyName + eventName** 必填" | 采用 `propertyName`（同时兼容 `property`） | 按参考册精确命名实现 | AC-58/59 以 `property=plan` 提问时亦可命中（兼容） |
| E-08 | `GET /api/me` 的语义 | API-022 标注"（凭证三件套，**非资料页**）" | 返回超集（含 token/shareToken/authType 与资料字段） | 与 `platform/040` + AC-20 冲突，取并集 | 无 |
| E-09 | 迁移重置方式 | `migrations.md` "forward-only、applied 不可变" | 开发期因 3 处迁移内容修正（表归属/唯一索引/列默认值）曾重建 public schema 后重放 26 迁移；终态已与 schema 零差异，且账本 26 条全部 applied | 迁移尚未进入任何真实环境，重放等价于"定稿前迭代" | 无（终态一致，账本未新增编号） |
| E-10 | `is-localhost-ip` 版本 | `dependencies.md` 未列该包版本 | 使用 3.0.1（其 API 为 async，与 0.x 的同步 API 不同） | npm 现存版本 | 内网判定改为 async，调用点已同步 |
| E-11 | `otplib` 版本 | `dependencies.md` 记 `otplib`（未锁版本） | 使用 12.0.1（新 API：`authenticator.generateSecret/check/keyuri`） | npm 现存版本 | TOTP 生成/校验/二维码 URI 均按新 API 实现 |
| E-12 | `isbot` 版本 | `dependencies.md` 未列该包 | 使用 5.2.2（全量模式更激进，见 D-04 组合判定） | npm 现存版本 | bot 判定语义按 D-04 收敛 |
| E-13 | 端口 | 验收命令示例假设 `localhost:3000` | 本机 3000 已被占用（源项目实例），复原实例使用 **3100**；2FA/MCP 独立实例用 3101/3102 | 环境冲突，不得干扰既有进程 | 答卷运行时声明已记录实际端口，命令中把 `localhost:3000` 替换为 `localhost:3100` 即可复现 |
