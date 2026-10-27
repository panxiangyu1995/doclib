import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { runCheck } from "./check.js";
import { DoclibError } from "../core/state.js";
import { CLI_VERSION, STRUCTURE_VERSION } from "../core/version.js";
import { docMd, put, seedState, snapshotRow, tmpRoot } from "./testkit.js";
import { runSnapshot } from "./snapshot.js";

async function seedBase(root: string): Promise<void> {
  await put(root, "src/a.ts", "v1");
  await put(root, "doclib/30-features/a.md", docMd("A", ["src/a.ts"]));
  await runSnapshot(root, { note: "base" });
}

function withExit(fn: () => Promise<void>): Promise<void> {
  return (async () => {
    const prev = process.exitCode;
    try {
      await fn();
    } finally {
      process.exitCode = prev;
    }
  })();
}

test("check：无基线 → DoclibError", async () => {
  const root = await tmpRoot("doclib-acc-check-");
  await assert.rejects(
    () => runCheck(root, {}),
    (e: unknown) => e instanceof DoclibError && /尚无基线快照：先执行 doclib snapshot/.test(e.message),
  );
});

test("check：全绿 → 违规: 无 / strict 门禁通过 / 治理 100 A / 不动退出码", async () => {
  const root = await tmpRoot("doclib-acc-check-");
  await seedBase(root);
  await withExit(async () => {
    const r = await runCheck(root, { strict: true });
    assert.match(r.text, /强验证报告（基线 snap-001）/);
    assert.match(r.text, /违规: 无/);
    assert.match(r.text, /strict 门禁: 通过/);
    assert.match(r.text, /治理: 100\/100 \(A\)/);
    assert.notEqual(process.exitCode, 1);
  });
});

test("check：漏更 → 漏更分类 + 覆盖文档提示 + --strict 退出码 1", async () => {
  const root = await tmpRoot("doclib-acc-check-");
  await seedBase(root);
  await put(root, "src/a.ts", "v2");
  await withExit(async () => {
    const r = await runCheck(root, { strict: true });
    assert.match(r.text, /漏更 \(1\)/);
    assert.match(r.text, /- src\/a\.ts  —  覆盖文档未更新: doclib\/30-features\/a\.md/);
    assert.match(r.text, /strict 门禁: 未通过（1 项违规，--strict 时退出码 1）/);
    assert.equal(process.exitCode, 1);
  });
});

test("check：无归属 → 新文件无 covers；已对账计数", async () => {
  const root = await tmpRoot("doclib-acc-check-");
  await seedBase(root);
  await put(root, "src/new.ts", "x");
  await put(root, "src/a.ts", "v2");
  await put(root, "doclib/30-features/a.md", docMd("A", ["src/a.ts"], "v2 行为\n"));
  const r = await runCheck(root, {});
  assert.match(r.text, /无归属 \(1\)/);
  assert.match(r.text, /- src\/new\.ts/);
  assert.match(r.text, /已对账: 1/);
});

test("check：删除已覆盖代码 → 漏更（覆盖文档仍在）", async () => {
  const root = await tmpRoot("doclib-acc-check-");
  await seedBase(root);
  await fs.rm(path.join(root, "src", "a.ts"));
  const r = await runCheck(root, {});
  assert.match(r.text, /漏更 \(1\)/);
  assert.match(r.text, /- src\/a\.ts  —  覆盖文档未更新: doclib\/30-features\/a\.md/);
});

test("check：文档先行（只改文档）→ 无违规，计入文档变更", async () => {
  const root = await tmpRoot("doclib-acc-check-");
  await seedBase(root);
  await put(root, "doclib/30-features/a.md", docMd("A", ["src/a.ts"], "文档先行更新\n"));
  const r = await runCheck(root, {});
  assert.match(r.text, /违规: 无/);
  assert.match(r.text, /文档变更: 1/);
  assert.match(r.text, /文档先行: 1/);
});

