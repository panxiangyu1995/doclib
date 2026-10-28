import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { runStatus } from "./status.js";
import { runInit } from "./init.js";
import { runSnapshot } from "./snapshot.js";
import { runHook } from "./hook.js";
import { CLI_VERSION, STRUCTURE_VERSION } from "../core/version.js";
import { docMd, put, tmpRoot } from "./testkit.js";

type StatusJson = {
  library: { initialized: boolean; version: number; structureVersion: number; agents: string[] };
  revision: number;
  baseline: { id: string; at: string; note: string; snapshotCount: number } | null;
  drift: { added: number; modified: number; removed: number } | null;
  health: { score: number; grade: string } | null;
  planning: { paths: string[]; reminder: string; carrierSuggestions: string[] };
  guides: { stamp: string; budget: string };
  hook: string;
  detection: { primary: string };
  tasks: string[];
};

test("status：全新目录（未初始化形态）不崩溃且各行齐备", async () => {
  const root = await tmpRoot("doclib-acc-status-");
  const r = await runStatus(root, {});
  assert.match(r.text, /图书馆: doclib\/ 未初始化（运行 doclib init）/);
  assert.match(r.text, /结构版本: 0/);
  assert.match(r.text, /基线: 无（尚未 snapshot）/);
  assert.match(r.text, /漂移: -/);
  assert.match(r.text, /治理: -/);
  assert.match(r.text, /任务书: 无/);
  const j = JSON.parse((await runStatus(root, { json: true })).text) as StatusJson;
  assert.equal(j.library.initialized, false);
  assert.equal(j.baseline, null);
  assert.equal(j.drift, null);
  assert.equal(j.health, null);
  assert.deepEqual(j.tasks, []);
});

test("status：--json 全载荷字段（library/baseline/drift/health/planning/guides/detection/tasks）", async () => {
  const root = await tmpRoot("doclib-acc-status-");
  await runInit(root, { agents: "claude,opencode" });
  await put(root, "src/a.ts", "v1");
  await put(root, ".doclib/tasks/BUILD-001.md", "任务书");
  await runSnapshot(root, { note: "initial" });
  const r = await runStatus(root, { json: true });
  const j = JSON.parse(r.text) as StatusJson;
  assert.deepEqual(j.library, {
    initialized: true,
    version: 1,
    structureVersion: STRUCTURE_VERSION,
    agents: ["claude", "opencode"],
  });
  assert.equal(j.revision, 1);
  assert.equal(j.baseline!.id, "snap-001");
  assert.equal(j.baseline!.note, "initial");
  assert.equal(j.baseline!.snapshotCount, 1);
  assert.deepEqual(j.drift, { added: 0, modified: 0, removed: 0 });
  assert.equal(j.health!.score, 100);
  assert.equal(j.health!.grade, "A");
  assert.deepEqual(j.planning.paths, [".plan/"]);
  assert.equal(typeof j.guides.stamp, "string");
  assert.equal(typeof j.guides.budget, "string");
  assert.equal(j.detection.primary, "TypeScript");
  assert.deepEqual(j.tasks, ["BUILD-001.md"]);
});

test("status：文本形态含基线备注/快照链/revision/漂移/治理分", async () => {
  const root = await tmpRoot("doclib-acc-status-");
  await runInit(root, {});
  await put(root, "src/a.ts", "v1");
  await runSnapshot(root, { note: "里程碑" });
  const r = await runStatus(root, {});
  assert.match(r.text, /图书馆: doclib\/ \(version 1\)/);
  assert.match(r.text, /基线: snap-001 @ .+（里程碑） · 快照链 1 条 · revision 1/);
  assert.match(r.text, /漂移: \+0 新增 \/ ~0 修改 \/ -0 删除（相对 snap-001）/);
  assert.match(r.text, /治理: 100\/100 \(A\)/);
  assert.match(r.text, /检测: 主语言 TypeScript/);
});

