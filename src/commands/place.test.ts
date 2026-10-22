import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { runPlace } from "./place.js";
import { loadState } from "../core/state.js";
import { put, tmpRoot } from "./testkit.js";

async function has(root: string, rel: string): Promise<boolean> {
  return fs
    .access(path.join(root, rel))
    .then(() => true)
    .catch(() => false);
}

async function seed(root: string): Promise<void> {
  await fs.mkdir(path.join(root, "doclib", "30-features"), { recursive: true });
  await fs.mkdir(path.join(root, "doclib", "99-archive"), { recursive: true });
  await fs.writeFile(
    path.join(root, "doclib", "INDEX.md"),
    "---\ntitle: 总索引\ncovers: []\nstatus: living\n---\n\n# 总索引\n\n| 文档 | 摘要 | 状态 |\n| --- | --- | --- |\n",
    "utf8",
  );
  await put(root, "docs/feature-x.md", "# 功能 X\n\n正文\n");
}

test("place list：列待归位文档与建议归宿", async () => {
  const root = await tmpRoot("doclib-acc-place-");
  await seed(root);
  const r = await runPlace(root, { action: "list" });
  assert.match(r.text, /待归位文档 \(1\)/);
  assert.match(r.text, /docs\/feature-x\.md/);
  assert.match(r.text, /建议:/);
  assert.match(r.text, /doclib place collect/);
});

test("place list：无待归位 → 明确提示 0", async () => {
  const root = await tmpRoot("doclib-acc-place-");
  await seed(root);
  await fs.rm(path.join(root, "docs"), { recursive: true, force: true });
  const r = await runPlace(root, { action: "list" });
  assert.match(r.text, /待归位文档: 0/);
});

test("place archive 干跑：零副作用 + 输出动作清单", async () => {
  const root = await tmpRoot("doclib-acc-place-");
  await seed(root);
  const r = await runPlace(root, { action: "archive", path: "docs/feature-x.md", reason: "内容过时" });
  assert.match(r.text, /干跑，未执行/);
  assert.equal(await has(root, "docs/feature-x.md"), true);
  const files = await fs.readdir(path.join(root, "doclib", "99-archive"));
  assert.equal(files.length, 0);
  assert.equal((r.json as { dryRun: boolean }).dryRun, true);
});

test("place archive --apply：入棺 + 指针 + 归档账", async () => {
  const root = await tmpRoot("doclib-acc-place-");
  await seed(root);
  const r = await runPlace(root, {
    action: "archive",
    path: "docs/feature-x.md",
    reason: "内容过时",
    apply: true,
  });
  assert.match(r.text, /已入棺/);
  const pointer = await fs.readFile(path.join(root, "docs", "feature-x.md"), "utf8");
  assert.ok(pointer.includes("<!-- doclib:archived-pointer -->"));
  const state = await loadState(root);
  assert.equal(state.archives.length, 1);
  assert.equal(state.archives[0]!.from, "docs/feature-x.md");
});

test("place collect --apply：收编入馆 + 两级索引", async () => {
  const root = await tmpRoot("doclib-acc-place-");
  await seed(root);
  const r = await runPlace(root, {
    action: "collect",
    path: "docs/feature-x.md",
    to: "30-features",
    apply: true,
  });
  assert.match(r.text, /已收编/);
  assert.equal(await has(root, "docs/feature-x.md"), false);
  const idx = await fs.readFile(path.join(root, "doclib", "INDEX.md"), "utf8");
  assert.match(idx, /30-features\//);
});

test("place collect：缺 --to → DoclibError；archive：缺 --reason → DoclibError", async () => {
  const root = await tmpRoot("doclib-acc-place-");
  await seed(root);
  await assert.rejects(
    () => runPlace(root, { action: "collect", path: "docs/feature-x.md" }),
    (e: unknown) => e instanceof Error && /必须指定目标卷/.test(e.message),
  );
  await assert.rejects(
    () => runPlace(root, { action: "archive", path: "docs/feature-x.md" }),
    (e: unknown) => e instanceof Error && /必须指定失效原因/.test(e.message),
  );
});

test("place ack：登记 standing 豁免", async () => {
  const root = await tmpRoot("doclib-acc-place-");
  await seed(root);
  const r = await runPlace(root, { action: "ack", path: "docs/feature-x.md", note: "产品簿记" });
  assert.match(r.text, /已登记豁免/);
  const state = await loadState(root);
  assert.equal(state.acks.length, 1);
  assert.equal(state.acks[0]!.kind, "standing");
  assert.equal(state.acks[0]!.note, "产品簿记");
});

test("place restore：干跑零副作用；--apply 还原", async () => {
  const root = await tmpRoot("doclib-acc-place-");
  await seed(root);
  await runPlace(root, { action: "archive", path: "docs/feature-x.md", reason: "过时", apply: true });
  const dry = await runPlace(root, { action: "restore", path: "arc-001" });
  assert.match(dry.text, /干跑，未执行/);
  const pointer = await fs.readFile(path.join(root, "docs", "feature-x.md"), "utf8");
  assert.ok(pointer.includes("<!-- doclib:archived-pointer -->"));
  const applied = await runPlace(root, { action: "restore", path: "arc-001", apply: true });
  assert.match(applied.text, /已还原/);
  const restored = await fs.readFile(path.join(root, "docs", "feature-x.md"), "utf8");
  assert.ok(!restored.includes("archived-pointer"));
  assert.ok(restored.includes("功能 X"));
});

test("place：未知子命令 → DoclibError", async () => {
  const root = await tmpRoot("doclib-acc-place-");
  await assert.rejects(
    () => runPlace(root, { action: "bogus" as "list" }),
    (e: unknown) => e instanceof Error && /未知 place 子命令/.test(e.message),
  );
});
