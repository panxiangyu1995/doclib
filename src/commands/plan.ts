import fs from "node:fs/promises";
import path from "node:path";
import { collectFiles, renderTree } from "../core/fsutil.js";
import { detectProject } from "../core/detect.js";
import { DoclibError, LIBRARY_DIR, STATE_DIR, TASKS_DIR, latestSnapshot, loadState, pad3 } from "../core/state.js";
import { analyzeDrift } from "./diff.js";
import { loadPlanningPaths, planningIgnores, planningReminderReport } from "../core/planning.js";
import { libraryRootOf } from "./snapshot.js";
import type { CommandResult } from "./init.js";

function langSummary(languages: Record<string, number>): string {
  const entries = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  return entries.length > 0 ? entries.map(([k, v]) => `${k} ${v}`).join(", ") : "无";
}

async function writeTask(root: string, name: string, content: string): Promise<string> {
  const dir = path.join(root, TASKS_DIR);
  await fs.mkdir(dir, { recursive: true });
  const abs = path.join(dir, name);
  await fs.writeFile(abs, content, "utf8");
  return abs;
}

async function buildTask(root: string): Promise<{ name: string; content: string }> {
  const state = await loadState(root);
  const number = pad3(state.version + 1);
  const files = await collectFiles(root, planningIgnores(loadPlanningPaths(state)));
  const det = await detectProject(root, files);
  const tree = renderTree(files, 2);
  const baselineDesc = state.version === 0 ? "尚未建立基线" : `已有基线，本任务书用于重建/补全`;
  const content = `# BUILD-${number} · 文档图书馆构建任务书

生成时间: ${new Date().toISOString()}
执行者: 携带 doclib-build skill 的 agent（人执行则按 skills/doclib-build/SKILL.md 手册操作）

## 前置

1. 加载 skill: doclib-build
2. 图书馆骨架已就绪: ${LIBRARY_DIR}/（结构与写作要点见 ${LIBRARY_DIR}/README.md）
3. 本任务书基于代码状态 version ${state.version}（${baselineDesc}）
4. 当前 revision: ${state.revision}（入馆写前记录此值；写后 doclib check 比对，revision 已变即重新对账）

## 项目清单（CLI 自动采集）

- 项目名: ${det.name ?? "未检测到"}
- 主语言: ${det.primary}
- 框架: ${det.frameworks.length > 0 ? det.frameworks.join(", ") : "未检测到"}
- 规模: ${files.length} 个文件
- 语言分布: ${langSummary(det.languages)}
- 入口线索: ${det.entryHints.length > 0 ? det.entryHints.join("; ") : "无"}

## 顶层结构

\`\`\`
${tree}
\`\`\`

## 执行要求

按 doclib-build skill 的方法论与覆盖度清单完成图书馆全部章节。

铁律: 文档只写行为、契约、设计意图与验收标准；除 ≤10 行示意片段外禁止搬运源码。

## 收尾

1. doclib verify
2. doclib snapshot --note "initial build"
3. doclib status 检查引导版本；提示过期时运行 doclib sync
`;
  return { name: `BUILD-${number}.md`, content };
}

async function updateTask(root: string): Promise<{ name: string | null; content: string }> {
  const an = await analyzeDrift(root);
  const total = an.drift.added.length + an.drift.modified.length + an.drift.removed.length;
  if (total === 0) return { name: null, content: "" };
  const state = await loadState(root);
  const number = pad3(an.snapshotVersion + 1);
  const line = (r: { path: string; change: string; docs: string[] }): string =>
    `- ${r.path}  →  ${r.docs.length > 0 ? r.docs.join(", ") : r.change === "removed" ? "(无关联文档)" : "(无覆盖 → 新建文档或并入既有文档)"}`;
  const section = (title: string, items: { path: string; change: string; docs: string[] }[]): string =>
    items.length === 0 ? "" : `### ${title} (${items.length})\n\n${items.map(line).join("\n")}\n`;
  const removedRows = an.rows.filter((r) => r.change === "removed");
  const content = `# UPDATE-${number} · 增量更新任务书

基线: ${an.snapshotId} (version ${an.snapshotVersion})
revision: ${state.revision}（入馆写前记录此值；写后 doclib check 比对，revision 已变即重新对账）
生成时间: ${new Date().toISOString()}
执行者: 携带 doclib-update skill 的 agent

## 代码变更（相对基线）

${section("新增 — 需建立或并入文档", an.rows.filter((r) => r.change === "added"))}
${section("修改 — 更新受影响文档", an.rows.filter((r) => r.change === "modified"))}
${section("删除 — retire 候选", removedRows)}
## 执行原则

见 doclib-update skill: 最小扰动 / covers 同步 / INDEX 与 feature-map 联动 / 结构稳定。

## 收尾

1. doclib verify
2. doclib snapshot --note "update to version ${an.snapshotVersion + 1}"
3. doclib status 检查引导版本；提示过期时运行 doclib sync
`;
  return { name: `UPDATE-${number}.md`, content };
}

