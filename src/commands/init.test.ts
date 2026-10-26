import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { runInit } from "./init.js";
import { runSnapshot } from "./snapshot.js";
import { DoclibError, loadState } from "../core/state.js";
import { STRUCTURE_VERSION } from "../core/version.js";
import { loadPlanningPaths } from "../core/planning.js";
import { assetsRoot, renderTemplate } from "../core/assets.js";
import { collectFiles } from "../core/fsutil.js";
import { get, has, put, tmpRoot } from "./testkit.js";

const SKELETON = [
  "doclib/README.md",
  "doclib/INDEX.md",
  "doclib/00-overview/project.md",
  "doclib/00-overview/feature-map.md",
  "doclib/00-overview/glossary.md",
  "doclib/00-overview/progress.md",
  "doclib/10-architecture/overview.md",
  "doclib/10-architecture/data-model.md",
  "doclib/10-architecture/data-flow.md",
  "doclib/10-architecture/dependencies.md",
  "doclib/10-architecture/decisions.md",
  "doclib/10-architecture/migrations.md",
  "doclib/20-modules/_index.md",
  "doclib/30-features/_index.md",
  "doclib/40-guides/conventions.md",
  "doclib/40-guides/workflow.md",
  "doclib/40-guides/roadmap.md",
  "doclib/50-testing/testing.md",
  "doclib/60-config/settings.md",
  "doclib/70-deploy/deploy.md",
  "doclib/80-design/README.md",
  "doclib/90-reference/_index.md",
  "doclib/95-lessons/lessons.md",
  "doclib/99-archive/README.md",
];