test("status：漂移三类计数；治理分随漏更下降", async () => {
  const root = await tmpRoot("doclib-acc-status-");
  await runInit(root, {});
  await put(root, "src/a.ts", "v1");
  await runSnapshot(root, {});
  await put(root, "src/a.ts", "v2");
  await put(root, "src/b.ts", "new");
  await fs.rm(path.join(root, "src", "a.ts"));
  const r = await runStatus(root, {});
  assert.match(r.text, /漂移: \+1 新增 \/ ~0 修改 \/ -1 删除（相对 snap-001）/);
  assert.match(r.text, /治理: \d+\/100 \([B-F]\)/);
  const j = (await runStatus(root, { json: true })).json as unknown as StatusJson;
  assert.deepEqual(j.drift, { added: 1, modified: 0, removed: 1 });
  assert.ok(j.health!.score < 100);
});

test("status：待归档提醒（feature-map planned/in-progress 计数）", async () => {
  const root = await tmpRoot("doclib-acc-status-");
  await runInit(root, {});
  await put(
    root,
    "doclib/00-overview/feature-map.md",
    "| # | 功能 | 描述 | 对应文档 | 状态 |\n| --- | --- | --- | --- | --- |\n| 1 | A | a | 30-features/a.md | planned |\n| 2 | B | b | 30-features/b.md | in-progress |\n| 3 | C | c | 30-features/c.md | implemented |\n",
  );
  const r = await runStatus(root, {});
  assert.match(r.text, /待归档（锚点二）: 1 planned \/ 1 in-progress——完成的请归档成果并推进 implemented/);
});

test("status：载体文档晚于基线 → 待登记提醒", async () => {
  const root = await tmpRoot("doclib-acc-status-");
  await runInit(root, {});
  await put(root, "src/a.ts", "v1");
  await runSnapshot(root, {});
  await put(root, ".plan/late-idea.md", "晚于基线的构想");
  const r = await runStatus(root, {});
  assert.match(r.text, /待登记（锚点一）: 1 份载体规划文档晚于最新基线/);
  assert.match(r.text, /\.plan\/late-idea\.md/);
});

test("status：引导戳过期识别（cli/structure 不匹配 → doclib sync）", async () => {
  const root = await tmpRoot("doclib-acc-status-");
  await runInit(root, {});
  await put(
    root,
    "AGENTS.md",
    `<!-- doclib-guide cli=0.0.1 structure=1 -->\n<!-- doclib:managed-begin -->\n规则区\n<!-- doclib:managed-end -->\n<!-- doclib:custom-begin -->\n定制\n<!-- doclib:custom-end -->\n`,
  );
  const r = await runStatus(root, {});
  assert.match(r.text, /AGENTS\.md 过期 → doclib sync/);
});

test("status：引导预算超限警示（managed 区 >150 行）", async () => {
  const root = await tmpRoot("doclib-acc-status-");
  await runInit(root, {});
  const filler = Array.from({ length: 160 }, (_, i) => `规则第 ${i} 条`).join("\n");
  await put(
    root,
    "AGENTS.md",
    `<!-- doclib-guide cli=${CLI_VERSION} structure=${STRUCTURE_VERSION} -->\n<!-- doclib:managed-begin -->\n${filler}\n<!-- doclib:managed-end -->\n<!-- doclib:custom-begin -->\n定制\n<!-- doclib:custom-end -->\n`,
  );
  const r = await runStatus(root, {});
  assert.match(r.text, /AGENTS\.md 16[0-9]\/150 行 ⚠ 超限 → 瘦身/);
});

test("status：任务书列表（多文件逗号分隔）", async () => {
  const root = await tmpRoot("doclib-acc-status-");
  await runInit(root, {});
  await put(root, ".doclib/tasks/BUILD-001.md", "a");
  await put(root, ".doclib/tasks/BOOTSTRAP-001.md", "b");
  const r = await runStatus(root, {});
  assert.match(r.text, /任务书: /);
  assert.ok(r.text.includes("BUILD-001.md"));
  assert.ok(r.text.includes("BOOTSTRAP-001.md"));
});

test("status：--json stdout 与 json 同源可解析；无基线时 drift/health 为 null", async () => {
  const root = await tmpRoot("doclib-acc-status-");
  await runInit(root, {});
  const r = await runStatus(root, { json: true });
  const j = JSON.parse(r.text) as StatusJson;
  assert.equal(j.baseline, null);
  assert.equal(j.drift, null);
  assert.equal(j.health, null);
  assert.equal(j.library.version, 0);
  assert.deepEqual(j, (await runStatus(root, { json: true })).json);
});

