import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runHook } from "./hook.js";
import { DoclibError } from "../core/state.js";

async function tmpGit(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-hook-"));
  await fs.mkdir(path.join(root, ".git", "hooks"), { recursive: true });
  return root;
}

test("hook install：写入含标记的可执行钩子；strict 传导", async () => {
  const root = await tmpGit();
  await runHook(root, { strict: true });
  const p = path.join(root, ".git", "hooks", "pre-commit");
  const raw = await fs.readFile(p, "utf8");
  assert.ok(raw.includes("# doclib-hook"));
  assert.ok(raw.includes("check --strict"));
  const stat = await fs.stat(p);
  assert.ok((stat.mode & 0o111) !== 0);
});

test("hook install：非 doclib 既有钩子报错", async () => {
  const root = await tmpGit();
  const p = path.join(root, ".git", "hooks", "pre-commit");
  await fs.writeFile(p, "#!/bin/sh\necho mine\n", "utf8");
  await assert.rejects(() => runHook(root, {}), DoclibError);
});

test("hook remove：删除标记钩子", async () => {
  const root = await tmpGit();
  await runHook(root, {});
  await runHook(root, { remove: true });
  await assert.rejects(() => fs.access(path.join(root, ".git", "hooks", "pre-commit")));
});

test("hook：非 git 目录报错；--ci 非法值报错", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-hook-nogit-"));
  await assert.rejects(() => runHook(root, {}), DoclibError);
  await assert.rejects(() => runHook(root, { ci: "gitlab" }), DoclibError);
});

test("hook --ci github：生成 workflow 模板（版本固化）", async () => {
  const root = await tmpGit();
  await runHook(root, { ci: "github" });
  const wf = await fs.readFile(path.join(root, ".github", "workflows", "doclib-check.yml"), "utf8");
  assert.ok(wf.includes("check --strict"));
  assert.ok(/npx --yes doclib@\d+\.\d+\.\d+ check --strict/.test(wf));
});
