import test from "node:test";
import assert from "node:assert/strict";
import { runSync } from "./sync.js";
import { runInit } from "./init.js";
import { DoclibError, loadState } from "../core/state.js";
import { renderGuide, MANAGED_BEGIN, MANAGED_END, CUSTOM_BEGIN, CUSTOM_END, PROJECT_BEGIN, PROJECT_END } from "../core/guides.js";
import { get, put, tmpRoot } from "./testkit.js";

function regionOf(content: string, begin: string, end: string): string {
  const i = content.indexOf(begin);
  const j = content.indexOf(end);
  assert.ok(i !== -1 && j !== -1 && j > i);
  return content.slice(i + begin.length, j);
}

test("sync：无已安装 agent 且未指定 → DoclibError", async () => {
  const root = await tmpRoot("doclib-acc-sync-");
  await assert.rejects(
    () => runSync(root, {}),
    (e: unknown) => e instanceof DoclibError && /尚无已安装的 agent：先 doclib init --agents <列表>，或本次用 --agents 指定/.test(e.message),
  );
});

test("sync：按 state.agents 安装 skills+引导并回写 state；幂等（init 已写 → 二次均无变化）", async () => {
  const root = await tmpRoot("doclib-acc-sync-");
  await runInit(root, { agents: "claude,opencode" });
  const r1 = await runSync(root, {});
  assert.match(r1.text, /skills: \.claude\/skills, \.opencode\/skills/);
  assert.match(r1.text, /引导: 写入 无｜无变化 CLAUDE\.md, AGENTS\.md/);
  const r2 = await runSync(root, {});
  assert.match(r2.text, /无变化 CLAUDE\.md, AGENTS\.md/);
  assert.ok(!r2.text.includes("旧版引导已整体再生"));
  const state = await loadState(root);
  assert.deepEqual(state.agents, ["claude", "opencode"]);
});

test("sync：定制区保留、managed 区再生为模板内容（篡改后写入）", async () => {
  const root = await tmpRoot("doclib-acc-sync-");
  await runInit(root, { agents: "claude" });
  const p = "CLAUDE.md";
  const original = await get(root, p);
  const customized = original
    .replace(
      new RegExp(`${CUSTOM_BEGIN}[\\s\\S]*?${CUSTOM_END}`),
      `${CUSTOM_BEGIN}\n## 我的项目专属规则\n- 永远先跑测试\n${CUSTOM_END}`,
    )
    .replace(/<!-- doclib:managed-begin -->[\s\S]*?<!-- doclib:managed-end -->/, `${MANAGED_BEGIN}\n手工乱改\n${MANAGED_END}`);
  await put(root, p, customized);
  const r = await runSync(root, {});
  assert.match(r.text, /引导: 写入 CLAUDE\.md/);
  const after = await get(root, p);
  assert.match(after, /我的项目专属规则/);
  assert.match(after, /永远先跑测试/);
  const tpl = await renderGuide("light");
  assert.equal(regionOf(after, MANAGED_BEGIN, MANAGED_END), regionOf(tpl, MANAGED_BEGIN, MANAGED_END));
});

test("sync：仅改定制区 → managed 与模板一致时判定无变化（内容不被扰动）", async () => {
  const root = await tmpRoot("doclib-acc-sync-");
  await runInit(root, { agents: "claude" });
  const original = await get(root, "CLAUDE.md");
  await put(
    root,
    "CLAUDE.md",
    original.replace(
      new RegExp(`${CUSTOM_BEGIN}[\\s\\S]*?${CUSTOM_END}`),
      `${CUSTOM_BEGIN}\n纯定制新增\n${CUSTOM_END}`,
    ),
  );
  const r = await runSync(root, {});
  assert.match(r.text, /无变化 CLAUDE\.md/);
  assert.match(await get(root, "CLAUDE.md"), /纯定制新增/);
});

test("sync：managed 区被篡改 → 再生修复", async () => {
  const root = await tmpRoot("doclib-acc-sync-");
  await runInit(root, { agents: "claude" });
  const p = "CLAUDE.md";
  const original = await get(root, p);
  await put(root, p, original.replace(/<!-- doclib:managed-begin -->[\s\S]*?<!-- doclib:managed-end -->/, `${MANAGED_BEGIN}\n手工乱改的内容\n${MANAGED_END}`));
  const r = await runSync(root, {});
  assert.match(r.text, /写入 CLAUDE\.md/);
  const after = await get(root, p);
  const tpl = await renderGuide("light");
  assert.equal(regionOf(after, MANAGED_BEGIN, MANAGED_END), regionOf(tpl, MANAGED_BEGIN, MANAGED_END));
});

test("sync：旧版文件（无定制区标记）整体再生并提示 legacy", async () => {
  const root = await tmpRoot("doclib-acc-sync-");
  await runInit(root, { agents: "claude" });
  const p = "CLAUDE.md";
  const original = await get(root, p);
  const legacy = original.replace(new RegExp(`${CUSTOM_BEGIN}[\\s\\S]*?${CUSTOM_END}`), "定制内容已丢失标记");
  await put(root, p, legacy);
  const r = await runSync(root, {});
  assert.match(r.text, /旧版引导已整体再生: CLAUDE\.md（原文件无区域标记，如有手工补充请检查 git diff）/);
  assert.equal(await get(root, p), await renderGuide("light"));
});

