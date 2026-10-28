import fs from "node:fs/promises";
import path from "node:path";
import {
  analyzeBranchDiff,
  listGitBranches,
  readBranchLedger,
  renderBranchRow,
  type BranchAudit,
  type BranchLedger,
} from "../core/branch.js";
import { DoclibError } from "../core/state.js";
import type { CommandResult } from "./init.js";

const LEDGER_PATH = path.join("doclib", "00-overview", "branches.md");
const LEDGER_HEADER = `---
title: 分支账
covers:
  - src/commands/branch.ts
  - src/core/branch.ts
status: living
---

# 分支账

> 主馆与分馆的唯一登记面。每条 git 分支一行：分支名 / 创建日期 / 目的 / 状态（active → merged | abandoned）/ 与主馆差异摘要 / 关联（功能号、.plan 载体、基线快照 ID）。
> 蒸馏或开发新建分支时先登记；合并回主馆后翻 merged 保留史；废弃翻 abandoned。progress 条目在分馆工作时带 \`[branch:分支名]\` 标注。

| 分支 | 创建日期 | 目的 | 状态 | 差异摘要 | 关联 |
| --- | --- | --- | --- | --- | --- |
`;

function describeLedger(l: BranchLedger): string {
  const lines: string[] = [];
  for (const e of l.entries) {
    lines.push(`  ${e.name}  ${e.status}  ${e.purpose}${e.refs.length > 0 ? `（${e.refs.join(" ")}）` : ""}`);
  }
  return lines.join("\n");
}

function describeAudit(a: BranchAudit): string {
  const { docDiff, revision } = a;
  const total = docDiff.added.length + docDiff.modified.length + docDiff.removed.length;
  const lines: string[] = [
    `分馆审计: 当前 HEAD vs ${a.base}（相对 merge-base，聚焦分馆侧引入）`,
    `馆内差异: +${docDiff.added.length} 新增 / ~${docDiff.modified.length} 修改 / -${docDiff.removed.length} 删除`,
  ];
  const section = (title: string, items: string[]): void => {
    if (items.length === 0) return;
    lines.push(`${title} (${items.length})`);
    for (const p of items.slice(0, 50)) lines.push(`  ${p}`);
    if (items.length > 50) lines.push(`  … 其余 ${items.length - 50} 项`);
  };
  section("新增", docDiff.added);
  section("修改", docDiff.modified);
  section("删除", docDiff.removed);
  lines.push(
    `revision: 分馆 ${revision.current}${revision.base !== null ? ` ｜ 主馆 ${revision.base}（合并后主馆 revision 需接力递增）` : " ｜ 主馆无簿记"}`,
  );
  lines.push(
    a.snapshotCollisions.length > 0
      ? `快照撞号: ${a.snapshotCollisions.join(", ")}（两侧同号不同内容 → 合并后建议重新 snapshot 固化）`
      : "快照撞号: 无",
  );
  for (const n of a.notes) lines.push(`注: ${n}`);
  if (total === 0 && a.snapshotCollisions.length === 0) lines.push("无馆内差异，合并无图书馆冲突面。");
  lines.push("提示: 合并动作本身交给 git；合并后在主馆运行 doclib check 校验，并更新分支账状态为 merged。");
  return lines.join("\n");
}

export async function runBranch(
  root: string,
  opts: { action?: string; name?: string; note?: string; base?: string; json?: boolean },
): Promise<CommandResult> {
  const action = opts.action ?? "list";
  if (action === "list") {
    const ledger = await readBranchLedger(root);
    const gitBranches = await listGitBranches(root);
    const payload: Record<string, unknown> = { ledger: ledger?.entries ?? [], gitBranches };
    if (ledger === null) {
      const text = [
        `分支账未建立: ${LEDGER_PATH}`,
        "主分支请先登记主馆条目: doclib branch register main --note <主馆说明>",
      ].join("\n");
      return { text, json: payload };
    }
    const ledgerNames = new Set(ledger.entries.map((e) => e.name));
    const unregistered = gitBranches.filter((b) => !ledgerNames.has(b));
    const missingInGit = ledger.entries.filter((e) => e.status === "active" && !gitBranches.includes(e.name));
    const lines = [
      `分支账: ${LEDGER_PATH}（${ledger.entries.length} 条）`,
      describeLedger(ledger),
      "",
    ];
    if (unregistered.length > 0) {
      lines.push(`git 本地分支未登记: ${unregistered.join(", ")} → doclib branch register <分支> --note <目的>`);
    }
    if (missingInGit.length > 0) {
      lines.push(`账内 active 但分支已不存在: ${missingInGit.map((e) => e.name).join(", ")} → 翻状态 merged 或 abandoned`);
    }
    if (ledger.invalid.length > 0) {
      lines.push(`非法行 ${ledger.invalid.length} 条（状态须为 active/merged/abandoned）`);
    }
    if (unregistered.length === 0 && missingInGit.length === 0 && ledger.invalid.length === 0) {
      lines.push("账实一致。");
    }
    return { text: lines.join("\n"), json: payload };
  }
  if (action === "register") {
    const name = opts.name;
    if (!name || name.length === 0) throw new DoclibError("用法: doclib branch register <分支名> --note <目的>");
    const purpose = opts.note ?? "";
    if (purpose.length === 0) throw new DoclibError("登记分支须附目的: doclib branch register <分支名> --note <目的>");
    if (name.includes("|") || name.includes("\n")) {
      throw new DoclibError(`非法分支名: ${name.slice(0, 40)}（分支账为 Markdown 表格，禁用竖线与换行——防列错位）`);
    }
    if (purpose.includes("|") || purpose.includes("\n")) {
      throw new DoclibError("目的描述禁用竖线与换行（分支账为 Markdown 表格——防列错位），请改用其他标点");
    }
    const gitBranches = await listGitBranches(root);
    if (gitBranches.length > 0 && !gitBranches.includes(name)) {
      throw new DoclibError(`分支 ${name} 不存在于本地 git（现有: ${gitBranches.join(", ")}）`);
    }
    const ledger = await readBranchLedger(root);
    if (ledger !== null) {
      const dup = ledger.entries.find((e) => e.name === name && e.status === "active");
      if (dup) throw new DoclibError(`分支 ${name} 已在分支账中登记（active）`);
    }
    const abs = path.join(root, LEDGER_PATH);
    const today = new Date().toISOString().slice(0, 10);
    const row = renderBranchRow({ name, createdAt: today, purpose, status: "active", divergence: "（待补充：与主馆差异摘要）", refs: [] });
    const raw =
      ledger === null
        ? `${LEDGER_HEADER}${row}\n`
        : `${(await fs.readFile(abs, "utf8")).replace(/\n*$/, "\n")}${row}\n`;
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, raw, "utf8");
    const text = [
      `已登记分支: ${name}（active）`,
      `账本: ${LEDGER_PATH}`,
      "后续纪律: 分馆 progress 条目带 [branch:" + name + "] 标注；合并回主馆后翻 merged 并跑 doclib branch diff 复核。",
    ].join("\n");
    return { text, json: { registered: name, ledger: LEDGER_PATH } };
  }
  if (action === "diff") {
    const audit = await analyzeBranchDiff(root, opts.base);
    return { text: describeAudit(audit), json: audit };
  }
  throw new DoclibError(`未知 branch 动作: ${action}（支持 list / register / diff）`);
}
