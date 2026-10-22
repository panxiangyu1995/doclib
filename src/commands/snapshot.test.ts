import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { runSnapshot } from "./snapshot.js";
import { DoclibError, loadState } from "../core/state.js";
import { get, has, put, seedState, snapshotRow, tmpRoot } from "./testkit.js";

test("snapshot：首个基线 snap-001（version/latest/revision/文件账/文档账落库）", async () => {
  const root = await tmpRoot("doclib-acc-snap-");
  await put(root, "src/a.ts", "v1");
  await put(root, "doclib/README.md", "馆");
  await put(root, "AGENTS.md", "引导");
  const r = await runSnapshot(root, {});
  assert.match(r.text, /基线已记录: snap-001 \(library version 1\)/);
  assert.match(r.text, /revision: 1/);
  assert.match(r.text, /文件: 2 ｜ 文档账: 2/);
  const state = await loadState(root);
  assert.equal(state.version, 1);
  assert.equal(state.latest, "snap-001");
  assert.equal(state.revision, 1);
  assert.equal(state.snapshots.length, 1);
  assert.ok(state.snapshots[0]!.files["src/a.ts"]);
  assert.ok(state.snapshots[0]!.docs?.["doclib/README.md"]);
  assert.ok(state.snapshots[0]!.docs?.["AGENTS.md"]);
  assert.ok(!state.snapshots[0]!.docs?.["src/a.ts"]);
  assert.equal(state.snapshots[0]!.note, "");
});

test("snapshot：--note 落库；二次快照 revision+1 且 stats 记录框架", async () => {
  const root = await tmpRoot("doclib-acc-snap-");
  await put(root, "package.json", JSON.stringify({ name: "fw", dependencies: { react: "18", vite: "5" } }));
  await put(root, "src/a.ts", "v1");
  await runSnapshot(root, { note: "initial build" });
  await put(root, "src/a.ts", "v2");
  const r = await runSnapshot(root, { note: "update" });
  assert.match(r.text, /snap-002/);
  const state = await loadState(root);
  assert.equal(state.revision, 2);
  assert.equal(state.snapshots[0]!.note, "initial build");
  assert.equal(state.snapshots[1]!.note, "update");
  assert.ok(state.snapshots[0]!.stats.frameworks.includes("React"));
  assert.ok(state.snapshots[0]!.stats.frameworks.includes("Vite"));
  assert.equal(state.snapshots[0]!.stats.primary, "TypeScript");
  const j = r.json as { id: string; version: number; files: number; docs: number };
  assert.deepEqual(j, { id: "snap-002", version: 2, files: 2, docs: 0 });
});

test("snapshot：once 豁免被清除，standing 豁免保留", async () => {
  const root = await tmpRoot("doclib-acc-snap-");
  await put(root, "src/a.ts", "v1");
  await runSnapshot(root, {});
  const state = await loadState(root);
  state.acks.push(
    { path: "src/gen.ts", note: "生成物", at: "2026-10-19T00:00:00.000Z", kind: "standing" },
    { path: "src/tmp.ts", note: "本轮", at: "2026-10-19T00:00:00.000Z", kind: "once", baseline: "snap-001" },
  );
  await fs.writeFile(path.join(root, ".doclib", "state.json"), JSON.stringify(state), "utf8");
  await runSnapshot(root, {});
  const after = await loadState(root);
  assert.deepEqual(
    after.acks.map((a) => a.kind),
    ["standing"],
  );
});

test("snapshot：快照链上限 20 条（MAX_SNAPSHOTS 裁剪，version/latest 持续推进）", async () => {
  const root = await tmpRoot("doclib-acc-snap-");
  await put(root, "src/a.ts", "v1");
  const snaps = Array.from({ length: 20 }, (_, i) => snapshotRow(i + 1, ["src/a.ts"]));
  await seedState(root, { version: 20, latest: "snap-020", snapshots: snaps, revision: 20 });
  const r = await runSnapshot(root, {});
  assert.match(r.text, /snap-021/);
  const state = await loadState(root);
  assert.equal(state.version, 21);
  assert.equal(state.latest, "snap-021");
  assert.equal(state.snapshots.length, 20);
  assert.equal(state.snapshots[0]!.id, "snap-002");
  assert.equal(state.snapshots[19]!.id, "snap-021");
});

test("snapshot：version 超过 999 后 id 不再补零（pad3 边界）", async () => {
  const root = await tmpRoot("doclib-acc-snap-");
  await put(root, "src/a.ts", "v1");
  await seedState(root, { version: 999, latest: "snap-999", snapshots: [snapshotRow(999, ["src/a.ts"])], revision: 999 });
  const r = await runSnapshot(root, {});
  assert.match(r.text, /snap-1000/);
  const state = await loadState(root);
  assert.equal(state.latest, "snap-1000");
  assert.equal(state.version, 1000);
});

