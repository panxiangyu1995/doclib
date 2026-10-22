import assert from "node:assert/strict";
import { test } from "node:test";
import type { VendorCodeGraph } from "./engine.js";
import {
  collectDraftData,
  moduleOf,
  renderDependenciesDraft,
  renderModulesDraft,
  renderRoutesDraft,
  renderUnusedDraft,
  type DraftData,
} from "./draft.js";

function fixtureData(): DraftData {
  return {
    routes: [
      { name: "GET /users", routeFile: "src/routes/users.ts", routeLine: 10, handlerName: "listUsers", handlerFile: "src/handlers/users.ts", handlerLine: 20 },
      { name: "/legacy", routeFile: "src/routes/legacy.ts", routeLine: 5, handlerName: null, handlerFile: null, handlerLine: null },
    ],
    modules: {
      links: [{ source: "src", target: "lib", kind: "imports", count: 7, declared: 5, uncertain: 2 }],
      pairs: [{ source: "src/a.ts", target: "lib/b.ts", from: "f1", to: "f2", count: 3, declared: 2 }],
    },
    dependencies: {
      pairs: [{ source: "src/a.ts", target: "lib/b.ts" }],
      topDependedOn: [{ name: "helper", filePath: "lib/b.ts", dependents: 9 }],
    },
    unused: [{ id: "n1", kind: "function", name: "deadFn", filePath: "src/old.ts", startLine: 3 }],
  };
}

test("moduleOf: 顶层目录与根文件", () => {
  assert.equal(moduleOf("src/a/b.ts"), "src");
  assert.equal(moduleOf("main.ts"), "(root)");
});

test("renderRoutesDraft: 警示头/provenance/covers/TODO 齐", () => {
  const md = renderRoutesDraft(fixtureData(), "2026-10-22T00:00:00.000Z");
  assert.ok(md.includes("禁止直接入馆"));
  assert.ok(md.includes("provenance: codegraph-draft"));
  assert.ok(md.includes("- 标识: ROUTE-001"));
  assert.ok(md.includes("- covers: src/routes/users.ts:10 → src/handlers/users.ts:20"));
  assert.ok(md.includes("契约细节: TODO(agent)"));
  assert.ok(md.includes("时间线: TODO(agent)"));
  assert.ok(md.includes("- 标识: ROUTE-002"));
  assert.ok(md.includes("handler: 未解析（agent 核实）"));
  assert.ok(!md.includes("undefined"));
});

test("renderModulesDraft: 表格行与 TODO 叙述", () => {
  const md = renderModulesDraft(fixtureData(), "2026-10-22T00:00:00.000Z");
  assert.ok(md.includes("禁止直接入馆"));
  assert.ok(md.includes("| src | lib | imports | 7 | 5 | 2 |"));
  assert.ok(md.includes("模块职责叙述: TODO(agent)"));
});

test("renderDependenciesDraft: 依赖对与高被依赖符号", () => {
  const md = renderDependenciesDraft(fixtureData(), "2026-10-22T00:00:00.000Z");
  assert.ok(md.includes("| src/a.ts | lib/b.ts |"));
  assert.ok(md.includes("| helper | lib/b.ts | 9 |"));
  assert.ok(md.includes("分层设计意图: TODO(agent)"));
});

test("renderUnusedDraft: 线索性质与核实警示", () => {
  const md = renderUnusedDraft(fixtureData(), "2026-10-22T00:00:00.000Z");
  assert.ok(md.includes("仅线索非结论"));
  assert.ok(md.includes("UNUSED-001: `deadFn`（function）@ src/old.ts:3"));
  assert.ok(md.includes("裁决记录: TODO(agent)"));
});

test("collectDraftData: 从图实例采集四类数据（路由绑定/依赖/模块/未引用）", async () => {
  const cg = {
    getNodesByKind: (kind: string) =>
      kind === "route" ? [{ id: "r1", kind: "route", name: "GET /x", filePath: "src/r.ts", startLine: 1 }] : [],
    getOutgoingEdgesFrom: (ids: readonly string[]) => (ids.includes("r1") ? [{ id: "e1", source: "r1", target: "h1", kind: "references" }] : []),
    getNodesByIds: (ids: readonly string[]) => {
      const m = new Map();
      if (ids.includes("h1")) m.set("h1", { id: "h1", kind: "function", name: "handler", filePath: "src/h.ts", startLine: 2 });
      return m;
    },
    getFileDependencyPairs: () => [{ source: "src/a.ts", target: "src/b.ts" }],
    getTopDependedOn: () => [{ nodeId: "h1", dependents: 4 }],
    getModuleAggregation: () => ({ links: [], pairs: [] }),
    getUnreferencedNodes: () => [{ node: { id: "n1", kind: "function", name: "dead", filePath: "src/d.ts", startLine: 9 }, generated: false }, { node: { id: "n2", kind: "function", name: "synth", filePath: "src/s.ts", startLine: 1 }, generated: true }],
  } as unknown as VendorCodeGraph;
  const data = await collectDraftData(cg);
  assert.equal(data.routes.length, 1);
  assert.equal(data.routes[0]?.handlerName, "handler");
  assert.equal(data.modules.links.length, 0);
  assert.equal(data.dependencies.topDependedOn[0]?.name, "handler");
  assert.equal(data.unused.length, 1);
  assert.equal(data.unused[0]?.name, "dead");
});
