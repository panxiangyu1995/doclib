import fs from "node:fs/promises";
import path from "node:path";
import { DoclibError, latestSnapshot, loadState, saveState } from "../core/state.js";
import type { CommandResult } from "./init.js";

export async function runAck(
  root: string,
  opts: { path?: string; note?: string; standing?: boolean; remove?: boolean; dir?: boolean },
): Promise<CommandResult> {
  if (!opts.path) throw new DoclibError("ack 需要路径参数：doclib ack <路径> [--note 文本] [--standing] [--remove] | doclib ack --dir <目录前缀> [--note 文本] [--remove]");
  const state = await loadState(root);

  if (opts.dir === true) {
    const prefix = opts.path.replace(/\/+$/, "") + "/";
    if (opts.remove === true) {
      const before = state.dirExempts.length;
      state.dirExempts = state.dirExempts.filter((p) => p !== prefix);
      const removed = before - state.dirExempts.length;
      await saveState(root, state);
      return { text: `已移除目录豁免: ${prefix}（${removed} 条）\n`, json: { removed, prefix } };
    }
    const dirAbs = path.join(root, prefix.replace(/\/$/, ""));
    const isDir = await fs
      .stat(dirAbs)
      .then((s) => s.isDirectory())
      .catch(() => false);
    if (!isDir) {
      throw new DoclibError(`目录豁免目标不存在或不是目录：${prefix}——目录豁免用于已存在的 agent 工具目录（拼写错误会永久无效）`);
    }
    if (!state.dirExempts.includes(prefix)) state.dirExempts.push(prefix);
    await saveState(root, state);
    return {
      text: `已登记目录豁免: ${prefix}（长期有效，--remove 可移除）——不判孤儿但仍进代码账；完全不跟踪请用 .doclibignore\n`,
      json: { prefix, dirExempts: state.dirExempts },
    };
  }

  if (opts.remove === true) {
    const before = state.acks.length;
    state.acks = state.acks.filter((a) => a.path !== opts.path);
    const removed = before - state.acks.length;
    await saveState(root, state);
    return { text: `已移除 ${opts.path} 的 ${removed} 条豁免。\n`, json: { removed } };
  }

  const kind = opts.standing === true ? "standing" : "once";
  state.acks.push({
    path: opts.path,
    note: opts.note ?? "",
    at: new Date().toISOString(),
    kind,
    baseline: kind === "once" ? (latestSnapshot(state)?.id ?? undefined) : undefined,
  });
  await saveState(root, state);
  const hint = kind === "once" ? "（once：下次 snapshot 自动清除）" : "（standing：长期豁免，--remove 可移除）";
  return { text: `已登记豁免: ${opts.path} ${hint}\n`, json: { path: opts.path, kind } };
}
