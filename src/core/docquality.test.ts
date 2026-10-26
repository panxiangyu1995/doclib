import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { checkGenreCompliance, checkVolumeIndexes, scanBrokenLinks } from "./docquality.js";

async function tmpLib(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doclib-docq-"));
  await fs.mkdir(path.join(root, "doclib", "30-features"), { recursive: true });
  await fs.mkdir(path.join(root, "doclib", "50-testing"), { recursive: true });
  return root;
}

test("scanBrokenLinks：馆内相对断链检出；外链/锚点/根绝对/INDEX 跳过", async () => {
  const root = await tmpLib();
  await fs.writeFile(
    path.join(root, "doclib", "30-features", "a.md"),
    "[x](missing.md) [y](https://e.com/x.md) [z](#anchor) [w](/30-features/a.md) [v](../50-testing/t.md)",
    "utf8",
  );
  await fs.writeFile(path.join(root, "doclib", "50-testing", "t.md"), "T", "utf8");
  await fs.writeFile(path.join(root, "doclib", "INDEX.md"), "[broken](nope.md)", "utf8");
  const broken = await scanBrokenLinks(root);
  assert.deepEqual(broken, ["30-features/a.md → missing.md"]);
});

test("checkVolumeIndexes：卷 _index 双向核对（漏登检出 + 缺 _index 报 missingIndex）", async () => {
  const root = await tmpLib();
  await fs.writeFile(path.join(root, "doclib", "30-features", "_index.md"), "[a](a.md)", "utf8");
  await fs.writeFile(path.join(root, "doclib", "30-features", "a.md"), "A", "utf8");
  await fs.writeFile(path.join(root, "doclib", "30-features", "b.md"), "B", "utf8");
  await fs.writeFile(path.join(root, "doclib", "50-testing", "t.md"), "T", "utf8");
  const r = await checkVolumeIndexes(path.join(root, "doclib"));
  assert.deepEqual(r.missingIndex, ["50-testing"]);
  assert.deepEqual(r.unlisted, [{ dir: "30-features", docs: ["30-features/b.md"] }]);
});

test("checkVolumeIndexes：分区目录缺 _index 不计入 missingIndex；分区 _index 同规则核对", async () => {
  const root = await tmpLib();
  await fs.mkdir(path.join(root, "doclib", "30-features", "cli"), { recursive: true });
  await fs.writeFile(path.join(root, "doclib", "30-features", "a.md"), "A", "utf8");
  await fs.writeFile(
    path.join(root, "doclib", "30-features", "_index.md"),
    "[a](a.md) [cli 索引](cli/c.md)",
    "utf8",
  );
  await fs.writeFile(path.join(root, "doclib", "30-features", "cli", "_index.md"), "[c](c.md)", "utf8");
  await fs.writeFile(path.join(root, "doclib", "30-features", "cli", "c.md"), "C", "utf8");
  const r = await checkVolumeIndexes(path.join(root, "doclib"));
  assert.deepEqual(r.missingIndex, []);
  assert.deepEqual(r.unlisted, []);
});

function narrativeDoc(lead: string, sections: string[], filler: string[]): string {
  const parts = [`# 标题`, "", lead, ""];
  for (const s of sections) {
    parts.push(`## ${s}`, "", ...filler, "");
  }
  return parts.join("\n");
}

test("checkGenreCompliance：narrative 缺导读/三段 → structure 违规", async () => {
  const root = await tmpLib();
  await fs.writeFile(
    path.join(root, "doclib", "30-features", "a.md"),
    "---\ntitle: A\ncovers: []\n---\n\n# A\n\n| 表 | 格 |\n| --- | --- |\n",
    "utf8",
  );
  const r = await checkGenreCompliance(path.join(root, "doclib"));
  const v = r.violations.find((x) => x.doc === "30-features/a.md" && x.kind === "structure");
  assert.ok(v);
  assert.match(v!.detail, /导读/);
  assert.match(v!.detail, /为什么/);
  assert.match(v!.detail, /怎么运转/);
});

test("checkGenreCompliance：合规 narrative（导读+三段+10 行正文）无违规", async () => {
  const root = await tmpLib();
  const filler = Array.from({ length: 4 }, (_, i) => `叙述行 ${i}，说明动机与机制。`);
  await fs.writeFile(
    path.join(root, "doclib", "30-features", "ok.md"),
    `---\ntitle: OK\ncovers: []\n---\n\n${narrativeDoc("本文讲清楚一件事。", ["为什么", "是什么", "怎么运转"], filler)}`,
    "utf8",
  );
  const r = await checkGenreCompliance(path.join(root, "doclib"));
  assert.deepEqual(
    r.violations.filter((x) => x.doc === "30-features/ok.md"),
    [],
  );
  assert.deepEqual(
    r.warnings.filter((x) => x.doc === "30-features/ok.md"),
    [],
  );
});