test("snapshot：空项目（0 文件）也可记录基线", async () => {
  const root = await tmpRoot("doclib-acc-snap-");
  const r = await runSnapshot(root, {});
  assert.match(r.text, /文件: 0 ｜ 文档账: 0/);
  assert.match(r.text, /主语言: 未知/);
  const state = await loadState(root);
  assert.equal(state.snapshots[0]!.stats.files, 0);
  assert.deepEqual(state.snapshots[0]!.files, {});
});

test("snapshot：node_modules 等默认忽略目录不入账", async () => {
  const root = await tmpRoot("doclib-acc-snap-");
  await put(root, "src/a.ts", "x");
  await put(root, "node_modules/pkg/index.js", "x");
  await put(root, "dist/out.js", "x");
  await put(root, ".doclib/tasks/BUILD-001.md", "x");
  await put(root, ".plan/idea.md", "x");
  await put(root, "debug.log", "x");
  await put(root, ".env", "SECRET=1");
  const r = await runSnapshot(root, {});
  assert.match(r.text, /文件: 1 ｜ 文档账: 0/);
  const state = await loadState(root);
  assert.deepEqual(Object.keys(state.snapshots[0]!.files), ["src/a.ts"]);
});

test("snapshot：.doclibignore 追加排除规则生效", async () => {
  const root = await tmpRoot("doclib-acc-snap-");
  await put(root, "src/a.ts", "x");
  await put(root, "vendor/lib.js", "x");
  await put(root, ".doclibignore", "vendor/\n");
  const state = await runSnapshot(root, {}).then(() => loadState(root));
  assert.deepEqual(Object.keys(state.snapshots[0]!.files).sort(), [".doclibignore", "src/a.ts"]);
});

test("snapshot：非默认规划载体（init --planning）同样排除", async () => {
  const root = await tmpRoot("doclib-acc-snap-");
  await seedState(root, { planning: ["plans/"] });
  await put(root, "src/a.ts", "x");
  await put(root, "plans/todo.md", "x");
  const state = await runSnapshot(root, {}).then(() => loadState(root));
  assert.deepEqual(Object.keys(state.snapshots[0]!.files), ["src/a.ts"]);
});

const skipUnreadable = process.platform === "win32" || (process.getuid?.() ?? 0) === 0;

test("snapshot：不可读文件 → 整体硬失败（不产出半截基线）", { skip: skipUnreadable }, async () => {
  const root = await tmpRoot("doclib-acc-snap-");
  await put(root, "src/a.ts", "x");
  await put(root, "src/locked.ts", "x");
  await fs.chmod(path.join(root, "src", "locked.ts"), 0o000);
  try {
    await assert.rejects(() => runSnapshot(root, {}));
    const state = await loadState(root);
    assert.equal(state.version, 0);
  } finally {
    await fs.chmod(path.join(root, "src", "locked.ts"), 0o644).catch(() => {});
  }
});

test("snapshot：状态文件损坏 → DoclibError 并备份 state.json.corrupt-*", async () => {
  const root = await tmpRoot("doclib-acc-snap-");
  await fs.mkdir(path.join(root, ".doclib"), { recursive: true });
  await fs.writeFile(path.join(root, ".doclib", "state.json"), "{definitely not json", "utf8");
  await assert.rejects(
    () => runSnapshot(root, {}),
    (e: unknown) => e instanceof DoclibError && /状态文件 \.doclib\/state\.json 已损坏/.test(e.message),
  );
  const entries = await fs.readdir(path.join(root, ".doclib"));
  assert.ok(entries.some((f) => f.startsWith("state.json.corrupt-")));
});

test("snapshot：状态文件为空文件 → 同样按损坏处理", async () => {
  const root = await tmpRoot("doclib-acc-snap-");
  await fs.mkdir(path.join(root, ".doclib"), { recursive: true });
  await fs.writeFile(path.join(root, ".doclib", "state.json"), "", "utf8");
  await assert.rejects(() => runSnapshot(root, {}), DoclibError);
  const entries = await fs.readdir(path.join(root, ".doclib"));
  assert.ok(entries.some((f) => f.startsWith("state.json.corrupt-")));
});

test("snapshot：state.json schema 非法（缺 version/snapshots）→ 回落空状态", async () => {
  const root = await tmpRoot("doclib-acc-snap-");
  await fs.mkdir(path.join(root, ".doclib"), { recursive: true });
  await fs.writeFile(path.join(root, ".doclib", "state.json"), JSON.stringify({ foo: 1 }), "utf8");
  await put(root, "src/a.ts", "x");
  const r = await runSnapshot(root, {});
  assert.match(r.text, /snap-001/);
  assert.ok(await has(root, ".doclib/state.json"));
});
