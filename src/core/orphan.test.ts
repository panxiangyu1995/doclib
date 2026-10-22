import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  classifyExternalDoc,
  detectOrphanDocs,
  detectSuspectedToolchainDirs,
  isGuideFile,
  isToolchainPath,
  scanExternalDocs,
} from "./orphan.js";

async function tmp(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "doclib-orphan-"));
}

test("orphan：馆外知识文档检出，馆内/载体/豁免不检出", async () => {
  const root = await tmp();
  await fs.mkdir(path.join(root, "doclib", "30-features"), { recursive: true });
  await fs.mkdir(path.join(root, "docs"), { recursive: true });
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

test("orphan：四态分类——工具链目录/引导文件/指针文件豁免，其余待归位", async () => {
  const root = await tmp();
  await fs.mkdir(path.join(root, ".agents", "skills", "demo"), { recursive: true });
  await fs.mkdir(path.join(root, ".claude", "skills", "x"), { recursive: true });
  await fs.mkdir(path.join(root, "packages", "api"), { recursive: true });
  await fs.mkdir(path.join(root, "docs"), { recursive: true });
  await fs.writeFile(path.join(root, ".agents", "skills", "demo", "SKILL.md"), "技能", "utf8");
  await fs.writeFile(path.join(root, ".claude", "skills", "x", "SKILL.md"), "技能", "utf8");
  await fs.writeFile(path.join(root, "packages", "api", "AGENTS.md"), "嵌套引导", "utf8");
  await fs.writeFile(path.join(root, "docs", "real.md"), "真知识", "utf8");
  await fs.writeFile(path.join(root, "docs", "gone.md"), "<!-- doclib:archived-pointer -->\n\n> 已归档", "utf8");
  const scan = await scanExternalDocs(root);
  assert.deepEqual(
    scan.pending.map((d) => d.path),
    ["docs/real.md"],
  );
  assert.deepEqual(
    scan.toolchain.map((d) => d.path),
    [".agents/skills/demo/SKILL.md", ".claude/skills/x/SKILL.md"],
  );
  assert.deepEqual(
    scan.guide.map((d) => d.path),
    ["packages/api/AGENTS.md"],
  );
  assert.deepEqual(
    scan.pointer.map((d) => d.path),
    ["docs/gone.md"],
  );
  assert.deepEqual(await detectOrphanDocs(root), ["docs/real.md"]);
});

test("orphan：vendor/third_party/deps/.changeset 不进扫描面（不进代码账）", async () => {
  const root = await tmp();
  await fs.mkdir(path.join(root, "vendor", "lib"), { recursive: true });
  await fs.mkdir(path.join(root, "third_party", "x"), { recursive: true });
  await fs.mkdir(path.join(root, "deps", "y"), { recursive: true });
  await fs.mkdir(path.join(root, ".changeset"), { recursive: true });
  await fs.mkdir(path.join(root, "docs"), { recursive: true });
  await fs.writeFile(path.join(root, "vendor", "lib", "README.md"), "第三方", "utf8");
  await fs.writeFile(path.join(root, "third_party", "x", "README.md"), "第三方", "utf8");
  await fs.writeFile(path.join(root, "deps", "y", "README.md"), "第三方", "utf8");
  await fs.writeFile(path.join(root, ".changeset", "c.md"), "变更集", "utf8");
  await fs.writeFile(path.join(root, "docs", "keep.md"), "真知识", "utf8");
  assert.deepEqual(await detectOrphanDocs(root), ["docs/keep.md"]);
});

test("orphan：工具链判定锚定目录前缀与整文件名，不做包含匹配", () => {
  assert.equal(isToolchainPath(".claude/skills/x/SKILL.md"), true);
  assert.equal(isToolchainPath(".agents/skills/x/SKILL.md"), true);
  assert.equal(isToolchainPath(".codegraph/cache/index.json"), true);
  assert.equal(isToolchainPath("myproject.claude/x.md"), false);
  assert.equal(isToolchainPath("src/.claude-helper/x.md"), false);
  assert.equal(isToolchainPath("src/.codegraph-tmp/x.md"), false);
  assert.equal(isToolchainPath(".cursorrules"), true);
  assert.equal(isToolchainPath("docs/cursorrules.md"), false);
  assert.equal(isGuideFile("packages/api/AGENTS.md"), true);
  assert.equal(isGuideFile("packages/api/README.md"), false);
});

test("orphan：classifyExternalDoc 优先级——指针 > 引导 > 工具链 > 待归位", () => {
  assert.equal(classifyExternalDoc("docs/a.md", "<!-- doclib:archived-pointer -->"), "pointer");
  assert.equal(classifyExternalDoc("packages/a/AGENTS.md"), "guide");
  assert.equal(classifyExternalDoc(".claude/a.md"), "toolchain");
  assert.equal(classifyExternalDoc("docs/a.md"), "pending");
});

test("orphan：疑似新工具目录识别——点目录 + 工具特征且不在闭集", async () => {
  const root = await tmp();
  await fs.mkdir(path.join(root, ".foo", "skills", "demo"), { recursive: true });
  await fs.mkdir(path.join(root, ".claude", "skills", "known"), { recursive: true });
  await fs.mkdir(path.join(root, "docs"), { recursive: true });
  await fs.writeFile(path.join(root, ".foo", "skills", "demo", "SKILL.md"), "x", "utf8");
  await fs.writeFile(path.join(root, ".claude", "skills", "known", "SKILL.md"), "x", "utf8");
  await fs.writeFile(path.join(root, "docs", "a.md"), "x", "utf8");
  const suspects = await detectSuspectedToolchainDirs(root);
  assert.deepEqual(
    suspects.map((s) => s.dir),
    [".foo"],
  );
  assert.ok(suspects[0]!.reason.includes("SKILL.md"));
  assert.ok(suspects[0]!.samples.length > 0);
});
