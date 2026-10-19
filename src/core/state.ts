import fs from "node:fs/promises";
import { readFileOrNull } from "./fsutil.js";

export const LIBRARY_DIR = "doclib";
export const STATE_DIR = ".doclib";
export const TASKS_DIR = `${STATE_DIR}/tasks`;
export const MAX_SNAPSHOTS = 20;

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
};

export type State = {
  version: number;
  latest: string | null;
  snapshots: Snapshot[];
  structureVersion: number;
  agents: string[];
};

export class DoclibError extends Error {}

export function emptyState(): State {
  return { version: 0, latest: null, snapshots: [], structureVersion: 0, agents: [] };
}

export async function loadState(root: string): Promise<State> {
  const raw = await readFileOrNull(`${root}/${STATE_DIR}/state.json`);
  if (!raw) return emptyState();
  try {
    const parsed = JSON.parse(raw) as Partial<State>;
    if (typeof parsed.version !== "number" || !Array.isArray(parsed.snapshots)) return emptyState();
    return {
      version: parsed.version,
      latest: parsed.latest ?? null,
      snapshots: parsed.snapshots,
      structureVersion: parsed.structureVersion ?? 1,
      agents: Array.isArray(parsed.agents) ? parsed.agents : [],
    };
  } catch {
    return emptyState();
  }
}

export async function saveState(root: string, state: State): Promise<void> {
  state.snapshots = state.snapshots.slice(-MAX_SNAPSHOTS);
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