test("check：迁移违规——未登记/命名不符/断号/重复/指向不存在脚本", async () => {
  const root = await tmpRoot("doclib-acc-check-");
  await seedBase(root);
  await put(root, "migrations/001_20260101_init.sql", "CREATE TABLE t();");
  await put(root, "migrations/002_20260102_add.sql", "ALTER TABLE t;");
  await put(root, "migrations/BAD_NAME.sql", "-- 命名不符");
  await put(
    root,
    "doclib/10-architecture/migrations.md",
    "| 编号 | 日期 | 文件 | 目的 | 状态 |\n| --- | --- | --- | --- | --- |\n| 001 | 2026-01-01 | migrations/001_20260101_init.sql | 初始化 | applied |\n| 001 | 2026-01-02 | migrations/002_20260102_add.sql | 重复编号 | applied |\n| 005 | 2026-01-05 | migrations/missing_005.sql | 断号 | applied |\n| 007 | 2026-01-07 | legacy/007.sql | 非法路径不校验 | applied |\n",
  );
  const r = await runCheck(root, {});
  assert.match(r.text, /迁移违规 \(8\)/);
  assert.match(r.text, /migrations\/002_20260102_add\.sql  —  脚本未在账本登记（编号 002）/);
  assert.match(r.text, /migrations\/BAD_NAME\.sql  —  命名不符 NNN_YYYYMMDD_slug\.sql/);
  assert.match(r.text, /账本编号重复：001/);
  assert.match(r.text, /账本指向不存在的脚本：migrations\/missing_005\.sql/);
  const j = r.json as { findings: Array<{ kind: string; detail?: string }> };
  const details = j.findings.filter((f) => f.kind === "migration").map((f) => f.detail);
  for (const n of ["002", "003", "004", "006"]) {
    assert.ok(details.some((d) => d!.includes(`断号：${n}`)), `缺断号 ${n}`);
  }
  assert.ok(!details.some((d) => d!.includes("legacy/007.sql")));
});

test("check：引导过期检出（managed 区被篡改）", async () => {
  const root = await tmpRoot("doclib-acc-check-");
  await seedBase(root);
  await put(
    root,
    "CLAUDE.md",
    `<!-- doclib-guide cli=${CLI_VERSION} structure=${STRUCTURE_VERSION} -->\n<!-- doclib:managed-begin -->\n被篡改的规则区\n<!-- doclib:managed-end -->\n<!-- doclib:custom-begin -->\n<!-- doclib:custom-end -->\n`,
  );
  const r = await runCheck(root, {});
  assert.match(r.text, /引导过期 \(1\)/);
  assert.match(r.text, /- CLAUDE\.md  —  引导规则\/反哺区落后模板或簿记 → doclib sync/);
});

test("check：反哺过期检出与消除闭环（docs-hash 失配）", async () => {
  const root = await tmpRoot("doclib-acc-check-");
  await seedBase(root);
  const { libraryFingerprint } = await import("../core/guides.js");
  const fp0 = await libraryFingerprint(root);
  await put(root, ".doclib/guide-project.md", `---\nsnapshot: 1\ndocs-hash: ${fp0}\n---\n\n## 项目反哺\n`);
  let r = await runCheck(root, {});
  assert.doesNotMatch(r.text, /反哺过期/);
  await put(root, "doclib/30-features/a.md", docMd("A", ["src/a.ts"]) + "\n追加变更\n");
  r = await runCheck(root, {});
  assert.match(r.text, /反哺过期 \(1\)/);
  assert.match(r.text, /- \.doclib\/guide-project\.md  —  图书馆已变更，反哺区蒸馏过期/);
  const fp1 = await libraryFingerprint(root);
  await put(root, ".doclib/guide-project.md", `---\nsnapshot: 1\ndocs-hash: ${fp1}\n---\n\n## 项目反哺\n`);
  r = await runCheck(root, {});
  assert.doesNotMatch(r.text, /反哺过期/);
});

