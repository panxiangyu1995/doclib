import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  bakeChainLines,
  chainFingerprint,
  chainMarker,
  chainStaleDetail,
  extractChainMarker,
  loadTestChain,
  parseTestChain,
  skeletonProgressFindings,
} from "./harness.js";
import { DoclibError } from "./state.js";

async function tmp(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "doclib-harness-"));
}

async function writeTestingDoc(root: string, frontmatter: string): Promise<void> {
  await fs.mkdir(path.join(root, "doclib", "50-testing"), { recursive: true });
  await fs.writeFile(path.join(root, "doclib", "50-testing", "testing.md"), `---\n${frontmatter}---\n正文\n`, "utf8");
}

async function writeSkeleton(root: string, featureMapRow: string, frontmatter: string, body: string): Promise<void> {
  await fs.mkdir(path.join(root, "doclib", "00-overview"), { recursive: true });
  await fs.writeFile(
    path.join(root, "doclib", "00-overview", "feature-map.md"),
    `| # | 功能 | 描述 | 对应文档 | 状态 |\n| --- | --- | --- | --- | --- |\n${featureMapRow}\n`,
    "utf8",
  );
  await fs.mkdir(path.join(root, ".plan", "d1"), { recursive: true });
  await fs.writeFile(path.join(root, ".plan", "d1", "skel.md"), `---\n${frontmatter}---\n${body}\n`, "utf8");
}

test("parseTestChain：双档块列表", () => {
  const c = parseTestChain({ "test-chain-fast": ["npm run typecheck", "npm test"], "test-chain-full": ["npm test"] });
  assert.deepEqual(c, { fast: ["npm run typecheck", "npm test"], full: ["npm test"] });
});

test("parseTestChain：标量与内联列表同权", () => {
  assert.deepEqual(parseTestChain({ "test-chain-fast": "npm test", "test-chain-full": ["a", "b"] }), {
    fast: ["npm test"],
    full: ["a", "b"],
  });
  assert.deepEqual(parseTestChain({ "test-chain-fast": ["x"], "test-chain-full": "y" }), { fast: ["x"], full: ["y"] });
});

test("parseTestChain：缺席与全空 → null", () => {
  assert.equal(parseTestChain({}), null);
  assert.equal(parseTestChain({ "test-chain-fast": [], "test-chain-full": ["  ", ""] }), null);
});

test("parseTestChain：单档声明回退另一档", () => {
  assert.deepEqual(parseTestChain({ "test-chain-fast": ["a"] }), { fast: ["a"], full: ["a"] });
  assert.deepEqual(parseTestChain({ "test-chain-full": ["b"] }), { fast: ["b"], full: ["b"] });
});

test("parseTestChain：嵌套键 fail-fast", () => {
  assert.throws(() => parseTestChain({ "test-chain": ["npm test"] }), DoclibError);
});

test("loadTestChain：文件缺席 → null；声明 → 链", async () => {
  const root = await tmp();
  assert.equal(await loadTestChain(root), null);
  await writeTestingDoc(root, "title: T\ntest-chain-fast:\n  - npm run typecheck\n  - npm test\ntest-chain-full: npm test\n");
  const c = await loadTestChain(root);
  assert.deepEqual(c, { fast: ["npm run typecheck", "npm test"], full: ["npm test"] });
});

