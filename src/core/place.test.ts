import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  applyArchive,
  applyCollect,
  applyRestore,
  archiveDoc,
  buildTombstone,
  collectDoc,
  restoreDoc,
  suggestPlacement,
} from "./place.js";
import { emptyState, type State } from "./state.js";

async function tmp(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-place-"));
  await fs.mkdir(path.join(root, "doclib", "30-features"), { recursive: true });
  await fs.mkdir(path.join(root, "doclib", "99-archive"), { recursive: true });
  await fs.writeFile(
    path.join(root, "doclib", "INDEX.md"),
    "---\ntitle: 总索引\ncovers: []\nstatus: living\n---\n\n# 总索引\n\n| 文档 | 摘要 | 状态 |\n| --- | --- | --- |\n",
    "utf8",
  );
  await fs.writeFile(
    path.join(root, "doclib", "30-features", "_index.md"),
    "---\ntitle: 功能规格索引\ncovers:\n  - src/commands/\nstatus: stable\n---\n\n# 功能规格索引\n\n| 功能 | 规格文档 | covers | 状态 |\n| --- | --- | --- | --- |\n",
    "utf8",
  );
  return root;
}

async function put(root: string, rel: string, content: string): Promise<void> {
  const abs = path.join(root, rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, content, "utf8");
}

async function has(root: string, rel: string): Promise<boolean> {
  return fs
    .access(path.join(root, rel))
    .then(() => true)
    .catch(() => false);
}

test("place：suggestPlacement 按路径/标题给出建议卷与置信度", async () => {
  const root = await tmp();
  await put(root, "docs/api-endpoints.md", "# API 端点清单\n");
  await put(root, "docs/random.md", "# 随笔\n");
  const api = await suggestPlacement(root, "docs/api-endpoints.md");
  assert.equal(api[0]!.volume, "90-reference");
  assert.ok(["high", "medium"].includes(api[0]!.confidence));
  const vague = await suggestPlacement(root, "docs/random.md");
  assert.equal(vague[0]!.confidence, "low");
  assert.ok(vague[0]!.reason.includes("人工裁决"));
});

test("place：buildTombstone 含五要素并保留原正文", () => {
  const content = buildTombstone(
    {
      id: "arc-001",
      kind: "archived",
      from: "docs/old.md",
      to: "doclib/99-archive/001-old.md",
      reason: "内容过时",
      at: "2026-10-22T00:00:00.000Z",
    },
    "\n原始正文内容\n",
  );
  assert.ok(content.includes("何时失效："));
  assert.ok(content.includes("为何失效：内容过时"));
  assert.ok(content.includes("取代者指针："));
  assert.ok(content.includes("原路径：docs/old.md"));
  assert.ok(content.includes("归档方式："));
  assert.ok(content.includes("原始正文内容"));
  assert.ok(content.includes("status: archived"));
});

