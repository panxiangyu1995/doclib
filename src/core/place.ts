import fs from "node:fs/promises";
import path from "node:path";
import { coversOf, parseFrontmatter, renderFrontmatter } from "./frontmatter.js";
import { buildCoverIndex, docsForPath, normalizePath } from "./mapping.js";
import { DoclibError, LIBRARY_DIR, nextArchiveId, pad3, type ArchiveEntry, type State } from "./state.js";
import { POINTER_MARKER } from "./orphan.js";
import { detectCarrierShape } from "./planning.js";

export const LIBRARY_VOLUMES: readonly string[] = [
  "00-overview",
  "10-architecture",
  "20-modules",
  "30-features",
  "40-guides",
  "50-testing",
  "60-config",
  "70-deploy",
  "80-design",
  "90-reference",
  "95-lessons",
  "99-archive",
];

export type PlacementRule = { volume: string; patterns: RegExp[]; keywords: string[] };

export const PLACEMENT_RULES: readonly PlacementRule[] = [
  {
    volume: "30-features",
    patterns: [/feature/i, /功能/, /行为规格/],
    keywords: ["功能", "行为规格", "验收标准", "用例", "acceptance", "user story"],
  },
  {
    volume: "10-architecture",
    patterns: [/architecture/i, /架构/, /决策/, /adr/, /schema/i, /数据模型/],
    keywords: ["架构", "设计", "决策", "数据模型", "依赖选型", "adr"],
  },
  {
    volume: "20-modules",
    patterns: [/module/i, /模块/],
    keywords: ["模块", "组件", "职责边界", "接口边界"],
  },
  {
    volume: "40-guides",
    patterns: [/guide/i, /workflow/i, /convention/i, /roadmap/i, /规范/, /流程/],
    keywords: ["指南", "工作流", "规范", "约定", "路线图"],
  },
  {
    volume: "50-testing",
    patterns: [/test/i, /测试/, /qa/i, /矩阵/],
    keywords: ["测试", "验收", "矩阵", "fixture", "回归"],
  },
  {
    volume: "60-config",
    patterns: [/config/i, /配置/, /env/i, /lint/i, /build/i],
    keywords: ["配置", "环境变量", "构建", "lint", "工程设置"],
  },
  {
    volume: "70-deploy",
    patterns: [/deploy/i, /发布/, /release/i, /ci/i, /部署/, /运维/],
    keywords: ["部署", "发布", "回滚", "ci", "运维", "基础设施"],
  },
  {
    volume: "80-design",
    patterns: [/design/i, /\bui\b/i, /\bux\b/i, /界面/, /设计/],
    keywords: ["设计", "界面", "交互", "设计系统", "视觉"],
  },
  {
    volume: "90-reference",
    patterns: [/api/i, /endpoint/i, /route/i, /路由/, /协议/, /错误码/, /openapi/i],
    keywords: ["接口", "协议", "错误码", "参考", "字段契约"],
  },
  {
    volume: "95-lessons",
    patterns: [/lesson/i, /bug/i, /踩坑/, /经验/, /教训/],
    keywords: ["经验", "教训", "踩坑", "复盘", "根因"],
  },
  {
    volume: "00-overview",
    patterns: [/overview/i, /glossary/i, /术语/, /进度/, /feature-map/i],
    keywords: ["概览", "术语", "进度", "总览"],
  },
];

export type PlacementSuggestion = {
  volume: string;
  dir: string;
  reason: string;
  confidence: "high" | "medium" | "low";
  carrier?: boolean;
};

export type PlaceResult = {
  ok: boolean;
  action: string;
  from: string;
  to: string;
  detail: string;
  dryRun: boolean;
};

function slugify(name: string): string {
  const base = name.replace(/\.md$/i, "");
  const s = base
    .replace(/^[0-9]+[-_]?/, "")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.length > 0 ? s : "untitled";
}

function titleOf(data: Record<string, string | string[]>, fallback: string): string {
  const t = data.title;
  if (typeof t === "string" && t.trim().length > 0) return t.trim();
  return fallback;
}

async function exists(p: string): Promise<boolean> {
  return fs.access(p).then(() => true).catch(() => false);
}

