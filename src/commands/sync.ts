import path from "node:path";
import { assetsRoot, copyDir } from "../core/assets.js";
import { resolveAgents } from "../core/agents.js";
import { writeGuides } from "../core/guides.js";
import { DoclibError, loadState, saveState } from "../core/state.js";
import { readHookState, resolveHooksDir, runHook } from "./hook.js";
import type { CommandResult } from "./init.js";

export async function runSync(root: string, opts: { agents?: string }): Promise<CommandResult> {
  const state = await loadState(root);
  let spec = opts.agents;
  if (!spec && state.agents.length > 0) spec = state.agents.join(",");
  if (!spec) {
    throw new DoclibError("尚无已安装的 agent：先 doclib init --agents <列表>，或本次用 --agents 指定");
  }
  const targets = resolveAgents(spec);

  const skillsDirs: string[] = [];
  for (const t of targets) {
    if (t.skillsDir === null) continue;
    await copyDir(path.join(assetsRoot(), "skills"), path.join(root, t.skillsDir));
    skillsDirs.push(t.skillsDir);
  }

  const guides = await writeGuides(root, "light", targets);

  state.agents = targets.map((t) => t.id);
  await saveState(root, state);

  let hookLine: string | null = null;
  try {
    if ((await resolveHooksDir(root)) !== null) {
      const st = await readHookState(root);
      if (st === "none") {
        await runHook(root, { strict: true });
        hookLine = "已补装(--strict)";
      } else if (st === "foreign") {
        hookLine = "跳过（非 doclib 管理钩子，不覆盖）";
      } else {
        hookLine = `在岗(${st === "doclib-strict" ? "--strict" : "普通档"})`;
      }
    }
  } catch (e) {
    hookLine = `跳过（${e instanceof Error ? e.message : String(e)}）`;
  }

  const lines = [
    "同步完成:",
    `- skills: ${skillsDirs.length > 0 ? skillsDirs.join(", ") : "无（目标无 skills 目录）"}`,
    `- 引导: 写入 ${guides.written.length > 0 ? guides.written.join(", ") : "无"}｜无变化 ${guides.unchanged.length > 0 ? guides.unchanged.join(", ") : "无"}`,
  ];
  if (hookLine !== null) {
    lines.push(`- 门禁: ${hookLine}`);
  }
  if (guides.legacy.length > 0) {
    lines.push(`- 旧版引导已整体再生: ${guides.legacy.join(", ")}（原文件无区域标记，如有手工补充请检查 git diff）`);
  }
  if (guides.skipped.length > 0) {
    lines.push(`- 跳过无戳文件: ${guides.skipped.join(", ")}（非 doclib 管理，合并交由 agent）`);
  }
  lines.push("");
  return { text: lines.join("\n"), json: { guides, skills: skillsDirs, hook: hookLine } };
}
