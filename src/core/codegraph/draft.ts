import type { VendorCodeGraph, VendorModuleAggregation, VendorNode } from "./engine.js";

export const DRAFT_WARNING = "<!-- doclib:graph-draft · provenance: codegraph-draft · 机器候选草稿，禁止直接入馆；agent 逐条裁决后回灌图书馆登记簿 -->";

export type RouteEntry = {
  name: string;
  routeFile: string;
  routeLine: number;
  handlerName: string | null;
  handlerFile: string | null;
  handlerLine: number | null;
};

export type DependencyData = {
  pairs: Array<{ source: string; target: string }>;
  topDependedOn: Array<{ name: string; filePath: string; dependents: number }>;
};

export type DraftData = {
  routes: RouteEntry[];
  modules: VendorModuleAggregation;
  dependencies: DependencyData;
  unused: VendorNode[];
};

export function moduleOf(filePath: string): string {
  const i = filePath.indexOf("/");
  return i === -1 ? "(root)" : filePath.slice(0, i);
}

export async function collectDraftData(cg: VendorCodeGraph): Promise<DraftData> {
  const routeNodes = cg.getNodesByKind("route");
  const routeIds = routeNodes.map((r) => r.id);
  const outEdges = routeIds.length > 0 ? cg.getOutgoingEdgesFrom(routeIds, ["references", "calls"]) : [];
  const handlerIds = [...new Set(outEdges.map((e) => e.target))];
  const handlerMap = handlerIds.length > 0 ? cg.getNodesByIds(handlerIds) : new Map<string, VendorNode>();
  const edgesBySource = new Map<string, string[]>();
  for (const e of outEdges) {
    const list = edgesBySource.get(e.source) ?? [];
    list.push(e.target);
    edgesBySource.set(e.source, list);
  }
  const routes: RouteEntry[] = routeNodes.map((r) => {
    const targetId = (edgesBySource.get(r.id) ?? [])[0];
    const handler = targetId ? handlerMap.get(targetId) : undefined;
    return {
      name: r.name,
      routeFile: r.filePath,
      routeLine: r.startLine,
      handlerName: handler?.name ?? null,
      handlerFile: handler?.filePath ?? null,
      handlerLine: handler?.startLine ?? null,
    };
  });

  const files = new Set<string>();
  for (const kind of ["imports", "calls", "references"]) {
    for (const pair of cg.getFileDependencyPairs(0.5)) {
      files.add(pair.source);
      files.add(pair.target);
    }
  }
  const assignments = [...files].map((f) => ({ filePath: f, module: moduleOf(f) }));
  const modules =
    assignments.length > 0
      ? cg.getModuleAggregation(assignments, {
          kinds: ["imports", "calls"],
          minConfidence: 0.5,
          topPairsPerLink: 3,
          pairKinds: ["imports", "calls"],
        })
      : { links: [], pairs: [] };

  const pairs = cg.getFileDependencyPairs(0.5);
  const top = cg.getTopDependedOn(20);
  const topNodes = top.length > 0 ? cg.getNodesByIds(top.map((t) => t.nodeId)) : new Map<string, VendorNode>();
  const dependencies: DependencyData = {
    pairs,
    topDependedOn: top
      .map((t) => {
        const n = topNodes.get(t.nodeId);
        return { name: n?.name ?? t.nodeId, filePath: n?.filePath ?? "", dependents: t.dependents };
      })
      .filter((t) => t.filePath !== ""),
  };

  const unused = cg
    .getUnreferencedNodes(["function", "method", "class", "variable", "constant"], 100)
    .filter((u) => !u.generated)
    .map((u) => u.node);

  return { routes, modules, dependencies, unused };
}

function entryBlock(identifier: string, title: string, covers: string, facts: string[]): string {
  return [
    `## ${identifier} · ${title}`,
    "",
    `- 标识: ${identifier}`,
    `- covers: ${covers}`,
    `- status: active`,
    `- provenance: codegraph-draft`,
    "",
    ...facts.map((f) => `- ${f}`),
    "",
    "契约细节: TODO(agent)",
    "时间线: TODO(agent)",
    "",
  ].join("\n");
}