async function nextDocName(volumeAbs: string, slug: string): Promise<string> {
  let max = 0;
  let entries: string[] = [];
  try {
    entries = await fs.readdir(volumeAbs);
  } catch {
    entries = [];
  }
  for (const f of entries) {
    const m = /^(\d{3})-/.exec(f);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${pad3(max + 1)}-${slug}.md`;
}

async function moveFile(fromAbs: string, toAbs: string): Promise<void> {
  await fs.mkdir(path.dirname(toAbs), { recursive: true });
  try {
    await fs.rename(fromAbs, toAbs);
  } catch {
    await fs.copyFile(fromAbs, toAbs);
    await fs.unlink(fromAbs);
  }
}

async function removeDirIfEmpty(dirAbs: string): Promise<void> {
  try {
    const entries = await fs.readdir(dirAbs);
    if (entries.length > 0) return;
    await fs.rmdir(dirAbs);
  } catch {
    return;
  }
}

type TableInfo = { header: string[]; headerIndex: number; endIndex: number };

function parseCells(line: string): string[] {
  const trimmed = line.trim();
  const inner = trimmed.startsWith("|") ? trimmed.slice(1) : trimmed;
  const body = inner.endsWith("|") ? inner.slice(0, -1) : inner;
  return body.split("|").map((c) => c.trim());
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((c) => /^-+$/.test(c));
}

function allTables(content: string): TableInfo[] {
  const lines = content.split(/\r?\n/);
  const tables: TableInfo[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (!line.trim().startsWith("|")) continue;
    const cells = parseCells(line);
    if (cells.length < 2 || isSeparatorRow(cells)) continue;
    const next = lines[i + 1];
    if (next === undefined || !next.trim().startsWith("|")) continue;
    if (!isSeparatorRow(parseCells(next))) continue;
    let end = i + 1;
    for (let j = i + 2; j < lines.length; j++) {
      if (!lines[j]!.trim().startsWith("|")) break;
      end = j;
    }
    tables.push({ header: cells, headerIndex: i, endIndex: end });
    i = end;
  }
  return tables;
}

function indexTable(content: string): TableInfo | null {
  const tables = allTables(content);
  if (tables.length === 0) return null;
  for (const t of tables) {
    const roles = t.header.map(columnRole);
    if (roles.includes("link") || roles.includes("title")) return t;
  }
  return tables[0]!;
}

function appendTableRow(content: string, row: string, table: TableInfo | null): string {
  const lines = content.split(/\r?\n/);
  if (table === null) return `${content.replace(/\s*$/, "")}\n\n${row}\n`;
  lines.splice(table.endIndex + 1, 0, row);
  return lines.join("\n");
}

function removeTableRows(content: string, matcher: (row: string) => boolean): string {
  const lines = content.split(/\r?\n/);
  return lines.filter((l) => !(l.trim().startsWith("|") && matcher(l))).join("\n");
}

type ColumnRole = "title" | "link" | "summary" | "covers" | "status" | "volume-entry" | "none";

function columnRole(header: string): ColumnRole {
  const h = header.trim();
  if (h.includes("规格文档") || h.includes("参考文档") || h === "文档" || h.includes("文件")) return "link";
  if (h.includes("摘要") || h.includes("内容") || h.includes("职责")) return "summary";
  if (h.toLowerCase().includes("covers")) return "covers";
  if (h.includes("状态")) return "status";
  if (h.includes("卷入口")) return "volume-entry";
  if (h.includes("功能") || h.includes("模块") || h.includes("名称")) return "title";
  return "none";
}

function buildVolumeRow(
  header: string[],
  linkPath: string,
  title: string,
  summary: string,
  covers: string[],
  status: string,
): string {
  const coverCell = covers.length > 0 ? covers.join(", ") : "—";
  const link = `[${linkPath.split("/").pop()}](${linkPath})`;
  const cells = header.map((h) => {
    switch (columnRole(h)) {
      case "title":
        return title;
      case "link":
        return link;
      case "summary":
        return summary;
      case "covers":
        return coverCell;
      case "status":
        return status;
      case "volume-entry":
        return "待成卷";
      default:
        return "—";
    }
  });
  return `| ${cells.join(" | ")} |`;
}

function volumeHeaderTemplate(volume: string): string {
  if (volume === "30-features") {
    return ["---", "title: 功能规格索引", "covers:", "  - src/commands/", "status: living", "---", "", `# ${volume} · 功能规格索引`, "", "| 功能 | 规格文档 | covers | 状态 |", "| --- | --- | --- | --- |", ""].join("\n");
  }
  if (volume === "20-modules") {
    return ["---", "title: 模块索引", "covers:", "  - src/", "status: living", "---", "", `# ${volume} · 模块索引`, "", "| 模块 | 职责一句话 | 卷入口 | covers |", "| --- | --- | --- | --- |", ""].join("\n");
  }
  return ["---", `title: ${volume} 索引`, "covers: []", "status: living", "---", "", `# ${volume} · 索引`, "", "| 文档 | 内容 |", "| --- | --- |", ""].join("\n");
}

