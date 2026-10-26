import path from "node:path";
import { collectFiles, fileExists, hashAll } from "./fsutil.js";
import { computeDrift, DoclibError, latestSnapshot, LIBRARY_DIR, loadState } from "./state.js";
import { buildCoverIndex, docsForPath } from "./mapping.js";
import { hashDocs, validateMigrations, type CheckFinding } from "./ledger.js";
import { managedRegionFresh } from "./guides.js";
import { detectSuspectedToolchainDirs, scanExternalDocs } from "./orphan.js";
import { scanBrokenLinks, checkGenreCompliance } from "./docquality.js";
import { loadPlanningPaths, planningIgnores } from "./planning.js";

export type { CheckFinding, CheckFindingKind } from "./ledger.js";

export type CheckNoticeKind = "toolchain-exempt" | "guide-exempt" | "pointer-exempt" | "toolchain-suspect" | "newly-ignored";

export type CheckNotice = {
  kind: CheckNoticeKind;
  path?: string;
  detail: string;
};

const EXEMPT_NOTICE_KINDS: CheckNoticeKind[] = ["toolchain-exempt", "guide-exempt", "pointer-exempt"];

function aggregateExemptNotices(notices: CheckNotice[]): CheckNotice[] {
  const groups = new Map<string, { kind: CheckNoticeKind; dir: string; count: number; reason: string; samples: string[] }>();
  const kept: CheckNotice[] = [];
  for (const n of notices) {
    if (!EXEMPT_NOTICE_KINDS.includes(n.kind)) {
      kept.push(n);
      continue;
    }
    const dir = n.path === undefined ? "(root)" : n.path.includes("/") ? n.path.split("/")[0]! : n.path;
    const key = `${n.kind}|${dir}`;
    const g = groups.get(key) ?? { kind: n.kind, dir, count: 0, reason: n.detail, samples: [] };
    g.count += 1;
    if (g.samples.length < 3 && n.path !== undefined) g.samples.push(n.path);
    groups.set(key, g);
  }
  const aggregated: CheckNotice[] = [];
  for (const g of groups.values()) {
    const sample = g.samples.length > 0 ? `（例：${g.samples.join(", ")}）` : "";
    aggregated.push({ kind: g.kind, path: g.dir, detail: `${g.reason}｜${g.count} 个文件${sample}` });
  }
  return [...aggregated, ...kept];
}

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
  notices: CheckNotice[];
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
  const notices: CheckNotice[] = [];
  let accounted = 0;
  const triggeredDocs = new Set<string>();

  const newlyIgnored: string[] = [];
  const realRemoved: string[] = [];
  for (const p of drift.removed) {
    if (await fileExists(root, p)) newlyIgnored.push(p);
    else realRemoved.push(p);
  }
  if (newlyIgnored.length > 0) {
    notices.push({
      kind: "newly-ignored",
      detail: `${newlyIgnored.length} 个路径因忽略规则退出代码账（非删除，不计漂移）：${newlyIgnored.slice(0, 5).join(", ")}${newlyIgnored.length > 5 ? " …" : ""}`,
    });
  }

  const changedPaths = [...drift.added, ...drift.modified, ...realRemoved].sort();
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
  const scan = await scanExternalDocs(root);
  for (const d of scan.toolchain) notices.push({ kind: "toolchain-exempt", path: d.path, detail: d.reason });
  for (const d of scan.guide) notices.push({ kind: "guide-exempt", path: d.path, detail: d.reason });
  for (const d of scan.pointer) notices.push({ kind: "pointer-exempt", path: d.path, detail: d.reason });
  const suspects = await detectSuspectedToolchainDirs(root);
  const suspectDirs = suspects.map((s) => s.dir);
  const dirExemptPrefixes = state.dirExempts.map((d) => d.replace(/\/$/, ""));
  const orphanCandidates = scan.pending
    .filter((d) => !planningDirs.some((pp) => d.path === pp || d.path.startsWith(`${pp}/`)))
    .filter((d) => {
      const hit = dirExemptPrefixes.some((dp) => d.path === dp || d.path.startsWith(`${dp}/`));
      if (hit) notices.push({ kind: "toolchain-exempt", path: d.path, detail: "项目级目录豁免（doclib ack --dir）" });
      return !hit;
    })
    .filter((d) => {
      const top = d.path.split("/")[0] ?? "";
      const hit = suspectDirs.includes(top);
      if (hit) {
        notices.push({
          kind: "toolchain-suspect",
          path: d.path,
          detail: `疑似 agent 工具目录（${top}/）内文档——soft 提示不判违规；确认后 doclib ack --dir ${top}/`,
        });
      }
      return !hit;
    })
    .map((d) => d.path);
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
    findings.push({ kind: "orphan-doc", path: p, detail: "馆外知识文档 → doclib place collect/archive 或 doclib ack" });
  }
  for (const s of suspects) {
    notices.push({ kind: "toolchain-suspect", path: s.dir, detail: s.reason });
  }

  const unaccountedCount = findings.filter((f) => f.kind === "unaccounted").length;
  const uncoveredCount = findings.filter((f) => f.kind === "uncovered").length;
  const migrationCount = findings.filter((f) => f.kind === "migration").length;
  const brokenLinks = await scanBrokenLinks(root);
  for (const b of brokenLinks) {
    const sep = b.indexOf(" → ");
    findings.push({ kind: "doc-quality", path: b.slice(0, sep), detail: b.slice(sep + 3) });
  }
  const genre = await checkGenreCompliance(path.join(root, LIBRARY_DIR));
  for (const v of genre.violations) {
    findings.push({ kind: "genre", path: `${LIBRARY_DIR}/${v.doc}`, detail: `${v.kind}：${v.detail}` });
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
    notices: aggregateExemptNotices(notices),
    health,
    stats: {
      codeDrift: { added: drift.added.length, modified: drift.modified.length, removed: realRemoved.length },
      docsChanged,
    },
  };
}
