import path from "node:path";
import { collectFiles, hashAll } from "./fsutil.js";
import { computeDrift, DoclibError, latestSnapshot, LIBRARY_DIR, loadState } from "./state.js";
import { buildCoverIndex, docsForPath } from "./mapping.js";
import { hashDocs, validateMigrations, type CheckFinding } from "./ledger.js";
import { managedRegionFresh } from "./guides.js";
import { detectOrphanDocs } from "./orphan.js";
import { scanBrokenLinks } from "./docquality.js";
import { loadPlanningPaths, planningIgnores } from "./planning.js";

export type { CheckFinding, CheckFindingKind } from "./ledger.js";

export type HealthReport = {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  parts: { accounting: number; migration: number; placement: number; guides: number; quality: number };
};

export function healthScore(inputs: {
  driftTotal: number;
  unaccounted: number;
  uncovered: number;
  migration: number;
  orphan: number;
  guideStale: number;
  brokenLinks: number;
}): HealthReport {
  const accounting =
    inputs.driftTotal === 0 ? 1 : Math.max(0, 1 - (inputs.unaccounted + inputs.uncovered) / inputs.driftTotal);
  const migration = Math.max(0, 1 - 0.2 * inputs.migration);
  const placement = Math.max(0, 1 - 0.1 * inputs.orphan);
  const guides = Math.max(0, 1 - 0.5 * inputs.guideStale);
  const quality = Math.max(0, 1 - 0.1 * inputs.brokenLinks);
  const score = Math.round(40 * accounting + 20 * migration + 20 * placement + 10 * guides + 10 * quality);
  const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";
  return { score, grade, parts: { accounting, migration, placement, guides, quality } };
}

export type CheckResult = {
  baseline: string | null;
  hasDocLedger: boolean;
  accounted: number;
  docFirst: string[];
  exempted: Array<{ path: string; note: string }>;
  findings: CheckFinding[];
  health: HealthReport;
  stats: {
    codeDrift: { added: number; modified: number; removed: number };
    docsChanged: string[];
  };
};

export async function runCheckCore(root: string): Promise<CheckResult> {
  const state = await loadState(root);
  const latest = latestSnapshot(state);
  if (!latest) throw new DoclibError("尚无基线快照：先执行 doclib snapshot");
  const hasDocLedger = latest.docs !== undefined;

  const files = await collectFiles(root, planningIgnores(loadPlanningPaths(state)));
  const hashes = await hashAll(root, files);
  const drift = computeDrift(latest.files, hashes);

  const docsNow = await hashDocs(root);
  const docsBaseline = latest.docs ?? {};
  const docsChanged: string[] = [];
  for (const [p, h] of Object.entries(docsNow)) {
    if (docsBaseline[p] !== h) docsChanged.push(p);
  }
  for (const p of Object.keys(docsBaseline)) {
    if (docsNow[p] === undefined) docsChanged.push(p);
  }
  const docsChangedSet = new Set(docsChanged);

  const coverIndex = await buildCoverIndex(path.join(root, LIBRARY_DIR));
  const acks = state.acks ?? [];
  const findings: CheckFinding[] = [];
  const exempted: Array<{ path: string; note: string }> = [];
  let accounted = 0;
  const triggeredDocs = new Set<string>();

  const changedPaths = [...drift.added, ...drift.modified, ...drift.removed].sort();
  for (const p of changedPaths) {
    const standing = acks.find((a) => a.kind === "standing" && a.path === p);
    if (standing) {
      exempted.push({ path: p, note: standing.note });
      continue;
    }
    const once = acks.find((a) => a.kind === "once" && a.path === p && a.baseline === latest.id);
    if (once) {
      exempted.push({ path: p, note: once.note });
      continue;
    }
    const docs = docsForPath(coverIndex, p);
    for (const d of docs) triggeredDocs.add(`${LIBRARY_DIR}/${d}`);
    if (docs.length === 0) {
      findings.push({ kind: "uncovered", path: p });
      continue;
    }
    const updated = docs.some((d) => docsChangedSet.has(`${LIBRARY_DIR}/${d}`));
    if (updated) accounted++;
    else findings.push({ kind: "unaccounted", path: p, docs: docs.map((d) => `${LIBRARY_DIR}/${d}`) });
  }

  findings.push(...(await validateMigrations(root)));
  const staleGuides = await managedRegionFresh(root);
  for (const g of staleGuides) {
    findings.push({ kind: "guide-stale", path: g, detail: "规则区落后模板 → doclib sync" });
  }

  const planningDirs = loadPlanningPaths(state).map((p) => p.replace(/\/$/, ""));
  const orphanCandidates = (await detectOrphanDocs(root)).filter(
    (p) => !planningDirs.some((pp) => p === pp || p.startsWith(`${pp}/`)),
  );
  const orphans: string[] = [];
  for (const p of orphanCandidates) {
    if (docsForPath(coverIndex, p).length > 0) continue;
    const standing = acks.find((a) => a.kind === "standing" && a.path === p);
    if (standing) {
      exempted.push({ path: p, note: standing.note });
      continue;
    }
    const once = acks.find((a) => a.kind === "once" && a.path === p && a.baseline === latest.id);
    if (once) {
      exempted.push({ path: p, note: once.note });
      continue;
    }
    orphans.push(p);
    findings.push({ kind: "orphan-doc", path: p, detail: "馆外知识文档 → 收编入馆或 doclib ack" });
  }

  const unaccountedCount = findings.filter((f) => f.kind === "unaccounted").length;
  const uncoveredCount = findings.filter((f) => f.kind === "uncovered").length;
  const migrationCount = findings.filter((f) => f.kind === "migration").length;
  const brokenLinks = await scanBrokenLinks(root);
  for (const b of brokenLinks) {
    const sep = b.indexOf(" → ");
    findings.push({ kind: "doc-quality", path: b.slice(0, sep), detail: b.slice(sep + 3) });
  }
  const health = healthScore({
    driftTotal: changedPaths.length,
    unaccounted: unaccountedCount,
    uncovered: uncoveredCount,
    migration: migrationCount,
    orphan: orphans.length,
    guideStale: staleGuides.length,
    brokenLinks: brokenLinks.length,
  });

  return {
    baseline: latest.id,
    hasDocLedger,
    accounted,
    docFirst: docsChanged.filter((d) => !triggeredDocs.has(d)),
    exempted,
    findings,
    health,
    stats: {
      codeDrift: { added: drift.added.length, modified: drift.modified.length, removed: drift.removed.length },
      docsChanged,
    },
  };
}