test("checkGenreCompliance：narrative 正文有效行 <10 → card 违规（表格/标题不计）", async () => {
  const root = await tmpLib();
  await fs.writeFile(
    path.join(root, "doclib", "30-features", "card.md"),
    "---\ntitle: C\ncovers: []\n---\n\n# C\n\n本文导读一句。\n\n## 为什么\n\n| 只 | 有表 |\n| --- | --- |\n\n## 是什么\n\n一行。\n\n## 怎么运转\n\n两行。\n",
    "utf8",
  );
  const r = await checkGenreCompliance(path.join(root, "doclib"));
  const v = r.violations.find((x) => x.doc === "30-features/card.md" && x.kind === "card");
  assert.ok(v);
});

test("checkGenreCompliance：过程短语 → pollution 违规；编号 D-01 不误报；benchmark 分区豁免", async () => {
  const root = await tmpLib();
  const filler = Array.from({ length: 4 }, (_, i) => `叙述行 ${i}。`);
  await fs.writeFile(
    path.join(root, "doclib", "30-features", "p.md"),
    `---\ntitle: P\ncovers: []\n---\n\n${narrativeDoc("导读。", ["为什么", "是什么", "怎么运转"], filler)}\n回灌补记（原仓库答卷 2026-10-21）：形状待精读。\n`,
    "utf8",
  );
  await fs.writeFile(
    path.join(root, "doclib", "30-features", "clean.md"),
    `---\ntitle: CL\ncovers: []\n---\n\n${narrativeDoc("导读。缺陷账 D-01 与 S2-05 属正式编号引用。", ["为什么", "是什么", "怎么运转"], filler)}`,
    "utf8",
  );
  await fs.mkdir(path.join(root, "doclib", "50-testing", "benchmark"), { recursive: true });
  await fs.writeFile(
    path.join(root, "doclib", "50-testing", "benchmark", "arc.md"),
    "回灌补记与复原口径在档案区合法。",
    "utf8",
  );
  const r = await checkGenreCompliance(path.join(root, "doclib"));
  const polluted = r.violations.filter((x) => x.kind === "pollution");
  assert.deepEqual(polluted.map((x) => x.doc), ["30-features/p.md"]);
});

test("checkGenreCompliance：ledger 册（60/90 卷）不查结构、大表不判倾倒；type: ledger 覆盖 narrative 卷", async () => {
  const root = await tmpLib();
  await fs.mkdir(path.join(root, "doclib", "90-reference"), { recursive: true });
  const rows = Array.from({ length: 30 }, (_, i) => `| API-0${i} | GET | /x${i} | 说明 ${i} |`).join("\n");
  await fs.writeFile(
    path.join(root, "doclib", "90-reference", "api.md"),
    `---\ntitle: API\ncovers: []\n---\n\n# api 册\n\n> 本册范围：全部端点。\n\n| 标识 | 方法 | 路径 | 说明 |\n| --- | --- | --- | --- |\n${rows}\n`,
    "utf8",
  );
  await fs.writeFile(
    path.join(root, "doclib", "30-features", "led.md"),
    "---\ntitle: L\ntype: ledger\ncovers: []\n---\n\n# 登记册\n\n| A | B |\n| --- | --- |\n",
    "utf8",
  );
  const r = await checkGenreCompliance(path.join(root, "doclib"));
  assert.deepEqual(r.violations, []);
  assert.deepEqual(r.warnings, []);
});

test("checkGenreCompliance：narrative 表格/列表占比 >70% → 倾倒警告（永不违规）", async () => {
  const root = await tmpLib();
  const rows = Array.from({ length: 40 }, (_, i) => `| 项${i} | 值${i} |`).join("\n");
  const filler = Array.from({ length: 3 }, (_, i) => `叙述行 ${i}。`);
  await fs.writeFile(
    path.join(root, "doclib", "30-features", "dump.md"),
    `---\ntitle: D\ncovers: []\n---\n\n${narrativeDoc("导读。", ["为什么", "是什么", "怎么运转"], filler)}\n${rows}\n`,
    "utf8",
  );
  const r = await checkGenreCompliance(path.join(root, "doclib"));
  assert.equal(r.violations.length, 0);
  const w = r.warnings.find((x) => x.doc === "30-features/dump.md");
  assert.ok(w);
});

test("checkGenreCompliance：_index/README/INDEX/99-archive 全豁免；95-lessons 免结构但污染仍查", async () => {
  const root = await tmpLib();
  await fs.writeFile(path.join(root, "doclib", "30-features", "_index.md"), "| 表 | 格 |", "utf8");
  await fs.writeFile(path.join(root, "doclib", "README.md"), "# 图书馆", "utf8");
  await fs.writeFile(path.join(root, "doclib", "INDEX.md"), "# 索引", "utf8");
  await fs.mkdir(path.join(root, "doclib", "95-lessons"), { recursive: true });
  await fs.writeFile(path.join(root, "doclib", "95-lessons", "l.md"), "# 教训\n\n回灌补记在正文。", "utf8");
  await fs.mkdir(path.join(root, "doclib", "99-archive"), { recursive: true });
  await fs.writeFile(path.join(root, "doclib", "99-archive", "a.md"), "回灌补记档案。", "utf8");
  const r = await checkGenreCompliance(path.join(root, "doclib"));
  assert.deepEqual(r.violations.map((x) => `${x.doc}:${x.kind}`), ["95-lessons/l.md:pollution"]);
});

