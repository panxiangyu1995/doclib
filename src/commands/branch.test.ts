import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import { runBranch } from "./branch.js";
import { DoclibError } from "../core/state.js";
import { get, tmpRoot } from "./testkit.js";

const exec = promisify(execFile);

async function gitRoot(prefix: string, branch = "main"): Promise<string> {
  const root = await tmpRoot(prefix);
  await exec("git", ["init", "-q", "-b", branch, root]);
  await fs.writeFile(path.join(root, "a.txt"), "v", "utf8");
  await exec("git", ["-C", root, "add", "-A"]);
  await exec("git", ["-C", root, "-c", "user.email=t@t.io", "-c", "user.name=t", "commit", "-qm", "seed"]);
  return root;
}

test("branch register：git 仓登记落账（骨架创建 + 行追加 + 重复登记拦截）", async () => {
  const root = await gitRoot("doclib-cmd-branch-");
  await exec("git", ["-C", root, "branch", "feat-x"]);
  const r = await runBranch(root, { action: "register", name: "feat-x", note: "图谱联动" });
  assert.match(r.text, /已登记分支: feat-x（active）/);
  const raw = await get(root, "doclib/00-overview/branches.md");
  assert.match(raw, /title: 分支账/);
  assert.match(raw, /\| feat-x \| \d{4}-\d{2}-\d{2} \| 图谱联动 \| active \|/);
  await assert.rejects(
    () => runBranch(root, { action: "register", name: "feat-x", note: "重复" }),
    (e: unknown) => e instanceof DoclibError && /已在分支账中登记/.test(e.message),
  );
});

test("branch register：未知分支报错；缺目的报错；非 git 目录降级可登记", async () => {
  const root = await gitRoot("doclib-cmd-branch-");
  await assert.rejects(
    () => runBranch(root, { action: "register", name: "no-such", note: "x" }),
    (e: unknown) => e instanceof DoclibError && /不存在于本地 git/.test(e.message),
  );
  await assert.rejects(
    () => runBranch(root, { action: "register", name: "feat-y" }),
    (e: unknown) => e instanceof DoclibError && /须附目的/.test(e.message),
  );
  const plain = await tmpRoot("doclib-cmd-branch-plain-");
  const r = await runBranch(plain, { action: "register", name: "solo", note: "无 git 降级" });
  assert.match(r.text, /已登记分支: solo/);
  assert.match(await get(plain, "doclib/00-overview/branches.md"), /\| solo \|/);
});

test("branch list：未建账提示；建账后账实对照（未登记/幽灵 active/一致）", async () => {
  const root = await tmpRoot("doclib-cmd-branch-list-");
  await exec("git", ["init", "-q", "-b", "main", root]);
  await fs.writeFile(path.join(root, "a.txt"), "v", "utf8");
  await exec("git", ["-C", root, "add", "-A"]);
  await exec("git", ["-C", root, "-c", "user.email=t@t.io", "-c", "user.name=t", "commit", "-qm", "seed"]);
  const before = await runBranch(root, { action: "list" });
  assert.match(before.text, /分支账未建立/);

  await exec("git", ["-C", root, "branch", "feat-open"]);
  await runBranch(root, { action: "register", name: "main", note: "主馆" });
  await runBranch(root, { action: "register", name: "feat-open", note: "开放" });
  await fs.appendFile(
    path.join(root, "doclib", "00-overview", "branches.md"),
    "| feat-ghost | 2026-10-28 | 幽灵 | active | x | |\n| 非法 | x | y | bogus | z | |\n",
    "utf8",
  );
  const r = await runBranch(root, { action: "list" });
  assert.match(r.text, /分支账: doclib\/00-overview\/branches.md（3 条）/);
  assert.match(r.text, /账内 active 但分支已不存在: feat-ghost/);
  assert.match(r.text, /非法行 1 条/);

  await fs.writeFile(
    path.join(root, "doclib", "00-overview", "branches.md"),
    "| 分支 | 创建日期 | 目的 | 状态 | 差异摘要 | 关联 |\n| --- | --- | --- | --- | --- | --- |\n| main | 2026-10-28 | 主馆 | active | 主线 | |\n",
    "utf8",
  );
  const clean = await runBranch(root, { action: "list" });
  assert.match(clean.text, /git 本地分支未登记: feat-open/);
});

test("branch diff：分馆侧审计文本 + base 缺省探测 + 未知动作报错", async () => {
  const root = await gitRoot("doclib-cmd-branch-diff-");
  await exec("git", ["-C", root, "checkout", "-q", "-b", "feat-audit"]);
  await fs.mkdir(path.join(root, "doclib"), { recursive: true });
  await fs.writeFile(path.join(root, "doclib", "extra.md"), "# 增量", "utf8");
  await exec("git", ["-C", root, "add", "-A"]);
  await exec("git", ["-C", root, "-c", "user.email=t@t.io", "-c", "user.name=t", "commit", "-qm", "feat"]);
  const r = await runBranch(root, { action: "diff" });
  assert.match(r.text, /分馆审计: 当前 HEAD vs main/);
  assert.match(r.text, /\+1 新增/);
  assert.match(r.text, /新增 \(1\)/);
  assert.match(r.text, /  extra\.md/);
  const named = await runBranch(root, { action: "diff", base: "main" });
  assert.match(named.text, /vs main/);
  await assert.rejects(
    () => runBranch(root, { action: "explode" }),
    (e: unknown) => e instanceof DoclibError && /未知 branch 动作/.test(e.message),
  );
});

test("branch register：分支名与目的含竖线/换行拒绝（账本表格防列错位）", async () => {
  const root = await gitRoot("doclib-cmd-branch-sanitize-");
  await exec("git", ["-C", root, "branch", "feat-ok"]);
  await assert.rejects(
    () => runBranch(root, { action: "register", name: "evil|injected", note: "p" }),
    (e: unknown) => e instanceof DoclibError && /禁用竖线与换行/.test(e.message) && /非法分支名/.test(e.message),
  );
  await assert.rejects(
    () => runBranch(root, { action: "register", name: "feat-ok", note: "含|竖线的目的" }),
    (e: unknown) => e instanceof DoclibError && /目的描述禁用竖线/.test(e.message),
  );
  const r = await runBranch(root, { action: "register", name: "feat-ok", note: "正常目的" });
  assert.match(r.text, /已登记分支: feat-ok/);
  const raw = await get(root, "doclib/00-overview/branches.md");
  assert.equal(raw.split("\n").filter((l) => l.startsWith("| feat-ok")).length, 1);
});
