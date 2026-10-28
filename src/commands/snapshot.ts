import path from "node:path";
import { collectFiles, hashAll } from "../core/fsutil.js";
import { detectProject } from "../core/detect.js";
import { hashDocs } from "../core/ledger.js";
import { DoclibError, LIBRARY_DIR, loadState, pad3, saveState, type Snapshot } from "../core/state.js";
import { readGitInfo } from "../core/gitinfo.js";
import { loadPlanningPaths, planningIgnores } from "../core/planning.js";
import type { CommandResult } from "./init.js";

export async function runSnapshot(root: string, opts: { note?: string }): Promise<CommandResult> {
  const state = await loadState(root);
  let files: string[];
  try {
    files = await collectFiles(root, planningIgnores(loadPlanningPaths(state)));
  } catch {
    throw new DoclibError("无法读取当前目录");
  }
  const hashes = await hashAll(root, files);
  const docs = await hashDocs(root);
  const det = await detectProject(root, files);

  const version = state.version + 1;
  const git = await readGitInfo(root);
  const snapshot: Snapshot = {
    id: `snap-${pad3(version)}`,
    version,
    at: new Date().toISOString(),
    note: opts.note ?? "",
    stats: {
      files: files.length,
      primary: det.primary,
      languages: det.languages,
      frameworks: det.frameworks,
    },
    files: hashes,
    docs,
  };
  if (git) snapshot.git = git;
  state.snapshots.push(snapshot);
  state.latest = snapshot.id;
  state.version = version;
  state.revision += 1;
  state.acks = state.acks.filter((a) => a.kind === "standing");
  await saveState(root, state);

  const text = [
    `基线已记录: ${snapshot.id} (library version ${version})`,
    `文件: ${files.length} ｜ 文档账: ${Object.keys(docs).length}`,
    `revision: ${state.revision}`,
    `主语言: ${det.primary}`,
    `框架: ${det.frameworks.length > 0 ? det.frameworks.join(", ") : "未检测到"}`,
    "",
    `图书馆: ${LIBRARY_DIR}/ ｜ 簿记: .doclib/state.json`,
    "",
  ].join("\n");
  return { text, json: { id: snapshot.id, version, files: files.length, docs: Object.keys(docs).length } };
}

export function libraryRootOf(root: string): string {
  return path.join(root, LIBRARY_DIR);
}
