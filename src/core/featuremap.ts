import fs from "node:fs/promises";
import path from "node:path";
import { LIBRARY_DIR } from "./state.js";

export type FeatureRow = { n: number; name: string; status: string; docs: string };

export function docRefs(cell: string): string[] {
  return cell
    .split(/[（(]/)[0]!
    .split("+")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s !== "—" && !s.startsWith("skills/"));
}

async function existsAt(p: string): Promise<boolean> {
  return fs
    .access(p)
    .then(() => true)
    .catch(() => false);
}

export async function docExists(root: string, ref: string): Promise<"library" | "repo" | "none"> {
  if (await existsAt(path.join(root, LIBRARY_DIR, ref.replace(/^doclib\//, "")))) return "library";
  if (await existsAt(path.join(root, ref))) return "repo";
  return "none";
}

export async function featureRows(root: string): Promise<FeatureRow[]> {
  const raw = await fs.readFile(path.join(root, "doclib", "00-overview", "feature-map.md"), "utf8").catch(() => "");
  const rows: FeatureRow[] = [];
  for (const line of raw.split(/\r?\n/)) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    if (!/^\d+$/.test(cells[1] ?? "")) continue;
    rows.push({
      n: Number(cells[1]),
      name: cells[2] ?? "?",
      status: cells[5] ?? "?",
      docs: cells[4] ?? "",
    });
  }
  return rows;
}
