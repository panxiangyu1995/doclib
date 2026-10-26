import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { healthScore, runCheckCore } from "./check.js";
import { hashAll } from "./fsutil.js";
import { loadState, saveState, type Snapshot } from "./state.js";
import { runSnapshot } from "../commands/snapshot.js";

async function tmp(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "doclib-check-"));
}

async function setupBaseline(root: string, withDocs: boolean): Promise<void> {
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.mkdir(path.join(root, "doclib", "30-features"), { recursive: true });
  await fs.writeFile(path.join(root, "src", "a.ts"), "v1");
  await fs.writeFile(
    path.join(root, "doclib", "30-features", "a.md"),
    "---\ntitle: A\ncovers:\n  - src/a.ts\nstatus: stable\n---\nA 的行为\n",
    "utf8",
  );
  const files = await hashAll(root, ["src/a.ts"]);
  const docs = await hashAll(root, ["doclib/30-features/a.md"]);
  const snapshot: Snapshot = {
    id: "snap-001",
    version: 1,
    at: "2026-10-19T00:00:00.000Z",
    note: "",
    stats: { files: 1, primary: "TypeScript", languages: {}, frameworks: [] },
    files,
  };
  if (withDocs) snapshot.docs = docs;
  await saveState(root, { version: 1, latest: "snap-001", snapshots: [snapshot], structureVersion: 2, agents: [], acks: [], revision: 1, planning: [".plan/"], archives: [], dirExempts: [] });
}

test("check：改代码不改文档 → 漏更", async () => {
  const root = await tmp();
  await setupBaseline(root, true);
  await fs.writeFile(path.join(root, "src", "a.ts"), "v2");
  const r = await runCheckCore(root);
  assert.equal(r.hasDocLedger, true);
  const f = r.findings.find((x) => x.kind === "unaccounted");
  assert.ok(f);
  assert.equal(f.path, "src/a.ts");
  assert.deepEqual(f.docs, ["doclib/30-features/a.md"]);
});

test("check：代码与文档同改 → 已对账", async () => {
  const root = await tmp();
  await setupBaseline(root, true);
  await fs.writeFile(path.join(root, "src", "a.ts"), "v2");
  await fs.writeFile(path.join(root, "doclib", "30-features", "a.md"), "---\ntitle: A\ncovers:\n  - src/a.ts\nstatus: stable\n---\nA 的行为 v2\n", "utf8");
  const r = await runCheckCore(root);
  assert.equal(r.accounted, 1);
  assert.ok(!r.findings.some((x) => x.kind === "unaccounted"));
});

test("check：新增无 covers 路径 → 无归属；standing ack → 豁免", async () => {
  const root = await tmp();
  await setupBaseline(root, true);
  await fs.writeFile(path.join(root, "src", "b.ts"), "generated");
  let r = await runCheckCore(root);
  assert.ok(r.findings.some((x) => x.kind === "uncovered" && x.path === "src/b.ts"));
  const state = await loadState(root);
  state.acks.push({ path: "src/b.ts", note: "生成物", at: "2026-10-19T00:00:00.000Z", kind: "standing" });
  await saveState(root, state);
  r = await runCheckCore(root);
  assert.ok(r.exempted.some((e) => e.path === "src/b.ts"));
  assert.ok(!r.findings.some((x) => x.kind === "uncovered" && x.path === "src/b.ts"));
});

test("check：旧基线无文档账 → 降级", async () => {
  const root = await tmp();
  await setupBaseline(root, false);
  await fs.writeFile(path.join(root, "src", "a.ts"), "v2");
  const r = await runCheckCore(root);
  assert.equal(r.hasDocLedger, false);
  assert.ok(!r.findings.some((x) => x.kind === "unaccounted"));
});

test("check：once-ack 豁免当前基线，snapshot 后清除", async () => {
  const root = await tmp();
  await setupBaseline(root, true);
  await fs.writeFile(path.join(root, "src", "a.ts"), "v2");
  const state = await loadState(root);
  state.acks.push({ path: "src/a.ts", note: "本轮豁免", at: "2026-10-19T00:00:00.000Z", kind: "once", baseline: "snap-001" });
  await saveState(root, state);
  let r = await runCheckCore(root);
  assert.equal(r.accounted, 0);
  assert.ok(r.exempted.some((e) => e.path === "src/a.ts"));
  assert.ok(!r.findings.some((x) => x.kind === "unaccounted"));

  await runSnapshot(root, { note: "next baseline" });
  await fs.writeFile(path.join(root, "src", "a.ts"), "v3");
  r = await runCheckCore(root);
  assert.deepEqual(r.exempted, []);
  assert.ok(r.findings.some((x) => x.kind === "unaccounted" && x.path === "src/a.ts"));
});

