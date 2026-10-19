import fs from "node:fs/promises";
import path from "node:path";
import { analyzeDrift, type ImpactedRow } from "../commands/diff.js";
import { hashDocs } from "./ledger.js";
import { LIBRARY_DIR, latestSnapshot, loadState } from "./state.js";
import { pendingArchive } from "./planning.js";

export type FeatureRow = { n: number; name: string; status: string; docs: string };

export async function featureRows(root: string): Promise<FeatureRow[]> {
  const raw = await fs.readFile(path.join(root, "doclib", "00-overview", "feature-map.md"), "utf8").catch(() => "");
  const rows: FeatureRow[] = [];
  for (const line of raw.split(/\r?\n/)) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    if (!/^\d+$/.test(cells[1] ?? "")) continue;
    rows.push({
      n: Number(cells[1]),
      name: cells[2] ?? "?",
      status: cells[5] ?? "?",
      docs: cells[4] ?? "",
    });
  }
  return rows;
}

export type ReconcileReport = {
  baseline: string | null;
  revision: number;
  driftTotal: number;
  driftRows: ImpactedRow[];
  plannedInProgress: FeatureRow[];
  staleProgress: Array<{ n: number; name: string; doc: string }>;
};

export async function runReconcileCore(root: string): Promise<ReconcileReport> {
  const state = await loadState(root);
  const latest = latestSnapshot(state);
  const rows = await featureRows(root);
  const plannedInProgress = rows.filter((r) => r.status === "planned" || r.status === "in-progress");

  const staleProgress: Array<{ n: number; name: string; doc: string }> = [];
  const an = latest ? await analyzeDrift(root) : null;
  if (latest && an) {
    const driftPaths = new Set([...an.drift.added, ...an.drift.modified, ...an.drift.removed]);
    const docsNow = await hashDocs(root);
    const docsChangedSet = new Set<string>();
    for (const [p, h] of Object.entries(docsNow)) if (latest.docs?.[p] !== h) docsChangedSet.add(p);
    for (const p of Object.keys(latest.docs ?? {})) if (docsNow[p] === undefined) docsChangedSet.add(p);

    for (const r of rows.filter((x) => x.status === "implemented")) {
      const docRef = r.docs.split(/[（(]/)[0]!.trim();
      if (docRef.length === 0 || docRef === "—" || docRef.startsWith("skills/")) continue;
      const docPath = path.join(root, "doclib", docRef.replace(/^doclib\//, ""));
      const exists = await fs
        .access(docPath)
        .then(() => true)
        .catch(() => false);
      if (!exists) {
        staleProgress.push({ n: r.n, name: r.name, doc: `${docRef}（对应文档不存在）` });
        continue;
      }
      const coveredRows = an.rows.filter((row) => row.docs.includes(docRef));
      if (coveredRows.length > 0 && coveredRows.every((row) => driftPaths.has(row.path)) && !docsChangedSet.has(`${LIBRARY_DIR}/${docRef}`)) {
        staleProgress.push({ n: r.n, name: r.name, doc: `${docRef}（覆盖路径有漂移且文档未同步——进度与代码不符）` });
      }
    }
  }

  return {
    baseline: latest?.id ?? null,
    revision: state.revision,
    driftTotal: an ? an.drift.added.length + an.drift.modified.length + an.drift.removed.length : 0,
    driftRows: an?.rows ?? [],
    plannedInProgress,
    staleProgress,
  };
}
