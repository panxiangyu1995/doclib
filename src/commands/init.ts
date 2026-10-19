import fs from "node:fs/promises";
import path from "node:path";
import { collectFiles } from "../core/fsutil.js";
import { assetsRoot, copyDir, renderTemplate } from "../core/assets.js";
import { resolveAgents } from "../core/agents.js";
import { isInteractive, askAgents, askGuide } from "../core/prompts.js";
import { writeGuides } from "../core/guides.js";
import { STRUCTURE_VERSION } from "../core/version.js";
import { DoclibError, LIBRARY_DIR, TASKS_DIR, loadState, saveState } from "../core/state.js";

export type CommandResult = { text: string; json?: unknown };

export async function runInit(
  root: string,
  opts: { force?: boolean; agents?: string; guide?: "light" | "none" },
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
  if (!agentSpec && isInteractive()) agentSpec = (await askAgents()).join(",");
  if (!guide && isInteractive()) guide = await askGuide();
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
  await saveState(root, state);

  const lines = [
    `已初始化 DocLib (structure v${STRUCTURE_VERSION}):`,
    `- 图书馆模板: ${LIBRARY_DIR}/ (${templatesRel.length} 个文件)`,
    `- agents: ${targets.map((t) => t.id).join(", ")}`,
    `- skills 落位: ${skillsInstalled.length > 0 ? skillsInstalled.join(", ") : "无"}`,
    `- 引导文件: ${guides.written.length > 0 ? `写入 ${guides.written.join(", ")}` : "未写入"}${guides.skipped.length > 0 ? `（跳过已有无戳文件: ${guides.skipped.join(", ")}，合并请交由 agent 处理）` : ""}`,
    "- 簿记: .doclib/",
    "",
    "下一步:",
    "1. doclib plan                 # 生成 BUILD 构建任务书（含项目清单）",
    "2. 让 agent 加载 doclib-build skill，按任务书构建图书馆",
    "3. doclib verify && doclib snapshot --note \"initial build\"",
    "",
  ];
  return {
    text: lines.join("\n"),
    json: { templates: templatesRel.length, agents: targets.map((t) => t.id), guides },
  };
}