test("init：全新目录落位 24 文件骨架/簿记/引导/state（非交互默认 generic+light）", async () => {
  const root = await tmpRoot("doclib-acc-init-");
  const r = await runInit(root, {});
  assert.match(r.text, /已初始化 DocLib/);
  assert.match(r.text, /agents: generic/);
  assert.match(r.text, /规划载体: \.plan\//);
  assert.match(r.text, /skills 落位: 无/);
  for (const rel of SKELETON) {
    assert.ok(await has(root, rel), `缺少 ${rel}`);
  }
  assert.ok(await has(root, ".doclib/tasks"));
  assert.ok(await has(root, "AGENTS.md"));
  assert.ok(!(await has(root, "CLAUDE.md")));
  const agents = await get(root, "AGENTS.md");
  assert.match(agents, /<!--\s*doclib-guide cli=/);
  assert.match(agents, /doclib:managed-begin/);
  assert.match(agents, /doclib:custom-begin/);
  const state = await loadState(root);
  assert.deepEqual(state.agents, ["generic"]);
  assert.equal(state.structureVersion, STRUCTURE_VERSION);
  assert.deepEqual(state.planning, [".plan/"]);
  assert.equal(state.version, 0);
  assert.equal(state.revision, 0);
});

test("init：--agents claude,opencode → 双 skills 目录 + 双引导文件", async () => {
  const root = await tmpRoot("doclib-acc-init-");
  const r = await runInit(root, { agents: "claude,opencode" });
  assert.match(r.text, /skills 落位: \.claude\/skills, \.opencode\/skills/);
  assert.ok(await has(root, ".claude/skills/doclib-build/SKILL.md"));
  assert.ok(await has(root, ".opencode/skills/doclib-dev/SKILL.md"));
  assert.ok(await has(root, "CLAUDE.md"));
  assert.ok(await has(root, "AGENTS.md"));
  const state = await loadState(root);
  assert.deepEqual(state.agents, ["claude", "opencode"]);
});

test("init：--agents 去重/trim/空串降级 generic", async () => {
  const a = await tmpRoot("doclib-acc-init-");
  const r1 = await runInit(a, { agents: "claude,claude" });
  assert.deepEqual((r1.json as { agents: string[] }).agents, ["claude"]);
  const b = await tmpRoot("doclib-acc-init-");
  const r2 = await runInit(b, { agents: " claude , opencode " });
  assert.deepEqual((r2.json as { agents: string[] }).agents, ["claude", "opencode"]);
  const c = await tmpRoot("doclib-acc-init-");
  const r3 = await runInit(c, { agents: "" });
  assert.deepEqual((r3.json as { agents: string[] }).agents, ["generic"]);
});

test("init：--agents 未知值报错", async () => {
  const root = await tmpRoot("doclib-acc-init-");
  await assert.rejects(() => runInit(root, { agents: "copilot" }), (e: unknown) => {
    assert.ok(e instanceof DoclibError);
    assert.match(e.message, /未知 agent: copilot（可选: claude, opencode, cursor, generic）/);
    return true;
  });
});

test("init：--guide none 不写引导；非法值报错", async () => {
  const root = await tmpRoot("doclib-acc-init-");
  const r = await runInit(root, { guide: "none" });
  assert.match(r.text, /引导文件: 未写入/);
  assert.ok(!(await has(root, "AGENTS.md")));
  await assert.rejects(
    () => runInit(root, { guide: "full" as "light" }),
    (e: unknown) => e instanceof DoclibError && /--guide 仅支持 light \| none/.test(e.message),
  );
});

test("init：--planning 多路径归一（补尾斜杠/trim/滤空）", async () => {
  const root = await tmpRoot("doclib-acc-init-");
  await runInit(root, { planning: "docs/plans, .notes/" });
  const state = await loadState(root);
  assert.deepEqual(state.planning, ["docs/plans/", ".notes/"]);
  const r2root = await tmpRoot("doclib-acc-init-");
  await runInit(r2root, { planning: ",," });
  const s2 = await loadState(r2root);
  assert.deepEqual(s2.planning, [".plan/"]);
  assert.deepEqual(loadPlanningPaths(s2), [".plan/"]);
});

test("init：二次 init 无 --force 报错", async () => {
  const root = await tmpRoot("doclib-acc-init-");
  await runInit(root, {});
  await assert.rejects(
    () => runInit(root, {}),
    (e: unknown) => e instanceof DoclibError && /doclib\/ 已存在；如需补齐\/刷新模板文件请加 --force/.test(e.message),
  );
});

test("init --force：同名模板刷新、用户文件保留、state 保留", async () => {
  const root = await tmpRoot("doclib-acc-init-");
  await runInit(root, { agents: "claude" });
  await put(root, "doclib/README.md", "被我改过的 README");
  await put(root, "doclib/extra-note.md", "用户自建文档");
  await fs.writeFile(path.join(root, "CLAUDE.md"), "定制规则", "utf8");
  await runSnapshot(root, { note: "keepme" });
  const r = await runInit(root, { force: true, agents: "claude" });
  const expected = await renderTemplate("templates/library/README.md", {});
  assert.equal(await get(root, "doclib/README.md"), expected);
  assert.ok(await has(root, "doclib/extra-note.md"));
  const state = await loadState(root);
  assert.equal(state.version, 1);
  assert.equal(state.latest, "snap-001");
  assert.deepEqual(state.agents, ["claude"]);
  const tplCount = (await collectFiles(path.join(assetsRoot(), "templates", "library"))).length;
  assert.equal((r.json as { templates: number }).templates, tplCount);
});

test("init --force：doclib 为普通文件时硬失败（底层 fs 错误直抛）", async () => {
  const root = await tmpRoot("doclib-acc-init-");
  await put(root, "doclib", "我是一个文件");
  await assert.rejects(() => runInit(root, { force: true }));
});

test("init：既有无戳引导文件跳过不覆盖", async () => {
  const root = await tmpRoot("doclib-acc-init-");
  await put(root, "CLAUDE.md", "# 我的私有规则（无 doclib 戳）");
  const r = await runInit(root, { agents: "claude,opencode" });
  assert.match(r.text, /跳过已有无戳文件: CLAUDE\.md/);
  assert.equal(await get(root, "CLAUDE.md"), "# 我的私有规则（无 doclib 戳）");
  assert.ok(await has(root, "AGENTS.md"));
});

test("init：cursor 无 skills 目录（设计如此），仅写引导", async () => {
  const root = await tmpRoot("doclib-acc-init-");
  const r = await runInit(root, { agents: "cursor" });
  assert.match(r.text, /skills 落位: 无/);
  assert.ok(await has(root, "AGENTS.md"));
  assert.ok(!(await has(root, ".cursor")));
  assert.ok(!(await has(root, ".claude")));
});

test("init：git 目录默认自动安装 --strict 门禁", async () => {
  const root = await tmpRoot("doclib-acc-init-");
  await fs.mkdir(path.join(root, ".git", "hooks"), { recursive: true });
  const r = await runInit(root, {});
  assert.match(r.text, /提交门禁: 已安装\(--strict\)/);
  const hook = await get(root, ".git/hooks/pre-commit");
  assert.ok(hook.includes("# doclib-hook"));
  assert.ok(hook.includes("check --strict"));
});

test("init：--no-hook 显式跳过", async () => {
  const root = await tmpRoot("doclib-acc-init-");
  await fs.mkdir(path.join(root, ".git", "hooks"), { recursive: true });
  const r = await runInit(root, { noHook: true });
  assert.match(r.text, /提交门禁: 未安装（--no-hook 跳过）/);
  assert.ok(!(await has(root, ".git/hooks/pre-commit")));
});

test("init：foreign 钩子警告跳过且 init 不失败、原钩子保留", async () => {
  const root = await tmpRoot("doclib-acc-init-");
  await fs.mkdir(path.join(root, ".git", "hooks"), { recursive: true });
  await put(root, ".git/hooks/pre-commit", "#!/bin/sh\necho mine\n");
  const r = await runInit(root, {});
  assert.match(r.text, /提交门禁: 跳过/);
  assert.match(r.text, /已初始化 DocLib/);
  assert.equal(await get(root, ".git/hooks/pre-commit"), "#!/bin/sh\necho mine\n");
});

test("init：非 git 目录提示后置安装路径", async () => {
  const root = await tmpRoot("doclib-acc-init-");
  const r = await runInit(root, {});
  assert.match(r.text, /提交门禁: 未安装（非 git 仓库；git init 后可运行 doclib hook --strict）/);
});

test("init：损坏 .git 指针文件 → 门禁降级提示，init 不失败", async () => {
  const root = await tmpRoot("doclib-acc-init-");
  await put(root, ".git", "gitdir: /nonexistent\n无 gitdir 行的垃圾内容\n");
  const r = await runInit(root, {});
  assert.match(r.text, /已初始化 DocLib/);
  assert.match(r.text, /提交门禁: 跳过/);
});

test("init：检测到未声明常见载体 → 载体建议行", async () => {
  const root = await tmpRoot("doclib-acc-init-");
  await fs.mkdir(path.join(root, "openspec"), { recursive: true });
  await fs.writeFile(path.join(root, "openspec", "spec.md"), "s", "utf8");
  const r = await runInit(root, { agents: "claude" });
  assert.match(r.text, /载体建议: .*openspec\//);
  assert.match(r.text, /--planning 声明后进入双轨提醒/);
});

test("init：progress.md 自动落 lesson-epoch 标记（幂等不重复）", async () => {
  const root = await tmpRoot("doclib-acc-init-");
  await runInit(root, { agents: "claude" });
  const p1 = await fs.readFile(path.join(root, "doclib", "00-overview", "progress.md"), "utf8");
  assert.match(p1, /<!-- doclib:lesson-epoch: \d{4}-\d{2}-\d{2} -->/);
  assert.equal(p1.match(/doclib:lesson-epoch/g)?.length, 1);
});
