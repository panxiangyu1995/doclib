import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { emptyState, saveState, type Snapshot, type State } from "../core/state.js";

const execFileAsync = promisify(execFile);

export async function tmpRoot(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

export async function put(root: string, rel: string, content: string): Promise<void> {
  const abs = path.join(root, rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, content, "utf8");
}

export async function get(root: string, rel: string): Promise<string> {
  return fs.readFile(path.join(root, rel), "utf8");
}

export async function has(root: string, rel: string): Promise<boolean> {
  return fs
    .access(path.join(root, rel))
    .then(() => true)
    .catch(() => false);
}

export async function seedState(root: string, patch: Partial<State> = {}): Promise<State> {
  const state: State = { ...emptyState(), ...patch };
  await saveState(root, state);
  return state;
}

export function snapshotRow(version: number, files: string[], at = "2026-10-19T00:00:00.000Z", docs?: string[]): Snapshot {
  const map: Record<string, string> = {};
  for (const f of files) map[f] = `hash-${f}`;
  const snap: Snapshot = {
    id: `snap-${String(version).padStart(3, "0")}`,
    version,
    at,
    note: "",
    stats: { files: files.length, primary: "TypeScript", languages: { TypeScript: files.length }, frameworks: [] },
    files: map,
  };
  if (docs) {
    const dmap: Record<string, string> = {};
    for (const d of docs) dmap[d] = `hash-${d}`;
    snap.docs = dmap;
  }
  return snap;
}

export function docMd(title: string, covers: string[], body = "行为与验收标准\n"): string {
  const fill = (tag: string) =>
    Array.from({ length: 4 }, (_, i) => `${tag}叙述行 ${i}：行为、边界与错误处理说明。`).join("\n");
  return [
    "---",
    `title: ${title}`,
    "covers:",
    ...covers.map((c) => `  - ${c}`),
    "status: stable",
    "---",
    "",
    `# ${title}`,
    "",
    `导读：${title} 的行为、契约与验收标准。`,
    "",
    "## 为什么",
    "",
    fill("为什么"),
    "",
    "## 是什么",
    "",
    fill("是什么"),
    "",
    "## 怎么运转",
    "",
    body,
    fill("怎么运转"),
    "",
  ].join("\n");
}

export const CLI_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "dist", "cli.js");

export type CliRun = { code: number; stdout: string; stderr: string };

export async function cli(args: string[], cwd: string): Promise<CliRun> {
  try {
    const { stdout } = await execFileAsync(process.execPath, [CLI_PATH, ...args], {
      cwd,
      env: { ...process.env, CI: "1" },
      timeout: 120_000,
      maxBuffer: 64 * 1024 * 1024,
    });
    return { code: 0, stdout, stderr: "" };
  } catch (e) {
    const err = e as NodeJS.ErrnoException & { code?: number | string; stdout?: string; stderr?: string };
    if (typeof err.code !== "number") throw err;
    return { code: err.code, stdout: err.stdout ?? "", stderr: err.stderr ?? "" };
  }
}
