import fs from "node:fs/promises";
import path from "node:path";
import { collectFiles } from "./fsutil.js";

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
