import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { collectFiles } from "./fsutil.js";
import { parseFrontmatter } from "./frontmatter.js";
import { LIBRARY_DIR, type Snapshot, type State } from "./state.js";

export function loadPlanningPaths(state: State): string[] {
  return Array.isArray(state.planning) && state.planning.length > 0 ? state.planning : [".plan/"];
}

export function planningIgnores(paths: string[]): string[] {
  return paths.map((p) => (p.endsWith("/") ? p : `${p}/`));
}

export type CarrierDoc = { path: string; mtime: number };

export async function carrierDocs(root: string, planningPaths: string[]): Promise<CarrierDoc[]> {
  const out: CarrierDoc[] = [];
  for (const dir of planningPaths) {
    const base = path.join(root, dir);
    const walk = async (abs: string, rel: string): Promise<void> => {
      let entries;
      try {
        entries = await fs.readdir(abs, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const childRel = rel === "" ? entry.name : `${rel}/${entry.name}`;
        if (entry.isDirectory()) await walk(path.join(abs, entry.name), childRel);
        else if (entry.isFile() && entry.name.endsWith(".md")) {
          const st = await fs.stat(path.join(abs, entry.name)).catch(() => null);
          if (st) out.push({ path: `${dir.replace(/\/$/, "")}/${childRel}`, mtime: st.mtimeMs });
        }
      }
    };
    await walk(base, "");
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

export async function pendingRegistration(root: string, latest: Snapshot | null, planningPaths: string[]): Promise<CarrierDoc[]> {
  if (!latest) return [];
  const threshold = Date.parse(latest.at);
  const docs = await carrierDocs(root, planningPaths);
  return docs.filter((d) => d.mtime > threshold);
}

export type PendingArchive = { planned: number; inProgress: number };

export async function pendingArchive(root: string): Promise<PendingArchive> {
  const raw = await fs.readFile(path.join(root, "doclib", "00-overview", "feature-map.md"), "utf8").catch(() => "");
  let planned = 0;
  let inProgress = 0;
  for (const line of raw.split(/\r?\n/)) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    const status = cells[5] ?? "";
    if (status === "planned") planned++;
    else if (status === "in-progress") inProgress++;
  }
  return { planned, inProgress };
}

export type SourceDrift = { doc: string; sourcePath: string };

export function sha16(content: Buffer | string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

async function sourceSha16(root: string, rel: string): Promise<string | null> {
  const raw = await fs.readFile(path.join(root, rel)).catch(() => null);
  if (raw === null) return null;
  return sha16(raw);
}

export async function sourceDrifts(root: string): Promise<SourceDrift[]> {
  const libRoot = path.join(root, LIBRARY_DIR);
  const all = (await collectFiles(libRoot).catch(() => [] as string[])).filter((f) => f.endsWith(".md"));
  const out: SourceDrift[] = [];
  for (const f of all) {
    const raw = await fs.readFile(path.join(libRoot, f), "utf8").catch(() => null);
    if (raw === null) continue;
    const { data } = parseFrontmatter(raw);
    const sp = data["source-path"];
    const sh = data["source-hash"];
    if (typeof sp !== "string" || typeof sh !== "string" || sp === "" || sh === "") continue;
    const cur = await sourceSha16(root, sp);
    if (cur !== null && cur !== sh.trim()) out.push({ doc: `${LIBRARY_DIR}/${f}`, sourcePath: sp });
  }
  return out.sort((a, b) => a.doc.localeCompare(b.doc));
}

export async function planningReminderReport(root: string, state: State, latest: Snapshot | null): Promise<string> {
  const planningPaths = loadPlanningPaths(state);
  const parts: string[] = [];
  const pending = await pendingRegistration(root, latest, planningPaths);
  if (pending.length > 0) {
    parts.push(
      `待登记（锚点一）: ${pending.length} 份载体规划文档晚于最新基线——feature-map 登记 planned 了吗？（${pending
        .slice(0, 3)
        .map((d) => d.path)
        .join(", ")}${pending.length > 3 ? " …" : ""}）`,
    );
  }
  const arch = await pendingArchive(root);
  if (arch.planned + arch.inProgress > 0) {
    parts.push(
      `待归档（锚点二）: ${arch.planned} planned / ${arch.inProgress} in-progress——完成的请归档成果并推进 implemented`,
    );
  }
  const drifts = await sourceDrifts(root);
  if (drifts.length > 0) {
    parts.push(
      `源已变更待再转化: ${drifts.length} 份收编产物对应源文件有改动——按 40-guides/010-tool-adoption.md 增量再转化（${drifts
        .slice(0, 3)
        .map((d) => `${d.doc} ← ${d.sourcePath}`)
        .join(", ")}${drifts.length > 3 ? " …" : ""}）`,
    );
  }
  return parts.join("\n");
}

export const COMMON_CARRIER_DIRS: readonly string[] = [".specify/", "openspec/", "specs/", ".kiro/specs/", "_bmad-output/"];

export async function suggestCarriers(root: string, state: State): Promise<string[]> {
  const declared = loadPlanningPaths(state).map((p) => (p.endsWith("/") ? p : `${p}/`));
  const out: string[] = [];
  for (const dir of COMMON_CARRIER_DIRS) {
    const normalized = dir.endsWith("/") ? dir : `${dir}/`;
    if (declared.some((d) => d === normalized || normalized.startsWith(d))) continue;
    const docs = await carrierDocs(root, [normalized]);
    if (docs.length > 0) out.push(normalized);
  }
  return out;
}

export function detectCarrierShape(rel: string): string | null {
  if (rel.startsWith("openspec/")) return "OpenSpec";
  if (rel.startsWith(".specify/") || /^specs\/\d+-[^/]+\//.test(rel)) return "spec-kit";
  if (rel.startsWith(".kiro/specs/")) return "Kiro";
  return null;
}
