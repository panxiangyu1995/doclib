import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import { DoclibError, STATE_DIR, loadState } from "./state.js";

const execFileAsync = promisify(execFile);

export const MAIN_BRANCHES = ["main", "master"];

export const EXEC_MAX_BUFFER = 64 * 1024 * 1024;

export type BranchStatus = "active" | "merged" | "abandoned";

export type BranchEntry = {
  name: string;
  createdAt: string;
  purpose: string;
  status: BranchStatus;
  divergence: string;
  refs: string[];
};

export type BranchLedger = { entries: BranchEntry[]; invalid: string[] };

export type BranchAudit = {
  base: string;
  docDiff: { added: string[]; modified: string[]; removed: string[] };
  revision: { current: number; base: number | null };
  snapshotCollisions: string[];
  notes: string[];
};

const BRANCH_STATUS_SET: readonly BranchStatus[] = ["active", "merged", "abandoned"];

function splitRefs(cell: string): string[] {
  return cell
    .split(/[、,;，；\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function renderBranchRow(entry: BranchEntry): string {
  return `| ${entry.name} | ${entry.createdAt} | ${entry.purpose} | ${entry.status} | ${entry.divergence} | ${entry.refs.join(" ")} |`;
}

export function parseBranchLedger(raw: string): BranchLedger {
  const entries: BranchEntry[] = [];
  const invalid: string[] = [];
  for (const rawLine of raw.split("\n")) {
    const line = rawLine.trim();
    if (!line.startsWith("|") || !line.endsWith("|")) continue;
    const cells = line
      .slice(1, -1)
      .split("|")
      .map((c) => c.trim());
    if (cells.length < 6) continue;
    const name = cells[0]!;
    if (name === "分支" || /^[-: ]+$/.test(name)) continue;
    const status = cells[3]!;
    if (!BRANCH_STATUS_SET.includes(status as BranchStatus)) {
      invalid.push(line);
      continue;
    }
    entries.push({
      name,
      createdAt: cells[1]!,
      purpose: cells[2]!,
      status: status as BranchStatus,
      divergence: cells[4]!,
      refs: splitRefs(cells[5]!),
    });
  }
  return { entries, invalid };
}

export async function readBranchLedger(root: string): Promise<BranchLedger | null> {
  const p = path.join(root, "doclib", "00-overview", "branches.md");
  const raw = await fs.readFile(p, "utf8").catch(() => null);
  if (raw === null) return null;
  return parseBranchLedger(raw);
}

export async function listGitBranches(root: string): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync("git", ["branch", "--format=%(refname:short)"], { cwd: root, maxBuffer: EXEC_MAX_BUFFER });
    return stdout
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  } catch {
    return [];
  }
}

export async function detectMainBranch(root: string): Promise<string | null> {
  const branches = await listGitBranches(root);
  for (const candidate of MAIN_BRANCHES) {
    if (branches.includes(candidate)) return candidate;
  }
  return null;
}

function parseNameStatus(stdout: string): { added: string[]; modified: string[]; removed: string[]; notes: string[] } {
  const added: string[] = [];
  const modified: string[] = [];
  const removed: string[] = [];
  const notes: string[] = [];
  for (const line of stdout.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    const tab = trimmed.indexOf("\t");
    const code = tab >= 0 ? trimmed.slice(0, tab).trim() : trimmed.slice(0, 1);
    let file = tab >= 0 ? trimmed.slice(tab + 1).trim() : "";
    file = file.replace(/^doclib\//, "");
    if (file.length === 0) continue;
    if (code === "A") added.push(file);
    else if (code === "M") modified.push(file);
    else if (code === "D") removed.push(file);
    else notes.push(`${code} ${file}（改名/复制类变更，请人工确认）`);
  }
  return { added, modified, removed, notes };
}

function snapshotCollisionsOf(
  currentSnaps: Array<{ id: string; at: string }>,
  baseSnaps: Array<{ id: string; at: string }>,
): string[] {
  const baseById = new Map(baseSnaps.map((s) => [s.id, s.at]));
  const collisions: string[] = [];
  for (const cur of currentSnaps) {
    const baseAt = baseById.get(cur.id);
    if (baseAt !== undefined && baseAt !== cur.at) collisions.push(cur.id);
  }
  return collisions;
}

export async function analyzeBranchDiff(root: string, base?: string): Promise<BranchAudit> {
  const resolved = base ?? (await detectMainBranch(root));
  if (!resolved) {
    throw new DoclibError("无法确定主分支（git 不可用或本地无 main/master）：请显式指定基准分支，如 doclib branch diff main");
  }
  if (resolved.startsWith("-")) {
    throw new DoclibError(`非法基准分支: ${resolved}（不得以 - 开头——防 git 参数注入）`);
  }
  let stdout: string;
  try {
    ({ stdout } = await execFileAsync("git", ["diff", "--name-status", `${resolved}...HEAD`, "--", "doclib/", ".doclib/"], {
      cwd: root,
      maxBuffer: EXEC_MAX_BUFFER,
    }));
  } catch {
    throw new DoclibError(`分支差异读取失败（git diff ${resolved}...HEAD）：请确认基准分支存在且当前在 git 仓库内`);
  }
  const parsed = parseNameStatus(stdout);
  const notes = [...parsed.notes];

  let currentRevision = 0;
  let currentSnaps: Array<{ id: string; at: string }> = [];
  try {
    const state = await loadState(root);
    currentRevision = state.revision;
    currentSnaps = state.snapshots.map((s) => ({ id: s.id, at: s.at }));
  } catch {
    notes.push("当前分支簿记 .doclib/state.json 不可读，revision/快照对照缺失");
  }

  let baseRevision: number | null = null;
  let baseSnaps: Array<{ id: string; at: string }> = [];
  try {
    const { stdout: raw } = await execFileAsync("git", ["show", `${resolved}:${STATE_DIR}/state.json`], {
      cwd: root,
      maxBuffer: EXEC_MAX_BUFFER,
    });
    const parsedState = JSON.parse(raw) as { revision?: number; snapshots?: Array<{ id: string; at: string }> };
    baseRevision = typeof parsedState.revision === "number" ? parsedState.revision : null;
    baseSnaps = Array.isArray(parsedState.snapshots) ? parsedState.snapshots : [];
  } catch {
    notes.push(`主分支 ${resolved} 无可读簿记（尚未 snapshot 或 state.json 缺失），revision/快照对照缺失`);
  }

  return {
    base: resolved,
    docDiff: { added: parsed.added, modified: parsed.modified, removed: parsed.removed },
    revision: { current: currentRevision, base: baseRevision },
    snapshotCollisions: snapshotCollisionsOf(currentSnaps, baseSnaps),
    notes,
  };
}
