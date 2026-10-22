import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { graphIndexPresent, isNodeCompatible } from "./engine.js";

test("isNodeCompatible 边界: 22.4.9 不可用", () => {
  assert.equal(isNodeCompatible("22.4.9"), false);
});

test("isNodeCompatible 边界: 22.5.0 可用", () => {
  assert.equal(isNodeCompatible("22.5.0"), true);
});

test("isNodeCompatible 边界: 24.15.0 可用", () => {
  assert.equal(isNodeCompatible("24.15.0"), true);
});

test("isNodeCompatible 边界: 21.9.9 不可用", () => {
  assert.equal(isNodeCompatible("21.9.9"), false);
});

test("isNodeCompatible 边界: v 前缀可解析", () => {
  assert.equal(isNodeCompatible("v22.5.0"), true);
});

test("isNodeCompatible 边界: 两位版本号可解析", () => {
  assert.equal(isNodeCompatible("23.1"), true);
  assert.equal(isNodeCompatible("22.4"), false);
});

test("isNodeCompatible 边界: 非法串不可用", () => {
  assert.equal(isNodeCompatible("abc"), false);
  assert.equal(isNodeCompatible(""), false);
});

test("graphIndexPresent: .codegraph/codegraph.db 存在为真", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cg-present-"));
  try {
    await fs.mkdir(path.join(root, ".codegraph"), { recursive: true });
    await fs.writeFile(path.join(root, ".codegraph", "codegraph.db"), "x");
    assert.equal(await graphIndexPresent(root), true);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("graphIndexPresent: 缺失为假", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cg-absent-"));
  try {
    assert.equal(await graphIndexPresent(root), false);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
