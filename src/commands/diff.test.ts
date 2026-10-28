import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { runDiff, analyzeDrift, describeDrift } from "./diff.js";
import { DoclibError } from "../core/state.js";
import { docMd, put, tmpRoot } from "./testkit.js";
import { runSnapshot } from "./snapshot.js";

test("diff：无基线 → DoclibError（含引导提示）", async () => {
  const root = await tmpRoot("doclib-acc-diff-");
  await assert.rejects(
    () => runDiff(root, {}),
    (e: unknown) =>
      e instanceof DoclibError && /尚无基线快照：先执行 doclib snapshot（若图书馆还没构建，先 doclib plan 生成 BUILD 工单）/.test(e.message),
  );
});

test("diff：无漂移文案；json 结构", async () => {
  const root = await tmpRoot("doclib-acc-diff-");
  await put(root, "src/a.ts", "v1");
  await put(root, "doclib/30-features/a.md", docMd("A", ["src/a.ts"]));
  await runSnapshot(root, {});
  const r = await runDiff(root, {});
  assert.match(r.text, /基线: snap-001 \(version 1\)/);
  assert.match(r.text, /漂移: \+0 新增 \/ ~0 修改 \/ -0 删除/);
  assert.match(r.text, /无漂移，图书馆与代码同步。/);
  const j = r.json as { snapshotId: string; snapshotVersion: number; drift: { added: string[] } };
  assert.equal(j.snapshotId, "snap-001");
  assert.equal(j.snapshotVersion, 1);
  assert.deepEqual(j.drift.added, []);
});

test("diff：新增/修改/删除三类判定 + covers 文档映射", async () => {
  const root = await tmpRoot("doclib-acc-diff-");
  await put(root, "src/a.ts", "v1");
  await put(root, "src/gone.ts", "bye");
  await put(root, "doclib/30-features/dir.md", docMd("Dir", ["src/"]));
  await runSnapshot(root, {});
  await put(root, "src/a.ts", "v2");
  await put(root, "src/new.ts", "hi");
  await fs.rm(path.join(root, "src", "gone.ts"));
  const an = await analyzeDrift(root);
  assert.deepEqual(an.drift.added, ["src/new.ts"]);
  assert.deepEqual(an.drift.modified, ["src/a.ts"]);
  assert.deepEqual(an.drift.removed, ["src/gone.ts"]);
  assert.deepEqual(an.rows.find((r) => r.path === "src/a.ts")!.docs, ["30-features/dir.md"]);
  assert.deepEqual(an.rows.find((r) => r.path === "src/new.ts")!.docs, ["30-features/dir.md"]);
  assert.deepEqual(an.rows.find((r) => r.path === "src/gone.ts")!.docs, ["30-features/dir.md"]);
});

test("diff：精确 covers 优先于目录级 covers（不叠加）", async () => {
  const root = await tmpRoot("doclib-acc-diff-");
  await put(root, "src/a.ts", "v1");
  await put(root, "src/b.ts", "v1");
  await put(root, "doclib/30-features/dir.md", docMd("Dir", ["src/"]));
  await put(root, "doclib/30-features/exact.md", docMd("Exact", ["src/a.ts"]));
  await runSnapshot(root, {});
  await put(root, "src/a.ts", "v2");
  await put(root, "src/b.ts", "v2");
  const an = await analyzeDrift(root);
  assert.deepEqual(an.rows.find((r) => r.path === "src/a.ts")!.docs, ["30-features/exact.md"]);
  assert.deepEqual(an.rows.find((r) => r.path === "src/b.ts")!.docs, ["30-features/dir.md"]);
});

test("diff：无覆盖标签区分——新增（无覆盖文档 → 需落文档）/ 删除（无关联文档）", async () => {
  const root = await tmpRoot("doclib-acc-diff-");
  await put(root, "src/old.ts", "v1");
  await runSnapshot(root, {});
  await put(root, "src/fresh.ts", "new");
  await fs.rm(path.join(root, "src", "old.ts"));
  const text = describeDrift(await analyzeDrift(root));
  assert.match(text, /src\/fresh\.ts  →  \(无覆盖文档 → 需落文档\)/);
  assert.match(text, /src\/old\.ts  →  \(无关联文档\)/);
  assert.match(text, /提示: 2 个变更路径没有文档覆盖。下一步: doclib plan 生成更新工单。/);
});

