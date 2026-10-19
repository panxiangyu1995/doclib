import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { collectDocFiles, parseMigrationLedger, validateMigrations } from "./ledger.js";

async function tmp(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "doclib-ledger-"));
}

test("collectDocFiles 汇集馆内 md 与根引导文件", async () => {
  const root = await tmp();
  await fs.mkdir(path.join(root, "doclib", "00-overview"), { recursive: true });
  await fs.writeFile(path.join(root, "doclib", "README.md"), "# lib");
  await fs.writeFile(path.join(root, "doclib", "00-overview", "x.md"), "x");
  await fs.writeFile(path.join(root, "CLAUDE.md"), "c");
  await fs.writeFile(path.join(root, "AGENTS.md"), "a");
  await fs.writeFile(path.join(root, "note.txt"), "n");
  const files = await collectDocFiles(root);
  assert.deepEqual(files, ["AGENTS.md", "CLAUDE.md", "doclib/00-overview/x.md", "doclib/README.md"]);
});

test("parseMigrationLedger 容错解析编号行", async () => {
  const root = await tmp();
  const dir = path.join(root, "doclib", "10-architecture");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, "migrations.md"),
    "| 编号 | 日期 | 文件 | 目的 |\n| --- | --- | --- | --- |\n| 001 | 20261019 | migrations/001_20261019_init.sql | init |\n脏行不是编号\n| 003 | 20261019 | migrations/003_x.sql | x |\n",
    "utf8",
  );
  const rows = await parseMigrationLedger(path.join(root, "doclib"));
  assert.deepEqual(rows, [
    { n: 1, file: "migrations/001_20261019_init.sql" },
    { n: 3, file: "migrations/003_x.sql" },
  ]);
});

test("validateMigrations：未登记/命名违规/断号/指向不存在文件", async () => {
  const root = await tmp();
  await fs.mkdir(path.join(root, "migrations"), { recursive: true });
  await fs.mkdir(path.join(root, "doclib", "10-architecture"), { recursive: true });
  await fs.writeFile(path.join(root, "migrations", "001_20261019_init.sql"), "-- ok");
  await fs.writeFile(path.join(root, "migrations", "bad name.sql"), "-- bad");
  await fs.writeFile(
    path.join(root, "doclib", "10-architecture", "migrations.md"),
    "| 编号 | 日期 | 文件 | 目的 |\n| --- | --- | --- | --- |\n| 001 | 20261019 | migrations/001_20261019_init.sql | init |\n| 003 | 20261019 | migrations/003_missing.sql | x |\n",
    "utf8",
  );
  const findings = await validateMigrations(root);
  const details = findings.map((f) => f.detail ?? "");
  assert.ok(details.some((d) => d.includes("命名不符")));
  assert.ok(details.some((d) => d.includes("断号：002")));
  assert.ok(details.some((d) => d.includes("账本指向不存在的脚本：migrations/003_missing.sql")));
  assert.ok(!details.some((d) => d.includes("001")));
});

test("validateMigrations：无 migrations 目录返回空", async () => {
  const root = await tmp();
  assert.deepEqual(await validateMigrations(root), []);
});
