import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { emptyState, loadState } from "./state.js";

test("emptyState 为 v2 归零结构", () => {
  const s = emptyState();
  assert.equal(s.version, 0);
  assert.equal(s.latest, null);
  assert.equal(s.structureVersion, 0);
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
  assert.equal(state.latest, "snap-001");
});