test("diff：单段超 50 行截断（55 新增 → 显示 50 + 其余 5 项；json 全量）", async () => {
  const root = await tmpRoot("doclib-acc-diff-");
  await runSnapshot(root, {});
  for (let i = 0; i < 55; i++) {
    await put(root, `src/f${String(i).padStart(3, "0")}.ts`, "x");
  }
  const an = await analyzeDrift(root);
  assert.equal(an.drift.added.length, 55);
  const text = describeDrift(an);
  assert.match(text, /新增 \(55\)/);
  assert.match(text, /… 其余 5 项/);
  const listed = text.split("\n").filter((l) => l.includes("src/f"));
  assert.equal(listed.length, 50);
  const r = await runDiff(root, { json: true });
  const j = JSON.parse(r.text) as { rows: unknown[] };
  assert.equal(j.rows.length, 55);
});

test("diff：行按路径字典序排序", async () => {
  const root = await tmpRoot("doclib-acc-diff-");
  await runSnapshot(root, {});
  await put(root, "src/c.ts", "x");
  await put(root, "src/a.ts", "x");
  await put(root, "src/b.ts", "x");
  const an = await analyzeDrift(root);
  assert.deepEqual(an.rows.map((r) => r.path), ["src/a.ts", "src/b.ts", "src/c.ts"]);
});

test("diff：馆内文档改动不算漂移；代码与文档同改各自可见", async () => {
  const root = await tmpRoot("doclib-acc-diff-");
  await put(root, "src/a.ts", "v1");
  await put(root, "doclib/30-features/a.md", docMd("A", ["src/a.ts"]));
  await runSnapshot(root, {});
  await put(root, "doclib/30-features/a.md", docMd("A", ["src/a.ts"], "更新内容\n"));
  const an1 = await analyzeDrift(root);
  assert.equal(an1.drift.added.length + an1.drift.modified.length + an1.drift.removed.length, 0);
  await put(root, "src/a.ts", "v2");
  const an2 = await analyzeDrift(root);
  assert.deepEqual(an2.drift.modified, ["src/a.ts"]);
});

test("diff：新 .gitignore 排除基线文件 → 计为删除；.gitignore 自身为新增", async () => {
  const root = await tmpRoot("doclib-acc-diff-");
  await put(root, "src/a.ts", "v1");
  await runSnapshot(root, {});
  await put(root, ".gitignore", "src/\n");
  const an = await analyzeDrift(root);
  assert.deepEqual(an.drift.removed, ["src/a.ts"]);
  assert.deepEqual(an.drift.added, [".gitignore"]);
});

test("diff：--json 输出与 json 字段同源（stdout 可直接 JSON.parse）", async () => {
  const root = await tmpRoot("doclib-acc-diff-");
  await put(root, "src/a.ts", "v1");
  await runSnapshot(root, {});
  await put(root, "src/a.ts", "v2");
  const r = await runDiff(root, { json: true });
  const parsed = JSON.parse(r.text) as { drift: { modified: string[] } };
  assert.deepEqual(parsed.drift.modified, ["src/a.ts"]);
  assert.deepEqual(parsed, r.json);
});

test("diff：git 仓库基线归属行与跨分支不一致提示", async () => {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const exec = promisify(execFile);
  const root = await tmpRoot("doclib-acc-diff-git-");
  await exec("git", ["init", "-q", "-b", "main", root]);
  await put(root, "src/a.ts", "v1");
  await exec("git", ["-C", root, "add", "-A"]);
  await exec("git", ["-C", root, "-c", "user.email=t@t.io", "-c", "user.name=t", "commit", "-qm", "seed"]);
  await runSnapshot(root, {});
  const same = await runDiff(root, {});
  assert.match(same.text, /基线: snap-001 \(version 1\)（来自分支 main @ [0-9a-f]{7}）/);
  await exec("git", ["-C", root, "checkout", "-q", "-b", "feat-cross"]);
  const cross = await runDiff(root, {});
  assert.match(cross.text, /⚠ 当前分支 feat-cross 与基线分支 main 不一致/);
});
