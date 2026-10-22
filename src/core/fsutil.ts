import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import ignoreModule from "ignore";

interface IgnoreMatcher {
  add(patterns: string | string[]): IgnoreMatcher;
  ignores(path: string): boolean;
}

const ignore = ignoreModule as unknown as () => IgnoreMatcher;

export const DEFAULT_IGNORES = [
  "node_modules/",
  ".git/",
  ".doclib/",
  "doclib/",
  "dist/",
  "build/",
  "out/",
  "coverage/",
  "__pycache__/",
  ".venv/",
  "venv/",
  "target/",
  ".next/",
  ".nuxt/",
  ".cache/",
  ".turbo/",
  ".idea/",
  ".vscode/",
  ".zed/",
  ".codegraph/",
  ".DS_Store",
  "*.log",
  "*.tmp",
  ".env",
  ".env.*",
  "Thumbs.db",
  ".plan/",
  "vendor/",
  "vendors/",
  "third_party/",
  "third-party/",
  "thirdparty/",
  "3rdparty/",
  "deps/",
  "extern/",
  "external/",
  ".changeset/",
];

export async function fileExists(root: string, rel: string): Promise<boolean> {
  return fs
    .access(path.join(root, rel))
    .then(() => true)
    .catch(() => false);
}

export async function readFileOrNull(p: string): Promise<string | null> {
  try {
    return await fs.readFile(p, "utf8");
  } catch {
    return null;
  }
}

export async function collectFiles(root: string, extraIgnores: string[] = []): Promise<string[]> {
  const ig = ignore();
  ig.add(DEFAULT_IGNORES);
  for (const name of [".gitignore", ".doclibignore"]) {
    const content = await readFileOrNull(path.join(root, name));
    if (content) {
      ig.add(
        content
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith("#")),
      );
    }
  }
  if (extraIgnores.length > 0) ig.add(extraIgnores);
  const out: string[] = [];
  const walk = async (absDir: string, relDir: string): Promise<void> => {
    let entries;
    try {
      entries = await fs.readdir(absDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const rel = relDir === "" ? entry.name : `${relDir}/${entry.name}`;
      if (entry.isDirectory()) {
        if (ig.ignores(`${rel}/`)) continue;
        await walk(path.join(absDir, entry.name), rel);
      } else if (entry.isFile()) {
        if (ig.ignores(rel)) continue;
        out.push(rel);
      }
    }
  };
  await walk(root, "");
  return out.sort();
}

export async function hashFile(absPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(absPath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]!);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function hashAll(root: string, files: string[]): Promise<Record<string, string>> {
  const hashes = await mapLimit(files, 64, (rel) => hashFile(path.join(root, rel)));
  const map: Record<string, string> = {};
  files.forEach((rel, i) => {
    map[rel] = hashes[i]!;
  });
  return map;
}

type TreeNode = { name: string; children: Map<string, TreeNode>; fileCount: number };

export function renderTree(files: string[], maxDepth = 2): string {
  const root: TreeNode = { name: ".", children: new Map(), fileCount: 0 };
  for (const f of files) {
    const parts = f.split("/");
    let node = root;
    node.fileCount++;
    for (const part of parts) {
      let child = node.children.get(part);
      if (!child) {
        child = { name: part, children: new Map(), fileCount: 0 };
        node.children.set(part, child);
      }
      child.fileCount++;
      node = child;
    }
  }
  const lines: string[] = [];
  const emit = (node: TreeNode, depth: number, prefix: string): void => {
    const entries = [...node.children.values()].sort((a, b) => {
      const aDir = a.children.size > 0 ? 0 : 1;
      const bDir = b.children.size > 0 ? 0 : 1;
      return aDir - bDir || a.name.localeCompare(b.name);
    });
    for (const child of entries) {
      const isDir = child.children.size > 0;
      const label = isDir ? `${child.name}/` : child.name;
      if (isDir && depth >= maxDepth) {
        lines.push(`${prefix}${label} (${child.fileCount} files)`);
      } else {
        lines.push(`${prefix}${label}`);
        if (isDir) emit(child, depth + 1, `${prefix}  `);
      }
    }
  };
  emit(root, 1, "");
  return lines.join("\n");
}
