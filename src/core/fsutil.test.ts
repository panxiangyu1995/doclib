import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { collectFiles, renderTree } from "./fsutil.js";
import { computeDrift } from "./state.js";

async function tmpProject(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-test-"));
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.mkdir(path.join(root, "node_modules/pkg"), { recursive: true });
  await fs.mkdir(path.join(root, ".doclib"), { recursive: true });
  await fs.mkdir(path.join(root, "doclib"), { recursive: true });
  await fs.writeFile(path.join(root, "src/a.ts"), "a");
  await fs.writeFile(path.join(root, "src/b.gen.ts"), "generated");
  await fs.writeFile(path.join(root, "secret.txt"), "s");
  await fs.writeFile(path.join(root, "node_modules/pkg/x.js"), "x");
  await fs.writeFile(path.join(root, ".doclib/state.json"), "{}");
  await fs.writeFile(path.join(root, "doclib/README.md"), "lib");
  await fs.writeFile(path.join(root, ".gitignore"), "secret.txt\n");
  await fs.writeFile(path.join(root, ".doclibignore"), "*.gen.ts\n");
  return root;
}

test("collectFiles 遵循内置默认 + .gitignore + .doclibignore", async () => {
  const root = await tmpProject();
  const files = await collectFiles(root);
  assert.deepEqual(files, [".doclibignore", ".gitignore", "src/a.ts"]);
});

test("renderTree 目录深度截断并计数", () => {
  const tree = renderTree(["src/core/a.ts", "src/core/b.ts", "src/util/c.ts", "README.md"], 2);
  assert.ok(tree.includes("core/ (2 files)"));
  assert.ok(tree.includes("README.md"));
  assert.ok(!tree.includes("a.ts"));
});

test("computeDrift 分类增改删", () => {
  const drift = computeDrift({ "a.ts": "1", "b.ts": "2", "c.ts": "3" }, { "a.ts": "1", "b.ts": "9", "d.ts": "4" });
  assert.deepEqual(drift.added, ["d.ts"]);
  assert.deepEqual(drift.modified, ["b.ts"]);
  assert.deepEqual(drift.removed, ["c.ts"]);
});
