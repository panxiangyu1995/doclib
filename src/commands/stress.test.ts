import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { runSnapshot } from "./snapshot.js";
import { runDiff, analyzeDrift, describeDrift } from "./diff.js";
import { runVerify } from "./verify.js";
import { runCheckCore } from "../core/check.js";
import { runStatus } from "./status.js";
import { loadState } from "../core/state.js";
import { docMd, put, tmpRoot } from "./testkit.js";

test("压力：2000 文件 × 40 目录——snapshot/diff/check/status 全链路正确且限时", async () => {
  const root = await tmpRoot("doclib-stress-");
  await put(root, "doclib/INDEX.md", "- [全量](30-features/all.md)\n");
  await put(root, "doclib/30-features/all.md", docMd("All", ["src/"]));
  for (let d = 0; d < 40; d++) {
    for (let f = 0; f < 50; f++) {
      await put(root, `src/mod${String(d).padStart(2, "0")}/file${String(f).padStart(3, "0")}.ts`, `export const v = ${d * 50 + f};\n`);
    }
  }
  let t0 = Date.now();
  const snap = await runSnapshot(root, { note: "stress-2000" });
  const snapMs = Date.now() - t0;
  assert.match(snap.text, /文件: 2000 ｜ 文档账: 2/);
  assert.ok(snapMs < 60_000, `snapshot 耗时 ${snapMs}ms`);

  t0 = Date.now();
  const an = await analyzeDrift(root);
  const diffMs = Date.now() - t0;
  assert.equal(an.drift.added.length + an.drift.modified.length + an.drift.removed.length, 0);
  assert.ok(diffMs < 60_000, `diff 耗时 ${diffMs}ms`);

  t0 = Date.now();
  const check = await runCheckCore(root);
  const checkMs = Date.now() - t0;
  assert.deepEqual(check.findings, []);
  assert.equal(check.health.score, 100);
  assert.ok(checkMs < 60_000, `check 耗时 ${checkMs}ms`);

  t0 = Date.now();
  const status = await runStatus(root, {});
  const statusMs = Date.now() - t0;
  assert.match(status.text, /漂移: \+0 新增 \/ ~0 修改 \/ -0 删除（相对 snap-001）/);
  assert.match(status.text, /治理: 100\/100 \(A\)/);
  assert.ok(statusMs < 60_000, `status 耗时 ${statusMs}ms`);

  await put(root, "src/mod07/file013.ts", "changed");
  const d = await runDiff(root, {});
  assert.match(d.text, /漂移: \+0 新增 \/ ~1 修改 \/ -0 删除/);

  const verify = await runVerify(root, {});
  assert.match(verify.text, /代码文件: 2000 ｜ 已覆盖: 2000（100%）｜ 未覆盖: 0/);
});

test("压力：25 连续快照——链长封顶 20、编号持续推进、漂移始终归零", async () => {
  const root = await tmpRoot("doclib-stress-");
  await put(root, "src/a.ts", "v0");
  for (let i = 1; i <= 25; i++) {
    await put(root, "src/a.ts", `v${i}`);
    const r = await runSnapshot(root, { note: `round-${i}` });
    assert.match(r.text, new RegExp(`snap-${String(i).padStart(3, "0")}`));
  }
  const state = await loadState(root);
  assert.equal(state.version, 25);
  assert.equal(state.revision, 25);
  assert.equal(state.snapshots.length, 20);
  assert.equal(state.snapshots[0]!.id, "snap-006");
  assert.equal(state.snapshots[19]!.id, "snap-025");
  const an = await analyzeDrift(root);
  assert.equal(an.drift.modified.length, 0);
});

test("边界：40 层深嵌套目录覆盖与漂移", async () => {
  const root = await tmpRoot("doclib-stress-");
  const deep = Array.from({ length: 40 }, (_, i) => `l${i}`).join("/");
  await put(root, `${deep}/leaf.ts`, "deep");
  await put(root, "doclib/INDEX.md", "- [深](30-features/deep.md)\n");
  await put(root, "doclib/30-features/deep.md", docMd("Deep", ["l0/"]));
  await runSnapshot(root, {});
  let an = await analyzeDrift(root);
  assert.equal(an.drift.added.length, 0);
  await put(root, `${deep}/leaf.ts`, "deeper");
  an = await analyzeDrift(root);
  assert.deepEqual(an.drift.modified, [`${deep}/leaf.ts`]);
  assert.deepEqual(an.rows[0]!.docs, ["30-features/deep.md"]);
  const verify = await runVerify(root, {});
  assert.match(verify.text, /已覆盖: 1（100%）/);
});

test("边界：unicode 与空格路径全链路（snapshot/diff/covers 映射）", async () => {
  const root = await tmpRoot("doclib-stress-");
  const p = "src/中文 模块/报告 生成.ts";
  await put(root, p, "export {};");
  await put(root, "doclib/INDEX.md", "- [报告](30-features/report.md)\n");
  await put(root, "doclib/30-features/report.md", docMd("报告", [p]));
  await runSnapshot(root, {});
  const an1 = await analyzeDrift(root);
  assert.equal(an1.drift.added.length, 0);
  await put(root, p, "export const x = 1;");
  const an2 = await analyzeDrift(root);
  assert.deepEqual(an2.drift.modified, [p]);
  assert.deepEqual(an2.rows[0]!.docs, ["30-features/report.md"]);
  const check = await runCheckCore(root);
  assert.ok(check.findings.some((f) => f.kind === "unaccounted" && f.path === p));
});

test("边界：大文件（约 4MB）哈希与修改检出", async () => {
  const root = await tmpRoot("doclib-stress-");
  await put(root, "src/big.ts", "export const big = '".padEnd(4 * 1024 * 1024, "x") + "';\n");
  await runSnapshot(root, {});
  const an1 = await analyzeDrift(root);
  assert.equal(an1.drift.added.length, 0);
  await put(root, "src/big.ts", "export const big = '".padEnd(4 * 1024 * 1024, "y") + "';\n");
  const an2 = await analyzeDrift(root);
  assert.deepEqual(an2.drift.modified, ["src/big.ts"]);
});

test("压力：60 个修改文件——diff 单段 50 截断且 plan UPDATE 全量列出", async () => {
  const root = await tmpRoot("doclib-stress-");
  for (let i = 0; i < 60; i++) {
    await put(root, `src/f${String(i).padStart(3, "0")}.ts`, "v1");
  }
  await runSnapshot(root, {});
  for (let i = 0; i < 60; i++) {
    await put(root, `src/f${String(i).padStart(3, "0")}.ts`, "v2-changed");
  }
  const text = describeDrift(await analyzeDrift(root));
  assert.match(text, /修改 \(60\)/);
  assert.match(text, /… 其余 10 项/);
  const { runPlan } = await import("./plan.js");
  const r = await runPlan(root, {});
  const task = await fs.readFile(path.join(root, ".doclib", "tasks", "UPDATE-002.md"), "utf8");
  assert.match(task, /### 修改 — 更新受影响文档 \(60\)/);
  assert.ok(task.includes("src/f000.ts"));
  assert.ok(task.includes("src/f059.ts"));
  assert.ok(r.text.includes("UPDATE-002"));
});
