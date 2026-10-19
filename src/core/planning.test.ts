import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { carrierDocs, pendingArchive, planningIgnores, planningReminderReport } from "./planning.js";
import { emptyState, saveState, type Snapshot } from "./state.js";

async function tmp(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "doclib-planning-"));
}

test("planningIgnores：补尾斜杠", () => {
  assert.deepEqual(planningIgnores([".plan", "specs/"]), [".plan/", "specs/"]);
});

test("carrierDocs：枚举载体 md 含 mtime", async () => {
  const root = await tmp();
  await fs.mkdir(path.join(root, "specs", "2026-10-19"), { recursive: true });
  await fs.writeFile(path.join(root, "specs", "2026-10-19", "plan.md"), "规划", "utf8");
  await fs.writeFile(path.join(root, "specs", "README.md"), "说明", "utf8");
  const docs = await carrierDocs(root, ["specs/"]);
  assert.deepEqual(docs.map((d) => d.path), ["specs/2026-10-19/plan.md", "specs/README.md"]);
  assert.ok(docs.every((d) => d.mtime > 0));
});

test("pendingArchive：解析 feature-map 状态列", async () => {
  const root = await tmp();
  await fs.mkdir(path.join(root, "doclib", "00-overview"), { recursive: true });
  await fs.writeFile(
    path.join(root, "doclib", "00-overview", "feature-map.md"),
    "| # | 功能 | 描述 | 文档 | 状态 |\n| --- | --- | --- | --- | --- |\n| 1 | A | a | x | implemented |\n| 2 | B | b | y | planned |\n| 3 | C | c | z | in-progress |\n",
    "utf8",
  );
  const r = await pendingArchive(root);
  assert.deepEqual(r, { planned: 1, inProgress: 1 });
});

test("planningReminderReport：mtime 晚于基线触发待登记；空则空串", async () => {
  const root = await tmp();
  const state = emptyState();
  state.planning = ["plan/"];
  await fs.mkdir(path.join(root, "plan"), { recursive: true });
  await fs.writeFile(path.join(root, "plan", "new.md"), "新规划", "utf8");
  const latest: Snapshot = {
    id: "snap-001",
    version: 1,
    at: new Date(Date.now() - 60000).toISOString(),
    note: "",
    stats: { files: 0, primary: "-", languages: {}, frameworks: [] },
    files: {},
  };
  await saveState(root, state);
  const withPending = await planningReminderReport(root, state, latest);
  assert.ok(withPending.includes("待登记"));
  assert.ok(withPending.includes("plan/new.md"));

  const old: Snapshot = { ...latest, at: new Date(Date.now() + 60000).toISOString() };
  const noPending = await planningReminderReport(root, state, old);
  assert.ok(!noPending.includes("待登记"));
});