test("status：提交门禁未安装（非 git 目录 → none）", async () => {
  const root = await tmpRoot("doclib-acc-status-");
  await runInit(root, {});
  const r = await runStatus(root, {});
  assert.match(r.text, /提交门禁: 未安装/);
});

test("status：提交门禁已安装(--strict) 文本与 json 一致", async () => {
  const root = await tmpRoot("doclib-acc-status-");
  await runInit(root, {});
  await fs.mkdir(path.join(root, ".git", "hooks"), { recursive: true });
  await runHook(root, { strict: true });
  const r = await runStatus(root, {});
  assert.match(r.text, /提交门禁: 已安装\(--strict\)/);
  const j = JSON.parse((await runStatus(root, { json: true })).text) as StatusJson;
  assert.equal(j.hook, "doclib-strict");
});

test("status：foreign 钩子 → 文本未安装、json 如实 foreign", async () => {
  const root = await tmpRoot("doclib-acc-status-");
  await runInit(root, {});
  await fs.mkdir(path.join(root, ".git", "hooks"), { recursive: true });
  await put(root, ".git/hooks/pre-commit", "#!/bin/sh\necho husky\n");
  const r = await runStatus(root, {});
  assert.match(r.text, /提交门禁: 未安装/);
  const j = JSON.parse((await runStatus(root, { json: true })).text) as StatusJson;
  assert.equal(j.hook, "foreign");
});

test("status：guide-project 含非法区域标记 → 降级提示行（不炸 status）", async () => {
  const root = await tmpRoot("doclib-acc-status-");
  await runInit(root, { agents: "claude", noHook: true });
  await put(root, ".doclib/guide-project.md", "---\nsnapshot: 1\n---\n\n正文 <!-- doclib:custom-begin --> 尾\n");
  const r = await runStatus(root, {});
  assert.match(r.text, /反哺: ⚠ .*区域保留标记/);
  const j = JSON.parse((await runStatus(root, { json: true })).text) as { guides: { feed: string } };
  assert.match(j.guides.feed, /区域保留标记/);
});

test("status：记忆行三态（未蒸馏/正常双 as-of/滞后后缀）", async () => {
  const root = await tmpRoot("doclib-acc-status-");
  await runInit(root, { agents: "claude", noHook: true });
  let r = await runStatus(root, {});
  assert.match(r.text, /记忆: 未蒸馏/);
  await put(root, ".doclib/guide-memory.md", "---\nwork-as-of: 2026-10-27\nuser-as-of: 2026-10-27\nwindow: 30\n---\n\n## 近期工作记忆\n- 当前焦点\n");
  r = await runStatus(root, {});
  assert.match(r.text, /记忆: work as-of 2026-10-27 · user as-of 2026-10-27 · 窗口 30 天/);
  assert.ok(!r.text.includes("工作记忆滞后"));
  await put(root, "doclib/00-overview/progress.md", "- **2026-10-28** · 测试条目\n  - 教训: 无（测试占位）\n");
  r = await runStatus(root, {});
  assert.match(r.text, /记忆: work as-of 2026-10-27 .*⚠ 工作记忆滞后（progress 最新 2026-10-28）→ 刷新簿记后 sync/);
  await put(root, ".doclib/guide-memory.md", "---\nwork-as-of: 2026-10-28\nuser-as-of: 2026-10-01\n---\n\n## 近期工作记忆\n- 当前焦点\n");
  r = await runStatus(root, {});
  assert.match(r.text, /记忆: work as-of 2026-10-28 · user as-of 2026-10-01 · ⚠ 画像可刷新/);
  assert.ok(!r.text.includes("工作记忆滞后"));
});

test("status：guide-memory 含非法区域标记 → 记忆行降级 ⚠（不炸 status），as-of 日期非法同降级", async () => {
  const root = await tmpRoot("doclib-acc-status-");
  await runInit(root, { agents: "claude", noHook: true });
  await put(root, ".doclib/guide-memory.md", "---\nwork-as-of: 2026-10-27\n---\n\n正文 <!-- doclib:custom-begin --> 尾\n");
  let r = await runStatus(root, {});
  assert.match(r.text, /记忆: ⚠ .*区域保留标记/);
  const j = JSON.parse((await runStatus(root, { json: true })).text) as { guides: { memory: string } };
  assert.match(j.guides.memory, /区域保留标记/);
  await put(root, ".doclib/guide-memory.md", "---\nwork-as-of: 明天\n---\n\n正文\n");
  r = await runStatus(root, {});
  assert.match(r.text, /记忆: ⚠ .*work-as-of 日期非法/);
});

