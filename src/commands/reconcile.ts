import { runReconcileCore } from "../core/reconcile.js";
import type { CommandResult } from "./init.js";

export async function runReconcile(root: string, opts: { json?: boolean }): Promise<CommandResult> {
  const r = await runReconcileCore(root);
  if (opts.json) return { text: JSON.stringify(r, null, 2), json: r };

  const lines: string[] = [];
  lines.push(`进度对账报告（基线 ${r.baseline ?? "无"} · revision ${r.revision}）`);
  lines.push("");
  if (!r.baseline) {
    lines.push("尚无基线快照：无法对账——先 doclib snapshot。");
    return { text: lines.join("\n"), json: r };
  }

  lines.push(`一、疑似完成（漂移 ${r.driftTotal} 项，逐项确认后补录 feature-map/progress）`);
  if (r.driftRows.length === 0) lines.push("  无漂移——代码与基线一致。");
  for (const row of r.driftRows.slice(0, 50)) {
    const docs = row.docs.length > 0 ? row.docs.join(", ") : "(无覆盖 → 新建文档或并入既有文档)";
    lines.push(`  [${row.change}] ${row.path}  →  ${docs}`);
  }
  if (r.driftRows.length > 50) lines.push(`  … 其余 ${r.driftRows.length - 50} 项`);
  lines.push("");

  lines.push(`二、进度不符（implemented 条目的对应文档缺失或覆盖路径有漂移）`);
  if (r.staleProgress.length === 0) lines.push("  无——进度账与代码一致。");
  for (const s of r.staleProgress) lines.push(`  #${s.n} ${s.name} — ${s.doc}`);
  lines.push("");

  lines.push(`三、待推进（planned ${r.plannedInProgress.filter((x) => x.status === "planned").length} / in-progress ${r.plannedInProgress.filter((x) => x.status === "in-progress").length}）`);
  for (const f of r.plannedInProgress) lines.push(`  #${f.n} [${f.status}] ${f.name}`);
  lines.push("");

  lines.push("修复指引: 逐项确认后补录 doclib/00-overview/feature-map.md 与 progress.md；确认前不要臆断状态。");
  return { text: lines.join("\n"), json: r };
}