test("check：project 区直改报引导过期，sync 修复归零", async () => {
  const root = await tmpRoot("doclib-acc-check-");
  const { runInit } = await import("./init.js");
  await runInit(root, { agents: "claude", noHook: true });
  await put(root, "src/a.ts", "v1");
  await put(root, "doclib/30-features/a.md", docMd("A", ["src/a.ts"]));
  await runSnapshot(root, { note: "base" });
  await put(root, ".doclib/guide-project.md", "---\nsnapshot: 1\n---\n\n## 反哺正文\n");
  const { runSync } = await import("./sync.js");
  await runSync(root, {});
  const p = path.join(root, "CLAUDE.md");
  await fs.writeFile(p, (await fs.readFile(p, "utf8")).replace("## 反哺正文", "## 被直改"), "utf8");
  let r = await runCheck(root, {});
  assert.match(r.text, /引导过期 \(1\)/);
  await runSync(root, {});
  r = await runCheck(root, {});
  assert.doesNotMatch(r.text, /引导过期/);
});

test("check：记忆快照指针路径不存在 → memory-pointer soft notice，不进 findings", async () => {
  const root = await tmpRoot("doclib-acc-check-");
  await seedBase(root);
  await put(
    root,
    ".doclib/guide-memory.md",
    "---\nwork-as-of: 2026-10-27\nuser-as-of: 2026-10-27\n---\n\n## 近期工作记忆\n- 当前焦点 .plan/2099-01-01/ghost-plan.md 编造载体\n",
  );
  const r = await runCheck(root, {});
  assert.match(r.text, /记忆指针警告 1/);
  const j = r.json as { notices: Array<{ kind: string; path?: string }>; findings: Array<{ kind: string }> };
  const notice = j.notices.find((n) => n.kind === "memory-pointer");
  assert.ok(notice);
  assert.equal(notice.path, ".plan/2099-01-01/ghost-plan.md");
  assert.ok(j.findings.every((f) => f.kind !== "memory-pointer"));
});

test("check：记忆快照指针全部命中 → 无 memory-pointer notice", async () => {
  const root = await tmpRoot("doclib-acc-check-");
  await seedBase(root);
  await put(
    root,
    ".doclib/guide-memory.md",
    "---\nwork-as-of: 2026-10-27\n---\n\n## 近期工作记忆\n- 近期完成 doclib/30-features/a.md 已对账\n",
  );
  const r = await runCheck(root, {});
  const j = r.json as { notices: Array<{ kind: string }> };
  assert.ok(j.notices.every((n) => n.kind !== "memory-pointer"));
});

test("check：记忆快照反引号/星号/引号包裹路径 → 界定符不进 token（字符集根治回归）", async () => {
  const root = await tmpRoot("doclib-acc-check-");
  await seedBase(root);
  await put(
    root,
    ".doclib/guide-memory.md",
    "---\nwork-as-of: 2026-10-27\n---\n\n## 近期工作记忆\n- 焦点见 `doclib/30-features/a.md`、**doclib/30-features/a.md**、\"doclib/30-features/a.md\" 与 「doclib/30-features/a.md」 描述\n",
  );
  const r = await runCheck(root, {});
  const j = r.json as { notices: Array<{ kind: string; path?: string }> };
  assert.ok(j.notices.every((n) => n.kind !== "memory-pointer"));
});

test("check：记忆快照相对穿越 token → memory-pointer notice 且不 stat 根外路径（R-3 回归）", async () => {
  const root = await tmpRoot("doclib-acc-check-");
  await seedBase(root);
  await put(
    root,
    ".doclib/guide-memory.md",
    "---\nwork-as-of: 2026-10-27\n---\n\n## 近期工作记忆\n- 指针 doclib/../../etc/hosts 穿越\n",
  );
  const r = await runCheck(root, {});
  assert.match(r.text, /记忆指针警告 1/);
  const j = r.json as { notices: Array<{ kind: string; detail?: string }>; findings: Array<{ kind: string }> };
  const notice = j.notices.find((n) => n.kind === "memory-pointer");
  assert.ok(notice);
  assert.match(notice.detail ?? "", /相对穿越/);
  assert.ok(j.findings.every((f) => f.kind !== "memory-pointer"));
});