test("status：反哺行走查覆盖度三态（12/12、未留账、非法）", async () => {
  const root = await tmpRoot("doclib-acc-status-");
  await runInit(root, { agents: "claude", noHook: true });
  const fed = "00-overview, 10-architecture, 20-modules, 30-features, 40-guides, 50-testing, 60-config, 70-deploy, 90-reference, 95-lessons";
  await put(root, ".doclib/guide-project.md", `---\nsnapshot: 1\nvolumes-fed: [${fed}]\nvolumes-na: [80-design, 99-archive]\n---\n\n## 项目反哺\n`);
  let r = await runStatus(root, {});
  assert.match(r.text, /反哺: snapshot 1 · .* · 走查 12\/12/);
  const fedDup = "00-overview, 00-overview, 10-architecture, 20-modules, 30-features, 40-guides, 50-testing, 60-config, 90-reference, 95-lessons";
  await put(root, ".doclib/guide-project.md", `---\nsnapshot: 1\nvolumes-fed: [${fedDup}]\nvolumes-na: [80-design, 99-archive]\n---\n\n## 项目反哺\n`);
  r = await runStatus(root, {});
  assert.match(r.text, /反哺: snapshot 1 · .* · 走查 11\/12/);
  await put(root, ".doclib/guide-project.md", "---\nsnapshot: 1\n---\n\n## 项目反哺\n");
  r = await runStatus(root, {});
  assert.match(r.text, /反哺: snapshot 1 · .* · 走查 未留账 ⚠/);
  await put(root, ".doclib/guide-project.md", "---\nsnapshot: 1\nvolumes-fed: 80-design\n---\n\n## 项目反哺\n");
  r = await runStatus(root, {});
  assert.match(r.text, /反哺: snapshot 1 · .* · 走查 非法 ⚠/);
});

test("status：常见规划载体未声明 → 载体建议行与 json 字段", async () => {
  const root = await tmpRoot("doclib-acc-status-");
  await runInit(root, { agents: "claude" });
  await fs.mkdir(path.join(root, "openspec", "changes", "add-x"), { recursive: true });
  await fs.writeFile(path.join(root, "openspec", "changes", "add-x", "proposal.md"), "p", "utf8");
  const r = await runStatus(root, {});
  assert.match(r.text, /载体建议: openspec\/ 为常见规划载体（未声明）/);
  const j = JSON.parse((await runStatus(root, { json: true })).text) as StatusJson;
  assert.deepEqual(j.planning.carrierSuggestions, ["openspec/"]);
});

test("status：git 仓库基线归属行与分支不一致提示", async () => {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const exec = promisify(execFile);
  const root = await tmpRoot("doclib-acc-status-git-");
  await exec("git", ["init", "-q", "-b", "main", root]);
  await runInit(root, { agents: "claude", guide: "none", noHook: true });
  await put(root, "src/a.ts", "v1");
  await exec("git", ["-C", root, "add", "-A"]);
  await exec("git", ["-C", root, "-c", "user.email=t@t.io", "-c", "user.name=t", "commit", "-qm", "seed"]);
  await runSnapshot(root, { note: "base" });
  const same = await runStatus(root, {});
  assert.match(same.text, /基线: snap-001 @ .*（base）（来自分支 main @ [0-9a-f]{7}）/);
  const j = JSON.parse((await runStatus(root, { json: true })).text) as { baseline: { git: { branch: string; commit: string } | null } };
  assert.equal(j.baseline.git?.branch, "main");

  await exec("git", ["-C", root, "checkout", "-q", "-b", "feat-other"]);
  const cross = await runStatus(root, {});
  assert.match(cross.text, /⚠ 当前分支 feat-other 与基线分支 main 不一致 → 跨分支漂移可能，建议重基线/);
});
