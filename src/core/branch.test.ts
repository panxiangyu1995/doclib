import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import os from "node:os";
import path from "node:path";
import { analyzeBranchDiff, detectMainBranch, listGitBranches, parseBranchLedger, renderBranchRow } from "./branch.js";
import { DoclibError } from "./state.js";

const exec = promisify(execFile);

const LEDGER = `---
title: 分支账
---

# 分支账

| 分支 | 创建日期 | 目的 | 状态 | 差异摘要 | 关联 |
| --- | --- | --- | --- | --- | --- |
| main | 2026-10-17 | 主馆基线 | active | 主线全量 | #1 snap-001 |
| feat-docgraph | 2026-10-28 | 图谱文档联动 | active | 新增 30-features/graph.md；改造 check.md | #25 .plan/2026-10-22/codegraph-integration.md snap-071 |
| feat-stale | 2026-10-20 | 已合并回主馆 | merged | 功能已进主线 | #18 |
| 非法状态行 | 2026-10-20 | 缺陷条目演示 | unknown | 差异 | |

| 无关表 |
| --- |
| x |
`;

test("branch：parseBranchLedger 解析合法行、跳过表头/分隔行/无关表、非法状态入 invalid", () => {
  const { entries, invalid } = parseBranchLedger(LEDGER);
  assert.equal(entries.length, 3);
  assert.deepEqual(
    entries.map((e) => e.name),
    ["main", "feat-docgraph", "feat-stale"],
  );
  assert.equal(entries[0]!.status, "active");
  assert.equal(entries[1]!.status, "active");
  assert.equal(entries[2]!.status, "merged");
  assert.deepEqual(entries[1]!.refs, ["#25", ".plan/2026-10-22/codegraph-integration.md", "snap-071"]);
  assert.equal(entries[1]!.divergence, "新增 30-features/graph.md；改造 check.md");
  assert.equal(invalid.length, 1);
  assert.match(invalid[0]!, /非法状态行/);
});

test("branch：renderBranchRow 往返解析一致", () => {
  const row = renderBranchRow({
    name: "feat-x",
    createdAt: "2026-10-28",
    purpose: "测试",
    status: "active",
    divergence: "无",
    refs: ["#44", "snap-094"],
  });
  const { entries } = parseBranchLedger(`| 分支 | 创建日期 | 目的 | 状态 | 差异摘要 | 关联 |\n| --- | --- | --- | --- | --- | --- |\n${row}\n`);
  assert.equal(entries.length, 1);
  assert.equal(entries[0]!.name, "feat-x");
  assert.deepEqual(entries[0]!.refs, ["#44", "snap-094"]);
});

test("branch：listGitBranches 返回本地分支；非 git 目录返回空数组", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-branch-"));
  await exec("git", ["init", "-q", root]);
  await fs.writeFile(path.join(root, "a.txt"), "v", "utf8");
  await exec("git", ["-C", root, "add", "-A"]);
  await exec("git", ["-C", root, "-c", "user.email=t@t.io", "-c", "user.name=t", "commit", "-qm", "seed"]);
  await exec("git", ["-C", root, "branch", "feat-a"]);
  const branches = await listGitBranches(root);
  assert.ok(branches.includes("main") || branches.includes("master"));
  assert.ok(branches.includes("feat-a"));

  const plain = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-branch-plain-"));
  assert.deepEqual(await listGitBranches(plain), []);
});

test("branch：detectMainBranch 优先 main，缺 main 回落 master，都无返回 null", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-branch-detect-"));
  await exec("git", ["init", "-q", root]);
  await fs.writeFile(path.join(root, "a.txt"), "v", "utf8");
  await exec("git", ["-C", root, "add", "-A"]);
  await exec("git", ["-C", root, "-c", "user.email=t@t.io", "-c", "user.name=t", "commit", "-qm", "seed"]);
  const branches = await listGitBranches(root);
  const expected = branches.includes("main") ? "main" : branches.includes("master") ? "master" : null;
  assert.equal(await detectMainBranch(root), expected);
});