test("check：无记忆簿记 → 零 memory-pointer 输出（空状态合法）", async () => {
  const root = await tmpRoot("doclib-acc-check-");
  await seedBase(root);
  const r = await runCheck(root, {});
  const j = r.json as { notices: Array<{ kind: string }> };
  assert.ok(j.notices.every((n) => n.kind !== "memory-pointer"));
  assert.ok(!r.text.includes("记忆指针警告"));
});

test("check：记忆簿记含区域保留标记 → 执法面 fail-fast（DoclibError 传播）", async () => {
  const root = await tmpRoot("doclib-acc-check-");
  await seedBase(root);
  await put(root, ".doclib/guide-memory.md", "---\nwork-as-of: 2026-10-27\n---\n\n正文 <!-- doclib:memory-end --> 尾\n");
  await assert.rejects(
    () => runCheck(root, {}),
    (e: unknown) => e instanceof DoclibError && /区域保留标记/.test(e.message),
  );
});

test("check：走查账缺卷报违规，补齐归零；旧簿记缺席仅 soft notice", async () => {
  const root = await tmpRoot("doclib-acc-check-");
  await seedBase(root);
  const fed = "00-overview, 10-architecture, 20-modules, 30-features, 40-guides, 50-testing, 60-config, 70-deploy, 90-reference, 95-lessons";
  const full = `---\nsnapshot: 1\nvolumes-fed: [${fed}]\nvolumes-na: [80-design, 99-archive]\n---\n\n## 项目反哺\n`;
  await put(root, ".doclib/guide-project.md", full);
  let r = await runCheck(root, {});
  assert.doesNotMatch(r.text, /走查账违规/);
  await put(root, ".doclib/guide-project.md", full.replace("60-config, ", ""));
  r = await runCheck(root, {});
  assert.match(r.text, /走查账违规 \(1\)/);
  assert.match(r.text, /未覆盖全部 12 卷（缺：60-config）/);
  await put(root, ".doclib/guide-project.md", full);
  r = await runCheck(root, {});
  assert.doesNotMatch(r.text, /走查账违规/);
  await put(root, ".doclib/guide-project.md", "---\nsnapshot: 1\n---\n\n## 项目反哺\n");
  r = await runCheck(root, {});
  assert.doesNotMatch(r.text, /走查账违规/);
  const j = JSON.parse((await runCheck(root, { json: true })).text) as { notices: { kind: string }[] };
  assert.ok(j.notices.some((n) => n.kind === "guide-feed-walk-absent"));
});

test("check：孤儿文档检出/豁免路径（根级豁免/前缀豁免/covers 有主；豁免 ≠ 免无归属）", async () => {
  const root = await tmpRoot("doclib-acc-check-");
  await seedBase(root);
  await put(root, "notes/stray.md", "散落知识");
  await put(root, "docs/covered.md", "被馆内 covers 覆盖");
  await put(root, ".github/workflows-note.md", "前缀豁免");
  await put(root, "CHANGELOG.md", "根级豁免");
  await put(root, "doclib/30-features/docs.md", docMd("Docs", ["docs/"]));
  const r = await runCheck(root, {});
  assert.match(r.text, /孤儿文档 \(1\)/);
  assert.match(r.text, /- notes\/stray\.md  —  馆外知识文档 → doclib place collect\/archive 或 doclib ack/);
  assert.ok(!r.text.includes(".github/workflows-note.md  —"));
  assert.ok(!r.text.includes("CHANGELOG.md  —"));
  assert.ok(!r.text.includes("docs/covered.md  —"));
  assert.match(r.text, /无归属 [\s\S]*- \.github\/workflows-note\.md[\s\S]*- CHANGELOG\.md/);
});