export async function suggestPlacement(root: string, rel: string): Promise<PlacementSuggestion[]> {
  const p = normalizePath(rel);
  const carrier = detectCarrierShape(p);
  if (carrier !== null) {
    return [
      {
        volume: "",
        dir: "",
        reason: `规划载体形态（${carrier}）→ 建议声明为规划载体（init --planning）而非收编入馆`,
        confidence: "high",
        carrier: true,
      },
    ];
  }
  const fileName = path.posix.basename(p);
  const parent = p.includes("/") ? p.split("/")[0]! : "";
  let heading = "";
  try {
    const raw = await fs.readFile(path.join(root, p), "utf8");
    const m = /^#\s+(.+)$/m.exec(raw);
    if (m) heading = m[1]!.trim();
  } catch {
    heading = "";
  }
  const haystack = `${fileName} ${heading} ${parent}`;
  const scored: PlacementSuggestion[] = [];
  for (const rule of PLACEMENT_RULES) {
    let reason = "";
    let confidence: PlacementSuggestion["confidence"] = "low";
    if (rule.patterns.some((re) => re.test(fileName) || re.test(parent))) {
      reason = `文件名/目录名命中 ${rule.volume} 特征`;
      confidence = "high";
    } else if (rule.keywords.some((k) => haystack.includes(k))) {
      reason = `标题或关键词命中 ${rule.volume} 语义`;
      confidence = "medium";
    }
    if (confidence === "low") continue;
    const volumeAbs = path.join(root, LIBRARY_DIR, rule.volume);
    const dir = await nextDocName(volumeAbs, slugify(fileName));
    scored.push({ volume: rule.volume, dir, reason, confidence });
  }
  if (scored.length === 0) {
    const volumeAbs = path.join(root, LIBRARY_DIR, "30-features");
    const dir = await nextDocName(volumeAbs, slugify(fileName));
    scored.push({ volume: "30-features", dir, reason: "无明确特征命中，默认建议功能规格卷（需人工裁决）", confidence: "low" });
  }
  return scored.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 } as const;
    return order[a.confidence] - order[b.confidence];
  });
}

export const TOMBSTONE_BEGIN = "<!-- doclib:tombstone:begin -->";
export const TOMBSTONE_END = "<!-- doclib:tombstone:end -->";

export function buildTombstone(entry: ArchiveEntry, body: string, data: Record<string, string | string[]> = {}): string {
  const fmData: Record<string, string | string[]> = { ...data };
  fmData.title = fmData.title ?? `${path.posix.basename(entry.from)}（已归档）`;
  fmData.covers = fmData.covers ?? [entry.from];
  fmData.status = "archived";
  fmData["archived-from"] = entry.from;
  fmData["archived-at"] = entry.at;
  fmData["archive-reason"] = entry.reason;
  fmData["superseded-by"] = entry.kind === "archived" ? "无（未收编入馆，无取代者）" : entry.to;
  const tomb = [
    TOMBSTONE_BEGIN,
    `# ${path.posix.basename(entry.from)} · 墓碑`,
    "",
    "- 何时失效：" + entry.at,
    "- 为何失效：" + entry.reason,
    `- 取代者指针：${entry.kind === "archived" ? "无（未收编入馆，无取代者）" : entry.to}`,
    `- 原路径：${entry.from}`,
    `- 归档方式：doclib place archive（移动 + 墓碑 + 原路径指针；可 doclib place restore ${entry.id} 还原）`,
    TOMBSTONE_END,
  ].join("\n");
  return `${renderFrontmatter(fmData)}${tomb}\n${body}`;
}

export function stripTombstone(body: string): string {
  const i = body.indexOf(TOMBSTONE_BEGIN);
  const j = body.indexOf(TOMBSTONE_END);
  if (i === -1 || j === -1 || j < i) return body;
  const after = j + TOMBSTONE_END.length;
  const cut = body[after] === "\n" ? after + 1 : after;
  return `${body.slice(0, i)}${body.slice(cut)}`;
}

const ARCHIVE_KEYS = ["archived-from", "archived-at", "archive-reason", "superseded-by"];

