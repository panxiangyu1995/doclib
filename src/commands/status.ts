import fs from "node:fs/promises";
import path from "node:path";
import { collectFiles, hashAll } from "../core/fsutil.js";
import { detectProject } from "../core/detect.js";
import { LIBRARY_DIR, STATE_DIR, TASKS_DIR, latestSnapshot, loadState, computeDrift } from "../core/state.js";
import { guideBudgetReport, guideStampReport, libraryFingerprint, readGuideProject } from "../core/guides.js";
import { loadPlanningPaths, planningReminderReport, planningIgnores, suggestCarriers } from "../core/planning.js";
import { runCheckCore } from "../core/check.js";
import { LIBRARY_VOLUMES } from "../core/place.js";
import { readHookState } from "./hook.js";
import type { CommandResult } from "./init.js";

export async function runStatus(root: string, opts: { json?: boolean } = {}): Promise<CommandResult> {
  const state = await loadState(root);
  const latest = latestSnapshot(state);
  const lines: string[] = [];

  const libExists = await fs
    .access(path.join(root, LIBRARY_DIR))
    .then(() => true)
    .catch(() => false);
  lines.push(`图书馆: ${libExists ? `${LIBRARY_DIR}/ (version ${state.version})` : `${LIBRARY_DIR}/ 未初始化（运行 doclib init）`}`);
  lines.push(
    `结构版本: ${state.structureVersion}${state.agents.length > 0 ? ` · agents: ${state.agents.join(", ")}` : ""}`,
  );
  let stamp: string;
  let budget: string;
  try {
    stamp = await guideStampReport(root);
    budget = await guideBudgetReport(root);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    stamp = `⚠ ${msg}`;
    budget = `⚠ guide-project.md 异常 → 修正后重跑`;
  }
  let feedLine: string;
  try {
    const feed = await readGuideProject(root);
    if (feed === null) {
      feedLine = "未蒸馏（建馆完成后由 doclib-build/accept 蒸馏填充 .doclib/guide-project.md）";
    } else {
      const fp = await libraryFingerprint(root);
      const stale = feed.docsHash !== null && feed.docsHash !== fp;
      let walkPart: string;
      if (feed.walk === null) walkPart = " · 走查 未留账 ⚠（重蒸馏时补 12 卷裁决）";
      else if (feed.walk === "invalid") walkPart = " · 走查 非法 ⚠（volumes-fed/volumes-na 须为内联列表）";
      else {
        const covered = new Set(feed.walk.fed);
        for (const v of feed.walk.na) covered.add(v);
        walkPart = ` · 走查 ${covered.size}/${LIBRARY_VOLUMES.length}`;
      }
      feedLine = `snapshot ${feed.snapshot ?? "?"} · fingerprint ${(feed.docsHash ?? "?").slice(0, 12)}${stale ? " ⚠ 反哺过期 → 重新蒸馏" : ""}${walkPart}`;
    }
  } catch (e) {
    feedLine = `⚠ ${e instanceof Error ? e.message : String(e)}`;
  }
  lines.push(`引导: ${stamp}`);
  lines.push(`引导预算: ${budget}`);
  lines.push(`反哺: ${feedLine}`);
  lines.push(
    latest
      ? `基线: ${latest.id} @ ${latest.at}${latest.note ? `（${latest.note}）` : ""} · 快照链 ${state.snapshots.length} 条 · revision ${state.revision}`
      : "基线: 无（尚未 snapshot）",
  );

  let drift: { added: number; modified: number; removed: number } | null = null;
  let health: { score: number; grade: "A" | "B" | "C" | "D" | "F" } | null = null;
  if (latest) {
    const files = await collectFiles(root, planningIgnores(loadPlanningPaths(state)));
    const hashes = await hashAll(root, files);
    const d = computeDrift(latest.files, hashes);
    drift = { added: d.added.length, modified: d.modified.length, removed: d.removed.length };
    lines.push(
      `漂移: +${drift.added} 新增 / ~${drift.modified} 修改 / -${drift.removed} 删除（相对 ${latest.id}）`,
    );
    try {
      const h = (await runCheckCore(root)).health;
      health = { score: h.score, grade: h.grade };
      lines.push(`治理: ${h.score}/100 (${h.grade})`);
    } catch {
      lines.push("治理: -");
    }
  } else {
    lines.push("漂移: -");
    lines.push("治理: -");
  }

  const reminder = await planningReminderReport(root, state, latest);
  if (reminder.length > 0) {
    lines.push(reminder);
  }
  const carrierSuggestions = await suggestCarriers(root, state);
  if (carrierSuggestions.length > 0) {
    lines.push(`载体建议: ${carrierSuggestions.join(", ")} 为常见规划载体（未声明）→ init --planning 声明后进入双轨提醒`);
  }

  const files0 = await collectFiles(root, planningIgnores(loadPlanningPaths(state)));
  const det = await detectProject(root, files0);
  lines.push(`检测: 主语言 ${det.primary}${det.frameworks.length > 0 ? ` · 框架 ${det.frameworks.join(", ")}` : ""}`);

  const hookState = await readHookState(root);
  lines.push(
    `提交门禁: ${hookState === "doclib-strict" ? "已安装(--strict)" : hookState === "doclib" ? "已安装" : "未安装"}`,
  );

  const tasks = await fs.readdir(path.join(root, TASKS_DIR)).catch(() => [] as string[]);
  lines.push(`任务书: ${tasks.length > 0 ? tasks.join(", ") : "无"}`);
  lines.push("");
  if (opts.json) {
    const payload = {
      library: {
        initialized: libExists,
        version: state.version,
        structureVersion: state.structureVersion,
        agents: state.agents,
      },
      revision: state.revision,
      baseline: latest
        ? { id: latest.id, at: latest.at, note: latest.note, snapshotCount: state.snapshots.length }
        : null,
      drift,
      health,
      planning: { paths: loadPlanningPaths(state), reminder, carrierSuggestions },
      guides: { stamp, budget, feed: feedLine },
      hook: hookState,
      detection: det,
      tasks,
    };
    return { text: JSON.stringify(payload, null, 2), json: payload };
  }
  return { text: lines.join("\n"), json: { state, detection: det } };
}
