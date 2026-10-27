import fs from "node:fs/promises";
import path from "node:path";
import { DoclibError, loadState } from "../core/state.js";
import { loadPlanningPaths } from "../core/planning.js";
import { listCandidates, readinessVerdict, renderSkeleton } from "../core/implement.js";
import type { CommandResult } from "./init.js";

export async function runImplement(
  root: string,
  opts: { feature?: number; apply?: boolean },
): Promise<CommandResult> {
  const state = await loadState(root);
  const revLine = `revision: ${state.revision}`;
  if (opts.feature === undefined) {
    const candidates = await listCandidates(root);
    const rows =
      candidates.length === 0
        ? ["（无 planned 条目）"]
        : candidates.map(
            (c) =>
              `  #${c.n}  ${c.name}  →  ${
                c.docs.trim() === "" ? "（对应文档为空：readiness 不通过，先补规格）" : c.docs
              }`,
          );
    const text = [
      "planned 候选清单（doclib implement --feature <N> 生成实施骨架）：",
      "",
      ...rows,
      "",
      revLine,
      "",
    ].join("\n");
    return { text, json: { candidates } };
  }
  const rd = await readinessVerdict(root, opts.feature);
  if (!rd.ready || rd.row === null) {
    throw new DoclibError(
      `readiness 不通过（#${opts.feature}）：\n${rd.reasons.map((r) => `  - ${r}`).join("\n")}\n馆内依据齐备才可开工（F17 readiness gate）`,
    );
  }
  const generated = new Date().toISOString().slice(0, 10);
  const sk = renderSkeleton({ featureId: rd.row.n, name: rd.row.name, refs: rd.refs, generated });
  if (opts.apply !== true) {
    const text = [
      `骨架预览（干跑，--apply 落盘）: <规划载体>/<${generated}>/${sk.fileName}`,
      "",
      sk.content,
      "下一步: 确认后加 --apply 落盘，然后让 agent 加载 doclib-implement skill 对话填实。",
      revLine,
      "",
    ].join("\n");
    return { text, json: { feature: rd.row.n, preview: true, content: sk.content } };
  }
  const planningDir = loadPlanningPaths(state)[0]!.replace(/\/$/, "");
  const dir = path.join(root, planningDir, generated);
  await fs.mkdir(dir, { recursive: true });
  const abs = path.join(dir, sk.fileName);
  await fs.writeFile(abs, sk.content, "utf8");
  const rel = `${planningDir}/${generated}/${sk.fileName}`;
  const text = [
    `已生成实施骨架: ${rel}`,
    revLine,
    "",
    "下一步: 让 agent 加载 doclib-implement skill 对话填实（每条清单引用 AC 锚点，保留 frontmatter）；开工置 in-progress 时「对应文档」列写本路径。",
    "",
  ].join("\n");
  return { text, json: { feature: rd.row.n, path: rel } };
}
