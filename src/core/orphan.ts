import { collectFiles } from "./fsutil.js";

const EXEMPT_ROOT_FILES = new Set([
  "README.md",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "CLAUDE.md",
  "AGENTS.md",
]);

const EXEMPT_PREFIXES = [".github/", ".claude/", ".opencode/", ".cursor/"];

export async function detectOrphanDocs(root: string): Promise<string[]> {
  const files = await collectFiles(root);
  const orphans: string[] = [];
  for (const f of files) {
    if (!f.endsWith(".md")) continue;
    if (!f.includes("/") && EXEMPT_ROOT_FILES.has(f)) continue;
    if (EXEMPT_PREFIXES.some((p) => f.startsWith(p))) continue;
    orphans.push(f);
  }
  return orphans.sort();
}