function libraryRelative(docRel: string): string {
  const p = normalizePath(docRel);
  return p.startsWith(`${LIBRARY_DIR}/`) ? p.slice(LIBRARY_DIR.length + 1) : p;
}

export async function registerInIndexes(
  root: string,
  docRel: string,
  summary: string,
  status: string,
  title: string,
  docCovers: string[] = [],
): Promise<void> {
  const rel = libraryRelative(docRel);
  const idxPath = path.join(root, LIBRARY_DIR, "INDEX.md");
  let idx = await fs.readFile(idxPath, "utf8").catch(() => null);
  if (idx === null) {
    idx = ["---", "title: 总索引", "covers: []", "status: living", "---", "", "# 总索引", "", "| 文档 | 摘要 | 状态 |", "| --- | --- | --- |", ""].join("\n");
  }
  const link = `[${rel}](${rel})`;
  if (!idx.includes(link)) {
    idx = appendTableRow(idx, `| ${link} | ${summary} | ${status} |`, indexTable(idx));
    await fs.writeFile(idxPath, idx, "utf8");
  }
  const volume = rel.includes("/") ? rel.split("/")[0]! : "";
  const volRel = volume.length > 0 && rel.startsWith(`${volume}/`) ? rel.slice(volume.length + 1) : rel;
  const volAbs = path.join(root, LIBRARY_DIR, volume);
  const volIdxPath = path.join(volAbs, "_index.md");
  let volIdx = await fs.readFile(volIdxPath, "utf8").catch(() => null);
  if (volIdx === null) {
    volIdx = volumeHeaderTemplate(volume);
    await fs.writeFile(volIdxPath, volIdx, "utf8");
  }
  const table = indexTable(volIdx);
  const header = table?.header ?? ["文档", "内容"];
  const row = buildVolumeRow(header, volRel, title, summary, docCovers, status);
  if (!volIdx.includes(`](${volRel})`)) {
    volIdx = appendTableRow(volIdx, row, table);
    await fs.writeFile(volIdxPath, volIdx, "utf8");
  }
}

export async function unregisterFromIndexes(root: string, docRel: string): Promise<void> {
  const rel = libraryRelative(docRel);
  const idxPath = path.join(root, LIBRARY_DIR, "INDEX.md");
  const idx = await fs.readFile(idxPath, "utf8").catch(() => null);
  if (idx !== null) {
    const link = `[${rel}](${rel})`;
    const next = removeTableRows(idx, (row) => row.includes(link));
    if (next !== idx) await fs.writeFile(idxPath, next, "utf8");
  }
  const volume = rel.includes("/") ? rel.split("/")[0]! : "";
  const volRel = volume.length > 0 && rel.startsWith(`${volume}/`) ? rel.slice(volume.length + 1) : rel;
  const volIdxPath = path.join(root, LIBRARY_DIR, volume, "_index.md");
  const volIdx = await fs.readFile(volIdxPath, "utf8").catch(() => null);
  if (volIdx !== null) {
    const next = removeTableRows(volIdx, (row) => row.includes(`](${volRel})`));
    if (next !== volIdx) await fs.writeFile(volIdxPath, next, "utf8");
  }
}

function assertTargetDir(targetDir: string): string {
  const t = normalizePath(targetDir);
  const volume = t.split("/")[0] ?? "";
  if (!LIBRARY_VOLUMES.includes(volume)) {
    throw new DoclibError(`目标目录非法：${targetDir}（必须落在 12 卷基线内：${LIBRARY_VOLUMES.join(", ")}）`);
  }
  return t;
}

async function assertSource(root: string, rel: string): Promise<void> {
  const p = normalizePath(rel);
  if (!p.endsWith(".md")) throw new DoclibError(`只支持 .md 文档：${rel}`);
  if (p.startsWith(`${LIBRARY_DIR}/`)) throw new DoclibError(`${rel} 已在馆内，无需归位`);
  if (p.split("/").includes("..")) throw new DoclibError(`路径非法：${rel}`);
  if (!(await exists(path.join(root, p)))) throw new DoclibError(`文件不存在：${rel}`);
}

async function assertNotCovered(root: string, rel: string): Promise<string[]> {
  const index = await buildCoverIndex(path.join(root, LIBRARY_DIR));
  const docs = docsForPath(index, rel);
  if (docs.length > 0) {
    throw new DoclibError(`${rel} 已被馆内文档 covers 命中（${docs.join(", ")}）——移动会砸掉增量更新锚点，禁止归位`);
  }
  return docs;
}

