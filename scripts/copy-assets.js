import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function copy(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) await copy(s, d);
    else await fs.copyFile(s, d);
  }
}

await copy(path.join(root, "assets"), path.join(root, "dist", "assets"));
await copy(path.join(root, "skills"), path.join(root, "dist", "assets", "skills"));
console.log("assets copied: templates + guides + skills");
