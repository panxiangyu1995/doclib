import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { runVerify } from "./verify.js";
import { runSnapshot } from "./snapshot.js";
import { docMd, put, tmpRoot } from "./testkit.js";

async function seedBase(root: string): Promise<void> {
  await put(root, "src/a.ts", "v1");
  await put(root, "src/b.ts", "v1");
  await put(root, "src/c.ts", "v1");
  await put(root, "doclib/README.md", "馆导览");
  await put(root, "doclib/INDEX.md", "- [A](30-features/a.md)\n");
  await put(root, "doclib/30-features/a.md", docMd("A", ["src/a.ts", "src/b.ts"]));
}

test("verify：无基线按当前文件扫描（基线注记可辨）", async () => {
  const root = await tmpRoot("doclib-acc-verify-");
  await seedBase(root);
  const r = await runVerify(root, {});
  assert.match(r.text, /覆盖度报告（尚无基线快照，按当前文件扫描）/);
  assert.match(r.text, /代码文件: 3 ｜ 已覆盖: 2（67%）｜ 未覆盖: 1/);
  const j = r.json as { coveragePct: number };
  assert.equal(j.coveragePct, 67);
});

test("verify：有基线后以基线文件清单为准（事后删除不改变覆盖面）", async () => {
  const root = await tmpRoot("doclib-acc-verify-");
  await seedBase(root);
  await runSnapshot(root, {});
  await fs.rm(path.join(root, "src", "a.ts"));
  const r = await runVerify(root, {});
  assert.match(r.text, /覆盖度报告（基线 snap-001 \(version 1\)\）/);
  assert.match(r.text, /代码文件: 3 ｜ 已覆盖: 2（67%）｜ 未覆盖: 1/);
});

test("verify：目录级 covers 覆盖嵌套文件；空馆全覆盖（pct 100）", async () => {
  const root = await tmpRoot("doclib-acc-verify-");
  await put(root, "src/deep/nested/x.ts", "x");
  await put(root, "doclib/30-features/dir.md", docMd("Dir", ["src/"]));
  await put(root, "doclib/INDEX.md", "- [Dir](30-features/dir.md)\n");
  await runSnapshot(root, {});
  const r = await runVerify(root, {});
  assert.match(r.text, /代码文件: 1 ｜ 已覆盖: 1（100%）｜ 未覆盖: 0/);
});

test("verify：馆缺失 → 缺少 INDEX.md + 全部未覆盖", async () => {
  const root = await tmpRoot("doclib-acc-verify-");
  await put(root, "src/a.ts", "v1");
  await runSnapshot(root, {});
  const r = await runVerify(root, {});
  assert.match(r.text, /索引完整性: 缺少 INDEX\.md/);
  assert.match(r.text, /已覆盖: 0（0%）｜ 未覆盖: 1/);
  assert.match(r.text, /无锚点文档.*: 无/);
  assert.match(r.text, /失效文档.*: 无/);
});

test("verify：失效文档检出（covers 指向的代码全部不存在）", async () => {
  const root = await tmpRoot("doclib-acc-verify-");
  await put(root, "src/a.ts", "v1");
  await put(root, "doclib/INDEX.md", "- [Ghost](30-features/ghost.md)\n");
  await put(root, "doclib/30-features/ghost.md", docMd("Ghost", ["src/legacy.ts"]));
  await runSnapshot(root, {});
  const textR = await runVerify(root, {});
  assert.match(textR.text, /失效文档（covers 指向的代码已全部不存在）: 30-features\/ghost\.md/);
  const j = (await runVerify(root, { json: true })).json as { staleDocs: string[] };
  assert.deepEqual(j.staleDocs, ["30-features/ghost.md"]);
});

test("verify：目录级 covers 只要有任一存活文件即不失效", async () => {
  const root = await tmpRoot("doclib-acc-verify-");
  await put(root, "src/keep.ts", "v1");
  await put(root, "src/gone.ts", "v1");
  await put(root, "doclib/INDEX.md", "- [Dir](30-features/dir.md)\n");
  await put(root, "doclib/30-features/dir.md", docMd("Dir", ["src/"]));
  await runSnapshot(root, {});
  const r = await runVerify(root, {});
  assert.match(r.text, /失效文档.*: 无/);
});

