import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runPlan } from "./plan.js";

async function tmp(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "doclib-plan-"));
}

test("plan --bootstrap：生成 BOOTSTRAP 任务书（含挖掘清单与 revision）", async () => {
  const root = await tmp();
  await fs.mkdir(path.join(root, "doclib"), { recursive: true });
  const r = await runPlan(root, { bootstrap: true });
  assert.match(r.text, /BOOTSTRAP-001/);
  const content = await fs.readFile(path.join(root, ".doclib", "tasks", "BOOTSTRAP-001.md"), "utf8");
  assert.ok(content.includes("对话挖掘"));
  assert.ok(content.includes("revision: 0"));
  assert.ok(content.includes("文档先行"));
});

test("plan --resume：生成 RESUME 任务书（含项目清单）", async () => {
  const root = await tmp();
  await fs.mkdir(path.join(root, "doclib"), { recursive: true });
  await fs.writeFile(path.join(root, "index.js"), "x", "utf8");
  const r = await runPlan(root, { resume: true });
  assert.match(r.text, /RESUME-001/);
  const content = await fs.readFile(path.join(root, ".doclib", "tasks", "RESUME-001.md"), "utf8");
  assert.ok(content.includes("既有代码蒸馏"));
  assert.ok(content.includes("implemented"));
});

test("plan：bootstrap/resume/rebuild 互斥", async () => {
  const root = await tmp();
  await fs.mkdir(path.join(root, "doclib"), { recursive: true });
  await assert.rejects(() => runPlan(root, { bootstrap: true, resume: true }), /互斥/);
  await assert.rejects(() => runPlan(root, { rebuild: true, bootstrap: true }), /互斥/);
});
