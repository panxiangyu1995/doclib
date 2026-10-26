import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { renderTemplate } from "./assets.js";
import { readFileOrNull } from "./fsutil.js";
import { parseFrontmatter } from "./frontmatter.js";
import { hashDocs } from "./ledger.js";
import { CLI_VERSION, STRUCTURE_VERSION } from "./version.js";
import { LIBRARY_DIR, STATE_DIR, DoclibError } from "./state.js";
import type { AgentTarget } from "./agents.js";

export type GuideTier = "light";

export const MANAGED_BEGIN = "<!-- doclib:managed-begin -->";
export const MANAGED_END = "<!-- doclib:managed-end -->";
export const PROJECT_BEGIN = "<!-- doclib:project-begin -->";
export const PROJECT_END = "<!-- doclib:project-end -->";
export const CUSTOM_BEGIN = "<!-- doclib:custom-begin -->";
export const CUSTOM_END = "<!-- doclib:custom-end -->";
export const PROJECT_BUDGET_LINES = 50;
export const GUIDE_PROJECT_PATH = `${STATE_DIR}/guide-project.md`;

export type GuideProject = { snapshot: number | null; docsHash: string | null; body: string };

const REGION_MARKERS = [MANAGED_BEGIN, MANAGED_END, PROJECT_BEGIN, PROJECT_END, CUSTOM_BEGIN, CUSTOM_END];

export async function readGuideProject(root: string): Promise<GuideProject | null> {
  const raw = await readFileOrNull(path.join(root, GUIDE_PROJECT_PATH));
  if (raw === null) return null;
  const { data, body } = parseFrontmatter(raw);
  const trimmed = body.trim();
  if (trimmed === "") return null;
  const hit = REGION_MARKERS.find((m) => trimmed.includes(m));
  if (hit !== undefined) {
    throw new DoclibError(
      `${GUIDE_PROJECT_PATH} 正文含引导区域保留标记（${hit}）——标记字符串仅 doclib 内部使用，注入会破坏三区契约与 custom 保留语义，请改写该行后重试`,
    );
  }
  const snapshotRaw = typeof data.snapshot === "string" ? Number(data.snapshot) : NaN;
  const docsHash = typeof data["docs-hash"] === "string" ? data["docs-hash"] : null;
  return {
    snapshot: Number.isFinite(snapshotRaw) ? snapshotRaw : null,
    docsHash,
    body: trimmed,
  };
}

export function applyProjectRegion(template: string, body: string | null): string {
  if (body === null) return template;
  const i = template.indexOf(PROJECT_BEGIN);
  const j = template.indexOf(PROJECT_END);
  if (i === -1 || j === -1 || j < i) return template;
  return template.slice(0, i + PROJECT_BEGIN.length) + `\n${body}\n` + template.slice(j);
}

export async function renderFullGuide(root: string, tier: GuideTier = "light"): Promise<string> {
  const template = await renderGuide(tier);
  const project = await readGuideProject(root);
  return applyProjectRegion(template, project === null ? null : project.body);
}

export function fingerprintOf(docs: Record<string, string>): string {
  const stable = Object.entries(docs)
    .filter(([p]) => p.startsWith(`${LIBRARY_DIR}/`))
    .sort(([a], [b]) => a.localeCompare(b));
  return createHash("sha256").update(JSON.stringify(stable)).digest("hex");
}

export async function libraryFingerprint(root: string): Promise<string> {
  return fingerprintOf(await hashDocs(root));
}

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
  const template = await renderFullGuide(root, tier);
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
  const template = await renderFullGuide(root);
  const tplManaged = regionOf(template, MANAGED_BEGIN, MANAGED_END);
  const tplProject = regionOf(template, PROJECT_BEGIN, PROJECT_END);
  if (tplManaged === null) return [];
  const stale: string[] = [];
  for (const rel of ["CLAUDE.md", "AGENTS.md"]) {
    const raw = await fs.readFile(path.join(root, rel), "utf8").catch(() => null);
    if (raw === null || parseGuideStamp(raw) === null) continue;
    const managed = regionOf(raw, MANAGED_BEGIN, MANAGED_END);
    if (managed !== null && managed !== tplManaged) {
      stale.push(rel);
      continue;
    }
    const project = regionOf(raw, PROJECT_BEGIN, PROJECT_END);
    if (tplProject !== null && project !== null && project !== tplProject) stale.push(rel);
  }
  return stale;
}

export async function guideStampReport(root: string): Promise<string> {
  const parts: string[] = [];
  const fresh = new Set(await managedRegionFresh(root));
  for (const rel of ["CLAUDE.md", "AGENTS.md"]) {
    const raw = await fs.readFile(path.join(root, rel), "utf8").catch(() => null);
    if (raw === null) continue;
    const stamp = parseGuideStamp(raw);
    if (stamp === null) parts.push(`${rel} 无戳(非 doclib 管理)`);
    else if (stamp.structure !== STRUCTURE_VERSION || stamp.cli !== CLI_VERSION) parts.push(`${rel} 过期 → doclib sync`);
    else if (fresh.has(rel)) parts.push(`${rel} 内容过期 → doclib sync`);
    else parts.push(`${rel} ✓`);
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
    if (managed !== null) {
      const lines = managed.split(/\r?\n/).length;
      parts.push(
        lines > GUIDE_BUDGET_LINES
          ? `${rel} ${lines}/${GUIDE_BUDGET_LINES} 行 ⚠ 超限 → 瘦身（裁剪判据：删掉会犯错吗）`
          : `${rel} ${lines}/${GUIDE_BUDGET_LINES} 行`,
      );
    }
    const project = regionOf(raw, PROJECT_BEGIN, PROJECT_END);
    if (project !== null) {
      const lines = project.split(/\r?\n/).length;
      parts.push(
        lines > PROJECT_BUDGET_LINES
          ? `${rel} project ${lines}/${PROJECT_BUDGET_LINES} 行 ⚠ 超限 → 摘要瘦身（判据：会话冷启动真的每天都要知道吗）`
          : `${rel} project ${lines}/${PROJECT_BUDGET_LINES} 行`,
      );
    }
  }
  return parts.length > 0 ? parts.join(" · ") : "未安装";
}