test("verify：INDEX 双向核对——幽灵链接 + 未收录文档", async () => {
  const root = await tmpRoot("doclib-acc-verify-");
  await put(root, "src/a.ts", "v1");
  await put(root, "doclib/INDEX.md", "- [幽灵](30-features/ghost.md)\n- [A](30-features/a.md)\n");
  await put(root, "doclib/30-features/a.md", docMd("A", ["src/a.ts"]));
  await put(root, "doclib/10-architecture/data.md", docMd("Data", []));
  const r = await runVerify(root, {});
  assert.match(r.text, /索引指向不存在的文档: 30-features\/ghost\.md/);
  assert.match(r.text, /未被索引收录: 10-architecture\/data\.md/);
});

test("verify：两级断链核对（卷内相对链接 ghost 检出）", async () => {
  const root = await tmpRoot("doclib-acc-verify-");
  await put(root, "doclib/INDEX.md", "- [A](30-features/a.md)\n");
  await put(root, "doclib/30-features/a.md", `${docMd("A", ["src/a.ts"])}[断链](../10-architecture/ghost.md)\n`);
  const r = await runVerify(root, {});
  assert.match(r.text, /链接失效（两级核对）: 30-features\/a\.md → \.\.\/10-architecture\/ghost\.md/);
});

test("verify：卷缺 _index（soft 提示）只针对 NN- 卷；卷级索引未收录检出", async () => {
  const root = await tmpRoot("doclib-acc-verify-");
  await put(root, "doclib/INDEX.md", "- [Data](10-architecture/data.md)\n");
  await put(root, "doclib/10-architecture/data.md", docMd("Data", []));
  let r = await runVerify(root, {});
  assert.match(r.text, /卷缺 _index（soft 提示）: 10-architecture/);
  await put(root, "doclib/10-architecture/_index.md", "- [别的](other.md)\n");
  r = await runVerify(root, {});
  assert.match(r.text, /卷级索引未收录: 10-architecture\/ → 10-architecture\/data\.md/);
  assert.doesNotMatch(r.text, /卷缺 _index/);
});

test("verify：无锚点文档列出（README/INDEX 豁免）", async () => {
  const root = await tmpRoot("doclib-acc-verify-");
  await put(root, "src/a.ts", "v1");
  await put(root, "doclib/INDEX.md", "- [A](30-features/a.md)\n");
  await put(root, "doclib/30-features/a.md", docMd("A", ["src/a.ts"]));
  await put(root, "doclib/40-guides/notes.md", "纯笔记无 frontmatter");
  const r = await runVerify(root, {});
  assert.match(r.text, /无锚点文档（frontmatter 无 covers，导览\/索引类属正常，请人工确认）: 40-guides\/notes\.md/);
  const j = (await runVerify(root, { json: true })).json as { unanchoredDocs: string[] };
  assert.deepEqual(j.unanchoredDocs, ["40-guides/notes.md"]);
});

test("verify：未覆盖目录分组 >15 截断", async () => {
  const root = await tmpRoot("doclib-acc-verify-");
  for (let i = 0; i < 16; i++) {
    await put(root, `d${String(i).padStart(2, "0")}/f.ts`, "x");
  }
  const r = await runVerify(root, {});
  assert.match(r.text, /未覆盖代码文件（按目录分组）:/);
  assert.match(r.text, /… 其余 1 个目录/);
});

test("verify：--json 载荷字段齐备", async () => {
  const root = await tmpRoot("doclib-acc-verify-");
  await seedBase(root);
  await runSnapshot(root, {});
  const r = await runVerify(root, { json: true });
  const j = JSON.parse(r.text) as {
    baseline: string;
    codeFiles: number;
    covered: number;
    coveragePct: number;
    uncoveredGroups: unknown[];
    nonCodeFiles: number;
    unanchoredDocs: string[];
    staleDocs: string[];
    indexIssues: string[];
  };
  assert.equal(j.baseline, "基线 snap-001 (version 1)");
  assert.equal(j.codeFiles, 3);
  assert.equal(j.covered, 2);
  assert.equal(j.coveragePct, 67);
  assert.equal(j.nonCodeFiles, 0);
  assert.deepEqual(j.staleDocs, []);
  assert.ok(Array.isArray(j.indexIssues));
  assert.deepEqual(j, (await runVerify(root, { json: true })).json);
});
