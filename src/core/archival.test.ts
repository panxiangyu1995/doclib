import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { archivalFindings } from "./archival.js";
import { DoclibError, emptyState, type State } from "./state.js";

async function tmp(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "doclib-archival-"));
}

const HEADER = "| # | 功能 | 描述 | 对应文档 | 状态 |\n| --- | --- | --- | --- | --- |\n";

async function seedMap(root: string, rows: string[]): Promise<void> {
  await fs.mkdir(path.join(root, "doclib", "00-overview"), { recursive: true });
  await fs.writeFile(
    path.join(root, "doclib", "00-overview", "feature-map.md"),
    HEADER + rows.map((r) => `| ${r} |\n`).join(""),
    "utf8",
  );
}

async function seedProgress(root: string, body: string): Promise<void> {
  await fs.mkdir(path.join(root, "doclib", "00-overview"), { recursive: true });
  await fs.writeFile(path.join(root, "doclib", "00-overview", "progress.md"), body, "utf8");
}

async function seedCarrier(root: string, rel = ".plan/2026-10-26/a.md"): Promise<void> {
  await fs.mkdir(path.join(root, path.dirname(rel)), { recursive: true });
  await fs.writeFile(path.join(root, rel), "# 规划\n", "utf8");
}

function state(acks: State["acks"] = []): State {
  return { ...emptyState(), planning: [".plan/"], acks };
}

test("archival：未登记载体 → carrier-unregistered", async () => {
  const root = await tmp();
  await seedMap(root, ["1 | A | a | 30-features/a.md | implemented"]);
  await seedCarrier(root);
  const findings = await archivalFindings(root, state());
  assert.deepEqual(
    findings.filter((f) => f.kind === "carrier-unregistered").map((f) => f.path),
    [".plan/2026-10-26/a.md"],
  );
  assert.equal(findings.length, 1);
});

test("archival：docs 单元含载体路径 → 已登记零违规", async () => {
  const root = await tmp();
  await seedMap(root, ["1 | A | a | .plan/2026-10-26/a.md + 30-features/a.md | implemented"]);
  await seedProgress(root, "- 规划 .plan/2026-10-26/a.md 完成\n");
  await seedCarrier(root);
  const findings = await archivalFindings(root, state());
  assert.equal(findings.length, 0);
});

test("archival：ack 豁免 → 零违规", async () => {
  const root = await tmp();
  await seedMap(root, ["1 | A | a | 30-features/a.md | implemented"]);
  await seedCarrier(root);
  const findings = await archivalFindings(root, state([
    { kind: "standing", path: ".plan/2026-10-26/a.md", note: "scratch", at: "2026-10-26T00:00:00.000Z" },
  ]));
  assert.equal(findings.length, 0);
});

test("archival：行引用载体但 progress 无补记 → ledger-gap", async () => {
  const root = await tmp();
  await seedMap(root, ["1 | A | a | .plan/2026-10-26/a.md | implemented"]);
  await seedProgress(root, "- 无关条目\n");
  await seedCarrier(root);
  const findings = await archivalFindings(root, state());
  const gaps = findings.filter((f) => f.kind === "ledger-gap");
  assert.deepEqual(gaps.map((f) => f.path), [".plan/2026-10-26/a.md"]);
  const gap = gaps[0];
  assert.ok(gap !== undefined && gap.detail !== undefined && gap.detail.includes("#1"));
  assert.equal(findings.length, 1);
});

test("archival：progress 含载体路径 → 零违规", async () => {
  const root = await tmp();
  await seedMap(root, ["1 | A | a | .plan/2026-10-26/a.md | implemented"]);
  await seedProgress(root, "- 2026-10-26 规划 .plan/2026-10-26/a.md 执行完毕\n");
  await seedCarrier(root);
  const findings = await archivalFindings(root, state());
  assert.equal(findings.length, 0);
});

test("archival：implemented 无锚点 → anchor-missing", async () => {
  const root = await tmp();
  await seedMap(root, ["1 | A | a | — | implemented"]);
  const findings = await archivalFindings(root, state());
  assert.deepEqual(
    findings.filter((f) => f.kind === "anchor-missing").map((f) => f.path),
    ["#1"],
  );
  assert.equal(findings.length, 1);
});