test("sync：无戳文件跳过不动", async () => {
  const root = await tmpRoot("doclib-acc-sync-");
  await runInit(root, { agents: "claude" });
  await put(root, "CLAUDE.md", "# 纯手工引导（无戳）");
  const r = await runSync(root, {});
  assert.match(r.text, /跳过无戳文件: CLAUDE\.md（非 doclib 管理，合并交由 agent）/);
  assert.equal(await get(root, "CLAUDE.md"), "# 纯手工引导（无戳）");
});

test("sync：--agents 覆盖 state 并适配 cursor（无 skills 目录）", async () => {
  const root = await tmpRoot("doclib-acc-sync-");
  await runInit(root, { agents: "claude" });
  const r = await runSync(root, { agents: "cursor" });
  assert.match(r.text, /skills: 无（目标无 skills 目录）/);
  assert.match(r.text, /引导: 写入 AGENTS\.md/);
  assert.ok(await get(root, "AGENTS.md").then((c) => c.includes("doclib-guide cli=")));
  const state = await loadState(root);
  assert.deepEqual(state.agents, ["cursor"]);
});

test("sync：--agents 空串回退 state.agents（与 init 的空串语义不同，行为锁定）", async () => {
  const root = await tmpRoot("doclib-acc-sync-");
  await runInit(root, { agents: "claude" });
  await runSync(root, { agents: "" });
  const state = await loadState(root);
  assert.deepEqual(state.agents, ["claude"]);
});

test("sync：修复 check 的引导过期（跨命令闭环）", async () => {
  const root = await tmpRoot("doclib-acc-sync-");
  await runInit(root, { agents: "claude" });
  await put(root, "src/a.ts", "v1");
  await put(root, "doclib/30-features/a.md", "---\ntitle: A\ncovers:\n  - src/a.ts\nstatus: stable\n---\nA\n");
  const { runSnapshot } = await import("./snapshot.js");
  const { runCheck } = await import("./check.js");
  await runSnapshot(root, {});
  const tampered = (await get(root, "CLAUDE.md")).replace(/<!-- doclib:managed-begin -->[\s\S]*?<!-- doclib:managed-end -->/, `${MANAGED_BEGIN}\n乱改\n${MANAGED_END}`);
  await put(root, "CLAUDE.md", tampered);
  let checkText = (await runCheck(root, {})).text;
  assert.match(checkText, /引导过期 \(1\)/);
  await runSync(root, {});
  checkText = (await runCheck(root, {})).text;
  assert.doesNotMatch(checkText, /引导过期/);
});

test("sync：guide-project 注入两份引导 project 区且一致；直改被修复；幂等", async () => {
  const root = await tmpRoot("doclib-acc-sync-");
  await runInit(root, { agents: "claude,opencode" });
  await put(root, ".doclib/guide-project.md", "---\nsnapshot: 1\ndocs-hash: ff00\n---\n\n## 项目定位\n- 冒烟项目\n");
  const r1 = await runSync(root, {});
  assert.match(r1.text, /引导: 写入 CLAUDE\.md, AGENTS\.md/);
  const region = (c: string): string => c.slice(c.indexOf(PROJECT_BEGIN), c.indexOf(PROJECT_END));
  const a = await get(root, "CLAUDE.md");
  const b = await get(root, "AGENTS.md");
  assert.ok(region(a).includes("冒烟项目"));
  assert.equal(region(a), region(b));
  const r2 = await runSync(root, {});
  assert.match(r2.text, /无变化 CLAUDE\.md, AGENTS\.md/);
  await put(root, "CLAUDE.md", (await get(root, "CLAUDE.md")).replace("冒烟项目", "直改内容"));
  const r3 = await runSync(root, {});
  assert.match(r3.text, /引导: 写入 CLAUDE\.md/);
  assert.match(await get(root, "CLAUDE.md"), /冒烟项目/);
  assert.ok(!(await get(root, "CLAUDE.md")).includes("直改内容"));
});

test("sync：guide-project 变更 → 引导文件随之更新", async () => {
  const root = await tmpRoot("doclib-acc-sync-");
  await runInit(root, { agents: "claude" });
  await put(root, ".doclib/guide-project.md", "---\nsnapshot: 1\n---\n\n## v1 反哺\n");
  await runSync(root, {});
  assert.match(await get(root, "CLAUDE.md"), /v1 反哺/);
  await put(root, ".doclib/guide-project.md", "---\nsnapshot: 2\n---\n\n## v2 反哺\n");
  const r = await runSync(root, {});
  assert.match(r.text, /引导: 写入 CLAUDE\.md/);
  assert.match(await get(root, "CLAUDE.md"), /v2 反哺/);
  assert.ok(!(await get(root, "CLAUDE.md")).includes("v1 反哺"));
});
