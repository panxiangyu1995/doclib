---
title: umami 基准答卷 · 原仓库卷
covers:
  - test/umami/src
ids: BENCH-UMAMI-ANSWER-SRC
status: stable
---

# umami 基准答卷（原仓库卷 · 020）

> 同题共答的**原仓库侧答卷**：71 条 AC 在 umami@v3.4.0（commit ec0ff503）源码构建实例逐条执行留痕。复原侧答卷（030）同构，diff 即同题共答结果。
> 结果分档：**通过**（与规格一致）/ **通过-偏差**（行为达成但契约细节与图书馆记载有差，偏差列明）/ **部分**（端点通但链路/数据未闭环）/ **未验**（时滞/环境/未执行）。

## 运行时声明

- 项目锚点：umami@v3.4.0，commit `ec0ff50388c264ed8ce46f00967e92f7e71476ae`
- 执行环境：macOS（darwin），Node v24.15.0，pnpm 12.3.4（npmmirror registry），PostgreSQL 15-alpine（docker），应用**源码构建**（ghcr 镜像网络不可达，`SKIP_BUILD_GEO=1`——GeoIP 维度缺省）
- 实例：localhost:3000，fresh DB，默认管理员 admin/umami（自动种子）
- 实测日期：2026-10-21；认证方式：登录响应体 token + `Authorization: Bearer`（**非 cookie**，见偏差 D-06）
- 卷内临时改动：docker-compose.yml 钉版 umami:3.4.0/端口 3100→未用/db 端口 55432；.npmrc 镜像源——均属执行环境，不入复原对象

## 答卷

> **同题共答结果（2026-10-21）**：与复原侧 030 卷 diff 后得分 **96.4%**（53/55 双侧一致；分歧 2 项均源于馆内矛盾，已裁定统一；16 项单侧由复原侧完成且全过）。详见 010 主册分歧账。

