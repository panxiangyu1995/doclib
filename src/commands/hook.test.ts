import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { runHook, relativeCliPath } from "./hook.js";
import { DoclibError } from "../core/state.js";
import { CLI_VERSION, PACKAGE_NAME } from "../core/version.js";

const execSh = promisify(exec);
const cliJs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "cli.js");

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

test("hook install：重复安装幂等覆盖自身钩子", async () => {
  const root = await tmpGit();
  await runHook(root, {});
  await runHook(root, { strict: true });
  const raw = await fs.readFile(path.join(root, ".git", "hooks", "pre-commit"), "utf8");
  assert.ok(raw.includes("# doclib-hook"));
  assert.ok(raw.includes("check --strict"));
  const stat = await fs.stat(path.join(root, ".git", "hooks", "pre-commit"));
  assert.ok((stat.mode & 0o111) !== 0);
});

test("hook install：重装恢复可执行位（writeFile mode 仅新建生效）", async () => {
  const root = await tmpGit();
  const p = path.join(root, ".git", "hooks", "pre-commit");
  await fs.writeFile(p, "#!/bin/sh\n# doclib-hook\nnode x check\n", "utf8");
  await fs.chmod(p, 0o644);
  await runHook(root, { strict: true });
  const stat = await fs.stat(p);
  assert.equal(stat.mode & 0o777, 0o755);
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
  assert.ok(wf.includes(`npx --yes ${PACKAGE_NAME}@${CLI_VERSION} check --strict`));
});

test("relativeCliPath：root 内部→相对路径；外部→绝对路径；均正斜杠", async () => {
  const inner = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-rcp-in-"));
  const innerCli = path.join(inner, "dist", "cli.js");
  assert.equal(relativeCliPath(inner, innerCli), "dist/cli.js");
  const outerRoot = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-rcp-root-"));
  const out = relativeCliPath(outerRoot, innerCli);
  assert.equal(path.isAbsolute(out), true);
  assert.ok(!out.includes("\\"));
});

test("hook 脚本自检：toplevel 锚定 + node/cli 存在性检查", async () => {
  const root = await tmpGit();
  await runHook(root, {});
  const raw = await fs.readFile(path.join(root, ".git", "hooks", "pre-commit"), "utf8");
  assert.ok(raw.includes("git rev-parse --show-toplevel"));
  assert.ok(raw.includes("command -v node"));
  assert.ok(raw.includes('[ -f "${CLI}" ]'));
  assert.ok(!raw.includes("\\"));
  assert.ok(!/[）」』】》\u4e00-\u9fff]\$/.test(raw));
});

test("hook install/remove：git worktree 钩子落位 GIT_DIR/hooks", async () => {
  const main = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-hook-main-"));
  await execSh(`git init -q "${main}"`);
  await fs.writeFile(path.join(main, "seed.txt"), "s");
  await execSh(`git -C "${main}" add seed.txt`);
  await execSh(`git -C "${main}" -c user.email=t@t.io -c user.name=t commit -qm seed`);
  const wt = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-hook-wt-"));
  await execSh(`git -C "${main}" worktree add -q -b wt-branch "${wt}"`);
  await runHook(wt, { strict: true });
  const dotGit = await fs.readFile(path.join(wt, ".git"), "utf8");
  const gitdir = dotGit.match(/gitdir:\s*(.+)/)?.[1]?.trim() ?? "";
  const base = path.isAbsolute(gitdir) ? gitdir : path.join(wt, gitdir);
  const p = path.join(base, "hooks", "pre-commit");
  const raw = await fs.readFile(p, "utf8");
  assert.ok(raw.includes("# doclib-hook"));
  const stat = await fs.stat(p);
  assert.ok((stat.mode & 0o111) !== 0);
  await runHook(wt, { remove: true });
  await assert.rejects(() => fs.access(p));
});

test("hook e2e：无 snapshot 时 commit 被 hook 阻断", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-hook-e2e-"));
  await execSh(`git init -q "${root}"`);
  await runHook(root, { strict: true });
  await fs.writeFile(path.join(root, "f.txt"), "x");
  await execSh(`git -C "${root}" add f.txt`);
  let code = 0;
  let out = "";
  try {
    await execSh(`git -C "${root}" -c user.email=t@t.io -c user.name=t commit -m test`);
  } catch (e) {
    code = typeof (e as { code?: unknown }).code === "number" ? (e as { code: number }).code : 1;
    out = `${String((e as { stdout?: unknown }).stdout)}${String((e as { stderr?: unknown }).stderr)}`;
  }
  assert.notEqual(code, 0);
  assert.ok(out.includes("基线快照"));
});

