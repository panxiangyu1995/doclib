import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runReconcileCore } from "./reconcile.js";
import { saveState } from "./state.js";
import { runSnapshot } from "../commands/snapshot.js";

async function tmp(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "doclib-reconcile-"));
}

async function seed(root: string): Promise<void> {
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.mkdir(path.join(root, "doclib", "00-overview"), { recursive: true });
  await fs.writeFile(path.join(root, "src", "a.ts"), "v1", "utf8");
  await fs.writeFile(
    path.join(root, "doclib", "00-overview", "feature-map.md"),
    "| # | 功能 | 描述 | 对应文档 | 状态 |\n| --- | --- | --- | --- | --- |\n| 1 | A | a | 30-features/a.md | implemented |\n| 2 | B | b | （待写） | planned |\n| 3 | C | c | 30-features/missing.md | implemented |\n",
    "utf8",
  );
  await fs.mkdir(path.join(root, "doclib", "30-features"), { recursive: true });
  await fs.writeFile(
    path.join(root, "doclib", "30-features", "a.md"),
    "---\ntitle: A\ncovers:\n  - src/a.ts\nstatus: stable\n---\nA\n",
    "utf8",
  );
  await runSnapshot(root, { note: "seed" });
}

test("reconcile：漂移行/进度不符/待推进三段产出", async () => {
  const root = await tmp();
  await seed(root);
  await fs.writeFile(path.join(root, "src", "a.ts"), "v2", "utf8");
  const r = await runReconcileCore(root);
  assert.equal(r.revision, 1);
  assert.equal(r.driftTotal, 1);
  assert.ok(r.driftRows.some((row) => row.path === "src/a.ts" && row.docs.includes("30-features/a.md")));
  assert.deepEqual(
    r.plannedInProgress.map((x) => x.n),
    [2],
  );
  assert.ok(r.staleProgress.some((x) => x.n === 3 && x.doc.includes("missing")));
  assert.ok(r.staleProgress.some((x) => x.n === 1 && x.doc.includes("进度与代码不符")));
});

test("reconcile：无基线时报 baseline null", async () => {
  const root = await tmp();
  await fs.mkdir(path.join(root, "doclib", "00-overview"), { recursive: true });
  const r = await runReconcileCore(root);
  assert.equal(r.baseline, null);
  assert.equal(r.driftTotal, 0);
});
