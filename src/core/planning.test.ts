import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { carrierDocs, detectCarrierShape, pendingArchive, planningIgnores, planningReminderReport, sha16, sourceDrifts, suggestCarriers } from "./planning.js";
import { emptyState, loadState, saveState, type Snapshot } from "./state.js";

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

test("suggestCarriers：存在含 md 的未声明载体 → 建议；已声明/空目录 → 不建议", async () => {
  const root = await tmp();
  await fs.mkdir(path.join(root, "openspec", "changes", "add-x"), { recursive: true });
  await fs.writeFile(path.join(root, "openspec", "changes", "add-x", "proposal.md"), "p", "utf8");
  await fs.mkdir(path.join(root, ".specify"), { recursive: true });
  const state = emptyState();
  const first = await suggestCarriers(root, state);
  assert.deepEqual(first, ["openspec/"]);
  await fs.writeFile(path.join(root, ".specify", "spec.md"), "s", "utf8");
  const second = await suggestCarriers(root, state);
  assert.deepEqual(second, [".specify/", "openspec/"]);
  const declared = { ...emptyState(), planning: [".plan/", "openspec/"] };
  const third = await suggestCarriers(root, declared);
  assert.deepEqual(third, [".specify/"]);
});

test("detectCarrierShape：四工具形态与未命中", () => {
  assert.equal(detectCarrierShape("openspec/changes/add-x/proposal.md"), "OpenSpec");
  assert.equal(detectCarrierShape(".specify/memory/constitution.md"), "spec-kit");
  assert.equal(detectCarrierShape("specs/001-login/spec.md"), "spec-kit");
  assert.equal(detectCarrierShape(".kiro/specs/auth/tasks.md"), "Kiro");
  assert.equal(detectCarrierShape("doclib/30-features/check.md"), null);
  assert.equal(detectCarrierShape("src/core/place.ts"), null);
});

test("sourceDrifts：hash 失配检出；一致与无标记忽略；提醒行入 planningReminderReport", async () => {
  const root = await tmp();
  await fs.mkdir(path.join(root, "doclib", "30-features"), { recursive: true });
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.writeFile(path.join(root, "src", "t.ts"), "v1", "utf8");
  const h1 = sha16("v1");
  await fs.writeFile(
    path.join(root, "doclib", "30-features", "t.md"),
    `---\ntitle: T\ncovers: []\nstatus: stable\nsource-path: src/t.ts\nsource-hash: ${h1}\n---\n\n# T\n`,
    "utf8",
  );
  await fs.writeFile(
    path.join(root, "doclib", "30-features", "plain.md"),
    "---\ntitle: P\ncovers: []\nstatus: stable\n---\n\n# P\n",
    "utf8",
  );
  assert.deepEqual(await sourceDrifts(root), []);
  await fs.writeFile(path.join(root, "src", "t.ts"), "v2", "utf8");
  const drifts = await sourceDrifts(root);
  assert.deepEqual(drifts, [{ doc: "doclib/30-features/t.md", sourcePath: "src/t.ts" }]);
  await saveState(root, { ...emptyState(), planning: [".plan/"] });
  const report = await planningReminderReport(root, await loadState(root), null);
  assert.ok(report.includes("源已变更待再转化"));
  assert.ok(report.includes("src/t.ts"));
});
