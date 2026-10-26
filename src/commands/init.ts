import fs from "node:fs/promises";
import path from "node:path";
import { collectFiles } from "../core/fsutil.js";
import { assetsRoot, copyDir, renderTemplate } from "../core/assets.js";
import { resolveAgents } from "../core/agents.js";
import { isInteractive, askAgents, askGuide, askPlanning, askGraph } from "../core/prompts.js";
import { writeGuides } from "../core/guides.js";
import { STRUCTURE_VERSION } from "../core/version.js";
import { DoclibError, DEFAULT_PLANNING, LIBRARY_DIR, TASKS_DIR, loadState, saveState } from "../core/state.js";
import { graphIndexPresent, isNodeCompatible, loadVendorEngine, renderProgress } from "../core/codegraph/engine.js";

export type CommandResult = { text: string; json?: unknown };

export async function runInit(
  root: string,
  opts: { force?: boolean; agents?: string; guide?: "light" | "none"; planning?: string; graph?: boolean },
): Promise<CommandResult> {
  if (opts.guide !== undefined && opts.guide !== "light" && opts.guide !== "none") {
    throw new DoclibError("--guide 仅支持 light | none");
  }
  const libRoot = path.join(root, LIBRARY_DIR);
  try {
    await fs.access(libRoot);
    if (!opts.force) {
      throw new DoclibError(`${LIBRARY_DIR}/ 已存在；如需补齐/刷新模板文件请加 --force（你的已有内容不会被覆盖，同名模板文件除外）`);
    }
  } catch (e) {
    if (e instanceof DoclibError) throw e;
  }

  const templatesRel = await collectFiles(path.join(assetsRoot(), "templates", "library"));
  for (const rel of templatesRel) {
    const content = await renderTemplate(path.join("templates", "library", rel), {});
    const abs = path.join(libRoot, rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content, "utf8");
  }

  await fs.mkdir(path.join(root, TASKS_DIR), { recursive: true });

  let agentSpec = opts.agents;
  let guide = opts.guide;
  let planningSpec = opts.planning;
  let wantGraph = opts.graph === true;
  if (!agentSpec && isInteractive()) agentSpec = (await askAgents()).join(",");
  if (!guide && isInteractive()) guide = await askGuide();
  if (!planningSpec && isInteractive()) planningSpec = await askPlanning();
  if (opts.graph === undefined && isInteractive()) wantGraph = await askGraph();
  const targets = resolveAgents(agentSpec);

  const skillsInstalled: string[] = [];
  for (const t of targets) {
    if (t.skillsDir === null) continue;
    await copyDir(path.join(assetsRoot(), "skills"), path.join(root, t.skillsDir));
    skillsInstalled.push(t.skillsDir);
  }

  let guides = { written: [] as string[], skipped: [] as string[] };
  if (guide !== "none") guides = await writeGuides(root, "light", targets);

  const state = await loadState(root);
  state.agents = targets.map((t) => t.id);
  state.structureVersion = STRUCTURE_VERSION;
  state.planning = planningSpec
    ? planningSpec.split(",").map((p) => p.trim()).filter((p) => p.length > 0).map((p) => (p.endsWith("/") ? p : `${p}/`))
    : [...DEFAULT_PLANNING];
  await saveState(root, state);

  let graphLine: string;
  if (!wantGraph) {
    graphLine = "- 知识图谱: 未启用（doclib graph index 可随时启用）";
  } else if (!isNodeCompatible(process.versions.node)) {
    graphLine = `- 知识图谱: 未启用（需 Node >= 22.5，当前 ${process.versions.node}）——doclib 核心流程不受影响，升级后 doclib graph index 补建`;
  } else {
    const engine = loadVendorEngine();
    try {
      if (await graphIndexPresent(root)) {
        const cg = await engine.CodeGraph.open(root, { sync: true });
        try {
          const stats = cg.getStats();
          graphLine = `- 知识图谱: .codegraph/（已有索引，已增量同步：${stats.fileCount} 文件/${stats.nodeCount} 符号）`;
        } finally {
          cg.close();
        }
      } else {
        const cg = await engine.CodeGraph.init(root, {});
        try {
          const result = await cg.indexAll({ onProgress: renderProgress });
          graphLine = `- 知识图谱: .codegraph/（${result.filesIndexed} 文件/${result.nodesCreated} 符号/${result.edgesCreated} 边，${(result.durationMs / 1000).toFixed(1)}s）`;
        } finally {
          cg.close();
        }
      }
    } catch (e) {
      graphLine = `- 知识图谱: 初始化失败（${e instanceof Error ? e.message : String(e)}）——doclib graph index 可重试，doclib 核心流程不受影响`;
    }
  }

  const lines = [
    `已初始化 DocLib (structure v${STRUCTURE_VERSION}):`,
    `- 图书馆模板: ${LIBRARY_DIR}/ (${templatesRel.length} 个文件)`,
    `- agents: ${targets.map((t) => t.id).join(", ")}`,
    `- skills 落位: ${skillsInstalled.length > 0 ? skillsInstalled.join(", ") : "无"}`,
    `- 规划载体: ${state.planning.join(", ")}`,
    `- 引导文件: ${guides.written.length > 0 ? `写入 ${guides.written.join(", ")}` : "未写入"}${guides.skipped.length > 0 ? `（跳过已有无戳文件: ${guides.skipped.join(", ")}，合并请交由 agent 处理）` : ""}`,
    "- 簿记: .doclib/",
    graphLine,
    "",
    "下一步:",
    "1. doclib plan                 # 生成 BUILD 构建任务书（含项目清单）",
    wantGraph ? "   （图谱已建：plan 将提示 doclib graph draft 产出登记簿候选草稿）" : "   （可选：doclib graph index 建图后，plan 会提示草稿候选）",
    "2. 让 agent 加载 doclib-build skill，按任务书构建图书馆",
    "3. doclib verify && doclib snapshot --note \"initial build\"",
    "",
  ];
  return {
    text: lines.join("\n"),
    json: { templates: templatesRel.length, agents: targets.map((t) => t.id), guides, graph: graphLine },
  };
}