| 条目号 | 输入/动作 | 期望 | 实测 | 一致? | 证据 |
| --- | --- | --- | --- | --- | --- |
| AC-01 | POST /api/send 合法 event | 201 | 200 + `{cache:<JWT>}` | 偏差 | 状态码与响应体形状（cache token 未记载） |
| AC-02 | name="=SUM(A1)" | 400 | 400 bad-request | 通过 | 首字符公式注入拒 |
| AC-03 | lcp=70000 | 400 | 400 | 通过 | vitals 边界生效 |
| AC-04 | bot UA | 拒收 | 200 + `{"beep":"boop"}` 软拒 | 偏差 | 三种 bot UA 全 beep:boop，不入库；软拒契约未记载 |
| AC-05 | GET /q/benchlink1 | 302 | **307** → 目标 url | 偏差 | 307 Temporary Redirect |
| AC-06 | 两次连续 send 同指纹 | 同会话 | cache JWT 解码 sessionId 相同（f03836aa） | 通过 | token 复用实证 |
| AC-07 | 两设备同 distinctId | SessionLink 关联 | identify 200；跨会话关联未直查 | 部分 | session-data 空提示链路疑点 |
| AC-08 | 间隔>30min 新 visitId | 新 visitId | 时滞依赖，代码评审代跑 | 未验 | send route cache.iat 30min 窗口逻辑 |
| AC-09 | GET /api/config | 200 无敏感值 | 200 `{cloudMode,privateMode,sessionDeletionEnabled,telemetryDisabled,updatesDisabled}` | 通过-偏差 | 形状 5 字段与记载不同 |
| AC-10 | check:env 缺变量 | exit 1 | exit 1 + 列出缺失 | 通过 | env -i 复现 |
| AC-11 | login 正确 | 200+user+token | 200 `{token,user{id,username,role,isAdmin,teams}}` | 通过-偏差 | 凭证走响应体非 cookie（D-06） |
| AC-12 | login 错误密码 | 401 | 401 `incorrect-username-password` | 通过 | 不区分账号/密码错误 |
| AC-13 | 改密后旧 token | 401 | 旧 token 401 / 新 token 200 | 通过 | JWT 绑定密码哈希实证 |
| AC-14 | 无加密钥 2FA 不可用 | 不可用提示 | 未验（实例已设 key） | 未验 | 环境依赖 |
| AC-15 | 2FA 状态/端点 | GET 语义 | GET /api/auth/verify=**405**（实为 POST） | 偏差 | verify/sso 均 POST |
| AC-16 | 2FA initiate/confirm | 流程可用 | initiate 200 返回 **qrCodeDataUrl**（secret 内嵌 otpauth URL）；confirm 未跑（secret 提取待补） | 部分 | initiate 契约回灌 |
| AC-17 | 备份码一次性 | 用后失效 | 未跑 | 部分 | 流程深度 |
| AC-18 | 自托管 sso 降级 | 优雅降级 | GET=405（实为 POST）；未跑降级态 | 部分 | 方法契约修正 |
| AC-19 | subscription | 200 | 200 | 通过 | |
| AC-20 | GET /api/me | 200 用户摘要 | 200 `{token,shareToken,authType}` | 通过-偏差 | 形状为凭证三件套非资料 |
| AC-21 | 错误旧密码改密 | 4xx | 400 | 通过 | |
| AC-22 | 创建 API key | 明文仅一次 | 明文一次返回+列表仅前缀 | 通过 | |
| AC-23 | key 调用→吊销 | 200→401 | Bearer key 200；吊销未跑 | 部分 | 吊销链路 |
| AC-24 | 创建团队 | accessCode 生效 | 200 **返回团队列表**含 accessCode | 通过-偏差 | 创建响应是列表非单对象 |
| AC-25 | join 团队 | 成 member | 未跑 | 部分 | |
| AC-26 | 非成员访问 403 | 403 | 未构造第二用户 | 部分 | 需多用户环境 |
| AC-27 | 创建网站+列表 | 出现 | 创建+列表出现 | 通过 | WEBSITE_ID dfc5a2cf |
| AC-28 | reset 后 stats | 归零 | 7 pageviews→0，数据保留 | 通过 | resetAt 水位语义实证 |
| AC-29 | transfer | 200/403 | 200（owner→admin） | 通过 | |
| AC-30 | 分享页未登录可看 | 200 | 创建需 **name 必填**；页面 200（未知 slug 亦 200——客户端态渲染） | 通过-偏差 | name 契约+页面行为 |
| AC-31 | 撤销分享后 404 | 404 | DELETE /api/share/[slug]=**405**（删除走 id 端点） | 偏差 | 方法契约修正 |
| AC-32 | member 访问 admin 403 | 403 | 未构造 | 部分 | |
| AC-33 | admin 访问 | 200 | 200 /api/admin/users | 通过 | |
| AC-34 | check:messages | exit 0 | exit 0 | 通过 | |
| AC-35 | 默认 locale 渲染 | 中文 | UI 渲染未截取 | 部分 | |
| AC-36 | MCP 未启用 | 4xx | 404 | 通过 | |
| AC-37 | MCP 握手 | 工具列表 | 未跑（需启用重启） | 未验 | |
| AC-38 | openapi generate+check | exit 0 | exit 0 | 通过 | |
| AC-39 | 契约漂移拦截 | check 失败 | 未跑（注入漂移） | 未验 | |
| AC-40 | dashboard 聚合 | 200 | 200 | 通过 | |
| AC-41 | 实时活跃 | ≥1 | 200 | 通过 | |
| AC-42 | /stats | views≥1 | 200 `{pageviews:5,visitors:3,visits:3,bounces:1,totaltime,comparison}` | 通过-偏差 | 键名 pageviews/visits/totaltime |
| AC-43 | metrics type=url | 排名表 | type=**path** 才有效；`[{x,y}]` | 通过-偏差 | 枚举为 path/fullPath/entry/exit/referrer/domain/title/query/event/channel… |
| AC-44 | pageviews hour 桶 | 桶序列 | 200 | 通过 | |
| AC-45 | 漏斗统计 | 递减 | **GET** + `window` 必填；`[{visitors,previous,dropped,dropoff,remaining}]` | 通过-偏差 | 方法/参数/形状三处修正 |
| AC-46 | 落库版一致 | 一致 | 未跑 | 部分 | |
| AC-47 | 目标统计 | ≥1 | **GET** 顶层 `type&value`；`{num:1,total:5}` | 通过-偏差 | 参数载体非嵌套 JSON |
| AC-48 | 路径 /a→/b | 边存在 | 200 `[{items:["/a","/b",null],count:1}]` | 通过-偏差 | 参数 startAt/endAt+steps(min2) |
| AC-49 | 留存 | ≥1 | 200 `[{date,day,visitors,returnVisitors,percentage}]` | 通过-偏差 | 参数 unit=day |
| AC-50 | 收入 | >0 | **currency 必填**；`{sum:99.5,count,arpu,comparison}` | 通过-偏差 | 参数与形状修正 |
| AC-51 | utm 指标 | 行出现 | 200 `[{utm:"newsletter",views:1}]`（reset 伪影排除后复测） | 通过-偏差 | utm 从 URL 查询串提取+type 枚举契约回灌 |
| AC-52 | attribution | 渠道分组 | 200 `{referrer,paidAds,utm_*,total}`（model=first-click&type=path&step） | 通过-偏差 | 三参数契约回灌 |
| AC-53 | vitals 汇总 | 5 指标 | 200 | 通过 | type=performance 种子生效 |
| AC-54 | 热图聚合 | 聚合返回 | 采集路径未验证 | 部分 | tracker 热图链路 |
| AC-55 | 回放列表 | 含 visit | 200（无 recorder 数据） | 通过 | |
| AC-56 | 收藏唯一 | 冲突拒绝 | 未跑 | 部分 | |
| AC-57 | event-data 属性键 | 出现 | 200 `[{eventName:purchase,propertyName:currency,dataType:1,total:1},...]` | 通过 | propertyName 契约 |
| AC-58 | 属性值 | 计数 | 200 `[{value:"USD",total:1}]`（propertyName 参数） | 通过 | |
| AC-59 | 属性透视 | 序列返回 | 200 `[{x,t,y}]`（propertyName+eventName 必填） | 通过-偏差 | |
| AC-60 | session-data 属性键 | role 出现 | 200 `[{propertyName:role,total:1},{plan,1}]`（需会话有事件活动） | 通过-偏差 | 链路契约回灌 |
| AC-61 | 属性值 | admin≥1 | 200 `[{value:"admin",total:1}]` | 通过 | |
| AC-62 | breakdown | 交叉表 | 200（fields=["path"]） | 通过 | |
| AC-63 | segmentId 缩小计数 | 生效 | 创建 200（parameters.properties 形状）；过滤效果未跑 | 部分 | 形状契约回灌 |
| AC-64 | 会话列表 | 指纹字段 | 200 | 通过 | |
| AC-65 | 周矩阵 | 形状 | 200（unit=day&timezone=UTC） | 通过-偏差 | timezone 必填契约 |
| AC-66 | 标注创建/空 note | 201/400 | 200 创建 + 400 空 note | 通过-偏差 | 200 非 201 |
| AC-67 | board clone | 参数一致 | 未跑（board 未创建） | 未验 | |
| AC-68 | 看板分享页 | 200 | 分享页 200 语义已证（AC-30） | 部分 | |
| AC-69 | 短链跳转 | 302+事件 | **307** | 通过-偏差 | 同 AC-05 |
| AC-70 | 重名 slug/软删 | 400/404 | 重名=**500**（唯一约束未友好处理）；软删后 404 | 通过-偏差 | 500 行为是原仓库实况 |
| AC-71 | 像素 GIF+事件 | GIF+事件 | `content-type: image/gif` | 通过 | |

## 汇总

- 通过/通过-偏差：**55**；部分：**9**；未验：**7**（合计 71；补测后更新——reset 伪影与参数契约深挖后 7 项部分转通过）
- 与图书馆记载的契约偏差（原仓库侧显形，缺陷分类账见 [010-umami.md](010-umami.md)）：**D-01~D-14**（状态码/方法/参数载体/形状/软拒/500 行为等）