test("check：docFirst 只含未被代码漂移触发的文档", async () => {
  const root = await tmp();
  await setupBaseline(root, true);
  await fs.writeFile(path.join(root, "src", "a.ts"), "v2");
  await fs.writeFile(path.join(root, "doclib", "30-features", "a.md"), "---\ntitle: A\ncovers:\n  - src/a.ts\nstatus: stable\n---\nA 的行为 v2\n", "utf8");
  await fs.mkdir(path.join(root, "doclib", "40-guides"), { recursive: true });
  await fs.writeFile(path.join(root, "doclib", "40-guides", "note.md"), "---\ntitle: N\ncovers: []\nstatus: living\n---\n纯文档更新\n", "utf8");
  const r = await runCheckCore(root);
  assert.equal(r.accounted, 1);
  assert.deepEqual(r.docFirst, ["doclib/40-guides/note.md"]);
});

test("check：馆外孤儿文档检出；standing ack 豁免", async () => {
  const root = await tmp();
  await setupBaseline(root, true);
  await fs.mkdir(path.join(root, "notes"), { recursive: true });
  await fs.writeFile(path.join(root, "notes", "stray.md"), "散落的知识文档", "utf8");
  let r = await runCheckCore(root);
  assert.ok(r.findings.some((x) => x.kind === "orphan-doc" && x.path === "notes/stray.md"));
  const state = await loadState(root);
  state.acks.push({ path: "notes/stray.md", note: "产品簿记", at: "2026-10-19T00:00:00.000Z", kind: "standing" });
  await saveState(root, state);
  r = await runCheckCore(root);
  assert.ok(!r.findings.some((x) => x.kind === "orphan-doc"));
  assert.ok(r.exempted.some((e) => e.path === "notes/stray.md"));
});

test("check：治理分——全绿满分 A；有漏更降分", async () => {
  const root = await tmp();
  await setupBaseline(root, true);
  const clean = await runCheckCore(root);
  assert.equal(clean.health.score, 100);
  assert.equal(clean.health.grade, "A");
  await fs.writeFile(path.join(root, "src", "a.ts"), "v2");
  const dirty = await runCheckCore(root);
  assert.equal(dirty.health.parts.accounting, 0);
  assert.ok(dirty.health.score < 100);
  assert.ok(dirty.health.grade !== "A" || dirty.health.score >= 90);
});

test("check：馆内断链 → 文档质量 finding + quality 分项扣减", async () => {
  const root = await tmp();
  await setupBaseline(root, true);
  await fs.writeFile(path.join(root, "doclib", "30-features", "z.md"), "[断链](ghost.md)", "utf8");
  const r = await runCheckCore(root);
  const f = r.findings.find((x) => x.kind === "doc-quality");
  assert.ok(f);
  assert.equal(f.path, "30-features/z.md");
  assert.equal(f.detail, "ghost.md");
  assert.equal(r.health.parts.quality, 0.9);
  assert.ok(r.health.score < 100);
});

test("check：健康分等级边界", () => {
  const full = healthScore({ driftTotal: 0, unaccounted: 0, uncovered: 0, migration: 0, orphan: 0, guideStale: 0, brokenLinks: 0 });
  assert.equal(full.score, 100);
  assert.equal(full.grade, "A");
  const heavy = healthScore({ driftTotal: 4, unaccounted: 4, uncovered: 0, migration: 0, orphan: 0, guideStale: 0, brokenLinks: 0 });
  assert.equal(heavy.parts.accounting, 0);
  assert.equal(heavy.score, 60);
  assert.equal(heavy.grade, "C");
  const linked = healthScore({ driftTotal: 0, unaccounted: 0, uncovered: 0, migration: 0, orphan: 0, guideStale: 0, brokenLinks: 1 });
  assert.equal(linked.parts.quality, 0.9);
  assert.equal(linked.score, 99);
});

