import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { featureRows } from "./featuremap.js";
import { parseFrontmatter } from "./frontmatter.js";
import type { CheckFinding } from "./ledger.js";
import { carrierDocs } from "./planning.js";
import { DoclibError } from "./state.js";

export type TestChain = { fast: string[]; full: string[] };

const NESTED_CHAIN_KEY = "test-chain";

function normalizeTier(value: string | string[] | undefined): string[] {
  const list = value === undefined ? [] : Array.isArray(value) ? value : [value];
  return list.map((s) => s.trim()).filter((s) => s.length > 0);
}

export function parseTestChain(data: Record<string, string | string[]>): TestChain | null {
  if (data[NESTED_CHAIN_KEY] !== undefined) {
    throw new DoclibError("test-chain 须用扁平键 test-chain-fast / test-chain-full（frontmatter 扁平解析约束，嵌套写法无法分档）");
  }
  const fastRaw = normalizeTier(data["test-chain-fast"]);
  const fullRaw = normalizeTier(data["test-chain-full"]);
  if (fastRaw.length === 0 && fullRaw.length === 0) return null;
  return { fast: fastRaw.length > 0 ? fastRaw : fullRaw, full: fullRaw.length > 0 ? fullRaw : fastRaw };
}

export async function loadTestChain(root: string): Promise<TestChain | null> {
  const raw = await fs
    .readFile(path.join(root, "doclib", "50-testing", "testing.md"), "utf8")
    .catch(() => null);
  if (raw === null) return null;
  return parseTestChain(parseFrontmatter(raw).data);
}

export const CHAIN_MARKER_PREFIX = "# doclib-chain:";

export function chainFingerprint(chain: TestChain): string {
  const hash = createHash("sha256");
  hash.update(chain.fast.join("\u0000"));
  hash.update("||");
  hash.update(chain.full.join("\u0000"));
  return hash.digest("hex").slice(0, 12);
}

export function chainMarker(chain: TestChain): string {
  return `${CHAIN_MARKER_PREFIX}${chainFingerprint(chain)}`;
}

export function extractChainMarker(script: string): string | null {
  return script.split(/\r?\n/).find((l) => l.startsWith(CHAIN_MARKER_PREFIX)) ?? null;
}

export function chainStaleDetail(script: string | null, chain: TestChain | null): string | null {
  if (script === null) return null;
  const marker = extractChainMarker(script);
  if (chain === null) {
    return marker === null ? null : "钩子烘焙的测试链在馆内已不存在 → 重跑 doclib hook install 清除";
  }
  if (marker === null) {
    return "馆内已声明 test-chain 但提交钩子未烘焙测试链 → 重跑 doclib hook install 启用链执法";
  }
  return marker === chainMarker(chain) ? null : "钩子烘焙的测试链与馆内 test-chain 失配 → 重跑 doclib hook install 刷新";
}

export function bakeChainLines(tier: readonly string[], label: string): string[] {
  const lines: string[] = [`echo "doclib hook: ${label}（${tier.length} 条）"`];
  for (const cmd of tier) lines.push(`${cmd} || exit 1`);
  return lines;
}

const UNCHECKED_BOX_RE = /^\s*[-*+]\s\[\s\]/;

export type HarnessScan = {
  findings: CheckFinding[];
  openNotices: Array<{ path: string; detail: string }>;
  blockedNotices: Array<{ path: string; detail: string }>;
};

export async function skeletonProgressFindings(root: string, planningPaths: string[]): Promise<HarnessScan> {
  const scan: HarnessScan = { findings: [], openNotices: [], blockedNotices: [] };
  const docs = await carrierDocs(root, planningPaths);
  if (docs.length === 0) return scan;
  const rows = await featureRows(root);
  for (const d of docs) {
    const raw = await fs.readFile(path.join(root, d.path), "utf8").catch(() => null);
    if (raw === null) continue;
    const { data, body } = parseFrontmatter(raw);
    if (data.type !== "plan-skeleton") continue;
    const blocked = typeof data.blocked === "string" ? data.blocked.trim() : "";
    if (blocked.length > 0) {
      scan.blockedNotices.push({
        path: d.path,
        detail: `blocked 标记未清：${blocked} → 解除后删除该标记（阻塞期间禁提交禁翻转）`,
      });
    }
    const featureNum = Number(data.feature);
    if (!Number.isInteger(featureNum) || featureNum <= 0) continue;
    const row = rows.find((r) => r.n === featureNum);
    if (row === undefined) continue;
    const unchecked = body
      .split(/\r?\n/)
      .filter((l) => UNCHECKED_BOX_RE.test(l) && !l.includes("TODO(agent)")).length;
    if (unchecked === 0) continue;
    if (row.status === "implemented") {
      scan.findings.push({
        kind: "skeleton-progress",
        path: d.path,
        detail: `#${featureNum} ${row.name} 状态为 implemented 但实施清单存在 ${unchecked} 条未勾选 → 完成并勾选，或按实况修正 feature-map 状态`,
      });
    } else if (row.status === "in-progress") {
      scan.openNotices.push({
        path: d.path,
        detail: `#${featureNum} ${row.name} 施工中：${unchecked} 条未勾选（收口前须全勾并通过测试链）`,
      });
    }
  }
  return scan;
}
