import fs from "node:fs/promises";
import path from "node:path";
import { DoclibError } from "../core/state.js";
import {
  assertEngineAvailable,
  graphIndexPresent,
  loadVendorEngine,
  type VendorCodeGraph,
  type VendorIndexResult,
} from "../core/codegraph/engine.js";
import { collectDraftData, renderDependenciesDraft, renderModulesDraft, renderRoutesDraft, renderUnusedDraft } from "../core/codegraph/draft.js";
import type { CommandResult } from "./init.js";

const DRAFT_FILES = ["routes.md", "modules.md", "dependencies.md", "unused.md"] as const;

export type GraphStatsPayload = {
  initialized: boolean;
  state: string | null;
  files: number;
  nodes: number;
  edges: number;
  routes: number;
  languages: Record<string, number>;
  frameworks: string[];
  lastIndexedAt: string | null;
  stale: boolean;
};

function renderProgress(p: { phase: string; current: number; total: number }): void {
  process.stderr.write(`[graph] ${p.phase}: ${p.current}/${p.total}\n`);
}

async function collectStats(cg: VendorCodeGraph): Promise<GraphStatsPayload> {
  const stats = cg.getStats();
  const state = cg.getIndexState();
  const lastIndexedAt = cg.getLastIndexedAt();
  return {
    initialized: true,
    state,
    files: stats.fileCount,
    nodes: stats.nodeCount,
    edges: stats.edgeCount,
    routes: cg.getNodesByKind("route").length,
    languages: stats.filesByLanguage ?? {},
    frameworks: cg.getDetectedFrameworks(),
    lastIndexedAt: lastIndexedAt ? new Date(lastIndexedAt).toISOString() : null,
    stale: cg.isIndexStale(),
  };
}

function statsLines(payload: GraphStatsPayload): string[] {
  return [
    `索引状态: ${payload.state ?? "未知"}${payload.stale ? "（检测到代码变更，下次查询将自动增量同步）" : ""}`,
    `文件: ${payload.files} · 符号: ${payload.nodes} · 边: ${payload.edges} · 路由: ${payload.routes}`,
    `语言: ${Object.entries(payload.languages).map(([k, v]) => `${k}=${v}`).join(", ") || "无"}`,
    `框架: ${payload.frameworks.join(", ") || "未检出"}`,
    `最后索引: ${payload.lastIndexedAt ?? "无记录"}`,
  ];
}

