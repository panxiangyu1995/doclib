import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function assetsRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "assets");
}

export async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) await copyDir(s, d);
    else if (entry.isFile()) await fs.copyFile(s, d);
  }
}

export async function renderTemplate(rel: string, vars: Record<string, string>): Promise<string> {
  let content = await fs.readFile(path.join(assetsRoot(), rel), "utf8");
  for (const [key, value] of Object.entries(vars)) {
    content = content.replaceAll(`%${key}%`, value);
  }
  return content;
}
