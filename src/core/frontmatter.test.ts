import test from "node:test";
import assert from "node:assert/strict";
import { coversOf, parseFrontmatter } from "./frontmatter.js";

test("无 frontmatter 时原样返回", () => {
  const r = parseFrontmatter("# hi\nbody");
  assert.deepEqual(r.data, {});
  assert.equal(r.body, "# hi\nbody");
});

test("解析键值与数组", () => {
  const r = parseFrontmatter('---\ntitle: "A: B"\ncovers:\n  - src/a.ts\n  - src/b/\nstatus: draft\n---\n正文');
  assert.equal(r.data.title, "A: B");
  assert.deepEqual(r.data.covers, ["src/a.ts", "src/b/"]);
  assert.equal(r.data.status, "draft");
  assert.equal(r.body, "正文");
});

test("空值键解析为可追加的空数组", () => {
  const r = parseFrontmatter("---\ncovers:\n---\n");
  assert.deepEqual(r.data.covers, []);
});

test("内联数组解析", () => {
  const r = parseFrontmatter("---\ncovers: [src/a.ts, src/b/]\nempty: []\n---\n");
  assert.deepEqual(r.data.covers, ["src/a.ts", "src/b/"]);
  assert.deepEqual(r.data.empty, []);
});

test("coversOf 提取并过滤空值", () => {
  assert.deepEqual(coversOf({ covers: ["a.ts", ""] }), ["a.ts"]);
  assert.deepEqual(coversOf({ covers: "a.ts" }), ["a.ts"]);
  assert.deepEqual(coversOf({}), []);
});
