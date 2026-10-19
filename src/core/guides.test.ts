import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseGuideStamp, renderGuide, writeGuides } from "./guides.js";
import { AGENT_TARGETS } from "./agents.js";

test("renderGuide 写入版本戳", async () => {
  const content = await renderGuide("light");
  const stamp = parseGuideStamp(content);
  assert.ok(stamp);
  assert.equal(typeof stamp.cli, "string");
  assert.equal(stamp.structure, 2);
  assert.ok(content.includes("实时同步规则"));
});

test("parseGuideStamp 无戳返回 null", () => {
  assert.equal(parseGuideStamp("# 普通文档\n无戳内容"), null);
});

test("writeGuides 覆盖策略：新写/有戳更新/无戳跳过", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-guides-"));
  const targets = AGENT_TARGETS.filter((t) => t.id === "claude" || t.id === "opencode");

  const r1 = await writeGuides(root, "light", targets);
  assert.deepEqual(r1.written.sort(), ["AGENTS.md", "CLAUDE.md"]);
  assert.deepEqual(r1.skipped, []);

  const r2 = await writeGuides(root, "light", targets);
  assert.deepEqual(r2.written.sort(), ["AGENTS.md", "CLAUDE.md"]);

  await fs.writeFile(path.join(root, "CLAUDE.md"), "# 用户自定义内容\n无戳");
  const r3 = await writeGuides(root, "light", targets);
  assert.ok(r3.skipped.includes("CLAUDE.md"));
  assert.ok(!r3.written.includes("CLAUDE.md"));
  const preserved = await fs.readFile(path.join(root, "CLAUDE.md"), "utf8");
  assert.ok(preserved.includes("用户自定义内容"));
});
