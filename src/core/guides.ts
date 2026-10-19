import fs from "node:fs/promises";
import path from "node:path";
import { renderTemplate } from "./assets.js";
import { CLI_VERSION, STRUCTURE_VERSION } from "./version.js";
import type { AgentTarget } from "./agents.js";

export type GuideTier = "light" | "full";

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

export async function writeGuides(
  root: string,
  tier: GuideTier,
  targets: AgentTarget[],
): Promise<{ written: string[]; skipped: string[] }> {
  const files = new Set<string>();
  for (const t of targets) {
    for (const f of t.guideFiles) files.add(f);
  }
  const content = await renderGuide(tier);
  const written: string[] = [];
  const skipped: string[] = [];
  for (const rel of files) {
    const abs = path.join(root, rel);
    const existing = await fs.readFile(abs, "utf8").catch(() => null);
    if (existing !== null && parseGuideStamp(existing) === null) {
      skipped.push(rel);
      continue;
    }
    await fs.writeFile(abs, content, "utf8");
    written.push(rel);
  }
  return { written, skipped };
}

export async function guideStampReport(root: string): Promise<string> {
  const parts: string[] = [];
  for (const rel of ["CLAUDE.md", "AGENTS.md"]) {
    const raw = await fs.readFile(path.join(root, rel), "utf8").catch(() => null);
    if (raw === null) continue;
    const stamp = parseGuideStamp(raw);
    if (stamp === null) parts.push(`${rel} 无戳(非 doclib 管理)`);
    else if (stamp.structure === STRUCTURE_VERSION) parts.push(`${rel} ✓`);
    else parts.push(`${rel} 过期(structure ${stamp.structure})`);
  }
  return parts.length > 0 ? parts.join(" · ") : "未安装";
}
