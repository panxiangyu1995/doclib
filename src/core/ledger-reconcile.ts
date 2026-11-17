import fs from "node:fs/promises";
import path from "node:path";
import { collectFiles } from "./fsutil.js";

const EXEMPT_PREFIXES = ["50-testing/benchmark/", "98-sessions/"];

const DECL_UNIT = /(\d+)\s*(?:个)?\s*(?:键|变体|对|条|命令|条目|语言|文件)/;
const UNIT_WORD = /键|变体|对|条|命令|条目|语言|文件/;
const PAREN_COUNT = /（(\d+)）/;
const EVENT_REF = /(?:listen|emit)\(\s*['"]([a-zA-Z][\w-]*)['"]/g;
const INLINE_PREFIX_MAX = 12;

export type ReconcileNotice = { doc: string; detail: string };

function sectionOf(text: string): Array<{ heading: string; body: string }> {
  const out: Array<{ heading: string; body: string[] }> = [];
  let current = { heading: "", body: [] as string[] };
  for (const line of text.split("\n")) {
    if (/^#{1,2}\s/.test(line)) {
      if (current.heading !== "" || current.body.length > 0) out.push(current);
      current = { heading: line, body: [] };
    } else {
      current.body.push(line);
    }
  }
  if (current.heading !== "" || current.body.length > 0) out.push(current);
  return out.map((s) => ({ heading: s.heading, body: s.body.join("\n") }));
}

function backtickListCount(line: string): number | null {
  const spans = [...line.matchAll(/`([^`]+)`/g)].map((m) => m[1]!);
  if (spans.length >= 4) {
    if (spans.every((s) => !s.includes("/"))) return spans.length;
    return null;
  }
  if (spans.length === 1 && spans[0]!.includes("/")) {
    const parts = spans[0]!
      .split(/\s*\/\s*/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0 && p !== "…" && p !== "...");
    if (/\.[A-Za-z0-9]{1,8}$/.test(parts[parts.length - 1]!)) return null;
    if (parts.length >= 4 && parts.every((p) => p.length <= 40)) return parts.length;
    return null;
  }
  return null;
}

function tableRowCount(body: string): number | null {
  const rows = body
    .split("\n")
    .filter((l) => /^\s*\|/.test(l))
    .filter((l) => !/^\s*\|[\s:|-]+\|\s*$/.test(l));
  if (rows.length < 3) return null;
  return rows.length - 1;
}

export async function ledgerReconcileNotices(libRoot: string): Promise<ReconcileNotice[]> {
  const mdFiles = (await collectFiles(libRoot).catch(() => [] as string[]))
    .filter((f) => f.endsWith(".md"))
    .filter((f) => !EXEMPT_PREFIXES.some((p) => f.startsWith(p)));
  const notices: ReconcileNotice[] = [];

  for (const f of mdFiles) {
    const raw = await fs.readFile(path.join(libRoot, f), "utf8").catch(() => null);
    if (raw === null) continue;

    for (const sec of sectionOf(raw)) {
      let declared: number | null = null;
      const dm = sec.heading.match(DECL_UNIT);
      if (dm !== null) declared = Number(dm[1]);
      else if (UNIT_WORD.test(sec.heading)) {
        const pm = sec.heading.match(PAREN_COUNT);
        if (pm !== null) declared = Number(pm[1]);
      }
      if (declared === null) continue;
      if (declared < 3 || declared > 100) continue;
      const listCount = backtickListCount(sec.body.split("\n").find((l) => backtickListCount(l) !== null) ?? "");
      const rows = tableRowCount(sec.body);
      if (listCount !== null && rows !== null) continue;
      const count = listCount ?? rows;
      if (count === null) continue;
      if (count !== declared) {
        notices.push({
          doc: f,
          detail: `节区「${sec.heading.replace(/^#+\s*/, "")}」声明 ${declared} 项，同节可数枚举为 ${count} 项（计数应为枚举派生值——以枚举为准修正计数，或核枚举是否漏项）`,
        });
      }
    }

    for (const line of raw.split("\n")) {
      if (/^#{1,6}\s/.test(line)) continue;
      const dm = line.match(DECL_UNIT);
      const pm = line.match(/（(\d+)）\s*[：:]/);
      const m = dm ?? pm;
      if (m === null) continue;
      const declared = Number(m[1]);
      if (declared < 3 || declared > 100) continue;
      const prefix = line.slice(0, m.index!).replace(/^[\s>*-]+/, "").replace(/\*\*/g, "").replace(/^共/, "");
      if (prefix.length > INLINE_PREFIX_MAX) continue;
      const count = backtickListCount(line);
      if (count === null || count === declared) continue;
      notices.push({
        doc: f,
        detail: `行内声明 ${declared} 项，同行反引号枚举为 ${count} 项（计数应为枚举派生值——以枚举为准修正计数，或核枚举是否漏项）`,
      });
    }
  }
  return notices;
}

export async function eventRegistrationNotices(libRoot: string): Promise<ReconcileNotice[]> {
  const mdFiles = (await collectFiles(libRoot).catch(() => [] as string[]))
    .filter((f) => f.endsWith(".md"))
    .filter((f) => !EXEMPT_PREFIXES.some((p) => f.startsWith(p)));

  const refs = new Map<string, Set<string>>();
  for (const f of mdFiles) {
    const raw = await fs.readFile(path.join(libRoot, f), "utf8").catch(() => null);
    if (raw === null) continue;
    for (const m of raw.matchAll(EVENT_REF)) {
      const set = refs.get(m[1]!) ?? new Set<string>();
      set.add(f);
      refs.set(m[1]!, set);
    }
  }
  if (refs.size === 0) return [];

  const overviewDir = path.join(libRoot, "00-overview");
  const overviewFiles = (await fs.readdir(overviewDir).catch(() => [] as string[])).filter((f) => f.endsWith(".md"));
  const overviewText = await Promise.all(overviewFiles.map((f) => fs.readFile(path.join(overviewDir, f), "utf8").catch(() => "")));
  const joined = overviewText.join("\n");

  const notices: ReconcileNotice[] = [];
  for (const [name, docs] of [...refs.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (joined.includes(name)) continue;
    notices.push({
      doc: [...docs].sort()[0]!,
      detail: `事件 "${name}" 被引用（${[...docs].sort().join(", ")}）但 00-overview 事件账未入账 → 补登记（标识/payload/发射方/状态）或显式标注切片外`,
    });
  }
  return notices;
}