test("checkGenreCompliance：98-sessions 对话档案区全豁免（含污染检查）", async () => {
  const root = await tmpLib();
  await fs.mkdir(path.join(root, "doclib", "98-sessions"), { recursive: true });
  await fs.writeFile(
    path.join(root, "doclib", "98-sessions", "t.md"),
    "---\ntitle: T\ntype: transcript\n---\n\n# 会话记录\n\n回灌补记实测补原仓库答卷，正文只有一行，不合任何文体。",
    "utf8",
  );
  const r = await checkGenreCompliance(path.join(root, "doclib"));
  assert.deepEqual(r.violations.filter((x) => x.doc === "98-sessions/t.md"), []);
  assert.deepEqual(r.warnings.filter((x) => x.doc === "98-sessions/t.md"), []);
});

test("checkGenreCompliance：卡片化按行数+字符数双阈值——长段落叙述不误报", async () => {
  const root = await tmpLib();
  const para = "这一段是三百字级的连贯叙述，讲清楚设计动机、结构与运转机制的完整脉络，包含足够的上下文让新手与 agent 都能顺着读下去，行数虽少但信息密度充分，不应被判为卡片化。".repeat(4);
  await fs.writeFile(
    path.join(root, "doclib", "30-features", "long.md"),
    `---\ntitle: L\ncovers: []\n---\n\n# L\n\n导读一段。\n\n## 为什么\n\n${para}\n\n## 是什么\n\n${para}\n\n## 怎么运转\n\n${para}\n`,
    "utf8",
  );
  const r = await checkGenreCompliance(path.join(root, "doclib"));
  assert.deepEqual(r.violations.filter((x) => x.doc === "30-features/long.md"), []);
});

test("checkGenreCompliance：status:draft 的结构/卡片违规降级为警告（pollution 不降级）", async () => {
  const root = await tmpLib();
  await fs.writeFile(
    path.join(root, "doclib", "30-features", "d.md"),
    "---\ntitle: D\nstatus: draft\ncovers: []\n---\n\n# D\n\n| 表 | 格 |\n",
    "utf8",
  );
  const r = await checkGenreCompliance(path.join(root, "doclib"));
  const doc = "30-features/d.md";
  assert.equal(r.violations.filter((x) => x.doc === doc).length, 0);
  const kinds = r.warnings.filter((x) => x.doc === doc).map((x) => x.kind);
  assert.deepEqual(kinds.sort(), ["card", "structure"]);
  assert.ok(r.warnings.filter((x) => x.doc === doc).every((x) => x.detail.includes("[draft 降级]")));

  await fs.writeFile(
    path.join(root, "doclib", "30-features", "dp.md"),
    "---\ntitle: DP\nstatus: draft\ncovers: []\n---\n\n# DP\n\n回灌补记在 draft 中仍属污染。\n",
    "utf8",
  );
  const r2 = await checkGenreCompliance(path.join(root, "doclib"));
  assert.ok(r2.violations.some((x) => x.doc === "30-features/dp.md" && x.kind === "pollution"));
});

test("checkGenreCompliance：400 字符阈值——稀薄正文（<10 行且 <400 字符）违规、长文精炼正文（<10 行但 ≥400 字符）通过", async () => {
  const root = await tmpLib();
  const thin = "短句。\n短句。";
  const rich = "完整叙述一段话，覆盖动机、结构与运转机制的完整脉络：设计背景、被否的备选方案、关键约束与取舍理由逐一交代，语句充分展开达到信息密度要求，不再依赖表格倾倒，信息量足以支撑陌生读者的独立理解。\n第二段补充：边界与错误面的说明同样写足——正常路径、失败分支、降级行为与诊断提示各就其位，让新手与 agent 都能顺着读完且知道去哪核对。";
  await fs.writeFile(
    path.join(root, "doclib", "30-features", "thin.md"),
    `---\ntitle: T\ncovers: []\n---\n\n# T\n\n导读。\n\n## 为什么\n\n${thin}\n\n## 是什么\n\n${thin}\n\n## 怎么运转\n\n${thin}\n`,
    "utf8",
  );
  await fs.writeFile(
    path.join(root, "doclib", "30-features", "rich.md"),
    `---\ntitle: R\ncovers: []\n---\n\n# R\n\n导读。\n\n## 为什么\n\n${rich}\n\n## 是什么\n\n${rich}\n\n## 怎么运转\n\n${rich}\n`,
    "utf8",
  );
  const r = await checkGenreCompliance(path.join(root, "doclib"));
  assert.ok(r.violations.some((x) => x.doc === "30-features/thin.md" && x.kind === "card"));
  assert.equal(r.violations.filter((x) => x.doc === "30-features/rich.md").length, 0);
});
