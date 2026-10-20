import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DoclibError, emptyState, loadState } from "./state.js";

test("emptyState 为 v2 归零结构", () => {
  const s = emptyState();
  assert.equal(s.version, 0);
  assert.equal(s.latest, null);
  assert.equal(s.structureVersion, 0);
  assert.equal(s.revision, 0);
  assert.deepEqual(s.agents, []);
});

test("旧版 state.json 兼容归一化", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-state-"));
  await fs.mkdir(path.join(root, ".doclib"), { recursive: true });
  const legacy = {
    version: 1,
    latest: "snap-001",
    snapshots: [{ id: "snap-001", version: 1, at: "2026-10-17T00:00:00.000Z", note: "", stats: { files: 3, primary: "TypeScript", languages: {}, frameworks: [] }, files: { "a.ts": "x" } }],
  };
  await fs.writeFile(path.join(root, ".doclib", "state.json"), JSON.stringify(legacy), "utf8");
  const state = await loadState(root);
  assert.equal(state.structureVersion, 1);
  assert.deepEqual(state.agents, []);
  assert.deepEqual(state.acks, []);
  assert.equal(state.latest, "snap-001");
  assert.equal(state.revision, 0);
});

test("loadState：文件缺失 → 空状态", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-state-missing-"));
  const state = await loadState(root);
  assert.equal(state.version, 0);
  assert.equal(state.latest, null);
});

test("loadState：损坏 JSON → DoclibError + .corrupt 备份", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-state-bad-"));
  await fs.mkdir(path.join(root, ".doclib"), { recursive: true });
  await fs.writeFile(path.join(root, ".doclib", "state.json"), "{oops", "utf8");
  await assert.rejects(() => loadState(root), DoclibError);
  const entries = await fs.readdir(path.join(root, ".doclib"));
  assert.ok(entries.some((e) => e.startsWith("state.json.corrupt-")));
});

test("loadState：空文件 → 与损坏同路径（备份 + DoclibError）", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-state-empty-"));
  await fs.mkdir(path.join(root, ".doclib"), { recursive: true });
  await fs.writeFile(path.join(root, ".doclib", "state.json"), "", "utf8");
  await assert.rejects(() => loadState(root), DoclibError);
  const entries = await fs.readdir(path.join(root, ".doclib"));
  assert.ok(entries.some((e) => e.startsWith("state.json.corrupt-")));
});
