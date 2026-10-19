import { DoclibError, latestSnapshot, loadState, saveState } from "../core/state.js";
import type { CommandResult } from "./init.js";

export async function runAck(
  root: string,
  opts: { path?: string; note?: string; standing?: boolean; remove?: boolean },
): Promise<CommandResult> {
  if (!opts.path) throw new DoclibError("ack 需要路径参数：doclib ack <路径> [--note 文本] [--standing] [--remove]");
  const state = await loadState(root);

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
