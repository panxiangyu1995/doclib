import fs from "node:fs/promises";
import path from "node:path";
import { collectFiles } from "../core/fsutil.js";
import { languageOf } from "../core/detect.js";
import { buildCoverIndex, groupByTopDir, isDocStale, normalizePath } from "../core/mapping.js";
import { scanBrokenLinks, checkVolumeIndexes } from "../core/docquality.js";
import { LIBRARY_DIR, latestSnapshot, loadState } from "../core/state.js";
import { guideStampReport } from "../core/guides.js";
import { loadPlanningPaths, planningIgnores } from "../core/planning.js";
import type { CommandResult } from "./init.js";

export async function runVerify(root: string, opts: { json?: boolean }): Promise<CommandResult> {
  const state = await loadState(root);
  const latest = latestSnapshot(state);
  const libRoot = path.join(root, LIBRARY_DIR);

  let files: string[];
  let baselineNote: string;
  if (latest) {
    files = Object.keys(latest.files);
    baselineNote = `基线 ${latest.id} (version ${latest.version})`;
  } else {
    files = await collectFiles(root, planningIgnores(loadPlanningPaths(state)));
    baselineNote = "尚无基线快照，按当前文件扫描";
  }

  const index = await buildCoverIndex(libRoot);
  const codeFiles = files.filter((f) => languageOf(f) !== null);
  const nonCodeFiles = files.filter((f) => languageOf(f) === null);

  const covered = new Set<string>();
  const uncovered: string[] = [];
  for (const f of codeFiles) {
    const has = index.some((e) => e.covers.some((c) => f === c || f.startsWith(`${c}/`)) || e.covers.includes(f));
    if (has) covered.add(f);
    else uncovered.push(f);
  }

  const allMd = await collectFiles(libRoot).catch(() => [] as string[]);
  const mdFiles = allMd.filter((f) => f.endsWith(".md"));
  const indexedDocs = new Set(index.map((e) => e.doc));
  const unanchoredDocs = mdFiles.filter(
    (f) => !indexedDocs.has(f) && f !== "README.md" && f !== "INDEX.md",
  );
  const staleDocs = index.filter((e) => isDocStale(e, files)).map((e) => e.doc);

  let indexIssues: string[] = [];
  const indexRaw = await fs.readFile(path.join(libRoot, "INDEX.md"), "utf8").catch(() => null);
  if (indexRaw === null) {
    indexIssues = ["缺少 INDEX.md"];
  } else {
    const links = [...indexRaw.matchAll(/\[[^\]]*\]\(([^)\s]+\.md)\)/g)].map((m) => normalizePath(m[1]!));
    const linkSet = new Set(links);
    const missing = links.filter((l) => !allMd.includes(l));
    const unlisted = mdFiles.filter((f) => !linkSet.has(f) && f !== "INDEX.md" && f !== "README.md");
    if (missing.length > 0) indexIssues.push(`索引指向不存在的文档: ${missing.join(", ")}`);
    if (unlisted.length > 0) indexIssues.push(`未被索引收录: ${unlisted.join(", ")}`);
  }

  const brokenLinks = await scanBrokenLinks(root);
  if (brokenLinks.length > 0) indexIssues.push(`链接失效（两级核对）: ${brokenLinks.join(", ")}`);

  const vol = await checkVolumeIndexes(libRoot);
  for (const m of vol.missingIndex) indexIssues.push(`卷缺 _index（soft 提示）: ${m}/`);
  for (const u of vol.unlisted) indexIssues.push(`卷级索引未收录: ${u.dir}/ → ${u.docs.join(", ")}`);

  const pct = codeFiles.length > 0 ? Math.round((covered.size / codeFiles.length) * 100) : 100;
  const groups = groupByTopDir(uncovered);

  if (opts.json) {
    const payload = {
      baseline: baselineNote,
      codeFiles: codeFiles.length,
      covered: covered.size,
      coveragePct: pct,
      uncoveredGroups: groups,
      nonCodeFiles: nonCodeFiles.length,
      unanchoredDocs,
      staleDocs,
      indexIssues,
    };
    return { text: JSON.stringify(payload, null, 2), json: payload };
  }

  const lines: string[] = [];
  lines.push(`覆盖度报告（${baselineNote}）`);
  lines.push(`结构版本: ${state.structureVersion} ｜ 引导: ${await guideStampReport(root)}`);
  lines.push("");
  lines.push(`代码文件: ${codeFiles.length} ｜ 已覆盖: ${covered.size}（${pct}%）｜ 未覆盖: ${uncovered.length}`);
  lines.push(`非代码文件: ${nonCodeFiles.length}（配置/文档/资源，通常无需逐个建文档）`);
  lines.push("");
  if (groups.length > 0) {
    lines.push("未覆盖代码文件（按目录分组）:");
    for (const g of groups.slice(0, 15)) {
      lines.push(`  ${g.dir}/ (${g.count})  例如: ${g.samples.join(", ")}`);
    }
    if (groups.length > 15) lines.push(`  … 其余 ${groups.length - 15} 个目录`);
    lines.push("  提示: 未覆盖 ≠ 必须逐文件建文档。目录级 covers 合法；由 agent 按 doclib-build skill 判断粒度。");
    lines.push("");
  }
  lines.push(`无锚点文档（frontmatter 无 covers，导览/索引类属正常，请人工确认）: ${unanchoredDocs.length > 0 ? unanchoredDocs.join(", ") : "无"}`);
  lines.push(`失效文档（covers 指向的代码已全部不存在）: ${staleDocs.length > 0 ? staleDocs.join(", ") : "无"}`);
  lines.push(`索引完整性: ${indexIssues.length > 0 ? indexIssues.join("；") : "通过"}`);
  lines.push("");
  return { text: lines.join("\n"), json: { coveragePct: pct } };
}
