import path from "node:path";
import { collectFiles, hashAll } from "../core/fsutil.js";
import { buildCoverIndex, docsForPath } from "../core/mapping.js";
import { computeDrift, DoclibError, LIBRARY_DIR, latestSnapshot, loadState, type Drift } from "../core/state.js";
import { readGitInfo, type GitInfo } from "../core/gitinfo.js";
import { loadPlanningPaths, planningIgnores } from "../core/planning.js";
import type { CommandResult } from "./init.js";

export type ImpactedRow = { path: string; change: "added" | "modified" | "removed"; docs: string[] };

export async function analyzeDrift(root: string): Promise<{
  snapshotId: string;
  snapshotVersion: number;
  baselineGit: GitInfo | null;
  currentBranch: string | null;
  drift: Drift;
  rows: ImpactedRow[];
}> {
  const state = await loadState(root);
  const latest = latestSnapshot(state);
  if (!latest) {
    throw new DoclibError("尚无基线快照：先执行 doclib snapshot（若图书馆还没构建，先 doclib plan 生成 BUILD 任务书）");
  }
  const files = await collectFiles(root, planningIgnores(loadPlanningPaths(state)));
  const hashes = await hashAll(root, files);
  const drift = computeDrift(latest.files, hashes);

  const coverIndex = await buildCoverIndex(path.join(root, LIBRARY_DIR));
  const rows: ImpactedRow[] = [];
  for (const p of [...drift.added, ...drift.modified, ...drift.removed].sort()) {
    const change = drift.added.includes(p) ? "added" : drift.modified.includes(p) ? "modified" : "removed";
    rows.push({ path: p, change, docs: docsForPath(coverIndex, p) });
  }
  const cur = await readGitInfo(root);
  return { snapshotId: latest.id, snapshotVersion: latest.version, baselineGit: latest.git ?? null, currentBranch: cur?.branch ?? null, drift, rows };
}

export function describeDrift(an: Awaited<ReturnType<typeof analyzeDrift>>): string {
  const { snapshotId, snapshotVersion, baselineGit, currentBranch, drift, rows } = an;
  const total = drift.added.length + drift.modified.length + drift.removed.length;
  let ownership = "";
  if (baselineGit) {
    ownership = `（来自分支 ${baselineGit.branch} @ ${baselineGit.commit.slice(0, 7)}）`;
    if (currentBranch && currentBranch !== baselineGit.branch) {
      ownership += ` · ⚠ 当前分支 ${currentBranch} 与基线分支 ${baselineGit.branch} 不一致 → 跨分支漂移可能，建议重基线`;
    }
  }
  const lines: string[] = [
    `基线: ${snapshotId} (version ${snapshotVersion})${ownership}`,
    `漂移: +${drift.added.length} 新增 / ~${drift.modified.length} 修改 / -${drift.removed.length} 删除`,
    "",
  ];
  if (total === 0) {
    lines.push("无漂移，图书馆与代码同步。");
    return lines.join("\n");
  }
  const section = (title: string, items: ImpactedRow[]): void => {
    if (items.length === 0) return;
    lines.push(`${title} (${items.length})`);
    for (const r of items.slice(0, 50)) {
      const docs = r.docs.length > 0 ? r.docs.join(", ") : r.change === "removed" ? "(无关联文档)" : "(无覆盖文档 → 需落文档)";
      lines.push(`  ${r.path}  →  ${docs}`);
    }
    if (items.length > 50) lines.push(`  … 其余 ${items.length - 50} 项`);
    lines.push("");
  };
  section("新增", rows.filter((r) => r.change === "added"));
  section("修改", rows.filter((r) => r.change === "modified"));
  section("删除", rows.filter((r) => r.change === "removed"));
  const uncovered = rows.filter((r) => r.docs.length === 0).length;
  lines.push(`提示: ${uncovered} 个变更路径没有文档覆盖。下一步: doclib plan 生成更新任务书。`);
  return lines.join("\n");
}

export async function runDiff(root: string, opts: { json?: boolean }): Promise<CommandResult> {
  const an = await analyzeDrift(root);
  if (opts.json) {
    return { text: JSON.stringify(an, null, 2), json: an };
  }
  return { text: describeDrift(an), json: an };
}
