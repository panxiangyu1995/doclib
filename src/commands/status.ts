import fs from "node:fs/promises";
import path from "node:path";
import { collectFiles, hashAll } from "../core/fsutil.js";
import { detectProject } from "../core/detect.js";
import { LIBRARY_DIR, STATE_DIR, TASKS_DIR, latestSnapshot, loadState, computeDrift } from "../core/state.js";
import { guideStampReport } from "../core/guides.js";
import type { CommandResult } from "./init.js";

export async function runStatus(root: string): Promise<CommandResult> {
  const state = await loadState(root);
  const latest = latestSnapshot(state);
  const lines: string[] = [];

  const libExists = await fs
    .access(path.join(root, LIBRARY_DIR))
    .then(() => true)
    .catch(() => false);
  lines.push(`图书馆: ${libExists ? `${LIBRARY_DIR}/ (version ${state.version})` : `${LIBRARY_DIR}/ 未初始化（运行 doclib init）`}`);
  lines.push(
    `结构版本: ${state.structureVersion}${state.agents.length > 0 ? ` · agents: ${state.agents.join(", ")}` : ""}`,
  );
  lines.push(`引导: ${await guideStampReport(root)}`);
  lines.push(
    latest
      ? `基线: ${latest.id} @ ${latest.at}${latest.note ? `（${latest.note}）` : ""} · 快照链 ${state.snapshots.length} 条`
      : "基线: 无（尚未 snapshot）",
  );

  if (latest) {
    const files = await collectFiles(root);
    const hashes = await hashAll(root, files);
    const drift = computeDrift(latest.files, hashes);
    lines.push(
      `漂移: +${drift.added.length} 新增 / ~${drift.modified.length} 修改 / -${drift.removed.length} 删除（相对 ${latest.id}）`,
    );
  } else {
    lines.push("漂移: -");
  }

  const files0 = await collectFiles(root);
  const det = await detectProject(root, files0);
  lines.push(`检测: 主语言 ${det.primary}${det.frameworks.length > 0 ? ` · 框架 ${det.frameworks.join(", ")}` : ""}`);

  const tasks = await fs.readdir(path.join(root, TASKS_DIR)).catch(() => [] as string[]);
  lines.push(`任务书: ${tasks.length > 0 ? tasks.join(", ") : "无"}`);
  lines.push("");
  return { text: lines.join("\n"), json: { state, detection: det } };
}