async function rebuildTask(root: string, to?: string): Promise<{ name: string; content: string }> {
  const state = await loadState(root);
  const libRoot = libraryRootOf(root);
  try {
    await fs.access(libRoot);
  } catch {
    throw new DoclibError(`图书馆 ${LIBRARY_DIR}/ 不存在：先 doclib init 并完成构建`);
  }
  const existing = await fs.readdir(path.join(root, TASKS_DIR)).catch(() => [] as string[]);
  const number = pad3(existing.filter((f) => f.startsWith("REBUILD-")).length + 1);
  const target = to ?? path.join("..", `${path.basename(root)}-rebuild`);
  const content = `# REBUILD-${number} · 从零复原任务书

图书馆: ${LIBRARY_DIR}/ (version ${state.version})
目标目录: ${target}
生成时间: ${new Date().toISOString()}
执行者: 携带 doclib-rebuild skill 的 agent

## 硬约束

1. 只允许读取 ${LIBRARY_DIR}/；禁止访问源项目目录、源码与 git 历史
2. 目标目录须为空目录（由执行者创建），全部代码从零新写

## 执行

1. 依序阅读 ${LIBRARY_DIR}/README.md → INDEX.md → 40-guides/rebuild-plan.md
2. 在目标目录生成 REBUILD-LOG.md: 阶段计划、每阶段验收记录、决策与差异清单
3. 按 30-features/ 的验收标准逐项自检

## 完成标准

- 00-overview/feature-map.md 中全部功能均有实现且验收通过
- REBUILD-LOG.md 含差异清单（文档未覆盖而自行决策、或被迫偏离文档的部分）

## 收尾

- doclib status 检查引导版本；提示过期时运行 doclib sync
`;
  return { name: `REBUILD-${number}.md`, content };
}

async function bootstrapTask(root: string): Promise<{ name: string; content: string }> {
  const state = await loadState(root);
  const existing = await fs.readdir(path.join(root, TASKS_DIR)).catch(() => [] as string[]);
  const number = pad3(existing.filter((f) => f.startsWith("BOOTSTRAP-")).length + 1);
  const content = `# BOOTSTRAP-${number} · 新项目对话式建馆任务书

规划载体: ${loadPlanningPaths(state).join(", ")}
revision: ${state.revision}（入馆写前记录此值；写后 doclib check 比对，revision 已变即重新对账）
生成时间: ${new Date().toISOString()}
执行者: 携带 doclib-bootstrap skill 的 agent

## 硬约束

1. 文档先行：图书馆是开发的输入——先填馆，后写代码；每功能以 30-features 验收标准（Given/When/Then）为准
2. 需求不靠用户预写文档：通过对话式挖掘获得

## 执行

1. 对话挖掘（与用户逐项确认）：项目定位与目标用户、核心功能清单、边界与非目标、关键数据流、技术选型与理由
2. 填馆顺序：00-overview（定位/术语/feature-map 全量 planned）→ 10-architecture（数据模型/数据流/依赖决策）→ 30-features（每功能规格+验收标准）→ 40-guides → INDEX
3. 挖掘结论实时入馆（实时同步原则），过程材料留在规划载体
4. 文档先行开发循环：选功能 → 按规格写代码 → 按 30-features 验收标准逐条自检 → feature-map 推 implemented

## 收尾

1. doclib verify
2. doclib snapshot --note "bootstrap: initial spec"
3. doclib status 检查引导版本；提示过期时运行 doclib sync
`;
  return { name: `BOOTSTRAP-${number}.md`, content };
}

