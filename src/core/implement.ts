import fs from "node:fs/promises";
import path from "node:path";
import type { CheckFinding } from "./ledger.js";
import { docExists, docRefs, featureRows, type FeatureRow } from "./featuremap.js";
import { parseFrontmatter } from "./frontmatter.js";
import { carrierDocs } from "./planning.js";
import { LIBRARY_DIR } from "./state.js";

export type PlanCandidate = { n: number; name: string; docs: string };

export async function listCandidates(root: string): Promise<PlanCandidate[]> {
  const rows = await featureRows(root);
  return rows.filter((r) => r.status === "planned");
}

export type Readiness = { ready: boolean; reasons: string[]; refs: string[]; row: FeatureRow | null };

export async function readinessVerdict(root: string, featureId: number): Promise<Readiness> {
  const rows = await featureRows(root);
  const row = rows.find((r) => r.n === featureId) ?? null;
  if (row === null) {
    return { ready: false, reasons: [`feature-map 中无 #${featureId} 条目`], refs: [], row: null };
  }
  const reasons: string[] = [];
  if (row.status !== "planned" && row.status !== "in-progress") {
    reasons.push(`状态为 ${row.status}（仅 planned/in-progress 可拆单）`);
  }
  const refs = docRefs(row.docs);
  if (refs.length === 0) {
    reasons.push("「对应文档」列为空 → 馆内依据不齐备（readiness）：先补规格/ADR 再拆单");
  } else {
    for (const ref of refs) {
      const p = ref.split("#")[0]!;
      const where = await docExists(root, p);
      if (where === "none") reasons.push(`对应文档不存在: ${ref}`);
    }
  }
  return { ready: reasons.length === 0, reasons, refs, row };
}

export function slugify(name: string, featureId: number): string {
  const slug = name
    .toLowerCase()
    .replace(/（[^）]*）|\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/, "");
  return slug.length > 0 ? slug : `feature-${featureId}`;
}

export type Skeleton = { fileName: string; content: string };

export function renderSkeleton(input: {
  featureId: number;
  name: string;
  refs: string[];
  generated: string;
}): Skeleton {
  const slug = slugify(input.name, input.featureId);
  const anchorList = input.refs.map((r) => `  - ${r}`).join("\n");
  const firstRef = input.refs[0] ?? "";
  const content = `---
type: plan-skeleton
feature: ${input.featureId}
generated: ${input.generated}
anchors:
${anchorList}
---

# 实施规划：#${input.featureId} ${input.name}

> 由 doclib implement 生成（readiness 已过）。frontmatter 是验收锚点执法面——填实后保留不动。

## 一、目的与效果

TODO(agent)

馆内依据：${input.refs.join(" + ")}

## 二、边界与非目标

TODO(agent)

## 三、方案设计

TODO(agent)（拍板后写成正式段落：决策 + 理由；备选与被否理由一并列明）

## 四、实施清单

每条格式 \`- [ ] 动作 → 规格路径#AC-x\`，必须引用馆内 AC 锚点（check「验收锚点缺失」执法）：

- [ ] TODO(agent) → ${firstRef}

## 五、收尾

- 逐条 AC 自检 → feature-map 推 implemented（对应文档列更新）→ progress.md 补记（末字段 \`教训:\` 处置位）
`;
  return { fileName: `${slug}.md`, content };
}

const AC_TOKEN_RE = /AC-\d+/;
const CHECKBOX_RE = /^\s*[-*+]\s\[[ xX]\]/;

export async function acceptanceAnchorFindings(
  root: string,
  planningPaths: string[],
): Promise<CheckFinding[]> {
  const findings: CheckFinding[] = [];
  const docs = await carrierDocs(root, planningPaths);
  for (const d of docs) {
    const raw = await fs.readFile(path.join(root, d.path), "utf8").catch(() => null);
    if (raw === null) continue;
    const { data, body } = parseFrontmatter(raw);
    if (data.type !== "plan-skeleton") continue;
    const rawAnchors = Array.isArray(data.anchors) ? data.anchors : typeof data.anchors === "string" ? [data.anchors] : [];
    const anchors = rawAnchors.filter((a): a is string => typeof a === "string");
    for (const a of anchors) {
      const hashIdx = a.indexOf("#");
      const p = hashIdx === -1 ? a : a.slice(0, hashIdx);
      const ac = hashIdx === -1 ? null : a.slice(hashIdx + 1);
      const where = await docExists(root, p);
      if (where === "none") {
        findings.push({
          kind: "acceptance-anchor",
          path: d.path,
          detail: `anchors 引用不存在: ${a} → 核对规格路径`,
        });
        continue;
      }
      if (ac !== null && ac !== "") {
        const specPath =
          where === "library"
            ? path.join(root, LIBRARY_DIR, p.replace(/^doclib\//, ""))
            : path.join(root, p);
        const spec = await fs.readFile(specPath, "utf8").catch(() => null);
        if (spec === null || !spec.includes(ac)) {
          findings.push({
            kind: "acceptance-anchor",
            path: d.path,
            detail: `anchors 引用的 AC 在馆内不存在: ${a}`,
          });
        }
      }
    }
    const lines = body.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (!CHECKBOX_RE.test(line)) continue;
      if (line.includes("TODO(agent)")) continue;
      if (AC_TOKEN_RE.test(line)) continue;
      findings.push({
        kind: "acceptance-anchor",
        path: d.path,
        detail: `L${i + 1} 实施清单条目缺 AC 引用 → 每条须指向 规格路径#AC-x（无对应 AC 先回规格补）`,
      });
    }
  }
  return findings;
}