export async function runGraph(
  root: string,
  action: string,
  opts: { json?: boolean; force?: boolean; query?: string } = {},
): Promise<CommandResult> {
  assertEngineAvailable();
  if (!["index", "status", "draft", "explore"].includes(action)) {
    throw new DoclibError("用法: doclib graph <index|status|draft|explore> [query]");
  }
  const engine = loadVendorEngine();
  if (action === "index") {
    const present = await graphIndexPresent(root);
    if (present && !opts.force) {
      let cg: VendorCodeGraph | null = null;
      try {
        cg = await engine.CodeGraph.open(root, { sync: true });
      } catch (e) {
        throw new DoclibError(`知识图谱增量同步失败（${e instanceof Error ? e.message : String(e)}）——可加 --force 重建索引`);
      }
      try {
        const payload = await collectStats(cg);
        const lines = [`知识图谱: 已同步（复用现有索引）`, ...statsLines(payload)];
        return { text: `${lines.join("\n")}\n`, json: payload };
      } finally {
        cg.close();
      }
    }
    let cg: VendorCodeGraph | null = null;
    let result: VendorIndexResult | null = null;
    try {
      cg = present ? await engine.CodeGraph.recreate(root) : await engine.CodeGraph.init(root, {});
      result = await cg.indexAll({ onProgress: renderProgress });
    } catch (e) {
      throw new DoclibError(`知识图谱索引失败（${e instanceof Error ? e.message : String(e)}）——可加 --force 重试`);
    }
    try {
      const payload = await collectStats(cg);
      const warnings = result.errors.filter((e) => e.severity === "warning");
      const lines = [
        `知识图谱: ${result.success ? "索引完成" : "索引未完成"}${payload.state === "partial" ? "（部分索引，建议重跑 doclib graph index --force）" : ""}`,
        ...statsLines(payload),
        `耗时: ${(result.durationMs / 1000).toFixed(1)}s`,
      ];
      if (warnings.length > 0) lines.push(`警告: ${warnings.length} 条（首条: ${warnings[0]?.message}）`);
      return { text: `${lines.join("\n")}\n`, json: { ...payload, durationMs: result.durationMs, warnings: warnings.length } };
    } finally {
      cg.close();
    }
  }
  if (action === "status") {
    if (!(await graphIndexPresent(root))) {
      const payload: GraphStatsPayload = {
        initialized: false,
        state: null,
        files: 0,
        nodes: 0,
        edges: 0,
        routes: 0,
        languages: {},
        frameworks: [],
        lastIndexedAt: null,
        stale: false,
      };
      return {
        text: `知识图谱: 未初始化（运行 doclib graph index 建图）\n`,
        json: payload,
      };
    }
    let cg: VendorCodeGraph | null = null;
    try {
      cg = await engine.CodeGraph.open(root, { readOnly: true });
    } catch (e) {
      throw new DoclibError(`知识图谱索引不可读（${e instanceof Error ? e.message : String(e)}）——可加 --force 于 index 重建`);
    }
    try {
      const payload = await collectStats(cg);
      if (opts.json) return { text: `${JSON.stringify(payload, null, 2)}\n`, json: payload };
      const lines = [`知识图谱: 已初始化`, ...statsLines(payload)];
      return { text: `${lines.join("\n")}\n`, json: payload };
    } finally {
      cg.close();
    }
  }
  if (action === "draft") {
    if (!(await graphIndexPresent(root))) {
      throw new DoclibError("知识图谱未初始化——先运行 doclib graph index");
    }
    const draftsDir = path.join(root, ".doclib", "drafts");
    if (!opts.force) {
      const existing: string[] = [];
      for (const f of DRAFT_FILES) {
        if (await fs.access(path.join(draftsDir, f)).then(() => true).catch(() => false)) existing.push(f);
      }
      if (existing.length > 0) {
        throw new DoclibError(`草稿已存在（${existing.join(", ")}）——覆盖请加 --force（已有草稿可能含 agent 裁决进度）`);
      }
    }
    let cg: VendorCodeGraph | null = null;
    try {
      cg = await engine.CodeGraph.open(root, { sync: true });
    } catch (e) {
      throw new DoclibError(`知识图谱不可用（${e instanceof Error ? e.message : String(e)}）——可加 --force 于 index 重建`);
    }
    try {
      const data = await collectDraftData(cg);
      const generatedAt = new Date().toISOString();
      const rendered: Record<(typeof DRAFT_FILES)[number], string> = {
        "routes.md": renderRoutesDraft(data, generatedAt),
        "modules.md": renderModulesDraft(data, generatedAt),
        "dependencies.md": renderDependenciesDraft(data, generatedAt),
        "unused.md": renderUnusedDraft(data, generatedAt),
      };
      await fs.mkdir(draftsDir, { recursive: true });
      for (const f of DRAFT_FILES) {
        await fs.writeFile(path.join(draftsDir, f), rendered[f], "utf8");
      }
      const payload = {
        draftsDir: ".doclib/drafts/",
        routes: data.routes.length,
        moduleLinks: data.modules.links.length,
        dependencyPairs: data.dependencies.pairs.length,
        unusedCandidates: data.unused.length,
      };
      const lines = [
        `草稿已写入 .doclib/drafts/（机器候选，agent 逐条裁决后回灌图书馆；禁止直接入馆）`,
        `routes.md: ${payload.routes} 条路由候选`,
        `modules.md: ${payload.moduleLinks} 条模块链接候选`,
        `dependencies.md: ${payload.dependencyPairs} 条依赖对候选`,
        `unused.md: ${payload.unusedCandidates} 条疑似死代码候选（仅线索非结论）`,
      ];
      return { text: `${lines.join("\n")}\n`, json: payload };
    } finally {
      cg.close();
    }
  }
  if (action === "explore") {
    if (!(await graphIndexPresent(root))) {
      throw new DoclibError("知识图谱未初始化——先运行 doclib graph index");
    }
    if (!opts.query || opts.query.trim() === "") {
      throw new DoclibError("用法: doclib graph explore <query>（符号名/文件名/流程问题）");
    }
    let cg: VendorCodeGraph | null = null;
    try {
      cg = await engine.CodeGraph.open(root, { sync: true });
    } catch (e) {
      throw new DoclibError(`知识图谱不可用（${e instanceof Error ? e.message : String(e)}）`);
    }
    try {
      const context = await cg.buildContext(opts.query.trim(), { format: "markdown" });
      const text = typeof context === "string" ? context : JSON.stringify(context, null, 2);
      return { text: `${text}\n`, json: context };
    } finally {
      cg.close();
    }
  }
  throw new DoclibError(`用法: doclib graph <index|status|draft|explore> [query]`);
}