test("hook e2e：snapshot 后 commit 放行", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-hook-e2e-ok-"));
  await execSh(`git init -q "${root}"`);
  await execSh(`node "${cliJs}" init`, { cwd: root });
  await execSh(`node "${cliJs}" snapshot`, { cwd: root });
  await runHook(root, { strict: true });
  await execSh(`git -C "${root}" add -A`);
  await execSh(`git -C "${root}" -c user.email=t@t.io -c user.name=t commit -m init`);
  const log = await execSh(`git -C "${root}" log --oneline`);
  assert.ok(log.stdout.includes("init"));
});

async function writeChainDoc(root: string, frontmatter: string): Promise<void> {
  const p = path.join(root, "doclib", "50-testing", "testing.md");
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, `---\ntitle: T\n${frontmatter}---\n正文\n`, "utf8");
}

test("hook install：test-chain 声明后烘焙 fast 档与指纹", async () => {
  const root = await tmpGit();
  await writeChainDoc(root, "test-chain-fast:\n  - npm run typecheck\n  - npm test\ntest-chain-full: npm test\n");
  const r = await runHook(root, { strict: true });
  assert.ok(r.text.includes("fast 档 2 条"));
  const raw = await fs.readFile(path.join(root, ".git", "hooks", "pre-commit"), "utf8");
  assert.ok(raw.includes("# doclib-chain:"));
  assert.ok(raw.includes("npm run typecheck || exit 1"));
  assert.ok(raw.includes("npm test || exit 1"));
  assert.ok(!raw.includes("npm run lint"));
});

test("hook install：链变更后重装刷新指纹；链移除后恢复无链形态", async () => {
  const root = await tmpGit();
  await writeChainDoc(root, "test-chain-fast: npm run lint\n");
  await runHook(root, {});
  const p = path.join(root, ".git", "hooks", "pre-commit");
  const before = await fs.readFile(p, "utf8");
  await writeChainDoc(root, "test-chain-fast: npm run typecheck\n");
  await runHook(root, {});
  const after = await fs.readFile(p, "utf8");
  assert.ok(after.includes("npm run typecheck || exit 1"));
  assert.ok(!after.includes("npm run lint"));
  const beforeFp = before.match(/# doclib-chain:([0-9a-f]+)/)?.[1] ?? "";
  const afterFp = after.match(/# doclib-chain:([0-9a-f]+)/)?.[1] ?? "";
  assert.notEqual(beforeFp, afterFp);
  await writeChainDoc(root, "note: 无链\n");
  const r = await runHook(root, {});
  assert.ok(!r.text.includes("烘焙"));
  const raw = await fs.readFile(p, "utf8");
  assert.ok(!raw.includes("# doclib-chain:"));
  assert.ok(!raw.includes("|| exit 1\nnpm"));
});

test("hook --ci github：test-chain 声明后烘焙 full 档独立步骤", async () => {
  const root = await tmpGit();
  await writeChainDoc(root, "test-chain-full:\n  - npm run typecheck\n  - npm test\n");
  const r = await runHook(root, { ci: "github" });
  assert.ok(r.text.includes("full 档 2 条"));
  const wf = await fs.readFile(path.join(root, ".github", "workflows", "doclib-check.yml"), "utf8");
  assert.ok(wf.includes("- run: npm run typecheck"));
  assert.ok(wf.includes("name: test-chain full 2/2"));
});

test("hook e2e：链命令失败阻断提交，解除后放行", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-hook-chain-"));
  await execSh(`git init -q "${root}"`);
  await execSh(`node "${cliJs}" init`, { cwd: root });
  const tplPath = path.join(root, "doclib", "50-testing", "testing.md");
  const tpl = await fs.readFile(tplPath, "utf8");
  await fs.writeFile(tplPath, tpl.replace("status: draft", "status: draft\ntest-chain-fast: test -f .git/chain-ok"), "utf8");
  await execSh(`node "${cliJs}" sync`, { cwd: root });
  await execSh(`node "${cliJs}" snapshot`, { cwd: root });
  await runHook(root, { strict: true });
  await execSh(`git -C "${root}" add -A`);
  let blocked = false;
  try {
    await execSh(`git -C "${root}" -c user.email=t@t.io -c user.name=t commit -m chain`);
  } catch (e) {
    blocked = true;
    const out = `${String((e as { stdout?: unknown }).stdout)}${String((e as { stderr?: unknown }).stderr)}`;
    assert.ok(out.includes("fast 档"));
  }
  assert.equal(blocked, true);
  await fs.writeFile(path.join(root, ".git", "chain-ok"), "1", "utf8");
  await execSh(`git -C "${root}" add -A`);
  await execSh(`git -C "${root}" -c user.email=t@t.io -c user.name=t commit -m chain-ok`);
  const log = await execSh(`git -C "${root}" log --oneline`);
  assert.ok(log.stdout.includes("chain-ok"));
});
