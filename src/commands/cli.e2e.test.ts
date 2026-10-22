import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { CLI_VERSION } from "../core/version.js";
import { isNodeCompatible } from "../core/codegraph/engine.js";
import { cli, get, has, put, tmpRoot } from "./testkit.js";

test("e2e：help 四种形态（无参/help/--help/-h）与未知命令降级", async () => {
  const root = await tmpRoot("doclib-e2e-");
  for (const args of [[], ["help"], ["--help"], ["-h"], ["totally-unknown-cmd"]]) {
    const r = await cli(args, root);
    assert.equal(r.code, 0, `args=${args.join(" ")}`);
    assert.match(r.stdout, /doclib — 把任意项目蒸馏成可复原的文档图书馆/);
    assert.match(r.stdout, /init      初始化 doclib\/ 图书馆骨架/);
    assert.match(r.stdout, /reconcile 进度对账重建/);
  }
});

test("e2e：version/--version 输出 CLI 版本", async () => {
  const root = await tmpRoot("doclib-e2e-");
  for (const args of [["version"], ["--version"]]) {
    const r = await cli(args, root);
    assert.equal(r.code, 0);
    assert.equal(r.stdout.trim(), `doclib ${CLI_VERSION}`);
  }
});

test("e2e：flag 前置（--json status）等价解析", async () => {
  const root = await tmpRoot("doclib-e2e-");
  const r = await cli(["--json", "status"], root);
  assert.equal(r.code, 0);
  const j = JSON.parse(r.stdout) as { library: { initialized: boolean } };
  assert.equal(j.library.initialized, false);
});

test("e2e：DoclibError → 退出码 1 + stderr 前缀「错误: 」", async () => {
  const root = await tmpRoot("doclib-e2e-");
  let r = await cli(["diff"], root);
  assert.equal(r.code, 1);
  assert.match(r.stderr, /^错误: 尚无基线快照/);
  r = await cli(["ack"], root);
  assert.equal(r.code, 1);
  assert.match(r.stderr, /^错误: ack 需要路径参数/);
  r = await cli(["init", "--guide", "bogus"], root);
  assert.equal(r.code, 1);
  assert.match(r.stderr, /^错误: --guide 仅支持 light \| none/);
});

test("e2e：state.json 损坏 → 退出码 1 + corrupt 备份落盘", async () => {
  const root = await tmpRoot("doclib-e2e-");
  await fs.mkdir(path.join(root, ".doclib"), { recursive: true });
  await fs.writeFile(path.join(root, ".doclib", "state.json"), "not json at all", "utf8");
  const r = await cli(["status"], root);
  assert.equal(r.code, 1);
  assert.match(r.stderr, /已损坏/);
  const entries = await fs.readdir(path.join(root, ".doclib"));
  assert.ok(entries.some((f) => f.startsWith("state.json.corrupt-")));
});

test("e2e：state.json schema 非法 → 回落空状态不崩溃（status 正常）", async () => {
  const root = await tmpRoot("doclib-e2e-");
  await fs.mkdir(path.join(root, ".doclib"), { recursive: true });
  await fs.writeFile(path.join(root, ".doclib", "state.json"), '{"foo": 1}', "utf8");
  const r = await cli(["status"], root);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /基线: 无（尚未 snapshot）/);
});

test("e2e：非 DoclibError（doclib 为文件 + --force）→ 退出码 1 且 stderr 非「错误: 」前缀", async () => {
  const root = await tmpRoot("doclib-e2e-");
  await put(root, "doclib", "I am a file");
  const r = await cli(["init", "--force"], root);
  assert.equal(r.code, 1);
  assert.ok(r.stderr.length > 0);
  assert.ok(!r.stderr.startsWith("错误: "));
});

test("e2e：snapshot --note 缺值 / ack --note 缺值 不崩溃", async () => {
  const root = await tmpRoot("doclib-e2e-");
  let r = await cli(["snapshot", "--note"], root);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /基线已记录: snap-001/);
  r = await cli(["ack", "src/x.ts", "--note"], root);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /已登记豁免: src\/x\.ts/);
});

test("e2e：hook 子命令形态 install/remove；未找到文案", async () => {
  const root = await tmpRoot("doclib-e2e-");
  let r = await cli(["hook", "remove"], root);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /未找到 pre-commit 钩子/);
  await fs.mkdir(path.join(root, ".git", "hooks"), { recursive: true });
  r = await cli(["hook", "--strict"], root);
  assert.equal(r.code, 0);
  assert.ok(await has(root, ".git/hooks/pre-commit"));
  r = await cli(["hook", "remove"], root);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /已移除 doclib pre-commit 钩子/);
  assert.ok(!(await has(root, ".git/hooks/pre-commit")));
});

