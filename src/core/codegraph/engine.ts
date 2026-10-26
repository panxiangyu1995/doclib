import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { DoclibError } from "../state.js";

const MIN_NODE = [22, 5, 0] as const;
const MAX_NODE = [25, 0, 0] as const;
const VENDOR_ENTRY = "../../vendor/index.js";

export type VendorNode = {
  id: string;
  kind: string;
  name: string;
  qualifiedName?: string;
  filePath: string;
  startLine: number;
  endLine?: number;
  language?: string;
};

export type VendorEdge = {
  id: string;
  source: string;
  target: string;
  kind: string;
};

export type VendorGraphStats = {
  nodeCount: number;
  edgeCount: number;
  fileCount: number;
  nodesByKind?: Record<string, number>;
  edgesByKind?: Record<string, number>;
  filesByLanguage?: Record<string, number>;
};

export type VendorIndexResult = {
  success: boolean;
  filesIndexed: number;
  filesSkipped: number;
  filesErrored: number;
  nodesCreated: number;
  edgesCreated: number;
  durationMs: number;
  errors: { message: string; severity: string; code?: string }[];
};

export type VendorProgress = { phase: string; current: number; total: number };

export type VendorModuleAggregation = {
  links: Array<{ source: string; target: string; kind: string; count: number; declared: number; uncertain: number }>;
  pairs: Array<{ source: string; target: string; from: string; to: string; count: number; declared: number }>;
};

export interface VendorCodeGraph {
  indexAll(options?: { onProgress?: (p: VendorProgress) => void }): Promise<VendorIndexResult>;
  sync(options?: { onProgress?: (p: VendorProgress) => void }): Promise<VendorIndexResult>;
  searchNodes(query: string): Array<{ node: VendorNode; score?: number }>;
  getNodesByKind(kind: string): VendorNode[];
  getOutgoingEdgesFrom(nodeIds: readonly string[], kinds?: readonly string[]): VendorEdge[];
  getNodesByIds(ids: readonly string[]): Map<string, VendorNode>;
  getStats(): VendorGraphStats;
  getDetectedFrameworks(): string[];
  getUnreferencedNodes(kinds: readonly string[], limit: number): Array<{ node: VendorNode; generated: boolean }>;
  getFileDependencyPairs(minConfidence?: number): Array<{ source: string; target: string }>;
  getTopDependedOn(limit: number): Array<{ nodeId: string; dependents: number }>;
  getModuleAggregation(
    assignments: ReadonlyArray<{ filePath: string; module: string }>,
    options: { kinds: readonly string[]; minConfidence: number; topPairsPerLink: number; pairKinds: readonly string[] },
  ): VendorModuleAggregation;
  buildContext(input: string, options?: { format?: string; maxNodes?: number; includeCode?: boolean }): Promise<string | object>;
  getIndexState(): "indexing" | "complete" | "partial" | "failed" | null;
  getLastIndexedAt(): number | null;
  isIndexStale(): boolean;
  close(): void;
}

export interface VendorEngine {
  CodeGraph: {
    init(root: string, options?: { index?: boolean; onProgress?: (p: VendorProgress) => void }): Promise<VendorCodeGraph>;
    open(root: string, options?: { sync?: boolean; readOnly?: boolean }): Promise<VendorCodeGraph>;
    recreate(root: string): Promise<VendorCodeGraph>;
    isInitialized(root: string): boolean;
  };
}

let cachedEngine: VendorEngine | null = null;

function compareVersion(version: string, bound: readonly [number, number, number] | readonly number[]): number {
  const m = /^v?(\d+)\.(\d+)(?:\.(\d+))?/.exec(version.trim());
  if (!m) return NaN;
  const parts = [Number(m[1]), Number(m[2] ?? 0), Number(m[3] ?? 0)];
  for (let i = 0; i < 3; i++) {
    const p = parts[i]!;
    const b = bound[i]!;
    if (p !== b) return p > b ? 1 : -1;
  }
  return 0;
}

export function isNodeCompatible(version: string): boolean {
  const lower = compareVersion(version, MIN_NODE);
  if (Number.isNaN(lower)) return false;
  return lower >= 0 && compareVersion(version, MAX_NODE) < 0;
}

export function assertEngineAvailable(): void {
  if (!isNodeCompatible(process.versions.node)) {
    throw new DoclibError(
      `代码知识图谱需要 Node >= ${MIN_NODE.join(".")} 且 < ${MAX_NODE.join(".")}（当前 ${process.versions.node}）——graph 功能降级，doclib 核心流程不受影响`,
    );
  }
}

export function renderProgress(p: VendorProgress): void {
  process.stderr.write(`[graph] ${p.phase}: ${p.current}/${p.total}\n`);
}

export function loadVendorEngine(): VendorEngine {
  if (cachedEngine) return cachedEngine;
  assertEngineAvailable();
  try {
    const entry = path.join(path.dirname(fileURLToPath(import.meta.url)), VENDOR_ENTRY);
    const require = createRequire(import.meta.url);
    cachedEngine = require(entry) as VendorEngine;
    return cachedEngine;
  } catch (e) {
    throw new DoclibError(`知识图谱引擎加载失败（${e instanceof Error ? e.message : String(e)}）——请重新执行 npm run build`);
  }
}

export async function graphIndexPresent(root: string): Promise<boolean> {
  try {
    await fs.access(path.join(root, ".codegraph", "codegraph.db"));
    return true;
  } catch {
    return false;
  }
}
