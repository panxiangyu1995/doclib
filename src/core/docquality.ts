import fs from "node:fs/promises";
import path from "node:path";
import { collectFiles } from "./fsutil.js";
import { normalizePath } from "./mapping.js";
import { LIBRARY_DIR } from "./state.js";

const MD_LINK = /\[[^\]]*\]\(([^)\s]+\.md)\)/g;
const EXTERNAL_LINK = /^(https?:|#|\/)/;

export async function scanBrokenLinks(root: string): Promise<string[]> {
  const libRoot = path.join(root, LIBRARY_DIR);
  const allMd = (await collectFiles(libRoot).catch(() => [] as string[])).filter((f) => f.endsWith(".md"));
  const broken: string[] = [];
  for (const md of allMd) {
    if (md === "INDEX.md") continue;
    const raw = await fs.readFile(path.join(libRoot, md), "utf8").catch(() => null);
    if (raw === null) continue;
    for (const m of raw.matchAll(MD_LINK)) {
      const l = m[1]!;
      if (EXTERNAL_LINK.test(l)) continue;
      const target = normalizePath(path.join(path.dirname(md), l).replace(/\\/g, "/"));
      if (!allMd.includes(target)) broken.push(`${md} → ${l}`);
    }
  }
  return broken.sort();
}

export type VolumeIndexReport = {
  missingIndex: string[];
  unlisted: Array<{ dir: string; docs: string[] }>;
};

export async function checkVolumeIndexes(libraryRoot: string): Promise<VolumeIndexReport> {
  const all = (await collectFiles(libraryRoot).catch(() => [] as string[])).filter((f) => f.endsWith(".md"));
  const byDir = new Map<string, string[]>();
  for (const f of all) {
    const dir = f.includes("/") ? f.slice(0, f.lastIndexOf("/")) : "";
    const list = byDir.get(dir) ?? [];
    list.push(f);
    byDir.set(dir, list);
  }
  const report: VolumeIndexReport = { missingIndex: [], unlisted: [] };
  for (const [dir, files] of byDir) {
    const indexFile = dir === "" ? "_index.md" : `${dir}/_index.md`;
    if (!files.includes(indexFile)) {
      if (!dir.includes("/") && /^\d{2}-/.test(dir)) report.missingIndex.push(dir);
      continue;
    }
    const raw = await fs.readFile(path.join(libraryRoot, indexFile), "utf8").catch(() => null);
    if (raw === null) continue;
    const links = new Set<string>();
    for (const m of raw.matchAll(MD_LINK)) {
      const l = m[1]!;
      if (EXTERNAL_LINK.test(l)) continue;
      links.add(normalizePath(path.join(dir, l).replace(/\\/g, "/")));
    }
    const docs = files.filter((f) => f !== indexFile && !links.has(f)).sort();
    if (docs.length > 0) report.unlisted.push({ dir: dir === "" ? "(根目录)" : dir, docs });
  }
  report.missingIndex.sort();
  report.unlisted.sort((a, b) => a.dir.localeCompare(b.dir));
  return report;
}
