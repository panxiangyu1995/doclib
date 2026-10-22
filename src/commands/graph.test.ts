import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { test } from "node:test";
import { tmpRoot, put } from "./testkit.js";
import { DoclibError } from "../core/state.js";
import { isNodeCompatible } from "../core/codegraph/engine.js";
import { DRAFT_WARNING } from "../core/codegraph/draft.js";
import { runGraph } from "./graph.js";

const engineReady = isNodeCompatible(process.versions.node);

async function fixtureProject(): Promise<string> {
  const root = await tmpRoot("doclib-graph-test-");
  await put(root, "package.json", `${JSON.stringify({ name: "fixture", version: "1.0.0", dependencies: { express: "^4.0.0" } }, null, 2)}\n`);
  await put(
    root,
    "src/app.ts",
    `import express from "express";\nconst app = express();\nexport function listUsers(): string[] { return []; }\napp.get("/users", listUsers);\napp.listen(3000);\n`,
  );
  await put(root, "src/util.ts", `export function helper(n: number): number { return n + 1; }\n`);
  await put(root, "src/dead.ts", `export function deadFn(): void {}\n`);
  return root;
}

test("graph index/status: 建图与状态读取", { skip: !engineReady }, async () => {
  const root = await fixtureProject();
  try {
    const idx = await runGraph(root, "index");
    assert.ok(idx.text.includes("索引完成"));
    const st = await runGraph(root, "status", { json: true });
    const payload = st.json as { initialized: boolean; files: number; state: string | null };
    assert.equal(payload.initialized, true);
    assert.ok(payload.files >= 3);
    assert.equal(payload.state, "complete");
    const st2 = await runGraph(root, "index");
    assert.ok(st2.text.includes("已同步"));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("graph draft: 四份候选草稿落盘与 --force 拒绝", { skip: !engineReady }, async () => {
  const root = await fixtureProject();
  try {
    await runGraph(root, "index");
    await runGraph(root, "draft");
    for (const f of ["routes.md", "modules.md", "dependencies.md", "unused.md"]) {
      const content = await fs.readFile(`${root}/.doclib/drafts/${f}`, "utf8");
      assert.ok(content.includes(DRAFT_WARNING), f);
      assert.ok(content.includes("provenance: codegraph-draft"), f);
    }
    const routes = await fs.readFile(`${root}/.doclib/drafts/routes.md`, "utf8");
    assert.ok(routes.includes("/users"));
    assert.ok(routes.includes("listUsers"));
    await assert.rejects(() => runGraph(root, "draft"), DoclibError);
    const forced = await runGraph(root, "draft", { force: true });
    assert.ok(forced.text.includes("routes.md"));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("graph explore: markdown 上下文直出", { skip: !engineReady }, async () => {
  const root = await fixtureProject();
  try {
    await runGraph(root, "index");
    const r = await runGraph(root, "explore", { query: "listUsers" });
    assert.ok(r.text.includes("listUsers"));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("graph 错误路径: 未初始化 draft 报错/explore 缺 query/非法 action", { skip: !engineReady }, async () => {
  const root = await tmpRoot("doclib-graph-err-");
  try {
    await assert.rejects(() => runGraph(root, "draft"), DoclibError);
    await assert.rejects(() => runGraph(root, "explore"), DoclibError);
    await assert.rejects(() => runGraph(root, "bogus"), DoclibError);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
