import fs from "node:fs/promises";
import path from "node:path";
import { collectFiles } from "./fsutil.js";
import { languageOf } from "./detect.js";
import { buildCoverIndex } from "./mapping.js";

export interface SurfaceReport {
  endpointSurface: number;
  pageSurface: number;
  rpcSurface: number;
  registeredApi: number;
  registeredRoute: number;
  apiDelta: number;
  routeDelta: number;
  notes: string[];
}

export type FlagSurfaceReport = {
  libFlags: number;
  srcFlags: number;
  inLibNotSrc: Array<{ flag: string; docs: string[] }>;
  inSrcNotLib: Array<{ flag: string; files: string[] }>;
  notes: string[];
};

const FLAG_TOKEN = /(?<![-\w])(--[a-z][a-z0-9-]*)/g;
const FLAG_LITERAL = /['"](--[a-z][a-z0-9-]*)['"]/g;
const COMMON_FLAGS = new Set(["--help", "--version"]);
const LIB_EXEMPT_PREFIX = "50-testing/benchmark/";

export async function reconcileFlagSurface(root: string, libRoot: string): Promise<FlagSurfaceReport> {
  const libFlags = new Map<string, Set<string>>();
  const mdFiles = (await collectFiles(libRoot).catch(() => [] as string[])).filter((f) => f.endsWith(".md"));
  for (const f of mdFiles) {
    if (f.startsWith(LIB_EXEMPT_PREFIX)) continue;
    const raw = await fs.readFile(path.join(libRoot, f), "utf8").catch(() => null);
    if (raw === null) continue;
    for (const m of raw.matchAll(FLAG_TOKEN)) {
      const flag = m[1]!;
      if (COMMON_FLAGS.has(flag)) continue;
      const set = libFlags.get(flag) ?? new Set<string>();
      set.add(f);
      libFlags.set(flag, set);
    }
  }

  const index = await buildCoverIndex(libRoot);
  const covered = new Set<string>();
  for (const e of index) for (const c of e.covers) covered.add(c);
  const allFiles = await collectFiles(root).catch(() => [] as string[]);
  const scanTargets = allFiles.filter((f) => {
    if (languageOf(f) === null) return false;
    if (/(^|\/)(tests?|__tests__)\/|\.(test|spec)\.[a-z]+$|_test\.[a-z]+$/.test(f)) return false;
    return covered.has(f) || [...covered].some((c) => f.startsWith(`${c}/`));
  });

  const srcFlags = new Map<string, Set<string>>();
  for (const f of scanTargets) {
    const raw = await fs.readFile(path.join(root, f), "utf8").catch(() => null);
    if (raw === null) continue;
    for (const m of raw.matchAll(FLAG_LITERAL)) {
      const flag = m[1]!;
      if (COMMON_FLAGS.has(flag)) continue;
      const set = srcFlags.get(flag) ?? new Set<string>();
      set.add(f);
      srcFlags.set(flag, set);
    }
  }

  const inLibNotSrc: Array<{ flag: string; docs: string[] }> = [];
  for (const [flag, docs] of libFlags) {
    if (!srcFlags.has(flag)) inLibNotSrc.push({ flag, docs: [...docs].sort() });
  }
  const inSrcNotLib: Array<{ flag: string; files: string[] }> = [];
  for (const [flag, files] of srcFlags) {
    if (!libFlags.has(flag)) inSrcNotLib.push({ flag, files: [...files].sort() });
  }

  const notes: string[] = [];
  if (inLibNotSrc.length > 0) {
    notes.push(
      `馆有源无 ${inLibNotSrc.length} 项——虚构/过时/被否候选（agent 裁决：登记状态机或修正）: ${inLibNotSrc
        .slice(0, 8)
        .map((x) => x.flag)
        .join(", ")}${inLibNotSrc.length > 8 ? " …" : ""}`,
    );
  }
  if (inSrcNotLib.length > 0) {
    notes.push(
      `源有馆无 ${inSrcNotLib.length} 项——遗漏候选（agent 裁决：补登记或标注非实体）: ${inSrcNotLib
        .slice(0, 8)
        .map((x) => x.flag)
        .join(", ")}${inSrcNotLib.length > 8 ? " …" : ""}`,
    );
  }
  if (libFlags.size === 0 && srcFlags.size === 0) {
    notes.push("双方均无旗标字面量（非 CLI repo 或未登记——确认登记簿分期）");
  }

  return {
    libFlags: libFlags.size,
    srcFlags: srcFlags.size,
    inLibNotSrc: inLibNotSrc.sort((a, b) => a.flag.localeCompare(b.flag)),
    inSrcNotLib: inSrcNotLib.sort((a, b) => a.flag.localeCompare(b.flag)),
    notes,
  };
}

function uniqueIds(text: string, prefix: string): Set<number> {
  const ids = new Set<number>();
  const single = new RegExp(`\\b${prefix}-(\\d+)\\b`, "g");
  for (const m of text.matchAll(single)) ids.add(Number(m[1]));
  const range = new RegExp(`\\b${prefix}-(\\d+)\\s*~\\s*${prefix}-(\\d+)\\b`, "g");
  for (const m of text.matchAll(range)) {
    const lo = Number(m[1]);
    const hi = Number(m[2]);
    if (hi >= lo && hi - lo < 10000) for (let i = lo; i <= hi; i++) ids.add(i);
  }
  return ids;
}

export async function surfaceScan(root: string, libRoot: string, codeFiles: string[]): Promise<SurfaceReport> {
  const endpointSurface = codeFiles.filter((f) => f.endsWith("route.ts")).length;
  const pageSurface = codeFiles.filter((f) => f.endsWith("page.tsx")).length;
  let rpcSurface = 0;
  for (const f of codeFiles.filter((f) => f.endsWith(".proto"))) {
    try {
      const text = await fs.readFile(path.join(root, f), "utf8");
      rpcSurface += [...text.matchAll(/\brpc\s+\w+\s*\(/g)].length;
    } catch {
      // 不可读文件跳过
    }
  }

  let libText = "";
  try {
    const mdFiles = (await collectFiles(libRoot)).filter((f) => f.endsWith(".md"));
    const chunks: string[] = [];
    for (const f of mdFiles) {
      chunks.push(await fs.readFile(path.join(libRoot, f), "utf8"));
    }
    libText = chunks.join("\n");
  } catch {
    libText = "";
  }
  const registeredApi = uniqueIds(libText, "API").size;
  const registeredRoute = uniqueIds(libText, "ROUTE").size;

  const apiSurface = endpointSurface + rpcSurface;
  const notes: string[] = [];
  if (apiSurface > 0 && registeredApi > 0 && registeredApi < apiSurface) {
    notes.push(`登记簿 API 条目 (${registeredApi}) 少于面枚举 (${apiSurface})——疑似漏登记（注记≠条目）`);
  }
  if (registeredApi > apiSurface && apiSurface > 0) {
    notes.push(`登记簿 API 条目 (${registeredApi}) 多于面枚举 (${apiSurface})——含幽灵条目或面未含该类端点（如 CLI/非 route 形态），请人工核对`);
  }
  if (pageSurface > 0 && registeredRoute > 0 && registeredRoute < pageSurface) {
    notes.push(`routes 册条目 (${registeredRoute}) 少于页面枚举 (${pageSurface})——页面面遗漏`);
  }

  return {
    endpointSurface,
    pageSurface,
    rpcSurface,
    registeredApi,
    registeredRoute,
    apiDelta: registeredApi - apiSurface,
    routeDelta: registeredRoute - pageSurface,
    notes,
  };
}