test("check：自定义规划载体目录不判孤儿", async () => {
  const root = await tmpRoot("doclib-acc-check-");
  await seedBase(root);
  const state = await fs.readFile(path.join(root, ".doclib", "state.json"), "utf8");
  const parsed = JSON.parse(state) as { planning: string[] };
  parsed.planning = ["notes/"];
  await fs.writeFile(path.join(root, ".doclib", "state.json"), JSON.stringify(parsed), "utf8");
  await put(root, "notes/stray.md", "散落知识但属规划载体");
  await put(
    root,
    "doclib/00-overview/feature-map.md",
    "| # | 功能 | 描述 | 对应文档 | 状态 |\n| --- | --- | --- | --- | --- |\n| 1 | N | n | notes/stray.md | planned |\n",
  );
  await put(root, "doclib/00-overview/progress.md", "- 2026-10-26 规划 notes/stray.md 登记（锚点一）\n");
  const r = await runCheck(root, {});
  assert.match(r.text, /违规: 无/);
});

test("check：旧基线无文档账 → 降级提示且不报漏更", async () => {
  const root = await tmpRoot("doclib-acc-check-");
  await put(root, "src/a.ts", "v1");
  await put(root, "doclib/30-features/a.md", docMd("A", ["src/a.ts"]));
  await seedState(root, {
    version: 1,
    latest: "snap-001",
    snapshots: [snapshotRow(1, ["src/a.ts"], "2026-10-19T00:00:00.000Z")],
    revision: 1,
  });
  await put(root, "src/a.ts", "v2");
  const r = await runCheck(root, {});
  assert.match(r.text, /旧基线无文档账，漏更检测降级——重新 doclib snapshot 后生效/);
  assert.match(r.text, /违规: 无/);
});

test("check：--json 输出结构（baseline/hasDocLedger/accounted/findings/health/stats）", async () => {
  const root = await tmpRoot("doclib-acc-check-");
  await seedBase(root);
  await put(root, "src/a.ts", "v2");
  const r = await runCheck(root, { json: true });
  const j = JSON.parse(r.text) as {
    baseline: string;
    hasDocLedger: boolean;
    accounted: number;
    docFirst: string[];
    exempted: unknown[];
    findings: Array<{ kind: string }>;
    health: { score: number; grade: string };
    stats: { codeDrift: { modified: number }; docsChanged: string[] };
  };
  assert.equal(j.baseline, "snap-001");
  assert.equal(j.hasDocLedger, true);
  assert.equal(j.accounted, 0);
  assert.deepEqual(j.stats.codeDrift, { added: 0, modified: 1, removed: 0 });
  assert.equal(j.findings[0]!.kind, "unaccounted");
  assert.equal(j.health.grade, "C");
});

test("check：治理分组件展示（对账/迁移/归位/引导/质量百分比）", async () => {
  const root = await tmpRoot("doclib-acc-check-");
  await seedBase(root);
  await put(root, "doclib/30-features/z.md", "[断链](ghost.md)");
  const r = await runCheck(root, {});
  assert.match(r.text, /治理: \d+\/100 \([A-F]\) ｜ 对账 100% · 迁移 100% · 归位 100% · 引导 100% · 质量 90%/);
});