async function resumeTask(root: string): Promise<{ name: string; content: string }> {
  const state = await loadState(root);
  const files = await collectFiles(root, planningIgnores(loadPlanningPaths(state)));
  const det = await detectProject(root, files);
  const tree = renderTree(files, 2);
  const existing = await fs.readdir(path.join(root, TASKS_DIR)).catch(() => [] as string[]);
  const number = pad3(existing.filter((f) => f.startsWith("RESUME-")).length + 1);
  const content = `# RESUME-${number} · 半成品接手任务书

规划载体: ${loadPlanningPaths(state).join(", ")}
revision: ${state.revision}（入馆写前记录此值；写后 doclib check 比对，revision 已变即重新对账）
生成时间: ${new Date().toISOString()}
执行者: 携带 doclib-resume skill 的 agent

## 项目清单（CLI 自动采集）

- 项目名: ${det.name ?? "未检测到"}
- 主语言: ${det.primary}
- 框架: ${det.frameworks.length > 0 ? det.frameworks.join(", ") : "未检测到"}
- 规模: ${files.length} 个文件

## 顶层结构

\`\`\`
${tree}
\`\`\`

## 执行

1. 既有代码蒸馏：按 doclib-resume skill 方法论梳理已实现功能 → feature-map 登记 implemented（covers 指向真实代码）
2. 未来规划：由用户提供为主（对话确认），agent 分析后可给建议供筛选 → feature-map 登记 planned
3. 架构/模块/配置等知识卷按 doclib-build 方法论补全
4. 馆就绪后转 doclib-dev 日常开发循环

## 收尾

1. doclib verify
2. doclib snapshot --note "resume: baseline established"
3. doclib status 检查引导版本；提示过期时运行 doclib sync
`;
  return { name: `RESUME-${number}.md`, content };
}

export async function runPlan(
  root: string,
  opts: { rebuild?: boolean; to?: string; bootstrap?: boolean; resume?: boolean },
): Promise<CommandResult> {
  const modes = [opts.rebuild, opts.bootstrap, opts.resume].filter(Boolean).length;
  if (modes > 1) throw new DoclibError("--rebuild / --bootstrap / --resume 互斥，一次只能生成一种任务书");
  if (opts.rebuild) {
    const t = await rebuildTask(root, opts.to);
    await writeTask(root, t.name, t.content);
    const text = [`已生成复原任务书: ${t.name}`, `位置: ${path.join(root, TASKS_DIR, t.name)}`, "", "下一步: 让 agent 加载 doclib-rebuild skill 并执行该任务书。", ""].join("\n");
    return { text, json: { task: t.name } };
  }
  if (opts.bootstrap) {
    const t = await bootstrapTask(root);
    await writeTask(root, t.name, t.content);
    const text = [`已生成任务书: ${t.name}`, `位置: ${path.join(root, TASKS_DIR, t.name)}`, "", "下一步: 让 agent 加载 doclib-bootstrap skill 并执行该任务书（对话式挖掘 → 文档先行）。", ""].join("\n");
    return { text, json: { task: t.name } };
  }
  if (opts.resume) {
    const t = await resumeTask(root);
    await writeTask(root, t.name, t.content);
    const text = [`已生成任务书: ${t.name}`, `位置: ${path.join(root, TASKS_DIR, t.name)}`, "", "下一步: 让 agent 加载 doclib-resume skill 并执行该任务书（蒸馏 implemented + 登记规划）。", ""].join("\n");
    return { text, json: { task: t.name } };
  }
  const state = await loadState(root);
  const hasBaseline = latestSnapshot(state) !== null;
  const reminder = await planningReminderReport(root, state, latestSnapshot(state));
  const t = hasBaseline ? await updateTask(root) : await buildTask(root);
  if (t.name === null) {
    const none = ["无漂移：图书馆与代码已同步，无需生成更新任务书。", reminder.length > 0 ? "" : null, reminder].filter((x): x is string => x !== null).join("\n");
    return { text: `${none}\n`, json: { task: null } };
  }
  await writeTask(root, t.name, t.content);
  const kind = hasBaseline ? "UPDATE" : "BUILD";
  const skill = kind === "BUILD" ? "doclib-build" : "doclib-update";
  const text = [
    `已生成任务书: ${t.name}`,
    `位置: ${path.join(root, TASKS_DIR, t.name)}`,
    "",
    reminder.length > 0 ? `${reminder}\n` : "",
    `下一步: 让 agent 加载 ${skill} skill 并执行该任务书。`,
    "",
  ].join("\n");
  return { text, json: { task: t.name } };
}
