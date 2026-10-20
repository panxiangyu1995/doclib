import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { checkVolumeIndexes, scanBrokenLinks } from "./docquality.js";

async function tmpLib(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-docq-"));
  await fs.mkdir(path.join(root, "doclib", "30-features"), { recursive: true });
  await fs.mkdir(path.join(root, "doclib", "50-testing"), { recursive: true });
  return root;
}

test("scanBrokenLinks：馆内相对断链检出；外链/锚点/根绝对/INDEX 跳过", async () => {
  const root = await tmpLib();
  await fs.writeFile(
    path.join(root, "doclib", "30-features", "a.md"),
    "[x](missing.md) [y](https://e.com/x.md) [z](#anchor) [w](/30-features/a.md) [v](../50-testing/t.md)",
    "utf8",
  );
  await fs.writeFile(path.join(root, "doclib", "50-testing", "t.md"), "T", "utf8");
  await fs.writeFile(path.join(root, "doclib", "INDEX.md"), "[broken](nope.md)", "utf8");
  const broken = await scanBrokenLinks(root);
  assert.deepEqual(broken, ["30-features/a.md → missing.md"]);
});

test("checkVolumeIndexes：卷 _index 双向核对（漏登检出 + 缺 _index 报 missingIndex）", async () => {
  const root = await tmpLib();
  await fs.writeFile(path.join(root, "doclib", "30-features", "_index.md"), "[a](a.md)", "utf8");
  await fs.writeFile(path.join(root, "doclib", "30-features", "a.md"), "A", "utf8");
  await fs.writeFile(path.join(root, "doclib", "30-features", "b.md"), "B", "utf8");
  await fs.writeFile(path.join(root, "doclib", "50-testing", "t.md"), "T", "utf8");
  const r = await checkVolumeIndexes(path.join(root, "doclib"));
  assert.deepEqual(r.missingIndex, ["50-testing"]);
  assert.deepEqual(r.unlisted, [{ dir: "30-features", docs: ["30-features/b.md"] }]);
});

test("checkVolumeIndexes：分区目录缺 _index 不计入 missingIndex；分区 _index 同规则核对", async () => {
  const root = await tmpLib();
  await fs.mkdir(path.join(root, "doclib", "30-features", "cli"), { recursive: true });
  await fs.writeFile(path.join(root, "doclib", "30-features", "a.md"), "A", "utf8");
  await fs.writeFile(
    path.join(root, "doclib", "30-features", "_index.md"),
    "[a](a.md) [cli 索引](cli/c.md)",
    "utf8",
  );
  await fs.writeFile(path.join(root, "doclib", "30-features", "cli", "_index.md"), "[c](c.md)", "utf8");
  await fs.writeFile(path.join(root, "doclib", "30-features", "cli", "c.md"), "C", "utf8");
  const r = await checkVolumeIndexes(path.join(root, "doclib"));
  assert.deepEqual(r.missingIndex, []);
  assert.deepEqual(r.unlisted, []);
});
