import test from "node:test";
import assert from "node:assert/strict";
import { resolveAgents, AGENT_TARGETS } from "./agents.js";
import { DoclibError } from "./state.js";

test("缺省解析为 generic", () => {
  assert.deepEqual(resolveAgents().map((t) => t.id), ["generic"]);
  assert.deepEqual(resolveAgents("").map((t) => t.id), ["generic"]);
});

test("逗号解析与去重", () => {
  assert.deepEqual(resolveAgents("claude,opencode,claude").map((t) => t.id), ["claude", "opencode"]);
});

test("未知 id 抛出 DoclibError", () => {
  assert.throws(() => resolveAgents("foo"), DoclibError);
});

test("适配表含首版四目标", () => {
  assert.equal(AGENT_TARGETS.length, 4);
  const claude = AGENT_TARGETS.find((t) => t.id === "claude")!;
  assert.equal(claude.skillsDir, ".claude/skills");
  assert.deepEqual(claude.guideFiles, ["CLAUDE.md"]);
  const cursor = AGENT_TARGETS.find((t) => t.id === "cursor")!;
  assert.equal(cursor.skillsDir, null);
});
