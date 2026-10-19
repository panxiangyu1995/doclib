import fs from "node:fs/promises";
import path from "node:path";
import { renderTemplate } from "./assets.js";
import { CLI_VERSION, STRUCTURE_VERSION } from "./version.js";
import type { AgentTarget } from "./agents.js";

export type GuideTier = "light" | "full";

export const MANAGED_BEGIN = "<!-- doclib:managed-begin -->";
export const MANAGED_END = "<!-- doclib:managed-end -->";
export const CUSTOM_BEGIN = "<!-- doclib:custom-begin -->";
export const CUSTOM_END = "<!-- doclib:custom-end -->";

export type GuidesResult = {
  written: string[];
  unchanged: string[];
  legacy: string[];
  skipped: string[];
};

function regionOf(content: string, begin: string, end: string): string | null {
  const i = content.indexOf(begin);
  const j = content.indexOf(end);
  if (i === -1 || j === -1 || j < i) return null;
  return content.slice(i + begin.length, j);
}

export async function renderGuide(tier: GuideTier, vars: Record<string, string> = {}): Promise<string> {
  return renderTemplate(path.join("guides", `${tier}.md`), {
    CLI_VERSION,
    STRUCTURE_VERSION: String(STRUCTURE_VERSION),
    ...vars,
  });
}

export function parseGuideStamp(content: string): { cli: string; structure: number } | null {
  const m = /<!--\s*doclib-guide\s+cli=(\S+)\s+structure=(\d+)\s*-->/.exec(content);
  if (!m) return null;
  return { cli: m[1]!, structure: Number(m[2]) };
}

function mergeGuide(template: string, existing: string): { rebuilt: string; legacy: boolean } {
  const custom = regionOf(existing, CUSTOM_BEGIN, CUSTOM_END);
  const tBegin = template.indexOf(CUSTOM_BEGIN);
  const tEnd = template.indexOf(CUSTOM_END);
  if (custom === null || tBegin === -1 || tEnd === -1) {
    return { rebuilt: template, legacy: true };
  }
  const rebuilt = template.slice(0, tBegin + CUSTOM_BEGIN.length) + custom + template.slice(tEnd);
  return { rebuilt, legacy: false };
}

export async function writeGuides(
  root: string,
  tier: GuideTier,
  targets: AgentTarget[],
): Promise<GuidesResult> {
  const files = new Set<string>();
  for (const t of targets) {
    for (const f of t.guideFiles) files.add(f);
  }
  const template = await renderGuide(tier);
  const result: GuidesResult = { written: [], unchanged: [], legacy: [], skipped: [] };
  for (const rel of files) {
    const abs = path.join(root, rel);
    const existing = await fs.readFile(abs, "utf8").catch(() => null);
    if (existing === null) {
      await fs.writeFile(abs, template, "utf8");
      result.written.push(rel);
      continue;
    }
    if (parseGuideStamp(existing) === null) {
      result.skipped.push(rel);
      continue;
    }
    const { rebuilt, legacy } = mergeGuide(template, existing);
    if (rebuilt === existing) {
      result.unchanged.push(rel);
    } else {
      await fs.writeFile(abs, rebuilt, "utf8");
      if (legacy) result.legacy.push(rel);
      else result.written.push(rel);
    }
  }
  return result;
}

export async function managedRegionFresh(root: string): Promise<string[]> {
  const template = await renderGuide("light");
  const tplManaged = regionOf(template, MANAGED_BEGIN, MANAGED_END);
  if (tplManaged === null) return [];
  const stale: string[] = [];
  for (const rel of ["CLAUDE.md", "AGENTS.md"]) {
    const raw = await fs.readFile(path.join(root, rel), "utf8").catch(() => null);
    if (raw === null || parseGuideStamp(raw) === null) continue;
    const managed = regionOf(raw, MANAGED_BEGIN, MANAGED_END);
    if (managed !== null && managed !== tplManaged) stale.push(rel);
  }
  return stale;
}

export async function guideStampReport(root: string): Promise<string> {
  const parts: string[] = [];
  for (const rel of ["CLAUDE.md", "AGENTS.md"]) {
    const raw = await fs.readFile(path.join(root, rel), "utf8").catch(() => null);
    if (raw === null) continue;
    const stamp = parseGuideStamp(raw);
    if (stamp === null) parts.push(`${rel} 无戳(非 doclib 管理)`);
    else if (stamp.structure === STRUCTURE_VERSION && stamp.cli === CLI_VERSION) parts.push(`${rel} ✓`);
    else parts.push(`${rel} 过期 → doclib sync`);
  }
  return parts.length > 0 ? parts.join(" · ") : "未安装";
}

export const GUIDE_BUDGET_LINES = 150;

export async function guideBudgetReport(root: string): Promise<string> {
  const parts: string[] = [];
  for (const rel of ["CLAUDE.md", "AGENTS.md"]) {
    const raw = await fs.readFile(path.join(root, rel), "utf8").catch(() => null);
    if (raw === null || parseGuideStamp(raw) === null) continue;
    const managed = regionOf(raw, MANAGED_BEGIN, MANAGED_END);
    if (managed === null) continue;
    const lines = managed.split(/\r?\n/).length;
    parts.push(lines > GUIDE_BUDGET_LINES ? `${rel} ${lines}/${GUIDE_BUDGET_LINES} 行 ⚠ 超限 → 瘦身（裁剪判据：删掉会犯错吗）` : `${rel} ${lines}/${GUIDE_BUDGET_LINES} 行`);
  }
  return parts.length > 0 ? parts.join(" · ") : "未安装";
}
