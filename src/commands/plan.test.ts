import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runPlan } from "./plan.js";
import { runSnapshot } from "./snapshot.js";
import { DoclibError } from "../core/state.js";
import { docMd, has, put, seedState, tmpRoot } from "./testkit.js";

async function tmp(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "doclib-plan-"));
}

async function tasks(root: string): Promise<string[]> {
  return fs.readdir(path.join(root, ".doclib", "tasks")).catch(() => [] as string[]);
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

test("plan：bootstrap/resume/rebuild 互斥（三组两两组合）", async () => {
  const root = await tmp();
  await fs.mkdir(path.join(root, "doclib"), { recursive: true });
  await assert.rejects(() => runPlan(root, { bootstrap: true, resume: true }), /互斥/);
  await assert.rejects(() => runPlan(root, { rebuild: true, bootstrap: true }), /互斥/);
  await assert.rejects(() => runPlan(root, { rebuild: true, resume: true }), /互斥/);
});

test("plan：全新空目录也生成 BUILD-001（规模 0/未知语言/尚未建立基线/revision 0）", async () => {
  const root = await tmp();
  const r = await runPlan(root, {});
  assert.match(r.text, /已生成任务书: BUILD-001/);
  assert.match(r.text, /revision: 0/);
  const content = await fs.readFile(path.join(root, ".doclib", "tasks", "BUILD-001.md"), "utf8");
  assert.ok(content.includes("规模: 0 个文件"));
  assert.ok(content.includes("语言分布: 无"));
  assert.ok(content.includes("主语言: 未知"));
  assert.ok(content.includes("尚未建立基线"));
  assert.ok(content.includes('doclib snapshot --note "initial build"'));
});

test("plan：BUILD 清单采集 package.json（项目名/框架/scripts/树）", async () => {
  const root = await tmp();
  await put(root, "package.json", JSON.stringify({ name: "demo-app", dependencies: { react: "18" }, scripts: { build: "tsc", test: "vitest" } }));
  await put(root, "src/index.ts", "export {};");
  const r = await runPlan(root, {});
  const content = await fs.readFile(path.join(root, ".doclib", "tasks", "BUILD-001.md"), "utf8");
  assert.ok(content.includes("项目名: demo-app"));
  assert.ok(content.includes("React"));
  assert.ok(content.includes("scripts: build, test"));
  assert.ok(content.includes("src/index.ts"));
  assert.ok(content.includes("doclib-build"));
  assert.ok(r.text.includes("doclib-build"));
});

test("plan：无基线时重复生成 BUILD-001（覆盖式），有基线且无漂移则拒绝生成", async () => {
  const root = await tmp();
  await fs.mkdir(path.join(root, "doclib"), { recursive: true });
  await put(root, "src/a.ts", "v1");
  await runPlan(root, {});
  const r2 = await runPlan(root, {});
  assert.match(r2.text, /BUILD-001/);
  await runSnapshot(root, {});
  const r3 = await runPlan(root, {});
  assert.match(r3.text, /无漂移：图书馆与代码已同步，无需生成更新任务书。/);
  assert.ok(!(await has(root, ".doclib/tasks/BUILD-002.md")));
});

test("plan：UPDATE-002 三段漂移 + 文档映射 + 收尾提示（基线 v1 → 编号 002）", async () => {
  const root = await tmp();
  await put(root, "src/a.ts", "v1");
  await put(root, "doclib/30-features/a.md", docMd("A", ["src/a.ts"]));
  await runSnapshot(root, {});
  await put(root, "src/a.ts", "v2");
  await put(root, "src/new.ts", "added");
  const r = await runPlan(root, {});
  assert.match(r.text, /已生成任务书: UPDATE-002/);
  const content = await fs.readFile(path.join(root, ".doclib", "tasks", "UPDATE-002.md"), "utf8");
  assert.ok(content.includes("基线: snap-001 (version 1)"));
  assert.ok(content.includes("### 新增 — 需建立或并入文档 (1)"));
  assert.ok(content.includes("src/new.ts"));
  assert.ok(content.includes("### 修改 — 更新受影响文档 (1)"));
  assert.ok(content.includes("src/a.ts  →  30-features/a.md"));
  assert.ok(content.includes("doclib-update"));
  assert.ok(content.includes('snapshot --note "update to version 2"'));
});

test("plan：UPDATE 删除段——无覆盖文件标注（无关联文档）", async () => {
  const root = await tmp();
  await put(root, "src/gone.ts", "bye");
  await runSnapshot(root, {});
  await fs.rm(path.join(root, "src", "gone.ts"));
  const r = await runPlan(root, {});
  const content = await fs.readFile(path.join(root, ".doclib", "tasks", "UPDATE-002.md"), "utf8");
  assert.ok(content.includes("### 删除 — retire 候选 (1)"));
  assert.ok(content.includes("src/gone.ts  →  (无关联文档)"));
});

test("plan：无漂移不生成文件，提示同步", async () => {
  const root = await tmp();
  await put(root, "src/a.ts", "v1");
  await runSnapshot(root, {});
  const r = await runPlan(root, {});
  assert.match(r.text, /无漂移：图书馆与代码已同步/);
  assert.equal((r.json as { task: null }).task, null);
  assert.deepEqual(await tasks(root), []);
});

test("plan：载体规划文档晚于基线 → 待登记提醒（无漂移时也提示）", async () => {
  const root = await tmp();
  await put(root, "src/a.ts", "v1");
  await runSnapshot(root, {});
  await put(root, ".plan/idea.md", "新功能构想");
  const r = await runPlan(root, {});
  assert.match(r.text, /待登记（锚点一）: 1 份载体规划文档晚于最新基线/);
  assert.match(r.text, /\.plan\/idea\.md/);
});

test("plan --rebuild：无图书馆报错；有则生成 REBUILD-001（隔离约束/默认目标/编号按现存计数）", async () => {
  const root = await tmp();
  await assert.rejects(
    () => runPlan(root, { rebuild: true }),
    (e: unknown) => e instanceof DoclibError && /图书馆 doclib\/ 不存在：先 doclib init 并完成构建/.test(e.message),
  );
  await fs.mkdir(path.join(root, "doclib"), { recursive: true });
  const r1 = await runPlan(root, { rebuild: true });
  assert.match(r1.text, /REBUILD-001/);
  let content = await fs.readFile(path.join(root, ".doclib", "tasks", "REBUILD-001.md"), "utf8");
  assert.ok(content.includes(`目标目录: ${path.join("..", `${path.basename(root)}-rebuild`)}`));
  assert.ok(content.includes("只允许读取 doclib/"));
  await put(root, ".doclib/tasks/REBUILD-XYZ.md", "奇怪命名也计入");
  const r2 = await runPlan(root, { rebuild: true });
  assert.match(r2.text, /REBUILD-003/);
  const r3 = await runPlan(root, { rebuild: true, to: "/tmp/custom-dest" });
  content = await fs.readFile(path.join(root, ".doclib", "tasks", "REBUILD-004.md"), "utf8");
  assert.ok(content.includes("目标目录: /tmp/custom-dest"));
  assert.ok(r3.text.includes("REBUILD-004"));
});

test("plan --bootstrap/--resume：重复生成递增编号", async () => {
  const root = await tmp();
  await fs.mkdir(path.join(root, "doclib"), { recursive: true });
  await runPlan(root, { bootstrap: true });
  const r2 = await runPlan(root, { bootstrap: true });
  assert.match(r2.text, /BOOTSTRAP-002/);
  await runPlan(root, { resume: true });
  const r4 = await runPlan(root, { resume: true });
  assert.match(r4.text, /RESUME-002/);
  assert.deepEqual((await tasks(root)).sort(), ["BOOTSTRAP-001.md", "BOOTSTRAP-002.md", "RESUME-001.md", "RESUME-002.md"]);
});

test("plan：自定义规划载体目录下的文件不计入清单", async () => {
  const root = await tmp();
  await fs.mkdir(path.join(root, "doclib"), { recursive: true });
  await seedState(root, { planning: ["plans/"] });
  await put(root, "plans/private-idea.md", "内部构想");
  await put(root, "src/a.ts", "code");
  const r = await runPlan(root, {});
  const content = await fs.readFile(path.join(root, ".doclib", "tasks", "BUILD-001.md"), "utf8");
  assert.ok(content.includes("规模: 1 个文件"));
  assert.ok(!content.includes("private-idea"));
  assert.ok(await has(root, "plans/private-idea.md"));
});
