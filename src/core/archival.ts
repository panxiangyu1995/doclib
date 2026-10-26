import fs from "node:fs/promises";
import path from "node:path";
import type { CheckFinding } from "./ledger.js";
import { carrierDocs, loadPlanningPaths } from "./planning.js";
import { featureRows } from "./featuremap.js";
import { DoclibError, LIBRARY_DIR, type State } from "./state.js";

const PROGRESS_RELPATH = `${LIBRARY_DIR}/00-overview/progress.md`;
const LESSONS_RELPATH = `${LIBRARY_DIR}/95-lessons/lessons.md`;
const LESSON_EPOCH_RE = /<!--\s*doclib:lesson-epoch:\s*(\d{4}-\d{2}-\d{2})\s*-->/;
const ENTRY_SPLIT_RE = /(?=-\s*\*\*\d{4}-\d{2}-\d{2}\*\*)/;
const ENTRY_DATE_RE = /\*\*(\d{4}-\d{2}-\d{2})\*\*/;
const LESSON_REF_RE = /^95-lessons(?:@(\S+))?\s+(\d{4}-\d{2}-\d{2})\s*·\s*(.+)$/;

async function progressRaw(root: string): Promise<string> {
  return fs.readFile(path.join(root, PROGRESS_RELPATH), "utf8").catch(() => "");
}

async function lessonRefResolves(root: string, repoDir: string | undefined, date: string, title: string): Promise<boolean> {
  const lessonsPath =
    repoDir === undefined
      ? path.join(root, LESSONS_RELPATH)
      : path.join(root, repoDir, LESSONS_RELPATH);
  const raw = await fs.readFile(lessonsPath, "utf8").catch(() => null);
  if (raw === null) return false;
  for (const m of raw.matchAll(/^## (\d{4}-\d{2}-\d{2}) · (.+)$/gm)) {
    if (m[1] === date && m[2]!.trim().startsWith(title)) return true;
  }
  return false;
}

function carrierRefsIn(docsCell: string, planningPrefixes: string[]): string[] {
  return docsCell
    .split(/[（(]/)[0]!
    .split("+")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s !== "—")
    .filter((s) => planningPrefixes.some((pp) => s === pp || s.startsWith(`${pp}/`)));
}

export async function archivalFindings(root: string, state: State): Promise<CheckFinding[]> {
  const findings: CheckFinding[] = [];
  const planningPaths = loadPlanningPaths(state);
  const planningPrefixes = planningPaths.map((p) => p.replace(/\/$/, ""));
  const rows = await featureRows(root);
  const acks = state.acks ?? [];

  const carrierFilesList = await carrierDocs(root, planningPaths);
  for (const doc of carrierFilesList) {
    const registered = rows.some((r) => r.docs.includes(doc.path));
    const acked = acks.some((a) => a.path === doc.path);
    if (registered || acked) continue;
    findings.push({
      kind: "carrier-unregistered",
      path: doc.path,
      detail: "载体规划文档未被 feature-map 登记 → 锚点一登记 planned，或 doclib ack <path> --standing（显式豁免）",
    });
  }

  const progress = await progressRaw(root);
  for (const r of rows) {
    for (const ref of carrierRefsIn(r.docs, planningPrefixes)) {
      if (progress.includes(ref)) continue;
      findings.push({
        kind: "ledger-gap",
        path: ref,
        detail: `feature-map #${r.n} 引用载体路径但 progress.md 无补记 → 补记时间线条目`,
      });
    }
  }

  for (const r of rows) {
    if (r.status !== "implemented") continue;
    const cell = r.docs.trim();
    if (cell === "" || cell === "—") {
      findings.push({
        kind: "anchor-missing",
        path: `#${r.n}`,
        detail: "implemented 条目无对应文档锚点 → 补规格/ADR/参考文档并修正对应文档列",
      });
    }
  }

  const epochMatch = LESSON_EPOCH_RE.exec(progress);
  if (progress.includes("doclib:lesson-epoch")) {
    if (epochMatch === null || Number.isNaN(Date.parse(epochMatch[1]!))) {
      throw new DoclibError("progress.md lesson-epoch 标记日期非法（需 <!-- doclib:lesson-epoch: YYYY-MM-DD -->）");
    }
  }
  if (epochMatch !== null) {
    const epoch = epochMatch[1]!;
    for (const seg of progress.split(ENTRY_SPLIT_RE)) {
      const dm = ENTRY_DATE_RE.exec(seg);
      if (dm === null || dm[1]! < epoch) continue;
      const date = dm[1]!;
      const tokens = [...seg.matchAll(/教训[:：]/g)];
      const last = tokens[tokens.length - 1];
      if (last === undefined) {
        findings.push({
          kind: "lesson-gap",
          path: date,
          detail: "进度条目缺「教训:」处置位 → 末字段补 `教训: 无（理由）` 或 `教训: 95-lessons <date> · <标题>`",
        });
        continue;
      }
      const value = seg.slice((last.index ?? 0) + last[0].length).trim();
      if (value === "") {
        findings.push({ kind: "lesson-gap", path: date, detail: "教训处置位为空 → 补 `无（理由）` 或引用" });
        continue;
      }
      if (value.startsWith("无")) continue;
      const refs = value
        .split(/；/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      for (const ref of refs) {
        const rm = LESSON_REF_RE.exec(ref);
        if (rm === null) {
          findings.push({
            kind: "lesson-gap",
            path: `${date} ${ref}`,
            detail: "教训处置位引用格式不可解析 → `95-lessons[@<dir>] <date> · <标题>`，多条以「；」分隔",
          });
          continue;
        }
        const ok = await lessonRefResolves(root, rm[1], rm[2]!, rm[3]!.trim());
        if (!ok) {
          findings.push({
            kind: "lesson-gap",
            path: ref,
            detail: `教训处置引用在${rm[1] === undefined ? "本馆" : ` ${rm[1]} 馆`} lessons.md 无命中（同日期+标题前缀）→ 核对引用或补录条目`,
          });
        }
      }
    }
  }

  return findings;
}
