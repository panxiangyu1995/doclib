import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { CUSTOM_BEGIN, CUSTOM_END, GUIDE_BUDGET_LINES, PROJECT_BEGIN, PROJECT_BUDGET_LINES, PROJECT_END, applyProjectRegion, fingerprintOf, guideBudgetReport, managedRegionFresh, parseGuideStamp, readGuideProject, renderGuide, renderFullGuide, writeGuides } from "./guides.js";
import { DoclibError } from "./state.js";
import { AGENT_TARGETS } from "./agents.js";

test("renderGuide 写入版本戳与区域标记", async () => {
  const content = await renderGuide("light");
  const stamp = parseGuideStamp(content);
  assert.ok(stamp);
  assert.equal(stamp.structure, 3);
  assert.ok(content.includes("实时同步规则"));
  assert.ok(content.includes("doclib:managed-begin"));
  assert.ok(content.includes("doclib:project-begin"));
  assert.ok(content.includes("doclib:custom-begin"));
});

test("parseGuideStamp 无戳返回 null", () => {
  assert.equal(parseGuideStamp("# 普通文档\n无戳内容"), null);
});

test("writeGuides：新写/幂等/无戳跳过/定制区保留/旧版整体再生", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-guides-"));
  const targets = AGENT_TARGETS.filter((t) => t.id === "claude" || t.id === "opencode");

  const r1 = await writeGuides(root, "light", targets);
  assert.deepEqual(r1.written.sort(), ["AGENTS.md", "CLAUDE.md"]);
  assert.deepEqual(r1.skipped, []);

  const r2 = await writeGuides(root, "light", targets);
  assert.deepEqual(r2.unchanged.sort(), ["AGENTS.md", "CLAUDE.md"]);

  const agentsPath = path.join(root, "AGENTS.md");
  const original = await fs.readFile(agentsPath, "utf8");
  const outdated = original
    .replace(/## 纪律底线[\s\S]*?(?=\n## skills 与 CLI 速查)/, "")
    .replace(CUSTOM_END, "## 项目专属备注\n内容 A\n" + CUSTOM_END);
  await fs.writeFile(agentsPath, outdated, "utf8");

  const r3 = await writeGuides(root, "light", targets);
  assert.ok(r3.written.includes("AGENTS.md"));
  assert.ok(r3.unchanged.includes("CLAUDE.md"));
  const merged = await fs.readFile(agentsPath, "utf8");
  assert.ok(merged.includes("## 项目专属备注"));
  assert.ok(merged.includes("内容 A"));
  assert.ok(merged.includes("## 纪律底线"));
  assert.ok(merged.includes("doclib:managed-begin"));

  await fs.writeFile(
    path.join(root, "CLAUDE.md"),
    "<!-- doclib-guide cli=0.1.0 structure=2 -->\n旧版无区域标记\n",
    "utf8",
  );
  const r4 = await writeGuides(root, "light", targets);
  assert.deepEqual(r4.legacy, ["CLAUDE.md"]);
  const regenerated = await fs.readFile(path.join(root, "CLAUDE.md"), "utf8");
  assert.ok(regenerated.includes("doclib:managed-begin"));

  await fs.writeFile(path.join(root, "AGENTS.md"), "# 用户自定义无戳", "utf8");
  const r5 = await writeGuides(root, "light", targets);
  assert.ok(r5.skipped.includes("AGENTS.md"));
  const preserved = await fs.readFile(agentsPath, "utf8");
  assert.ok(preserved.includes("用户自定义无戳"));
});

test("managedRegionFresh：一致为空，篡改可检出，无戳忽略", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-fresh-"));
  const targets = AGENT_TARGETS.filter((t) => t.id === "claude");
  await writeGuides(root, "light", targets);
  assert.deepEqual(await managedRegionFresh(root), []);
  const p = path.join(root, "CLAUDE.md");
  const raw = await fs.readFile(p, "utf8");
  await fs.writeFile(p, raw.replace("## 会话纪律", "## 被篡改的纪律"), "utf8");
  const stale = await managedRegionFresh(root);
  assert.deepEqual(stale, ["CLAUDE.md"]);
});

test("guideBudgetReport：统计 managed 区行数，正常与超限", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-budget-"));
  const targets = AGENT_TARGETS.filter((t) => t.id === "claude");
  await writeGuides(root, "light", targets);
  const normal = await guideBudgetReport(root);
  assert.ok(normal.includes("CLAUDE.md "));
  assert.ok(normal.includes(`/${GUIDE_BUDGET_LINES} 行`));
  assert.ok(normal.includes("project "));
  assert.ok(!normal.includes("超限"));

  const p = path.join(root, "CLAUDE.md");
  const raw = await fs.readFile(p, "utf8");
  const begin = raw.indexOf("<!-- doclib:managed-begin -->");
  const end = raw.indexOf("<!-- doclib:managed-end -->");
  const filler = Array.from({ length: GUIDE_BUDGET_LINES + 10 }, () => "填充行").join("\n");
  await fs.writeFile(p, `${raw.slice(0, begin)}<!-- doclib:managed-begin -->\n${filler}\n${raw.slice(end)}`, "utf8");
  const over = await guideBudgetReport(root);
  assert.ok(over.includes("超限"));
  assert.ok(over.includes("裁剪判据"));
});

