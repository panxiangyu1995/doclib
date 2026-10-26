import { DoclibError, loadState, saveState } from "../core/state.js";
import { scanExternalDocs } from "../core/orphan.js";
import {
  applyArchive,
  applyCollect,
  applyRestore,
  archiveDoc,
  collectDoc,
  restoreDoc,
  suggestPlacement,
} from "../core/place.js";
import type { CommandResult } from "./init.js";

export type PlaceOptions = {
  action: "list" | "collect" | "archive" | "ack" | "restore";
  path?: string;
  to?: string;
  reason?: string;
  note?: string;
  apply?: boolean;
  json?: boolean;
};

function requirePath(opts: PlaceOptions): string {
  if (!opts.path) throw new DoclibError("place 需要路径参数：doclib place <子命令> <路径>");
  return opts.path;
}

async function runList(root: string, opts: PlaceOptions): Promise<CommandResult> {
  const scan = await scanExternalDocs(root);
  const pending = scan.pending;
  const entries: Array<{ path: string; suggestions: Awaited<ReturnType<typeof suggestPlacement>> }> = [];
  for (const d of pending) {
    entries.push({ path: d.path, suggestions: await suggestPlacement(root, d.path) });
  }
  if (opts.json === true) return { text: JSON.stringify({ pending: entries }, null, 2), json: { pending: entries } };
  if (entries.length === 0) {
    return { text: "待归位文档: 0（馆外无待处置文档）\n", json: { pending: entries } };
  }
  const lines: string[] = [`待归位文档 (${entries.length})`, ""];
  for (const e of entries) {
    lines.push(e.path);
    const isCarrier = e.suggestions.some((s) => s.carrier === true);
    for (const s of e.suggestions.slice(0, 3)) {
      if (s.carrier === true) {
        lines.push(`  建议: ${s.reason}`);
        continue;
      }
      lines.push(`  建议: ${s.volume}/${s.dir}（${s.confidence} · ${s.reason}）`);
    }
    if (!isCarrier) {
      lines.push(`  收编: doclib place collect ${e.path} --to <卷> --apply`);
      lines.push(`  入棺: doclib place archive ${e.path} --reason "<失效原因>" --apply`);
    }
    lines.push(`  豁免: doclib ack ${e.path} --standing --note "<理由>"`);
    lines.push("");
  }
  lines.push("提示: 所有写操作默认干跑，加 --apply 才执行。");
  return { text: lines.join("\n"), json: { pending: entries } };
}

async function runCollect(root: string, opts: PlaceOptions): Promise<CommandResult> {
  const rel = requirePath(opts);
  if (!opts.to) throw new DoclibError("收编必须指定目标卷：doclib place collect <路径> --to <卷/分区> [--apply]");
  const plan = await collectDoc(root, rel, opts.to);
  if (opts.apply !== true) {
    const text = [
      `收编计划（干跑，未执行）`,
      `  源: ${plan.from}`,
      `  目标: ${plan.to}`,
      `  ${plan.detail}`,
      "",
      "确认后执行: doclib place collect " + rel + " --to " + opts.to + " --apply",
    ].join("\n");
    return { text, json: { ...plan, dryRun: true } };
  }
  const state = await loadState(root);
  const result = await applyCollect(root, state, rel, opts.to);
  await saveState(root, state);
  return { text: `已收编: ${result.from} → ${result.to}\n${result.detail}\n`, json: result };
}

async function runArchive(root: string, opts: PlaceOptions): Promise<CommandResult> {
  const rel = requirePath(opts);
  if (!opts.reason) throw new DoclibError("入棺必须指定失效原因：doclib place archive <路径> --reason \"<原因>\" [--apply]");
  const plan = await archiveDoc(root, rel, opts.reason);
  if (opts.apply !== true) {
    const text = [
      `入棺计划（干跑，未执行）`,
      `  源: ${plan.from}`,
      `  目标: ${plan.to}`,
      `  ${plan.detail}`,
      "  墓碑五要素: 何时失效 / 为何失效 / 取代者指针 / 原路径 / 归档方式",
      "  原路径将留指针文件（防断链）；可用 doclib place restore <arc-id> 还原",
      "",
      "确认后执行: doclib place archive " + rel + ' --reason "' + opts.reason + '" --apply',
    ].join("\n");
    return { text, json: { ...plan, dryRun: true } };
  }
  const state = await loadState(root);
  const result = await applyArchive(root, state, rel, opts.reason);
  await saveState(root, state);
  return { text: `已入棺: ${result.from} → ${result.to}\n${result.detail}\n`, json: result };
}

async function runAckPlace(root: string, opts: PlaceOptions): Promise<CommandResult> {
  const rel = requirePath(opts);
  if (!opts.note) throw new DoclibError("登记豁免必须给理由：doclib place ack <路径> --note \"<理由>\"");
  const state = await loadState(root);
  state.acks.push({
    path: rel,
    note: opts.note,
    at: new Date().toISOString(),
    kind: "standing",
  });
  await saveState(root, state);
  return { text: `已登记豁免: ${rel}（standing，长期有效）\n`, json: { path: rel, kind: "standing" } };
}

async function runRestore(root: string, opts: PlaceOptions): Promise<CommandResult> {
  const id = requirePath(opts);
  const state = await loadState(root);
  const plan = await restoreDoc(root, state, id);
  if (opts.apply !== true) {
    const text = [
      `还原计划（干跑，未执行）`,
      `  源: ${plan.from}`,
      `  目标: ${plan.to}`,
      `  ${plan.detail}`,
      "",
      "确认后执行: doclib place restore " + id + " --apply",
    ].join("\n");
    return { text, json: { ...plan, dryRun: true } };
  }
  const result = await applyRestore(root, state, id);
  await saveState(root, state);
  return { text: `已还原: ${result.from} → ${result.to}\n${result.detail}\n`, json: result };
}

export async function runPlace(root: string, opts: PlaceOptions): Promise<CommandResult> {
  switch (opts.action) {
    case "list":
      return runList(root, opts);
    case "collect":
      return runCollect(root, opts);
    case "archive":
      return runArchive(root, opts);
    case "ack":
      return runAckPlace(root, opts);
    case "restore":
      return runRestore(root, opts);
    default:
      throw new DoclibError(`未知 place 子命令：${opts.action}（可选: list / collect / archive / ack / restore）`);
  }
}
