import fs from "node:fs/promises";
import path from "node:path";
import { collectFiles } from "./fsutil.js";
import { normalizePath } from "./mapping.js";
import { parseFrontmatter } from "./frontmatter.js";
import { LIBRARY_DIR } from "./state.js";

const MD_LINK = /\[[^\]]*\]\(([^)\s]+\.md)\)/g;
const EXTERNAL_LINK = /^(https?:|#|\/)/;

export type Genre = "narrative" | "ledger" | "index";
export type GenreExemption = "structure-exempt" | "exempt";
export type GenreMode = Genre | GenreExemption;

export const DEFAULT_GENRE: Record<string, GenreMode> = {
  "00-overview": "index",
  "10-architecture": "narrative",
  "20-modules": "narrative",
  "30-features": "narrative",
  "40-guides": "narrative",
  "50-testing": "narrative",
  "60-config": "ledger",
  "70-deploy": "narrative",
  "80-design": "narrative",
  "90-reference": "ledger",
  "95-lessons": "structure-exempt",
  "98-sessions": "exempt",
  "99-archive": "exempt",
};

const POLLUTION_PATTERN = /回灌补记|复原口径|实测补|原仓库答卷/;
const POLLUTION_EXEMPT_PREFIX = "50-testing/benchmark/";
const NARRATIVE_SECTIONS = ["为什么", "是什么", "怎么运转"] as const;
const CARD_LINE_LIMIT = 10;
const CARD_CHAR_LIMIT = 400;
const DUMP_RATIO = 0.7;

export type GenreViolation = {
  doc: string;
  kind: "structure" | "card" | "pollution";
  detail: string;
};

export type GenreWarning = { doc: string; kind: "dump" | "structure" | "card"; detail: string };

export type GenreReport = { violations: GenreViolation[]; warnings: GenreWarning[] };

function isStructuralLine(line: string): boolean {
  const t = line.trim();
  if (t === "") return false;
  if (/^#{1,6}\s/.test(t)) return false;
  if (/^\|/.test(t)) return false;
  if (/^(-{3,}|\*{3,})\s*$/.test(t)) return false;
  return true;
}

export function resolveGenreMode(docPath: string, typeOverride: unknown): GenreMode {
  if (typeOverride === "narrative" || typeOverride === "ledger" || typeOverride === "index") {
    return typeOverride;
  }
  const topDir = docPath.includes("/") ? (docPath.split("/")[0] ?? "") : "";
  return DEFAULT_GENRE[topDir] ?? "narrative";
}

export async function checkGenreCompliance(libraryRoot: string): Promise<GenreReport> {
  const all = (await collectFiles(libraryRoot).catch(() => [] as string[])).filter((f) => f.endsWith(".md"));
  const violations: GenreViolation[] = [];
  const warnings: GenreWarning[] = [];
  for (const f of all) {
    const base = f.slice(f.lastIndexOf("/") + 1);
    const topDir = f.includes("/") ? (f.split("/")[0] ?? "") : "";
    if (base === "INDEX.md" || base === "README.md" || base === "_index.md") continue;
    if (topDir === "98-sessions" || topDir === "99-archive" || f.startsWith(POLLUTION_EXEMPT_PREFIX)) continue;
    const raw = await fs.readFile(path.join(libraryRoot, f), "utf8").catch(() => null);
    if (raw === null) continue;
    const { data, body } = parseFrontmatter(raw);
    const mode = resolveGenreMode(f, data.type);
    if (mode === "exempt") continue;
    const lines = body.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const m = POLLUTION_PATTERN.exec(lines[i]!);
      if (m) {
        violations.push({
          doc: f,
          kind: "pollution",
          detail: `L${i + 1} 过程短语注记（"${m[0]}"）→ 改写为正式章节（PRD §7.6 / F3 回灌沉淀规则）`,
        });
        break;
      }
    }

    if (mode !== "narrative") continue;

    const isDraft = data.status === "draft";
    const missing: string[] = [];
    const h1Idx = lines.findIndex((l) => /^#\s+\S/.test(l));
    let hasLead = false;
    if (h1Idx !== -1) {
      for (let i = h1Idx + 1; i < lines.length; i++) {
        const t = lines[i]!.trim();
        if (t === "") continue;
        if (/^#{1,6}\s/.test(t) || t.startsWith("|")) break;
        hasLead = true;
        break;
      }
    }
    if (!hasLead) missing.push("导读");
    for (const sec of NARRATIVE_SECTIONS) {
      if (!lines.some((l) => new RegExp(`^##\\s+${sec}`).test(l))) missing.push(sec);
    }
    if (missing.length > 0) {
      const detail = `缺教科书标准段: ${missing.join("、")}（PRD §7.6）`;
      if (isDraft) warnings.push({ doc: f, kind: "structure", detail: `[draft 降级] ${detail}` });
      else violations.push({ doc: f, kind: "structure", detail });
    }

    const effective = lines.filter(isStructuralLine);
    const effectiveChars = effective.reduce((n, l) => n + l.trim().length, 0);
    if (effective.length < CARD_LINE_LIMIT && effectiveChars < CARD_CHAR_LIMIT) {
      const detail = `正文有效行 ${effective.length}（${effectiveChars} 字符）低于阈值 ${CARD_LINE_LIMIT} 行或 ${CARD_CHAR_LIMIT} 字符 → 卡片化回炉（PRD §7.6）`;
      if (isDraft) warnings.push({ doc: f, kind: "card", detail: `[draft 降级] ${detail}` });
      else violations.push({ doc: f, kind: "card", detail });
    }

    const nonEmpty = lines.filter((l) => l.trim() !== "");
    if (nonEmpty.length > 0) {
      const structured = nonEmpty.filter((l) => {
        const t = l.trim();
        return t.startsWith("|") || /^[-*+]\s/.test(t) || /^\d+\.\s/.test(t);
      });
      const ratio = structured.length / nonEmpty.length;
      if (ratio > DUMP_RATIO) {
        warnings.push({
          doc: f,
          kind: "dump",
          detail: `表格/列表行占比 ${Math.round(ratio * 100)}% > 70% → 倾倒倾向，补叙述（动机/机制）（PRD §7.6）`,
        });
      }
    }
  }
  violations.sort((a, b) => a.doc.localeCompare(b.doc) || a.kind.localeCompare(b.kind));
  warnings.sort((a, b) => a.doc.localeCompare(b.doc));
  return { violations, warnings };
}

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
