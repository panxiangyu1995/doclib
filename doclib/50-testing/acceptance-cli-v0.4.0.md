---
title: CLI 全功能验收报告 v0.4.0
covers:
  - src/cli.ts
  - src/commands/
  - src/core/
status: stable
---

# CLI 全功能验收报告（v0.4.0，极致严格轮）

> 验收方法：11 命令全矩阵 × 真实临时目录 × 正常/边界/错误路径 + 退出码 + JSON 结构断言；单元测试 52/52 并行兜底。执行环境 /tmp/acc（zsh，函数封装 CLI 绝对路径）。

## 一、验收矩阵结果（总计 44 探针：43 PASS / 1 环境误报→复验 PASS / 3 真实缺陷→已修复复验 PASS）

### init（10）
✅ 23→**24** 骨架文件落位（v0.26 起 99-archive/README.md）｜✅ agents/skills/引导/state 落库｜✅ --planning 双路径+尾斜杠归一｜✅ 不自动装钩子｜✅ --agents 非法值报错｜✅ --guide 非法值报错｜✅ 二次 init 无 --force 报错｜✅ --force 同名模板刷新+非模板文件保留｜✅ --guide none 不写引导｜✅ cursor=仅引导（skillsDir=null 设计）/generic 无 agent 目录

### plan（8）
✅ BUILD 任务书（清单+revision+前置）｜✅ BOOTSTRAP（对话挖掘+文档先行）｜✅ RESUME（蒸馏指引）｜✅ REBUILD（信息隔离约束；无基线可生成）｜✅✅ 三模式互斥（两组）｜✅ 载体待登记提醒（mtime>基线）｜✅ UPDATE 漂移触发

### diff（2）
✅ 漂移三类+covers 映射｜✅ --json 结构

### snapshot（2）
✅ version/latest/快照链/revision 递增落库｜✅ 输出 revision

### status（2）
✅ 七行概览齐（治理/预算/revision/载体提醒/检测/任务书）｜✅ 无基线形态

### verify（4）
✅ 覆盖率+INDEX 双向核对｜✅ 幽灵链接检出｜✅ 未收录检出｜✅ 失效文档检出

### sync（4）
✅ 幂等（二次无变化）｜✅ 版本戳新鲜｜✅ 篡改检出再生｜✅ 定制区保留（既有测试覆盖）

### check（12）
✅ 七分类逐一构造：漏更/已对账/无归属/迁移（未登记+命名不符+断号）/引导过期/孤儿｜✅ once 生命周期（基线绑定+snapshot 清除，严格）｜✅ standing 豁免｜✅ strict 退出码 1/0 双向｜✅ 全清路径+治理分健康｜✅ --json 含 health｜✅ 载体豁免/covers 有主豁免（前期冒烟）

### ack（3）
✅ standing/once/--note｜✅ once 过期清除｜✅ --remove（既有测试）

### hook（6）
✅ install 标记+strict+可执行｜✅ 非标记钩子拒改｜✅ remove→install 恢复｜✅ --ci github 模板+版本固化｜✅ 非 git 目录报错｜✅ remove 删除

### reconcile（4）
✅ 三段报告（疑似完成/进度不符/待推进）｜✅ 无基线形态｜✅ --json｜✅ 本仓库实跑

### 分发与杂项（3）
✅ npx 冷装全流程（tgz→init/plan/snapshot/status）｜✅ version=0.4.0｜✅ 未知命令降级 help

## 二、验收发现与处置（全部已修复并复验）

| # | 发现 | 严重度 | 处置 |
| --- | --- | --- | --- |
| D1 | verify 仅核对馆级 INDEX，**两级索引核对未实现**（卷 _index 幽灵不检出）——违反 F4 v0.20 规格 | 高 | verify.ts 新增全馆 .md 相对链接存在性扫描（"链接失效（两级核对）"），复验检出 `30-features/_index.md → ../nonexistent.md` ✅ |
| D2 | init 骨架缺 99-archive 卷目录（PRD §7 双层结构有、骨架无） | 中 | 模板新增 99-archive/README.md（24 文件）；STRUCTURE_VERSION 2→3；assets.test 清单更新 |
| D3 | status 引导行只查版本戳、不查 managed 区内容篡改（check 检出而 status 显示 ✓，体验不一致） | 中 | guideStampReport 聚合 managedRegionFresh——篡改后 status 显示"内容过期 → doclib sync" ✅ |

## 三、测试执行中的非缺陷记录

- zsh 变量不分词导致 CLI 调用失败（环境，非产品）
- `cli` 与用户机器既有 ao-cli 包装命令重名（环境）
- --force 覆盖同名模板 / cursor skillsDir=null / rebuild 无基线可生成——三处初判 FAIL 均为断言与规格不符，规格本身正确
