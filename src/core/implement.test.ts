import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  acceptanceAnchorFindings,
  listCandidates,
  readinessVerdict,
  renderSkeleton,
  slugify,
} from "./implement.js";

async function tmp(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "doclib-implement-"));
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

async function seedSpec(root: string, rel = "doclib/30-features/a.md"): Promise<void> {
  await fs.mkdir(path.join(root, path.dirname(rel)), { recursive: true });
  await fs.writeFile(path.join(root, rel), "规格正文 AC-1 Given x When y Then z\n", "utf8");
}

test("listCandidates：只取 planned 条目", async () => {
  const root = await tmp();
  await seedMap(root, ["1 | A | a | doclib/30-features/a.md | planned", "2 | B | b | doclib/30-features/b.md | implemented"]);
  const cs = await listCandidates(root);
  assert.deepEqual(cs.map((c) => c.n), [1]);
});

test("readinessVerdict：无条目/空文档/路径不存在 → 不通过且列原因", async () => {
  const root = await tmp();
  await seedMap(root, ["1 | A | a |  | planned", "2 | B | b | doclib/30-features/ghost.md | planned"]);
  const r0 = await readinessVerdict(root, 9);
  assert.equal(r0.ready, false);
  assert.ok(r0.reasons[0]!.includes("无 #9"));
  const r1 = await readinessVerdict(root, 1);
  assert.equal(r1.ready, false);
  assert.ok(r1.reasons[0]!.includes("对应文档"));
  const r2 = await readinessVerdict(root, 2);
  assert.equal(r2.ready, false);
  assert.ok(r2.reasons.some((x) => x.includes("ghost.md")));
});

test("readinessVerdict：馆内规格存在 → 通过", async () => {
  const root = await tmp();
  await seedMap(root, ["1 | A | a | doclib/30-features/a.md#AC-1 | planned"]);
  await seedSpec(root);
  const r = await readinessVerdict(root, 1);
  assert.equal(r.ready, true);
  assert.deepEqual(r.refs, ["doclib/30-features/a.md#AC-1"]);
});

test("readinessVerdict：implemented 状态拒绝拆单", async () => {
  const root = await tmp();
  await seedMap(root, ["1 | A | a | doclib/30-features/a.md | implemented"]);
  await seedSpec(root);
  const r = await readinessVerdict(root, 1);
  assert.equal(r.ready, false);
  assert.ok(r.reasons[0]!.includes("implemented"));
});

test("slugify：英文 kebab；纯 CJK 回退 feature-N；括号剥离", () => {
  assert.equal(slugify("CLI 基础命令集", 1), "cli");
  assert.equal(slugify("Graph Index Rebuild (F15)", 25), "graph-index-rebuild");
  assert.equal(slugify("孤儿归位（v0.5.0）", 24), "feature-24");
});

test("renderSkeleton：frontmatter 四字段 + TODO(agent) 契约位", () => {
  const sk = renderSkeleton({
    featureId: 12,
    name: "类别完备性检查",
    refs: ["doclib/30-features/a.md#AC-1"],
    generated: "2026-10-27",
  });
  assert.equal(sk.fileName, "feature-12.md");
  assert.ok(sk.content.includes("type: plan-skeleton"));
  assert.ok(sk.content.includes("feature: 12"));
  assert.ok(sk.content.includes("generated: 2026-10-27"));
  assert.ok(sk.content.includes("  - doclib/30-features/a.md#AC-1"));
  assert.ok(sk.content.includes("TODO(agent)"));
  assert.ok(sk.content.includes("→ doclib/30-features/a.md#AC-1"));
});

test("acceptanceAnchorFindings：清单条目缺 AC 引用 → 检出；TODO 行豁免", async () => {
  const root = await tmp();
  await seedSpec(root);
  await fs.mkdir(path.join(root, ".plan", "2026-10-27"), { recursive: true });
  await fs.writeFile(
    path.join(root, ".plan", "2026-10-27", "sk.md"),
    "---\ntype: plan-skeleton\nfeature: 1\ngenerated: 2026-10-27\nanchors:\n  - doclib/30-features/a.md#AC-1\n---\n\n# 实施规划\n\n- [ ] TODO(agent) → doclib/30-features/a.md#AC-1\n- [ ] 无锚点的动作\n- [x] 有锚点的动作 → doclib/30-features/a.md#AC-1\n",
    "utf8",
  );
  const findings = await acceptanceAnchorFindings(root, [".plan/"]);
  assert.equal(findings.length, 1);
  assert.equal(findings[0]!.kind, "acceptance-anchor");
  assert.ok(findings[0]!.detail!.includes("L5"));
});

test("acceptanceAnchorFindings：anchors 路径不存在 / AC 不存在 → 检出", async () => {
  const root = await tmp();
  await fs.mkdir(path.join(root, ".plan"), { recursive: true });
  await fs.writeFile(
    path.join(root, ".plan", "ghost.md"),
    "---\ntype: plan-skeleton\nfeature: 1\ngenerated: 2026-10-27\nanchors:\n  - doclib/30-features/ghost.md#AC-1\n---\n\n- [ ] 动作 → doclib/30-features/ghost.md#AC-1\n",
    "utf8",
  );
  await fs.mkdir(path.join(root, ".plan2"), { recursive: true });
  await fs.writeFile(
    path.join(root, ".plan2", "noac.md"),
    "---\ntype: plan-skeleton\nfeature: 2\ngenerated: 2026-10-27\nanchors:\n  - doclib/30-features/a.md#AC-9\n---\n\n- [ ] 动作 → doclib/30-features/a.md#AC-9\n",
    "utf8",
  );
  await seedSpec(root);
  const findings = await acceptanceAnchorFindings(root, [".plan/", ".plan2/"]);
  assert.equal(findings.length, 2);
  assert.ok(findings[0]!.detail!.includes("引用不存在"));
  assert.ok(findings[1]!.detail!.includes("AC 在馆内不存在"));
});

test("acceptanceAnchorFindings：齐备引用 → 零违规；非骨架文档忽略", async () => {
  const root = await tmp();
  await seedSpec(root);
  await fs.mkdir(path.join(root, ".plan"), { recursive: true });
  await fs.writeFile(
    path.join(root, ".plan", "ok.md"),
    "---\ntype: plan-skeleton\nfeature: 1\ngenerated: 2026-10-27\nanchors:\n  - doclib/30-features/a.md#AC-1\n---\n\n- [ ] 动作一 → doclib/30-features/a.md#AC-1\n",
    "utf8",
  );
  await fs.writeFile(path.join(root, ".plan", "free.md"), "- [ ] 自由格式无锚点\n", "utf8");
  const findings = await acceptanceAnchorFindings(root, [".plan/"]);
  assert.equal(findings.length, 0);
});

test("acceptanceAnchorFindings：anchors 标量形态同受校验", async () => {
  const root = await tmp();
  await seedSpec(root);
  await fs.mkdir(path.join(root, ".plan"), { recursive: true });
  await fs.writeFile(
    path.join(root, ".plan", "scalar.md"),
    "---\ntype: plan-skeleton\nfeature: 1\ngenerated: 2026-10-27\nanchors: doclib/30-features/ghost.md#AC-1\n---\n\n- [ ] 动作 → doclib/30-features/ghost.md#AC-1\n",
    "utf8",
  );
  const findings = await acceptanceAnchorFindings(root, [".plan/"]);
  assert.equal(findings.length, 1);
  assert.ok(findings[0]!.detail!.includes("引用不存在"));
});