export async function collectDoc(root: string, rel: string, targetDir: string): Promise<PlaceResult> {
  const p = normalizePath(rel);
  const target = assertTargetDir(targetDir);
  await assertSource(root, p);
  await assertNotCovered(root, p);
  const abs = path.join(root, p);
  const raw = await fs.readFile(abs, "utf8");
  const parsed = parseFrontmatter(raw);
  const targetAbs = path.join(root, LIBRARY_DIR, target);
  const docName = await nextDocName(targetAbs, slugify(path.posix.basename(p)));
  const finalRel = `${LIBRARY_DIR}/${target}/${docName}`;
  const data: Record<string, string | string[]> = { ...parsed.data };
  const existingCovers = coversOf(data);
  if (!existingCovers.includes(p)) existingCovers.push(p);
  data.covers = existingCovers;
  data.title = titleOf(data, path.posix.basename(p).replace(/\.md$/i, ""));
  if (data.status === undefined) data.status = "draft";
  return {
    ok: true,
    action: "collect",
    from: p,
    to: finalRel,
    detail: `收编入馆 → ${finalRel}｜covers 追加 ${p}｜status ${String(data.status)}｜需登记两级索引`,
    dryRun: false,
  };
}

export async function archiveDoc(root: string, rel: string, reason: string): Promise<PlaceResult> {
  const p = normalizePath(rel);
  await assertSource(root, p);
  await assertNotCovered(root, p);
  if (reason.trim().length === 0) throw new DoclibError("入棺必须给失效原因：doclib place archive <路径> --reason \"...\"");
  const abs = path.join(root, p);
  const raw = await fs.readFile(abs, "utf8");
  const parsed = parseFrontmatter(raw);
  const archiveAbs = path.join(root, LIBRARY_DIR, "99-archive");
  const docName = await nextDocName(archiveAbs, slugify(path.posix.basename(p)));
  const finalRel = `${LIBRARY_DIR}/99-archive/${docName}`;
  const entry: ArchiveEntry = {
    id: "arc-000",
    kind: "archived",
    from: p,
    to: finalRel,
    reason,
    at: new Date().toISOString(),
    pointer: p,
  };
  const pointer = `${POINTER_MARKER}\n\n> 本文档已归档至 [${finalRel}](../${finalRel})，原路径留此指针以防断链。\n`;
  return {
    ok: true,
    action: "archive",
    from: p,
    to: finalRel,
    detail: `入棺 → ${finalRel}｜墓碑五要素齐备｜原路径留指针｜归档账登记 ${entry.id}`,
    dryRun: false,
  };
}

async function occupiedByOthers(root: string, rel: string, entry: ArchiveEntry): Promise<boolean> {
  const abs = path.join(root, rel);
  if (!(await exists(abs))) return false;
  if (entry.kind !== "archived") return true;
  const content = await fs.readFile(abs, "utf8").catch(() => "");
  return !content.includes(POINTER_MARKER);
}

export async function restoreDoc(root: string, state: State, archiveId: string): Promise<PlaceResult> {
  const entry = state.archives.find((a) => a.id === archiveId);
  if (!entry) throw new DoclibError(`归档账中无此条目：${archiveId}`);
  const toAbs = path.join(root, entry.to);
  if (!(await exists(toAbs))) throw new DoclibError(`归档文件缺失，无法还原：${entry.to}`);
  const fromAbs = path.join(root, entry.from);
  if (await occupiedByOthers(root, entry.from, entry)) throw new DoclibError(`原路径已被占用，无法还原：${entry.from}`);
  return {
    ok: true,
    action: "restore",
    from: entry.to,
    to: entry.from,
    detail: `还原 → ${entry.from}｜删除指针文件｜撤销两级索引登记｜销归档账 ${entry.id}`,
    dryRun: false,
  };
}

