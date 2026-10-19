import test from "node:test";
import assert from "node:assert/strict";
import { docsForPath, isDocStale, normalizePath } from "./mapping.js";
import type { CoverEntry } from "./mapping.js";

test("normalizePath 统一分隔符与前后缀", () => {
  assert.equal(normalizePath("./src/a.ts"), "src/a.ts");
  assert.equal(normalizePath("src/dir/"), "src/dir");
  assert.equal(normalizePath("src\\win.ts"), "src/win.ts");
});

test("docsForPath 精确匹配优先于目录前缀", () => {
  const index: CoverEntry[] = [
    { doc: "30-features/math.md", covers: ["src/math.ts"] },
    { doc: "20-modules/core/README.md", covers: ["src"] },
  ];
  assert.deepEqual(docsForPath(index, "src/math.ts"), ["30-features/math.md"]);
  assert.deepEqual(docsForPath(index, "src/other.ts"), ["20-modules/core/README.md"]);
  assert.deepEqual(docsForPath(index, "lib/x.ts"), []);
});

test("isDocStale：covers 全部失效才算 stale", () => {
  const files = ["src/alive.ts"];
  assert.equal(isDocStale({ doc: "a.md", covers: ["src/dead.ts"] }, files), true);
  assert.equal(isDocStale({ doc: "b.md", covers: ["src/alive.ts", "src/dead.ts"] }, files), false);
  assert.equal(isDocStale({ doc: "c.md", covers: ["src"] }, files), false);
});
