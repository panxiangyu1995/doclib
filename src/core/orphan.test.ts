import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { detectOrphanDocs } from "./orphan.js";

test("orphan：馆外知识文档检出，馆内/载体/豁免不检出", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-orphan-"));
  await fs.mkdir(path.join(root, "doclib", "30-features"), { recursive: true });
  await fs.mkdir(path.join(root, "docs"), { recursive: true });
  await fs.mkdir(path.join(root, ".plan", "2026-10-19"), { recursive: true });
  await fs.mkdir(path.join(root, ".plan", "2026-10-19"), { recursive: true });
  await fs.mkdir(path.join(root, ".github", "workflows"), { recursive: true });
  await fs.writeFile(path.join(root, "docs", "stray.md"), "散落知识", "utf8");
  await fs.writeFile(path.join(root, "notes.md"), "顶层散落", "utf8");
  await fs.writeFile(path.join(root, "README.md"), "门面", "utf8");
  await fs.writeFile(path.join(root, "CHANGELOG.md"), "日志", "utf8");
  await fs.writeFile(path.join(root, "CONTRIBUTING.md"), "协作", "utf8");
  await fs.writeFile(path.join(root, "CLAUDE.md"), "引导", "utf8");
  await fs.writeFile(path.join(root, "doclib", "30-features", "a.md"), "馆内", "utf8");
  await fs.writeFile(path.join(root, ".plan", "2026-10-19", "plan.md"), "规划", "utf8");
  await fs.writeFile(path.join(root, ".github", "workflows", "ci.md"), "工作流说明", "utf8");
  const orphans = await detectOrphanDocs(root);
  assert.deepEqual(orphans, ["docs/stray.md", "notes.md"]);
});
