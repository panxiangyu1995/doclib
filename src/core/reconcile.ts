import { analyzeDrift, type ImpactedRow } from "../commands/diff.js";
import { hashDocs } from "./ledger.js";
import { LIBRARY_DIR, latestSnapshot, loadState } from "./state.js";
import { pendingArchive } from "./planning.js";
import { docExists, docRefs, featureRows, type FeatureRow } from "./featuremap.js";

export { docExists, docRefs, featureRows };
export type { FeatureRow };

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
      const refs = docRefs(r.docs);
      if (refs.length === 0) continue;
      const kinds = await Promise.all(refs.map((ref) => docExists(root, ref)));
      const libIdx = kinds.findIndex((k) => k === "library");
      if (!kinds.some((k) => k !== "none")) {
        staleProgress.push({ n: r.n, name: r.name, doc: `${refs.join(" + ")}（对应文档不存在）` });
        continue;
      }
      if (libIdx === -1) continue;
      const docRef = refs[libIdx]!;
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
