# CLI 旗标面对账（flag-surface）

- 日期：2026-10-23
- 状态：规划完成，随本轮执行
- 关联：PRD F15（扫描器）/F4（面穷举守卫）/F1；ADR #16；feature-map #29
- 来源：csvkit 重建试点审查（RIPER-5 REVIEW）检出 D1-D6 六缺陷——用户裁决：修 skill 与 CLI 防再犯，馆修复为验证副产物

## 缺陷 → 根因 → 方案

| 缺陷 | 根因 | 方案 |
| --- | --- | --- |
| D1/D2 源有馆无（csvstat --max-precision、csvpy --no-number-ellipsis） | 旗标枚举=agent 手动转写无对账；面穷举守卫只对 HTTP/proto 面（CLI repo 0:0 假平衡） | 旗标字面量双向对账 |
| D3/D4 馆有源无（csvjson --geojson、csvsql --truncate——旧馆素材带入未重验） | 无反向对账 | 同上（馆有源无候选） |
| D5 共享面漏项（--no-leading-zeroes） | 跨工具共享旗标族无对账点 | 对账范围为全馆 --token vs covers 源码字面量（覆盖框架文档） |
| D6 同源联动错 | 旗标清单两处重复维护 | skill 补实体 token 单点原则 |

## 方案

- 馆侧：全馆 md 提取 `--token`（长名统一；短名同义不进对账）
- 源侧：covers 锚定代码文件提取引号包裹 `'--token'` 字面量（注册形式强信号）
- 双向 Δ 候选，agent 裁决（三铁律）
- 被否备选：语法树解析（语言绑定，违背 F15 通用性）；语言注册表扫描（每框架一适配器，维护爆炸）

## 验收标准

- AC-FS1 Given 登记簿含源码不存在的旗标 When verify Then 馆有源无候选检出
- AC-FS2 Given 源码注册旗标未入馆 When verify Then 源有馆无候选检出
- AC-FS3 Given 旗标面一致 When verify Then Δ0 且对账平衡
- AC-FS4 Given 短旗标（-d）与正则/注释中的 -- 字符串 When 扫描 Then 不误报
- AC-FS5 Given csvkit 馆 When verify Then 复现 D1-D4 六 token；修复后 Δ 清零