async function gitFixture(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-branch-audit-"));
  const git = (...args: string[]) => exec("git", ["-C", root, ...args]);
  await exec("git", ["init", "-q", "-b", "main", root]);
  await fs.mkdir(path.join(root, "doclib"), { recursive: true });
  await fs.mkdir(path.join(root, ".doclib"), { recursive: true });
  await fs.writeFile(path.join(root, "doclib", "README.md"), "# 馆", "utf8");
  const baseState = {
    version: 2,
    revision: 2,
    snapshots: [
      { id: "snap-001", at: "2026-10-27T00:00:00.000Z" },
      { id: "snap-002", at: "2026-10-27T01:00:00.000Z" },
    ],
  };
  await fs.writeFile(path.join(root, ".doclib", "state.json"), JSON.stringify(baseState), "utf8");
  await git("add", "-A");
  await git("-c", "user.email=t@t.io", "-c", "user.name=t", "commit", "-qm", "main-baseline");
  await git("checkout", "-q", "-b", "feat-ledger");
  await fs.mkdir(path.join(root, "doclib", "00-overview"), { recursive: true });
  await fs.writeFile(path.join(root, "doclib", "00-overview", "branches.md"), "# 分支账", "utf8");
  await fs.rm(path.join(root, "doclib", "README.md"));
  const featState = {
    version: 3,
    revision: 3,
    snapshots: [
      { id: "snap-001", at: "2026-10-27T00:00:00.000Z" },
      { id: "snap-002", at: "2026-10-28T02:00:00.000Z" },
      { id: "snap-003", at: "2026-10-28T03:00:00.000Z" },
    ],
  };
  await fs.writeFile(path.join(root, ".doclib", "state.json"), JSON.stringify(featState), "utf8");
  await git("add", "-A");
  await git("-c", "user.email=t@t.io", "-c", "user.name=t", "commit", "-qm", "feat-work");
  return root;
}

test("branch：analyzeBranchDiff 报告分馆侧馆差异/revision 分叉/快照撞号", async () => {
  const root = await gitFixture();
  const audit = await analyzeBranchDiff(root, "main");
  assert.equal(audit.base, "main");
  assert.ok(audit.docDiff.added.includes("00-overview/branches.md"));
  assert.ok(audit.docDiff.removed.includes("README.md"));
  assert.ok(audit.docDiff.modified.includes(".doclib/state.json"));
  assert.equal(audit.revision.current, 3);
  assert.equal(audit.revision.base, 2);
  assert.deepEqual(audit.snapshotCollisions, ["snap-002"]);
  assert.equal(audit.notes.length, 0);
});

test("branch：analyzeBranchDiff 缺省自动探测主分支", async () => {
  const root = await gitFixture();
  const audit = await analyzeBranchDiff(root);
  assert.equal(audit.base, (await listGitBranches(root)).includes("main") ? "main" : "master");
});

test("branch：analyzeBranchDiff 主分支无簿记 → notes 降级说明", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-branch-nostate-"));
  const git = (...args: string[]) => exec("git", ["-C", root, ...args]);
  await exec("git", ["init", "-q", root]);
  await fs.mkdir(path.join(root, "doclib"), { recursive: true });
  await fs.writeFile(path.join(root, "doclib", "README.md"), "# 馆", "utf8");
  await git("add", "-A");
  await git("-c", "user.email=t@t.io", "-c", "user.name=t", "commit", "-qm", "bare");
  await git("checkout", "-q", "-b", "feat-x");
  await fs.writeFile(path.join(root, "doclib", "extra.md"), "# 增量", "utf8");
  await git("add", "-A");
  await git("-c", "user.email=t@t.io", "-c", "user.name=t", "commit", "-qm", "feat");
  const audit = await analyzeBranchDiff(root);
  assert.ok(audit.docDiff.added.includes("extra.md"));
  assert.equal(audit.revision.base, null);
  assert.ok(audit.notes.some((n) => /无可读簿记/.test(n)));
});

test("branch：analyzeBranchDiff 非 git 目录 → DoclibError", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-branch-nogit-"));
  await assert.rejects(() => analyzeBranchDiff(root), DoclibError);
});

test("branch：analyzeBranchDiff 拒绝 - 开头 base（防 git 参数注入）", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-branch-inject-"));
  const git = (...args: string[]) => exec("git", ["-C", root, ...args]);
  await exec("git", ["init", "-q", root]);
  await fs.writeFile(path.join(root, "a.txt"), "v", "utf8");
  await git("add", "-A");
  await git("-c", "user.email=t@t.io", "-c", "user.name=t", "commit", "-qm", "seed");
  await assert.rejects(
    () => analyzeBranchDiff(root, "--output=/tmp/doclib-review-inj-pwn"),
    (e: unknown) => e instanceof DoclibError && /不得以 - 开头/.test(e.message),
  );
  assert.ok(!fsSync.existsSync("/tmp/doclib-review-inj-pwn...HEAD"));});