test("readGuideProject：无文件/空正文 → null；frontmatter 解析 snapshot 与 docs-hash", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-feed-"));
  assert.equal(await readGuideProject(root), null);
  await fs.mkdir(path.join(root, ".doclib"), { recursive: true });
  await fs.writeFile(path.join(root, ".doclib", "guide-project.md"), "---\nsnapshot: 3\ndocs-hash: abc123\n---\n\n正文内容\n", "utf8");
  const feed = await readGuideProject(root);
  assert.ok(feed);
  assert.equal(feed.snapshot, 3);
  assert.equal(feed.docsHash, "abc123");
  assert.equal(feed.body, "正文内容");
  await fs.writeFile(path.join(root, ".doclib", "guide-project.md"), "---\nsnapshot: 3\n---\n\n", "utf8");
  assert.equal(await readGuideProject(root), null);
});

test("readGuideProject：正文含区域保留标记 → DoclibError（D-1：防注入破坏 custom 契约）", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-feedguard-"));
  await fs.mkdir(path.join(root, ".doclib"), { recursive: true });
  const p = path.join(root, ".doclib", "guide-project.md");
  for (const marker of [PROJECT_BEGIN, PROJECT_END, CUSTOM_BEGIN, CUSTOM_END, "<!-- doclib:managed-begin -->"]) {
    await fs.writeFile(p, `---\nsnapshot: 1\n---\n\n正文 ${marker} 尾\n`, "utf8");
    await assert.rejects(
      () => readGuideProject(root),
      (e: unknown) => e instanceof DoclibError && /区域保留标记/.test(e.message),
    );
  }
});

test("applyProjectRegion：注入替换占位，null 保持模板", async () => {
  const tpl = await renderGuide("light");
  assert.ok(applyProjectRegion(tpl, null).includes("图书馆反哺区"));
  const injected = applyProjectRegion(tpl, "## 项目速览\n- 正文");
  assert.ok(injected.includes("## 项目速览"));
  assert.ok(!injected.includes("图书馆反哺区：由 doclib sync"));
  assert.ok(injected.includes("doclib:project-begin") && injected.includes("doclib:project-end"));
});

test("renderFullGuide + writeGuides：guide-project 存在时注入 project 区，无簿记时占位", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-inject-"));
  const targets = AGENT_TARGETS.filter((t) => t.id === "claude" || t.id === "opencode");
  await writeGuides(root, "light", targets);
  const before = await fs.readFile(path.join(root, "CLAUDE.md"), "utf8");
  assert.ok(before.includes("图书馆反哺区"));

  await fs.mkdir(path.join(root, ".doclib"), { recursive: true });
  await fs.writeFile(
    path.join(root, ".doclib", "guide-project.md"),
    "---\nsnapshot: 1\ndocs-hash: f000\n---\n\n## 项目定位\n- 测试项目\n",
    "utf8",
  );
  await writeGuides(root, "light", targets);
  for (const rel of ["CLAUDE.md", "AGENTS.md"]) {
    const after = await fs.readFile(path.join(root, rel), "utf8");
    assert.ok(after.includes("## 项目定位"));
    assert.ok(after.includes("测试项目"));
    assert.ok(!after.includes("图书馆反哺区：由 doclib sync"));
  }
  const a = await fs.readFile(path.join(root, "CLAUDE.md"), "utf8");
  const b = await fs.readFile(path.join(root, "AGENTS.md"), "utf8");
  const region = (c: string): string => c.slice(c.indexOf("doclib:project-begin"), c.indexOf("doclib:project-end"));
  assert.equal(region(a), region(b));
});

test("managedRegionFresh：project 区被直改可检出，sync 后归零", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-pfresh-"));
  const targets = AGENT_TARGETS.filter((t) => t.id === "claude");
  await fs.mkdir(path.join(root, ".doclib"), { recursive: true });
  await fs.writeFile(
    path.join(root, ".doclib", "guide-project.md"),
    "---\nsnapshot: 1\n---\n\n## 反哺正文\n",
    "utf8",
  );
  await writeGuides(root, "light", targets);
  assert.deepEqual(await managedRegionFresh(root), []);
  const p = path.join(root, "CLAUDE.md");
  const raw = await fs.readFile(p, "utf8");
  const tampered = raw.replace("## 反哺正文", "## 被直改的反哺");
  await fs.writeFile(p, tampered, "utf8");
  assert.deepEqual(await managedRegionFresh(root), ["CLAUDE.md"]);
});

test("guideBudgetReport：project 区超 50 行报超限", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-pbudget-"));
  const targets = AGENT_TARGETS.filter((t) => t.id === "claude");
  await fs.mkdir(path.join(root, ".doclib"), { recursive: true });
  const filler = Array.from({ length: PROJECT_BUDGET_LINES + 5 }, () => "- 反哺条目").join("\n");
  await fs.writeFile(
    path.join(root, ".doclib", "guide-project.md"),
    `---\nsnapshot: 1\n---\n\n${filler}\n`,
    "utf8",
  );
  await writeGuides(root, "light", targets);
  const report = await guideBudgetReport(root);
  assert.ok(report.includes(`project ${PROJECT_BUDGET_LINES + 7}/${PROJECT_BUDGET_LINES} 行 ⚠ 超限`));
  assert.ok(report.includes("摘要瘦身"));
});

test("fingerprintOf：馆内路径参与、顺序稳定、非馆路径不参与", () => {
  const a = fingerprintOf({ "doclib/b.md": "h2", "doclib/a.md": "h1", "src/x.ts": "h3" });
  const b = fingerprintOf({ "doclib/a.md": "h1", "doclib/b.md": "h2" });
  assert.equal(a, b);
  const c = fingerprintOf({ "doclib/a.md": "h1", "doclib/b.md": "h9" });
  assert.notEqual(a, c);
});
