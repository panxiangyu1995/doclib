import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { readGitInfo } from "./gitinfo.js";

const execFileAsync = promisify(execFile);

test("gitinfo：git 仓库内返回当前分支与完整 commit", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-gitinfo-"));
  await execFileAsync("git", ["init", "-q", root]);
  await fs.writeFile(path.join(root, "a.txt"), "v", "utf8");
  await execFileAsync("git", ["-C", root, "add", "a.txt"]);
  await execFileAsync("git", ["-C", root, "-c", "user.email=t@t.io", "-c", "user.name=t", "commit", "-qm", "seed"]);
  const info = await readGitInfo(root);
  assert.ok(info);
  assert.match(info.branch, /^(main|master)$/);
  assert.match(info.commit, /^[0-9a-f]{40}$/);
});

test("gitinfo：非 git 目录返回 null（优雅降级）", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-gitinfo-plain-"));
  const info = await readGitInfo(root);
  assert.equal(info, null);
});
