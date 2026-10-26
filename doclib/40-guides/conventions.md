---
title: 编码约定
covers:
  - tsconfig.json
  - src/
status: stable
---

# 编码约定

> 复原者按此保持工程风格一致。只写影响可维护性的约定，不写无关紧要的偏好。

## 为什么

约定的全部目标是服务架构三原则：纯 Markdown 产物、确定性执法、零重依赖——ESM 与 strict 保证类型安全与原生生态一致，禁注释与 DoclibError 保证代码即文档、错误路径单一。

## 是什么

约定分六类——模块语法、错误面、注释纪律、命名、测试、职责边界；每条都是可机器检查或可评审裁定的硬规则，不留"建议"级软约定：

- 语言与模块：TypeScript ESM；**导入必须带 .js 后缀**（NodeNext 原生解析）；`strict` + `noUncheckedIndexedAccess` 全开（数组访问判空是常态）
- 错误处理：用户可见错误一律抛 `DoclibError`（单一出口、`错误: ` 前缀契约由 e2e 锁定）；core 层不吞错、不静默
- 注释：**源码不写注释**——命名与类型即文档；需要解释的设计进 ADR（10-architecture/decisions.md）
- 命名：文件 kebab-case 语义命名；导出函数动宾结构；常量全大写
- 测试：node:test + assert/strict 零依赖；测试文件与被测模块同目录 `*.test.ts`；命令层测试走 testkit 临时目录
- 职责切分：commands/ 只做参数解析与输出编排（返回 {text, json}）；core/ 纯逻辑零副作用——两者边界不可反向

## 怎么运转

约定不是记忆负担而是护栏：写代码时唯一要记住的是"导入带 .js、错误抛 DoclibError、不写注释"三条；其余由工具链兜底。

约定由三层强制：typecheck（tsc 双工程门禁）→ npm test（249 用例回归）→ 评审（CONTRIBUTING 自查清单）；新增依赖须先过"零重依赖"审视（ADR #13 运行时依赖条款），破坏约定需先立 ADR 再动代码。