export function renderRoutesDraft(data: DraftData, generatedAt: string): string {
  const lines = [
    DRAFT_WARNING,
    "",
    "# 路由登记簿候选草稿（routes → 80-design）",
    "",
    `> 生成: ${generatedAt} · 来源: doclib graph draft · 共 ${data.routes.length} 条 · 遵循 Q26（标识/covers/status 机器预填，契约/时间线 agent 补写）`,
    "",
  ];
  data.routes.forEach((r, i) => {
    const identifier = `ROUTE-${String(i + 1).padStart(3, "0")}`;
    const covers = r.handlerFile ? `${r.routeFile}:${r.routeLine} → ${r.handlerFile}:${r.handlerLine}` : `${r.routeFile}:${r.routeLine}`;
    const facts = [
      `路由: ${r.name}`,
      `注册位置: ${r.routeFile}:${r.routeLine}`,
      r.handlerName ? `handler: ${r.handlerName}${r.handlerFile ? `（${r.handlerFile}:${r.handlerLine}）` : ""}` : "handler: 未解析（agent 核实）",
    ];
    lines.push(entryBlock(identifier, r.name, covers, facts));
  });
  return lines.join("\n");
}

export function renderModulesDraft(data: DraftData, generatedAt: string): string {
  const links = data.modules.links
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 60);
  const lines = [
    DRAFT_WARNING,
    "",
    "# 模块结构候选草稿（modules → 20-modules）",
    "",
    `> 生成: ${generatedAt} · 来源: doclib graph draft · 模块=顶层目录 · 链接 ${data.modules.links.length} 条（渲染 top ${links.length}）`,
    "",
    "| 源模块 | 目标模块 | 边类型 | 计数 | 声明性 | 存疑 |",
    "| --- | --- | --- | --- | --- | --- |",
  ];
  for (const l of links) {
    lines.push(`| ${l.source} | ${l.target} | ${l.kind} | ${l.count} | ${l.declared} | ${l.uncertain} |`);
  }
  lines.push("", "模块职责叙述: TODO(agent)", "");
  return lines.join("\n");
}

export function renderDependenciesDraft(data: DraftData, generatedAt: string): string {
  const pairs = data.dependencies.pairs.slice(0, 120);
  const lines = [
    DRAFT_WARNING,
    "",
    "# 依赖图候选草稿（dependencies → 10-architecture）",
    "",
    `> 生成: ${generatedAt} · 来源: doclib graph draft · 依赖对 ${data.dependencies.pairs.length} 条（渲染 top ${pairs.length}）· 置信阈值 0.5`,
    "",
    "| 源文件 | 目标文件 |",
    "| --- | --- |",
  ];
  for (const p of pairs) {
    lines.push(`| ${p.source} | ${p.target} |`);
  }
  lines.push("", "## 高被依赖符号（fan-in top 20）", "", "| 符号 | 位置 | 被依赖数 |", "| --- | --- | --- |");
  for (const t of data.dependencies.topDependedOn) {
    lines.push(`| ${t.name} | ${t.filePath} | ${t.dependents} |`);
  }
  lines.push("", "分层设计意图: TODO(agent)", "");
  return lines.join("\n");
}

export function renderUnusedDraft(data: DraftData, generatedAt: string): string {
  const lines = [
    DRAFT_WARNING,
    "",
    "# 疑似死代码候选草稿（unused → 登记簿状态机 unused 候选）",
    "",
    `> 生成: ${generatedAt} · 来源: doclib graph draft · 候选 ${data.unused.length} 条 · 仅线索非结论：导出/动态调用/反射不计入引用，agent 必须逐条核实`,
    "",
  ];
  data.unused.forEach((n, i) => {
    const identifier = `UNUSED-${String(i + 1).padStart(3, "0")}`;
    lines.push(`- ${identifier}: \`${n.name}\`（${n.kind}）@ ${n.filePath}:${n.startLine}`);
  });
  lines.push("", "裁决记录: TODO(agent)", "");
  return lines.join("\n");
}