test("e2e：全生命周期闭环 init→plan→建馆→verify→snapshot→diff→UPDATE→check --strict 双向→snapshot→sync→reconcile→hook", async () => {
  const root = await tmpRoot("doclib-e2e-lifecycle-");

  let r = await cli(["init", "--agents", "claude,opencode", "--planning", "plans"], root);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /已初始化 DocLib/);
  assert.ok(await has(root, ".claude/skills/doclib-build/SKILL.md"));
  assert.ok(await has(root, "plans") === false);

  r = await cli(["plan"], root);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /已生成任务书: BUILD-001/);
  assert.ok(await has(root, ".doclib/tasks/BUILD-001.md"));

  await put(root, "src/index.ts", "export const version = 1;\n");
  await put(root, "doclib/INDEX.md", "- [核心](30-features/core.md)\n");
  await put(
    root,
    "doclib/30-features/core.md",
    "---\ntitle: 核心\ncovers:\n  - src/\nstatus: stable\n---\n核心行为与验收标准\n",
  );
  await put(root, "doclib/README.md", "图书馆导览\n");

  r = await cli(["verify"], root);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /代码文件: 1 ｜ 已覆盖: 1（100%）｜ 未覆盖: 0/);

  r = await cli(["snapshot", "--note", "initial"], root);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /基线已记录: snap-001 \(library version 1\)/);
  assert.match(r.stdout, /revision: 1/);

  r = await cli(["status", "--json"], root);
  assert.equal(r.code, 0);
  const st = JSON.parse(r.stdout) as {
    baseline: { id: string; note: string };
    drift: { added: number; modified: number; removed: number };
    health: { score: number };
    planning: { paths: string[] };
  };
  assert.equal(st.baseline.id, "snap-001");
  assert.equal(st.baseline.note, "initial");
  assert.deepEqual(st.drift, { added: 0, modified: 0, removed: 0 });
  assert.equal(st.health.score, 100);
  assert.deepEqual(st.planning.paths, ["plans/"]);

  await put(root, "src/index.ts", "export const version = 2;\n");
  r = await cli(["diff"], root);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /漂移: \+0 新增 \/ ~1 修改 \/ -0 删除/);
  assert.match(r.stdout, /src\/index\.ts  →  30-features\/core\.md/);

  r = await cli(["check", "--strict"], root);
  assert.equal(r.code, 1);
  assert.match(r.stdout, /漏更 \(1\)/);
  assert.match(r.stdout, /strict 门禁: 未通过/);

  await put(root, "doclib/30-features/core.md", "---\ntitle: 核心\ncovers:\n  - src/\nstatus: stable\n---\n核心行为与验收标准 v2\n");
  r = await cli(["check", "--strict"], root);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /strict 门禁: 通过/);

  r = await cli(["plan"], root);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /已生成任务书: UPDATE-002/);
  assert.ok(await has(root, ".doclib/tasks/UPDATE-002.md"));

  r = await cli(["snapshot"], root);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /snap-002/);
  assert.match(r.stdout, /revision: 2/);

  r = await cli(["sync"], root);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /同步完成/);
  r = await cli(["sync"], root);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /无变化 CLAUDE\.md, AGENTS\.md/);

  r = await cli(["reconcile"], root);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /进度对账报告（基线 snap-002 · revision 2）/);

  r = await cli(["hook"], root);
  assert.equal(r.code, 1);
  assert.match(r.stderr, /当前目录不是 git 仓库/);
  await fs.mkdir(path.join(root, ".git", "hooks"), { recursive: true });
  r = await cli(["hook"], root);
  assert.equal(r.code, 0);
  const hookScript = await get(root, ".git/hooks/pre-commit");
  assert.ok(hookScript.includes("doclib-hook"));
  assert.ok(hookScript.includes("check"));
});

test("e2e：init --graph → graph status/draft → plan 候选段 → .codegraph 排除（需 Node >= 22.5）", {
  skip: !isNodeCompatible(process.versions.node),
}, async () => {
  const root = await tmpRoot("doclib-e2e-graph-");
  await put(root, "package.json", `${JSON.stringify({ name: "fixture", version: "1.0.0", dependencies: { express: "^4.0.0" } }, null, 2)}\n`);
  await put(root, "src/app.ts", `import express from "express";\nconst app = express();\nexport function listUsers(): string[] { return []; }\napp.get("/users", listUsers);\n`);
  await put(root, "src/util.ts", `export function helper(n: number): number { return n + 1; }\n`);
  let r = await cli(["init", "--agents", "generic", "--guide", "none", "--graph"], root);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /知识图谱: \.codegraph\//);
  assert.ok(await has(root, ".codegraph/codegraph.db"));

  r = await cli(["graph", "status", "--json"], root);
  assert.equal(r.code, 0);
  const st = JSON.parse(r.stdout) as { initialized: boolean; files: number; state: string };
  assert.equal(st.initialized, true);
  assert.ok(st.files >= 2);
  assert.equal(st.state, "complete");

  r = await cli(["graph", "draft"], root);
  assert.equal(r.code, 0);
  assert.ok(await has(root, ".doclib/drafts/routes.md"));
  assert.ok(await has(root, ".doclib/drafts/unused.md"));
  const routes = await get(root, ".doclib/drafts/routes.md");
  assert.match(routes, /provenance: codegraph-draft/);

  r = await cli(["plan"], root);
  assert.equal(r.code, 0);
  const task = await get(root, ".doclib/tasks/BUILD-001.md");
  assert.match(task, /知识图谱候选/);

  r = await cli(["snapshot"], root);
  assert.equal(r.code, 0);
  const state = JSON.parse(await get(root, ".doclib/state.json")) as { snapshots: Array<{ files: Record<string, string> }> };
  const snapFiles = Object.keys(state.snapshots[0]?.files ?? {});
  assert.ok(!snapFiles.some((f) => f.startsWith(".codegraph/")));
  assert.ok(snapFiles.some((f) => f.startsWith("src/")));

  r = await cli(["graph", "explore", "listUsers"], root);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /listUsers/);
});

test("e2e：check --json 经 CLI 可解析", async () => {
  const root = await tmpRoot("doclib-e2e-");
  await put(root, "src/a.ts", "v1");
  await put(root, "doclib/30-features/a.md", "---\ntitle: A\ncovers:\n  - src/a.ts\nstatus: stable\n---\nA\n");
  await cli(["snapshot"], root);
  await put(root, "src/a.ts", "v2");
  const r = await cli(["check", "--json"], root);
  assert.equal(r.code, 0);
  const j = JSON.parse(r.stdout) as { baseline: string; findings: Array<{ kind: string }> };
  assert.equal(j.baseline, "snap-001");
  assert.ok(j.findings.some((f) => f.kind === "unaccounted"));
});