test("check：工具链目录/引导文件/归档指针 → notices 豁免，不判孤儿", async () => {
  const root = await tmp();
  await setupBaseline(root, true);
  await fs.mkdir(path.join(root, ".agents", "skills", "demo"), { recursive: true });
  await fs.mkdir(path.join(root, "packages", "api"), { recursive: true });
  await fs.mkdir(path.join(root, "docs"), { recursive: true });
  await fs.writeFile(path.join(root, ".agents", "skills", "demo", "SKILL.md"), "技能", "utf8");
  await fs.writeFile(path.join(root, "packages", "api", "AGENTS.md"), "嵌套引导", "utf8");
  await fs.writeFile(path.join(root, "docs", "gone.md"), "<!-- doclib:archived-pointer -->\n\n> 已归档", "utf8");
  await fs.writeFile(path.join(root, "docs", "real.md"), "真知识", "utf8");
  const r = await runCheckCore(root);
  assert.ok(!r.findings.some((x) => x.kind === "orphan-doc" && (x.path ?? "").includes(".agents")));
  assert.ok(!r.findings.some((x) => x.kind === "orphan-doc" && (x.path ?? "").includes("AGENTS.md")));
  assert.ok(!r.findings.some((x) => x.kind === "orphan-doc" && (x.path ?? "").includes("gone.md")));
  assert.ok(r.findings.some((x) => x.kind === "orphan-doc" && x.path === "docs/real.md"));
  assert.ok(r.notices.some((n) => n.kind === "toolchain-exempt" && n.path === ".agents"));
  assert.ok(r.notices.some((n) => n.kind === "guide-exempt" && n.path === "packages"));
  assert.ok(r.notices.some((n) => n.kind === "pointer-exempt" && n.path === "docs"));
});

test("check：dirExempts（ack --dir）→ 目录内 .md 不判孤儿，仍进代码账", async () => {
  const root = await tmp();
  await setupBaseline(root, true);
  await fs.mkdir(path.join(root, ".foo", "skills"), { recursive: true });
  await fs.writeFile(path.join(root, ".foo", "skills", "SKILL.md"), "技能", "utf8");
  let r = await runCheckCore(root);
  assert.ok(!r.findings.some((x) => x.kind === "orphan-doc" && (x.path ?? "") === ".foo/skills/SKILL.md"));
  assert.ok(r.notices.some((n) => n.kind === "toolchain-suspect" && (n.path ?? "").startsWith(".foo")));
  const state = await loadState(root);
  state.dirExempts = [".foo/"];
  await saveState(root, state);
  r = await runCheckCore(root);
  assert.ok(!r.findings.some((x) => x.kind === "orphan-doc" && (x.path ?? "") === ".foo/skills/SKILL.md"));
  assert.ok(r.notices.some((n) => n.kind === "toolchain-exempt" && (n.path ?? "") === ".foo"));
  assert.ok(r.stats.codeDrift.added >= 1);
});

test("check：疑似新工具目录 → notices 提示，不判违规", async () => {
  const root = await tmp();
  await setupBaseline(root, true);
  await fs.mkdir(path.join(root, ".bar", "skills", "demo"), { recursive: true });
  await fs.writeFile(path.join(root, ".bar", "skills", "demo", "SKILL.md"), "技能", "utf8");
  const r = await runCheckCore(root);
  assert.ok(r.notices.some((n) => n.kind === "toolchain-suspect" && n.path === ".bar"));
  assert.ok(r.notices.some((n) => n.kind === "toolchain-suspect" && (n.path ?? "").startsWith(".bar/")));
  assert.ok(!r.findings.some((x) => x.kind === "orphan-doc" && (x.path ?? "").startsWith(".bar/")));
});

test("check：被新忽略规则移出代码账 ≠ 真删除 → 不产生无归属违规", async () => {
  const root = await tmp();
  await setupBaseline(root, true);
  await fs.mkdir(path.join(root, "vendor", "lib"), { recursive: true });
  await fs.writeFile(path.join(root, "vendor", "lib", "README.md"), "第三方", "utf8");
  const state = await loadState(root);
  const snap = state.snapshots[0]!;
  snap.files["vendor/lib/README.md"] = "hash-vendor";
  await saveState(root, state);
  const r = await runCheckCore(root);
  assert.ok(!r.findings.some((x) => x.kind === "uncovered" && x.path === "vendor/lib/README.md"));
  assert.ok(r.notices.some((n) => n.kind === "newly-ignored" && n.detail.includes("vendor/lib/README.md")));
  assert.equal(r.stats.codeDrift.removed, 0);
});

test("check：载体规划文档未登记 → 载体未登记违规", async () => {
  const root = await tmp();
  await setupBaseline(root, true);
  await fs.mkdir(path.join(root, ".plan", "2026-10-26"), { recursive: true });
  await fs.writeFile(path.join(root, ".plan", "2026-10-26", "x.md"), "# 规划\n", "utf8");
  const r = await runCheckCore(root);
  assert.ok(r.findings.some((f) => f.kind === "carrier-unregistered" && f.path === ".plan/2026-10-26/x.md"));
});

test("check：无载体仓库 → 归档三不变量零误报", async () => {
  const root = await tmp();
  await setupBaseline(root, true);
  const r = await runCheckCore(root);
  assert.ok(!r.findings.some((f) => f.kind === "carrier-unregistered"));
  assert.ok(!r.findings.some((f) => f.kind === "ledger-gap"));
  assert.ok(!r.findings.some((f) => f.kind === "anchor-missing"));
});
