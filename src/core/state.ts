import fs from "node:fs/promises";
import type { GitInfo } from "./gitinfo.js";

export const LIBRARY_DIR = "doclib";
export const STATE_DIR = ".doclib";
export const TASKS_DIR = `${STATE_DIR}/tasks`;
export const MAX_SNAPSHOTS = 20;
export const MAX_ARCHIVES = 200;

export type SnapshotStats = {
  files: number;
  primary: string;
  languages: Record<string, number>;
  frameworks: string[];
};

export type Snapshot = {
  id: string;
  version: number;
  at: string;
  note: string;
  stats: SnapshotStats;
  files: Record<string, string>;
  docs?: Record<string, string>;
  git?: GitInfo;
};

export type StateAck = {
  path: string;
  note: string;
  at: string;
  kind: "once" | "standing";
  baseline?: string;
};

export type ArchiveEntry = {
  id: string;
  kind: "archived" | "collected";
  from: string;
  to: string;
  reason: string;
  at: string;
  pointer?: string;
  originStatus?: string;
  originCovers?: string[];
};

export type State = {
  version: number;
  latest: string | null;
  snapshots: Snapshot[];
  structureVersion: number;
  agents: string[];
  acks: StateAck[];
  revision: number;
  planning: string[];
  archives: ArchiveEntry[];
  dirExempts: string[];
};

export class DoclibError extends Error {}

export const DEFAULT_PLANNING = [".plan/"];

export function emptyState(): State {
  return {
    version: 0,
    latest: null,
    snapshots: [],
    structureVersion: 0,
    agents: [],
    acks: [],
    revision: 0,
    planning: [...DEFAULT_PLANNING],
    archives: [],
    dirExempts: [],
  };
}

async function backupCorruptState(root: string, p: string): Promise<void> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  await fs.copyFile(p, `${root}/${STATE_DIR}/state.json.corrupt-${stamp}`).catch(() => {});
}

export async function loadState(root: string): Promise<State> {
  const p = `${root}/${STATE_DIR}/state.json`;
  let raw: string;
  try {
    raw = await fs.readFile(p, "utf8");
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") return emptyState();
    await backupCorruptState(root, p);
    throw new DoclibError(`状态文件 ${STATE_DIR}/state.json 不可读（${code ?? String(e)}）：已尝试备份为 state.json.corrupt-*，请从备份或 git 恢复后重试`);
  }
  let parsed: Partial<State>;
  try {
    parsed = JSON.parse(raw) as Partial<State>;
  } catch {
    await backupCorruptState(root, p);
    throw new DoclibError(`状态文件 ${STATE_DIR}/state.json 已损坏（含空文件）：已备份为 state.json.corrupt-*，请从备份或 git 恢复后重试`);
  }
  if (typeof parsed.version !== "number" || !Array.isArray(parsed.snapshots)) return emptyState();
  return {
    version: parsed.version,
    latest: parsed.latest ?? null,
    snapshots: parsed.snapshots,
    structureVersion: parsed.structureVersion ?? 1,
    agents: Array.isArray(parsed.agents) ? parsed.agents : [],
    acks: Array.isArray(parsed.acks) ? parsed.acks : [],
    revision: typeof parsed.revision === "number" ? parsed.revision : 0,
    planning: Array.isArray(parsed.planning) && parsed.planning.length > 0 ? parsed.planning : [...DEFAULT_PLANNING],
    archives: Array.isArray(parsed.archives) ? parsed.archives : [],
    dirExempts: Array.isArray(parsed.dirExempts) ? parsed.dirExempts : [],
  };
}

export async function saveState(root: string, state: State): Promise<void> {
  state.snapshots = state.snapshots.slice(-MAX_SNAPSHOTS);
  state.archives = state.archives.slice(-MAX_ARCHIVES);
  await fs.mkdir(`${root}/${STATE_DIR}`, { recursive: true });
  await fs.writeFile(`${root}/${STATE_DIR}/state.json`, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export function latestSnapshot(state: State): Snapshot | null {
  if (state.latest === null) return null;
  return state.snapshots.find((s) => s.id === state.latest) ?? null;
}

export type Drift = { added: string[]; removed: string[]; modified: string[] };

export function computeDrift(baseline: Record<string, string>, current: Record<string, string>): Drift {
  const added: string[] = [];
  const removed: string[] = [];
  const modified: string[] = [];
  for (const [p, h] of Object.entries(current)) {
    const old = baseline[p];
    if (old === undefined) added.push(p);
    else if (old !== h) modified.push(p);
  }
  for (const p of Object.keys(baseline)) {
    if (current[p] === undefined) removed.push(p);
  }
  return { added, removed, modified };
}

export function pad3(n: number): string {
  return String(n).padStart(3, "0");
}

export function nextArchiveId(state: State): string {
  let max = 0;
  for (const a of state.archives) {
    const m = /^arc-(\d+)$/.exec(a.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `arc-${pad3(max + 1)}`;
}
