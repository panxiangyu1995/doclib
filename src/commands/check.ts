import { runCheckCore, type CheckFinding } from "../core/check.js";
import { loadState } from "../core/state.js";
import type { CommandResult } from "./init.js";

function kindLabel(kind: CheckFinding["kind"]): string {
  switch (kind) {
    case "unaccounted":
      return "漏更";
    case "uncovered":
      return "无归属";
    case "migration":
      return "迁移违规";
    case "guide-stale":
      return "引导过期";
    case "guide-feed-stale":
      return "反哺过期";
    case "guide-feed-walk":
      return "走查账违规";
    case "orphan-doc":
      return "孤儿文档";
    case "doc-quality":
      return "文档质量";
    case "genre":
      return "文体违规";
    case "carrier-unregistered":
      return "载体未登记";
    case "ledger-gap":
      return "进度账缺口";
    case "anchor-missing":
      return "沉淀锚点缺失";
    case "lesson-gap":
      return "教训账缺口";
    case "lesson-source":
      return "教训来源缺失";
    case "acceptance-anchor":
      return "验收锚点缺失";
    case "assumption-residue":
      return "假设残留";
    case "implementation-anchor":
      return "实施锚点缺失";
  }
}

export async function runCheck(root: string, opts: { json?: boolean; strict?: boolean }): Promise<CommandResult> {
  const r = await runCheckCore(root);
  if (opts.json) return { text: JSON.stringify(r, null, 2), json: r };

  const lines: string[] = [];
  const state = await loadState(root);
  const ledgerNote = r.hasDocLedger ? "" : "；旧基线无文档账，漏更检测降级——重新 doclib snapshot 后生效";
  lines.push(`强验证报告（基线 ${r.baseline}${ledgerNote}）`);
  lines.push(`revision: ${state.revision}`);
  lines.push(
    `代码漂移: +${r.stats.codeDrift.added}/~${r.stats.codeDrift.modified}/-${r.stats.codeDrift.removed} ｜ 文档变更: ${r.stats.docsChanged.length}`,
  );
  lines.push(`已对账: ${r.accounted} ｜ 文档先行: ${r.docFirst.length} ｜ 已豁免: ${r.exempted.length}`);
  lines.push("");
  const kinds: CheckFinding["kind"][] = [
    "unaccounted",
    "uncovered",
    "migration",
    "guide-stale",
    "guide-feed-stale",
    "guide-feed-walk",
    "orphan-doc",
    "doc-quality",
    "genre",
    "carrier-unregistered",
    "ledger-gap",
    "anchor-missing",
    "lesson-gap",
    "lesson-source",
    "acceptance-anchor",
    "assumption-residue",
    "implementation-anchor",
  ];
  let any = false;
  for (const kind of kinds) {
    const items = r.findings.filter((f) => f.kind === kind);
    if (items.length === 0) continue;
    any = true;
    lines.push(`${kindLabel(kind)} (${items.length})`);
    for (const f of items) {
      const extra = [f.docs !== undefined ? `覆盖文档未更新: ${f.docs.join(", ")}` : f.detail].filter(Boolean).join(" ｜ ");
      lines.push(`  - ${f.path ?? "?"}${extra ? `  —  ${extra}` : ""}`);
    }
  }
  if (!any) lines.push("违规: 无");
  const notices = r.notices;
  if (notices.length > 0) {
    const count = (k: (typeof notices)[number]["kind"]): number => notices.filter((n) => n.kind === k).length;
    const toolchain = count("toolchain-exempt");
    const guide = count("guide-exempt");
    const pointer = count("pointer-exempt");
    const suspect = count("toolchain-suspect");
    const ignored = count("newly-ignored");
    const assumptionDraft = count("assumption-draft");
    const parts: string[] = [];
    if (toolchain > 0) parts.push(`工具链豁免 ${toolchain}`);
    if (guide > 0) parts.push(`引导文件豁免 ${guide}`);
    if (pointer > 0) parts.push(`归档指针豁免 ${pointer}`);
    if (suspect > 0) parts.push(`疑似新工具目录 ${suspect}`);
    if (ignored > 0) parts.push(`新增忽略退出代码账 ${ignored}`);
    if (assumptionDraft > 0) parts.push(`假设残留(draft 警告) ${assumptionDraft}`);
    lines.push(`豁免与提示: ${parts.join(" ｜ ")}`);
    const suspectDirs = new Map<string, number>();
    for (const n of notices.filter((x) => x.kind === "toolchain-suspect")) {
      const dir = n.path !== undefined && !n.path.includes("/") ? n.path : (n.path ?? "").split("/")[0] ?? "";
      if (dir === "") continue;
      suspectDirs.set(dir, (suspectDirs.get(dir) ?? 0) + 1);
    }
    for (const [dir, files] of suspectDirs) {
      const detail = notices.find((x) => x.kind === "toolchain-suspect" && x.path === dir)?.detail ?? "";
      lines.push(`  - ${dir}/  —  ${files} 个文件｜${detail}`);
    }
  }
  lines.push("");
  const passed = r.findings.length === 0;
  lines.push(`strict 门禁: ${passed ? "通过" : `未通过（${r.findings.length} 项违规，--strict 时退出码 1）`}`);
  const p = r.health.parts;
  lines.push(
    `治理: ${r.health.score}/100 (${r.health.grade}) ｜ 对账 ${Math.round(p.accounting * 100)}% · 迁移 ${Math.round(p.migration * 100)}% · 归位 ${Math.round(p.placement * 100)}% · 引导 ${Math.round(p.guides * 100)}% · 质量 ${Math.round(p.quality * 100)}%`,
  );
  if (opts.strict === true && !passed) process.exitCode = 1;
  return { text: lines.join("\n"), json: r };
}
