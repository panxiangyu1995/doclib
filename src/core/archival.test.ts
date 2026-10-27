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

const SRC_EPOCH = "<!-- doclib:lesson-source-epoch: 2026-10-26 -->\n";

test("lessonSource：无标记不活跃零违规；标记在而条目早于 epoch 豁免", async () => {
  const root = await tmp();
  await seedLessons(root, "导语\n\n## 2026-10-20 · 旧条目\n- 现象：x\n");
  let findings = await archivalFindings(root, state());
  assert.deepEqual(findings.filter((f) => f.kind === "lesson-source"), []);
  await seedLessons(root, `导语\n${SRC_EPOCH}\n## 2026-10-20 · 旧条目\n- 现象：x\n`);
  findings = await archivalFindings(root, state());
  assert.deepEqual(findings.filter((f) => f.kind === "lesson-source"), []);
});

test("lessonSource：标记非法 fail-fast；epoch 后缺来源行 → lesson-source", async () => {
  const root = await tmp();
  await seedLessons(root, `导语\n<!-- doclib:lesson-source-epoch: bad -->\n`);
  await assert.rejects(() => archivalFindings(root, state()), DoclibError);
  await seedLessons(root, `导语\n${SRC_EPOCH}\n## 2026-10-26 · 新条目\n- 现象：x\n`);
  const findings = await archivalFindings(root, state());
  const src = findings.filter((f) => f.kind === "lesson-source");
  assert.deepEqual(src.map((f) => f.path), ["2026-10-26"]);
  assert.match(src[0]!.detail ?? "", /来源/);
});

test("lessonSource：路径 token 失效 → 违规；真实路径与描述性来源合法；doclib/ 前缀解析", async () => {
  const root = await tmp();
  await seedLessons(
    root,
    `导语\n${SRC_EPOCH}\n## 2026-10-26 · A\n- 现象：x\n- 来源：.plan/2026-10-26/missing.md 执行发现\n`,
  );
  let findings = await archivalFindings(root, state());
  let src = findings.filter((f) => f.kind === "lesson-source");
  assert.equal(src.length, 1);
  assert.match(src[0]!.path ?? "", /missing\.md/);

  await seedCarrier(root, ".plan/2026-10-26/real.md");
  await fs.mkdir(path.join(root, "doclib", "50-testing"), { recursive: true });
  await fs.writeFile(path.join(root, "doclib", "50-testing", "acc.md"), "x", "utf8");
  await seedLessons(
    root,
    `导语\n${SRC_EPOCH}\n## 2026-10-26 · A\n- 现象：x\n- 来源：.plan/2026-10-26/real.md；doclib/50-testing/acc.md（F-1）\n`,
  );
  findings = await archivalFindings(root, state());
  assert.deepEqual(findings.filter((f) => f.kind === "lesson-source"), []);

  await seedLessons(
    root,
    `导语\n${SRC_EPOCH}\n## 2026-10-26 · A\n- 现象：x\n- 来源：\`.plan/2026-10-26/real.md\` 与 **doclib/50-testing/acc.md**（Markdown 界定符包裹）\n`,
  );
  findings = await archivalFindings(root, state());
  assert.deepEqual(
    findings.filter((f) => f.kind === "lesson-source"),
    [],
    "反引号/星号包裹的真实路径不得带入界定符（字符集根治回归）",
  );

  await seedLessons(
    root,
    `导语\n${SRC_EPOCH}\n## 2026-10-26 · A\n- 现象：x\n- 来源："doclib/50-testing/acc.md" 与 「.plan/2026-10-26/real.md」（引号与直角引号包裹，R-2 回归）\n`,
  );
  findings = await archivalFindings(root, state());
  assert.deepEqual(
    findings.filter((f) => f.kind === "lesson-source"),
    [],
    "引号/直角引号包裹的真实路径不得带入界定符（R-2 回归）",
  );

  await seedLessons(
    root,
    `导语\n${SRC_EPOCH}\n## 2026-10-26 · B\n- 现象：x\n- 来源：\`.plan/2026-10-26/ghost.md\` 反引号内失效路径\n`,
  );
  findings = await archivalFindings(root, state());
  const backtickMiss = findings.filter((f) => f.kind === "lesson-source");
  assert.equal(backtickMiss.length, 1);
  assert.equal(backtickMiss[0]!.path, ".plan/2026-10-26/ghost.md");

  await seedLessons(
    root,
    `导语\n${SRC_EPOCH}\n## 2026-10-26 · B\n- 现象：x\n- 来源：doclib/../../etc/hosts 相对穿越\n`,
  );
  findings = await archivalFindings(root, state());
  const traversal = findings.filter((f) => f.kind === "lesson-source");
  assert.equal(traversal.length, 1, "穿越 token 必须判违规且不因根外路径存在而静默（R-3 回归）");
  assert.match(traversal[0]!.detail ?? "", /相对穿越/);

  await seedLessons(
    root,
    `导语\n${SRC_EPOCH}\n## 2026-10-26 · B\n- 现象：y\n- 来源：progress 2026-10-26 #32 REVIEW 轮（D-02）\n`,
  );
  findings = await archivalFindings(root, state());
  assert.deepEqual(findings.filter((f) => f.kind === "lesson-source"), []);
});

test("archival：in-progress 对应文档空 → implementation-anchor", async () => {
  const root = await tmp();
  await seedMap(root, ["1 | A | a |  | in-progress"]);
  const findings = await archivalFindings(root, state());
  assert.deepEqual(
    findings.filter((f) => f.kind === "implementation-anchor").map((f) => f.path),
    ["#1"],
  );
  assert.equal(findings.length, 1);
});

test("archival：in-progress 有实施载体 → 零违规", async () => {
  const root = await tmp();
  await seedMap(root, ["1 | A | a | .plan/2026-10-27/x.md | in-progress"]);
  await seedCarrier(root, ".plan/2026-10-27/x.md");
  await seedProgress(root, "- 开工 .plan/2026-10-27/x.md\n");
  const findings = await archivalFindings(root, state());
  assert.equal(findings.length, 0);
});

test("archival：in-progress ASCII \"-\" 同判实施锚点缺失（PRD 口径）", async () => {
  const root = await tmp();
  await seedMap(root, ["1 | A | a | - | in-progress"]);
  const findings = await archivalFindings(root, state());
  assert.deepEqual(
    findings.filter((f) => f.kind === "implementation-anchor").map((f) => f.path),
    ["#1"],
  );
});