export async function applyCollect(root: string, state: State, rel: string, targetDir: string): Promise<PlaceResult> {
  const plan = await collectDoc(root, rel, targetDir);
  const p = normalizePath(rel);
  const abs = path.join(root, p);
  const raw = await fs.readFile(abs, "utf8");
  const parsed = parseFrontmatter(raw);
  const data: Record<string, string | string[]> = { ...parsed.data };
  const existingCovers = coversOf(data);
  if (!existingCovers.includes(p)) existingCovers.push(p);
  data.covers = existingCovers;
  data.title = titleOf(data, path.posix.basename(p).replace(/\.md$/i, ""));
  if (data.status === undefined) data.status = "draft";
  const toAbs = path.join(root, plan.to);
  await moveFile(abs, toAbs);
  await fs.writeFile(toAbs, `${renderFrontmatter(data)}${parsed.body.replace(/^\n+/, "")}`, "utf8");
  await removeDirIfEmpty(path.dirname(abs));
  const title = String(data.title);
  await registerInIndexes(
    root,
    plan.to,
    `${title}（自馆外 ${p} 收编）`,
    String(data.status),
    title,
    existingCovers,
  );
  const entry: ArchiveEntry = {
    id: nextArchiveId(state),
    kind: "collected",
    from: p,
    to: plan.to,
    reason: `收编入馆（${targetDir}）`,
    at: new Date().toISOString(),
  };
  state.archives.push(entry);
  return { ...plan, detail: `${plan.detail}｜归档账 ${entry.id}` };
}

export async function applyArchive(root: string, state: State, rel: string, reason: string): Promise<PlaceResult> {
  const p = normalizePath(rel);
  const abs = path.join(root, p);
  const raw = await fs.readFile(abs, "utf8");
  const parsed = parseFrontmatter(raw);
  const archiveAbs = path.join(root, LIBRARY_DIR, "99-archive");
  const docName = await nextDocName(archiveAbs, slugify(path.posix.basename(p)));
  const finalRel = `${LIBRARY_DIR}/99-archive/${docName}`;
  const originStatus = typeof parsed.data.status === "string" ? parsed.data.status : undefined;
  const originCovers = parsed.data.covers === undefined ? undefined : coversOf(parsed.data);
  const entry: ArchiveEntry = {
    id: nextArchiveId(state),
    kind: "archived",
    from: p,
    to: finalRel,
    reason,
    at: new Date().toISOString(),
    pointer: p,
    originStatus,
    originCovers,
  };
  const toAbs = path.join(root, finalRel);
  await moveFile(abs, toAbs);
  await fs.writeFile(toAbs, buildTombstone(entry, parsed.body, parsed.data), "utf8");
  const pointer = `${POINTER_MARKER}\n\n> 本文档已归档至 [${finalRel}](../${finalRel})，原路径留此指针以防断链。\n`;
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, pointer, "utf8");
  const title = path.posix.basename(p).replace(/\.md$/i, "");
  await registerInIndexes(root, finalRel, `${title}（馆外文档入棺归档）`, "archived", title, [p]);
  state.archives.push(entry);
  return { ok: true, action: "archive", from: p, to: finalRel, detail: `入棺 → ${finalRel}｜墓碑五要素齐备｜原路径留指针｜归档账 ${entry.id}`, dryRun: false };
}

export async function applyRestore(root: string, state: State, archiveId: string): Promise<PlaceResult> {
  const idx = state.archives.findIndex((a) => a.id === archiveId);
  if (idx === -1) throw new DoclibError(`归档账中无此条目：${archiveId}`);
  const entry = state.archives[idx]!;
  const toAbs = path.join(root, entry.to);
  if (!(await exists(toAbs))) throw new DoclibError(`归档文件缺失，无法还原：${entry.to}`);
  const fromAbs = path.join(root, entry.from);
  if (await occupiedByOthers(root, entry.from, entry)) throw new DoclibError(`原路径已被占用，无法还原：${entry.from}`);
  const archivedRaw = await fs.readFile(toAbs, "utf8");
  const archivedParsed = parseFrontmatter(archivedRaw);
  const restoredData: Record<string, string | string[]> = { ...archivedParsed.data };
  for (const k of ARCHIVE_KEYS) delete restoredData[k];
  if (entry.originStatus === undefined) delete restoredData.status;
  else restoredData.status = entry.originStatus;
  if (entry.originCovers === undefined) delete restoredData.covers;
  else restoredData.covers = entry.originCovers;
  if (entry.kind === "archived") await fs.unlink(fromAbs).catch(() => undefined);
  await moveFile(toAbs, fromAbs);
  if (entry.kind === "archived") {
    await fs.writeFile(fromAbs, `${renderFrontmatter(restoredData)}${stripTombstone(archivedParsed.body)}`, "utf8");
  }
  await unregisterFromIndexes(root, entry.to);
  await removeDirIfEmpty(path.dirname(fromAbs));
  state.archives.splice(idx, 1);
  return {
    ok: true,
    action: "restore",
    from: entry.to,
    to: entry.from,
    detail: `还原 → ${entry.from}｜指针与索引已清理｜销归档账 ${entry.id}`,
    dryRun: false,
  };
}
