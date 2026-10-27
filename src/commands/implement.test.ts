import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runImplement } from "./implement.js";
import { get, has, put, seedState } from "./testkit.js";
import { DoclibError } from "../core/state.js";

async function tmp(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "doclib-impl-cmd-"));
}

const HEADER = "| # | 功能 | 描述 | 对应文档 | 状态 |\n| --- | --- | --- | --- | --- |\n";

async function seed(root: string, docs: string, status = "planned"): Promise<void> {
  await seedState(root, { planning: [".plan/"] });
  await put(
    root,
    "doclib/00-overview/feature-map.md",
    HEADER + `| 1 | 类别完备性 | a | ${docs} | ${status} |\n`,
  );
  if (docs !== "") await put(root, "doclib/30-features/a.md", "规格正文 AC-1 Given x When y Then z\n");
}

test("implement：无 --feature 列 planned 候选", async () => {
  const root = await tmp();
  await seed(root, "doclib/30-features/a.md");
  const r = await runImplement(root, {});
  assert.ok(r.text.includes("planned 候选清单"));
  assert.ok(r.text.includes("#1"));
  assert.ok(r.text.includes("类别完备性"));
  assert.ok(r.text.includes("revision:"));
});

test("implement：readiness 不通过 → DoclibError 且不落盘", async () => {
  const root = await tmp();
  await seed(root, "");
  await assert.rejects(() => runImplement(root, { feature: 1 }), (e: unknown) => {
    assert.ok(e instanceof DoclibError);
    assert.ok((e as DoclibError).message.includes("readiness 不通过"));
    assert.ok((e as DoclibError).message.includes("对应文档"));
    return true;
  });
  assert.equal(await has(root, ".plan"), false);
});

test("implement：干跑预览不落盘", async () => {
  const root = await tmp();
  await seed(root, "doclib/30-features/a.md#AC-1");
  const r = await runImplement(root, { feature: 1 });
  assert.ok(r.text.includes("骨架预览"));
  assert.ok(r.text.includes("type: plan-skeleton"));
  assert.ok(r.text.includes("TODO(agent)"));
  const entries = await fs.readdir(path.join(root, ".plan"), { recursive: true }).catch(() => [] as string[]);
  assert.equal(entries.filter((e) => e.endsWith(".md")).length, 0);
});

test("implement：--apply 落盘 .plan/<日期>/<slug>.md 且 frontmatter 齐备", async () => {
  const root = await tmp();
  await seed(root, "doclib/30-features/a.md#AC-1");
  const r = await runImplement(root, { feature: 1, apply: true });
  const today = new Date().toISOString().slice(0, 10);
  const rel = `.plan/${today}/feature-1.md`;
  assert.ok(r.text.includes(rel));
  assert.equal(await has(root, rel), true);
  const raw = await get(root, rel);
  assert.ok(raw.includes("type: plan-skeleton"));
  assert.ok(raw.includes("feature: 1"));
  assert.ok(raw.includes("anchors:"));
  assert.ok(raw.includes("doclib/30-features/a.md#AC-1"));
  assert.ok(raw.includes("TODO(agent)"));
});

test("implement：未知功能号 → DoclibError", async () => {
  const root = await tmp();
  await seed(root, "doclib/30-features/a.md");
  await assert.rejects(() => runImplement(root, { feature: 42 }), DoclibError);
});