test("archival：implemented 有文档锚点 → 零违规", async () => {
  const root = await tmp();
  await seedMap(root, ["1 | A | a | 30-features/a.md | implemented"]);
  const findings = await archivalFindings(root, state());
  assert.equal(findings.length, 0);
});

test("archival：planned 无锚点不违规（仅 implemented 强制）", async () => {
  const root = await tmp();
  await seedMap(root, ["1 | A | a | — | planned"]);
  const findings = await archivalFindings(root, state());
  assert.equal(findings.length, 0);
});

async function seedLessons(root: string, body: string, repoDir?: string): Promise<void> {
  const abs = repoDir === undefined
    ? path.join(root, "doclib", "95-lessons", "lessons.md")
    : path.join(root, repoDir, "doclib", "95-lessons", "lessons.md");
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, body, "utf8");
}

const EPOCH = "<!-- doclib:lesson-epoch: 2026-10-26 -->\n";

test("archival：epoch 后条目缺处置位 → lesson-gap", async () => {
  const root = await tmp();
  await seedMap(root, ["1 | A | a | 30-features/a.md | implemented"]);
  await seedProgress(root, `${EPOCH}- **2026-10-26** · 完成了某功能\n`);
  const findings = await archivalFindings(root, state());
  const gaps = findings.filter((f) => f.kind === "lesson-gap");
  assert.deepEqual(gaps.map((f) => f.path), ["2026-10-26"]);
});

test("archival：处置引用在 lessons 无命中 → lesson-gap", async () => {
  const root = await tmp();
  await seedMap(root, ["1 | A | a | 30-features/a.md | implemented"]);
  await seedProgress(root, `${EPOCH}- **2026-10-26** · 完成 A｜教训: 95-lessons 2026-10-26 · 不存在的教训\n`);
  const findings = await archivalFindings(root, state());
  assert.ok(findings.some((f) => f.kind === "lesson-gap" && (f.path ?? "").includes("不存在的教训")));
});

test("archival：处置引用命中 lessons 条目 → 零违规", async () => {
  const root = await tmp();
  await seedMap(root, ["1 | A | a | 30-features/a.md | implemented"]);
  await seedLessons(root, "# L\n\n## 2026-10-26 · 测试教训标题\n\n- 现象：x\n");
  await seedProgress(root, `${EPOCH}- **2026-10-26** · 完成 A｜教训: 95-lessons 2026-10-26 · 测试教训\n`);
  const findings = await archivalFindings(root, state());
  assert.equal(findings.length, 0);
});

test("archival：处置位为「无（理由）」→ 零违规", async () => {
  const root = await tmp();
  await seedMap(root, ["1 | A | a | 30-features/a.md | implemented"]);
  await seedProgress(root, `${EPOCH}- **2026-10-26** · 完成 A｜教训: 无（规划条目无踩坑）\n`);
  const findings = await archivalFindings(root, state());
  assert.equal(findings.length, 0);
});

test("archival：epoch 之前条目豁免（存量不追溯）", async () => {
  const root = await tmp();
  await seedMap(root, ["1 | A | a | 30-features/a.md | implemented"]);
  await seedProgress(root, `${EPOCH}- **2026-10-25** · 旧条目无处置位\n`);
  const findings = await archivalFindings(root, state());
  assert.equal(findings.length, 0);
});

test("archival：@dir 他馆引用命中与缺失", async () => {
  const root = await tmp();
  await seedMap(root, ["1 | A | a | 30-features/a.md | implemented"]);
  await seedLessons(root, "# L\n\n## 2026-10-21 · 他馆教训标题\n\n- 现象：x\n", "test/x");
  await seedProgress(
    root,
    `${EPOCH}- **2026-10-26** · A｜教训: 95-lessons@test/x 2026-10-21 · 他馆教训；95-lessons@test/none 2026-10-21 · 缺失教训\n`,
  );
  const findings = await archivalFindings(root, state());
  const gaps = findings.filter((f) => f.kind === "lesson-gap");
  assert.equal(gaps.length, 1);
  assert.ok((gaps[0]?.path ?? "").includes("test/none"));
});

test("archival：epoch 标记日期非法 → fail-fast", async () => {
  const root = await tmp();
  await seedMap(root, ["1 | A | a | 30-features/a.md | implemented"]);
  await seedProgress(root, "<!-- doclib:lesson-epoch: not-a-date -->\n");
  await assert.rejects(() => archivalFindings(root, state()), DoclibError);
});