test("place：collect 收编入馆——移动 + frontmatter + 两级索引 + 归档账", async () => {
  const root = await tmp();
  await put(root, "docs/feature-x.md", "# 功能 X\n\n正文\n");
  const state: State = emptyState();
  const plan = await collectDoc(root, "docs/feature-x.md", "30-features");
  assert.equal(plan.from, "docs/feature-x.md");
  assert.ok(plan.to.startsWith("doclib/30-features/"));
  const r = await applyCollect(root, state, "docs/feature-x.md", "30-features");
  assert.equal(await has(root, "docs/feature-x.md"), false);
  assert.equal(await has(root, r.to), true);
  const moved = await fs.readFile(path.join(root, r.to), "utf8");
  assert.ok(moved.includes("covers:"));
  assert.ok(moved.includes("docs/feature-x.md"));
  assert.ok(moved.includes("status: draft"));
  const idx = await fs.readFile(path.join(root, "doclib", "INDEX.md"), "utf8");
  assert.ok(idx.includes(r.to.replace(/^doclib\//, "")));
  const volIdx = await fs.readFile(path.join(root, "doclib", "30-features", "_index.md"), "utf8");
  assert.ok(volIdx.includes(path.posix.basename(r.to)));
  assert.equal(state.archives.length, 1);
  assert.equal(state.archives[0]!.kind, "collected");
  assert.equal(state.archives[0]!.id, "arc-001");
});

test("place：archive 入棺——移动 + 墓碑 + 原路径指针 + 归档账", async () => {
  const root = await tmp();
  await put(root, "docs/old.md", "# 旧文档\n\n正文\n");
  const state: State = emptyState();
  const plan = await archiveDoc(root, "docs/old.md", "内容过时");
  assert.ok(plan.to.startsWith("doclib/99-archive/"));
  const r = await applyArchive(root, state, "docs/old.md", "内容过时");
  assert.equal(await has(root, "docs/old.md"), true);
  const pointer = await fs.readFile(path.join(root, "docs", "old.md"), "utf8");
  assert.ok(pointer.includes("<!-- doclib:archived-pointer -->"));
  const archived = await fs.readFile(path.join(root, r.to), "utf8");
  assert.ok(archived.includes("为何失效：内容过时"));
  assert.ok(archived.includes("正文"));
  assert.equal(state.archives.length, 1);
  assert.equal(state.archives[0]!.kind, "archived");
  assert.equal(state.archives[0]!.pointer, "docs/old.md");
});

test("place：covers 命中 → 硬拦截（拒绝归位）", async () => {
  const root = await tmp();
  
  await put(root, "src/a.ts", "code");
  await put(root, "doclib/30-features/x.md", "---\ntitle: X\ncovers:\n  - docs/covered.md\nstatus: stable\n---\nX\n");
  await put(root, "docs/covered.md", "散落\n");
  await assert.rejects(
    () => archiveDoc(root, "docs/covered.md", "过时"),
    (e: unknown) => e instanceof Error && /covers 命中/.test(e.message),
  );
  await assert.rejects(
    () => collectDoc(root, "docs/covered.md", "30-features"),
    (e: unknown) => e instanceof Error && /covers 命中/.test(e.message),
  );
});

test("place：非法目标卷 / 非 md / 路径逃逸 → 拒绝", async () => {
  const root = await tmp();
  await put(root, "docs/a.md", "x");
  await put(root, "docs/a.txt", "x");
  await assert.rejects(
    () => collectDoc(root, "docs/a.md", "88-nope"),
    (e: unknown) => e instanceof Error && /目标目录非法/.test(e.message),
  );
  await assert.rejects(
    () => collectDoc(root, "docs/a.txt", "30-features"),
    (e: unknown) => e instanceof Error && /只支持 \.md/.test(e.message),
  );
  await assert.rejects(
    () => collectDoc(root, "../escape.md", "30-features"),
    (e: unknown) => e instanceof Error && /路径非法/.test(e.message),
  );
});

test("place：restore 还原——文件回原位 + 指针删除 + 索引撤销 + 销账", async () => {
  const root = await tmp();
  await put(root, "docs/old.md", "# 旧文档\n");
  const state: State = emptyState();
  const archived = await applyArchive(root, state, "docs/old.md", "内容过时");
  const plan = await restoreDoc(root, state, state.archives[0]!.id);
  assert.equal(plan.to, "docs/old.md");
  const restored = await applyRestore(root, state, state.archives[0]!.id);
  assert.equal(await has(root, "docs/old.md"), true);
  assert.equal(await has(root, archived.to), false);
  assert.equal(state.archives.length, 0);
  const idx = await fs.readFile(path.join(root, "doclib", "INDEX.md"), "utf8");
  assert.ok(!idx.includes(archived.to));
});

test("place：restore 还原为原件——墓碑块剥离 + 原 status 恢复", async () => {
  const root = await tmp();
  const original = "---\ntitle: 原标题\nstatus: stable\n---\n\n# 原文档\n\n原始正文\n";
  await put(root, "docs/old.md", original);
  const state: State = emptyState();
  await applyArchive(root, state, "docs/old.md", "内容过时");
  const archived = await fs.readFile(path.join(root, state.archives[0]!.to), "utf8");
  assert.ok(archived.includes("status: archived"));
  assert.ok(archived.includes("何时失效"));
  assert.ok(archived.includes("原始正文"));
  await applyRestore(root, state, state.archives[0]!.id);
  const restored = await fs.readFile(path.join(root, "docs", "old.md"), "utf8");
  assert.equal(restored, original);
  assert.ok(!restored.includes("墓碑"));
  assert.ok(!restored.includes("archived-from"));
});

test("place：restore 撤销归档件的两级索引登记（不留断链）", async () => {
  const root = await tmp();
  await put(root, "docs/old.md", "# 旧文档\n");
  const state: State = emptyState();
  const archived = await applyArchive(root, state, "docs/old.md", "内容过时");
  const volIdx = await fs.readFile(path.join(root, "doclib", "99-archive", "_index.md"), "utf8");
  assert.ok(volIdx.includes(path.posix.basename(archived.to)));
  await applyRestore(root, state, state.archives[0]!.id);
  const after = await fs.readFile(path.join(root, "doclib", "99-archive", "_index.md"), "utf8");
  assert.ok(!after.includes(path.posix.basename(archived.to)));
  const idx = await fs.readFile(path.join(root, "doclib", "INDEX.md"), "utf8");
  assert.ok(!idx.includes(archived.to.replace(/^doclib\//, "")));
});


test("place：restore 原路径被占用 → 拒绝", async () => {
  const root = await tmp();
  await put(root, "docs/old.md", "# 旧文档\n");
  const state: State = emptyState();
  await applyArchive(root, state, "docs/old.md", "内容过时");
  await put(root, "docs/old.md", "新内容\n");
  await assert.rejects(
    () => applyRestore(root, state, state.archives[0]!.id),
    (e: unknown) => e instanceof Error && /原路径已被占用/.test(e.message),
  );
});

test("place：collect → restore 闭环（collected 类型）——文件回原位 + 索引撤销 + 销账", async () => {
  const root = await tmp();
  const original = "---\ntitle: 功能 X\n---\n\n# 功能 X\n\n正文\n";
  await put(root, "docs/feature-x.md", original);
  const state: State = emptyState();
  const collected = await applyCollect(root, state, "docs/feature-x.md", "30-features");
  assert.equal(state.archives[0]!.kind, "collected");
  assert.equal(await has(root, "docs/feature-x.md"), false);
  const idx = await fs.readFile(path.join(root, "doclib", "INDEX.md"), "utf8");
  assert.ok(idx.includes(collected.to.replace(/^doclib\//, "")));
  const restored = await applyRestore(root, state, state.archives[0]!.id);
  assert.equal(restored.to, "docs/feature-x.md");
  assert.equal(await has(root, "docs/feature-x.md"), true);
  assert.equal(state.archives.length, 0);
  const after = await fs.readFile(path.join(root, "doclib", "INDEX.md"), "utf8");
  assert.ok(!after.includes(collected.to.replace(/^doclib\//, "")));
  const volIdx = await fs.readFile(path.join(root, "doclib", "30-features", "_index.md"), "utf8");
  assert.ok(!volIdx.includes(path.posix.basename(collected.to)));
});

test("place：分区目标 → 卷索引链接为卷内相对路径（不断链）", async () => {
  const root = await tmp();
  await put(root, "docs/sub.md", "# 子册文档\n");
  const state: State = emptyState();
  const r = await applyCollect(root, state, "docs/sub.md", "30-features/cli");
  assert.equal(r.to, "doclib/30-features/cli/001-sub.md");
  const volIdx = await fs.readFile(path.join(root, "doclib", "30-features", "_index.md"), "utf8");
  assert.ok(volIdx.includes("[001-sub.md](cli/001-sub.md)"), `分区链接应为 cli/001-sub.md，实际：${volIdx}`);
  await applyRestore(root, state, state.archives[0]!.id);
  const after = await fs.readFile(path.join(root, "doclib", "30-features", "_index.md"), "utf8");
  assert.ok(!after.includes("001-sub.md"));
});

test("place：4 列表（功能|规格文档|covers|状态）→ 行列数与语义齐整", async () => {
  const root = await tmp();
  await fs.writeFile(
    path.join(root, "doclib", "30-features", "_index.md"),
    "---\ntitle: 功能规格索引\ncovers: []\nstatus: stable\n---\n\n# 功能规格索引\n\n| 功能 | 规格文档 | covers | 状态 |\n| --- | --- | --- | --- |\n",
    "utf8",
  );
  await put(root, "docs/x.md", "# 功能 X\n");
  const state: State = emptyState();
  const r = await applyCollect(root, state, "docs/x.md", "30-features");
  const volIdx = await fs.readFile(path.join(root, "doclib", "30-features", "_index.md"), "utf8");
  const row = volIdx.split("\n").find((l) => l.includes("001-x.md")) ?? "";
  assert.equal(row.split("|").length - 2, 4, `行应 4 格，实际：${row}`);
  assert.ok(row.includes("[001-x.md](001-x.md)"));
  assert.ok(row.includes("docs/x.md"));
  assert.ok(row.includes("draft"));
  assert.equal(r.to.startsWith("doclib/30-features/"), true);
});

test("place：多表 _index → 行追加到首张完整表之后（表头与行同表）", async () => {
  const root = await tmp();
  await fs.writeFile(
    path.join(root, "doclib", "30-features", "_index.md"),
    "---\ntitle: 功能规格索引\ncovers: []\nstatus: stable\n---\n\n# 功能规格索引\n\n| 维度 | 说明 |\n| --- | --- |\n| a | b |\n\n| 功能 | 规格文档 | covers |\n| --- | --- | --- |\n| TODO | TODO | TODO |\n",
    "utf8",
  );
  await put(root, "docs/x.md", "# 功能 X\n");
  const state: State = emptyState();
  await applyCollect(root, state, "docs/x.md", "30-features");
  const lines = (await fs.readFile(path.join(root, "doclib", "30-features", "_index.md"), "utf8")).split("\n");
  const dimIdx = lines.findIndex((l) => l.includes("| 维度 | 说明 |"));
  const funcIdx = lines.findIndex((l) => l.includes("| 功能 | 规格文档 | covers |"));
  const todoIdx = lines.findIndex((l) => l.trim() === "| TODO | TODO | TODO |");
  const rowIdx = lines.findIndex((l) => l.includes("001-x.md"));
  assert.ok(dimIdx >= 0 && funcIdx >= 0 && todoIdx >= 0 && rowIdx >= 0);
  assert.equal(rowIdx, todoIdx + 1, "行应紧跟功能表末行（表头与行同表）");
  assert.ok(dimIdx < funcIdx, "维度表在功能表之前");
  const row = lines[rowIdx]!;
  assert.equal(row.split("|").length - 2, 3, `行应 3 格（功能表形态），实际：${row}`);
});
