import fs from "node:fs/promises";
import path from "node:path";
import { collectFiles, hashAll } from "./fsutil.js";
import { LIBRARY_DIR } from "./state.js";

export type MigrationRow = { n: number; file: string | null };

export async function collectDocFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  const libFiles = await collectFiles(path.join(root, LIBRARY_DIR)).catch(() => [] as string[]);
  for (const f of libFiles) {
    if (f.endsWith(".md")) out.push(`${LIBRARY_DIR}/${f}`);
  }
  for (const g of ["CLAUDE.md", "AGENTS.md"]) {
    const exists = await fs
      .access(path.join(root, g))
      .then(() => true)
      .catch(() => false);
    if (exists) out.push(g);
  }
  return out.sort();
}

export async function hashDocs(root: string): Promise<Record<string, string>> {
  return hashAll(root, await collectDocFiles(root));
}

export async function parseMigrationLedger(libraryRoot: string): Promise<MigrationRow[]> {
  const raw = await fs
    .readFile(path.join(libraryRoot, "10-architecture", "migrations.md"), "utf8")
    .catch(() => null);
  if (raw === null) return [];
  const rows: MigrationRow[] = [];
  for (const line of raw.split(/\r?\n/)) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    const first = cells[1] ?? "";
    if (!/^\d{3}$/.test(first)) continue;
    const file = (cells[3] ?? "").length > 0 ? cells[3]! : null;
    rows.push({ n: Number(first), file });
  }
  return rows;
}

export type CheckFindingKind = "unaccounted" | "uncovered" | "migration" | "guide-stale" | "orphan-doc";

export type CheckFinding = {
  kind: CheckFindingKind;
  path?: string;
  docs?: string[];
  detail?: string;
};

export async function validateMigrations(root: string): Promise<CheckFinding[]> {
  const findings: CheckFinding[] = [];
  const dir = path.join(root, "migrations");
  let entries: string[];
  try {
    entries = (await fs.readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  } catch {
    return findings;
  }
  const ledgerPath = "doclib/10-architecture/migrations.md";
  const rows = await parseMigrationLedger(path.join(root, LIBRARY_DIR));
  const numberSet = new Set(rows.map((r) => r.n));
  const nameRe = /^(\d{3})_\d{8}_[a-z0-9-]+\.sql$/;
  for (const f of entries) {
    const m = nameRe.exec(f);
    if (!m) {
      findings.push({ kind: "migration", path: `migrations/${f}`, detail: "命名不符 NNN_YYYYMMDD_slug.sql" });
      continue;
    }
    if (!numberSet.has(Number(m[1]))) {
      findings.push({ kind: "migration", path: `migrations/${f}`, detail: `脚本未在账本登记（编号 ${m[1]}）` });
    }
  }
  const seen = new Set<number>();
  for (const row of rows) {
    if (seen.has(row.n)) {
      findings.push({ kind: "migration", path: ledgerPath, detail: `账本编号重复：${String(row.n).padStart(3, "0")}` });
    }
    seen.add(row.n);
    if (row.file !== null && !row.file.startsWith("migrations/")) continue;
    if (row.file !== null) {
      const exists = await fs
        .access(path.join(root, row.file))
        .then(() => true)
        .catch(() => false);
      if (!exists) {
        findings.push({ kind: "migration", path: ledgerPath, detail: `账本指向不存在的脚本：${row.file}` });
      }
    }
  }
  if (seen.size > 0) {
    const min = Math.min(...seen);
    const max = Math.max(...seen);
    for (let n = min; n <= max; n++) {
      if (!seen.has(n)) {
        findings.push({ kind: "migration", path: ledgerPath, detail: `账本断号：${String(n).padStart(3, "0")}` });
      }
    }
  }
  return findings;
}
