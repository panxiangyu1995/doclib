import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runReconcile } from "./reconcile.js";
import { runSnapshot } from "./snapshot.js";
import { docMd, put, tmpRoot } from "./testkit.js";

async function tmp(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "doclib-acc-reconcile-"));
}

async function seed(root: string): Promise<void> {
  await put(root, "src/a.ts", "v1");
  await put(root, "doclib/00-overview/feature-map.md", [
    "| # | 功能 | 描述 | 对应文档 | 状态 |",
    "| --- | --- | --- | --- | --- |",
    "| 1 | A | a | 30-features/a.md | implemented |",
    "| 2 | B | b | （待写） | planned |",
    "| 4 | D | d | skills/doclib-build/SKILL.md | implemented |",
    "| 5 | E | e | — | implemented |",
  ].join("\n"));
  await put(root, "doclib/30-features/a.md", docMd("A", ["src/a.ts"]));
  await runSnapshot(root, {});
}

test("reconcile：无基线形态（不崩溃，提示先 snapshot）", async () => {
  const root = await tmp();
  await fs.mkdir(path.join(root, "doclib"), { recursive: true });
  const r = await runReconcile(root, {});
  assert.match(r.text, /进度对账报告（基线 无 · revision 0）/);
  assert.match(r.text, /尚无基线快照：无法对账——先 doclib snapshot。/);
  const j = r.json as { baseline: null; driftRows: unknown[]; plannedInProgress: unknown[] };
  assert.equal(j.baseline, null);
  assert.deepEqual(j.driftRows, []);
});

test("reconcile：三段报告——疑似完成/进度不符/待推进（文本形态）", async () => {
  const root = await tmp();
  await seed(root);
  await put(root, "doclib/00-overview/feature-map.md", [
    "| # | 功能 | 描述 | 对应文档 | 状态 |",
    "| --- | --- | --- | --- | --- |",
    "| 1 | A | a | 30-features/a.md | implemented |",
    "| 2 | B | b | （待写） | planned |",
    "| 3 | C | c | 30-features/missing.md | implemented |",
    "| 4 | D | d | skills/doclib-build/SKILL.md | implemented |",
    "| 5 | E | e | — | implemented |",
  ].join("\n"));
  await put(root, "src/a.ts", "v2");
  const r = await runReconcile(root, {});
  assert.match(r.text, /进度对账报告（基线 snap-001 · revision 1）/);
  assert.match(r.text, /一、疑似完成（漂移 1 项，逐项确认后补录 feature-map\/progress）/);
  assert.match(r.text, /\[modified\] src\/a\.ts  →  30-features\/a\.md/);
  assert.match(r.text, /二、进度不符（implemented 条目的对应文档缺失或覆盖路径有漂移）/);
  assert.match(r.text, /#3 C — 30-features\/missing\.md（对应文档不存在）/);
  assert.match(r.text, /#1 A — 30-features\/a\.md（覆盖路径有漂移且文档未同步——进度与代码不符）/);
  assert.match(r.text, /三、待推进（planned 1 \/ in-progress 0）/);
  assert.match(r.text, /#2 \[planned\] B/);
  assert.match(r.text, /修复指引: 逐项确认后补录 doclib\/00-overview\/feature-map\.md 与 progress\.md；确认前不要臆断状态。/);
});

test("reconcile：文档已同步更新 → 不判进度不符；特殊引用（—/skills/）跳过", async () => {
  const root = await tmp();
  await seed(root);
  await put(root, "src/a.ts", "v2");
  await put(root, "doclib/30-features/a.md", docMd("A", ["src/a.ts"], "v2 行为已更新\n"));
  const r = await runReconcile(root, {});
  assert.match(r.text, /无——进度账与代码一致。/);
  const j = r.json as { staleProgress: Array<{ n: number }> };
  assert.ok(!j.staleProgress.some((s) => s.n === 1));
  assert.ok(!j.staleProgress.some((s) => s.n === 4));
  assert.ok(!j.staleProgress.some((s) => s.n === 5));
});

test("reconcile：无漂移 → 疑似完成段为空文案", async () => {
  const root = await tmp();
  await seed(root);
  const r = await runReconcile(root, {});
  assert.match(r.text, /无漂移——代码与基线一致。/);
});

test("reconcile：--json 结构（baseline/revision/driftRows/plannedInProgress/staleProgress）", async () => {
  const root = await tmp();
  await seed(root);
  await put(root, "doclib/00-overview/feature-map.md", [
    "| # | 功能 | 描述 | 对应文档 | 状态 |",
    "| --- | --- | --- | --- | --- |",
    "| 1 | A | a | 30-features/a.md | implemented |",
    "| 2 | B | b | （待写） | planned |",
    "| 3 | C | c | 30-features/missing.md | implemented |",
  ].join("\n"));
  await put(root, "src/a.ts", "v2");
  const r = await runReconcile(root, { json: true });
  const j = JSON.parse(r.text) as {
    baseline: string;
    revision: number;
    driftTotal: number;
    driftRows: Array<{ path: string; change: string; docs: string[] }>;
    plannedInProgress: Array<{ n: number; status: string }>;
    staleProgress: Array<{ n: number; doc: string }>;
  };
  assert.equal(j.baseline, "snap-001");
  assert.equal(j.revision, 1);
  assert.equal(j.driftTotal, 1);
  assert.deepEqual(j.driftRows[0], { path: "src/a.ts", change: "modified", docs: ["30-features/a.md"] });
  assert.deepEqual(
    j.plannedInProgress.map((x) => x.n),
    [2],
  );
  assert.equal(j.staleProgress.length, 2);
  assert.deepEqual(
    j.staleProgress.map((s) => s.n),
    [1, 3],
  );
  assert.match(j.staleProgress[0]!.doc, /进度与代码不符/);
  assert.match(j.staleProgress[1]!.doc, /对应文档不存在/);
});
