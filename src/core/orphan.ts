import path from "node:path";
import { collectFiles, readFileOrNull } from "./fsutil.js";
import { normalizePath } from "./mapping.js";

export const TOOLCHAIN_DIRS: readonly string[] = [
  ".claude/",
  ".agents/",
  ".opencode/",
  ".cursor/",
  ".github/",
  ".gemini/",
  ".codex/",
  ".cline/",
  ".clinerules/",
  ".roo/",
  ".continue/",
  ".qwen/",
  ".windsurf/",
  ".kiro/",
  ".factory/",
  ".trae/",
  ".junie/",
  ".kilocode/",
  ".antigravity/",
  ".specstory/",
  ".crush/",
  ".codeium/",
  ".mcp/",
  ".archon/",
  ".conductor/",
  ".greptile/",
  ".ai/",
  ".codegraph/",
];

export const TOOLCHAIN_FILES: readonly string[] = [
  ".windsurfrules",
  ".cursorrules",
  ".roorules",
  ".clinerules",
  ".augment-guidelines",
  ".codeium/config.json",
];

export const GUIDE_FILE_NAMES: readonly string[] = [
  "AGENTS.md",
  "CLAUDE.md",
  "CLAUDE.local.md",
  "GEMINI.md",
  "CONVENTIONS.md",
];

export const EXEMPT_ROOT_FILES: readonly string[] = ["README.md", "CHANGELOG.md", "CONTRIBUTING.md"];

export const POINTER_MARKER = "<!-- doclib:archived-pointer -->";

const TOOL_SUBDIRS: readonly string[] = [
  "rules/",
  "commands/",
  "agents/",
  "instructions/",
  "prompts/",
  "skills/",
  "workflows/",
  "steering/",
];

export type ExternalDocKind = "toolchain" | "guide" | "pointer" | "pending";

export type ExternalDoc = { path: string; reason: string };

export type ExternalScan = {
  pending: ExternalDoc[];
  toolchain: ExternalDoc[];
  guide: ExternalDoc[];
  pointer: ExternalDoc[];
};

export type SuspectDir = { dir: string; samples: string[]; reason: string };

function baseName(rel: string): string {
  const p = normalizePath(rel);
  const i = p.lastIndexOf("/");
  return i === -1 ? p : p.slice(i + 1);
}

function toolchainRuleFor(rel: string): string | null {
  const p = normalizePath(rel);
  for (const d of TOOLCHAIN_DIRS) {
    if (p.startsWith(d)) return d;
  }
  const base = baseName(p);
  for (const f of TOOLCHAIN_FILES) {
    if (base === f) return f;
  }
  return null;
}

export function isToolchainPath(rel: string): boolean {
  return toolchainRuleFor(rel) !== null;
}

export function isToolchainDirName(dir: string): boolean {
  const d = normalizePath(dir);
  return TOOLCHAIN_DIRS.some((t) => t.replace(/\/$/, "") === d);
}

export function isGuideFile(rel: string): boolean {
  return GUIDE_FILE_NAMES.includes(baseName(rel));
}

export function isPointerFile(rel: string, content: string): boolean {
  return content.includes(POINTER_MARKER);
}

export function isRootFacadeFile(rel: string): boolean {
  const p = normalizePath(rel);
  return !p.includes("/") && EXEMPT_ROOT_FILES.includes(p);
}

export function classifyExternalDoc(rel: string, content?: string): ExternalDocKind {
  if (content !== undefined && isPointerFile(rel, content)) return "pointer";
  if (isGuideFile(rel)) return "guide";
  if (isToolchainPath(rel)) return "toolchain";
  if (isRootFacadeFile(rel)) return "toolchain";
  return "pending";
}

function reasonFor(rel: string, kind: ExternalDocKind): string {
  if (kind === "guide") return "引导文件（agent 指令，任意层级，位置由工具链决定）";
  if (kind === "pointer") return "归档指针文件（doclib 生成，指向馆内新位置）";
  if (kind === "toolchain") {
    const rule = toolchainRuleFor(rel);
    if (rule !== null) return `工具链目录/文件（${rule}，位置由工具链决定）`;
    return "项目门面文件（README/CHANGELOG/CONTRIBUTING，生态惯例）";
  }
  return "馆外知识文档（未收编且未豁免）";
}

export async function scanExternalDocs(root: string): Promise<ExternalScan> {
  const files = await collectFiles(root);
  const scan: ExternalScan = { pending: [], toolchain: [], guide: [], pointer: [] };
  for (const f of files) {
    if (!f.endsWith(".md")) continue;
    const rel = normalizePath(f);
    if (isGuideFile(rel)) {
      scan.guide.push({ path: rel, reason: reasonFor(rel, "guide") });
      continue;
    }
    if (isToolchainPath(rel) || isRootFacadeFile(rel)) {
      scan.toolchain.push({ path: rel, reason: reasonFor(rel, "toolchain") });
      continue;
    }
    const content = await readFileOrNull(path.join(root, rel));
    if (content !== null && isPointerFile(rel, content)) {
      scan.pointer.push({ path: rel, reason: reasonFor(rel, "pointer") });
      continue;
    }
    scan.pending.push({ path: rel, reason: reasonFor(rel, "pending") });
  }
  scan.pending.sort((a, b) => a.path.localeCompare(b.path));
  scan.toolchain.sort((a, b) => a.path.localeCompare(b.path));
  scan.guide.sort((a, b) => a.path.localeCompare(b.path));
  scan.pointer.sort((a, b) => a.path.localeCompare(b.path));
  return scan;
}

export async function detectOrphanDocs(root: string): Promise<string[]> {
  const scan = await scanExternalDocs(root);
  return scan.pending.map((d) => d.path);
}

export async function detectSuspectedToolchainDirs(root: string): Promise<SuspectDir[]> {
  const files = await collectFiles(root);
  const groups = new Map<string, string[]>();
  for (const f of files) {
    const rel = normalizePath(f);
    const i = rel.indexOf("/");
    if (i <= 0) continue;
    const top = rel.slice(0, i);
    if (!top.startsWith(".")) continue;
    const list = groups.get(top) ?? [];
    list.push(rel);
    groups.set(top, list);
  }
  const out: SuspectDir[] = [];
  for (const [dir, list] of groups) {
    if (isToolchainDirName(dir)) continue;
    const features = new Set<string>();
    for (const rel of list) {
      const base = baseName(rel);
      if (base === "SKILL.md") features.add("SKILL.md");
      if (base.endsWith(".mdc")) features.add("*.mdc");
      if (GUIDE_FILE_NAMES.includes(base)) features.add("引导文件");
      const rest = rel.slice(dir.length + 1);
      for (const sub of TOOL_SUBDIRS) {
        if (rest.startsWith(sub)) {
          features.add(`${sub.replace(/\/$/, "")}/`);
          break;
        }
      }
    }
    if (features.size === 0) continue;
    out.push({
      dir,
      samples: list.slice(0, 3),
      reason: `含 ${[...features].join(" / ")} → 疑似 agent 工具目录（新工具？确认后 doclib ack --dir ${dir}/）`,
    });
  }
  return out.sort((a, b) => a.dir.localeCompare(b.dir));
}
