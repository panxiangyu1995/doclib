import test from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { runAck } from "./ack.js";
import { DoclibError, loadState } from "../core/state.js";
import { put, tmpRoot } from "./testkit.js";
import { runSnapshot } from "./snapshot.js";

test("ack：缺路径参数 → DoclibError（含用法）", async () => {
  const root = await tmpRoot("doclib-acc-ack-");
  await assert.rejects(
    () => runAck(root, {}),
    (e: unknown) =>
      e instanceof DoclibError &&
      /ack 需要路径参数：doclib ack <路径> \[--note 文本\] \[--standing\] \[--remove\]/.test(e.message),
  );
});

test("ack：once 登记绑定当前基线；--note 落库；持久化到 state.json", async () => {
  const root = await tmpRoot("doclib-acc-ack-");
  await put(root, "src/a.ts", "v1");
  await runSnapshot(root, {});
  const r = await runAck(root, { path: "src/gen.ts", note: "生成物豁免" });
  assert.match(r.text, /已登记豁免: src\/gen\.ts （once：下次 snapshot 自动清除）/);
  const state = await loadState(root);
  assert.equal(state.acks.length, 1);
  assert.equal(state.acks[0]!.path, "src/gen.ts");
  assert.equal(state.acks[0]!.note, "生成物豁免");
  assert.equal(state.acks[0]!.kind, "once");
  assert.equal(state.acks[0]!.baseline, "snap-001");
});

test("ack：无基线时 once 的 baseline 为 undefined", async () => {
  const root = await tmpRoot("doclib-acc-ack-");
  const r = await runAck(root, { path: "x.ts" });
  assert.match(r.text, /已登记豁免: x\.ts/);
  const state = await loadState(root);
  assert.equal(state.acks[0]!.baseline, undefined);
});

test("ack：standing 长期豁免（无 baseline 字段）", async () => {
  const root = await tmpRoot("doclib-acc-ack-");
  await runSnapshot(root, {});
  const r = await runAck(root, { path: "src/generated/**", standing: true });
  assert.match(r.text, /（standing：长期豁免，--remove 可移除）/);
  const state = await loadState(root);
  assert.equal(state.acks[0]!.kind, "standing");
  assert.equal(state.acks[0]!.baseline, undefined);
});

test("ack：--remove 移除同路径全部豁免；未命中返回 0", async () => {
  const root = await tmpRoot("doclib-acc-ack-");
  await runAck(root, { path: "src/x.ts", standing: true });
  await runAck(root, { path: "src/x.ts", note: "again" });
  await runAck(root, { path: "src/y.ts" });
  let r = await runAck(root, { path: "src/x.ts", remove: true });
  assert.match(r.text, /已移除 src\/x\.ts 的 2 条豁免/);
  assert.equal((r.json as { removed: number }).removed, 2);
  r = await runAck(root, { path: "src/none.ts", remove: true });
  assert.equal((r.json as { removed: number }).removed, 0);
  const state = await loadState(root);
  assert.deepEqual(
    state.acks.map((a) => a.path),
    ["src/y.ts"],
  );
});

test("ack：--remove 优先于 --standing", async () => {
  const root = await tmpRoot("doclib-acc-ack-");
  await runAck(root, { path: "src/x.ts", standing: true });
  const r = await runAck(root, { path: "src/x.ts", standing: true, remove: true });
  assert.match(r.text, /已移除/);
  const state = await loadState(root);
  assert.equal(state.acks.length, 0);
});

test("ack：--note 缺值不崩溃（note 为空串）", async () => {
  const root = await tmpRoot("doclib-acc-ack-");
  const r = await runAck(root, { path: "src/x.ts", note: undefined });
  assert.match(r.text, /已登记豁免: src\/x\.ts/);
  const state = await loadState(root);
  assert.equal(state.acks[0]!.note, "");
});

test("ack --dir：登记目录豁免（归一化补尾斜杠 + 去重）", async () => {
  const root = await tmpRoot("doclib-acc-ack-");
  await put(root, ".foo/skills/demo/SKILL.md", "x");
  const r = await runAck(root, { path: ".foo", dir: true, note: "新工具 Foo" });
  assert.match(r.text, /已登记目录豁免: \.foo\//);
  assert.match(r.text, /仍进代码账/);
  const state = await loadState(root);
  assert.deepEqual(state.dirExempts, [".foo/"]);
  await runAck(root, { path: ".foo/", dir: true, note: "again" });
  const again = await loadState(root);
  assert.deepEqual(again.dirExempts, [".foo/"]);
});

test("ack --dir --remove：移除目录豁免；未命中返回 0", async () => {
  const root = await tmpRoot("doclib-acc-ack-");
  await put(root, ".foo/skills/demo/SKILL.md", "x");
  await runAck(root, { path: ".foo", dir: true });
  let r = await runAck(root, { path: ".foo", dir: true, remove: true });
  assert.equal((r.json as { removed: number }).removed, 1);
  r = await runAck(root, { path: ".bar", dir: true, remove: true });
  assert.equal((r.json as { removed: number }).removed, 0);
  const state = await loadState(root);
  assert.deepEqual(state.dirExempts, []);
});

test("ack --dir：不写 acks 账本（目录豁免与逐文件豁免两套账）", async () => {
  const root = await tmpRoot("doclib-acc-ack-");
  await put(root, ".foo/skills/demo/SKILL.md", "x");
  await runAck(root, { path: ".foo", dir: true });
  const state = await loadState(root);
  assert.equal(state.acks.length, 0);
});

test("ack --dir：目录不存在 → 拒绝（防拼写错误静默无效）", async () => {
  const root = await tmpRoot("doclib-acc-ack-");
  await assert.rejects(
    () => runAck(root, { path: ".typo", dir: true, note: "拼写错误" }),
    (e: unknown) => e instanceof Error && /目录豁免目标不存在/.test(e.message),
  );
  const state = await loadState(root);
  assert.deepEqual(state.dirExempts, []);
});

test("ack --dir --remove：目录已删除仍可移除豁免", async () => {
  const root = await tmpRoot("doclib-acc-ack-");
  await put(root, ".foo/skills/demo/SKILL.md", "x");
  await runAck(root, { path: ".foo", dir: true });
  await fs.rm(path.join(root, ".foo"), { recursive: true, force: true });
  const r = await runAck(root, { path: ".foo", dir: true, remove: true });
  assert.equal((r.json as { removed: number }).removed, 1);
});
