import fs from "node:fs/promises";
import path from "node:path";
import { collectFiles } from "./fsutil.js";
import { coversOf, parseFrontmatter } from "./frontmatter.js";

export type CoverEntry = { doc: string; covers: string[] };

export function normalizePath(p: string): string {
  return p
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/\/+$/, "")
    .trim();
}

export async function buildCoverIndex(libraryRoot: string): Promise<CoverEntry[]> {
  let files: string[] = [];
  try {
    files = await collectFiles(libraryRoot);
  } catch {
    return [];
  }
  const entries: CoverEntry[] = [];
  for (const rel of files) {
    if (!rel.endsWith(".md")) continue;
    let raw: string;
    try {
      raw = await fs.readFile(path.join(libraryRoot, rel), "utf8");
    } catch {
      continue;
    }
    const covers = coversOf(parseFrontmatter(raw).data).map(normalizePath).filter((c) => c.length > 0);
    if (covers.length > 0) entries.push({ doc: rel, covers });
  }
  return entries;
}

export function docsForPath(index: CoverEntry[], codePath: string): string[] {
  const p = normalizePath(codePath);
  const exact = index.filter((e) => e.covers.includes(p)).map((e) => e.doc);
  if (exact.length > 0) return [...new Set(exact)];
  const prefixed = index
    .filter((e) => e.covers.some((c) => p === c || p.startsWith(`${c}/`)))
    .map((e) => e.doc);
  return [...new Set(prefixed)];
}

export function isDocStale(entry: CoverEntry, files: string[]): boolean {
  return !entry.covers.some((c) => files.some((f) => f === c || f.startsWith(`${c}/`)));
}

export function groupByTopDir(paths: string[]): Array<{ dir: string; count: number; samples: string[] }> {
  const groups = new Map<string, string[]>();
  for (const p of paths) {
    const dir = p.includes("/") ? p.split("/")[0]! : "(根目录)";
    const list = groups.get(dir) ?? [];
    list.push(p);
    groups.set(dir, list);
  }
  return [...groups.entries()]
    .map(([dir, list]) => ({ dir, count: list.length, samples: list.slice(0, 5) }))
    .sort((a, b) => b.count - a.count);
}