test("check：ack 豁免联动——standing 免除漏更", async () => {
  const root = await tmpRoot("doclib-acc-check-");
  await seedBase(root);
  await put(root, "src/a.ts", "v2");
  await withExit(async () => {
    let r = await runCheck(root, {});
    assert.match(r.text, /漏更 \(1\)/);
    const st = JSON.parse(await fs.readFile(path.join(root, ".doclib", "state.json"), "utf8")) as {
      acks: Array<{ path: string; note?: string; at?: string; kind: string; baseline?: string }>;
    };
    st.acks.push({ path: "src/a.ts", note: "生成物", at: "2026-10-19T00:00:00.000Z", kind: "standing" });
    await fs.writeFile(path.join(root, ".doclib", "state.json"), JSON.stringify(st), "utf8");
    r = await runCheck(root, {});
    assert.match(r.text, /违规: 无/);
    assert.match(r.text, /已豁免: 1/);
  });
});

test("check：guide-project 非法区域标记 → fail-fast（DoclibError）", async () => {
  const root = await tmpRoot("doclib-acc-check-");
  await seedBase(root);
  await put(root, ".doclib/guide-project.md", "---\nsnapshot: 1\n---\n\n坏 <!-- doclib:project-end --> 内容\n");
  await assert.rejects(() => runCheck(root, {}), (e: unknown) => e instanceof DoclibError && /区域保留标记/.test(e.message));
});

test("check：钩子烘焙链失配 → 测试链过期 notice；无钩子不判", async () => {
  const root = await tmpRoot("doclib-acc-check-chain-");
  await seedBase(root);
  await put(root, "doclib/50-testing/testing.md", "---\ntitle: 测试策略\ncovers: []\nstatus: draft\ntest-chain-fast: npm test\n---\n\n# 测试策略\n\n> 测试是行为规格的可执行形态：方案、矩阵、设置与回归回填在此定档，测试链声明驱动长程开发执法。\n\n## 为什么\n\n测试分层与覆盖目标的取舍理由（哪些层值得投入、为什么）：测试链 fast 档进提交门禁，full 档进 CI 与收尾验收。\n\n## 是什么\n\n- 策略与分层（单元/集成/E2E）：单元与集成覆盖命令契约，e2e 覆盖全生命周期。\n- 覆盖目标：正常路径、错误路径、边界与压力四级全锁定。\n\n## 怎么运转\n\n- 框架与运行方式：node:test + assert/strict 零依赖，测试与被测同目录。\n- 各层测试的运行命令与耗时预期：npm test 一键全量，typecheck 秒级。\n- fixture 与测试数据：临时目录 + 种子状态。\n- 测试环境前置依赖：无（零外部服务）。\n- bug 修复后的回归用例回填此处并链接 95-lessons 对应条目。\n\n## 怎么验收\n\n- 全绿标准：typecheck 与全量测试通过，新测试文件已登记 test script。\n");
  await put(root, ".git/hooks/pre-commit", "#!/bin/sh\n# doclib-hook\n# doclib-chain:000000000000\nnode x\n");
  await withExit(async () => {
    const r = await runCheck(root, {});
    assert.match(r.text, /测试链过期 1/);
    assert.match(r.text, /失配/);
    assert.notEqual(process.exitCode, 1);
  });
  await fs.rm(path.join(root, ".git"), { recursive: true, force: true });
  await withExit(async () => {
    const r = await runCheck(root, {});
    assert.ok(!r.text.includes("测试链过期"));
  });
});

test("check：清单状态失真 → strict 退出码 1", async () => {
  const root = await tmpRoot("doclib-acc-check-skel-");
  await seedBase(root);
  await put(
    root,
    "doclib/00-overview/feature-map.md",
    "| # | 功能 | 描述 | 对应文档 | 状态 |\n| --- | --- | --- | --- | --- |\n| 1 | F | d | doclib/30-features/a.md | implemented |\n",
  );
  await put(root, ".plan/d1/skel.md", "---\ntype: plan-skeleton\nfeature: 1\n---\n- [ ] 动作 → doclib/30-features/a.md#AC-1\n");
  await withExit(async () => {
    const r = await runCheck(root, { strict: true });
    assert.match(r.text, /清单状态失真 \(1\)/);
    assert.equal(process.exitCode, 1);
  });
});