test("chainFingerprint：稳定且随档位变化", () => {
  const a = { fast: ["x"], full: ["y"] };
  assert.equal(chainFingerprint(a), chainFingerprint({ fast: ["x"], full: ["y"] }));
  assert.notEqual(chainFingerprint(a), chainFingerprint({ fast: ["y"], full: ["x"] }));
  assert.match(chainMarker(a), /^# doclib-chain:[0-9a-f]{12}$/);
});

test("extractChainMarker 与 chainStaleDetail 四态", () => {
  const chain = { fast: ["x"], full: ["y"] };
  const marker = chainMarker(chain);
  const script = `#!/bin/sh\n# doclib-hook\n${marker}\nnode cli check\n`;
  assert.equal(extractChainMarker(script), marker);
  assert.equal(chainStaleDetail(null, chain), null);
  assert.equal(chainStaleDetail(script, chain), null);
  assert.match(chainStaleDetail(script, null) ?? "", /已不存在/);
  assert.match(chainStaleDetail("#!/bin/sh\nno marker\n", chain) ?? "", /未烘焙/);
  assert.match(chainStaleDetail(script, { fast: ["z"], full: ["y"] }) ?? "", /失配/);
});

test("bakeChainLines：逐命令失败即断", () => {
  const lines = bakeChainLines(["npm run lint", "npm test"], "fast 档");
  assert.deepEqual(lines, ['echo "doclib hook: fast 档（2 条）"', "npm run lint || exit 1", "npm test || exit 1"]);
});

test("skeletonProgress：implemented 未勾选 → 违规", async () => {
  const root = await tmp();
  await writeSkeleton(root, "| 1 | F | d | doclib/30-features/a.md | implemented |", "type: plan-skeleton\nfeature: 1\n", "- [ ] 动作 → doclib/30-features/a.md#AC-1\n");
  const s = await skeletonProgressFindings(root, [".plan/"]);
  assert.equal(s.findings.length, 1);
  assert.equal(s.findings[0]!.kind, "skeleton-progress");
  assert.match(s.findings[0]!.detail ?? "", /1 条未勾选/);
});

test("skeletonProgress：in-progress 未勾选 → open notice；planned 不判", async () => {
  const root = await tmp();
  await writeSkeleton(root, "| 1 | F | d | doclib/30-features/a.md | in-progress |", "type: plan-skeleton\nfeature: 1\n", "- [ ] 动作 → a#AC-1\n- [x] 已完 → a#AC-2\n");
  let s = await skeletonProgressFindings(root, [".plan/"]);
  assert.equal(s.findings.length, 0);
  assert.equal(s.openNotices.length, 1);
  assert.match(s.openNotices[0]!.detail, /1 条未勾选/);
  await fs.writeFile(path.join(root, "doclib", "00-overview", "feature-map.md"), "| # | 功能 | 描述 | 对应文档 | 状态 |\n| --- | --- | --- | --- | --- |\n| 1 | F | d | doclib/30-features/a.md | planned |\n", "utf8");
  s = await skeletonProgressFindings(root, [".plan/"]);
  assert.equal(s.findings.length + s.openNotices.length, 0);
});

test("skeletonProgress：全勾选与骨架缺失不判；blocked → notice；非骨架跳过", async () => {
  const root = await tmp();
  await writeSkeleton(root, "| 1 | F | d | doclib/30-features/a.md | implemented |", "type: plan-skeleton\nfeature: 1\n", "- [x] 动作 → a#AC-1\n");
  let s = await skeletonProgressFindings(root, [".plan/"]);
  assert.equal(s.findings.length, 0);
  await fs.writeFile(path.join(root, ".plan", "d1", "skel.md"), "---\ntype: plan-skeleton\nfeature: 1\nblocked: 缺 API 密钥\n---\n- [ ] 动作 → a#AC-1\n", "utf8");
  s = await skeletonProgressFindings(root, [".plan/"]);
  assert.equal(s.findings.length, 1);
  assert.equal(s.blockedNotices.length, 1);
  assert.match(s.blockedNotices[0]!.detail, /缺 API 密钥/);
  await fs.writeFile(path.join(root, ".plan", "d1", "skel.md"), "---\ntype: note\n---\n- [ ] 随意\n", "utf8");
  s = await skeletonProgressFindings(root, [".plan/"]);
  assert.equal(s.findings.length + s.openNotices.length + s.blockedNotices.length, 0);
  await fs.rm(path.join(root, ".plan", "d1", "skel.md"));
  s = await skeletonProgressFindings(root, [".plan/"]);
  assert.equal(s.findings.length + s.openNotices.length + s.blockedNotices.length, 0);
});

test("skeletonProgress：TODO(agent) 占位与 feature 不存在不判", async () => {
  const root = await tmp();
  await writeSkeleton(root, "| 1 | F | d | doclib/30-features/a.md | implemented |", "type: plan-skeleton\nfeature: 1\n", "- [ ] TODO(agent) → a#AC-1\n");
  let s = await skeletonProgressFindings(root, [".plan/"]);
  assert.equal(s.findings.length, 0);
  await fs.writeFile(path.join(root, ".plan", "d1", "skel.md"), "---\ntype: plan-skeleton\nfeature: 9\n---\n- [ ] 动作 → a#AC-1\n", "utf8");
  s = await skeletonProgressFindings(root, [".plan/"]);
  assert.equal(s.findings.length + s.openNotices.length, 0);
});
