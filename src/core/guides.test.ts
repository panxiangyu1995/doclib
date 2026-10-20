import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { CUSTOM_BEGIN, CUSTOM_END, GUIDE_BUDGET_LINES, guideBudgetReport, managedRegionFresh, parseGuideStamp, renderGuide, writeGuides } from "./guides.js";
import { AGENT_TARGETS } from "./agents.js";

test("renderGuide 写入版本戳与区域标记", async () => {
  const content = await renderGuide("light");
  const stamp = parseGuideStamp(content);
  assert.ok(stamp);
  assert.equal(stamp.structure, 3);
  assert.ok(content.includes("实时同步规则"));
  assert.ok(content.includes("doclib:managed-begin"));
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
