import fs from "node:fs/promises";
import path from "node:path";
import type { Snapshot, State } from "./state.js";

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
  return parts.join("\n");
}
